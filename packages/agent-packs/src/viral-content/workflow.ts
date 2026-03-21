import type { GoalRequest, WorkflowPlan } from "@liberation-os/types";

export function buildViralContentWorkflow(input: GoalRequest): WorkflowPlan {
  return {
    workflowName: "viral-content-engine",
    steps: [
      { key: "pillars", agentName: "content-pillar-agent", input },
      { key: "hooks", agentName: "hook-generator-agent", input },
      { key: "scripts", agentName: "script-writer-agent", input }
    ]
  };
}
