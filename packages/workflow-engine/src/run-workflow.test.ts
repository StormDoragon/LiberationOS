import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  interpretGoal: vi.fn(),
}));

vi.mock("@liberation-os/agent-packs", () => ({
  createDefaultRegistry: () => ({ get: () => ({ execute: mocks.execute }) }),
}));
vi.mock("@liberation-os/ai-core", () => ({
  interpretGoal: mocks.interpretGoal,
}));

import { runWorkflow } from "./run-workflow";

describe("queued workflow orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.interpretGoal.mockResolvedValue({
      goalType: "viral_content_batch",
      niche: "tea",
      platforms: ["tiktok"],
      quantity: 1,
    });
    mocks.execute.mockImplementation(
      async (
        _input: unknown,
        _context: unknown,
        artifacts: Record<string, unknown>,
      ) => {
        if (!artifacts.pillars) return ["pillar"];
        if (!artifacts.hooks) return [{ hook: "hook" }];
        if (!artifacts.scripts) return [{ hook: "hook", script: "script" }];
        return [{ hook: "hook", script: "script", caption: "caption" }];
      },
    );
  });

  it("runs the viral pipeline in dependency order", async () => {
    const result = await runWorkflow("Create one tea post");
    expect(mocks.execute).toHaveBeenCalledTimes(4);
    expect(result).toEqual({
      structuredGoal: {
        goalType: "viral_content_batch",
        niche: "tea",
        platforms: ["tiktok"],
        quantity: 1,
      },
      items: [{ hook: "hook", script: "script", caption: "caption" }],
    });
  });

  it("returns no viral items for non-viral workflow types", async () => {
    mocks.interpretGoal.mockResolvedValue({
      goalType: "social_campaign",
      niche: "tea",
      platforms: ["instagram"],
      quantity: null,
    });

    await expect(runWorkflow("Schedule a tea campaign")).resolves.toEqual({
      structuredGoal: {
        goalType: "viral_content_batch",
        niche: "tea",
        platforms: ["instagram"],
        quantity: 12,
      },
      items: [],
    });
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
