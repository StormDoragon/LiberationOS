# Codex Master Prompt

Use the following prompt to scaffold the first production-minded implementation.

```text
You are a senior full-stack engineer and AI systems architect.

Build a production-minded monorepo called "LiberationOS", a do-it-for-me AI business execution platform.

Core concept:
Users enter a business goal in natural language, such as:
- "Post 30 viral TikToks for me"
- "Auto-run my affiliate site"
- "Generate and schedule content across all platforms"

The system should interpret the goal, create a structured workflow plan, run specialist agents, generate outputs, allow human review, and optionally publish through integrations.

Tech requirements:
- Monorepo with pnpm + turbo
- Next.js + TypeScript frontend
- Tailwind + shadcn/ui
- Node/TypeScript backend services
- Prisma + PostgreSQL
- Redis + BullMQ worker for async jobs
- Modular package architecture
- Provider-agnostic AI layer
- Structured JSON outputs validated with Zod
- Clean developer experience and good docs

Repository structure:
- apps/web
- apps/worker
- packages/ui
- packages/db
- packages/types
- packages/prompts
- packages/ai-core
- packages/workflow-engine
- packages/agent-packs
- packages/integrations
- packages/analytics
- packages/utils
- docs
- prisma

Implement these MVP workflow packs:
1. Viral Content Engine
2. Affiliate Site Autopilot
3. Multi-Platform Social Scheduler

Core features:
- auth
- dashboard
- new goal wizard
- project detail page
- workflow run timeline
- review/approve/regenerate content UI
- publish queue
- integrations page
- logs/status tracking

Required backend concepts:
- Goal Interpreter agent
- Workflow Planner
- Specialist agents with shared interface
- Workflow executor
- Step status tracking
- Retry logic
- Audit logging

Data models:
- User
- Workspace
- Project
- WorkflowRun
- WorkflowStep
- ContentItem
- PublishJob
- IntegrationConnection
- AnalyticsRecord

Build:
1. full monorepo scaffold
2. Prisma schema and initial migration
3. shared TypeScript types
4. reusable agent interface
5. provider abstraction for LLM calls
6. starter prompts stored in package files
7. workflow engine
8. viral content workflow
9. affiliate site workflow
10. social scheduling workflow
11. dashboard and review UI
12. WordPress and Buffer integration adapters
13. worker process
14. tests
15. documentation

Code quality requirements:
- strong typing
- separation of concerns
- no giant files if avoidable
- environment variable validation
- useful comments only where needed
- production-minded naming
- minimal but polished UI
- error handling everywhere important

Also include:
- README.md
- .env.example
- sample seed data
- GitHub Actions CI for lint/typecheck/test
- pull request template
- issue templates
- docs explaining how to add a new workflow pack and new agent

When making assumptions, choose practical defaults and keep the architecture extensible.
Return the repository as if it is ready for iterative commits and merging into GitHub.
```
