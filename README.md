# LiberationOS

LiberationOS is a workflow system that turns business goals into review-ready content drafts. It helps teams go from a plain-language goal to structured plans, generated assets, and an approval queue.

> Human review is required by design. LiberationOS generates drafts; people approve and publish.

---

## What You Get

Given a goal like **"Launch a viral TikTok campaign for my keto supplements"**, LiberationOS can generate:

- content pillars
- hook ideas
- short-form scripts
- captions + hashtags
- posting schedule
- composed drafts for review

It does **not** replace operations such as ads management, customer support, legal/compliance, or autonomous purchasing.

## Core Capabilities

- **Goal interpretation**: plain text goal → structured workflow input
- **Workflow packs**:
  - Viral content engine
  - Affiliate content pipeline
  - Social campaign scheduler
- **Modular agent registry** for step-by-step execution
- **Persistent project state** with PostgreSQL + Prisma
- **Review workflow** for approve/reject/publish actions
- **Optional async processing** with BullMQ workers
- **Offline fallback mode** when no external LLM is configured

## Tech Stack

- **Frontend/API**: Next.js 15, React 19, TypeScript
- **Data**: PostgreSQL 16, Prisma 6
- **Queue**: Redis 7, BullMQ
- **AI**: OpenAI SDK + OpenAI-compatible endpoints
- **Monorepo**: pnpm workspaces + Turborepo
- **Infra**: Docker Compose

## Repository Layout

```txt
apps/
  web/              Next.js dashboard + API routes
  worker/           BullMQ job processor

packages/
  agent-packs/      workflow agents
  ai-core/          LLM client + generation logic
  analytics/        analytics schemas and utilities
  db/               Prisma schema and data access
  integrations/     WordPress / Buffer adapters
  prompts/          prompt templates
  types/            shared TypeScript types
  ui/               shared React UI components
  utils/            shared helpers
  workflow-engine/  orchestration and execution engine
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker + Docker Compose

### Setup

```bash
git clone https://github.com/StormDoragon/LiberationOS.git
cd LiberationOS
pnpm install
cp .env.example .env
pnpm infra:up
pnpm setup
```

### Run

```bash
pnpm dev:web
pnpm dev:worker   # optional
```

## Key Scripts

- `pnpm dev` – run apps in parallel
- `pnpm build` – build all packages
- `pnpm lint` – lint workspace
- `pnpm typecheck` – run TypeScript checks
- `pnpm infra:up` / `pnpm infra:down` – start/stop Postgres + Redis
- `pnpm db:generate` / `pnpm db:push` / `pnpm db:seed` – database lifecycle

## API Overview

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects/:id/run`
- `POST /api/projects/:id/approve-all`
- `POST /api/run`
- `PATCH /api/content/:id`

## Environment (minimum)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/liberation_os?schema=public
REDIS_URL=redis://127.0.0.1:6379
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Optional OpenAI-compatible local endpoints:

- `OPENAI_BASE_URL`
- `LLM_BASE_URL`
- `LOCAL_LLM_MODEL`
- `LOCAL_LLM_API_KEY`

## Current Constraints

- no autonomous posting (manual approval/publish)
- no live browsing/scraping
- no paid ads management
- no built-in multi-user auth yet
- integrations require real credentials and validation

## License

MIT
