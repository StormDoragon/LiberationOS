# Contributing to LiberationOS

Thanks for contributing.

## Ways to Contribute

- Report bugs with clear reproduction steps.
- Propose features with acceptance criteria.
- Pick issues labeled `good first issue` or `help wanted`.
- Improve docs, tests, and developer experience.

## Before You Start

- Search existing issues and pull requests first.
- For larger changes, open an issue to align scope before coding.
- Keep pull requests focused on one change.

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start local infrastructure:

```bash
pnpm infra:up
```

3. Configure env:

```bash
cp .env.example .env
```

4. Set up the database:

```bash
pnpm setup
```

5. Run apps:

```bash
pnpm dev:web
pnpm dev:worker
```

## Development Workflow

1. Create a branch:

```bash
git checkout -b feat/short-description
```

2. Make changes with small, clear commits.
3. Run checks before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Pull Request Guidelines

- Use clear titles and describe the user impact.
- Reference issues with `Closes #123` when applicable.
- Update docs and tests when behavior changes.
- Follow the PR checklist in `.github/pull_request_template.md`.

## Commit Style

Prefer conventional commits, for example:

- `feat(ai-core): add local endpoint support`
- `fix(web): handle empty integrations state`
- `docs: update setup instructions`

## Good First Issues

A small starter label set is provided in `.github/labels.yml`.

Recommended first tasks usually have one of these patterns:

- docs cleanup
- small UI copy improvements
- test additions for existing behavior
- refactors with no behavior changes

## Code Style

- TypeScript first.
- Keep functions small and composable.
- Avoid unrelated refactors in the same pull request.
- Preserve existing APIs unless change is intentional and documented.

## Need Help?

If an issue is unclear, ask clarifying questions in the issue thread before implementing.
