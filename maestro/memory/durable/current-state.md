# Current State

Status: compact active snapshot
Last compacted: 2026-05-01

This is a compact AI retrieval snapshot.
Use canonical docs and code for final verification before changing behavior.

Confidence labels:

- `code-confirmed`: directly observed in repository code/config/tree.
- `doc-confirmed`: stated in tracked canonical docs and treated as active unless code disproves it.
- `owner-confirmed`: clarified directly by the repository owner during memory maintenance.
- `inferred`: synthesis across observed sources.

## Repository Runtime

- `landed` `doc-confirmed`: The repository has a Codex-native runtime model rooted in `AGENTS.md`, `README.md`, `.agents/skills/`, `.codex/`, `maestro/docs/`, `maestro/contracts/`, and `maestro/templates/`.
- `landed` `owner-confirmed`: The current product identity is VSM (Virtual Safety Manager) v1.0.0. `Ramp Platform v108` is a historical working name only and must not be used as current product identity in active docs, prompts, or memory.
- `landed` `doc-confirmed`: Root `README.md` and `AGENTS.md` now describe the repo as the VSM (Virtual Safety Manager) v1.0.0 product workspace plus Codex-native agent runtime, with `platform/` as product root and `maestro/memory/` as current operational memory.
- `landed` `doc-confirmed`: Maestro vNext is the active native-first work partner for new owner-led engineering tasks.
- `landed` `doc-confirmed`: Active vNext skill nicknames are `maestro`, `charlie`, `grant`, `mason`, `scout`, `lens`, `release`, `scribe`, and `archivist`.
- `landed` `owner-confirmed`: Human-agent symbiosis is the operating model. The owner owns product strategy, business/domain direction, product taste, priorities, and final product decisions. Maestro owns the engineering path, code quality, UI/UX analysis and evidence, agents/tools, checks, and safe execution.
- `landed` `doc-confirmed`: Maestro uses specialists and outsourced capabilities adaptively, not through fixed chains. `maestro/docs/agent-selection-thresholds.md` defines default thresholds for when to keep work inline, call internal roles, or use outsourced tools.
- `landed` `doc-confirmed`: Legacy system agent ids `module_orchestrator`, `research_codebase`, and `brief_auditor` remain available only for old `artifacts/<module>/...` continuation.
- `landed` `doc-confirmed`: Persisted module/feature/stage artifacts live under `artifacts/` and are runtime artifacts, not design-time source of truth.
- `landed` `owner-confirmed`: The old typed lifecycle CLI has been removed from the active tree. New Maestro work uses native Codex execution plus flat artifacts under `maestro/artifact/`.
- `landed` `owner-confirmed`: retired runtime is archived in owner-managed external storage and is no longer an active skill or default platform entrypoint.

## Product Runtime

- `landed` `code-confirmed`: Product code lives under `platform/`.
- `landed` `code-confirmed`: Backend runtime entrypoints include `cmd/api-admin`, `cmd/api-tenant`, `cmd/auth`, and `cmd/migrate`.
- `planned` `doc-confirmed`: `cmd/worker` is still future/deferred and should not be treated as present.
- `landed` `code-confirmed`: Backend modules exist under `platform/backend/modules/admin`, `platform/backend/modules/tenant`, and `platform/backend/modules/shared`.
- `landed` `code-confirmed`: Frontend apps are `platform-admin-web` and `tenant-web`.
- `landed` `owner-confirmed`: Business Tree is a tenant app page, not a
  product module. Product modules are broader product areas such as future
  Training or Task Manager.
- `landed` `code-confirmed`: Tenant Business Tree is the first tenant app page.
  Frontend direct route is `/app/pages/business-tree`, frontend code lives
  under `tenant-web/src/features/app-pages/business-tree`, backend code lives
  under `platform/backend/modules/tenant/apppages/businesstree`, and the tenant
  API is `GET /app/pages/business-tree/nodes`.
- `planned` `owner-confirmed`: Business Tree follow-ups are Navigation Builder
  app-page metadata/sidebar registration, Navigation Builder-backed page access
  control, a separate Navigation Builder target model for real product modules,
  parent-company existence validation for `contacts:*` and `projects:*` lazy
  parents, large-tree performance/virtualization, optional explicit root
  company only if legacy imports require it, and authenticated browser smoke
  with a seeded tenant session.
