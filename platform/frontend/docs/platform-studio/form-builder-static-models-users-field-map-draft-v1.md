# Static Models Users Field Map Draft v1

Status: draft
Date: 2026-04-15

## Purpose

This document fixes the first concrete field-map draft for the static `users` model.

It defines:

- the v1 field union for `users`
- the excluded physical columns that must stay out of Form Builder
- the two authored views currently required for `users`
- the grid column sets for those views
- the known implementation gaps that must be handled deliberately

## Source Evidence

This draft is based on:

- canonical tenant schema contract:
  - [backend-tenant-canonical-refactor-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/backend-tenant-canonical-refactor-contract-v1.md)
- UI screenshots for:
  - `List of Accounts`
  - `Contacts`
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

1. `Contacts`
2. `List of Accounts`

Recommended default:

- `Contacts`

Reason:

- `Contacts` is the broader canonical people/contact record
- `List of Accounts` is a narrower account-access admin surface over the same source table

Recommended runtime aliases:

- `Contacts` -> default view -> `viewRtAlias = default`
- `List of Accounts` -> secondary view -> `viewRtAlias = accounts`

Expected grid views:

- `vg_users__default`
- `vg_users__accounts`

## V1 Root Field Union

The root `users` model should seed the following v1 union.

| Label | Storage Key | Source Column | Kind | Notes |
| --- | --- | --- | --- | --- |
| `Id` | system | `id` | system/view-only | Use root record id, not a persisted editable field. |
| `First Name` | `first_name` | `first_name` | `short_text` | Present in both views. |
| `Middle Name` | `middle_name` | `middle_name` | `short_text` | Used by `Contacts`. |
| `Last Name` | `last_name` | `last_name` | `short_text` | Present in both views. |
| `System Access` | `system_access` | `system_access` | `boolean` | Used by `List of Accounts`. |
| `ADMIN Access` | `admin_access` | `admin_access` | `boolean` | Used by `List of Accounts`. |
| `ETS Admin` | `ets_admin` | `ets_admin` | `boolean` | Used by `List of Accounts`. |
| `Job Type` | `job_type_id` | `job_type_id` | `db_lookup` single | Lookup to `jobtype.id`, label `name`. |
| `Email` | `email` | `email` | `short_text` with email mode | Present in both views. |
| `Business Unit` | `company_id` | `company_id` | `db_lookup` single | Lookup to `company.id`, label `name`. |
| `Project Access List` | `project_access_manager` | none | `custom_widget` | `users`-hosted relation manager over `projectsaccess`. |
| `Employee Sex` | `sex` | `sex` | `short_text` or controlled select | Used by `Contacts`. |
| `Employee ID` | `employee_number` | `employee_number` | `short_text` | Used by `Contacts`. |
| `Employee Occupation` | `occupation` | `occupation` | `short_text` | Used by `Contacts`. |
| `Gross Wages/Salary($)` | `salary_amount` | `salary_amount` | `currency` | Used by `Contacts`. |
| `Gross Wages/Salary(Per)` | `salary_rate` | `salary_rate` | `short_text` | Used by `Contacts`; keep scalar until the business enum is fixed. |
| `Date of Birth` | `date_of_birth` | `date_of_birth` | `date` | Used by `Contacts`. |
| `Date of Hire` | `hire_date` | `hire_date` | `date` | Used by `Contacts`. |
| `Phone` | `phone` | `phone` | `short_text` | Used by `Contacts`. |
| `Mobile Phone` | `mobile_phone` | `mobile_phone` | `short_text` | Used by `Contacts`. |
| `Messenger App` | `messenger_app` | `messenger_app` | `short_text` or controlled select | Used by `Contacts`. |
| `Messenger Account` | `messenger_account` | `messenger_account` | `short_text` | Used by `Contacts`. |
| `City` | `city` | `city` | `suggest_text` | First accepted consumer of the new preset. |
| `State` | `state_id` | `state_id` | `db_lookup` single | Lookup to global `state.id`, primary label `name`. |
| `Timezone` | `timezone_id` | `timezone_id` | `db_lookup` single | Lookup to global `timezone.id`, primary label `name`. Not present in the initial two views. |
| `Zip` | `zip` | `zip` | `short_text` | Used by `Contacts`. |
| `Address` | `address_line_1` | `address_line_1` | `long_text` | Used by `Contacts`. |
| `Add. Info.` | `notes` | `notes` | `long_text` | Used by `Contacts`. |
| `Status` | `status` | `status` | `short_text` or controlled select | Used by `Contacts`. |
| `Active` | `active` | `active` | `boolean` | Root activity flag. |

