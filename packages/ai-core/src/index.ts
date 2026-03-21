import { z } from "zod";
import type {
  CaptionItem,
  GoalInterpretation,
  GoalRequest,
  HookItem,
  PlannerInput,
  ScheduleItem,
  ScriptItem,
  WorkflowPlan,
} from "@liberation-os/types";
import { goalInterpreterPrompt } from "@liberation-os/prompts";
import { addDays } from "@liberation-os/utils";

const GoalInterpretationSchema = z.object({
  projectTitle: z.string(),
  goalType: z.enum(["viral_content_batch", "affiliate_site_autopilot", "social_campaign"]),
  niche: z.string(),
  platforms: z.array(z.string()),
  quantity: z.number().nullable(),
  deliverables: z.array(z.string()),
  tone: z.string().nullable(),
  constraints: z.array(z.string()),
  successMetric: z.string().nullable(),
});

function inferPlatforms(goal: string): string[] {
  const lower = goal.toLowerCase();
  const platforms = [
    ["tiktok", "tiktok"],
    ["instagram", "instagram"],
    ["reels", "instagram"],
    ["x", "x"],
    ["twitter", "x"],
    ["facebook", "facebook"],
    ["linkedin", "linkedin"],
    ["wordpress", "wordpress"],
  ].filter(([needle]) => lower.includes(needle)).map(([, value]) => value);

  return platforms.length ? Array.from(new Set(platforms)) : ["tiktok"];
}

function inferGoalType(goal: string): GoalInterpretation["goalType"] {
  const lower = goal.toLowerCase();
  if (lower.includes("affiliate") || lower.includes("site") || lower.includes("seo")) {
    return "affiliate_site_autopilot";
  }
  if (lower.includes("schedule") || lower.includes("campaign") || lower.includes("all platforms")) {
    return "social_campaign";
  }
  return "viral_content_batch";
}

function inferQuantity(goal: string, fallback = 12): number {
  const match = goal.match(/(\d{1,3})/);
  return match ? Number(match[1]) : fallback;
}

function inferNiche(goal: string, fallback?: string): string {
  if (fallback) return fallback;
  const lower = goal.toLowerCase();
  const patterns = ["for me", "for my", "about", "around"];
  for (const pattern of patterns) {
    const idx = lower.indexOf(pattern);
    if (idx >= 0) {
      return goal.slice(idx + pattern.length).trim().replace(/^site\s+/i, "") || "general business";
    }
  }
  return "general business";
}

export async function interpretGoal(request: GoalRequest): Promise<GoalInterpretation> {
  const goalType = inferGoalType(request.goal);
  const platforms = request.platforms?.length ? request.platforms : inferPlatforms(request.goal);
  const quantity = request.quantity ?? inferQuantity(request.goal, goalType === "affiliate_site_autopilot" ? 24 : 12);
  const niche = inferNiche(request.goal, request.niche);

  const interpretation = {
    projectTitle:
      request.goal.length > 70 ? `${request.goal.slice(0, 67).trim()}...` : request.goal,
    goalType,
    niche,
    platforms,
    quantity,
    deliverables:
      goalType === "viral_content_batch"
        ? ["pillars", "hooks", "scripts", "captions", "schedule"]
        : goalType === "affiliate_site_autopilot"
          ? ["site_map", "keyword_clusters", "briefs", "draft_articles"]
          : ["campaign_calendar", "channel_rewrites", "schedule"],
    tone: request.tone ?? "clear, persuasive, energetic",
    constraints: ["avoid generic phrasing", "keep outputs practical", "prepare for human review"],
    successMetric:
      goalType === "affiliate_site_autopilot" ? "rank and monetize content" : "engagement and publishing consistency",
  } satisfies GoalInterpretation;

  return GoalInterpretationSchema.parse(interpretation);
}

