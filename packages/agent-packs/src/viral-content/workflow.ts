import type { GoalRequest, WorkflowPlan } from "@liberation-os/types";

export function buildViralContentWorkflow(input: GoalRequest): WorkflowPlan {
  return {
    workflowName: "viral-content-engine",
    goalType: "viral_content_batch",
    steps: [
      { key: "pillars", agentName: "viral.generate-pillars", input },
      { key: "hooks", agentName: "viral.generate-hooks", input },
      { key: "scripts", agentName: "viral.generate-scripts", input },
      { key: "captions", agentName: "viral.generate-captions", input },
      { key: "schedule", agentName: "viral.generate-schedule", input },
      { key: "drafts", agentName: "viral.compose-drafts", input }
    ]
  };
}
