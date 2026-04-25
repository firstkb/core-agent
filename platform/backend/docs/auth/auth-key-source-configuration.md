# Auth Key Source Configuration

Status: active
Date: 2026-03-30

## Purpose

This document defines how JWT signing and validation keys are configured for:

- `cmd/auth`
- `cmd/api-admin`
- `cmd/api-tenant`

Supported config strategy:

- `file`
- `secretsmanager`
- `kms`

Current build status:

- `file`: implemented
- `secretsmanager`: implemented
- `kms`: config contract is present, but runtime signing is not implemented in this build yet

Detailed KMS stage tracking:

- `platform/backend/docs/auth/auth-kms-implementation-status.md`

## Rule

- never commit real signing keys to git
- local development may generate keys under `platform/backend/certs/`
- production must not depend on repo PEM files
- `cmd/auth` needs signing capability
- `cmd/api-admin` and `cmd/api-tenant` only need verification capability when they validate bearer tokens locally

## Shared env keys

Each runtime uses the same logical auth key fields under its own prefix.

Auth runtime:

- `AUTHAPI_AUTH_KEYSOURCE`
- `AUTHAPI_AUTH_JWTPRIVATEPEMPATH`
- `AUTHAPI_AUTH_JWTPUBLICPEMPATH`
- `AUTHAPI_AUTH_JWTPRIVATEPEMSECRETNAME`
- `AUTHAPI_AUTH_JWTPUBLICPEMSECRETNAME`
- `AUTHAPI_AUTH_JWTAWSREGION`
- `AUTHAPI_AUTH_JWTKMSKEYID`

Admin API runtime:

- `ADMINAPI_AUTH_KEYSOURCE`
- `ADMINAPI_AUTH_JWTPRIVATEPEMPATH`
- `ADMINAPI_AUTH_JWTPUBLICPEMPATH`
- `ADMINAPI_AUTH_JWTPRIVATEPEMSECRETNAME`
- `ADMINAPI_AUTH_JWTPUBLICPEMSECRETNAME`
- `ADMINAPI_AUTH_JWTAWSREGION`
- `ADMINAPI_AUTH_JWTKMSKEYID`

Tenant API runtime:

- `TENANTAPI_AUTH_KEYSOURCE`
- `TENANTAPI_AUTH_JWTPRIVATEPEMPATH`
- `TENANTAPI_AUTH_JWTPUBLICPEMPATH`
- `TENANTAPI_AUTH_JWTPRIVATEPEMSECRETNAME`
- `TENANTAPI_AUTH_JWTPUBLICPEMSECRETNAME`
- `TENANTAPI_AUTH_JWTAWSREGION`
- `TENANTAPI_AUTH_JWTKMSKEYID`

Meaning:

- `KEYSOURCE`: where key material comes from
- `JWTPRIVATEPEMPATH`: filesystem path to private PEM
- `JWTPUBLICPEMPATH`: filesystem path to public PEM
- `JWTPRIVATEPEMSECRETNAME`: AWS Secrets Manager secret name for private PEM
- `JWTPUBLICPEMSECRETNAME`: AWS Secrets Manager secret name for public PEM
- `JWTAWSREGION`: explicit AWS region override
- `JWTKMSKEYID`: target KMS key id or ARN for future KMS signing mode

## Option 1: file

Use this for:

- local development
- temporary staging environments with mounted secrets
- any runtime where key files are injected outside git

Current support:

- fully implemented

### Local dev generation

From `platform/backend`:

```bash
./scripts/generate-dev-auth-keys.sh
```

This creates:

- `./certs/dev-auth-private.pem`
- `./certs/dev-auth-public.pem`

### Auth env example

```env
AUTHAPI_AUTH_KEYSOURCE=file
AUTHAPI_AUTH_JWTPRIVATEPEMPATH=./certs/dev-auth-private.pem
AUTHAPI_AUTH_JWTPUBLICPEMPATH=./certs/dev-auth-public.pem
AUTHAPI_AUTH_JWTPRIVATEPEMSECRETNAME=
AUTHAPI_AUTH_JWTPUBLICPEMSECRETNAME=
AUTHAPI_AUTH_JWTAWSREGION=
AUTHAPI_AUTH_JWTKMSKEYID=
```

### Admin API env example

If `api-admin` validates tokens locally, it only needs the public key. Keeping the private path empty is valid.

