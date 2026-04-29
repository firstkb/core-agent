# Maestro Frontend

Phase 1 Cockpit UI for Maestro.

## Stack

- React
- TypeScript
- Vite
- MUI Material

Use Node 22 for current MUI/Vite/Vitest tooling.

## Environment

```text
VITE_MAESTRO_API_URL=
```

Tracked example:

```text
.env.example
```

Local `.env` files are ignored by git.

By default the Vite dev server proxies `/api` to `http://127.0.0.1:8787`,
so browser requests stay same-origin. Set `VITE_MAESTRO_API_URL` only when
the Cockpit must call a different API origin directly.

## Commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

The Phase 1 UI reads the same Maestro API state that `maestroctl` writes.
