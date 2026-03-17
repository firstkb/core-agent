---
doc_status: proposal
doc_scope: future
doc_type: spec_bundle
bundle_for: module_orchestrator_v2
---

# Module Orchestrator V2 Spec Bundle

This bundle breaks the revised V2 replacement proposal into implementation-oriented artifacts:

- `state-machine.md` — normative lifecycle model, transition rules, and invariants.
- `json-schemas/` — the first-cut machine-state schemas for V2.
- `cli-command-spec.md` — typed CLI command contract for the state-gateway model.
- `module-orchestrator-control-plane-v2-revised.md` — the revised replacement proposal that these artifacts derive from.

Recommended reading order:

1. `module-orchestrator-control-plane-v2-revised.md`
2. `state-machine.md`
3. `json-schemas/*.schema.json`
4. `cli-command-spec.md`

The intent of this bundle is to make V2 implementable without re-reading long design discussions every time a schema, command, or prompt changes.
