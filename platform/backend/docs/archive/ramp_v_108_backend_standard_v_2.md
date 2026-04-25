# RAMP Platform v108 — Master Architecture Document v1

Status: archived history
Last audited: 2026-04-25
Canonical scope: historical backend/platform standard

This is archived history.
Current repo/runtime and product contracts live in the active contract-first docs.

Read instead:

- `AGENTS.md`
- `docs/codex-native-repo.md`
- `platform/backend/docs/README.md`

**Document File:** `ramp-v108-backend-standard-v2.md`\
**Status:** Accepted / Working Standard\
**Scope:** Platform architecture baseline for AI-oriented development and backend implementation\
**Primary Focus:** Backend standard with platform-level structural context\
**Version:** v2

---

## 1. Purpose

This document defines the target architecture standard for **RAMP Platform v108** and establishes the baseline rules for:

- platform development in an **AI-oriented delivery model**;
- backend implementation in Go;
- frontend and backend separation inside a single monorepo;
- AI-agent orchestration across research, design, planning, implementation, review, security, debugging, reporting, and documentation;
- maintaining a modular architecture without premature decomposition into microservices.

This document is the master reference for architecture decisions related to the current implementation stage of the platform.

---

## 2. Architectural Position

For the current stage of RAMP Platform v108, the platform adopts the following strategy:

- the **platform is developed in a monorepo**;
- the **backend is implemented as a modular monolith**;
- the **frontend is split into separate product applications**;
- the **backend remains internally modular** to preserve future extraction options;
- **microservice extraction is deferred** until real operational, scaling, lifecycle, or ownership needs appear.

This is a deliberate decision based on the development model.

In a traditional engineering setup, microservices can be justified early when multiple teams independently build, deploy, and scale isolated subsystems. In an AI-agent orchestration model, the primary optimization target changes.

The platform must now optimize for:

- full-context analysis;
- predictable cross-cutting change management;
- lower contract fragmentation;
- lower coordination overhead;
- lower risk of architecture drift;
- simpler review, testing, and traceability for AI-generated changes.

Because of that, the preferred model for the current phase is a **modular monolith inside a monorepo**, not an early service-heavy backend.

---

## 3. AI-Oriented Development Model

RAMP Platform v108 is designed to be developed through an AI-agent orchestration workflow rather than through a purely human-only classical delivery model.

This changes architectural priorities.

### 3.1. Why architecture must support AI-agent orchestration

When AI-agents participate in delivery, the system should be easier to:

- inspect end-to-end;
- reason about across layers;
- change without hidden dependency chains;
- validate against standards and contracts;
- review with explicit evidence.

Highly fragmented backend architectures increase the probability of:

- contract mismatch;
- duplicated logic;
- broken assumptions between repos or services;
- incomplete cross-layer updates;
- higher review costs;
- lower determinism during automated implementation.

### 3.2. Architectural objective for AI delivery

The architecture must reduce cognitive and structural fragmentation for:

- Research agent;
- Design agent;
- Plan agent;
- Implementer chain;
- Review and security agents;
- Documentation and reporting agents.

This document therefore treats architectural simplicity, modularity, and context continuity as first-class engineering requirements.

---

## 4. Target Platform Model

The platform is treated as one product ecosystem with multiple delivery surfaces.

### 4.1. Frontend product applications

The frontend is split by product application:

- **Client App** — tenant-facing product surface;
- **Admin App** — platform administration and control plane surface;
- **PWA App** — offline-oriented or lightweight operational surface, introduced later.

This separation is justified because these are different user-facing applications with different UX, routes, permissions, behavior, and lifecycle concerns.

### 4.2. Backend delivery surfaces

The backend is not split into many standalone services at the start. Instead, it provides multiple **entrypoints** for different access channels:

- **Client API**;
- **Admin API**;
- **Auth API**;
- **Worker runtime**;
- **Migration runtime**.

### 4.3. Business capability separation

The backend separates business logic by responsibility zones:

- **admin-specific modules**;
- **client-specific modules**;
- **shared platform business modules**.

### 4.4. Key principle

The architecture separates:

- frontend applications;
- backend entrypoints;
- backend business modules;
- platform infrastructure.

