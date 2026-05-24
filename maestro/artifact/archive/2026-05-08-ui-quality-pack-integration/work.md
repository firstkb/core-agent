# UI Quality Pack Integration

Status: archived
Owner request: integrate the useful parts of `reference-code/codex-ui-prompt-pack-open-design` as a Maestro UI Quality Pack.

## Goal

Add a reusable, lazy-read Maestro pack for visible frontend work that improves UI quality without replacing Build Web Apps, creating new agents, or turning raw `reference-code/**` into active memory.

## Scope

- Add `maestro/packs/ui-quality/**` as the tracked distilled pack.
- Add a short `maestro/packs/README.md` registry.
- Wire Maestro/read-routes to read the pack only when owner intent or UI work needs it.
- Keep repository and frontend UI Kit rules higher priority than the pack.

## Not In Scope

- Do not copy the raw reference pack into active skills.
- Do not add new `.agents/skills/**`.
- Do not create a new agent.
- Do not make every UI task require a new design document.
- Do not touch unrelated Navigation Builder product work currently in the tree.

## Current Plan

1. Create the pack files.
2. Add lazy-read pointers.
3. Run runtime/docs checks.
4. Record concise evidence.