## Explicitly Excluded Physical Columns

The following physical columns must stay out of v1 Form Builder schema for `users` unless a later slice explicitly adds them:

- `password`
- `ssn`
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

- v1 imports only the fields evidenced by the accepted `Contacts` and `List of Accounts` views, plus the `Project Access List` custom widget placeholder and the normalized lookup/FK fields required by the canonical tenant schema

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
- do not place it on the first two authored views until there is evidence for the right placement

### Access Flags

The following fields must render as yes/no UI values:

- `System Access`
- `ADMIN Access`
- `ETS Admin`
- `Active`

Source columns:

- `system_access`
- `admin_access`
- `ets_admin`
- `active`

Implementation note:

- all four are canonical boolean fields now and must share one yes/no UI contract

### City

`City` should use the newly accepted `suggest_text` preset.

Reason:

- it stays plain text
- users may need both existing values and new custom values
- it is the clearest current first-slice consumer of the `suggest_text` contract

## View A: `Contacts`

Recommended title:

- `Contacts`

Recommended role:

- default user/contact maintenance surface

### Grid Columns

Recommended `Contacts` grid order:

1. `Id`
2. `First Name`
3. `Middle Name`
4. `Last Name`
5. `Job Type`
6. `Business Unit`
7. `Employee ID`
8. `Email`
9. `Status`
10. `Active`

Implementation detail:

- `Business Unit` grid column should resolve to the company label, not raw `company_id`
- `Job Type` grid column should resolve to the jobtype label, not raw `job_type_id`

### Form Layout

Recommended `Contacts` form order:

1. `Id`
2. `First Name`
3. `Middle Name`
4. `Last Name`
5. `Job Type`
6. `Business Unit`
7. `Employee Sex`
8. `Employee ID`
9. `Employee Occupation`
10. `Gross Wages/Salary($)`
11. `Gross Wages/Salary(Per)`
12. `Date of Birth`
13. `Date of Hire`
14. `Email`
15. `Phone`
16. `Mobile Phone`
17. `Messenger App`
18. `Messenger Account`
19. `City`
20. `State`
21. `Zip`
22. `Address`
23. `Add. Info.`
24. `Status`
25. `Active`

Recommended section grouping:

- Identity: `Id`, `First Name`, `Middle Name`, `Last Name`
- Employment: `Job Type`, `Business Unit`, `Employee Sex`, `Employee ID`, `Employee Occupation`, wage fields, hire/birth dates
- Contact: `Email`, `Phone`, `Mobile Phone`, messenger fields
- Location and Status: `City`, `State`, `Zip`, `Address`, `Add. Info.`, `Status`, `Active`

## View B: `List of Accounts`

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
8. `ETS Admin`
9. `Active`

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
5. `ETS Admin`
6. `Job Type`
7. `Email`
8. `Business Unit`
9. `Project Access List`

Recommended section grouping:

- Identity: `First Name`, `Last Name`, `Email`
- Access: `System Access`, `ADMIN Access`, `ETS Admin`, `Active`
- Organization: `Job Type`, `Business Unit`
- Projects: `Project Access List`

### Project Access List

`Project Access List` stays a widget, not a normal stored field.

v1 placement:

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

`timezone_id` exists in the canonical tenant schema, but it is not evidenced on the two accepted legacy views.

Current v1 position:

- keep it in the model union
- do not place it on `Contacts` or `List of Accounts` until its correct surface is confirmed

## Migration Impact

The generic static-model migration draft must treat `users` as a special case:

- seed one `ps_model` row for `users`
- seed two `ps_view` rows:
  - `Contacts`
  - `List of Accounts`
- keep one shared canonical root runtime block:
  - `tableName = users`
  - `dataViewName = vw_users`
- create two managed grid views:
  - `vg_users__default`
  - `vg_users__accounts`

## Next Steps

1. Use this `users` draft as the first concrete static-model seed target.
2. Build the exact `dataSchema` payload for `users`.
3. Build the exact `uiSchema` payloads for:
   - `Contacts`
   - `List of Accounts`
4. After `users`, move to the remaining static models in the already accepted plan order.
