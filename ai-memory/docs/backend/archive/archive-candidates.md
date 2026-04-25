# Backend Docs Archive Candidates

Status: local archive planning list
Last audited: 2026-04-25

This list is for the later physical backend docs rewrite.
It does not delete, move, or deprecate tracked files by itself.

## Archive Or Historical Reference

- `platform/backend/docs/backend-admin-module-registry-refactor-plan.md`
  - Reason: completed implementation plan; durable outcomes belong in admin module memory and current contracts.
- `platform/backend/docs/backend-tenant-starter-field-targets.md`
  - Reason: explicitly superseded by canonical tenant schema and field-mapping contracts.
- `platform/backend/docs/backend-export-architecture-agent-prompt.md`
  - Reason: prompt artifact, not runtime/product truth.
- `platform/backend/docs/legacy/**`
  - Reason: archive/reference material only.
- `platform/backend/docs/GO_AGENT_RULES.md`
  - Reason: older agent guidance overlaps with current root/backend agent guidance and compact memory.
- `platform/backend/docs/ramp_v_108_backend_standard_v_2.md`
  - Reason: large historical standard; useful facts should be distilled into active contracts.

## Keep But Mark Narrow

- `platform/backend/docs/backend-auth-cookie-migration-plan.md`
  - Reason: migration history and phase context; current behavior should come from compact auth memory and code.
- `platform/backend/docs/auth/auth-kms-implementation-status.md`
  - Reason: planned KMS signer work; not part of active auth runtime unless implementation begins.
- `platform/backend/docs/backend-api-gateway-http-api-mapping-spec.md`
  - Reason: proposed gateway mapping, useful when gateway deployment work starts.
- `platform/backend/docs/backend-api-gateway-proxy-routing-policy.md`
  - Reason: proposed gateway routing policy, useful when gateway deployment work starts.
- `platform/backend/docs/backend-schema-drift-check-strategy.md`
  - Reason: verification backlog, not schema source of truth.
- `platform/backend/docs/backend-admin-tenant-events-mails-overlap-audit-v1.md`
  - Reason: narrow audit for events/mail overlap, not a default admin read.

## Keep Active

- `platform/backend/docs/README.md`
- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/modules/runtime.md`
- `platform/backend/docs/local-backend-bootstrap.md`
- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/auth/auth-key-source-configuration.md`
- `platform/backend/docs/backend-admin-module-registry-brief.md`
- `platform/backend/docs/backend-admin-access-policy-layering.md`
- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/backend-db-instance-secret-resolution.md`
- `platform/backend/docs/backend-tenant-canonical-field-mapping-v1.md`
- `platform/backend/docs/backend-tenant-import-module-boundary-v1.md`
- `platform/backend/docs/backend-events-identity-contract.md`
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
- `platform/backend/docs/backend-schema-master-baseline.md`
- `platform/backend/docs/backend-schema-tenant-baseline.md`
- `platform/backend/docs/backend-schema-migrations-baseline.md`
- `platform/backend/docs/backend-schema-placement-and-naming.md`
- `platform/backend/docs/backend-tenant-canonical-refactor-contract-v1.md`
- `platform/backend/docs/backend-admin-module-registry-brief.md`
- `platform/backend/docs/backend-admin-access-policy-layering.md`
