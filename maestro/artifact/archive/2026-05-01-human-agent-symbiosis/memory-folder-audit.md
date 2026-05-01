# Memory Folder Audit

- Status: `draft`
- Scope: quality audit of `maestro/memory/`
- Date: 2026-05-01

## Executive Assessment

`maestro/memory/` is a strong retrieval layer, not a broken folder. Its main
design is correct: it separates compact memory from canonical docs and source
code, gives agents deterministic read routes, and keeps product/module knowledge
in small packs rather than forcing full-doc reads.

The current quality is good but not yet excellent. The main weakness is semantic
drift: a few hot memory files still describe older runtime/team state or older
frontend visual-check policy. There is also some accumulated migration ledger
noise in durable memory. This is cleanup debt, not a reason to redesign the
memory model.

Practical rating:

- Structure: `8/10`
- Retrieval usefulness: `8/10`
- Freshness / drift control: `6/10`
- Context efficiency: `7/10`
- Overall: `7/10`, with a realistic path to `8.5/10` after focused cleanup.

## What Works Well

- Clear source-of-truth boundary. `START_HERE.md` states that memory is compact
  routing/durable state and does not replace code or canonical FE/BE docs.
- Good baseline read order. `START_HERE.md` plus `index/read-routes.yaml` gives
  Maestro a consistent starting point without always loading full durable memory.
- Useful lazy-deepen model. `memory-index.yaml`, `current-state.md`,
  `module-index.md`, and module packs are deeper reads selected by route.
- Module packs are high-signal. Representative domain/frontend/backend packs
  use "Read This When", "Owner Sources", fast facts/contracts, planned work, and
  lessons. This is the right shape for fast agent retrieval.
- Working memory and durable memory are separated. Active run artifacts live
  under `maestro/artifact/**`; durable product/runtime memory lives under
  `maestro/memory/**`.
- Reference code is opt-in. `reference-code` policy and route files prevent raw
  donor material from becoming hot context or canonical truth.
- Docs governance is explicit. Frontend/backend doc maps, drift reports, archive
  candidates, and compaction policies make it easier to avoid stale source-docs.
- Memory maintenance is documented. `agent-workflow.md` gives update gates for
  decisions, modules, docs status changes, reference code, and workflow changes.
- Basic hygiene is good. No empty tracked memory files were found, and no
  machine-local absolute paths such as `/Users`, `/Volumes`, `/tmp`, or
  `file://` were found in tracked memory.
- Local auth is correctly kept local. `maestro/memory/local/browser-use-auth.md`
  exists locally but is not tracked by git; its contents were not read during
  this audit.

## Problems Found

### 1. `repo-map.md` is stale

`maestro/memory/durable/repo-map.md` is a hot retrieval shortcut, but it still
shows only `archivist/` under `.agents/skills/` and describes Maestro as
"owner-facing module orchestration workflow".

Current active vNext skill nicknames are `maestro`, `charlie`, `grant`,
`mason`, `scout`, `lens`, `release`, `scribe`, and `archivist`. Maestro should
be described as the native-first owner-facing solution architect / engineering
partner, not legacy module orchestration.

Impact: agents using repo-map for orientation can under-route the team and carry
legacy orchestration language into new work.

### 2. `memory-index.yaml` runtime route is stale

`maestro/memory/index/memory-index.yaml` still lists only Maestro, Charlie, and
Grant skill bodies under `platform.runtime.codex-native`, and its trigger text
mentions legacy agents more prominently than the full current vNext team.

Impact: broad runtime routing does not reflect the active nine-role team.

### 3. Frontend visual-check policy drift

Current memory still says Browser Use is the preferred local app visual-smoke
tool:

- `START_HERE.md` local visual smoke section.
- `durable/current-state.md` visual smoke decision line.
- `modules/frontend/build-web-apps-review.md` visual verification standard.
- `durable/decisions-log.md` DEC-087.

This is not "wrong" for the previous accepted policy, but it now conflicts with
the planning direction in this artifact set:

- Browser Use should be the default structured in-Codex FE smoke/evidence tool.
- Computer Use + external Chrome should be used for final desktop visual/UX
  acceptance when Codex width may bias judgment or a real desktop browser/app
  surface matters.

Impact: after promotion, this memory must be aligned or agents will keep using
old FE verification language.

### 4. `read-routes.yaml` has duplicate reads

The `reference_code` and `reference_code_relocation` routes list
`maestro/memory/reference-code/README.md` twice in the same read list.
`memory-index.yaml` repeats the same pattern in the reference-code entry.

Impact: small but needless context/read duplication and a signal that route
lists need a cleanup pass.

### 5. `read-routes.yaml` is large for every Maestro-routed task

`index/read-routes.yaml` is 421 lines and contains 19 product/runtime routes.
The current baseline read is still acceptable, but runtime/meta work does not
always need the full product route map.

