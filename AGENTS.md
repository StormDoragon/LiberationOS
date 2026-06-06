# AGENTS.md - Codex / AI Agent Instructions

## Mandatory Rules (Always Follow)

Before opening any PR:

1. Inspect current repo structure and existing code.
2. Implement the requested changes.
3. Run `pnpm install` if package.json changed.
4. Run `pnpm lint` and fix **all** lint errors.
5. Run `pnpm typecheck` and fix **all** TypeScript errors.
6. Run `pnpm build` and ensure it succeeds.
7. Run `pnpm test` (if tests exist) and fix failures.
8. Do **not** leave TODOs, comments saying "implement later", or placeholder code.
9. Ensure the branch is merge-ready (clean, green CI).

## PR Requirements

Every PR must include in the description:

- What was implemented and why
- Key files changed
- Commands executed + their results
- Any remaining risks or follow-up items

## Security Rule

Never store secrets in code. Always use environment variables for keys.

This file takes precedence over any conflicting instructions.
