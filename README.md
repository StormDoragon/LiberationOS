# LiberationOS

**Enter a goal. Get execution.**

LiberationOS is an AI-powered system that transforms plain-English business goals into fully executed workflows. Describe what you want — viral content, an affiliate site, a social campaign — and the engine interprets your intent, builds a multi-step agent pipeline, generates all the deliverables, and hands you polished drafts ready for review and publishing.

---

## Features

- **Goal Interpretation** — type a goal in natural language; AI converts it into a structured workflow plan
- **Three Workflow Packs**
  - **Viral Content Engine** — pillars → hooks → scripts → captions → schedule → drafts
  - **Affiliate Site Autopilot** — site map → keywords → briefs → articles
  - **Social Campaign Scheduler** — calendar → posts → schedule
- **Agent Registry** — modular agents that execute each pipeline step independently
- **Database-Backed Projects** — every project, run, step, and draft is persisted in PostgreSQL via Prisma
- **Content Review Workflow** — approve, publish, or revert individual items; bulk-approve all drafts
- **Async Job Queue** — optional BullMQ worker for background workflow execution
- **Offline Fallbacks** — runs without an OpenAI key using deterministic heuristic generators

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript |
| API | Next.js API routes (REST) |
| Database | PostgreSQL 16, Prisma 6 |
| Queue | Redis 7, BullMQ |
| AI | OpenAI SDK (with offline fallbacks) |
| Monorepo | pnpm workspaces, Turborepo |
| Infrastructure | Docker Compose |

## Monorepo Structure

```
apps/
  web/              → Next.js dashboard, API routes, project UI
  worker/           → BullMQ background job processor

packages/
  agent-packs/      → Workflow agents (viral, affiliate, social)
  ai-core/          → LLM client, goal interpretation, content generation
  analytics/        → Performance metrics and feedback tracking
  db/               → Prisma schema, client, seed scripts
  integrations/     → External adapters (WordPress, Buffer)
  prompts/          → System prompts and agent templates
  types/            → Shared TypeScript interfaces
  ui/               → React component library
  utils/            → Utility functions (trace IDs, logging)
  workflow-engine/  → Core orchestration: planning, execution, persistence
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

### 1. Clone and install

```bash
git clone https://github.com/StormDoragon/LiberationOS.git
cd LiberationOS
pnpm install
```

### 2. Start infrastructure

```bash
pnpm infra:up          # starts PostgreSQL + Redis via Docker Compose
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env if needed — defaults work for local Docker setup
# Optionally add your OPENAI_API_KEY for real AI generation
```

### 4. Setup database

```bash
pnpm setup             # generates Prisma client, pushes schema, seeds demo data
```

Or run steps individually:

```bash
pnpm db:generate       # generate Prisma client
pnpm db:push           # push schema to database
pnpm db:seed           # seed demo workspace
```

### 5. Run

```bash
pnpm dev:web           # start Next.js on http://localhost:3000
pnpm dev:worker        # (optional) start BullMQ worker in a second terminal
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/:id` | Get project detail with runs, steps, and content |
| `POST` | `/api/projects/:id/run` | Run workflow synchronously |
| `POST` | `/api/projects/:id/approve-all` | Bulk-approve all draft content |
| `POST` | `/api/run` | Create project and queue for async execution |
| `PATCH` | `/api/content/:id` | Update content status (draft → approved → published) |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in parallel |
| `pnpm dev:web` | Start Next.js dev server |
| `pnpm dev:worker` | Start BullMQ worker |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm setup` | Install + generate + push + seed (one command) |
| `pnpm infra:up` | Start Docker services (Postgres + Redis) |
| `pnpm infra:down` | Stop Docker services |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Seed demo workspace |
| `pnpm db:studio` | Open Prisma Studio |

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/liberation_os?schema=public
REDIS_URL=redis://127.0.0.1:6379
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# AI — optional, system uses offline fallbacks without a key
OPENAI_API_KEY=

# Integrations — optional
WORDPRESS_API_URL=
WORDPRESS_USERNAME=
WORDPRESS_APP_PASSWORD=
BUFFER_ACCESS_TOKEN=
```

## How It Works

```
User Goal (plain text)
    │
    ▼
Goal Interpreter → StructuredGoal (type, niche, platforms, quantity)
    │
    ▼
Planner → WorkflowPlan (ordered steps with agent assignments)
    │
    ▼
Agent Registry → executes each step sequentially
    │  ├── viral.generate-pillars
    │  ├── viral.generate-hooks
    │  ├── viral.generate-scripts
    │  ├── viral.generate-captions
    │  ├── viral.generate-schedule
    │  └── viral.compose-drafts
    ▼
Content Drafts → stored in PostgreSQL
    │
    ▼
Human Review → approve / publish / revert
    │
    ▼
Publishing → WordPress, Buffer (integrations)
```

## Database Schema

9 models: **User**, **Workspace**, **Project**, **WorkflowRun**, **WorkflowStep**, **ContentItem**, **PublishJob**, **IntegrationConnection**, **AnalyticsRecord**

Key enums:
- `WorkflowStatus`: pending → running → waiting_review → completed / failed
- `ContentStatus`: draft → approved → scheduled → published

## License

MIT
