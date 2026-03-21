export type GoalType =
  | "viral_content_batch"
  | "affiliate_site_autopilot"
  | "social_campaign";

export type WorkflowStatus =
  | "pending"
  | "running"
  | "waiting_review"
  | "failed"
  | "completed";

export interface GoalRequest {
  goal: string;
  niche?: string;
  platforms?: string[];
  quantity?: number;
  tone?: string;
  monetization?: string[];
}

export interface StructuredGoal {
  goalType: GoalType;
  niche: string;
  platforms: string[];
  quantity: number | null;
  deliverables: string[];
  tone: string | null;
  constraints: string[];
  successMetric: string | null;
}

export interface WorkflowStepDefinition<TInput = unknown> {
  key: string;
  agentName: string;
  input: TInput;
}

export interface WorkflowPlan {
  workflowName: string;
  steps: WorkflowStepDefinition[];
}

export interface ContentItem {
  type: string;
  platform?: string;
  title?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface AgentContext {
  userId: string;
  workspaceId: string;
  projectId: string;
  traceId: string;
  modelProvider: "openai" | "anthropic" | "google";
  logger: {
    info: (message: string, meta?: unknown) => void;
    error: (message: string, meta?: unknown) => void;
  };
}