The architecture does **not** prematurely separate the core backend into many independent services without a real need.

---

## 5. Monorepo Strategy

The platform is developed in a **single monorepo**.

### 5.1. Target repo structure

```text
platform/
  README.md
  CHANGELOG.md

  apps/
    admin-web/
    client-web/
    pwa-web/

  packages/
    ui-kit/
    auth-sdk/
    api-sdk/
    tenant-core/
    forms-engine/
    offline-sync/
    shared-types/
    shared-utils/

  backend/
    README.md
    CHANGELOG.md
    bin/
    docker/
    docs/
    cmd/
    internal/
    modules/
    go.mod
    go.sum

  infra/
    docker/
    aws/
    gateway/
    env/

  docs/
    architecture/
    adr/
    api/
    agents/
    runbooks/

  scripts/
    dev/
    ci/
    release/
```

### 5.2. Why monorepo is required

The monorepo is not only a convenience choice. It is a structural requirement for the current delivery model.

It allows:

- end-to-end visibility for AI-agents;
- simpler cross-layer changes;
- shared contracts across backend and frontend;
- easier impact analysis;
- lower context loss;
- better traceability;
- stronger review and quality gates.

### 5.3. Repo design principle

The monorepo should preserve:

- explicit boundaries;
- clear ownership zones;
- predictable package reuse;
- limited accidental coupling.

The goal is **one repository, not one undifferentiated code mass**.

---

## 6. Backend Architectural Standard

The backend for RAMP Platform v108 is implemented as a **modular monolith**.

### 6.1. Meaning of modular monolith in this platform

A modular monolith in this standard means:

- one backend codebase;
- multiple runtime entrypoints;
- explicit internal module boundaries;
- centralized platform infrastructure;
- no premature network boundaries inside the backend;
- internal communication through Go code, interfaces, services, and application composition rather than forced inter-service RPC.

### 6.2. What modular monolith is not

It is **not**:

- a collection of hidden microservices in one repo;
- a distributed monolith connected by unnecessary gRPC inside one backend codebase;
- a flat shared folder with unclear ownership;
- business logic placed in entrypoint or platform folders.

### 6.3. Strategic reason for choosing modular monolith

This model is selected because it improves:

- predictability of AI-generated changes;
- codebase navigability;
- contract consistency;
- testability;
- change review;
- delivery speed for the first stable platform version.

---

## 7. Backend Go Module Root Standard

For RAMP Platform v108, the following rule is fixed:

### 7.1. Official rule

``** is the root of the Go module.**

This means:

- `go.mod` is located in `backend/`;
- `cmd/`, `internal/`, and `modules/` are located directly under `backend/`;
- `backend/src/` is **not** used as the Go module root.

### 7.2. Rationale

This rule is accepted because it provides:

- more idiomatic Go project structure;
- simpler build and test behavior;
- lower path complexity;
- better compatibility with tooling, IDEs, linters, generators, and Docker build flows;
- better predictability for AI-agents that operate on Go codebases.

### 7.3. Allowed backend top-level structure

```text
backend/
  README.md
  CHANGELOG.md
  bin/
  docker/
  docs/
  cmd/
  internal/
  modules/
  go.mod
  go.sum
```

### 7.4. Meaning of top-level backend folders

- `bin/` — operational shell scripts and run helpers;
- `docker/` — Dockerfiles, compose fragments, container runtime files;
- `docs/` — backend-specific technical documentation;
- `cmd/` — executable entrypoints;
- `internal/` — internal platform infrastructure;
- `modules/` — business modules;
- `README.md` — backend-level overview;
- `CHANGELOG.md` — backend-level change tracking.

---

## 8. Backend Target Structure

The target backend structure is:

```text
backend/
  README.md
  CHANGELOG.md
  bin/
  docker/
  docs/

  cmd/
    api-client/
    api-admin/
    auth/
    worker/
    migrate/

  internal/
    platform/
      config/
      logging/
      postgres/
      hosting/
      httpx/
      auth/
      tenant/
      storage/
      notify/
      options/
      errors/

  modules/
    admin/
      tenant-management/
      configuration/
      form-builder/
      report-builder/

    client/
      incidents/
      profile/
      action-items/
      dashboard/

    shared/
      authentication/
      sessions/
      forms/
      files/
      reports/
      notifications/
      users/
      dictionaries/
```

