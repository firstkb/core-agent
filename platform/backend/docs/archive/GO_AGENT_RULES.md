# Go Backend Agent Instructions

Status: archived history
Last audited: 2026-04-25
Canonical scope: historical Go/backend agent rules

This is archived history.
Current agent guidance lives in root `AGENTS.md`, backend `AGENTS.md`, and Codex-native runtime docs.

Read instead:

- `AGENTS.md`
- `platform/backend/AGENTS.md`
- `docs/codex-native-repo.md`

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same operating rules load in any AI environment.

You operate inside a Go backend engineering system designed for deterministic delivery, maintainable architecture, and AI-readable code.
Your role is not to improvise large amounts of business logic in natural language.
Your role is to read instructions, make implementation decisions within the established architecture, and push execution into clear, testable Go code.

The primary goal is to produce backend systems that are:

- reliable
- explicit
- testable
- modular
- easy for humans to maintain
- easy for AI agents to understand and extend
- predictable in structure and behavior

LLMs are probabilistic. Production backends must not be.
This system reduces ambiguity by separating intent, orchestration, and deterministic implementation.

---

## Core Operating Model

### Layer 1: Directive (What must be built)
Directives define the task in natural language and live in `docs/`, `directives/`, `features/`, or other designated instruction locations.

A directive should define:
- business goal
- scope
- constraints
- inputs
- outputs
- acceptance criteria
- touched areas
- edge cases
- non-goals

The directive is the source of intent.

---

### Layer 2: Orchestration (How to approach the work)
This is your responsibility.

You must:
- read the directive carefully
- identify affected modules before coding
- inspect existing patterns before creating new ones
- choose the smallest correct change set
- preserve architectural consistency
- avoid introducing parallel patterns for the same concern
- prefer extension of existing conventions over invention of new local styles
- break work into clear implementation steps
- validate assumptions against repository structure and existing code

You are the routing layer between intent and deterministic implementation.

---

### Layer 3: Execution (Deterministic implementation)
Execution must live in Go code, tests, migrations, configuration, and documented contracts.

Preferred execution artifacts:
- Go packages
- handlers
- services
- repositories
- domain types
- validators
- middleware
- tests
- migrations
- configuration structs
- OpenAPI / JSON contracts if applicable

Do not solve repeatable backend problems in prose when they can be encoded in Go.

---

## Primary Objective

Build backend code that is:

1. easy to reason about
2. easy to test
3. easy to extend
4. easy to review
5. easy for future AI agents to navigate without guessing

Every change should make the codebase more standardized, not less.

---

## Architectural Philosophy for Go Backend

### 1. Prefer explicitness over magic
Use clear structs, interfaces only where needed, explicit dependency injection, explicit error handling, and predictable control flow.

Avoid:
- hidden side effects
- overly dynamic patterns
- reflection-heavy designs unless truly justified
- framework-style magic abstractions
- implicit global state

---

### 2. Prefer modular monolith discipline unless explicitly instructed otherwise
Default to a modular monolith approach with clear boundaries between modules.

Each module should have:
- bounded responsibility
- explicit inputs and outputs
- minimal knowledge of other modules
- no leaking of transport concerns into domain logic
- no leaking of persistence concerns into domain logic unless repository-layer constrained

---

### 3. Keep business logic in Go, not in handlers
Handlers should:
- parse input
- validate transport-level fields
- call application/service layer
- map result to response

Handlers should not contain:
- large business rules
- long branching workflows
- repository orchestration
- inline SQL
- hidden retries
- ad hoc transaction logic

---

### 4. Separate layers clearly
Use consistent layer separation.

Typical flow:

`transport -> app/service -> domain logic -> repository/infrastructure`

Possible layer meanings:

- `transport` or `http`: request/response handling
- `app` or `service`: use-case orchestration
- `domain`: core business entities/rules
- `repository`: persistence interfaces and implementations
- `platform` / `infrastructure`: db, logging, config, auth, storage, external adapters

Do not mix all concerns inside a single package.

---

### 5. Optimize for AI-readable structure
Code must be easy to scan mechanically.

Prefer:
- small focused files
- predictable naming
- one clear responsibility per type
- constructor functions for dependencies
- stable package placement
- obvious entry points
- low surprise factor

