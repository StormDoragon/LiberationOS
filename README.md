# LiberationOS

> **Tagline:** Enter a goal. Get the business executed.

LiberationOS is a do-it-for-me AI business operating system that turns goals into execution. Instead of giving users ideas, it builds plans, generates assets, queues deliverables, and helps publish real business outputs across content, affiliate, and growth workflows.

## What this repository contains

This repository currently ships a **Codex-ready product blueprint bundle** to guide iterative implementation:

- Product requirements document: `docs/PRD.md`
- System architecture specification: `docs/SYSTEM_ARCHITECTURE.md`
- Codex build master prompt: `docs/CODEX_MASTER_PROMPT.md`
- Environment variable template: `.env.example`

## Product promise

- **Input:** a business goal in natural language
- **Output:** structured workflow plan + executable actions

Examples:

- “Post 30 viral TikToks for my faceless page”
- “Run my affiliate site for coffee makers”
- “Create and schedule 14 days of content for Instagram + X + Facebook”

## MVP execution packs

1. Viral Content Engine
2. Affiliate Site Autopilot
3. Multi-Platform Social Scheduler

## Recommended stack (implementation target)

- Monorepo: pnpm + Turborepo
- Frontend: Next.js + TypeScript + Tailwind + shadcn/ui
- Backend: Node/TypeScript API layer
- Data: PostgreSQL + Prisma
- Async jobs: Redis + BullMQ worker
- AI layer: provider abstraction with structured JSON + Zod validation

## Suggested next step

Use the master prompt in `docs/CODEX_MASTER_PROMPT.md` to scaffold the first implementation pass, then merge by epics.
