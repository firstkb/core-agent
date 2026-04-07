# Platform Studio Core

Typed metadata contracts, runtime validation schemas, and pure snapshot validation helpers for Platform Studio.

## Purpose

This package is the foundation contract layer for:

- Platform Studio builder draft state
- published metadata consumed by tenant runtime
- preview and future runtime resolve
- future Builder API request and response shapes

Current active product owner:

- `Form Builder`

Planned sibling domains under the same shared contract layer:

- `Navigation Builder`
- `Action Builder`

## Public API

- metadata contracts from `src/contracts/*`
- `zod` schemas from `src/schemas/*`
- pure validation helpers from `src/runtime/*`

## Boundary

- typed metadata only
- runtime-safe schema validation
- no React code
- no `ui-kit` imports
- no app-specific routing or UI composition
- no legacy field type codes
- compatibility aliases may exist while the repo migrates from older builder terminology to Platform Studio terminology

## Design Rules

- keep storage model separate from view layout model
- keep navigation targets typed
- keep policies and workflows minimal until the runtime contract is proven
- keep runtime consumers on published metadata only
