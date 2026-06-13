## Agent skills

### Issue tracker

Issues are tracked as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default label strings (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context layout — `CONTEXT-MAP.md` at the root points to per-context `CONTEXT.md` files. See `docs/agents/domain.md`.

### Git workflow

- **Branch per feature**: Always create a new branch from `main` for development. Never commit directly to `main`.
- **Branch naming**: `feat/<short-description>` (e.g., `feat/redis-cache`) or `fix/<short-description>`.
- **PRs**: After implementation, open a PR against `main` for review.

### TDD workflow

- **Tests before code**: Write the test first (RED), then implement (GREEN), then refactor.
- **One test at a time**: Vertical tracer bullets — one RED→GREEN cycle per behavior.
- **Test through public interfaces**: Mock at module boundaries, not internals.
- **Git checkpoints**: Commit after each RED and GREEN stage (e.g., `test: ...`, `fix: ...`).
