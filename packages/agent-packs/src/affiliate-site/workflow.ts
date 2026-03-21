import type { GoalRequest, WorkflowPlan } from "@liberation-os/types";

export function buildAffiliateSiteWorkflow(input: GoalRequest): WorkflowPlan {
  return {
    workflowName: "affiliate-site-autopilot",
    steps: [
      { key: "site-map", agentName: "affiliate-planner-agent", input },
      { key: "briefs", agentName: "article-brief-agent", input },
      { key: "drafts", agentName: "article-writer-agent", input }
    ]
  };
}
