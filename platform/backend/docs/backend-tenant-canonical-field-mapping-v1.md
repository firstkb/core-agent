# Tenant Legacy To Canonical Field Mapping v1

Status: accepted  
Date: 2026-04-15

## Purpose

This document defines the explicit `legacy MSSQL -> canonical tenant PostgreSQL` field mapping used by the canonical tenant baseline.

Scope:

- `users`
- `company`
- `companytype`
- `jobtype`
- `projects`
- `projectsaccess`
- `events`
- `mails`
- `state`
- `timezone`

This mapping is the contract for the future import module. It is not the import implementation itself.

## Global Rules

- MSSQL `*_rowstamp` columns are dropped everywhere
- canonical runtime adds `tenant_id`, `created_at`, and `updated_at` to tenant-owned mutable tables
- canonical runtime keeps `guid` where explicitly defined in the canonical contract
- text-to-reference normalization is explicit; it is not inferred at runtime

## `state`

| Legacy column | Canonical column | Notes |
| --- | --- | --- |
| `state_id` | `id` | Legacy ids `1..51` are preserved. |
| `state_rowstamp` | dropped | Replaced by canonical runtime timestamps. |
| `state_name` | `code` + `name` | Split from values like `[WA] Washington`. |

Canonical-only columns:

- none

## `timezone`

There is no legacy MSSQL `timezone` table. Canonical `timezone` is a new seeded reference table.

Canonical columns:

- `id`
- `name`

## `companytype`

| Legacy column | Canonical column | Notes |
| --- | --- | --- |
| `companytype_id` | `id` | Preserve business identity. |
| `companytype_rowstamp` | dropped | Replaced by canonical runtime timestamps. |
| `companytype_name` | `name` | Direct rename. |
| `companytype_risk` | `risk` | Direct rename. |

Canonical-only columns:

- `tenant_id`
- `guid`
- `created_at`
- `updated_at`

## `jobtype`

| Legacy column | Canonical column | Notes |
| --- | --- | --- |
| `jobtype_id` | `id` | Preserve business identity. |
| `jobtype_rowstamp` | dropped | Replaced by canonical runtime timestamps. |
| `jobtype_name` | `name` | Direct rename. |
| `jobtype_act` | `active` | Semantic boolean rename. |
| `jobtype_guid` | `guid` | Preserve legacy guid. |

Canonical-only columns:

- `tenant_id`
- `created_at`
- `updated_at`

## `company`

| Legacy column | Canonical column | Notes |
| --- | --- | --- |
| `company_id` | `id` | Preserve business identity. |
| `company_rowstamp` | dropped | Replaced by canonical runtime timestamps. |
| `company_act` | `active` | Semantic boolean rename. |
| `company_address` | `address_line_1` | Canonical address naming. |
| `company_address2` | `address_line_2` | Canonical address naming. |
| `company_city` | `city` | Direct rename. |
| `company_comppol` | `company_policy` | Expand legacy abbreviation. |
| `company_fax` | `fax` | Direct rename. |
| `company_name` | `name` | Direct rename. |
| `company_phone` | `phone` | Direct rename. |
| `company_state_id` | `state_id` | Legacy state ids preserved. |
| `company_unempol` | `unemployment_policy` | Expand legacy abbreviation. |
| `company_url` | `url` | Direct rename. |
| `company_type` | `company_type_id` | Import resolves legacy value into `companytype.id`. |
| `company_zip` | `zip` | Direct rename. |
| `company_email` | `email` | Direct rename. |
| `company_maincomp` | `main_company_id` | Self-reference rename. |
| `company_desc` | `description` | Expand legacy abbreviation. |
| `company_vendor` | `vendor_code` | Canonical naming by business meaning. |
| `company_tax` | `tax_id` | Canonical naming by business meaning. |
| `company_liaison` | `liaison` | Direct rename. |
| `company_key` | `legacy_key` | Preserve meaning as imported key, not canonical business key. |
| `company_premium` | `premium` | Direct rename. |
| `company_safpol` | `safety_policy` | Expand legacy abbreviation. |
| `company_TimeZone` | `timezone_id` | Import resolves via `timezone.name`. |
| `company_guid` | `guid` | Preserve legacy guid. |
| `company_demo` | `demo` | Direct rename. |
| `company_contactname` | `contact_name` | Canonical snake_case rename. |
| `company_naic` | `naics_code` | Canonical name aligned to domain term. |
| `company_product` | `product_code` | Canonical name aligned to code semantics. |
| `company_num` | `company_number` | Expand ambiguous legacy abbreviation. |
| `company_recgroup` | `record_group` | Canonical snake_case rename. |
| `company_geo` | `geo_code` | Canonical name aligned to code semantics. |
| `company_connumber` | `contract_number` | Expand legacy abbreviation. |
| `company_joined` | `joined_at` | Canonical time naming. |