This structure is the working standard unless replaced by an explicit later ADR.

---

## 9. Meaning of Backend Top-Level Zones

### 9.1. `cmd/`

`cmd/` contains the executable entrypoints for backend runtimes.

It is the location for runtime bootstrapping, route registration, middleware assembly, dependency wiring, and application startup.

Business logic must not be implemented directly in `cmd/`.

### 9.2. `internal/platform/`

`internal/platform/` contains platform infrastructure and internal technical primitives.

This is where the platform keeps reusable backend infrastructure such as:

- config loading;
- logging;
- database wiring;
- startup lifecycle;
- HTTP helpers;
- auth primitives;
- tenant resolution helpers;
- storage adapters;
- notification adapters;
- common options;
- shared error mapping.

This is **not** a place for domain business logic.

### 9.3. `modules/`

`modules/` contains all backend business capabilities.

It is the main location for:

- use cases;
- business rules;
- repositories;
- domain models;
- DTOs;
- handlers;
- routes;
- business tests.

This is the center of backend behavior.

---

## 10. Backend Entrypoints Standard

The backend has multiple runtime entrypoints but remains one codebase.

### 10.1. `cmd/api-client`

Tenant-facing API for the Client App.

Responsibilities:

- client-facing routes;
- tenant-scoped request handling;
- access to client-facing business scenarios;
- work with tenant-scoped data;
- enforcement of client surface permissions and policies.

### 10.2. `cmd/api-admin`

Administrative API for the Admin App.

Responsibilities:

- control-plane routes;
- tenant management;
- configuration management;
- template and reporting management;
- master platform operations;
- work with master-level data.

### 10.3. `cmd/auth`

Always-on authentication service runtime.

Responsibilities:

- login;
- access token issue;
- refresh token issue;
- token refresh;
- session lifecycle;
- revoke and rotation logic;
- tenant-aware authentication;
- admin authentication.

### 10.4. `cmd/worker`

Background runtime for asynchronous jobs.

Responsibilities may include:

- notifications;
- report generation jobs;
- cleanup tasks;
- background processing;
- future sync execution;
- deferred business workflows.

### 10.5. `cmd/migrate`

Database migration runtime.

Responsibilities:

- schema migration execution;
- startup-safe migration entry;
- environment-bound migration orchestration.

---

## 11. Entrypoint Internal Layout Standard

Each primary runtime should use a simple, predictable internal structure.

### 11.1. Recommended layout

```text
cmd/api-client/
  main.go
  internal/
    server/
      app.go
      routes.go
      middleware.go
      wire.go
```

Equivalent structure applies to:

- `cmd/api-admin/`
- `cmd/auth/`
- other major runtime entrypoints where appropriate.

### 11.2. File responsibilities

#### `main.go`

Application start point.

#### `app.go`

Application structure and primary dependencies.

#### `routes.go`

Route registration.

#### `middleware.go`

Entrypoint-specific middleware chain.

#### `wire.go`

Dependency assembly and composition.

### 11.3. Hard rule

`cmd/*` must not become a container for business logic.

---

## 12. Platform Infrastructure Standard

`internal/platform/` defines reusable backend technical infrastructure.

### 12.1. `config/`

Configuration loading from:

- environment variables;
- files;
- parameter stores;
- secret stores;
- platform configuration sources.

### 12.2. `logging/`

Structured logging, correlation fields, request tracing, runtime diagnostics.

### 12.3. `postgres/`

PostgreSQL connections, transaction helpers, base DB primitives, repository support.

### 12.4. `hosting/`

Server lifecycle, startup, shutdown, runtime orchestration, graceful shutdown.

### 12.5. `httpx/`

HTTP request/response helpers, parsing, response writing, error mapping, shared HTTP utilities.

### 12.6. `auth/`

Platform-level security primitives only:

- JWT helpers;
- token parsing;
- claims extraction;
- middleware support.

Business login rules must not live here.

### 12.7. `tenant/`

Tenant resolution and tenant context helpers:

