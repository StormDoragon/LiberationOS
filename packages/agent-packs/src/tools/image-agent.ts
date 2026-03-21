/**
 * Image Generator Agent — tool-calling agent that generates images
 * using Flux (fal.ai) or Ideogram APIs.
 *
 * The LLM:
 *  1. Reads the content to understand what image to create
 *  2. Drafts an optimised image prompt
 *  3. Calls `generate_flux_image` or `generate_ideogram_image` depending on
 *     which API key is available (prefers Ideogram, falls back to Flux)
 *
 * Environment variables:
 *   FAL_API_KEY      — enables Flux generation via fal.run
 *   IDEOGRAM_API_KEY — enables Ideogram V2 generation
 *
 * When neither key is set, the agent returns a deterministic placeholder URL
 * so the workflow still succeeds.
 */
import { callWithTools } from "@liberation-os/ai-core";
import type { Agent } from "@liberation-os/workflow-engine";
import type { AgentContext, WorkflowArtifacts } from "@liberation-os/types";

export interface ImageGenInput {
  /** Full text body of the content — used to craft the image prompt. */
  contentBody: string;
  /** Optional title for additional context. */
  contentTitle?: string;
  /**
   * Visual style hint, e.g. "photorealistic", "flat illustration", "cinematic".
   * When omitted the LLM picks the most appropriate style.
   */
  style?: string;
  /**
   * Force a specific provider: "flux" | "ideogram".
   * When omitted the agent selects based on available API keys.
   */
  provider?: "flux" | "ideogram";
}

export interface ImageGenOutput {
  imageUrl: string;
  provider: "flux" | "ideogram" | "placeholder";
  generatedPrompt: string;
  reasoning: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function generateViaFlux(prompt: string): Promise<string> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new Error("FAL_API_KEY not set");

  const response = await fetch("https://fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "square_hd",
      num_inference_steps: 28,
      guidance_scale: 3.5,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Flux API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    images?: Array<{ url: string }>;
    image?: { url: string };
    url?: string;
  };

  const url = data.images?.[0]?.url ?? data.image?.url ?? data.url;
  if (!url) throw new Error("Flux returned no image URL");
  return url;
}

async function generateViaIdeogram(prompt: string, style?: string): Promise<string> {
  const apiKey = process.env.IDEOGRAM_API_KEY;
  if (!apiKey) throw new Error("IDEOGRAM_API_KEY not set");

  const styleMap: Record<string, string> = {
    photorealistic: "REALISTIC",
    realistic: "REALISTIC",
    illustration: "ILLUSTRATION",
    anime: "ANIME",
    general: "GENERAL",
  };

  const ideogramStyle = style
    ? (styleMap[style.toLowerCase()] ?? "GENERAL")
    : "GENERAL";

  const response = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_request: {
        prompt,
        model: "V_2",
        aspect_ratio: "ASPECT_1_1",
        style_type: ideogramStyle,
        magic_prompt_option: "AUTO",
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ideogram API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ url: string }>;
  };

  const url = data.data?.[0]?.url;
  if (!url) throw new Error("Ideogram returned no image URL");
  return url;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an image-generation agent for LiberationOS.

Your job:
1. Analyse the given content and craft an optimised image generation prompt (vivid, specific, no banned terms).
2. Check which image generation tools are available using check_available_providers.
3. Call the appropriate tool (generate_flux_image or generate_ideogram_image) with your crafted prompt.
4. Explain why you chose the style and prompt approach.

Prompt crafting rules:
- Be specific about subject, setting, lighting, mood, and style.
- Avoid vague terms like "beautiful" or "amazing".
- Keep prompts under 300 characters for best results.
- For blog/article content: prefer clean, editorial photography style.
- For social content: prefer bold, eye-catching visuals.`;

export function createImageAgent(): Agent<ImageGenInput, ImageGenOutput> {
  return {
    name: "tool.generate-image",
    description:
      "LLM tool-calling agent: crafts an optimised image prompt from content and generates an image via Flux or Ideogram.",

    async execute(
      input: ImageGenInput,
      context: AgentContext,
      _artifacts: WorkflowArtifacts,
    ): Promise<ImageGenOutput> {
      const { contentBody, contentTitle, style, provider: forcedProvider } = input;

      const hasFlux = Boolean(process.env.FAL_API_KEY);
      const hasIdeogram = Boolean(process.env.IDEOGRAM_API_KEY);

      let generatedPrompt = "";
      let resultUrl = "";
      let usedProvider: ImageGenOutput["provider"] = "placeholder";

      const tools = [
        {
          name: "check_available_providers",
          description: "Returns which image generation providers are available based on configured API keys.",
          parameters: { type: "object", properties: {}, required: [] },
        },
        {
          name: "generate_flux_image",
          description:
            "Generate an image using Flux (fal.ai). Best for photorealistic and creative imagery.",
          parameters: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "Detailed image generation prompt",
              },
            },
            required: ["prompt"],
          },
        },
        {
          name: "generate_ideogram_image",
          description:
            "Generate an image using Ideogram V2. Supports REALISTIC, ILLUSTRATION, ANIME styles. Great for text-in-image.",
          parameters: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "Detailed image generation prompt",
              },
              style: {
                type: "string",
                enum: ["REALISTIC", "ILLUSTRATION", "ANIME", "GENERAL"],
                description: "Visual style",
              },
            },
            required: ["prompt"],
          },
        },
      ];

      const userMessage = `Content title: ${contentTitle ?? "(none)"}