```env
ADMINAPI_AUTH_KEYSOURCE=file
ADMINAPI_AUTH_JWTPRIVATEPEMPATH=
ADMINAPI_AUTH_JWTPUBLICPEMPATH=./certs/dev-auth-public.pem
ADMINAPI_AUTH_JWTPRIVATEPEMSECRETNAME=
ADMINAPI_AUTH_JWTPUBLICPEMSECRETNAME=
ADMINAPI_AUTH_JWTAWSREGION=
ADMINAPI_AUTH_JWTKMSKEYID=
```

### Tenant API env example

```env
TENANTAPI_AUTH_KEYSOURCE=file
TENANTAPI_AUTH_JWTPRIVATEPEMPATH=
TENANTAPI_AUTH_JWTPUBLICPEMPATH=./certs/dev-auth-public.pem
TENANTAPI_AUTH_JWTPRIVATEPEMSECRETNAME=
TENANTAPI_AUTH_JWTPUBLICPEMSECRETNAME=
TENANTAPI_AUTH_JWTAWSREGION=
TENANTAPI_AUTH_JWTKMSKEYID=
```

### Notes

- `cmd/auth` must have private key access
- `cmd/api-admin` and `cmd/api-tenant` do not need private key access when they only verify JWTs
- PEM files under `platform/backend/certs/*.pem` are ignored by git

## Option 2: secretsmanager

Use this for:

- staging
- production when private keys are still PEM-based
- environments where the app can read AWS Secrets Manager but should not use repo files

Current support:

- fully implemented

Expected secret contents:

- private key secret: raw PEM string of the RSA private key
- public key secret: raw PEM string of the RSA public key

Example secret values:

Private secret:

