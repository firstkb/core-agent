# Backend Docs Archive Candidates

Status: local archive planning list
Last audited: 2026-04-25

This list tracks backend archive/history files and compatibility pointers during the backend docs rewrite.
Operational/proposal/reference/archive moves have already landed for the files listed here.

## Archive Or Historical Reference

- `platform/backend/docs/archive/backend-admin-module-registry-refactor-plan.md`
  - Reason: completed implementation plan; durable outcomes belong in admin module memory and current contracts.
- `platform/backend/docs/archive/backend-auth-cookie-migration-plan.md`
  - Reason: completed migration history; current behavior belongs in active auth contracts.
- `platform/backend/docs/archive/backend-tenant-starter-field-targets.md`
  - Reason: explicitly superseded by canonical tenant schema and field-mapping contracts.
- `platform/backend/docs/archive/backend-export-architecture-agent-prompt.md`
  - Reason: prompt artifact, not runtime/product truth.
- `platform/backend/docs/archive/GO_AGENT_RULES.md`
  - Reason: older agent guidance overlaps with current root/backend agent guidance and compact memory.
- `platform/backend/docs/archive/ramp_v_108_backend_standard_v_2.md`
  - Reason: large historical standard; useful facts should be distilled into active contracts.
- `platform/backend/docs/archive/postgres-archive/README.md`
  - Reason: legacy PostgreSQL SQL inventory; useful only for explicit schema archaeology or migration-history checks.

## Keep But Mark Narrow

- `platform/backend/docs/proposals/kms-signing.md`
  - Reason: planned KMS signer work; not part of active auth runtime unless implementation begins.
- `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`
  - Reason: proposed gateway mapping, useful when gateway deployment work starts.
- `platform/backend/docs/proposals/api-gateway-proxy-routing.md`
  - Reason: proposed gateway routing policy, useful when gateway deployment work starts.
- `platform/backend/docs/proposals/schema-drift-checks.md`
  - Reason: verification backlog, not schema source of truth.
- `platform/backend/docs/proposals/events-mails-cleanup.md`
  - Reason: events/mail cleanup proposal, useful only when cleanup work starts.

## Keep Active

- `platform/backend/docs/README.md`
- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/contracts/events-identity.md`
- `platform/backend/docs/modules/runtime.md`
- `platform/backend/docs/runbooks/local-bootstrap.md`
- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/runbooks/auth-key-sources.md`
- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`
- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

## Compatibility Pointers After Migration

- `platform/backend/docs/backend-current-to-target-map.md`
- `platform/backend/docs/backend-module-wiring-standard.md`
- `platform/backend/docs/backend-internal-foundation-matrix.md`
- `platform/backend/docs/backend-auth-gateway-contract.md`
- `platform/backend/docs/backend-auth-control-table-design.md`
- `platform/backend/docs/backend-auth-projection-and-sync.md`
- `platform/backend/docs/local-backend-bootstrap.md`
- `platform/backend/docs/auth/auth-key-source-configuration.md`
- `platform/backend/docs/auth/auth-kms-implementation-status.md`
- `platform/backend/docs/backend-api-gateway-http-api-mapping-spec.md`
- `platform/backend/docs/backend-api-gateway-proxy-routing-policy.md`
- `platform/backend/docs/backend-admin-tenant-events-mails-overlap-audit-v1.md`
- `platform/backend/docs/backend-schema-master-baseline.md`
- `platform/backend/docs/backend-schema-tenant-baseline.md`
- `platform/backend/docs/backend-schema-migrations-baseline.md`
- `platform/backend/docs/backend-schema-placement-and-naming.md`
- `platform/backend/docs/backend-tenant-canonical-refactor-contract-v1.md`
- `platform/backend/docs/backend-db-instance-secret-resolution.md`
- `platform/backend/docs/backend-tenant-canonical-field-mapping-v1.md`
- `platform/backend/docs/backend-tenant-import-module-boundary-v1.md`
- `platform/backend/docs/backend-admin-module-registry-brief.md`
- `platform/backend/docs/backend-admin-access-policy-layering.md`
- `platform/backend/docs/backend-events-identity-contract.md`
- `platform/backend/docs/backend-schema-drift-check-strategy.md`
- `platform/backend/docs/backend-admin-module-registry-refactor-plan.md`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`
- `platform/backend/docs/backend-tenant-starter-field-targets.md`
- `platform/backend/docs/backend-export-architecture-agent-prompt.md`
- `platform/backend/docs/GO_AGENT_RULES.md`
- `platform/backend/docs/ramp_v_108_backend_standard_v_2.md`
- `platform/backend/docs/legacy/postgres-archive/README.md`
  - Reason: old legacy path is pointer-only after the SQL payload moved to `archive/postgres-archive/`.
