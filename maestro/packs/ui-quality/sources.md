# UI Quality Pack Sources

Status: active provenance note

This pack distills useful prompts and checklists from the optional local raw
pack:

```text
reference-code/codex-ui-prompt-pack-open-design/
```

The raw folder is local reference material. It is not required for normal
operation, not an active Maestro memory dependency, and not a repository source
of truth.

Observed source attribution from the raw pack:

- inspired by `nexu-io/open-design`;
- source license observed there: Apache License 2.0;
- adapted ideas: skill-folder prompts, design contract, screen archetypes,
  five-axis critique, anti-generic UI rules, typography/color/state checklists.

## Distilled Inputs

The useful source material was consolidated into:

- `PACK.md`
- `workflow.md`
- `archetypes.md`
- `checklists/anti-ai-slop.md`
- `checklists/state-accessibility.md`
- `checklists/visual-review-rubric.md`
- `checklists/implementation-checklist.md`
- `templates/*.md`

## Raw Reference Rule

Do not read the raw pack by default. Read it only when:

- the owner explicitly asks to compare against the original reference;
- this distilled pack is insufficient;
- license/provenance review needs exact source text.

If the raw pack is absent, continue with the distilled `maestro/packs/ui-quality`
files.
