# LiberationOS Repository Checkup Report

**Date:** 2026-06-05  
**Repository:** `/workspace/LiberationOS`  
**Scope:** Static repository review, configuration review, dependency/install surface review, and runnable checks available in the current environment.

> **Notion delivery note:** The request asked for this report to be put on Notion via the provided computer-use mention. This environment did not expose an interactive Notion/computer-use tool to the agent, so the report has been committed as a Markdown document that can be pasted/imported into Notion.

## Executive Summary

LiberationOS is a TypeScript monorepo for an AI-assisted content workflow platform. The product direction is clear: a Next.js dashboard and API, a BullMQ worker, Prisma/PostgreSQL persistence, Redis-backed async execution, workflow-agent packages, and integration adapters.

The repository is promising, but it is not currently in a reliably reproducible or production-ready state. The highest-priority issues are package-management inconsistency, CI/check failures caused by the missing `pnpm-lock.yaml`, a broken Prisma schema sync check, absent authentication/authorization on sensitive API routes, plaintext integration credential storage, and minimal real test/lint coverage.

## Health Scorecard

| Area                  | Rating            | Notes                                                                                                            |
| --------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Product clarity       | Good              | README and docs explain the intended workflows and boundaries well.                                              |
| Architecture          | Fair              | Monorepo boundaries are understandable, but there are duplicate workflow paths and partial implementations.      |
| Build reproducibility | Poor              | Repo declares pnpm, ignores `pnpm-lock.yaml`, tracks `package-lock.json`, and local checks try to download pnpm. |
| Test coverage         | Poor              | Package `test` scripts are mostly placeholder `echo` commands.                                                   |
| Type safety           | Unknown / blocked | Typecheck could not complete because package-manager setup is broken in this environment.                        |
| Security posture      | Needs urgent work | No auth guard on project/content/integration APIs; integration credentials are stored as JSON.                   |
| Deployment readiness  | Fair              | Docker Compose files exist, but Docker was unavailable in this environment and migration strategy is mixed.      |
| Documentation         | Good              | README and docs are useful, though some operational docs conflict with repo state.                               |

## Repository Overview

### Monorepo layout

- `apps/web`: Next.js application, dashboard pages, API routes, project/content review UI.
- `apps/worker`: BullMQ worker entrypoint and queue processor.
- `packages/db`: Prisma schema, Prisma client wrapper, demo seed.
- `packages/workflow-engine`: project creation, workflow planning/execution, queue orchestration, trace support.
- `packages/ai-core`: goal interpretation, deterministic generators, OpenAI/local-compatible client wrappers.
- `packages/agent-packs`: workflow agents for viral content, affiliate site, social scheduling, and tool-calling agents.
- `packages/integrations`: Buffer, WordPress, Twitter/X, Instagram, Shopify, email publishing adapters.
- `packages/types`, `packages/ui`, `packages/utils`, `packages/prompts`, `packages/analytics`: shared primitives and support packages.

### Technology declared

- Next.js 15 / React 19.
- TypeScript strict mode.
- Prisma 6 / PostgreSQL.
- Redis / BullMQ.
- OpenAI SDK with offline fallbacks.
- pnpm workspaces and Turborepo.
- Docker Compose for local infrastructure and production stack.

## Checks Run

