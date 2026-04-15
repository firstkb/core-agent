# Static Models Users Field Map Draft v1

Status: draft
Date: 2026-04-15

## Purpose

This document fixes the first concrete field-map draft for the external/static `users` model.

It defines:

- the v1 field union for `users`
- the excluded physical columns that must stay out of Form Builder
- the two authored views currently required for `users`
- the grid column sets for those views
- the known implementation gaps that must be handled deliberately

## Source Evidence

This draft is based on:

- tenant dump: `/Users/andrew/Downloads/public_new.sql`
- UI screenshots for:
  - `List of Accounts`
  - `Contacts`
- legacy reference surfaces:
  - [ExtDBmdlU.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/EXTDB/Template/ExtDBmdlU.htm)
  - [default.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/EXTDB/default.asp)
  - [MdlAccess.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/EXTDB/Template/MdlAccess.htm)

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
| `Id` | system | `users_id` | system/view-only | Use root record id, not a persisted editable field. |
| `First Name` | `first_name` | `users_firstname` | `short_text` | Present in both views. |
| `Middle Name` | `middle_name` | `users_middlename` | `short_text` | Used by `Contacts`. |
| `Last Name` | `last_name` | `users_lastname` | `short_text` | Present in both views. |
| `System Access` | `system_access` | `users_access` | `boolean` or yes/no select | Used by `List of Accounts`. |
| `ADMIN Access` | `admin_access` | `users_admin` | `boolean` or yes/no select | Used by `List of Accounts`. |
| `ETS Admin` | `ets_admin` | `users_etsadmin` | `boolean` or yes/no select | Source is `int4`; coerce to boolean-like UI. |
| `Job Type` | `job_type` | `users_title` | text-backed controlled select | Source is text, not FK. |
| `Email` | `email` | `users_email` | `short_text` with email mode | Present in both views. |
| `Business Unit` | `business_unit` | `users_company_id` | `db_lookup` single | Lookup to `company.company_id`, label `company_name`. |
| `Project Access List` | `project_access_manager` | none | `custom_widget` | `users`-hosted relation manager over `projectsaccess`. |
| `Employee Sex` | `employee_sex` | `users_sex` | text-backed controlled select | Used by `Contacts`. |
| `Employee ID` | `employee_id` | `users_num` | `short_text` | Used by `Contacts`. |
| `Employee Occupation` | `employee_occupation` | `users_occupation` | `short_text` | Used by `Contacts`. |
| `Gross Wages/Salary($)` | `gross_wages_salary` | `users_salery` | `decimal` or `currency` | Used by `Contacts`. |
| `Gross Wages/Salary(Per)` | `gross_wages_salary_per` | `users_saleryper` | `decimal` | Confirm business meaning before labeling final. |
| `Date of Birth` | `date_of_birth` | `users_dob` | `date` | Used by `Contacts`. |
| `Date of Hire` | `date_of_hire` | `users_hiredate` | `date` | Used by `Contacts`. |
| `Phone` | `phone` | `users_phone` | `short_text` | Used by `Contacts`. |
| `Mobile Phone` | `mobile_phone` | `users_mobilephone` | `short_text` | Used by `Contacts`. |
| `Messenger App` | `messenger_app` | `users_pushapp` | `short_text` or controlled select | Used by `Contacts`. |
| `Messenger Account` | `messenger_account` | `users_pushacc` | `short_text` | Used by `Contacts`. |
| `City` | `city` | `users_city` | `short_text` | Used by `Contacts`. |
| `State` | `state` | `users_state` | text-backed controlled select | Stored as text, not FK. |
| `Zip` | `zip` | `users_zip` | `short_text` | Used by `Contacts`. |
| `Address` | `address` | `users_address` | `long_text` | Used by `Contacts`. |
| `Add. Info.` | `additional_info` | `users_desc` | `long_text` | Used by `Contacts`. |
| `Status` | `status` | `users_status` | `short_text` or controlled select | Used by `Contacts`. |
| `Active` | `active` | `users_act` | `boolean` or yes/no select | Root activity flag. |