- host/subdomain parsing;
- tenant context injection;
- scope resolution helpers.

### 12.8. `storage/`

Storage adapters and file/object storage integration.

### 12.9. `notify/`

Low-level adapters for email, SMS, push, or message delivery providers.

### 12.10. `options/`

Startup options and runtime options.

### 12.11. `errors/`

Common error types and error translation rules.

---

## 13. Business Modules Standard

All business logic lives in `modules/`.

The modules are divided into:

- `modules/admin/`
- `modules/client/`
- `modules/shared/`

### 13.1. `modules/admin/`

This area contains business capabilities that belong only to the admin/control-plane surface.

Examples:

- `tenant-management/`
- `configuration/`
- `form-builder/`
- `report-builder/`

Criteria:

A capability belongs here when it is admin-specific and not a reusable platform-wide business capability.

### 13.2. `modules/client/`

This area contains business capabilities that belong only to the tenant-facing client surface.

Examples:

- `incidents/`
- `profile/`
- `action-items/`
- `dashboard/`

Criteria:

A capability belongs here when it is needed only by the client-facing product surface.

### 13.3. `modules/shared/`

This area contains shared business capabilities used by more than one surface.

Examples:

- `authentication/`
- `sessions/`
- `forms/`
- `files/`
- `reports/`
- `notifications/`
- `users/`
- `dictionaries/`

Criteria:

A capability belongs here only when it:

- is used by more than one surface;
- is expected to be reused by future surfaces such as PWA;
- represents a common platform business capability.

### 13.4. Hard warning for `shared`

`shared` must not become a dump zone.

Do not create vague generic folders such as:

- `common/`
- `helpers/`
- `misc/`
- `core/`
- `base/`

without a clearly bounded architectural meaning.

---

## 14. Module File Template Standard

A module should remain readable, practical, and not overly academic.

### 14.1. Example: client-specific module

```text
modules/client/incidents/
  model.go
  dto.go
  service.go
  repository.go
  repository_pg.go
  handler.go
  routes.go
  service_test.go
  handler_test.go
```

### 14.2. Example: shared module with multiple surfaces

```text
modules/shared/forms/
  model.go
  dto.go
  service.go
  repository.go
  repository_pg.go
  client_handler.go
  client_routes.go
  admin_handler.go
  admin_routes.go
  service_test.go
```

### 14.3. File meaning

- `model.go` — domain structures;
- `dto.go` — request/response DTOs;
- `service.go` — business logic;
- `repository.go` — data access interfaces;
- `repository_pg.go` — PostgreSQL implementation;
- `handler.go` / `*_handler.go` — HTTP handlers;
- `routes.go` / `*_routes.go` — route registration;
- `*_test.go` — tests.

### 14.4. Complexity rule

Modules may deepen internally only when necessary.

Do not pre-build a heavyweight multi-layer architecture everywhere. Increase complexity only where the module genuinely requires it.

---

## 15. Dependency Rules

Dependency direction must remain explicit.

### 15.1. Allowed dependency directions

- `cmd/*` → `modules/*`
- `cmd/*` → `internal/platform/*`
- `modules/admin/*` → `modules/shared/*`
- `modules/client/*` → `modules/shared/*`
- `modules/*` → `internal/platform/*` only where necessary and justified

### 15.2. Forbidden dependency directions

- `modules/shared/*` → `modules/admin/*`
- `modules/shared/*` → `modules/client/*`
- business logic in `cmd/*`
- domain services inside `internal/platform/*`

### 15.3. Principle

`shared` is foundational business capability space, not a layer that depends on surface-specific logic.

---

## 16. API and Transport Standard

The platform must avoid unnecessary transport diversity in the current phase.

### 16.1. Primary external API style

The preferred external API style is:

- **HTTP + JSON**;
- contract-first where practical;
- OpenAPI as the preferred contract baseline.

### 16.2. Internal backend communication rule

Inside the modular monolith, modules should communicate through:

- Go code;
- interfaces;
- service composition;
- repository calls;
- controlled runtime orchestration.

They should **not** communicate through artificial internal service protocols unless an actual runtime split already exists.

### 16.3. gRPC policy

