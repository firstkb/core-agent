# Admin Module Registry State

Status: active compact state

## Landed

- Module Registry list/manage/grants are separate backend modules.
- Module Registry is root-only.
- Module Registry uses Collection Table for its list surface.
- Module Registry is now one of multiple admin Collection Table consumers.

## Planned / Watch

- Keep module-registry-specific behavior separate from generic `@platform/collection-table`.
- Update this pack if endpoint families change or new grant semantics are introduced.

## Risks

- Module Registry assumptions can leak into generic table runtime.
- Endpoint family changes can break admin app adapters if not updated together.
- Grant/root-only semantics can be weakened by UI convenience changes.

