---
doc_status: archive
doc_scope: maestro_vnext
doc_type: role_archive
lang: en
---

# Current Maestro Skill Archive

This directory contains a frozen copy of the current Maestro runtime entrypoint
before the Maestro vNext redesign is promoted.

Archived sources:

- `.agents/skills/maestro/SKILL.md` -> `skill/SKILL.md`
- `.agents/skills/maestro/agents/openai.yaml` -> `skill/agents/openai.yaml`
- `.agents/skills/maestro/assets/` -> `skill/assets/`
- `.codex/agents/module_orchestrator.toml` -> `module_orchestrator.toml`

Reason:

- Maestro vNext proposes expanding Maestro from module-level orchestration into
  the universal owner-facing orchestration entrypoint.
- The current skill and backed agent config should remain available as an exact
  reference while the new contracts are designed.

This archive is not an active skill and should not be loaded as runtime
instruction.