gRPC should not be introduced inside the modular monolith merely to simulate future service boundaries.

It becomes acceptable only when:

- a real runtime boundary appears;
- an actual service extraction is approved;
- there is a technical reason to expose such a transport.

### 16.4. GraphQL policy

GraphQL is not the default platform contract style.

It should be introduced only if there is a clearly justified product or integration requirement.

---

## 17. Auth Boundary Standard

Authentication is implemented as a separate runtime entrypoint, but still inside the backend codebase.

### 17.1. Why auth is a separate entrypoint

Auth is treated as a separate security boundary because it includes:

- login flows;
- token issue;
- refresh flows;
- session lifecycle;
- tenant-aware authentication;
- admin authentication;
- revocation/rotation behavior.

### 17.2. Why auth is not a fully separate microservice yet

Even though auth is isolated as a runtime surface, it remains inside the backend codebase because:

- the system is still in the modular monolith stage;
- reuse of platform infrastructure is desirable;
- AI-agent orchestration benefits from having security logic visible in the same repository;
- premature repo/service fragmentation is avoided.

### 17.3. Core trust principle

The backend may accept a validated access token from API Gateway or an authorizer layer, but that never replaces backend authorization.

**Authentication trust does not replace authorization checks.**

The backend must still verify:

- tenant scope;
- permissions;
- user state;
- tenant state;
- access to the requested resource;
- platform-specific access rules.

---

## 18. Tenant and Data Boundary Principle

RAMP Platform v108 is tenant-aware and must preserve strong tenant isolation.

### 18.1. Tenant resolution principle

Tenant context must not be trusted only from a frontend-provided value.

Tenant context should be resolved through server-side mechanisms such as:

- host/subdomain;
- tenant registry;
- platform mapping rules;
- validated tenant context injection.

### 18.2. Platform data zones

The platform architecture distinguishes between:

- master/platform-level data;
- tenant-scoped data.

This distinction affects:

- admin flows;
- client flows;
- auth flows;
- repository access patterns;
- worker execution;
- migration logic.

### 18.3. Follow-up standard requirement

A separate detailed tenant-isolation and data-boundary standard should be maintained as a supporting architecture document.

This master document defines the principle, but not the full operational detail.

---

## 19. Worker Runtime Principle

`cmd/worker` is a first-class runtime, not a parking area for leftover logic.

### 19.1. Worker responsibilities

Worker runtime should execute asynchronous or background work such as:

- delayed notifications;
- report generation;
- cleanup tasks;
- retryable jobs;
- future sync jobs;
- scheduled platform processing.

### 19.2. Worker design requirement

Worker logic must follow explicit rules for:

- retries;
- idempotency;
- timeouts;
- error handling;
- visibility/observability;
- tenant-safe execution.

### 19.3. Follow-up standard requirement

A dedicated worker and job execution standard should later formalize:

- queue model;
- retry policy;
- poison handling;
- idempotency policy;
- execution evidence.

---

## 20. PWA Strategy

PWA App is introduced later and does not require a separate backend world at platform start.

### 20.1. Initial rule

PWA should reuse existing platform capabilities, preferably through `api-client`, as long as that remains technically sound.

### 20.2. When separate `api-pwa` becomes acceptable

A dedicated `api-pwa` entrypoint may be introduced later only if real requirements appear, such as:

- offline sync protocol;
- conflict resolution logic;
- sync batching;
- attachment queue behavior;
- highly specialized mobile payload contracts;
- significantly simplified operational surface.

Until such requirements exist, a separate PWA API is unnecessary.

---

## 21. Practical Design Rules

### Rule 1. Determine the correct zone first

Every new capability must first be classified as belonging to:

- `admin/`
- `client/`
- `shared/`

### Rule 2. Do not duplicate capability unnecessarily

If a capability is truly used by more than one surface, it should live in `shared/`.

### Rule 3. Entrypoints are not business containers

`api-client`, `api-admin`, `auth`, `worker`, and `migrate` are entrypoints or runtimes, not domain capability containers.

### Rule 4. Platform infrastructure does not replace business modules

For example:

- email provider adapter belongs in `internal/platform/notify/`;
- notification business rules belong in `modules/shared/notifications/`.

