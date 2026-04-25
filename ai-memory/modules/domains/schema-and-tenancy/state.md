# Schema And Tenancy State

Status: active compact state

## Landed

- Current backend has explicit `cmd/migrate`.
- Master and tenant migration folders exist.
- Tenant bundle exists as `platform/backend/bundle/tenant_schema_full.sql`.
- Local DB topology is documented as `108-master`, `108-sandbox`, and `108-demo`.
- Tenant-aware design retains `tenant_id`.

## Planned / Deferred

- `cmd/worker` remains planned/deferred and should not be treated as active.
- Any worker/provisioning runtime must become code-real before memory treats it as landed.

## Risks

- Ad-hoc schema edits can drift from migration history.
- Bundle and forward migrations can diverge.
- Tenant isolation can be weakened if tenant scope is accepted from request payloads.
- Local seed/bootstrap nuances must be called out explicitly, especially for tenant-owned rows seeded outside tenant request context.

