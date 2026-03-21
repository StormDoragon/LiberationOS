import type { GoalRequest, PlannerInput, WorkflowPlan } from "@liberation-os/types";
import { interpretGoal, planWorkflow } from "@liberation-os/ai-core";

export async function buildPlan(request: GoalRequest): Promise<PlannerInput & { plan: WorkflowPlan }> {
  const interpretation = await interpretGoal(request);
  const plan = await planWorkflow({ request, interpretation });
  return { request, interpretation, plan };
}