Canonical-only columns:

- `tenant_id`
- `created_at`
- `updated_at`

## `users`

| Legacy column | Canonical column | Notes |
| --- | --- | --- |
| `users_id` | `id` | Preserve business identity. |
| `users_rowstamp` | dropped | Replaced by canonical runtime timestamps. |
| `users_tourread` | `tour_read` | Canonical snake_case rename. |
| `users_access` | `system_access` | Semantic boolean rename. |
| `users_act` | `active` | Semantic boolean rename. |
| `users_admin` | `admin_access` | Semantic boolean rename. |
| `users_company_id` | `company_id` | Direct FK rename. |
| `users_date` | `recorded_at` | Canonical time naming. |
| `users_dob` | `date_of_birth` | Canonical domain rename. |
| `users_email` | `email` | Direct rename. |
| `users_firstname` | `first_name` | Canonical snake_case rename. |
| `users_lastname` | `last_name` | Canonical snake_case rename. |
| `users_middlename` | `middle_name` | Canonical snake_case rename. |
| `users_mobilephone` | `mobile_phone` | Canonical snake_case rename. |
| `users_pager` | `pager` | Direct rename. |
| `users_password` | `password` | Kept in DB/auth surface; excluded from Form Builder schema/UI. |
| `users_phone` | `phone` | Direct rename. |
| `users_title` | `job_type_id` | Import resolves legacy job title into `jobtype.id`. |
| `users_username` | `username` | Direct rename. |
| `users_supervisor` | `supervisor_user_id` | Self-reference rename. |
| `users_foreman` | `foreman_user_id` | Self-reference rename. |
| `users_desc` | `notes` | Rename to actual usage meaning. |
| `users_hiredate` | `hire_date` | Canonical snake_case rename. |
| `users_rehiredate` | `rehire_date` | Canonical snake_case rename. |
| `users_lastwork` | `last_work_date` | Canonical domain rename. |
| `users_termwork` | `termination_date` | Canonical domain rename. |
| `users_sex` | `sex` | Direct rename. |
| `users_num` | `employee_number` | Rename to likely business meaning. |
| `users_pcode` | `pcode` | Preserve literal domain code. |
| `users_last` | `last_seen_at` | Canonical time naming. |
| `users_lastModule` | `last_module` | Canonical snake_case rename. |
| `users_lastAction` | `last_action` | Canonical snake_case rename. |
| `users_lastPage` | `last_page` | Canonical snake_case rename. |
| `users_lastWizard` | `last_wizard` | Canonical snake_case rename. |
| `users_TimeZone` | `timezone_id` | Import resolves via `timezone.name`. |
| `users_address` | `address_line_1` | Canonical address naming. |
| `users_city` | `city` | Direct rename. |
| `users_state` | `state_id` | Import resolves via canonical `state` reference table. |
| `users_zip` | `zip` | Direct rename. |
| `users_ssn` | `ssn` | Direct rename. |
| `users_pwddate` | `password_changed_at` | Canonical time naming. |
| `users_terms` | `terms_accepted` | Semantic boolean rename. |
| `users_pwdchanged` | `password_changed_count` | Canonical naming by actual metric. |
| `users_demo` | `demo` | Direct rename. |
| `users_status` | `status` | Direct rename. |
| `users_reason` | `reason` | Direct rename. |
| `users_occupation` | `occupation` | Direct rename. |
| `users_salery` | `salary_amount` | Correct spelling and business meaning. |
| `users_saleryper` | `salary_rate` | Correct spelling and business meaning. |
| `users_systemid` | `system_id` | Canonical snake_case rename. |
| `users_auth` | `auth_level` | Canonical meaning rename. |
| `users_sysid` | `sys_id` | Direct rename. |
| `users_site` | `site` | Direct rename. |
| `users_usersid` | `legacy_user_id` | Preserve as external/legacy identifier. |
| `users_etsadmin` | `ets_admin` | Semantic boolean rename. |
| `users_1027_super` | `supervisor_1027_user_id` | Preserve special legacy relationship with clearer name. |
| `users_1042_dep` | `department_1042` | Preserve special legacy field with clearer name. |
| `users_1042_super2` | `supervisor_1042_user_id_2` | Preserve special legacy relationship with clearer name. |
| `users_1042_super3` | `supervisor_1042_user_id_3` | Preserve special legacy relationship with clearer name. |
| `users_1042_super1` | `supervisor_1042_user_id_1` | Preserve special legacy relationship with clearer name. |
| `users_wccode` | `wc_code` | Canonical snake_case rename. |
| `users_wcdesc` | `wc_description` | Expand legacy abbreviation. |
| `users_pushapp` | `messenger_app` | Canonical naming by actual usage. |
| `users_pushacc` | `messenger_account` | Canonical naming by actual usage. |
| `users_covidcheck` | `covid_check` | Canonical snake_case rename. |
| `users_honorific` | `honorific` | Direct rename. |
| `users_pincode` | `pin_code` | Canonical snake_case rename. |
| `users_codes` | `codes` | Direct rename into JSONB surface. |
| `users_guid` | `guid` | Preserve legacy guid. |