- `landed` `code-confirmed`: `platform-admin-web` loads `/app/profile` before `/app/me/navigation` and builds admin sidebar/favorites from backend navigation.
- `landed` `doc-confirmed`: `tenant-web` shell/auth/bootstrap, Platform Studio ownership, tenant-core boundary, install-helper placement, and future PWA/mobile exclusions now live at `platform/frontend/docs/modules/tenant-web.md`.
- `landed` `owner-confirmed`: Current applications are online web applications.
- `planned` `owner-confirmed`: Offline PWA and Flutter/hybrid mobile are future delivery layers after the main web platform stabilizes.
- `planned` `doc-confirmed`: `tenant-pwa` is deferred and not a current app.
- `landed` `code-confirmed`: Frontend shared packages include `api-client`, `app-shell`, `auth-core`, `collection-table`, `design-tokens`, `forms`, `i18n`, `install-helper`, `platform-studio-core`, `tenant-core`, and `ui-kit`.
- `landed` `doc-confirmed`: Current install prompt/runtime behavior lives at `platform/frontend/docs/guides/install-helper.md`; it is mounted on public auth screens and does not imply offline-first or service-worker scope.
- `landed` `code-confirmed`: Frontend local dev HTTPS domains use `.platform.localhost` (`admin`, `demo`, `acme`) to avoid macOS `.local` mDNS/Bonjour resolver stalls; commands, Caddy/Vite configs, env examples, local seeds, and docs are aligned through `platform/frontend/docs/guides/local-dev.md`.
- `landed` `doc-confirmed`: Active frontend docs now use target-folder `Read with`/`Read Order` links; old root pointer docs were deleted, while retained `platform-studio/**` docs are exact-detail, proposal, archive, or reference-only inputs.
- `landed` `doc-confirmed`: UI Kit governance, stable/provisional approval, layout baseline, and delivery order now live at `platform/frontend/docs/contracts/ui-kit.md`.
- `landed` `doc-confirmed`: UI Lab route, section model, review coverage, and editing rules now live at `platform/frontend/docs/guides/ui-lab.md`.
- `landed` `code-confirmed`: Storybook V1 is available under `platform/frontend/.storybook` with stable `ui-kit` stories for actions, form controls, feedback, states, and table primitives plus `CollectionTable` states (`empty`, `loading`, `ready with rows`, `error`, `filters open`). It is manual/local only and not a CI gate.
- `landed` `doc-confirmed`: The frontend foundation rollout and Phase E gap review are closed history; durable lessons are compacted into the UI Kit contract and UI Lab guide.
- `planned` `doc-confirmed`: Deferred composed UI surfaces such as remote table workspaces, file uploads, AI assistant dialog, messenger, and kanban remain future/app-layer-first proposal scope at `platform/frontend/docs/proposals/deferred-composed-surfaces.md`.
- `landed` `owner-confirmed`: Reference-code packs use stable `reference-pack:*` aliases in `maestro/memory/reference-code/README.md`; raw donor/legacy packs moved out of active FE/BE docs into local `reference-code/` raw-pack storage.
- `landed` `doc-confirmed`: The reference-code relocation checkpoint is recorded in `maestro/memory/reference-code/relocation-checkpoint.md`; old raw-pack tracked pointer README directories were deleted.
- `landed` `doc-confirmed`: `scripts/checks/docs_memory_check.py --check` now validates docs/memory drift, deleted pointer folders, retained Form Builder exact-detail policy, and local markdown links.
- `landed` `doc-confirmed`: For Maestro-routed repository or product work, `maestro/memory/START_HERE.md` and `maestro/memory/index/read-routes.yaml` are the always-read compact memory baseline; `memory-index.yaml`, `current-state.md`, `module-index.md`, and module packs are deeper reads selected only when routing or correctness needs them.
- `landed` `doc-confirmed`: `maestro/memory/durable/decisions-log.md` is a compact durable-decision index. Full decision bodies live under `maestro/memory/durable/decisions/*.md` and are route-specific deeper reads, not default hot-path context.
- `landed` `doc-confirmed`: `scripts/checks/docs_memory_check.py --check` now also validates stale platform layout, historical migration-plan status, `AGENTS_NAME.md` non-authoritative status, `START_HERE`, unified active read-order surfaces, and manual preflight policy; `scripts/checks/check_env_policy.py --check` owns tracked env-file policy and sanitized env examples.
- `landed` `doc-confirmed`: `scripts/preflight.sh` is the lightweight local/manual preflight for non-trivial implementation work; default mode runs docs/env checks, while `--full` is explicit for broader backend/frontend checks.
- `landed` `owner-confirmed`: Root check tooling uses `scripts/preflight.sh` plus implementation checks under `scripts/checks/**`; the old `scripts/ai/**` folder is retired for active checks.
- `landed` `doc-confirmed`: `maestro/templates/evidence.md.tmpl` is the compact evidence shape for non-trivial closeout or PR text; it should not become a standalone artifact by default.
- `landed` `owner-confirmed`: Maestro does not create artifacts for every chat turn. Maestro creates or promotes to a work artifact as soon as continuity, evidence, future resume, multi-step execution, owner decision, or file-change accountability matters. Persisted work uses flat artifacts under `maestro/artifact/active/`.
- `landed` `owner-confirmed`: For visible UI work, Maestro owns final UI/UX judgment. Browser Use is the default structured in-Codex evidence surface for local route/state/DOM/screenshot smoke. Computer Use with external Chrome is used when final desktop visual judgment must be independent of Codex width or real desktop/browser/app behavior matters. Build Web Apps must be considered for visible frontend work and used selectively when frontend-heavy expertise improves the result.
- `landed` `owner-confirmed`: Owner-provided seeded dev logins for browser checks live only in ignored `maestro/memory/local/browser-use-auth.md`; tracked evidence should say `Auth: local seeded dev login.` without recording codes.
- `landed` `owner-confirmed`: retired runtime-era run folders were moved out of active memory and copied outside the active repository.
- `landed` `doc-confirmed`: `.github/workflows/docs-memory-check.yml` runs docs/memory drift and env policy checks for relevant PRs and pushes.
- `landed` `code-confirmed`: Minimal product CI now includes `.github/workflows/backend-ci.yml` for Go format/test/build and `.github/workflows/frontend-ci.yml` for pnpm frozen install, typecheck, and build. Frontend lint/test and UI visual gates remain deferred until baselines are stable.
- `landed` `doc-confirmed`: Local backend env files are ignored by `.gitignore`; tracked backend env files must be `*.env.example` only.
- `landed` `doc-confirmed`: `Archivist` (`.agents/skills/archivist/SKILL.md`) is the manual semantic docs/memory audit skill for source-of-truth drift, stale routes, and context-window risks.
- `landed` `owner-confirmed`: Archivist should be used manually after large docs/memory changes and before major development phases, not on every commit.
- `landed` `doc-confirmed`: Memory maintenance rules for new decisions, modules, doc status changes, reference-code changes, and agent workflow changes live in `maestro/memory/agent-workflow.md`.
- `landed` `owner-confirmed`: Durable memory should promote accepted decisions that affect future strategy, standards, architecture, ownership, risk, or workflow. Brainstorming, rejected options, temporary plans, raw evidence, and full planning artifacts stay in active artifacts or chat.
- `landed` `owner-confirmed`: `AGENTS.md` files have narrow ownership boundaries. Root `AGENTS.md` owns repo runtime boundaries; `platform/AGENTS.md` owns shared platform invariants and workflow; lane `AGENTS.md` files own local implementation rules only; Maestro runtime/memory owns UI/UX judgment, browser/desktop evidence policy, agent/tool selection, artifacts, gates, and closeout.
- `landed` `owner-confirmed`: The root `docs/` folder is retired. Reference-code aliases live under `maestro/memory/reference-code/README.md`, and historical root docs are git-history provenance only.
- `landed` `owner-confirmed`: The former `platform/docs/ai/**` memory layer has been fully retired and physically deleted after migration into `maestro/memory`; exact old payload text is git-history provenance only.
- `landed` `owner-confirmed`: Legacy run triage for former `platform/docs/ai/runs/**` artifacts is frozen in owner-managed external provenance.
- `landed` `doc-confirmed`: Top-level legacy durable/governance/changelog markdown, module memory, prompts/templates, automation metadata, and runs from the former `platform/docs/ai/**` layer are represented by `maestro/memory/durable/legacy-memory-import.md`, current module memory, owner-managed external provenance, and git history.
- `landed` `owner-confirmed`: Final `platform/docs/ai/**` retirement readiness audit is frozen in owner-managed external provenance; physical deletion is complete.
- `landed` `owner-confirmed`: Raw legacy run payloads from former `platform/docs/ai/runs/**` were deleted after accepting a durable summary. Exact old run text is git-history provenance only.
- `landed` `doc-confirmed`: `maestro/memory/AGENTS.override.md` was removed because it was not an active Codex instruction surface.

