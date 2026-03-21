import { AgentRegistry, type Agent } from "@liberation-os/workflow-engine";
import {
  generateCaptions,
  generateHooks,
  generatePillars,
  generateSchedule,
  generateScripts,
  generateJSON,
} from "@liberation-os/ai-core";
import type { ContentItemDraft, GoalInterpretation, ViralContentGoal, GeneratedContentBatchItem } from "@liberation-os/types";

export async function interpretGoal(goal: string): Promise<ViralContentGoal> {
  return generateJSON<ViralContentGoal>(
    `Interpret this user goal into structured JSON with fields: goalType ("viral_content_batch"), niche (string), platforms (string[]), quantity (number). Goal: "${goal}"`
  );
}

export async function generateContentBatch(goal: ViralContentGoal): Promise<GeneratedContentBatchItem[]> {
  return generateJSON<GeneratedContentBatchItem[]>(
    `Generate ${goal.quantity} viral content ideas for ${goal.niche} on ${goal.platforms.join(", ")}. Return an array of objects with fields: hook, script, caption.`
  );
}

function viralComposeDrafts(): Agent<GoalInterpretation, ContentItemDraft[]> {
  return {
    name: "viral.compose-drafts",
    description: "Compose social post drafts from previous viral artifacts",
    async execute(_input, _context, artifacts) {
      const captions = artifacts.captions ?? [];
      const schedule = artifacts.schedule ?? [];
      if (!Array.isArray(captions)) return [];
      return captions.map((item, index) => ({
        type: "social_post",
        platform: Array.isArray(schedule) ? String(schedule[index]?.platform ?? "tiktok") : "tiktok",
        title: `Post ${index + 1}`,
        body: `${item.hook}\n\n${item.script}\n\n${item.caption}`,
        metadata: {
          pillar: item.pillar,
          hook: item.hook,
          publishAtIso: Array.isArray(schedule) ? schedule[index]?.publishAtIso : null,
        },
        status: "draft",
      }));
    },
  };
}

function viralGeneratePillars(): Agent<GoalInterpretation, string[]> {
  return {
    name: "viral.generate-pillars",
    description: "Generate content pillars",
    execute: async (input) => generatePillars(input),
  };
}

function viralGenerateHooks(): Agent<GoalInterpretation, Awaited<ReturnType<typeof generateHooks>>> {
  return {
    name: "viral.generate-hooks",
    description: "Generate hooks",
    execute: async (input) => generateHooks(input),
  };
}

function viralGenerateScripts(): Agent<GoalInterpretation, Awaited<ReturnType<typeof generateScripts>>> {
  return {
    name: "viral.generate-scripts",
    description: "Generate scripts",
    execute: async (input) => generateScripts(input),
  };
}

function viralGenerateCaptions(): Agent<GoalInterpretation, Awaited<ReturnType<typeof generateCaptions>>> {
  return {
    name: "viral.generate-captions",
    description: "Generate captions",
    execute: async (input) => generateCaptions(input),
  };
}

function viralGenerateSchedule(): Agent<GoalInterpretation, Awaited<ReturnType<typeof generateSchedule>>> {
  return {
    name: "viral.generate-schedule",
    description: "Generate schedule",
    execute: async (input) => generateSchedule(input),
  };
}

function affiliateSiteMap(): Agent<GoalInterpretation, string[]> {
  return {
    name: "affiliate.generate-site-map",
    description: "Generate affiliate site map",
    async execute(input) {
      return [
        `${input.niche} home`,
        `best ${input.niche} products`,
        `${input.niche} buying guides`,
        `${input.niche} comparisons`,
        `${input.niche} reviews`,
      ];
    },
  };
}

