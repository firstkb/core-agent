# Auth KMS Implementation Status

Status: planned
Date: 2026-03-30

## Current stage

KMS support is not yet active in runtime signing.

Current implementation state:

- `file`: implemented
- `secretsmanager`: implemented
- `kms`: config contract is present, but auth runtime returns an explicit unsupported error

This means:

- `KEYSOURCE=kms` is already a valid documented configuration mode
- the system intentionally fails fast instead of pretending to support KMS
- production must still use `file` or `secretsmanager` until KMS signer work is completed

## Already done

The following preparation work is complete:

1. Config surface exists in runtime.
   Supported env fields are already wired:
   - `*_AUTH_KEYSOURCE`
   - `*_AUTH_JWTAWSREGION`
   - `*_AUTH_JWTKMSKEYID`
   - `*_AUTH_JWTPRIVATEPEMSECRETNAME`
   - `*_AUTH_JWTPUBLICPEMSECRETNAME`

2. JWT issuer now routes by key source.
   Current source routing lives in:
   - [jwt_key_source.go](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/internal/platform/auth/jwt_key_source.go)

3. `kms` path fails explicitly.
   This is intentional and prevents false production assumptions.

4. File and Secrets Manager paths are already working.
   These are the safe current options until KMS signing is implemented.

## What is missing

The missing piece is the signer implementation for RS256 with AWS KMS.

Current blocker:

- `github.com/golang-jwt/jwt/v5` RS256 signing expects `*rsa.PrivateKey`
- AWS KMS does not expose the private key
- therefore KMS cannot use the existing `token.SignedString(privateKey)` path

## Required implementation steps

1. Add AWS KMS SDK dependency.
   Update:
   - `platform/backend/go.mod`

2. Add KMS client factory.
   Extend:
   - [jwt_key_source.go](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/internal/platform/auth/jwt_key_source.go)

3. Implement `kmsTokenSigner`.
   Required behavior:
   - compute `token.SigningString()`
   - compute SHA-256 digest
   - call `kms.Sign`
   - use `RSASSA_PKCS1_V1_5_SHA_256`
   - base64url-encode signature
   - assemble final JWT string manually

4. Load public key for validation and JWKS.
   Choose one of:
   - `kms.GetPublicKey`
   - separate public PEM from Secrets Manager

   Recommended direction:
   - use `kms.GetPublicKey`
   - derive RSA public key and JWKS directly
   - avoid keeping a second public-key secret unless operations require it

5. Validate KMS contract.
   Define final runtime rule:
   - `cmd/auth` needs `JWTKMSKEYID`
   - verifier-only runtimes may still use a public key only

6. Add tests.
   Minimum test set:
   - issuer init with `KEYSOURCE=kms`
   - manual JWT signing path
   - JWKS/public key derivation
   - missing key id negative case
   - KMS signing failure negative case

## Recommended next implementation order

1. Add KMS SDK and signer
2. Add `GetPublicKey` path from KMS
3. Wire JWKS generation to KMS public key
4. Add tests
5. Switch production recommendation from `secretsmanager` to `kms`

## Operational rule until KMS is complete

Do not set:

```env
*_AUTH_KEYSOURCE=kms
```

in active runtimes until the signer work is finished.

Use:

- `file` for local development
- `secretsmanager` for staging or temporary production-safe deployment

## Related docs

- [auth-key-source-configuration.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/auth/auth-key-source-configuration.md)
- [local-backend-bootstrap.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/local-backend-bootstrap.md)
