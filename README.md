# LiberationOS Phase 3 Scaffold

This repo snapshot adds a functional Phase 3 foundation:

- Prisma database layer
- project creation API
- workflow runs and step persistence
- multi-agent registry
- generated content draft persistence
- project dashboard and detail pages
- worker scaffold for BullMQ

## What works now

1. Create a project from the home page or `POST /api/projects`
2. Open a project detail page
3. Run the workflow from the UI or `POST /api/projects/:id/run`
4. Persist workflow steps and generated content drafts in PostgreSQL

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm --filter @liberation-os/db seed
pnpm dev
```

Start the optional worker separately:

```bash
pnpm worker
```

## Notes

The web app currently runs project workflows directly through the API route for an easier local demo path. The BullMQ worker scaffold is included so the next phase can shift execution fully into background jobs.