### Rule 5. Do not extract services too early

A module should first live inside the platform unless real reasons justify separation.

### Rule 6. Increase complexity locally, not globally

If one module grows, deepen that module. Do not prematurely introduce a heavyweight architecture across the entire backend.

---

## 22. AI-Agent Orchestration Model

The platform architecture is intentionally aligned with AI-agent orchestration.

### 22.1. Phase 1 — human-controlled architecture

Phase 1 keeps human control over the major design gates.

Pipeline:

- Task Intake
- Research (`Charlie`)
- Human Approval Gate
- Design (`Atlas`)
- Human Approval Gate
- Plan (`Delta`)
- Human Approval Gate
- Implementer Chain (`Forge`)
- Documenter (`Slate`)
- Delivery Package

Implementer Chain:

- Worker (`Mason`)
- Test (`Echo`)
- Review (`Beacon`)
- Security (`Guard`)
- Debugger (`Trace`)
- Reporter (`Brief`)

Phase 1 is the primary working model for controlled delivery.

### 22.2. Phase 2 — orchestrator-led automation

Phase 2 introduces the orchestrator (`Maestro`) as the top-level coordination module.

Responsibilities:

- task intake;
- platform classification;
- sub-task decomposition;
- launch of frontend/backend parallel chains;
- result aggregation;
- final delivery package assembly.

### 22.3. Critical orchestration principle

Automation does not remove governance.

High-risk flows should continue to require explicit approval policies, especially around:

- auth;
- tenancy;
- migrations;
- permissions;
- shared contracts;
- destructive operations;
- critical business workflows.

---

## 23. Why This Architecture Matches the AI-Oriented Model

This architecture is considered the correct current target because it helps:

- reduce structural complexity;
- reduce context fragmentation for AI-agents;
- simplify cross-cutting changes;
- preserve stronger reviewability;
- improve testing and delivery predictability;
- maintain business-process control;
- accelerate the first stable platform release.

This is not a retreat from good architecture.

It is a deliberate re-optimization of architecture for a different delivery model.

---

## 24. Future Extraction Policy

The architecture must preserve the ability to extract modules into standalone services later.

### 24.1. Extraction is allowed when justified by real need

Examples of valid reasons:

- independent lifecycle;
- independent scaling;
- isolated operational profile;
- security boundary;
- separate team ownership;
- explicit SLA requirement;
- infrastructure-driven constraint.

### 24.2. Extraction is not allowed for symbolic purity alone

The platform must not be fragmented only because microservices appear more modern or theoretically cleaner.

### 24.3. Design expectation

Modules should remain clean enough that future extraction is possible, but the codebase should not pay the full cost of distributed architecture before it is needed.

---

## 25. Final Architecture Decision

For **RAMP Platform v108**, the following decisions are fixed by this document:

1. The platform is developed in a **monorepo**.
2. The backend is implemented as a **modular monolith**.
3. The frontend is split into **Client App**, **Admin App**, and later **PWA App**.
4. The backend provides multiple entrypoints:
   - `api-client`
   - `api-admin`
   - `auth`
   - `worker`
   - `migrate`
5. ``** is the root of the Go module.**
6. Backend platform infrastructure is located in `internal/platform/`.
7. Backend business logic is located in `modules/`.
8. Business modules are divided into:
   - `admin/`
   - `client/`
   - `shared/`
9. Auth is implemented as an **always-on runtime entrypoint**, not as a Lambda-first default.
10. The backend may trust only a validated token for authentication state, but it must still enforce its own authorization checks.
11. PWA is introduced later and initially reuses existing backend platform capabilities.
12. Future service extraction remains possible but is explicitly deferred until technically justified.

---

## 26. Status of This Document

**Status:** Accepted / Working Standard

This document serves as:

- the master backend architecture baseline for RAMP Platform v108;
- the architectural reference for AI-agents;
- the implementation standard for backend structure;
- the reference point for future ADRs and supporting standards.

Subsequent supporting documents may further detail:

- tenant isolation;
- API contract policy;
- worker/job execution;
- SDK generation;
- infra/deploy rules;
- observability;
- security standards;
- migration safety;
- AI-agent artifact contracts.
