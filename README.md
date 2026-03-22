# LiberationOS

**AI that turns business goals into review-ready content pipelines. No magic, just reliable agents + you.**

LiberationOS is an AI-powered system that transforms plain-English business goals into fully executed workflows. Describe what you want — viral content, an affiliate site, a social campaign — and the engine interprets your intent, builds a multi-step agent pipeline, generates all the deliverables, and hands you polished drafts ready for review and publishing.

> **Reality Check**
>
> LiberationOS does **NOT** magically run your entire business. It excels at content-heavy workflows (viral posts, affiliate articles, social calendars). It generates drafts, schedules, outlines, and assets. **You** review, approve, and publish. Full business execution (traffic, sales, customer service, legal) still requires your brain + other tools.

---

## What It Actually Delivers

**Example input:**
> "Launch a viral TikTok campaign for my keto supplements"

**Example output:**
- 30 hooks (one-liner attention grabbers per content pillar)
- 15 scripts (short-form video scripts with CTA)
- Captions with hashtags for every post
- A posting schedule spread across weeks
- Composed drafts ready for Buffer / WordPress publishing
- *(If you extend agents)* Canva-style thumbnail briefs

**What it does NOT do:**
- Post for you automatically (yet) — you click "Publish" or connect Buffer
- Run ads, answer DMs, or manage customer service
- File taxes or handle legal compliance
- Rank on Google without your SEO tweaks
- Browse the web, make purchases, or take autonomous actions

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
| AI | OpenAI SDK + OpenAI-compatible local endpoints (Ollama, LM Studio) with offline fallbacks |
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
OPENAI_MODEL=gpt-4.1-mini

# Optional: OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, etc.)
# If OPENAI_BASE_URL (or LLM_BASE_URL) is set, local models are used.
# LOCAL_LLM_API_KEY is optional for providers that require a token.
OPENAI_BASE_URL=
LLM_BASE_URL=
LOCAL_LLM_MODEL=
LOCAL_LLM_API_KEY=

# Integrations — optional
WORDPRESS_API_URL=
WORDPRESS_USERNAME=
WORDPRESS_APP_PASSWORD=
BUFFER_ACCESS_TOKEN=
```

## How It Works

> **Every output passes through human review. This is non-negotiable by design.**

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
┌──────────────────────────────────────────┐
│  HUMAN REVIEW (required)                 │
│  You approve, edit, or reject every item │
│  Nothing publishes without your sign-off │
└──────────────────────────────────────────┘
    │
    ▼
Publishing → WordPress, Buffer (integrations)
```

## Offline Mode Warning

LiberationOS works **without an OpenAI API key** using built-in heuristic templates. Here's what offline mode actually produces:

| Step | With OpenAI | Offline Fallback |
|------|-------------|-----------------|
| Goal Interpretation | GPT-parsed structured goal | Keyword-based heuristic extraction |
| Content Pillars | AI-generated thematic pillars | Generic pillar templates based on niche string |
| Hooks | GPT-crafted attention grabbers | Numbered placeholder hooks (`"#1: [niche] idea that stops the scroll"`) |
| Scripts | Full short-form video scripts | Template scripts with pillar/hook insertion |
| Captions | Platform-optimized captions with hashtags | Generic caption templates per platform |
| Schedule | AI-optimized posting times | Evenly spaced time slots across days |
| Articles | Full SEO-optimized articles | Outline stubs with section headers |

**Bottom line:** Offline mode is functional for development and testing, but production-quality content requires an OpenAI key (or extending `ai-core` to support another LLM provider).

## Local LLM Setup (Ollama / LM Studio)

LiberationOS supports any OpenAI-compatible chat endpoint.

### Option A — Ollama

1. Start Ollama and pull a model:

```bash
ollama pull llama3.1:8b
ollama serve
```

2. Set env vars:

```env
OPENAI_BASE_URL=http://127.0.0.1:11434/v1
LOCAL_LLM_MODEL=llama3.1:8b
# Optional for local gateways that require auth
LOCAL_LLM_API_KEY=
```

### Option B — LM Studio

1. Start the local server in LM Studio (OpenAI-compatible API mode).

2. Set env vars:

```env
OPENAI_BASE_URL=http://127.0.0.1:1234/v1
LOCAL_LLM_MODEL=<your-loaded-model-id>
LOCAL_LLM_API_KEY=lm-studio
```

Notes:

- `OPENAI_API_KEY` is not required when using `OPENAI_BASE_URL` or `LLM_BASE_URL`.
- If no key/base URL is configured, the project automatically uses offline heuristic fallbacks.

## Current Limitations

- **No autonomous posting** — integrations (WordPress, Buffer) are available but require manual connection and explicit publish actions
- **No web browsing or scraping** — agents generate content from prompts, they don't research live data
- **No ad management** — doesn't create, optimize, or manage paid advertising
- **No SEO ranking** — generates SEO-friendly content but doesn't submit sitemaps, build backlinks, or monitor rankings
- **No authentication system** — the current build uses a single demo workspace; multi-user auth is not yet implemented
- **No autonomous purchasing** — cannot buy domains, hosting, or services on your behalf
- **Analytics package is scaffolded** — tracks schema but doesn't yet collect or display real metrics
- **Integration adapters are stubs** — WordPress and Buffer adapters exist but need real credentials and testing against live APIs

## Database Schema

9 models: **User**, **Workspace**, **Project**, **WorkflowRun**, **WorkflowStep**, **ContentItem**, **PublishJob**, **IntegrationConnection**, **AnalyticsRecord**

Key enums:
- `WorkflowStatus`: pending → running → waiting_review → completed / failed
- `ContentStatus`: draft → approved → scheduled → published

## License

MIT