Impact: context cost is real, but the recommended fix remains deferred. First
finish lazy-read schemas/templates and stale repo-map cleanup. Add a hot route
split only if repeated work shows actual context bloat.

### 6. `decisions-log.md` is valuable but overloaded

The decisions log is not garbage. It contains durable product/runtime decisions
that should be preserved. However, the separate decisions-log audit found:

- duplicate `DEC-049`;
- several active decisions that should be superseded or compacted;
- stale retired-runtime and deleted-path references;
- too much migration ledger detail in active durable decisions.

Impact: future durable promotion will be noisier and riskier until the log is
cleaned in a focused Archivist-style slice.

### 7. `current-state.md` mixes active snapshot with too much retirement history

`current-state.md` is useful and compact, but its hot product/runtime snapshot
still spends many lines on final retirement/deletion history for old memory and
runtime surfaces.

Impact: this was useful during migration, but it now competes with current
product state and team/runtime facts in a hot durable snapshot.

### 8. `legacy-memory-import.md` has a malformed runtime-source line

`durable/legacy-memory-import.md` includes:

```text
`.agents/skills/maestro|charlie|grant`, ``, and `AGENTS.md`
```

Impact: small but sloppy. It also reflects the older three-skill view of the
runtime and should be refreshed or left clearly historical.

### 9. Dates imply compaction but not current policy freshness

Many module packs are compact and useful with `Last compacted: 2026-04-25`.
That is fine for product facts that have not changed. But hot runtime/workflow
surfaces affected by the current Maestro philosophy work need fresh dates after
accepted promotion.

Impact: agents may overtrust "active" files that are structurally valid but
semantically behind the current operating model.

## Layer-By-Layer Quality

| Layer | Quality | Notes |
|---|---:|---|
| `START_HERE.md` | Good | Strong first-read file, but visual-check language and date need update after policy promotion. |
| `index/read-routes.yaml` | Good | Useful routing map; currently too large for some runtime/meta tasks and has duplicate reference-code reads. |
| `index/memory-index.yaml` | Good | Helpful broader index; runtime entry must include all active vNext roles and remove stale emphasis. |
| `durable/current-state.md` | Good | Useful compact snapshot; should compact retirement history and align FE visual policy after approval. |
| `durable/repo-map.md` | Needs refresh | Main stale file: active skills and Maestro description are behind current runtime. |
| `durable/decisions-log.md` | Needs cleanup | Valuable durable log, but duplicate/stale/over-granular entries need a focused cleanup slice. |
| `modules/**` | Strong | Domain/frontend/backend packs are compact, actionable, and grounded in owner sources. |
| `docs/**` | Good | Drift maps and doc maps are useful; some are large but intentionally so. |
| `reference-code/**` | Good | Opt-in donor material policy is sound; route duplication should be removed. |
| `local/**` | Good | Local auth material is untracked; do not read or promote it. |

## Recommended Cleanup Order

1. Refresh `maestro/memory/durable/repo-map.md`.
   This is the highest value, lowest risk memory fix.

2. Refresh `platform.runtime.codex-native` in `memory-index.yaml`.
   Include all active vNext roles and current runtime source-of-truth wording.

3. Remove duplicate reference-code reads from `read-routes.yaml` and
   `memory-index.yaml`.

4. Fix the malformed line in `legacy-memory-import.md`.
   Keep historical provenance, but avoid malformed or misleading current-runtime
   wording.

5. After owner accepts the FE tooling policy, align `START_HERE.md`,
   `current-state.md`, `build-web-apps-review.md`, and DEC-087 with the
   Browser Use / Computer Use split.

6. Run a focused `decisions-log.md` cleanup.
   Do not delete wholesale. Supersede stale decisions, compact migration ledger
   entries, fix duplicate IDs, and update sources to current canonical docs.

7. Re-evaluate route-map context cost later.
   If runtime/meta tasks continue paying too much context for the full
   product-route map, then design a small hot route section or hot route file.

## What Not To Do

- Do not rewrite `maestro/memory/` into long narrative docs. The compact pack
  model is working.
- Do not make memory the source of truth for runtime behavior or product code.
  It should keep pointing to canonical docs/code.
- Do not promote current planning artifacts into memory before owner acceptance.
- Do not create a `read-routes.hot.yaml` immediately. It is plausible, but
  current evidence points to cheaper fixes first.
- Do not use raw `reference-code/**` donor material unless the task explicitly
  needs it and the reference-code policy has been read.

## Conclusion

The memory folder is fundamentally useful and well designed for Maestro's
future workflow. The right next step is not a redesign; it is a focused cleanup
of stale runtime/team wording, duplicate route entries, decisions-log debt, and
frontend visual-evidence policy after the new operating model is accepted.