## Active Product Domains

- `landed` `doc-confirmed`: Auth/session uses cookie-backed HttpOnly refresh tokens; frontend stores access token and expiry, not an active refresh token.
- `landed` `doc-confirmed`: Admin navigation is separate from profile bootstrap; `/app/profile` is profile-only and `GET /app/me/navigation` owns admin navigation.
- `landed` `doc-confirmed`: Multi-tenant isolation is non-negotiable; tenant scope must come from trusted runtime context.
- `landed` `code-confirmed`: Collection Table exists as `@platform/collection-table` and is consumed by Module Registry, Employees, and Tenants in the admin app.
- `planned` `doc-confirmed`: Collection Table still needs shared optional support for XLS export, row action `view`, and row action `pdf`.
- `landed` `owner-confirmed`: Platform Studio is the tenant-web suite of builder/configuration tools for forms, navigation/sidebar, access-facing runtime exposure, actions/events, PDFs, reports, and related future tools.
- `landed` `doc-confirmed`: Platform Studio suite-level tracked docs now live at `platform/frontend/docs/contracts/platform-studio.md` and `platform/frontend/docs/modules/platform-studio/README.md`.
- `landed` `doc-confirmed`: Active Form Builder tracked behavior now lives at `platform/frontend/docs/modules/platform-studio/form-builder.md`.
- `landed` `doc-confirmed`: Form Builder field catalog, palette registry, rules, grid/view settings, and scope boundaries now live at `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` as a supporting frontend contract.
- `landed` `doc-confirmed`: Old Form Builder detail/workstream docs are classified in `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md` as deleted compatibility pointers, exact-detail references, future proposals, archive candidates, or reference-only donor material.
- `landed` `doc-confirmed`: Old Form Builder archive/future workstream pointer stubs were deleted; retained exact-detail reference docs remain for payload/settings audit.
- `landed` `doc-confirmed`: Retained old Form Builder exact-detail docs declare `Status: exact detail reference` and point readers back to the active Form Builder module docs first.
- `landed` `doc-confirmed`: Form Builder exact-detail consolidation audit lives at `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`; it keeps 14 docs as exact-detail, marks 0 docs for future extraction before deletion, and records 9 docs deleted after extraction into `form-builder-fields.md`.
- `landed` `doc-confirmed`: The remaining 14 Form Builder exact-detail docs are policy-kept opt-in references, not active ownership docs or near-term deletion backlog.
- `landed` `doc-confirmed`: Form Builder retained exact-detail replacement planning lives at `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-replacement-roadmap.md`; it is docs-only and does not authorize product-code changes by itself.
- `landed` `doc-confirmed`: Backend-owned Form Builder API, storage, validation, generated-object, and runtime apply behavior now lives at `platform/backend/docs/contracts/platform-studio-form-builder.md`.
- `landed` `doc-confirmed`: Backend Form Builder implementation orientation now lives at `platform/backend/docs/modules/platform-studio/form-builder.md`.
- `landed` `code-confirmed`: Form Builder planned/open work is compacted in `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`; current code supports authoring, managed export, runtime list/read scaffolding, saved filters, favorites, record detail, runtime create/edit/save records, and managed multiple lookup plus non-lookup `multi_select`/`tags` bridge-table storage, while import, runtime grants, preview guard, static/external multivalue storage, and runtime package extraction remain planned/open.
- `landed` `doc-confirmed`: Backend operational docs now use `platform/backend/docs/runbooks/` for local bootstrap, auth key sources, and DB instance secret resolution.
- `landed` `doc-confirmed`: Backend gateway and KMS work now lives under `platform/backend/docs/proposals/` and remains inactive until owner activation.
- `landed` `doc-confirmed`: Backend legacy import mapping and import module boundary now live under `platform/backend/docs/reference/`; runtime schema truth remains `contracts/schema-tenancy.md`.
- `landed` `doc-confirmed`: Backend event actor identity now lives at `platform/backend/docs/contracts/events-identity.md`.
- `landed` `doc-confirmed`: Backend events/mail cleanup and schema drift checks now live under `platform/backend/docs/proposals/` and remain inactive until owner activation.
- `landed` `doc-confirmed`: Old backend standards, completed plans, and prompt artifacts now live under `platform/backend/`; old root archive pointer files were deleted.
- `landed` `doc-confirmed`: Legacy PostgreSQL SQL now lives behind `platform/backend/docs/archive/postgres-archive/README.md`; `platform/backend/docs/legacy/postgres-archive/README.md` is only a compatibility pointer.
- `landed` `doc-confirmed`: Active backend docs now use target-folder `Read with`/`Read Order` links; old root compatibility/archive pointer files were deleted.
- `landed` `doc-confirmed`: Pointer-only FE/BE docs with compacted-pointer headers, moved-pointer headers, and no-longer-active auth follow-up wording were deleted after their payload had fully moved into active contracts/modules; exact old text is git-history only.
- `landed` `doc-confirmed`: `maestro/memory/index/*` no longer lists old FE/BE root docs or former `platform/docs/ai/**` as active ownership routes; old platform memory is migrated import material with exact text in git history only.
- `landed` `doc-confirmed`: Form Builder is the active backend-backed Platform Studio tool.
- `landed` `code-confirmed`: Navigation Builder has an active UI-first V1 surface at `/builder/navigation` with an app menu tree editor, root-only `Menu title` dividers, separate `App menu`/`Utility rail` left tabs, Form Builder-aligned action toolbar with save status, tab-first inspector with `Element`/`Access`, no V1 `Advanced` tab, `Element` divided into `Item`/`Opens`/`Channel`/`Warnings` sections with a `Show in app menu` toggle, inactive items shown by eye-off badges and marked hidden from runtime app menu output, Dashboard locked but without a lock badge and not selectable for editing, empty configs starting with only Dashboard and the root add affordance, fixed active add choices for `Menu title`, `Menu group`, `Form view`, and `App page`, disabled future `App module` add choice, Form View labels derived continuously from selected View titles, Form View/App Page/External Link targets, future App Module shape with nested subitems, per-parent-level drag ordering, container/root add controls, optional icon picker for every editable non-title app menu item with `None` and inspection-oriented icons, inline Access authoring for app menu and utility rail draft items using three editable strategies plus `users OR ((companies OR company types) AND job types)`, paged/search table dialogs for access recipient selection, editable draft state, and explicit `Save`.
- `landed` `code-confirmed`: Navigation Builder backend is active in dedicated package `platformstudionavigationbuilder`, with `GET/PUT /app/platform-studio/navigation`, runtime projection `GET /app/navigation`, tenant table `ps_navigation_config`, optimistic version checks, duplicate target validation, active-item runtime filtering, and tenant bundle migration `007_platform_studio_navigation_builder.sql`.
- `landed` `code-confirmed`: Navigation Builder access persistence foundation uses tenant migration `011_platform_studio_navigation_access_runtime.sql` with derived `ps_navigation_runtime_item`, `ps_navigation_access_policy`, and unified `ps_navigation_access_subject` rows. Backend `Save` rebuilds those derived rows from `ps_navigation_config.definition_json` in the same transaction; runtime access filtering and direct route/API guard enforcement remain a later slice.
- `landed` `code-confirmed`: Tenant-web sidebar prefers saved Navigation Builder runtime items when present, falls back to published runtime metadata when no saved app menu exists, renders configured runtime item icons while allowing `None`/missing icon output, renders root `Menu title` entries as UI Lab-style section headings while suppressing empty/consecutive/trailing title sections, closes mobile/collapsed-hover sidebar panels after actionable navigation selections, and resolves top bar title/breadcrumb for configured Form View/App Page routes from the Navigation Builder path.
- `planned` `owner-confirmed`: Navigation Builder runtime sidebar/rail visibility filtering and direct route/API ACL enforcement remain planned. Access authoring now writes policy into `ps_navigation_config.definition_json`, synchronizes derived runtime/access tables on backend Save, and those rows should drive the future runtime evaluator.
- `planned` `owner-confirmed`: Action Builder, PDF Builder, and Report Builder are planned Platform Studio tools, not implementation-active.
- `landed` `doc-confirmed`: Form Builder uses a three-schema split: model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema`.
- `landed` `doc-confirmed`: Form Builder authoring transport uses canonical `/authoring`; `/draft` remains a temporary compatibility alias only.
- `landed` `doc-confirmed`: Form Builder `Save` is authoring persistence plus additive runtime apply, not site publication.
- `landed` `owner-confirmed`: Form Builder does not own View Active/Inactive or runtime/sidebar exposure. `isActive` is retired from Form Builder view config and new `ps_view.definition_json` payloads; `ps_view.is_active` / API summary values remain deprecated compatibility metadata until a later cleanup.
- `planned` `doc-confirmed`: Runtime ACL through Navigation Builder is not fully implemented; current runtime route split is preparatory and should not invent temporary grants.

## Current Risks

- `risk` `doc-confirmed`: Historical references to former `platform/docs/ai` paths can be confused with active docs. The path is deleted; use `maestro/memory` for retrieval and git history only for explicit provenance recovery.
- `risk` `doc-confirmed`: Machine-local backend env files may still exist in a developer working tree, but they must remain ignored and must not be tracked.
- `risk` `doc-confirmed`: Retained exact-detail/reference docs can still carry stale lifecycle or extraction language. Machine-local absolute links are not currently observed in active FE/BE docs and must not be reintroduced.
- `risk` `doc-confirmed`: Some old frontend tracked docs still contain stale lifecycle/extraction status, especially exact-detail docs and reference-only donor notes. Use `maestro/memory/docs/frontend/drift-report.md` before treating them as current truth.
- `risk` `doc-confirmed`: Some backend tracked docs are still working plans, proposed gateway policies, historical standards, or older agent instructions. Use `maestro/memory/docs/backend/drift-report.md` before treating them as current truth.
- `risk` `doc-confirmed`: Legacy run payloads and pointer directories no longer live under `platform/docs/ai/runs`; exact old run text requires git history.
- `risk` `doc-confirmed`: Detailed Platform Studio field/backend/supporting docs remain large. Read the suite contract, module entrypoint, and Form Builder module contract first, then only the exact supporting detail doc needed.
- `risk` `doc-confirmed`: Old Form Builder archive/future workstream pointer stubs were deleted. Use git history only for exact historical content, not as the active read path.
- `risk` `doc-confirmed`: Retained old Form Builder exact-detail docs preserve historical payload/settings details and can still be large. Use them only after compact tracked docs are insufficient.
- `risk` `doc-confirmed`: Do not delete retained exact-detail docs without code-backed replacement coverage and a consolidation audit update; extracted/deleted waves already compacted advanced, content nodes, field rules, grid columns, checklist subform, choice fields, ready-made fields, `suggest_text`, and schema scope into `form-builder-fields.md`.
- `risk` `doc-confirmed`: Form Builder exact-detail replacement work can accidentally become product-code implementation. Keep memory/docs planning separate unless the owner explicitly opens an implementation slice.
- `risk` `doc-confirmed`: Old frontend backend-facing Form Builder pointer docs were deleted; backend implementation work should read the backend Form Builder contract and use git history only for exact old handoff/storage/review text.
- `risk` `doc-confirmed`: Frontend old root pointer docs were deleted; retained old Platform Studio docs are exact-detail, proposal, archive, or reference-only. Do not treat them as active ownership when a target-folder doc exists.
- `risk` `owner-confirmed`: Planned Platform Studio tool concerns can be accidentally implemented inside Form Builder unless the tool boundary is read first.
- `risk` `doc-confirmed`: Collection Table old pointer-only root contracts were deleted; prefer `platform/frontend/docs/contracts/collection-table.md` and `platform/backend/docs/contracts/collection-table.md`.
- `risk` `doc-confirmed`: Frontend foundation rollout and Phase E gap review root pointer files were deleted. Do not reopen phased rollout work or invent shared primitives from old history.
- `risk` `owner-confirmed`: Donor/reference code such as Metronic can overload context and blur product ownership if read by default. Use the reference-code policy and distill lessons into module memory.
- `risk` `owner-confirmed`: PWA/offline and Flutter/mobile references can be misread as current scope. Treat them as future/deferred unless the owner explicitly activates that work.
- `risk` `doc-confirmed`: Install helper can be confused with offline PWA work. Current install prompt runtime is active, but service worker/offline/local sync remain future proposal scope.
- `risk` `doc-confirmed`: Deferred composed UI surfaces can be misread as UI Kit/UI Lab scope. Treat `proposals/deferred-composed-surfaces.md` as future proposal and start app-layer-first only after owner activation.
- `risk` `owner-confirmed`: Raw reference packs now live under ignored local `reference-code/`. Use `reference-pack:*` aliases and do not treat old pointer paths as product docs.
- `risk` `doc-confirmed`: Docs/memory drift is covered by local check and GitHub Actions, but not by an installed local pre-commit/pre-push hook. Run `python3 scripts/checks/docs_memory_check.py --check` before docs/memory commits when working offline.
- `risk` `doc-confirmed`: Archivist audit is manual and semantic; it should be run after large docs/memory slices or phase changes, not on every commit.
- `risk` `doc-confirmed`: Legacy PostgreSQL SQL can mislead agents if read as current schema. Use `contracts/schema-tenancy.md`, `contracts/migrations.md`, and the archive index before opening the SQL.
- `risk` `doc-confirmed`: Backend old root-path pointer docs were deleted. Do not treat deleted old paths as active ownership when a target-folder doc exists.
- `risk` `doc-confirmed`: Former `platform/docs/ai/prompts/**`, `templates/**`, and `automation-manifest.json` are deleted. Do not recreate them; archived retired runtime workflow artifacts are external provenance only.

## Recommended Reads By Domain

- Auth/session: `maestro/memory/modules/domains/auth-and-session/README.md`
- Schema/tenancy: `maestro/memory/modules/domains/schema-and-tenancy/README.md`
- Admin control plane: `maestro/memory/modules/domains/admin-control-plane/README.md`
- Admin module registry: `maestro/memory/modules/domains/admin-module-registry/README.md`
- Collection Table: `maestro/memory/modules/domains/collection-table/README.md`
- UI Kit: `maestro/memory/modules/frontend/ui-kit/README.md`
- UI Lab tracked guide: `platform/frontend/docs/guides/ui-lab.md`
- Install helper tracked guide: `platform/frontend/docs/guides/install-helper.md`
- Frontend local dev guide: `platform/frontend/docs/guides/local-dev.md`
- Tenant Web: `maestro/memory/modules/frontend/tenant-web/README.md`
- Tenant Web tracked module doc: `platform/frontend/docs/modules/tenant-web.md`
- Deferred composed UI surfaces proposal: `platform/frontend/docs/proposals/deferred-composed-surfaces.md`
- Frontend docs map: `maestro/memory/docs/frontend/doc-map.md`
- Backend docs map: `maestro/memory/docs/backend/doc-map.md`
- Backend runbooks: `platform/backend/docs/runbooks/local-bootstrap.md`, `platform/backend/docs/runbooks/auth-key-sources.md`, `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
- Backend proposals/reference/archive: `platform/backend/docs/proposals/kms-signing.md`, `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`, `platform/backend/docs/proposals/api-gateway-proxy-routing.md`, `platform/backend/docs/proposals/events-mails-cleanup.md`, `platform/backend/docs/proposals/schema-drift-checks.md`, `platform/backend/docs/reference/import-field-mapping.md`, `platform/backend/docs/reference/tenant-import-boundary.md`, `platform/backend/docs/archive/README.md`, `platform/backend/docs/archive/postgres-archive/README.md`
- Target docs rewrite structure: `maestro/memory/docs/target-docs-structure.md`
- Platform Studio suite: `maestro/memory/modules/domains/platform-studio/README.md`
- Platform Studio tracked suite docs: `platform/frontend/docs/contracts/platform-studio.md` and `platform/frontend/docs/modules/platform-studio/README.md`
- Form Builder tracked contract: `platform/frontend/docs/modules/platform-studio/form-builder.md`
- Form Builder field/catalog supporting contract: `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- Form Builder old detail triage: `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
- Form Builder backend contract: `platform/backend/docs/contracts/platform-studio-form-builder.md`
- Form Builder backend module map: `platform/backend/docs/modules/platform-studio/form-builder.md`
- Platform Studio tool map: `maestro/memory/modules/domains/platform-studio/tools/README.md`
- Reference code policy: `maestro/memory/durable/reference-code-policy.md`
- Reference code alias registry: `maestro/memory/reference-code/README.md`
- Reference code relocation checkpoint: `maestro/memory/reference-code/relocation-checkpoint.md`
- Archived retired runtime workflow: owner-managed external provenance or git history
- Platform docs AI retirement plan: owner-managed external provenance or git history
- Legacy runs triage: owner-managed external provenance or git history
