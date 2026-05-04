import type { GoalRequest, WorkflowPlan } from "@liberation-os/types";

export function buildAffiliateSiteWorkflow(input: GoalRequest): WorkflowPlan {
  return {
    workflowName: "affiliate-site-autopilot",
    goalType: "affiliate_site_autopilot",
    steps: [
      { key: "siteMap", agentName: "affiliate.generate-site-map", input },
      { key: "keywords", agentName: "affiliate.generate-keywords", input },
      { key: "briefs", agentName: "affiliate.generate-briefs", input },
      { key: "articles", agentName: "affiliate.generate-articles", input },
    ]
  };
}
