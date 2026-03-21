import { createDefaultRegistry } from "@liberation-os/agent-packs";
import type { WorkflowExecutionResult } from "@liberation-os/types";
import { interpretGoal } from "@liberation-os/ai-core";
import type { GoalRequest } from "@liberation-os/types";

/**
 * Lightweight single-shot workflow runner.
 * Interprets the goal, runs the viral-content pipeline, and returns results.
 * Used by the async queue path (executeQueuedWorkflow).
 */
export async function runWorkflow(goal: string): Promise<WorkflowExecutionResult> {
  const request: GoalRequest = { goal };
  const structuredGoal = await interpretGoal(request);

  // Use the registry agents to generate content for viral_content_batch
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

  // For non-viral goal types, return empty items (content is handled differently)
  return {
    structuredGoal: {
      goalType: "viral_content_batch",
      niche: structuredGoal.niche,
      platforms: structuredGoal.platforms,
      quantity: structuredGoal.quantity ?? 12,
    },
    items: [],
  };
}