Canonical-only columns:

- `tenant_id`
- `created_at`
- `updated_at`

## `projects`

| Legacy column | Canonical column | Notes |
| --- | --- | --- |
| `projects_id` | `id` | Preserve business identity. |
| `projects_rowstamp` | dropped | Replaced by canonical runtime timestamps. |
| `projects_user` | `owner_user_id` | Clarify project owner relation. |
| `projects_date` | `recorded_at` | Canonical time naming. |
| `projects_act` | `active` | Semantic boolean rename. |
| `projects_address` | `address_line_1` | Canonical address naming. |
| `projects_address2` | `address_line_2` | Canonical address naming. |
| `projects_city` | `city` | Direct rename. |
| `projects_phone` | `phone` | Direct rename. |
| `projects_fax` | `fax` | Direct rename. |
| `projects_mail` | `email` | Canonical contact naming. |
| `projects_company_id` | `company_id` | Direct FK rename. |
| `projects_contractor` | `contractor_company_id` | Canonical FK naming. |
| `projects_datebegin` | `start_date` | Canonical domain rename. |
| `projects_dateend` | `end_date` | Canonical domain rename. |
| `projects_desc` | `description` | Expand legacy abbreviation. |
| `projects_info` | `info` | Direct rename. |
| `projects_name` | `name` | Direct rename. |
| `projects_num` | `project_number` | Canonical business naming. |
| `projects_projectsstatus_id` | `project_status_id` | Canonical FK naming. |
| `projects_state_id` | `state_id` | Direct FK rename. |
| `projects_url` | `url` | Direct rename. |
| `projects_value` | `contract_value` | Canonical business naming. |
| `projects_zip` | `zip` | Direct rename. |
| `projects_ocip` | `ocip` | Preserve literal domain term. |
| `projects_medfac8` | `medfac_8` | Preserve domain term, normalize shape. |
| `projects_medfac24` | `medfac_24` | Preserve domain term, normalize shape. |
| `projects_glocip` | `gl_ocip` | Preserve domain term, normalize shape. |
| `projects_glbid` | `gl_bid` | Preserve domain term, normalize shape. |
| `projects_wcocip` | `wc_ocip` | Preserve domain term, normalize shape. |
| `projects_wcbid` | `wc_bid` | Preserve domain term, normalize shape. |
| `projects_status` | `status` | Direct rename. |
| `projects_year` | `year` | Direct rename. |
| `projects_pc` | `pc` | Preserve literal domain code. |
| `projects_rate` | `rate` | Direct rename. |
| `projects_type` | `type` | Direct rename. |
| `projects_detailer` | `detailer_user_id` | Canonical FK naming. |
| `projects_estimator` | `estimator_user_id` | Canonical FK naming. |
| `projects_salesp` | `salesperson_user_id` | Canonical FK naming. |
| `projects_sov` | `sov` | Preserve literal domain term. |
| `projects_estnum` | `estimate_number` | Canonical business naming. |
| `projects_estweight` | `estimate_weight` | Canonical business naming. |
| `projects_fiunit` | `fi_unit` | Preserve literal domain term. |
| `projects_averate` | `average_rate` | Canonical business naming. |
| `projects_camount` | `c_amount` | Preserve literal domain term. |
| `projects_detunit` | `detail_unit` | Canonical business naming. |
| `projects_mrg` | `margin` | Expand legacy abbreviation. |
| `projects_gamount` | `g_amount` | Preserve literal domain term. |
| `projects_gmanhr` | `g_man_hours` | Preserve literal domain term. |
| `projects_grate` | `g_rate` | Preserve literal domain term. |
| `projects_lettersent` | `letter_sent_at` | Canonical time naming. |
| `projects_complete` | `completed_at` | Canonical time naming. |
| `projects_contact` | `contact_id` | Preserve existing relation surface. |
| `projects_ptvender` | `pt_vendor_company_id` | Correct spelling and clarify FK. |
| `projects_sub` | `sub` | Preserve literal domain code. |
| `projects_ve` | `ve` | Preserve literal domain code. |
| `projects_payroll` | `payroll` | Direct rename. |
| `projects_applied` | `applied_at` | Canonical time naming. |
| `projects_approved` | `approved_at` | Canonical time naming. |
| `projects_pinnam` | `pin_nam` | Preserve literal domain term. |
| `projects_pinncost` | `pin_cost` | Normalize shape. |
| `projects_pinnmarg` | `pin_margin` | Normalize shape. |
| `projects_pinnpr` | `pin_pr` | Normalize shape. |
| `projects_pcode` | `pcode` | Preserve literal domain code. |
| `projects_OHP` | `ohp` | Normalize case only. |
| `projects_prman` | `project_manager_user_id` | Canonical FK naming. |
| `projects_psuper` | `project_superintendent_user_id` | Canonical FK naming. |
| `projects_psafrep` | `project_safety_rep_user_id` | Canonical FK naming. |
| `projects_tar` | `tar` | Preserve literal domain field. |
| `projects_subcontr` | `subcontractor_company_id` | Canonical FK naming. |
| `projects_guid` | `guid` | Preserve legacy guid. |
| `projects_demo` | `demo` | Direct rename. |
| `projects_NAICSCode` | `naics_code` | Canonical snake_case rename. |
| `projects_inddesc` | `industry_description` | Expand legacy abbreviation. |
| `projects_size` | `size` | Direct rename. |
| `projects_avg` | `avg` | Preserve literal field until semantics are clarified. |
| `projects_geocode` | `geo_code` | Canonical snake_case rename. |

