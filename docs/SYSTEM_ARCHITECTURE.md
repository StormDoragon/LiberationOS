# LiberationOS System Architecture

## Overview

LiberationOS follows an agentic execution model:

1. User submits business goal
2. Goal interpreter structures intent
3. Planner composes executable workflow
4. Specialist agents generate artifacts
5. Orchestrator manages step execution, retries, and status
6. Human review gate controls approval and publishing
7. Integrations publish to external platforms
8. Analytics loop informs future generation

## Layered Architecture

### A) Input Layer
Collects goal and constraints:
- niche
- platforms/channels
- tone
- quantity and schedule
- monetization intent

### B) Goal Interpreter
Converts freeform text into a typed goal object, e.g.:

```json
{
  "goal_type": "viral_content_batch",
  "platforms": ["tiktok"],
  "niche": "anime",
  "quantity": 30,
  "deliverables": ["hooks", "scripts", "captions", "posting_schedule"]
}
```

### C) Planner
Builds a step graph with dependencies and expected outputs.

### D) Specialist Agents
Narrowly scoped workers (examples):
- trend research
- content pillar generation
- hook/script/caption writing
- SEO clustering and article briefs
- platform repurposing
- scheduling and publishing

### E) Orchestrator + Worker
Runs steps in sequence or parallel via queue workers.

Status model:
- `pending`
- `running`
- `waiting_review`
- `failed`
- `completed`

### F) Human Review Layer
Actions:
- approve all or by item
- edit item
- regenerate item
- bulk approve

### G) Execution Layer
Integration adapters for:
- WordPress
- Buffer
- future social APIs

### H) Feedback Layer
Stores performance metrics for optimization and recommendation generation.

## Monorepo Target Structure

```text
apps/
  web/
  worker/
packages/
  ui/
  db/
  types/
  prompts/
  ai-core/
  workflow-engine/
  agent-packs/
  integrations/
  analytics/
  utils/
prisma/
docs/
```

## Shared Agent Interface

```ts
export interface Agent<Input, Output> {
  name: string;
  description: string;
  validateInput(input: unknown): Input;
  execute(input: Input, context: AgentContext): Promise<Output>;
}

export interface AgentContext {
  userId: string;
  workspaceId: string;
  projectId: string;
  modelProvider: "openai" | "anthropic" | "google";
  traceId: string;
  logger: {
    info: (msg: string, meta?: unknown) => void;
    error: (msg: string, meta?: unknown) => void;
  };
}
```

## Data Model Relationships

- Workspace belongs to User
- Project belongs to Workspace
- WorkflowRun belongs to Project
- WorkflowStep belongs to WorkflowRun
- ContentItem belongs to Project
- PublishJob belongs to ContentItem
- IntegrationConnection belongs to Workspace
- AnalyticsRecord belongs to ContentItem

## Reliability & Safety

- schema validation for all model outputs
- per-step retry policy with bounded attempts
- idempotency keys for publish jobs
- encrypted integration credentials
- full workflow audit logging
- rate limiting and abuse protection