function affiliateKeywords(): Agent<GoalInterpretation, Array<{ cluster: string; keywords: string[] }>> {
  return {
    name: "affiliate.generate-keywords",
    description: "Generate keyword clusters",
    async execute(input) {
      return [
        { cluster: "best-of", keywords: [`best ${input.niche}`, `top ${input.niche} options`] },
        { cluster: "vs", keywords: [`${input.niche} a vs b`, `${input.niche} comparison`] },
        { cluster: "buyers-guide", keywords: [`how to choose ${input.niche}`, `${input.niche} buying guide`] },
      ];
    },
  };
}

function affiliateBriefs(): Agent<GoalInterpretation, Array<{ title: string; brief: string }>> {
  return {
    name: "affiliate.generate-briefs",
    description: "Generate affiliate briefs",
    async execute(input) {
      const quantity = Math.min(input.quantity ?? 12, 12);
      return Array.from({ length: quantity }, (_, index) => ({
        title: `${input.niche} article ${index + 1}`,
        brief: `Outline a monetizable article about ${input.niche} with product blocks, comparison angle, FAQ, and CTA.`,
      }));
    },
  };
}

function affiliateArticles(): Agent<GoalInterpretation, Array<{ title: string; body: string; slug: string }>> {
  return {
    name: "affiliate.generate-articles",
    description: "Generate affiliate article drafts",
    async execute(input, _context, artifacts) {
      const briefs = Array.isArray(artifacts.briefs) ? artifacts.briefs : [];
      return briefs.map((brief, index) => ({
        title: String(brief.title ?? `${input.niche} draft ${index + 1}`),
        slug: `${input.niche.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
        body: `# ${brief.title}\n\nIntro on ${input.niche}.\n\n## Top picks\n- Pick 1\n- Pick 2\n\n## What to look for\nPractical buying guidance.\n\n## Final recommendation\nChoose based on budget, use case, and feature priorities.`,
      }));
    },
  };
}

function socialCalendar(): Agent<GoalInterpretation, Array<{ day: number; theme: string }>> {
  return {
    name: "social.generate-calendar",
    description: "Generate social calendar",
    async execute(input) {
      return Array.from({ length: Math.min(input.quantity ?? 10, 10) }, (_, index) => ({
        day: index + 1,
        theme: `${input.niche} campaign beat ${index + 1}`,
      }));
    },
  };
}

function socialPosts(): Agent<GoalInterpretation, ContentItemDraft[]> {
  return {
    name: "social.generate-posts",
    description: "Generate cross-platform post drafts",
    async execute(input, _context, artifacts) {
      const calendar = Array.isArray(artifacts.campaignCalendar) ? artifacts.campaignCalendar : [];
      return calendar.flatMap((entry) =>
        input.platforms.map((platform) => ({
          type: "social_post",
          platform,
          title: `${platform} Day ${entry.day}`,
          body: `Campaign post for ${platform} around ${entry.theme}.`,
          metadata: { day: entry.day, theme: entry.theme },
          status: "draft",
        })),
      );
    },
  };
}

function socialSchedule(): Agent<GoalInterpretation, Awaited<ReturnType<typeof generateSchedule>>> {
  return {
    name: "social.generate-schedule",
    description: "Generate a schedule for cross-platform content",
    execute: async (input) => generateSchedule(input),
  };
}

export function createDefaultRegistry(): AgentRegistry {
  const registry = new AgentRegistry();
  [
    viralGeneratePillars(),
    viralGenerateHooks(),
    viralGenerateScripts(),
    viralGenerateCaptions(),
    viralGenerateSchedule(),
    viralComposeDrafts(),
    affiliateSiteMap(),
    affiliateKeywords(),
    affiliateBriefs(),
    affiliateArticles(),
    socialCalendar(),
    socialPosts(),
    socialSchedule(),
  ].forEach((agent) => registry.register(agent));
  return registry;
}

export { buildViralContentWorkflow } from "./viral-content/workflow";
export { buildAffiliateSiteWorkflow } from "./affiliate-site/workflow";
export { buildSocialSchedulerWorkflow } from "./social-scheduler/workflow";