Avoid:
- giant files
- giant god-services
- giant utility packages
- circular dependencies
- inconsistent naming for similar concepts
- duplicated patterns with slight variations

---

## Repository Navigation Rules

Before making changes:

1. identify the module
2. identify the entry point
3. identify existing patterns for similar functionality
4. inspect interfaces, services, repositories, DTOs, and tests
5. reuse the existing architecture unless it is clearly broken and the task explicitly allows refactoring

Never introduce a new pattern for:
- configuration
- logging
- repository access
- service wiring
- HTTP error handling
- validation
- response formatting

unless the directive explicitly requires architectural change.

---

## Standardization Rules

### Naming
Use stable, predictable names.

Prefer:
- `Service` for application/use-case orchestration if that convention already exists
- `Repository` for persistence abstraction
- `Handler` for transport entrypoints
- `Config` for configuration structs
- `Store` only if the repo already uses that term consistently
- `Client` for external API integrations
- `Provider` only when truly providing infrastructure or shared dependency construction

Avoid inventing synonyms for the same role across the codebase.

Bad:
- `Manager`, `Processor`, `Coordinator`, `Controller`, `Worker`, `Facade` all used randomly

Good:
- one concept -> one naming convention

---

### Package structure
Prefer package structure by responsibility and module, not by random technical fragments.

Good:
- `internal/platform/config`
- `internal/platform/logging`
- `internal/modules/users/service`
- `internal/modules/users/repository`
- `internal/modules/users/http`
- `internal/modules/users/domain`

Avoid:
- dumping everything into `utils`, `common`, `helpers`, `misc`, `shared` without strict purpose

---

### Functions
Prefer:
- short functions
- obvious input/output
- explicit returned errors
- low nesting
- early returns
- small private helper functions when they improve clarity

Avoid:
- 200-line functions
- hidden mutation across many structs
- nested condition pyramids
- mixing validation, orchestration, mapping, and persistence in one function

---

### Structs
Structs should model real responsibilities.

Prefer:
- focused structs
- explicit dependency fields
- clear constructor functions
- immutability by convention where practical

Avoid:
- catch-all service structs with unrelated dependencies
- mutable shared state unless justified
- dumping config, logger, repo, cache, notifier, auth, and mapper into everything without discipline

---

## Dependency Injection Rules

Use constructor-based dependency injection.

Preferred:
- `NewService(...)`
- `NewHandler(...)`
- `NewRepository(...)`

Dependencies should be:
- explicit
- minimal
- validated in constructor where appropriate

Do not hide dependencies through package globals.

Avoid:
- global db handles
- global config
- global loggers unless already standardized as safe shared infrastructure
- init-time magic wiring

---

## Interface Rules

Do not create interfaces by default.

Create an interface only when:
- multiple implementations are needed
- testing requires a seam at that boundary
- the abstraction is already meaningful in the domain

Prefer defining interfaces close to the consumer when appropriate.

Avoid:
- premature interface extraction
- one implementation + one interface everywhere by habit
- interface pollution for “clean architecture aesthetics” without actual value

---

## Error Handling Rules

Errors must be explicit, wrapped, and meaningful.

Prefer:
- contextual wrapping
- sentinel errors only when useful
- typed/domain errors where behavior depends on class of failure
- mapping infrastructure errors to domain/application meaning

Good:
- preserve root cause
- add operation context
- return predictable error categories

Avoid:
- silent failure
- ignored errors
- vague messages like `something went wrong`
- leaking raw DB/internal errors directly to API response
- panic for expected runtime conditions

Expected pattern:
- infrastructure error occurs
- service interprets or wraps it
- transport maps it to proper HTTP/API response

---

## HTTP/API Rules

Handlers must remain thin.

Handler responsibilities:
- decode request
- validate request shape
- call service
- map error to response
- encode response

Service responsibilities:
- business flow
- use-case logic
- transaction boundaries if applicable
- orchestration of domain and repositories

Repository responsibilities:
- persistence only

Avoid:
- SQL in handlers
- business rules in handlers
- HTTP-specific types leaking deep into service/domain

---

## Validation Rules

Use validation in layers.

### Transport validation
Check:
- required fields
- malformed payloads
- basic formats
- request DTO shape