| Check                                                                          | Result                           | Details                                                                                                                                    |
| ------------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm --version && node --version && pnpm lint && pnpm typecheck && pnpm test` | Blocked                          | Corepack attempted to fetch `pnpm@10.0.0` from npm and failed behind the environment network/proxy.                                        |
| `npm run lint`                                                                 | Failed / blocked                 | Turborepo launched package scripts through pnpm because `packageManager` is pnpm; pnpm was unavailable.                                    |
| `npm run typecheck`                                                            | Failed / blocked                 | Same pnpm/Corepack failure as lint.                                                                                                        |
| `npm test`                                                                     | Failed / blocked                 | Same pnpm/Corepack failure as lint.                                                                                                        |
| `node scripts/check-prisma-schema-sync.mjs`                                    | Failed                           | Script expects `prisma/schema.prisma`, but the repo only contains `packages/db/prisma/schema.prisma`.                                      |
| `docker compose config`                                                        | Blocked                          | Docker CLI is not installed in this environment.                                                                                           |
| `docker compose -f docker-compose.prod.yml config`                             | Blocked                          | Docker CLI is not installed in this environment.                                                                                           |
| `npm audit --omit=dev --json`                                                  | Passed for installed root subset | Reported 0 vulnerabilities, but only the installed npm root subset was available, not the full intended workspace dependency graph.        |
| `git ls-files` artifact scan                                                   | Warning                          | Tracked generated/archive artifacts include `apps/web/tsconfig.tsbuildinfo`, `liberation-os-phase3.zip`, and `liberation-os-scaffold.zip`. |

## Critical Findings

### 1. Package management is inconsistent and blocks verification

**Severity:** Critical  
**Evidence:** The root package declares `packageManager: pnpm@10.0.0`, scripts use pnpm in setup and app commands, and `pnpm-workspace.yaml` exists. However, `.gitignore` ignores `pnpm-lock.yaml`, and the committed lockfile is `package-lock.json`.

**Impact:**

- Fresh installs are not reproducible for the declared package manager.
- CI uses `pnpm install --frozen-lockfile=false`, which weakens dependency determinism.
- Turborepo warns that it cannot find `pnpm-lock.yaml` and then attempts to run package tasks through pnpm.
- In environments where Corepack cannot fetch pnpm, lint/typecheck/test cannot start.

**Recommended fix:**

1. Commit a generated `pnpm-lock.yaml`.
2. Remove `pnpm-lock.yaml` from `.gitignore`.
3. Remove `package-lock.json` unless the project intentionally switches to npm.
4. Change CI to `pnpm install --frozen-lockfile` after the lockfile is committed.
5. Pin Node version in `.nvmrc` or `.node-version` to match CI/Docker expectations.

### 2. Prisma schema sync script is currently broken

**Severity:** Critical  
**Evidence:** `scripts/check-prisma-schema-sync.mjs` reads `prisma/schema.prisma` and `packages/db/prisma/schema.prisma`, but no root `prisma/schema.prisma` exists.

**Impact:**

- The documented `pnpm db:schema:check` command fails immediately.
- Any CI gate that adds this script will fail.
- The previous commit history suggests this was intended to enforce a root schema mirror, but the mirror is absent now.

**Recommended fix:**

- Either restore `prisma/schema.prisma` as a committed mirror or update the script to treat `packages/db/prisma/schema.prisma` as canonical and remove the root comparison.

### 3. Sensitive API routes have no authentication or authorization guard

**Severity:** Critical  
**Evidence:** API handlers for projects, content status updates, queued runs, and integrations accept requests directly and operate on supplied IDs/workspace IDs.

**Examples:**

- `GET /api/projects` returns projects with no caller check.
- `POST /api/projects` creates projects from arbitrary JSON.
- `PATCH /api/content/:id` changes review status by content ID only.
- `GET/POST /api/integrations` lists and stores integration credentials using a caller-supplied `workspaceId`.
- `DELETE /api/integrations/:id` deletes by integration ID only.

**Impact:**

- Any network-reachable deployment could leak project metadata and content.
- Attackers could alter content states or trigger publish flows.
- Attackers could create/update/delete integration connections if they know or guess workspace IDs/connection IDs.

**Recommended fix:**

1. Add an authentication layer before enabling public deployment.
2. Derive workspace/user scope from the authenticated session, not request body/query params.
3. Add authorization checks to every route that reads or mutates project, content, run, publish job, or integration resources.
4. Return generic errors for missing resources to avoid ID probing.

### 4. Integration credentials are stored as plaintext JSON

**Severity:** Critical  
**Evidence:** The Prisma `IntegrationConnection` model stores `credentials Json`, and the integrations API writes request credentials directly into that field after JSON serialization.

**Impact:**

- Database compromise exposes third-party publishing tokens and app passwords.
- Application logs/debug tooling may accidentally expose credential JSON.
- Compliance posture is weak for any real customer or production usage.

**Recommended fix:**

- Encrypt credentials at rest using an application-managed key or KMS.
- Store only encrypted payloads plus metadata needed for selection.
- Rotate existing test credentials and document local-only usage.
- Add validation per provider so unexpected secret fields are rejected.

### 5. Real test coverage is effectively absent

**Severity:** High  
**Evidence:** Most package `test` scripts are placeholder `echo no tests ...` commands.

**Impact:**

- CI can report success without validating behavior.
- Critical workflow, publishing, schema, and API regressions are likely to slip through.

**Recommended fix:**

Start with high-value tests:

1. Unit tests for `interpretGoal`, `planWorkflow`, `generateSchedule`, and content normalization.
2. API route tests for validation and auth/authorization behavior.
3. Integration adapter tests using mocked fetch responses.
4. Worker tests for successful and failed job transitions.
5. Prisma tests against a throwaway database or Testcontainers once Docker is available in CI.

## High-Priority Findings

### 6. Duplicate workflow execution paths can diverge

**Severity:** High  
**Evidence:** `packages/workflow-engine/src/runner.ts` implements a planned multi-step runner for general workflow execution, while `packages/workflow-engine/src/projects.ts` implements a separate queued path that calls `runWorkflow(goal)` and manually creates only two workflow steps.

**Impact:**

- Sync and async runs may produce different steps, statuses, artifacts, and content shapes.
- Fixes to one path may not apply to the other.
- Observability and trace behavior may differ across API paths.

**Recommended fix:**

- Make the queued worker invoke the same plan/registry runner used by the synchronous project run path, passing project/run IDs as inputs.
- Keep one content normalization path and one status transition strategy.

### 7. Workflow runs may be marked completed while projects wait for review

**Severity:** Medium / High  
**Evidence:** In the runner, workflow runs are updated to `completed`, then the project is updated to `waiting_review`.

**Impact:**

- This may be intentional, but it creates ambiguity because the schema also includes `waiting_review` as a workflow status.
- UI/API consumers may need custom logic to infer “run finished but project awaits review.”

**Recommended fix:**

- Define status semantics explicitly. If a generated run awaits review, consider setting both run and project to `waiting_review`, or remove `waiting_review` from run-level status if not used.

### 8. Lack of input schemas on several API routes

**Severity:** High  
**Evidence:** Several routes parse `request.json()` and cast the body to expected TypeScript shapes without runtime validation.

**Impact:**

- Invalid input can cause 500s instead of helpful 400s.
- Malformed credential payloads may be persisted.
- Queue payloads and project creation can accept unexpected fields.

**Recommended fix:**

- Use Zod schemas for every API route body/query/param.
- Validate status enums and provider names using shared constants from `packages/types`.
- Add maximum lengths for goals, titles, content bodies, metadata, and credential blobs.

### 9. Prisma model lacks cascade behavior and useful indexes

**Severity:** High  
**Evidence:** The schema defines relations among users, workspaces, projects, runs, steps, content, and publish jobs, but no explicit indexes or cascade deletion behavior.

**Impact:**

- Deleting parent records may fail or leave operational cleanup ambiguous.
- Common queries by `workspaceId`, `projectId`, `workflowRunId`, and `contentItemId` may degrade as data grows.

**Recommended fix:**

- Add indexes for foreign keys and common filters/orderings.
- Decide and encode cascade behavior for workspace/project/run/content deletion.
- Add uniqueness where the app assumes it, such as one integration per provider per workspace.

### 10. Production Docker image installs from the whole working tree

**Severity:** Medium / High  
**Evidence:** The Dockerfile copies the whole repo, runs `pnpm install --no-frozen-lockfile`, and builds selected apps.

**Impact:**

- Builds are slower and less reproducible.
- Local artifacts can affect build context if not excluded.
- `--no-frozen-lockfile` allows dependency drift.

**Recommended fix:**

- Commit the pnpm lockfile and use `pnpm install --frozen-lockfile`.
- Use a multi-stage build with dependency pruning.
- Ensure `.dockerignore` excludes local archives, generated build info, `.next`, `.turbo`, coverage, and node_modules.

## Medium-Priority Findings

### 11. Generated/archive files are tracked

**Severity:** Medium  
**Evidence:** Tracked files include `apps/web/tsconfig.tsbuildinfo` and two zip archives.

**Impact:**

- Unnecessary churn in commits.
- Larger repository than needed.
- Potential accidental inclusion of generated or stale code snapshots.

**Recommended fix:**

- Remove generated/archive files from git unless intentionally distributed.
- Add `*.tsbuildinfo` and `*.zip` to `.gitignore` if not required.

### 12. Placeholder lint scripts reduce CI value

**Severity:** Medium  
**Evidence:** Many package lint scripts are `echo lint ...`, and `apps/web` uses `next lint`, which may be incompatible with newer Next.js workflows depending on version.

**Impact:**

- CI does not consistently lint package code.
- Style and correctness issues can accumulate.

**Recommended fix:**

- Add a shared ESLint config for all TypeScript packages.
- Replace placeholder lint scripts with real `eslint` invocations.
- Consider `eslint .` for `apps/web` if `next lint` is deprecated or unavailable in the installed Next version.

### 13. Offline AI behavior is helpful but narrow

**Severity:** Medium  
**Evidence:** `generateJSON` has deterministic fallback behavior when no API key exists, but fallback dispatch is based on prompt substrings.

**Impact:**

- Minor prompt changes can break offline behavior.
- Testability depends on exact prompt text.

**Recommended fix:**

- Move offline generator selection behind typed functions instead of prompt substring detection.
- Add tests for no-key/local-key/OpenAI-key modes.

### 14. Tool-calling fallback auto-runs the first tool

**Severity:** Medium  
**Evidence:** `callWithTools` invokes the first tool with `{}` when no API key exists.

**Impact:**

- Offline mode may trigger unintended behavior for tools if a tool handler has side effects.
- Publishing/image/SEO workflows could behave unexpectedly during local demos.

**Recommended fix:**

- Make offline tool calls opt-in.
- Return a dry-run response by default unless the tool is explicitly marked safe.

### 15. Observability is basic

**Severity:** Medium  
**Evidence:** Trace recorder exists, but logging uses simple console wrappers and API routes do not include request IDs or structured error logging consistently.

**Impact:**

- Production troubleshooting will be difficult.
- Workflow failures may lack enough context.

**Recommended fix:**

- Add request ID propagation from API to workflow context.
- Emit structured JSON logs in production.
- Persist trace summaries consistently across sync and async paths.

## Positive Findings

- The README clearly states what the product does and does not do, which helps avoid overpromising automation.
- The monorepo package boundaries are easy to understand.
- The Prisma schema captures the core domain entities needed for projects, runs, workflow steps, content, publish jobs, integrations, and analytics.
- The readiness route checks both database and Redis availability.
- The publishing helper enforces approved/scheduled status before publishing and checks that a selected integration belongs to the content item workspace.
- Integration responses scrub credentials before returning connections from the API.
- Offline fallback generation makes demos possible without an OpenAI API key.

## Recommended Remediation Plan

### Phase 0: Make the repo verifiable

1. Commit `pnpm-lock.yaml` and stop ignoring it.
2. Remove or intentionally keep `package-lock.json`; do not keep both unless documented.
3. Fix `scripts/check-prisma-schema-sync.mjs` or restore the root schema mirror.
4. Make `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` run cleanly on a fresh checkout.
5. Add `.node-version` or `.nvmrc` for Node 22 to match CI/Docker.

### Phase 1: Close security gaps

1. Add authentication/session handling.
2. Scope all project/content/integration operations to the authenticated workspace/user.
3. Encrypt integration credentials at rest.
4. Add API request schemas and response-safe errors.
5. Add rate limiting or abuse protection to queue-triggering endpoints.

### Phase 2: Consolidate workflow execution

1. Use one runner implementation for sync and queued execution.
2. Standardize run/project status transitions.
3. Persist artifacts/traces in a single format.
4. Add worker retry/idempotency tests.

### Phase 3: Add meaningful tests and CI gates

1. Unit-test planner, generators, content normalization, publish helper, queue options, and validation schemas.
2. Add route tests for happy path, invalid input, unauthenticated, unauthorized, and missing-resource behavior.
3. Add integration adapter tests with mocked `fetch`.
4. Add a minimal E2E smoke test that creates a project and generates draft content using offline fallback.
5. Require lint/typecheck/test/build in CI with a frozen lockfile.

### Phase 4: Production hardening

1. Optimize Dockerfile and use frozen installs.
2. Add migrations instead of relying on `db push` for production.
3. Add indexes/cascades to Prisma schema.
4. Add structured logs, metrics, and health/readiness docs.
5. Add a secrets-management guide for deployment.

## Suggested Issue Backlog

1. **Critical:** Normalize package manager and commit pnpm lockfile.
2. **Critical:** Fix Prisma schema sync script/root schema mirror.
3. **Critical:** Add auth middleware and workspace authorization to API routes.
4. **Critical:** Encrypt `IntegrationConnection.credentials`.
5. **High:** Replace placeholder tests with actual unit tests for workflow planning and content generation.
6. **High:** Consolidate queued and synchronous workflow execution paths.
7. **High:** Add Zod request validation to all API routes.
8. **Medium:** Add Prisma indexes/cascade strategy.
9. **Medium:** Remove generated/archive artifacts from git.
10. **Medium:** Add structured logging/request IDs.

## Final Assessment

LiberationOS has a strong concept and a coherent initial architecture, but the repo should be treated as an advanced scaffold rather than production-ready software. The immediate priority is making the repository reproducible and verifiable. After that, authentication, authorization, and encrypted credential storage are the most important blockers before any real deployment.
