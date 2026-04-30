# Auth And Session Lessons

Status: active lessons

## Lessons

- Do not treat refresh token as frontend state. It is cookie-only and invisible to JavaScript.
- Do not use `/app/profile` as a navigation payload. Navigation is a separate admin contract.
- Do not key app bootstrap revalidation to every same-user access-token rotation; that causes visible shell churn.
- Do not clear auth state on every temporary refresh failure. Distinguish temporary recovery from invalid expired-session failures.
- Do not trust frontend-provided tenant identity during login or authenticated runtime behavior.

