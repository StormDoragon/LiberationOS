# LiberationOS

Enter a goal. Get execution.

This scaffold is a production-minded monorepo starter for a do-it-for-me AI business execution platform.

## Included

- Next.js web app scaffold
- Worker scaffold
- Prisma schema
- Typed workflow engine
- AI provider abstraction
- Starter agent packs
- Integration adapters for WordPress and Buffer
- GitHub Actions CI
- Core docs

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

## Monorepo

- `apps/web` UI and API routes
- `apps/worker` async job processor
- `packages/*` shared libraries
- `prisma` root schema mirror
- `docs` architecture and workflow notes
