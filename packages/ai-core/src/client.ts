import OpenAI from "openai";
import type { GeneratedContentBatchItem, ViralContentGoal } from "@liberation-os/types";

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

  return {
    goalType: "viral_content_batch",
    niche,
    platforms,
    quantity
  };
};

const fallbackBatch = (prompt: string): GeneratedContentBatchItem[] => {
  const quantityMatch = prompt.match(/Generate\s+(\d+)/i);
  const quantity = Number(quantityMatch?.[1] ?? "5");
  const nicheMatch = prompt.match(/for\s+(.+?)\./i);
  const niche = nicheMatch?.[1]?.trim() ?? "general creators";

  return Array.from({ length: quantity }, (_, index) => ({
    hook: `Idea ${index + 1}: ${niche} viewers stop scrolling when they hear this.`,
    script: `Open with a bold claim about ${niche}, deliver one practical insight, and end with a challenge to comment their result.`,
    caption: `${niche} growth play ${index + 1}. Save this for your next post.`
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

export async function generateJSON<T>(prompt: string): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildFallbackResponse<T>(prompt);
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  const text = response.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON from AI");
  }
}