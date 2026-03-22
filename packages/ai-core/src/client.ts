import OpenAI from "openai";
import type { GeneratedContentBatchItem, ViralContentGoal } from "@liberation-os/types";

interface LLMClientConfig {
  openai: OpenAI;
  model: string;
}

// ---------------------------------------------------------------------------
// Usage / pricing helpers
// ---------------------------------------------------------------------------

export interface LLMUsage {
  tokensIn: number;
  tokensOut: number;
  model: string;
  costUsd: number;
}

/**
 * Approximate cost per 1M tokens (USD).
 * Update when pricing changes.
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4.1":       { input: 2.00,  output:  8.00  },
  "gpt-4.1-mini":  { input: 0.40,  output:  1.60  },
  "gpt-4o":        { input: 2.50,  output: 10.00  },
  "gpt-4o-mini":   { input: 0.15,  output:  0.60  },
  "gpt-3.5-turbo": { input: 0.50,  output:  1.50  },
};

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing =
    MODEL_PRICING[model] ??
    MODEL_PRICING["gpt-4.1-mini"] ??
    { input: 0.40, output: 1.60 };
  return (tokensIn / 1_000_000) * pricing.input +
         (tokensOut / 1_000_000) * pricing.output;
}

// ---------------------------------------------------------------------------
// Tool-calling types
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the function parameters */
  parameters: Record<string, unknown>;
}

export interface ToolCallRecord {
  tool: string;
  args: unknown;
  result: unknown;
}

export interface ToolCallResult {
  /** Final natural-language response from the LLM */
  finalResponse: string;
  toolCalls: ToolCallRecord[];
  usage: LLMUsage;
}

// ---------------------------------------------------------------------------
// Fallbacks (no API key)
// ---------------------------------------------------------------------------

