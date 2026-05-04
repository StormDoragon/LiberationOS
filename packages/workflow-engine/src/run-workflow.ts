import { createDefaultRegistry } from "@liberation-os/agent-packs";
import type { WorkflowExecutionResult } from "@liberation-os/types";
import { interpretGoal } from "@liberation-os/ai-core";
import type { GoalRequest, GoalInterpretation } from "@liberation-os/types";

/**
 * Lightweight single-shot workflow runner.
 * Interprets the goal, runs the appropriate pipeline, and returns results.
 * Used by the async queue path (executeQueuedWorkflow).
 */
export async function runWorkflow(goal: string): Promise<WorkflowExecutionResult> {
  const request: GoalRequest = { goal };
  const structuredGoal = await interpretGoal(request);

  const registry = createDefaultRegistry();
  const context = {
    userId: "system",
    workspaceId: "queue",
    projectId: "queue",
    traceId: `run_${Date.now()}`,
    modelProvider: "openai" as const,
    logger: {
      info: (msg: string, meta?: unknown) => console.log("[run-workflow]", msg, meta ?? ""),
      error: (msg: string, meta?: unknown) => console.error("[run-workflow]", msg, meta ?? ""),
    },
  };
  const artifacts: Record<string, unknown> = {};

  if (structuredGoal.goalType === "viral_content_batch") {
    const pillarsAgent = registry.get("viral.generate-pillars");
    artifacts.pillars = await pillarsAgent.execute(structuredGoal as never, context, artifacts);

    const hooksAgent = registry.get("viral.generate-hooks");
    artifacts.hooks = await hooksAgent.execute(structuredGoal as never, context, artifacts);

    const scriptsAgent = registry.get("viral.generate-scripts");
    artifacts.scripts = await scriptsAgent.execute(structuredGoal as never, context, artifacts);

    const captionsAgent = registry.get("viral.generate-captions");
    const captions = await captionsAgent.execute(structuredGoal as never, context, artifacts) as Array<{
      hook: string; script: string; caption: string;
    }>;
    artifacts.captions = captions;

    return {
      structuredGoal: {
        goalType: structuredGoal.goalType,
        niche: structuredGoal.niche,
        platforms: structuredGoal.platforms,
        quantity: structuredGoal.quantity ?? 12,
      },
      items: captions.map((c) => ({
        hook: c.hook,
        script: c.script,
        caption: c.caption,
      })),
    };
  }

  if (structuredGoal.goalType === "affiliate_site_autopilot") {
    const siteMapAgent = registry.get("affiliate.generate-site-map");
    artifacts.siteMap = await siteMapAgent.execute(structuredGoal as never, context, artifacts);

    const keywordsAgent = registry.get("affiliate.generate-keywords");
    artifacts.keywords = await keywordsAgent.execute(structuredGoal as never, context, artifacts);

    const briefsAgent = registry.get("affiliate.generate-briefs");
    artifacts.briefs = await briefsAgent.execute(structuredGoal as never, context, artifacts);

    const articlesAgent = registry.get("affiliate.generate-articles");
    const articles = await articlesAgent.execute(structuredGoal as never, context, artifacts) as Array<{
      title: string; body: string; slug: string;
    }>;
    artifacts.articles = articles;

    return {
      structuredGoal: {
        goalType: structuredGoal.goalType,
        niche: structuredGoal.niche,
        platforms: structuredGoal.platforms,
        quantity: structuredGoal.quantity ?? 12,
      },
      items: articles.map((a) => ({
        hook: a.title,
        script: a.body,
        caption: `/${a.slug}`,
      })),
    };
  }

  // social_campaign
  const calendarAgent = registry.get("social.generate-calendar");
  artifacts.campaignCalendar = await calendarAgent.execute(structuredGoal as never, context, artifacts);

  const postsAgent = registry.get("social.generate-posts");
  const posts = await postsAgent.execute(structuredGoal as never, context, artifacts) as Array<{
    title: string; body: string; platform: string;
  }>;
  artifacts.channelPosts = posts;

  const scheduleAgent = registry.get("social.generate-schedule");
  artifacts.schedule = await scheduleAgent.execute(structuredGoal as never, context, artifacts);

  return {
    structuredGoal: {
      goalType: structuredGoal.goalType,
      niche: structuredGoal.niche,
      platforms: structuredGoal.platforms,
      quantity: structuredGoal.quantity ?? 12,
    },
    items: posts.map((p) => ({
      hook: p.title,
      script: p.body,
      caption: p.platform,
    })),
  };
}