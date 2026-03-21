import type { GoalRequest } from "@liberation-os/types";
import {
  buildAffiliateSiteWorkflow,
  buildSocialSchedulerWorkflow,
  buildViralContentWorkflow
} from "@liberation-os/agent-packs";

export function getWorkflowForGoal(goal: GoalRequest) {
  const normalized = goal.goal.toLowerCase();

  if (normalized.includes("affiliate")) return buildAffiliateSiteWorkflow(goal);
  if (normalized.includes("schedule") || normalized.includes("instagram") || normalized.includes("x ")) {
    return buildSocialSchedulerWorkflow(goal);
  }

  return buildViralContentWorkflow(goal);
}
