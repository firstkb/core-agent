# Local Runs

Status: local operational area

Use this folder only for local AI run packets that should not live in tracked platform docs.

```text
runs/
  active/
  archive/
```

Closed runs must move to `runs/archive/`.
Run packets are operational artifacts, not canonical truth.

Before archiving, distill durable outcomes into module `contract.md`, `state.md`, or `lessons.md`.

## Active Run Closure Rule

Keep `runs/active/` small.

If a run has a `final.md` with implementation complete, closeout-ready, or
ready-for-review language, do one of two things immediately:

- move the full run folder to `runs/archive/<task-id>/`
- or keep it in `runs/active/<task-id>/` only with an explicit block:
  - `Status: awaiting-owner-review`
  - `Next owner action:`
  - `Last updated:`

Do not leave completed or review-ready runs in `active/` with vague status.

Former legacy `platform/docs/ai/runs/**` artifacts are summarized in:

- `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md`

Raw legacy run payloads and the remaining pointer directory were deleted after
the summary was accepted. Use git history only when exact old run text is
required.
