# Backend Events Identity Contract

Status: accepted

## Scope

This document fixes the actor identity contract for `events` in both:

- `master.events`
- `tenant.events`

## Fields

`events` keeps three identity-related fields:

- `events_guid`
  - stable UUID identity of the event row itself
- `events_users_id`
  - legacy/internal tenant business row id from `users.users_id`
- `events_principal_guid`
  - canonical UUID of the acting principal

## Naming decision

`events_actor_guid` is replaced with `events_principal_guid`.

Reason:

- not every acting identity is a tenant `user`
- admin users, delegated root access, and future system actors are also principals
- `principal` is more accurate than `actor_guid` or `users_guid`

## Population rules

Tenant legacy event:

- write `events_users_id` when tenant `users.users_id` is known
- write `events_principal_guid` when tenant UUID identity is also known

Admin or root event:

- `events_users_id = null`
- `events_principal_guid = UUID`

Migrated MSSQL event:

- write `events_users_id` from legacy source rows when available
- `events_principal_guid = null` unless a trustworthy UUID mapping exists

## Runtime policy

New auth/control-plane events should prefer `events_principal_guid` as the canonical identity surface.

`events_users_id` remains important for:

- legacy joins
- tenant business reporting
- imported MSSQL history

The system must not regress to a `users_id`-only model because `master` and admin events do not have a stable tenant `users_id` reference.
