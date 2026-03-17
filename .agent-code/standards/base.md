# Base Standards

These standards apply to every agent and skill in this stack.

1. Use `.agent-code/` as the source of truth for contracts, templates, prompts, and standards.
2. Treat generated runtime files in `.cursor/`, `.codex/`, `.agents/`, and `AGENTS.md` as adapters. Do not hand-edit them unless you intend to regenerate them immediately.
3. Persist module, feature, and stage artifacts in English.
4. Keep system agent names stable and machine-oriented. Current system agents:
   - `module_orchestrator`
   - `research_codebase`
5. Keep skill nicknames stable and human-oriented. Current nicknames:
   - `maestro`
   - `charlie`
6. Prefer validation over prose whenever a contract or status sidecar exists.
7. Do not expand the runtime surface casually. New agents or skills must first land in `.agent-code/`.
