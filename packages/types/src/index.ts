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

export type ContentStatus = "draft" | "approved" | "scheduled" | "published";

export interface GoalRequest {
  goal: string;
  niche?: string;
  platforms?: string[];
  quantity?: number;
  tone?: string;
  monetization?: string[];
  workspaceId?: string;
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
  goalType: GoalType;
  steps: WorkflowStepDefinition[];
}

export interface ContentItemDraft {
  type: string;
  platform?: string;
  title?: string;
  body: string;
  metadata?: Record<string, unknown>;
  status?: ContentStatus;
}

// ---------------------------------------------------------------------------
// Execution Trace
// ---------------------------------------------------------------------------

export type TraceEventType =
  | "step_start"
  | "step_end"
  | "llm_call"
  | "tool_call"
  | "error";

export interface TraceEvent {
  id: string;
  timestamp: string;        // ISO
  type: TraceEventType;
  stepKey: string;
  agentName: string;
  // LLM call fields
  prompt?: string;
  modelResponse?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  // Tool call fields
  toolName?: string;
  toolArgs?: unknown;
  toolResult?: unknown;
  // Timing / reasoning
  durationMs?: number;
  reasoning?: string;       // LLM explanation for its decision
  error?: string;
}

export interface TraceRecorder {
  addEvent(event: Omit<TraceEvent, "id" | "timestamp">): TraceEvent;
  getEvents(): TraceEvent[];
}

// ---------------------------------------------------------------------------
// Agent context (updated to carry optional trace recorder)
// ---------------------------------------------------------------------------

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
  trace?: TraceRecorder;
}

export interface GoalInterpretation extends StructuredGoal {
  projectTitle: string;
}

export interface PlannerInput {
  request: GoalRequest;
  interpretation: GoalInterpretation;
}

export interface HookItem {
  pillar: string;
  hook: string;
}

export interface ScriptItem extends HookItem {
  script: string;
}

export interface CaptionItem extends ScriptItem {
  caption: string;
}

export interface ScheduleItem {
  index: number;
  platform: string;
  publishAtIso: string;
}

export interface WorkflowArtifacts {
  interpretation?: GoalInterpretation;
  plan?: WorkflowPlan;
  pillars?: string[];
  hooks?: HookItem[];
  scripts?: ScriptItem[];
  captions?: CaptionItem[];
  schedule?: ScheduleItem[];
  contentDrafts?: ContentItemDraft[];
  [key: string]: unknown;
}

export interface CreateProjectInput extends GoalRequest {
  title?: string;
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

export interface CreateProjectResponse {
  projectId: string;
  workflowRunId: string;
  jobId: string;
  status: string;
}

export interface ProjectListItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  workflowCount: number;
  contentCount: number;
}

export interface WorkflowStepSnapshot {
  id: string;
  key: string;
  agentName: string;
  status: string;
  input: unknown;
  output: unknown;
  retryCount: number;
}

export interface ProjectSnapshotRun {
  id: string;
  workflowName: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  errorLog: string | null;
  steps: WorkflowStepSnapshot[];
}

export interface ProjectSnapshotContentItem {
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
  status: string;
  input: unknown;
  createdAt: string;
  runs: ProjectSnapshotRun[];
  content: ProjectSnapshotContentItem[];
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
