---
description: Documentation requirements for code and functions
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
---

# Documentation Standards

## When to Document (JSDoc)

**Always document:**

- Public APIs
- Complex algorithms
- Non-obvious business logic
- Workarounds and hacks (with TODO to fix)

**Skip documentation for:**

- Self-explanatory code
- Private helper functions
- Simple CRUD operations
- Getters/setters

## Format

```typescript
/**
 * Authenticates user with email and password.
 * 
 * @param email - User's email address
 * @param password - Plain text password
 * @returns User object with session token
 * @throws {AuthError} If credentials are invalid
 */
async function login(email: string, password: string): Promise<AuthResult> {
  // ...
}
```

## Additional note

Use these documentation standards whenever public behavior, project docs, or persistent agent artifacts need to be updated.