## Explicitly Excluded Physical Columns

The following physical columns must stay out of v1 Form Builder schema for `users` unless a later slice explicitly adds them:

- `users_password`
- `users_ssn`
- `users_rowstamp`
- `users_tourread`
- `users_username`
- `users_supervisor`
- `users_foreman`
- `users_rehiredate`
- `users_lastwork`
- `users_termwork`
- `users_pcode`
- `users_last`
- `users_lastmodule`
- `users_lastaction`
- `users_lastpage`
- `users_lastwizard`
- `users_timezone`
- `users_pwddate`
- `users_terms`
- `users_pwdchanged`
- `users_demo`
- `users_reason`
- `users_systemid`
- `users_auth`
- `users_sysid`
- `users_site`
- `users_usersid`
- `users_1027_super`
- `users_1042_dep`
- `users_1042_super1`
- `users_1042_super2`
- `users_1042_super3`
- `users_wccode`
- `users_wcdesc`
- `users_covidcheck`
- `users_honorific`
- `users_pincode`
- `users_codes`

Rule:

- v1 imports only the fields evidenced by the accepted `Contacts` and `List of Accounts` views, plus the `Project Access List` custom widget placeholder

## Shared Field Rules

### Business Unit

`Business Unit` is a real lookup.

Mapping:

- source FK: `users_company_id`
- target model: `company`
- target key: `company_id`
- primary display: `company_name`

Authoring rule:

- forms display the label value
- grids should use the lookup label, not the raw FK

### Job Type

`Job Type` is stored in `users_title` as text.

This is not a physical FK in the source table.

v1 recommendation:

- model it as a controlled text field
- source the option set from `jobtype.jobtype_name`
- keep write-back as plain text to `users_title`

Do not fake a FK-based lookup here in v1.

### State

`State` is stored in `users_state` as text.

v1 recommendation:

- model it as a controlled text field
- source the option set from `state.state_name`
- keep write-back as plain text to `users_state`

Do not convert it to a FK contract in v1.

### Access Flags

The following fields must render as yes/no UI values:

- `System Access`
- `ADMIN Access`
- `ETS Admin`
- `Active`

Source columns:

- `users_access`
- `users_admin`
- `users_etsadmin`
- `users_act`

Implementation note:

- `users_etsadmin` is `int4` in the source table and needs explicit coercion

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

- `Business Unit` grid column should resolve to the company label, not raw `users_company_id`

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

Recommended `List of Accounts` grid order:

1. `User`
2. `Job Type`
3. `Email`
4. `Business Unit`
5. `Access`
6. `ADMIN`
7. `ETS Admin`
8. `Active`

Important note:

- `User` is not a raw physical column
- it should be rendered as a derived display value from `First Name` + `Last Name`

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

### Derived `User` Grid Column

`List of Accounts` needs a single `User` column, but the source table stores:

- `users_firstname`
- `users_lastname`

There is no physical `users_name` column.

Accepted implementation options:

1. add a canonical computed projection like `full_name` to `vw_users`
2. add a grid-only derived binding for concatenated names

Rejected option:

- silently changing the grid to separate first/last columns, because that no longer matches the legacy surface being reproduced

### Text-Backed Controlled Lists

These two fields are source-text columns, not FK relations:

- `Job Type`
- `State`

They need a deliberate external-option-source rule instead of pretending they are ordinary FK lookups.

### Mixed Boolean Storage

`users_access`, `users_admin`, and `users_act` are boolean.

`users_etsadmin` is integer.

All four must normalize to the same yes/no UI contract.

## Migration Impact

The earlier generic migration draft must treat `users` as a special case:

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

1. Confirm the `users` default view should be `Contacts`.
2. Confirm `List of Accounts` secondary `viewRtAlias = accounts`.
3. Decide how to implement derived `User` grid binding.
4. Decide the v1 option-source rule for text-backed `Job Type` and `State`.
5. After those confirmations, convert this draft into concrete migration seed JSON for `ps_model` and `ps_view`.
