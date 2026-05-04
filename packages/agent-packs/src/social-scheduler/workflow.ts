import type { GoalRequest, WorkflowPlan } from "@liberation-os/types";

export function buildSocialSchedulerWorkflow(input: GoalRequest): WorkflowPlan {
  return {
    workflowName: "social-campaign-scheduler",
    goalType: "social_campaign",
    steps: [
      { key: "campaignCalendar", agentName: "social.generate-calendar", input },
      { key: "channelPosts", agentName: "social.generate-posts", input },
      { key: "schedule", agentName: "social.generate-schedule", input },
    ]
  };
}
