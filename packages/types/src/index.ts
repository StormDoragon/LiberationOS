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

export interface ViralContentGoal {
  goalType: "viral_content_batch";
  niche: string;
  platforms: string[];
  quantity: number;
}

export interface GeneratedContentBatchItem {
  hook: string;
  script: string;
  caption: string;
}

export interface WorkflowExecutionResult {
  structuredGoal: ViralContentGoal;
  items: GeneratedContentBatchItem[];
}

export interface WorkflowJobPayload {
  projectId: string;
  workflowRunId: string;
  goal: string;
}

export interface CreateProjectResponse {
  projectId: string;
  workflowRunId: string;
  jobId: string;
  status: WorkflowStatus;
}

export interface ProjectListItem {
  id: string;
  title: string;
  status: WorkflowStatus;
  createdAt: string;
  workflowCount: number;
  contentCount: number;
}

export interface WorkflowStepSnapshot {
  id: string;
  key: string;
  agentName: string;
  status: WorkflowStatus;
  input: unknown;
  output: unknown;
  retryCount: number;
}

export interface WorkflowRunSnapshot {
  id: string;
  workflowName: string;
  status: WorkflowStatus;
  startedAt: string | null;
  completedAt: string | null;
  errorLog: string | null;
  steps: WorkflowStepSnapshot[];
}

export interface ContentItemSnapshot {
  id: string;
  type: string;
  platform: string | null;
  title: string | null;
  body: string;
  metadata: unknown;
  status: string;
}

export interface ProjectSnapshot {
  id: string;
  title: string;
  goalType: string;
  status: WorkflowStatus;
  input: unknown;
  createdAt: string;
  runs: WorkflowRunSnapshot[];
  content: ContentItemSnapshot[];
}
