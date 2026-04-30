---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: security_permissions_contract
lang: en
---

# Maestro Security And Permissions Contract

## Purpose

This document defines the minimum permission and approval model for Maestro
vNext. It keeps agents useful without letting orchestration bypass owner,
security, repository, or production safety gates.

## Permission Rules

- Permissions are granted per work, task, stage, attempt, and repository
  checkout.
- Specialist packets must define allowed scope and do-not-change boundaries.
- Read-only agents must not patch product code or artifacts outside their
  assigned output.
- Code-writing agents must stay inside assigned scope.
- Production-impacting actions require explicit approval.
- Secrets must never be copied into artifacts, evidence, comments, or memory.

## Capability Matrix

| Role | Read Code | Write Code | Write Artifacts | Browser | Release | High-Risk Surfaces |
|---|---:|---:|---:|---:|---:|---:|
| Maestro | Yes | Tiny direct only | Yes | Optional | No | Approval only |
| Charlie | Yes | No | Research only | No | No | Read-only |
| Grant | Yes | No | Audit only | No | No | Read-only |
| Mason | Yes | Scoped | Assigned attempt | If assigned | No | Approval only |
| Scout | Yes | Limited | Evidence only | Yes | No | Check only |
| Lens | Yes | No | Review only | No | No | Read-only |
| Release | Yes | Limited | Release record | Optional | Yes | Approval only |
| Scribe | Yes | Docs/artifacts only | Closeout | No | No | No |
| Archivist | Yes | Docs/memory only | Memory audit | No | No | No |

## Approval Triggers

Approval is required before implementation or release when work touches:

- authentication or session behavior;
- tenant isolation, permissions, roles, or access control;
- database migrations or irreversible data changes;
- secrets, environment variables, credentials, or production config;
- CI/CD, deployment, release, or rollback paths;
- payment, billing, legal, compliance, or audit-sensitive behavior;
- destructive filesystem or git operations;
- merge to protected branches or production deployment.

Maestro may classify additional work as approval-required when repository facts
show similar blast radius.

## Path Scope

Task packets should classify paths as:

- `allowed`: files or directories the agent may change;
- `read_required`: files or docs the agent must inspect;
- `read_optional`: useful context;
- `forbidden`: files or directories the agent must not change;
- `high_risk`: paths that require approval before edits.

Examples of high-risk path classes:

- auth/session code;
- tenant context and permission checks;
- migrations and schema tools;
- secrets, env, deploy, CI, and infrastructure files;
- release scripts;
- production configuration;
- generated state or lockfiles outside the assigned scope.

## Agent Constraints

### Charlie

- read-only except assigned research artifacts;
- must separate observed facts from inference;
- must not propose lifecycle transitions as authority.

### Grant

- read-only except assigned audit output;
- challenges the brief, plan, dependencies, acceptance, and risk gates;
- does not approve the work.

### Mason

- may change scoped product code, docs, tests, and artifacts;
- must stop and hand back to Maestro when scope expands;
- must not perform release or production-impacting commands.

### Scout

- gathers verification evidence;
- may make limited non-product fixes only when explicitly reassigned;
- must report skipped checks and environment limits.

### Lens

- read-only review;
- reviews diff, evidence, acceptance, security risk, and missed tests;
- may request revision but does not mutate lifecycle state directly.

### Release

- only used after release approval;
- records release commands, links, and rollback notes;
- must not hide failed deployment or partial release state.

### Scribe

- records closeout, evidence summary, final decisions, and residual risks;
- does not rewrite product behavior;
- does not replace `ai-memory`.

### Archivist

- audits docs and `ai-memory` consistency;
- patches docs/memory only when assigned;
- does not own feature closeout.

## Secret Handling

- Do not store secrets in artifacts, screenshots, logs, evidence JSON, memory,
  or comments.
- Redact tokens, cookies, API keys, passwords, session IDs, and private URLs.
- Browser evidence should describe authenticated state without preserving
  sensitive credentials.
- If a command prints a secret, the output must not be attached as evidence.

## Gate Enforcement

Every gated action should have:

- approval type;
- target work/task/stage;
- requester;
- reason;
- required evidence;
- decision actor;
- decision timestamp;
- audit event.

Agents may request gates. Maestro decides whether the gate is satisfied and
whether owner confirmation is required before proceeding.
