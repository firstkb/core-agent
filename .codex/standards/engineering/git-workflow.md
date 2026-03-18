# Git Workflow Standard

## Branch naming

Use `codex/<type>/<short-description>`.

Examples:

- `codex/feat/design-rules-refresh`
- `codex/fix/design-status-handoff`
- `codex/docs/standards-catalog-update`

## Commit discipline

1. Keep commits atomic.
2. Keep the repository buildable or testable at each commit.
3. Avoid WIP commits in shared history.

## Before commit

1. Run relevant tests.
2. Run lint or format checks if configured.
3. Review staged and unstaged diff.

## Pull request guidance

1. Keep changes focused.
2. Prefer small or medium PRs over large mixed changes.
3. Do not merge without review.
4. Do not force-push shared protected branches.