```pem
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

Public secret:

```pem
-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```

### Auth env example

```env
AUTHAPI_AUTH_KEYSOURCE=secretsmanager
AUTHAPI_AUTH_JWTPRIVATEPEMPATH=
AUTHAPI_AUTH_JWTPUBLICPEMPATH=
AUTHAPI_AUTH_JWTPRIVATEPEMSECRETNAME=platform/auth/jwt/private
AUTHAPI_AUTH_JWTPUBLICPEMSECRETNAME=platform/auth/jwt/public
AUTHAPI_AUTH_JWTAWSREGION=us-east-1
AUTHAPI_AUTH_JWTKMSKEYID=
```

### Admin API env example

```env
ADMINAPI_AUTH_KEYSOURCE=secretsmanager
ADMINAPI_AUTH_JWTPRIVATEPEMPATH=
ADMINAPI_AUTH_JWTPUBLICPEMPATH=
ADMINAPI_AUTH_JWTPRIVATEPEMSECRETNAME=
ADMINAPI_AUTH_JWTPUBLICPEMSECRETNAME=platform/auth/jwt/public
ADMINAPI_AUTH_JWTAWSREGION=us-east-1
ADMINAPI_AUTH_JWTKMSKEYID=
```

### Tenant API env example

```env
TENANTAPI_AUTH_KEYSOURCE=secretsmanager
TENANTAPI_AUTH_JWTPRIVATEPEMPATH=
TENANTAPI_AUTH_JWTPUBLICPEMPATH=
TENANTAPI_AUTH_JWTPRIVATEPEMSECRETNAME=
TENANTAPI_AUTH_JWTPUBLICPEMSECRETNAME=platform/auth/jwt/public
TENANTAPI_AUTH_JWTAWSREGION=us-east-1
TENANTAPI_AUTH_JWTKMSKEYID=
```

### Notes

- for verifier-only runtimes, only the public key secret is required
- the current loader reads secret string or secret binary as PEM content
- `JWTAWSREGION` is optional if AWS region is already resolved by runtime environment

## Option 3: kms

Use this for:

- future production hardening where the private signing key must not leave AWS KMS

Current support:

- config contract exists
- current build returns an explicit unsupported error if `KEYSOURCE=kms`

### Target auth env example

This is the target shape once KMS signing is implemented.

```env
AUTHAPI_AUTH_KEYSOURCE=kms
AUTHAPI_AUTH_JWTPRIVATEPEMPATH=
AUTHAPI_AUTH_JWTPUBLICPEMPATH=
AUTHAPI_AUTH_JWTPRIVATEPEMSECRETNAME=
AUTHAPI_AUTH_JWTPUBLICPEMSECRETNAME=platform/auth/jwt/public
AUTHAPI_AUTH_JWTAWSREGION=us-east-1
AUTHAPI_AUTH_JWTKMSKEYID=arn:aws:kms:us-east-1:123456789012:key/00000000-0000-0000-0000-000000000000
```

Alternative target shape:

- instead of storing public PEM in Secrets Manager, the runtime may fetch the public key from KMS and derive JWKS from that

### Target admin API env example

If validator runtimes still validate locally, they need only the public key:

```env
ADMINAPI_AUTH_KEYSOURCE=kms
ADMINAPI_AUTH_JWTPRIVATEPEMPATH=
ADMINAPI_AUTH_JWTPUBLICPEMPATH=
ADMINAPI_AUTH_JWTPRIVATEPEMSECRETNAME=
ADMINAPI_AUTH_JWTPUBLICPEMSECRETNAME=platform/auth/jwt/public
ADMINAPI_AUTH_JWTAWSREGION=us-east-1
ADMINAPI_AUTH_JWTKMSKEYID=arn:aws:kms:us-east-1:123456789012:key/00000000-0000-0000-0000-000000000000
```

### Target tenant API env example

```env
TENANTAPI_AUTH_KEYSOURCE=kms
TENANTAPI_AUTH_JWTPRIVATEPEMPATH=
TENANTAPI_AUTH_JWTPUBLICPEMPATH=
TENANTAPI_AUTH_JWTPRIVATEPEMSECRETNAME=
TENANTAPI_AUTH_JWTPUBLICPEMSECRETNAME=platform/auth/jwt/public
TENANTAPI_AUTH_JWTAWSREGION=us-east-1
TENANTAPI_AUTH_JWTKMSKEYID=arn:aws:kms:us-east-1:123456789012:key/00000000-0000-0000-0000-000000000000
```

## What still must be implemented in code for real KMS support

The current blocker is not env or config. The missing piece is the signer implementation.

Required code work:

1. Add AWS KMS SDK dependency and client wiring.
   Files likely involved:
   - `platform/backend/internal/platform/auth/jwt_key_source.go`
   - `platform/backend/go.mod`

2. Add a KMS-backed signer implementation.
   Current `github.com/golang-jwt/jwt/v5` RS256 path expects `*rsa.PrivateKey`, so KMS cannot be plugged in via `SignedString(privateKey)`.

   Needed approach:
   - compute `token.SigningString()`
   - SHA-256 digest that string
   - call `kms.Sign` with:
     - `KeyId`
     - `MessageType=DIGEST`
     - `SigningAlgorithm=RSASSA_PKCS1_V1_5_SHA_256`
   - base64url-encode the returned signature and assemble final JWT manually

3. Teach `tokenSigner` about a `kmsTokenSigner`.
   Current file:
   - `platform/backend/internal/platform/auth/jwt_key_source.go`

   Needed:
   - `kmsTokenSigner.Sign(token *jwt.Token) (string, error)`
   - use KMS for signature generation

4. Load public key for validation and JWKS.
   One of these strategies must be chosen:
   - keep public PEM in Secrets Manager and load it from `JWTPUBLICPEMSECRETNAME`
   - or fetch KMS public key with `GetPublicKey` and derive RSA public key/JWKS directly

   If using `GetPublicKey`, update:
   - `platform/backend/internal/platform/auth/jwks.go`
   - possibly `JWTIssuer` initialization path

5. Define final KMS source contract.
   Decide whether `kms` requires:
   - `JWTKMSKEYID` only
   - or `JWTKMSKEYID + JWTPUBLICPEMSECRETNAME`

   My recommendation:
   - signing key from KMS
   - public key from KMS `GetPublicKey`
   - no separate public PEM secret unless there is an operational reason

6. Add tests.
   At minimum:
   - unit test for KMS signer assembly logic
   - issuer init test for `KEYSOURCE=kms`
   - JWKS/public key derivation test
   - negative test for unsupported algorithm or missing `JWTKMSKEYID`

## Recommended production direction

- local dev: `file`
- staging: `secretsmanager`
- production: `kms` after signer implementation is complete

## Related files

- `platform/backend/README.md`
- `platform/backend/docs/local-backend-bootstrap.md`
- `platform/backend/scripts/generate-dev-auth-keys.sh`
