import { afterEach, describe, expect, it, vi } from "vitest";
import { callWithTools, generateJSON, generateJSONWithUsage } from "./client";

describe("OpenAI wrapper offline fallbacks", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a structured goal without an API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await generateJSON<{ quantity: number; niche: string }>(
      'Return structured JSON for "Create 4 posts about coffee"',
    );
    expect(result).toMatchObject({ quantity: 4 });
    expect(result.niche).toContain("coffee");
  });

  it("returns deterministic batches and zero-cost usage offline", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await generateJSONWithUsage<Array<{ hook: string }>>(
      "Generate 3 viral content ideas for bakers.",
    );
    expect(result.result).toHaveLength(3);
    expect(result.usage).toEqual({
      tokensIn: 0,
      tokensOut: 0,
      model: "offline",
      costUsd: 0,
    });
  });

  it("runs the first tool as an offline fallback", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const handler = vi.fn().mockResolvedValue({ ok: true });
    const result = await callWithTools(
      "system",
      "user",
      [{ name: "lookup", description: "Lookup", parameters: {} }],
      handler,
    );
    expect(handler).toHaveBeenCalledWith("lookup", {});
    expect(result.toolCalls[0]).toMatchObject({
      tool: "lookup",
      result: { ok: true },
    });
  });
});
