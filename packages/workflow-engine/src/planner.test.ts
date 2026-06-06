import { describe, expect, it } from "vitest";
import { buildPlan } from "./planner";

describe("workflow planning", () => {
  it("combines goal interpretation with a concrete plan", async () => {
    const request = { goal: "Create 4 TikTok posts about home workouts" };
    const result = await buildPlan(request);
    expect(result.request).toBe(request);
    expect(result.interpretation).toMatchObject({
      goalType: "viral_content_batch",
      quantity: 4,
      platforms: ["tiktok"],
    });
    expect(result.plan.workflowName).toBe("viral-content-engine");
    expect(result.plan.steps.map((step) => step.key)).toContain("scripts");
  });
});
