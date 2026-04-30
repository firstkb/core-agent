# VSM v1.0.0 Workspace

This repository is the working codebase for VSM (Virtual Safety Manager)
v1.0.0 web product development and its local AI-agent operating model.

Product code lives under:

- `platform/frontend/` - frontend workspace for `tenant-web`, `platform-admin-web`, and shared frontend packages.
- `platform/backend/` - Go backend runtimes, modules, migrations, and local bootstrap assets.

The current AI memory and agent workflow lives under:

- `maestro/memory/` - compact operational memory, read routes, durable decisions, and module packs.
- `.agents/skills/` - repo-local Codex skills, including `maestro`, `charlie`, `grant`, `mason`, `scout`, `lens`, `release`, `scribe`, and `archivist`.
- `.agent-cli/` - typed lifecycle gateway for module/feature/stage artifacts.
- `.codex/` - Codex-native runtime wiring, contracts, standards, and templates.
- `maestro/archive/final-atlas/` - frozen Atlas provenance, not active runtime.

## Start Here

For agent work, read in this order:

1. `AGENTS.md`
2. `platform/AGENTS.md`
3. `maestro/README.md` and `maestro/docs/runtime-contract.md` for Maestro-routed work
4. `maestro/memory/START_HERE.md`
5. `maestro/memory/index/read-routes.yaml`
6. relevant `maestro/memory/modules/**` pack
7. relevant canonical docs under `platform/frontend/docs/` or `platform/backend/docs/`

Use `maestro/memory/index/memory-index.yaml` only when broader routing is needed.

For human orientation:

- `docs/codex-native-repo.md` explains the live repository layout and runtime boundaries.
- `docs/ref/reference-code.md` lists opt-in local reference-code pack aliases.
- `platform/frontend/docs/README.md` and `platform/backend/docs/README.md` are the product docs entrypoints.

## Current Runtime

The active product surfaces are:

- Backend runtimes: `cmd/api-admin`, `cmd/api-tenant`, `cmd/auth`, `cmd/migrate`.
- Frontend apps: `platform-admin-web` and `tenant-web`.
- Platform Studio: tenant-web suite for builder/configuration tools. Form Builder is the active builder today; Navigation Builder, Action Builder, PDF Builder, and Report Builder are future suite tools.

Online web applications are the current delivery target. PWA/offline and Flutter
hybrid mobile are future layers after the main web platform stabilizes.

## Checks

GitHub Actions currently include:

- Docs/memory drift checks.
- Backend Go format, tests, and command builds.
- Frontend frozen install, typecheck, and build.

Local lightweight preflight:

```bash
scripts/ai/preflight.sh
```

Use `scripts/ai/preflight.sh --full` only when a broader local product sweep is
worth the extra cost.
