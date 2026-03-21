# LiberationOS Product Requirements Document (PRD)

## 1) Product Summary

**Name:** LiberationOS  
**Tagline:** Enter a goal. Get the business executed.

LiberationOS is an AI operator platform that converts business goals into structured workflows, generates assets, routes deliverables for human review, and can publish through integrations.

## 2) Problem Statement

Current AI tools produce ideas but rely on users to manually orchestrate execution across multiple tools and repetitive prompts.

Users want:
- one command
- finished output
- automated follow-through

## 3) Product Thesis

A vertical AI agent platform for creators, affiliates, solopreneurs, and small businesses can outperform generic chat interfaces by focusing on end-to-end execution.

## 4) Primary Users

1. Faceless content creators
2. Affiliate marketers
3. Small business owners
4. Solo founders
5. Agencies serving SMB clients

## 5) MVP Scope

### Pack A: Viral Content Engine
- Inputs: niche, platform(s), tone, frequency, audience
- Outputs: strategy, ideas, scripts, captions, hooks, posting calendar, optional scheduling

### Pack B: Affiliate Site Autopilot
- Inputs: niche, monetization model, domain, cadence, affiliate programs
- Outputs: niche map, site structure, keyword clusters, article briefs, full drafts, metadata, internal links, optional publishing queue

### Pack C: Multi-Platform Social Scheduler
- Inputs: product/service, channels, campaign goal, CTA, duration
- Outputs: campaign calendar, platform rewrites, batch schedule, analytics labels, optional Buffer/social publishing

## 6) Functional Requirements

- Goal intake form accepts freeform user objective + constraints
- Goal interpreter converts freeform text into typed goal object
- Planner generates executable steps with dependencies
- Orchestrator runs steps, tracks statuses, retries failures
- Specialist agents produce structured outputs per step
- Review queue supports approve/edit/regenerate actions
- Publish queue supports integrations and scheduling
- Audit log stores all inputs, outputs, and step state transitions

## 7) Non-Functional Requirements

- Strong typing across services
- Queue-based async execution for long-running jobs
- Provider-agnostic AI abstraction
- Schema-first validation (Zod) for model outputs
- Secure credential handling for integration secrets
- Human-in-the-loop publishing controls
- Production-minded observability and retry policies

## 8) Core Data Models

- User
- Workspace
- Project
- WorkflowRun
- WorkflowStep
- ContentItem
- PublishJob
- IntegrationConnection
- AnalyticsRecord

## 9) API Surface (MVP)

### Projects
- `POST /api/projects`
- `GET /api/projects/:id`
- `GET /api/projects`

### Workflow
- `POST /api/projects/:id/run`
- `GET /api/workflows/:id/status`
- `POST /api/workflows/:id/retry-step`

### Content
- `GET /api/projects/:id/content`
- `PATCH /api/content/:id`
- `POST /api/content/:id/approve`
- `POST /api/content/:id/regenerate`

### Publish
- `POST /api/publish/:contentId`
- `POST /api/publish/bulk`
- `GET /api/publish/jobs`

### Integrations
- `POST /api/integrations/wordpress/connect`
- `POST /api/integrations/buffer/connect`
- `GET /api/integrations`

### Analytics
- `GET /api/analytics/project/:id`
- `POST /api/analytics/import`

## 10) UX Surface (MVP)

- Landing page with CTA and use-case cards
- Dashboard (projects, runs, outputs, metrics)
- New goal wizard
- Project detail page with workflow timeline
- Content review UI with bulk actions
- Integrations settings page
- Analytics page

## 11) Phased Delivery

### Phase 1
- Auth, dashboard, goal interpreter, planner
- Three workflow packs
- Content generation, review queue, status tracking
- WordPress export/queue + Buffer adapter

### Phase 2
- Analytics ingestion
- Performance-informed regeneration
- Brand voice memory and deduplication
- Prompt versioning and bulk operations

### Phase 3
- Multi-workspace and team roles
- Template marketplace and niche packs
- Autonomous optimization and revenue attribution

## 12) Guardrails

- Validate all LLM outputs against schemas
- Flag uncertain outputs
- Prevent duplicate content generation
- Enforce platform constraints
- Require manual approval before publish (configurable)
- Encrypt integration secrets
- Rate-limit generation endpoints

## 13) Monetization

- **Starter:** limited projects/assets, export only
- **Pro:** unlimited projects, scheduling, publishing, analytics loop
- **Agency:** multi-workspace, client dashboards, bulk + white-label tooling

## 14) Positioning

> LiberationOS is a do-it-for-me AI business operating system that turns goals into execution. Instead of giving users ideas, it builds plans, generates assets, queues deliverables, and helps publish real business outputs across content, affiliate, and growth workflows.
