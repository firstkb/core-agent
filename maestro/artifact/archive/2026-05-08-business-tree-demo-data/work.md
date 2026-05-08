# Business Tree Demo Data

Date: 2026-05-08

## Goal

Populate the local demo tenant database so `/app/pages/business-tree` in
`tenant-web` has a presentation-ready company hierarchy and enough contacts to
exercise lazy tree expansion.

## Scope

- Database: `108-demo`
- Tenant: `101`
- Tables intentionally changed: `companytype`, `company`, `users`,
  `projects`, `projectsaccess`
- Product code changes: none
- Migration changes: none
- Seed-file changes: none

## Backend Contract Observed

- `GET /app/pages/business-tree/nodes` reads active `company` rows.
- Root nodes are active companies where `main_company_id IS NULL`.
- Child company branches use `company.main_company_id`.
- Company labels are formatted as `companytype.name @ company.name`.
- Contact groups appear when active `users` rows point at a company through
  `users.company_id`.
- Project groups appear when active `projects` rows point at a company through
  `projects.company_id`.

## Data Shape

- Add/update business unit types for corporate, regional, operations, project
  office, contractor, logistics, training, and safety partner branches.
- Rename the placeholder local `Test Company` to `Atlas Safety Holdings`.
- Add a multi-root/multi-level company hierarchy for a realistic VSM demo.
- Add 150 generated demo users, distributed across the company hierarchy, while
  preserving the two existing local login users.
- Add generated demo projects distributed across the company hierarchy.
- Add project access rows that link project teams back to users.

## Safety

- No `DELETE`, `TRUNCATE`, migration, or product-code edit.
- The SQL is idempotent by type name, company name existence checks, and demo
  user email uniqueness. Project idempotence uses stable demo project numbers.