Style preference: ${style ?? "not specified"}
Forced provider: ${forcedProvider ?? "auto-select"}

Content snippet (first 1000 chars):
${contentBody.slice(0, 1000)}

Available API keys:
- Flux (fal.ai): ${hasFlux ? "✓ available" : "✗ not configured"}
- Ideogram: ${hasIdeogram ? "✓ available" : "✗ not configured"}`;

      const { finalResponse, toolCalls, usage } = await callWithTools(
        SYSTEM_PROMPT,
        userMessage,
        tools,
        async (toolName, args) => {
          const typedArgs = args as Record<string, string>;

          if (toolName === "check_available_providers") {
            const providers = {
              flux: hasFlux,
              ideogram: hasIdeogram,
              recommendation: forcedProvider
                ?? (hasIdeogram ? "ideogram" : hasFlux ? "flux" : "none"),
            };
            context.trace?.addEvent({
              type: "tool_call",
              stepKey: "image_generation",
              agentName: "tool.generate-image",
              toolName,
              toolArgs: {},
              toolResult: providers,
            });
            return providers;
          }

          if (toolName === "generate_flux_image") {
            generatedPrompt = typedArgs.prompt ?? "";
            try {
              resultUrl = await generateViaFlux(generatedPrompt);
              usedProvider = "flux";
              context.trace?.addEvent({
                type: "tool_call",
                stepKey: "image_generation",
                agentName: "tool.generate-image",
                toolName,
                toolArgs: { prompt: generatedPrompt },
                toolResult: { url: resultUrl },
              });
              return { url: resultUrl };
            } catch (err) {
              const error = err instanceof Error ? err.message : "Flux error";
              context.trace?.addEvent({
                type: "tool_call",
                stepKey: "image_generation",
                agentName: "tool.generate-image",
                toolName,
                toolArgs: { prompt: generatedPrompt },
                toolResult: { error },
              });
              return { error };
            }
          }

          if (toolName === "generate_ideogram_image") {
            generatedPrompt = typedArgs.prompt ?? "";
            const ideogramStyle = typedArgs.style ?? style;
            try {
              resultUrl = await generateViaIdeogram(generatedPrompt, ideogramStyle);
              usedProvider = "ideogram";
              context.trace?.addEvent({
                type: "tool_call",
                stepKey: "image_generation",
                agentName: "tool.generate-image",
                toolName,
                toolArgs: { prompt: generatedPrompt, style: ideogramStyle },
                toolResult: { url: resultUrl },
              });
              return { url: resultUrl };
            } catch (err) {
              const error = err instanceof Error ? err.message : "Ideogram error";
              context.trace?.addEvent({
                type: "tool_call",
                stepKey: "image_generation",
                agentName: "tool.generate-image",
                toolName,
                toolArgs: { prompt: generatedPrompt },
                toolResult: { error },
              });
              return { error };
            }
          }

          return { error: `Unknown tool: ${toolName}` };
        },
      );

      context.trace?.addEvent({
        type: "llm_call",
        stepKey: "image_generation",
        agentName: "tool.generate-image",
        prompt: `${SYSTEM_PROMPT}\n\n${userMessage}`,
        modelResponse: finalResponse,
        model: usage.model,
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
        costUsd: usage.costUsd,
        reasoning: finalResponse,
      });

      // If no API keys set and LLM couldn't generate, return placeholder
      if (!resultUrl) {
        const seed = encodeURIComponent((contentTitle ?? "liberation").slice(0, 20));
        resultUrl = `https://placehold.co/1024x1024/1a1a2e/e2e8f0?text=${seed}`;
        usedProvider = "placeholder";
      }

      // Extract a clean prompt from toolCalls if LLM called a generate tool
      const generateCall = toolCalls.find(
        (tc) =>
          tc.tool === "generate_flux_image" || tc.tool === "generate_ideogram_image",
      );
      if (generateCall && !generatedPrompt) {
        const callArgs = generateCall.args as Record<string, string>;
        generatedPrompt = callArgs.prompt ?? "";
      }

      return {
        imageUrl: resultUrl,
        provider: usedProvider,
        generatedPrompt: generatedPrompt || (contentTitle ?? contentBody.slice(0, 100)),
        reasoning: finalResponse || `Image generated via ${usedProvider}.`,
      };
    },
  };
}
