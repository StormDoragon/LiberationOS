import { describe, expect, it } from "vitest";
import {
  generateCaptions,
  generateHooks,
  generatePillars,
  generateSchedule,
  generateScripts,
  interpretGoal,
  planWorkflow,
} from "./index";

describe("AI core deterministic planning", () => {
  it("interprets a social campaign goal", async () => {
    const result = await interpretGoal({
      goal: "Schedule 8 Instagram and LinkedIn posts about fintech",
      tone: "credible",
    });
    expect(result).toMatchObject({
      goalType: "social_campaign",
      quantity: 8,
      platforms: ["instagram", "linkedin"],
      tone: "credible",
    });
  });

  it("builds the correct workflow plan for each goal type", async () => {
    const viral = await interpretGoal({
      goal: "Create 3 TikTok posts about fitness",
    });
    const affiliate = await interpretGoal({
      goal: "Build an affiliate SEO site about coffee",
    });
    expect(
      (
        await planWorkflow({
          request: { goal: "viral" },
          interpretation: viral,
        })
      ).steps,
    ).toHaveLength(6);
    expect(
      (
        await planWorkflow({
          request: { goal: "affiliate" },
          interpretation: affiliate,
        })
      ).workflowName,
    ).toBe("affiliate-site-autopilot");
  });

  it("generates repeatable content artifacts", async () => {
    const interpretation = await interpretGoal({
      goal: "Create 2 TikTok posts about gardening",
    });
    const pillars = await generatePillars(interpretation);
    const hooks = await generateHooks(interpretation);
    const scripts = await generateScripts(interpretation);
    const captions = await generateCaptions(interpretation);
    const schedule = await generateSchedule(interpretation);
    expect(pillars).toEqual(await generatePillars(interpretation));
    expect(hooks).toHaveLength(2);
    expect(scripts).toHaveLength(2);
    expect(captions).toHaveLength(2);
    expect(schedule).toHaveLength(2);
  });
});
