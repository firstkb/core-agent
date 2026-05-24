# Dashboard Mockup

Status: archived
Date: 2026-05-15

## Goal

Replace the current tenant `/dashboard` placeholder with a production-like mockup
for a future form-powered dashboard. The screen should support the presentation
story now while staying close to a future working tool.

## Scope

- Frontend-only tenant-web dashboard slice.
- Show future bindings visually: source Forms/Views, navigation exposure, and
  access-filtered data scope.
- Use typed mock data structures that can later be replaced by a backend
  analytics provider.

## Boundaries

- Do not change backend APIs, migrations, auth, tenant isolation, or runtime
  access evaluation.
- Do not move dashboard ownership into Form Builder.
- Treat future Dashboard Builder/Report Builder as separate Platform Studio
  concern from Form Builder.

## Evidence Plan

- Targeted tenant-web typecheck/build or equivalent focused frontend check.
- Local preflight before closeout if implementation remains non-trivial.
- Rendered browser inspection for desktop and mobile if the local app can run.
