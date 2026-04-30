# Admin Control Plane State

Status: active compact state

## Landed

- Root-only Module Registry schema and list API are documented complete.
- Root-only Employees directory API exists for platform admin users.
- Module and section management API exists.
- Section-level grant model exists.
- Admin navigation projection exists.
- Endpoint authorization policy exists for the approved non-root slice.
- Tenant inventory list exists as root-only collection-table surface.

## Planned / Cleanup

- Frontend handoff, route alignment, and rollout cleanup remain documented as a cleanup/planned phase.
- Non-root tenant inventory should not be surfaced until route security coverage is approved and mapped.

## Risks

- Non-root navigation can expose sections before backend route coverage exists.
- Root-only assumptions can be weakened accidentally during UI work.
- Profile and navigation can drift if bootstrap payloads are merged.

