# Frontend Auth Integration Brief

Status: compatibility pointer
Owner: frontend
Last audited: 2026-04-25
Canonical scope: old path for frontend auth integration docs

This document has been compacted into:

- `platform/frontend/docs/contracts/auth-runtime.md`

Use the new contract for current frontend auth behavior.

Current summary:

- refresh token is cookie-backed and `HttpOnly`
- frontend stores only `accessToken` and `expiresAt`
- auth calls use `credentials: "include"`
- frontend does not send `tenantId` during login
- tenant and admin private shells enter only after real `/app/profile`
- admin navigation comes from `/app/me/navigation`, not profile
