# Static Models Users Field Map Draft v1

Status: draft
Date: 2026-04-15

## Purpose

This document fixes the first concrete field-map draft for the static `users` model.

It defines:

- the v1 field union for `users`
- the excluded physical columns that must stay out of Form Builder
- the three authored views currently required for `users`
- the grid and form composition for those views
- the known implementation gaps that must be handled deliberately

## Source Evidence

This draft is based on:

- canonical tenant schema contract:
  - [backend-tenant-canonical-refactor-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/backend-tenant-canonical-refactor-contract-v1.md)
- UI screenshots for:
  - `Contacts`
  - `List of Accounts`
- static-model schema freeze:
  - [form-builder-static-models-schema-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md)

## Model Scope

Model:

- `users`

Source mode:

- `external`

Runtime root:

- `tableName = users`
- `dataViewName = vw_users`

## Recommended Seeded View Set

`users` should not be seeded with only one view.

Recommended initial views:

1. `Users`
2. `Contacts`
3. `List of Accounts`

Recommended default:

- `Users`

Reason:

- `Users` is the neutral full baseline over the same source table
- `Contacts` is the specialized contact-maintenance surface
- `List of Accounts` is the specialized account-access administration surface

Recommended runtime aliases:

- `Users` -> default view -> `viewRtAlias = default`
- `Contacts` -> secondary view -> `viewRtAlias = contacts`
- `List of Accounts` -> secondary view -> `viewRtAlias = accounts`

Expected grid views:

- `vg_users__default`
- `vg_users__contacts`
- `vg_users__accounts`

## V1 Root Field Union

The root `users` model should seed the following v1 union.

| Label | Storage Key | Source Column | Kind | Notes |
| --- | --- | --- | --- | --- |
| `Id` | system | `id` | system/view-only | Use root record id, not a persisted editable field. |
| `First Name` | `first_name` | `first_name` | `short_text` | Used by `Users`, `Contacts`, `List of Accounts`. |
| `Middle Name` | `middle_name` | `middle_name` | `short_text` | Used by `Users` and `Contacts`. |
| `Last Name` | `last_name` | `last_name` | `short_text` | Used by `Users`, `Contacts`, `List of Accounts`. |
| `System Access` | `system_access` | `system_access` | `boolean` | Used by `Users` and `List of Accounts`. |
| `ADMIN Access` | `admin_access` | `admin_access` | `boolean` | Used by `Users` and `List of Accounts`. |
| `Job Type` | `job_type` | `job_type_id` | `db_lookup` single | Lookup to `jobtype.id`, label `name`. |
| `Email` | `email` | `email` | `short_text` with email mode | Used by all three views. |
| `Business Unit` | `company` | `company_id` | `db_lookup` single | Lookup to `company.id`, label `name`. |
| `Project Access List` | `project_access_manager` | none | `custom_widget` | `users`-hosted relation manager over `projectsaccess`. Used by `Users` and `List of Accounts`. |
| `Employee Sex` | `sex` | `sex` | `short_text` or controlled select | Used by `Users` and `Contacts`. |
| `Employee ID` | `employee_number` | `employee_number` | `short_text` | Used by `Users` and `Contacts`. |
| `Employee Occupation` | `occupation` | `occupation` | `short_text` | Used by `Users` and `Contacts`. |
| `Gross Wages/Salary($)` | `salary_amount` | `salary_amount` | `currency` | Used by `Users` and `Contacts`. |
| `Gross Wages/Salary(Per)` | `salary_rate` | `salary_rate` | `short_text` | Used by `Users` and `Contacts`; keep scalar until the business enum is fixed. |
| `Date of Birth` | `date_of_birth` | `date_of_birth` | `date` | Used by `Users` and `Contacts`. |
| `Date of Hire` | `hire_date` | `hire_date` | `date` | Used by `Users` and `Contacts`. |
| `Phone` | `phone` | `phone` | `short_text` | Used by `Users` and `Contacts`. |
| `Mobile Phone` | `mobile_phone` | `mobile_phone` | `short_text` | Used by `Users` and `Contacts`. |
| `Messenger App` | `messenger_app` | `messenger_app` | `short_text` or controlled select | Used by `Users` and `Contacts`. |
| `Messenger Account` | `messenger_account` | `messenger_account` | `short_text` | Used by `Users` and `Contacts`. |
| `City` | `city` | `city` | `suggest_text` | First accepted consumer of the new preset. Used by `Users` and `Contacts`. |
| `State` | `state` | `state_id` | `db_lookup` single | Lookup to global `state.id`, primary label `name`. |
| `Timezone` | `timezone` | `timezone_id` | `db_lookup` single | Lookup to global `timezone.id`, primary label `name`. |
| `Zip` | `zip` | `zip` | `short_text` | Used by `Users` and `Contacts`. |
| `Address` | `address_line_1` | `address_line_1` | `long_text` | Used by `Users` and `Contacts`. |
| `Add. Info.` | `notes` | `notes` | `long_text` | Used by `Users` and `Contacts`. |
| `SSN` | `ssn` | `ssn` | `short_text` | Kept in the `Users` default full baseline only. |
| `Status` | `status` | `status` | `short_text` or controlled select | Used by `Users` and `Contacts`. |
| `Active` | `active` | `active` | `boolean` | Used by all three views. |

