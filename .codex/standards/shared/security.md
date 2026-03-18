# Security Baseline

Apply to all work unless a stricter local standard exists.

## Core requirements

1. Authenticate and authorize every protected operation.
2. Validate and sanitize all external inputs.
3. Minimize sensitive data exposure in logs, traces, and error output.
4. Define explicit error semantics without leaking internals.
5. Prefer least-privilege access for runtime identities and integrations.
6. Document security-relevant assumptions and open questions.

## Never rules

1. Never commit secrets, tokens, or credentials to git.
2. Never execute untrusted input via `eval`-style dynamic execution.
3. Never build SQL queries via string concatenation; use parameterized queries.
4. Never rely on client-side validation as the only validation layer.
5. Never store passwords in plain text.
