---
description: Critical security rules that prevent disasters
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.py", "**/*.go"]
---

# Security Rules (Critical)

## NEVER

- ❌ Commit secrets/API keys/tokens to git
- ❌ Use `eval()` or `Function()` on user input
- ❌ Store passwords in plain text (use bcrypt/argon2)
- ❌ Concatenate SQL strings (use parameterized queries)
- ❌ Trust client-side validation alone

## ALWAYS

- ✅ Validate all user input on server
- ✅ Use HTTPS in production
- ✅ Add `.env` to `.gitignore`

## Additional note

Apply these security rules whenever the task touches authentication, authorization, public APIs, user input, file uploads, sessions, cookies, external APIs, secrets, tokens, or sensitive data.