## Explicitly Excluded Physical Columns

The following physical columns must stay out of v1 Form Builder schema for `users` unless a later slice explicitly adds them:

- `password`
- `tour_read`
- `username`
- `supervisor_user_id`
- `foreman_user_id`
- `rehire_date`
- `last_work_date`
- `termination_date`
- `pcode`
- `last_seen_at`
- `last_module`
- `last_action`
- `last_page`
- `last_wizard`
- `password_changed_at`
- `terms_accepted`
- `password_changed_count`
- `demo`
- `reason`
- `system_id`
- `auth_level`
- `sys_id`
- `site`
- `legacy_user_id`
- `ets_admin`
- `supervisor_1027_user_id`
- `department_1042`
- `supervisor_1042_user_id_1`
- `supervisor_1042_user_id_2`
- `supervisor_1042_user_id_3`
- `wc_code`
- `wc_description`
- `covid_check`
- `honorific`
- `pin_code`
- `codes`
- `guid`
- `tenant_id`
- `recorded_at`
- `created_at`
- `updated_at`

Rule:

- v1 imports only the fields evidenced by the accepted `Contacts` and `List of Accounts` views, plus the `Users` baseline that merges them, the `Project Access List` custom widget placeholder, and the normalized lookup/FK fields required by the canonical tenant schema

## Shared Field Rules

### Business Unit

`Business Unit` is a real lookup.

Mapping:

- source FK: `company_id`
- target model: `company`
- target key: `id`
- primary display: `name`

Authoring rule:

- forms display the label value
- grids should use the lookup label, not the raw FK

### Job Type

`Job Type` is a real lookup in the canonical tenant schema.

Mapping:

- source FK: `job_type_id`
- target model: `jobtype`
- target key: `id`
- primary display: `name`

Authoring rule:

- do not keep the old text-backed `users_title` behavior in the new static-model contract

### State

`State` is a real lookup in the canonical tenant schema.

Mapping:

- source FK: `state_id`
- target model: `state`
- target key: `id`
- primary display: `name`

Authoring rule:

- use the canonical global reference table
- do not keep the old text-backed `users_state` behavior in the new static-model contract

### Timezone

`Timezone` is a real lookup in the canonical tenant schema.

Mapping:

- source FK: `timezone_id`
- target model: `timezone`
- target key: `id`
- primary display: `name`

v1 note:

- keep the field in the `users` model union
- place it on the `Users` default full baseline

### Access Flags

The following fields must render as yes/no UI values:

- `System Access`
- `ADMIN Access`
- `Active`

Source columns:

- `system_access`
- `admin_access`
- `active`

Implementation note:

- all three are canonical boolean fields now and must share one yes/no UI contract
- `ETS Admin` / `ets_admin` is intentionally excluded from the v1 `users` model

### City

`City` should use the newly accepted `suggest_text` preset.

Reason:

- it stays plain text
- users may need both existing values and new custom values
- it is the clearest current first-slice consumer of the `suggest_text` contract

## View A: `Users` (Default)

Recommended title:

- `Users`

Recommended role:

- default neutral baseline over the full `users` record
- source view for future copies and future default-only structure work

### Grid Columns

Recommended `Users` grid order:

1. `First Name`
2. `Middle Name`
3. `Last Name`
4. `Job Type`
5. `Business Unit`
6. `Employee ID`
7. `Email`
8. `Status`
9. `System Access`
10. `ADMIN Access`
11. `Active`

Implementation detail:

- `Business Unit` grid column should resolve to the company label, not raw `company_id`
- `Job Type` grid column should resolve to the jobtype label, not raw `job_type_id`

### Form Layout

Recommended `Users` form order:

1. `First Name`
2. `Middle Name`
3. `Last Name`
4. `System Access`
5. `ADMIN Access`
6. `Job Type`
7. `Email`
8. `Business Unit`
9. `Project Access List`
10. `Employee Sex`
11. `Employee ID`
12. `Employee Occupation`
13. `Gross Wages/Salary($)`
14. `Gross Wages/Salary(Per)`
15. `Date of Birth`
16. `Date of Hire`
17. `Phone`
18. `Mobile Phone`
19. `Messenger App`
20. `Messenger Account`
21. `City`
22. `State`
23. `Timezone`
24. `Zip`
25. `Address`
26. `Add. Info.`
27. `SSN`
28. `Status`
29. `Active`

Recommended section grouping:

