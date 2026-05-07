# Schema And Tenancy Lessons

Status: active lessons

## Lessons

- Do not run migrations from API startup for convenience.
- Do not remove `tenant_id` just because a table is in a dedicated tenant DB.
- Do not trust request-provided tenant identifiers.
- Do not update tenant bundle or forward migrations silently; keep them coherent.
- When a migration seed runs outside tenant request context, record tenant ownership assumptions explicitly.
- New tenant tables must include the canonical audit surface unless an explicit
  exception is recorded: `guid`, `created_at`, `updated_at`, an `updated_at`
  index where useful, and the shared `set_updated_at()` trigger.
