# Backend Events Identity Contract

Status: accepted

## Scope

This document fixes the actor identity contract for `events` in both:

- `master.events`
- `tenant.events`

## Fields

`events` keeps three identity-related fields:

- `guid`
  - stable UUID identity of the event row itself
- `user_id`
  - nullable tenant business user id when known
- `principal_guid`
  - canonical UUID of the acting principal

## Naming Decision

`principal_guid` is the canonical actor UUID field.

Reason:

- not every acting identity is a tenant `user`
- admin users, delegated root access, and future system actors are also principals
- `principal` is more accurate than `actor_guid` or `users_guid`

## Population Rules

Tenant business event:

- write `user_id` when tenant `users.id` is known
- write `principal_guid` when UUID identity is also known

Admin or root event:

- `user_id = null`
- `principal_guid = UUID`

Migrated MSSQL event:

- write `user_id` from legacy source rows when available
- `principal_guid = null` unless a trustworthy UUID mapping exists

## Runtime Policy

New auth and control-plane events should prefer `principal_guid` as the canonical identity surface.

`user_id` remains important for:

- tenant business reporting
- imported MSSQL history
- legacy joins that still rely on business ids during migration

The system must not regress to a `user_id`-only model because admin and control-plane events do not always have a stable tenant business user id.
