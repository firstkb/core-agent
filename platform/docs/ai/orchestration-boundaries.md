# Orchestration Boundaries

Status: active
Date: 2026-04-05
Class: supporting operational guidance

This file answers one question:
when should work use the product-level `Atlas` flow, and when should it stay with repo-level orchestration outside `platform/`?

## Atlas

`Atlas` is the human name of `$ramp-conductor`.
It is the product-level conductor for work centered in `platform/`.

Use Atlas when the task's center of gravity is one or more of:
- `platform/frontend`
- `platform/backend`
- shared frontend/backend contract alignment
- `platform/docs/ai/*` memory maintenance
- multi-session product work
- collection-table, admin control-plane, auth/session, schema/tenancy, or other platform product domains

## Repo-level orchestration

If your repository also has a root-level conductor or planner, treat it as repo-wide orchestration.
Use repo-level orchestration when the task's center of gravity is outside `platform/`, or when it spans multiple top-level areas that are not primarily product work inside `platform/`.

Typical repo-level cases:
- root tooling
- CI or top-level automation
- shared repo conventions outside the platform product domain
- multi-area repository refactors where `platform/` is only one participant

## Fast rule

- platform-centered product task -> start with `Atlas` by default
- repo-wide or non-platform task -> use repo-level orchestration
- if uncertain and the work starts inside `platform/`, start with `Atlas` and escalate only if the boundary expands beyond `platform/`
