# Shared Agent Code

`.agent-code/` is the only place where contracts, templates, prompts, standards, and render templates should be edited by hand.

Generated files elsewhere in the repo are adapters:

- `AGENTS.md`
- `.agents/skills/*`
- `.cursor/agents/*`
- `.cursor/rules/*`
- `.codex/agents/*`
- `.codex/config.toml`

If a generated adapter drifts, update `.agent-code/` and rerender through `.agent-cli/`.
