import { generateContentBatch, interpretGoal } from "@liberation-os/agent-packs";
import type { WorkflowExecutionResult } from "@liberation-os/types";

export async function runWorkflow(goal: string): Promise<WorkflowExecutionResult> {
  const structuredGoal = await interpretGoal(goal);

  if (structuredGoal.goalType !== "viral_content_batch") {
    throw new Error(`Unsupported goal type: ${structuredGoal.goalType}`);
  }

  const items = await generateContentBatch(structuredGoal);

  return {
    structuredGoal,
    items
  };
}