### Business validation
Check:
- domain invariants
- business permissions
- state transitions
- cross-field business rules

Do not confuse transport validation with business rules.

---

## Persistence Rules

Repositories should encapsulate persistence details.

Repository implementations may include:
- SQL
- query builders
- transaction-aware operations
- row mapping

Repositories should not include:
- HTTP concerns
- response DTO assembly
- unrelated business branching

When changing persistence:
- inspect existing transaction patterns
- preserve consistency
- avoid ad hoc SQL placement

---

## Configuration Rules

Configuration must be centralized and typed.

Prefer:
- one configuration loading strategy
- environment-based configuration
- typed structs
- clear defaults where appropriate
- validation at startup

Avoid:
- scattered env reads across packages
- hidden fallback behavior
- repeated config parsing logic

All environment access should be localized to configuration/bootstrap layers.

---

## Logging Rules

Logging must be structured and purposeful.

Log:
- startup lifecycle
- important business operations where useful
- integration failures
- retries
- non-obvious state transitions
- diagnostic context for failures

Do not log:
- secrets
- tokens
- passwords
- raw sensitive payloads
- noisy line-by-line chatter without value

Prefer stable field names and consistent logging conventions.

---

## Testing Rules

Every meaningful backend change should consider tests.

Preferred test types:
- unit tests for focused logic
- repository/integration tests where persistence behavior matters
- handler tests for transport mapping if relevant
- table-driven tests where they improve clarity

Tests should verify:
- behavior
- edge cases
- error mapping
- business rules
- regression scenarios

Avoid:
- shallow tests that only mirror implementation
- brittle tests tied to irrelevant formatting
- giant unreadable test files

If a bug was fixed, add or update a test when practical.

---

## Migration and Schema Rules

If database schema changes are needed:
- use the repository’s existing migration approach
- keep migrations deterministic
- ensure backward-safety where required
- document assumptions if rollout order matters

Do not hide schema changes inside application startup logic.

---

## Change Management Rules

Before coding:
1. understand the directive
2. inspect the relevant module
3. inspect similar implementations
4. define the minimum correct change
5. implement
6. test
7. verify architectural consistency
8. update docs if needed

After coding:
- confirm imports are clean
- confirm naming is consistent
- confirm no dead code was introduced
- confirm layering is preserved
- confirm new code matches repository conventions

---

## Self-Improvement Loop

Errors and friction are signals.

When something breaks:
1. read the actual error carefully
2. identify whether the problem is code, architecture, config, contract, or data
3. fix the smallest correct layer
4. retest
5. improve the local pattern if necessary
6. document the rule if the lesson is reusable

The system should become more predictable after every issue.

Do not repeatedly patch symptoms while preserving structural confusion.

---

## Refactoring Policy

Refactor only when one of these is true:
- required to complete the task correctly
- needed to remove clear architectural duplication
- needed to preserve consistency with existing patterns
- explicitly requested

Avoid opportunistic refactoring explosions.

Prefer:
- small, contained refactors
- behavior-preserving changes
- structural cleanup tied to current work

---

## AI-Agent Readability Rules

All backend code should be optimized for future machine-assisted work.

That means:
- clear package boundaries
- stable naming
- explicit contracts
- minimal surprise
- low implicit context requirement
- code that can be understood file-by-file

Write code so another agent can safely continue your work with minimal guessing.

Prefer code that answers these questions immediately:
- where does the request enter?
- where is the use case handled?
- where is validation?
- where is persistence?
- where are errors mapped?
- where is config loaded?
- where are tests?

---

## What to Avoid

Avoid introducing:
- giant god packages
- giant utils packages
- mixed architectural styles inside one module
- handler-service-repository collapse into one file
- premature abstraction
- hidden globals
- untyped maps instead of structs where structs are appropriate
- duplicated error mapping logic
- inconsistent request/response models
- unclear ownership of transactions
- magic helper functions that obscure behavior

---

## Preferred Outcome

The correct result is not just “working code”.

The correct result is:
- working code
- architecturally consistent code
- standardized code
- testable code
- readable code
- extendable code
- code that future AI agents can navigate safely

Every change should move the backend toward a cleaner, more uniform engineering system.

Be pragmatic.
Be explicit.
Be consistent.
Prefer deterministic Go over improvised intelligence.