const fallbackGoal = (prompt: string): ViralContentGoal => {
  const input = prompt.match(/"([\s\S]*?)"/)?.[1] ?? "Untitled goal";
  const quantityMatch = input.match(/(\d+)/);
  const quantity = Number(quantityMatch?.[1] ?? "10");
  const platforms = ["tiktok"];
  const niche = input
    .replace(/post|create|generate|viral|for|me/gi, " ")
    .replace(/\d+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ") || "general";

  return { goalType: "viral_content_batch", niche, platforms, quantity };
};

const fallbackBatch = (prompt: string): GeneratedContentBatchItem[] => {
  const quantityMatch = prompt.match(/Generate\s+(\d+)/i);
  const quantity = Number(quantityMatch?.[1] ?? "5");
  const nicheMatch = prompt.match(/for\s+(.+?)\./i);
  const niche = nicheMatch?.[1]?.trim() ?? "general creators";

  return Array.from({ length: quantity }, (_, index) => ({
    hook: `Idea ${index + 1}: ${niche} viewers stop scrolling when they hear this.`,
    script: `Open with a bold claim about ${niche}, deliver one practical insight, and end with a challenge to comment their result.`,
    caption: `${niche} growth play ${index + 1}. Save this for your next post.`,
  }));
};

function buildFallbackResponse<T>(prompt: string): T {
  if (prompt.includes("structured JSON")) {
    return fallbackGoal(prompt) as T;
  }

  if (prompt.includes("viral content ideas")) {
    return fallbackBatch(prompt) as T;
  }

  throw new Error("OPENAI_API_KEY is missing and no fallback response matches this prompt");
}

function resolveLLMConfig(): LLMClientConfig | null {
  const baseURL = process.env.OPENAI_BASE_URL ?? process.env.LLM_BASE_URL;
  const apiKey =
    process.env.OPENAI_API_KEY ??
    process.env.LOCAL_LLM_API_KEY ??
    (baseURL ? "local-llm" : undefined);

  if (!apiKey) {
    return null;
  }

  const model =
    process.env.OPENAI_MODEL ??
    process.env.LOCAL_LLM_MODEL ??
    (baseURL ? "llama3.1:8b" : "gpt-4.1-mini");

  return {
    openai: new OpenAI({ apiKey, baseURL }),
    model,
  };
}

// ---------------------------------------------------------------------------
// Core: generateJSON
// ---------------------------------------------------------------------------

export async function generateJSON<T>(prompt: string): Promise<T> {
  const llm = resolveLLMConfig();

  if (!llm) {
    return buildFallbackResponse<T>(prompt);
  }

  const response = await llm.openai.chat.completions.create({
    model: llm.model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const text = response.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON from AI");
  }
}

// ---------------------------------------------------------------------------
// Core: generateJSON with usage metadata
// ---------------------------------------------------------------------------

export interface LLMCallResult<T> {
  result: T;
  text: string;
  usage: LLMUsage;
}

export async function generateJSONWithUsage<T>(
  prompt: string,
): Promise<LLMCallResult<T>> {
  const llm = resolveLLMConfig();

  if (!llm) {
    const result = buildFallbackResponse<T>(prompt);
    return {
      result,
      text: JSON.stringify(result),
      usage: { tokensIn: 0, tokensOut: 0, model: "offline", costUsd: 0 },
    };
  }

  const response = await llm.openai.chat.completions.create({
    model: llm.model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  const tokensIn = response.usage?.prompt_tokens ?? 0;
  const tokensOut = response.usage?.completion_tokens ?? 0;

  try {
    return {
      result: JSON.parse(text) as T,
      text,
      usage: {
        tokensIn,
        tokensOut,
        model: response.model,
        costUsd: estimateCost(response.model, tokensIn, tokensOut),
      },
    };
  } catch {
    throw new Error("Invalid JSON from AI");
  }
}

// ---------------------------------------------------------------------------
// Tool-calling agentic loop
// ---------------------------------------------------------------------------

/**
 * Run an LLM-in-the-loop agentic loop with function / tool calling.
 *
 * The loop continues until the model stops emitting tool_calls
 * or the iteration cap (10) is hit.
 *
 * When no API key is set, calls the *first* tool with empty args and returns.
 */
export async function callWithTools(
  systemPrompt: string,
  userMessage: string,
  tools: ToolDefinition[],
  toolHandler: (name: string, args: unknown) => Promise<unknown>,
): Promise<ToolCallResult> {
  const llm = resolveLLMConfig();

  if (!llm) {
    const firstTool = tools[0];
    if (!firstTool) {
      return {
        finalResponse: "No API key — tool-calling is offline.",
        toolCalls: [],
        usage: { tokensIn: 0, tokensOut: 0, model: "offline", costUsd: 0 },
      };
    }
    const result = await toolHandler(firstTool.name, {}).catch((e: unknown) => ({
      error: e instanceof Error ? e.message : "Tool error",
    }));
    return {
      finalResponse: `[offline] Called ${firstTool.name} automatically.`,
      toolCalls: [{ tool: firstTool.name, args: {}, result }],
      usage: { tokensIn: 0, tokensOut: 0, model: "offline", costUsd: 0 },
    };
  }

  const openai = llm.openai;
  const model = llm.model;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const toolSchema: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters as OpenAI.FunctionParameters,
    },
  }));

  const toolCallHistory: ToolCallRecord[] = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let resolvedModel = model;
  let finalResponse = "";

  for (let i = 0; i < 10; i++) {
    const response = await openai.chat.completions.create({
      model,
      messages,
      tools: toolSchema,
      tool_choice: "auto",
    });

    totalTokensIn += response.usage?.prompt_tokens ?? 0;
    totalTokensOut += response.usage?.completion_tokens ?? 0;
    resolvedModel = response.model;

    const choice = response.choices[0];
    if (!choice) break;

    // TypeScript requires we only push serializable message shapes
    const assistantMsg = choice.message;
    messages.push(assistantMsg);

    if (choice.finish_reason === "stop" || !assistantMsg.tool_calls?.length) {
      finalResponse = assistantMsg.content ?? "";
      break;
    }

    // Execute each tool call and feed results back
    for (const tc of assistantMsg.tool_calls) {
      // Only handle standard function tool calls
      if (tc.type !== "function") continue;
      const fn = (tc as { type: "function"; id: string; function: { name: string; arguments: string } }).function;

      let args: unknown = {};
      try {
        args = JSON.parse(fn.arguments);
      } catch { /* keep empty object */ }

      let result: unknown;
      try {
        result = await toolHandler(fn.name, args);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : "Tool execution failed" };
      }

      toolCallHistory.push({ tool: fn.name, args, result });

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }
  }

  return {
    finalResponse,
    toolCalls: toolCallHistory,
    usage: {
      tokensIn: totalTokensIn,
      tokensOut: totalTokensOut,
      model: resolvedModel,
      costUsd: estimateCost(resolvedModel, totalTokensIn, totalTokensOut),
    },
  };
}
