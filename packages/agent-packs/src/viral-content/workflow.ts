import type { GoalRequest, WorkflowPlan } from "@liberation-os/types";

export function buildViralContentWorkflow(input: GoalRequest): WorkflowPlan {
  return {
    workflowName: "viral-content-engine",
    goalType: "viral_content_batch",
    steps: [
      { key: "pillars", agentName: "content-pillar-agent", input },
      { key: "hooks", agentName: "hook-generator-agent", input },
      { key: "scripts", agentName: "script-writer-agent", input }
    ]
  };
}
