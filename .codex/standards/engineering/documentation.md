# Documentation Standard

## Inline documentation

Use inline doc comments for:

1. Public or exported APIs.
2. Non-obvious business rules.
3. Complex algorithmic sections.
4. Temporary workarounds with follow-up context.

Skip heavy comments for self-explanatory private helpers.

## Repository docs

When behavior or contracts change, update the nearest authoritative docs in the same change:

1. Relevant skill instructions under `.agents/skills/`.
2. Agent contracts or templates under `.codex/contracts/` and `.codex/templates/`.
3. Relevant standards under `.codex/standards/`.
4. Repo-level guidance in `AGENTS.md`, `README.md`, or `docs/` when the change affects runtime behavior.