Canonical-only columns:

- `tenant_id`
- `created_at`
- `updated_at`

## `projectsaccess`

| Legacy column | Canonical column | Notes |
| --- | --- | --- |
| `projectsaccess_id` | `id` | Preserve business identity. |
| `projectsaccess_rowstamp` | dropped | Replaced by canonical runtime timestamps. |
| `projectsaccess_projects_id` | `project_id` | Canonical FK rename. |
| `projectsaccess_users_id` | `user_id` | Canonical FK rename. |
| `projectsaccess_role` | `role` | Direct rename. |

Canonical-only columns:

- `tenant_id`
- `created_at`
- `updated_at`

## `events`

| Legacy column | Canonical column | Notes |
| --- | --- | --- |
| `events_id` | `id` | Preserve business identity. |
| `events_rowstamp` | dropped | Replaced by canonical runtime timestamps. |
| `events_date` + `events_time` | `occurred_at` | Merge into one canonical timestamp. |
| `events_event` | `event` | Direct rename. |
| `events_module` | `module` | Direct rename. |
| `events_record` | `record_id` | Canonical FK-like naming. |
| `events_table` | `table_name` | Canonical naming by meaning. |
| `events_text` | `text` | Direct rename. |
| `events_timezone` | `timezone_name` | Direct rename. |
| `events_users_id` | `user_id` | Canonical FK rename. |
| `events_users_ip` | `user_ip` | Canonical snake_case rename. |
| `events_to` | `recipients` | Clarify multi-recipient meaning. |
| `events_subject` | `subject` | Direct rename. |
| `events_body` | `body` | Direct rename. |
| `events_files` | `files` | Imported into canonical JSONB payload. |
| `events_urls` | `urls` | Imported into canonical JSONB payload. |

Canonical-only columns:

- `tenant_id`
- `guid`
- `principal_guid`
- `data`
- `created_at`
- `updated_at`

## `mails`

| Legacy column | Canonical column | Notes |
| --- | --- | --- |
| `mails_id` | `id` | Preserve business identity. |
| `mails_rowstamp` | dropped | Replaced by canonical runtime timestamps. |
| `mails_users_id` | `user_id` | Canonical FK rename. |
| `mails_date` | `sent_at` | Canonical time naming. |
| `mails_timezone` | `timezone_name` | Direct rename. |
| `mails_from` | `from_address` | Canonical naming by meaning. |
| `mails_to` | `to_addresses` | Clarify multi-value meaning. |
| `mails_cc` | `cc_addresses` | Clarify multi-value meaning. |
| `mails_bcc` | `bcc_addresses` | Clarify multi-value meaning. |
| `mails_subject` | `subject` | Direct rename. |
| `mails_body` | `body` | Direct rename. |
| `mails_who` | `sender_name` | Canonical naming by meaning. |
| `mails_files` | `files` | Imported into canonical JSONB payload. |
| `mails_urls` | `urls` | Imported into canonical JSONB payload. |
| `mails_table` | `target_table` | Clarify target reference meaning. |
| `mails_recid` | `target_record_id` | Clarify target reference meaning. |

Canonical-only columns:

- `tenant_id`
- `guid`
- `created_at`
- `updated_at`