- Identity: `First Name`, `Middle Name`, `Last Name`, `Email`
- Access and Projects: `System Access`, `ADMIN Access`, `Project Access List`
- Employment: `Job Type`, `Business Unit`, `Employee Sex`, `Employee ID`, `Employee Occupation`, wage fields, hire/birth dates
- Contact and Location: `Phone`, `Mobile Phone`, messenger fields, `City`, `State`, `Timezone`, `Zip`, `Address`, `Add. Info.`
- Record Status: `Status`, `Active`

## View B: `Contacts`

Recommended title:

- `Contacts`

Recommended role:

- specialized user/contact maintenance surface

### Grid Columns

Recommended `Contacts` grid order:

1. `First Name`
2. `Middle Name`
3. `Last Name`
4. `Job Type`
5. `Business Unit`
6. `Employee ID`
7. `Email`
8. `Status`
9. `Active`

Implementation detail:

- `Business Unit` grid column should resolve to the company label, not raw `company_id`
- `Job Type` grid column should resolve to the jobtype label, not raw `job_type_id`

### Form Layout

Recommended `Contacts` form order:

1. `First Name`
2. `Middle Name`
3. `Last Name`
4. `System Access`
5. `ADMIN Access`
6. `Job Type`
7. `Business Unit`
8. `Employee Sex`
9. `Employee ID`
10. `Employee Occupation`
11. `Gross Wages/Salary($)`
12. `Gross Wages/Salary(Per)`
13. `Date of Birth`
14. `Date of Hire`
15. `Email`
16. `Phone`
17. `Mobile Phone`
18. `Messenger App`
19. `Messenger Account`
20. `City`
21. `State`
22. `Zip`
23. `Address`
24. `Add. Info.`
25. `Status`
26. `Active`

Recommended section grouping:

- Identity: `First Name`, `Middle Name`, `Last Name`
- Access: `System Access`, `ADMIN Access`
- Employment: `Job Type`, `Business Unit`, `Employee Sex`, `Employee ID`, `Employee Occupation`, wage fields, hire/birth dates
- Contact: `Email`, `Phone`, `Mobile Phone`, messenger fields
- Location and Status: `City`, `State`, `Zip`, `Address`, `Add. Info.`, `Status`, `Active`

## View C: `List of Accounts`

Recommended title:

- `List of Accounts`

Recommended role:

- account-access administration surface over the same `users` records

### Grid Columns

Recommended `List of Accounts` grid order for v1:

1. `First Name`
2. `Last Name`
3. `Job Type`
4. `Email`
5. `Business Unit`
6. `System Access`
7. `ADMIN Access`
8. `Active`

Accepted v1 note:

- do not introduce a derived `User` grid column in this step
- keep the grid explicit with `First Name` + `Last Name`
- revisit a combined display column only if it becomes a separately accepted grid-derived contract

### Form Layout

Recommended `List of Accounts` form order:

1. `First Name`
2. `Last Name`
3. `System Access`
4. `ADMIN Access`
5. `Job Type`
6. `Email`
7. `Business Unit`
8. `Project Access List`
9. `Active`

Recommended section grouping:

- Identity: `First Name`, `Last Name`, `Email`
- Access: `System Access`, `ADMIN Access`, `Active`
- Organization: `Job Type`, `Business Unit`
- Projects: `Project Access List`

### Project Access List

`Project Access List` stays a widget, not a normal stored field.

v1 placement:

- present on `Users`
- present on `List of Accounts`
- not present on `Contacts`

Recommended widget key:

- `project_access_manager`

## Gaps That Must Be Handled Explicitly

### Suggest Endpoint For City

`City` is now the first concrete `suggest_text` candidate.

This requires:

- ajax suggestions from distinct existing `users.city` values
- tenant scoping
- custom typed values to remain valid

### Salary Rate Vocabulary

`Gross Wages/Salary(Per)` still needs a cleaner business contract.

Current v1 position:

- keep `salary_rate` as scalar text
- do not force a fake enum before the source vocabulary is reviewed

### Timezone Placement

`timezone_id` exists in the canonical tenant schema, but it is not evidenced on the accepted legacy screens.

Current v1 position:

- keep it in the model union
- do not place it on `Users`, `Contacts`, or `List of Accounts` until its correct surface is confirmed

## Migration Impact

The generic static-model migration draft must treat `users` as a special case:

- seed one `ps_model` row for `users`
- seed three `ps_view` rows:
  - `Users`
  - `Contacts`
  - `List of Accounts`
- keep one shared canonical root runtime block:
  - `tableName = users`
  - `dataViewName = vw_users`
- create three managed grid views:
  - `vg_users__default`
  - `vg_users__contacts`
  - `vg_users__accounts`

## Next Steps

1. Use this `users` draft as the first concrete static-model seed target.
2. Build the exact `dataSchema` payload for `users`.
3. Build the exact `uiSchema` payloads for:
   - `Users`
   - `Contacts`
   - `List of Accounts`
4. After `users`, move to the remaining static models in the already accepted plan order.