export async function planWorkflow(input: PlannerInput): Promise<WorkflowPlan> {
  const goalType = input.interpretation.goalType;

  if (goalType === "viral_content_batch") {
    return {
      workflowName: "viral-content-engine",
      goalType,
      steps: [
        { key: "pillars", agentName: "viral.generate-pillars", input: input.interpretation },
        { key: "hooks", agentName: "viral.generate-hooks", input: input.interpretation },
        { key: "scripts", agentName: "viral.generate-scripts", input: input.interpretation },
        { key: "captions", agentName: "viral.generate-captions", input: input.interpretation },
        { key: "schedule", agentName: "viral.generate-schedule", input: input.interpretation },
        { key: "drafts", agentName: "viral.compose-drafts", input: input.interpretation },
      ],
    };
  }

  if (goalType === "affiliate_site_autopilot") {
    return {
      workflowName: "affiliate-site-autopilot",
      goalType,
      steps: [
        { key: "siteMap", agentName: "affiliate.generate-site-map", input: input.interpretation },
        { key: "keywords", agentName: "affiliate.generate-keywords", input: input.interpretation },
        { key: "briefs", agentName: "affiliate.generate-briefs", input: input.interpretation },
        { key: "articles", agentName: "affiliate.generate-articles", input: input.interpretation },
      ],
    };
  }

  return {
    workflowName: "social-campaign-scheduler",
    goalType,
    steps: [
      { key: "campaignCalendar", agentName: "social.generate-calendar", input: input.interpretation },
      { key: "channelPosts", agentName: "social.generate-posts", input: input.interpretation },
      { key: "schedule", agentName: "social.generate-schedule", input: input.interpretation },
    ],
  };
}

export async function generatePillars(interpretation: GoalInterpretation): Promise<string[]> {
  const base = [
    `${interpretation.niche} myths and truths`,
    `${interpretation.niche} rapid wins`,
    `${interpretation.niche} mistakes to avoid`,
    `${interpretation.niche} transformation stories`,
    `${interpretation.niche} best tools and tactics`,
  ];
  return base.slice(0, 5);
}

export async function generateHooks(interpretation: GoalInterpretation): Promise<HookItem[]> {
  const quantity = interpretation.quantity ?? 12;
  const pillars = await generatePillars(interpretation);
  return Array.from({ length: quantity }, (_, index) => ({
    pillar: pillars[index % pillars.length],
    hook: `#${index + 1}: ${interpretation.niche} idea that stops the scroll and promises a fast takeaway`,
  }));
}

export async function generateScripts(interpretation: GoalInterpretation): Promise<ScriptItem[]> {
  const hooks = await generateHooks(interpretation);
  return hooks.map((hook, index) => ({
    ...hook,
    script: `Open with the hook, deliver a concrete insight about ${interpretation.niche}, then end with a CTA to follow for part ${index + 2}.`,
  }));
}

export async function generateCaptions(interpretation: GoalInterpretation): Promise<CaptionItem[]> {
  const scripts = await generateScripts(interpretation);
  return scripts.map((item, index) => ({
    ...item,
    caption: `Post ${index + 1} for ${interpretation.platforms.join(", ")}: concise caption about ${interpretation.niche} with one clear CTA and 3 targeted hashtags.`,
  }));
}

export async function generateSchedule(interpretation: GoalInterpretation): Promise<ScheduleItem[]> {
  const quantity = interpretation.quantity ?? 12;
  return Array.from({ length: quantity }, (_, index) => {
    const date = addDays(new Date(), index);
    date.setHours(12 + (index % 4) * 2, 0, 0, 0);
    return {
      index,
      platform: interpretation.platforms[index % interpretation.platforms.length],
      publishAtIso: date.toISOString(),
    };
  });
}

export function renderPromptPreview(request: GoalRequest): string {
  return `${goalInterpreterPrompt}\n\nUser goal: ${request.goal}`;
}

export { generateJSON, generateJSONWithUsage, callWithTools } from "./client";
export type { LLMUsage, LLMCallResult, ToolDefinition, ToolCallRecord, ToolCallResult } from "./client";
