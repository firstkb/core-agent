# Maestro Packs

Status: active optional capability registry
Scope: reusable Maestro operating packs

`maestro/packs/` contains optional, lazy-read packs that help Maestro perform a
specific kind of work. Packs are not durable product memory, not active agent
skills, and not source of truth over repository contracts.

## Rules

- Read a pack only when the owner names it, a route explicitly points to it, or
  the current task would materially benefit from it.
- Repository rules, product contracts, source code, UI Kit, design tokens,
  memory route facts, and owner decisions outrank pack defaults.
- Packs may distill local or external references, but raw reference folders are
  not required for normal use.
- Do not create new agents or fixed orchestration chains from packs.
- If a pack is unavailable or mismatched with the task, continue with the
  normal Maestro workflow and record the fallback when evidence matters.

## Available Packs

| Pack | Entry | Use When |
| --- | --- | --- |
| UI Quality Pack | `maestro/packs/ui-quality/PACK.md` | Visible frontend implementation, UI review, state/accessibility pass, anti-generic UI check, or owner asks for UI Quality Pack. |
| Compact Communication Pack | `maestro/packs/compact-communication/PACK.md` | Owner asks for shorter/no-fluff communication, concise status, review findings, commit messages, or low-risk technical summaries. |
