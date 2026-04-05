# Run Artifacts Guide

Status: active

This folder holds execution artifacts for coordinated work.
These files are not canonical project memory.
They are operational artifacts for one concrete task.

## Atlas-default rule

During the v1 pilot, Atlas is the default intake layer for new platform tasks. Start with Atlas unless you are intentionally taking an obviously tiny local no-run fast-path.
Atlas decides:
- whether a run is required at all
- the `task-id` when a run is required
- the mode
- the active lanes
- the prompt plan
- whether to invoke the scaffolder

If Atlas routes a task to `DIRECT_FRONTEND_NO_RUN` or `DIRECT_BACKEND_NO_RUN`, do not create a run folder.

## When to use runs

Create a run when Atlas decides `run_required = yes`, typically because at least one is true:

- the work is cross-stack
- the work is multi-session
- the work is high-risk
- the work likely needs handoff or checkpoints
- the work changes shared contract or package boundaries
- the work touches auth/session, tenancy, roles, migrations, or collection-table extraction

## Task-id format

Format:
`YYYY-MM-DD_<scope>_<short-kebab-purpose>`

Examples:
- `2026-04-05_cross-stack_collection-table-package-readiness`
- `2026-04-05_backend_admin-nav-permissions`
- `2026-04-05_frontend_auth-bootstrap-guard-fix`

Rules:
- lowercase ASCII only
- hyphen-separated slug words
- no timestamp by default
- append `-02`, `-03`, ... only for same-day collisions
- reuse the same task-id while the same engineering objective is still active

Atlas decides the `task-id`.
The scaffolder only validates and materializes files.

## Standard files

- `task.md` — control contract and run state
- `frontend.md` — FE packet snapshot + FE report
- `backend.md` — BE packet snapshot + BE report
- `final.md` — reconciliation and closeout

## Status lifecycle

Recommended statuses:
- `draft`
- `active`
- `blocked`
- `reconciled`
- `closed`
- `superseded`

## Scaffolder usage

Preferred entrypoint after Atlas has chosen task-id, mode, and lanes:

```bash
scripts/ai/new-run.sh --task-id "2026-04-05_cross-stack_collection-table-package-readiness" --mode CROSS_STACK_PARALLEL --lanes frontend,backend
```

Alternative:

```bash
python3 scripts/ai/new-run.py --task-id "2026-04-05_cross-stack_collection-table-package-readiness" --mode CROSS_STACK_PARALLEL --lanes frontend,backend
```

The scaffolder:
- creates the run directory
- creates `task.md`
- creates lane files for requested lanes
- creates `final.md`
- stamps prompt and skill versions from the automation manifest

It does not:
- decide task intent
- decide task id
- choose mode
- update durable shared memory

## Pilot evidence target

Do not fabricate example runs.
Instead, keep these real examples after the first pilot cycle:
- one active or recently closed real run under `platform/docs/ai/runs/`
- one archived real run under `platform/docs/archive/runs/`

This gives the workflow a living example without introducing fake execution history.

## Archive policy

Keep only live work in `platform/docs/ai/runs/`.

Move a run to `platform/docs/archive/runs/` when:
- status is `closed` or `superseded`
- it is no longer part of active work
- it is unlikely to be reopened immediately

Recommended timing:
- after 14 days without meaningful updates
- or earlier if `runs/` becomes noisy

If the same engineering objective resumes, you may keep or restore the same run.
If the objective, boundary, or acceptance target materially changes, create a new `task-id` and link the previous run from the new one.

## Important rule

Closed and archived runs are historical execution artifacts.
Do not treat them as canonical project truth.
