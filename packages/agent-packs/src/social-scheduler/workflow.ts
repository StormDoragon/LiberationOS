import type { GoalRequest, WorkflowPlan } from "@liberation-os/types";

export function buildSocialSchedulerWorkflow(input: GoalRequest): WorkflowPlan {
  return {
    workflowName: "social-scheduler",
    steps: [
      { key: "repurpose", agentName: "platform-repurposer-agent", input },
      { key: "schedule", agentName: "social-scheduler-agent", input }
    ]
  };
}
