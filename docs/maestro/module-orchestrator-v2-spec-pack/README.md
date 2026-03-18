---
doc_status: current
doc_scope: working_set
doc_type: spec_bundle
---

# Module Orchestrator Working Set

This bundle is the compact working reference for the current Maestro control-plane model.

- `minimal-artifact-model.md` — current artifact tree, file responsibilities, and minimal field set.
- `compound-intents.md` — owner-facing compound actions that Maestro should treat as one semantic operation.
- `brief-auditor-contract.md` — live contract for `brief_auditor / Grant` as the optional brief review helper.
- `maestro-pre-launch-readiness.md` — the next hardening phase required to bring Maestro to reference quality up to the first downstream launch.
- `acceptance-suite.md` — canonical live acceptance scenarios and pass criteria for pre-launch Maestro behavior.
- `state-machine.md` — lifecycle model, transition rules, and invariants.
- `cli-command-spec.md` — typed CLI command contract.
- source-of-truth schemas live under:
  - `.codex/contracts/module_orchestrator/*.json`
  - `.codex/contracts/research_codebase/*.json`
  - `.codex/contracts/brief_auditor/*.json`

Recommended reading order:

1. `minimal-artifact-model.md`
2. `compound-intents.md`
3. `brief-auditor-contract.md`
4. `maestro-pre-launch-readiness.md`
5. `acceptance-suite.md`
6. `state-machine.md`
7. relevant `.codex/contracts/*.json`
8. `cli-command-spec.md`

The intent of this bundle is to keep only the documents needed to reason about the current control-plane shape, without carrying older proposal layers, pilot evidence, or phased rollout history.

The future-target document:

- `docs/maestro/maestro-feature-formation-canonical.md`

is intentionally outside this working set and does not override the current runtime contract.
