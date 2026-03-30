# Tenant Starter Field Targets

Status: proposed field-level baseline  
Date: 2026-03-30

## Goal

Define the field-level target for the first final tenant starter set, using `docs/MSSQL` as the migration reference.

Tables covered:

- `users`
- `company`
- `companytype`
- `projects`
- `projectsaccess`
- `events`
- `mails`

## Global Tenant Rules

These rules apply to every final tenant business table:

- tenant naming uses `<table>_<field>`
- every tenant table gets `<table>_tenant_id bigint not null`
- SQL Server `timestamp/rowstamp` columns are not kept as-is
- instead, use:
  - `<table>_created_at timestamptz not null default now()`
  - `<table>_updated_at timestamptz not null default now()`
- heavy activity/history tables stay in `public` and may be partitioned later

## Accepted GUID Policy

These rules apply to the first final tenant starter set:

- external/business entities use dual-key design
- legacy/business joins stay on `<table>_id bigint`
- API and integration identity use `<table>_guid uuid`
- if legacy already has a GUID field, preserve it
- if legacy does not have a usable GUID, backfill one during migration or bootstrap
- GUID is required for:
  - `users`
  - `company`
  - `companytype`
  - `projects`
- GUID is not required in the first baseline for:
  - `projectsaccess`
  - `events`
  - `mails`

## Critical Identity Decision For `users`

The current auth runtime expects a stable UUID-like tenant user identity, while legacy business tables use integer ids.

Accepted target direction:

- keep legacy-style business key `users_id bigint`
- preserve stable UUID key `users_guid uuid`
- use `users_guid` as the auth-facing stable user identity for tokens and integrations
- keep `users_id` as tenant-local relational/business key for legacy compatibility

This is the safest bridge between:

- legacy integer business relations
- new auth/session identity needs

## `users`

Purpose:

- tenant-local user directory
- login authority source for tenant users
- source for account lists and contact-like selections

System columns to add:

- `users_tenant_id bigint not null`
- `users_created_at timestamptz not null default now()`
- `users_updated_at timestamptz not null default now()`

Field decisions:

- `users_id`: keep, type `bigint`, primary key
- `users_rowstamp`: drop, replaced by `users_updated_at`
- `users_tourread`: keep, type `boolean`
- `users_access`: keep, type `boolean`, auth-critical
- `users_act`: keep, type `boolean`, visibility-critical
- `users_admin`: keep, type `boolean`, tenant-local admin
- `users_company_id`: keep, type `bigint`, FK to `company.company_id`
- `users_date`: keep, type `timestamptz`
- `users_dob`: keep, type `date` or `timestamptz`; prefer `date`
- `users_email`: keep, type `citext`, indexed
- `users_firstname`: keep, type `text`
- `users_lastname`: keep, type `text`
- `users_middlename`: keep, type `text`
- `users_mobilephone`: keep, type `text`
- `users_pager`: keep, type `text`
- `users_password`: do not keep as active auth field; if import is required, land only in staging/import surfaces, not final login model
- `users_phone`: keep, type `text`
- `users_title`: keep, type `text`
- `users_username`: keep, type `text`
- `users_supervisor`: keep, type `bigint`, self-reference to `users_id`
- `users_foreman`: keep, type `bigint`, self-reference to `users_id`
- `users_desc`: keep, type `text`
- `users_hiredate`: keep, type `date`
- `users_rehiredate`: keep, type `date`
- `users_lastwork`: keep, type `date`
- `users_termwork`: keep, type `date`
- `users_sex`: keep, type `text`
- `users_num`: keep, type `text`
- `users_pcode`: keep, type `text`
- `users_last`: keep, type `timestamptz`
- `users_lastModule`: keep, type `text`
- `users_lastAction`: keep, type `text`
- `users_lastPage`: keep, type `text`
- `users_lastWizard`: keep, type `text`
- `users_TimeZone`: keep, type `text`
- `users_address`: keep, type `text`
- `users_city`: keep, type `text`
- `users_state`: keep, type `text`
- `users_zip`: keep, type `text`
- `users_ssn`: defer from first final baseline due sensitivity; only add if business/legal need is explicitly confirmed
- `users_pwddate`: keep, type `timestamptz`
- `users_terms`: keep, type `boolean`
- `users_pwdchanged`: keep, type `integer`
- `users_demo`: keep, type `boolean`
- `users_status`: keep, type `text`
- `users_reason`: keep, type `text`
- `users_occupation`: keep, type `text`
- `users_salery`: keep, type `numeric(14,2)`
- `users_saleryper`: keep, type `numeric(14,2)`
- `users_systemid`: keep, type `text`
- `users_auth`: keep, type `integer`
- `users_sysid`: keep, type `text`
- `users_site`: keep, type `text`
- `users_usersid`: keep, type `text`
- `users_etsadmin`: keep, type `integer`
- `users_1027_super`: keep, type `bigint`
- `users_1042_dep`: keep, type `text`
- `users_1042_super2`: keep, type `bigint`
- `users_1042_super3`: keep, type `bigint`
- `users_1042_super1`: keep, type `bigint`
- `users_wccode`: keep, type `text`
- `users_wcdesc`: keep, type `text`
- `users_pushapp`: keep, type `text`
- `users_pushacc`: keep, type `text`
- `users_covidcheck`: keep, type `boolean`
- `users_honorific`: keep, type `text`
- `users_pincode`: keep, type `text`
- `users_codes`: keep, type `jsonb` if structure is machine-readable, otherwise `text`; default recommendation `jsonb`
- `users_guid`: keep, type `uuid not null unique`

Required indexes:

- unique `(users_tenant_id, users_guid)`
- unique `(users_tenant_id, users_email)` where email is not null
- index `(users_tenant_id, users_mobilephone)`
- index `(users_tenant_id, users_phone)`
- index `(users_tenant_id, users_company_id)`
- index `(users_tenant_id, users_act)`
- index `(users_tenant_id, users_access)`
- index `(users_tenant_id, users_admin)`

Semantic rules:

- login requires both `users_access = true` and `users_act = true`
- directory/account/contact selection is controlled primarily by `users_act`
- `users_admin` is tenant-local privilege only

## `company`

Purpose:

- tenant business/company directory

System columns to add:

- `company_tenant_id bigint not null`
- `company_created_at timestamptz not null default now()`
- `company_updated_at timestamptz not null default now()`

Field decisions:

- `company_id`: keep, type `bigint`, primary key
- `company_rowstamp`: drop, replaced by `company_updated_at`
- `company_act`: keep, type `boolean`
- `company_address`: keep, type `text`
- `company_address2`: keep, type `text`
- `company_city`: keep, type `text`
- `company_comppol`: keep, type `text`
- `company_fax`: keep, type `text`
- `company_name`: keep, type `text`, indexed
- `company_phone`: keep, type `text`
- `company_state_id`: keep, type `bigint`
- `company_unempol`: keep, type `text`
- `company_url`: keep, type `text`
- `company_type`: keep for migration compatibility, type `text`; later may be normalized against `companytype`
- `company_zip`: keep, type `text`
- `company_email`: keep, type `citext`
- `company_maincomp`: keep, type `bigint`
- `company_desc`: keep, type `text`
- `company_vendor`: keep, type `text`
- `company_tax`: keep, type `text`
- `company_liaison`: keep, type `text`
- `company_key`: keep, type `text`
- `company_premium`: keep, type `integer`
- `company_safpol`: keep, type `text`
- `company_TimeZone`: keep, type `text`
- `company_guid`: keep, type `uuid not null`
- `company_demo`: keep, type `boolean`
- `company_contactname`: keep, type `text`
- `company_naic`: keep, type `text`
- `company_product`: keep, type `text`
- `company_num`: keep, type `text`
- `company_recgroup`: keep, type `text`
- `company_geo`: keep, type `text`
- `company_connumber`: keep, type `text`
- `company_joined`: keep, type `date`

Required indexes:

- unique `(company_tenant_id, company_guid)`
- index `(company_tenant_id, company_name)`
- index `(company_tenant_id, company_act)`
- index `(company_tenant_id, company_email)`

## `companytype`

Purpose:

- tenant-local company type taxonomy

System columns to add:

- `companytype_tenant_id bigint not null`
- `companytype_created_at timestamptz not null default now()`
- `companytype_updated_at timestamptz not null default now()`

Field decisions:

- `companytype_id`: keep, type `bigint`, primary key
- `companytype_rowstamp`: drop, replaced by `companytype_updated_at`
- `companytype_name`: keep, type `text`
- `companytype_risk`: keep, type `text`
- `companytype_guid`: add, type `uuid not null`

Required indexes:

- unique `(companytype_tenant_id, companytype_guid)`
- unique `(companytype_tenant_id, companytype_name)`

## `projects`

Purpose:

- tenant-local project register

System columns to add:

- `projects_tenant_id bigint not null`
- `projects_created_at timestamptz not null default now()`
- `projects_updated_at timestamptz not null default now()`

Field decisions:

- `projects_id`: keep, type `bigint`, primary key
- `projects_rowstamp`: drop, replaced by `projects_updated_at`
- `projects_user`: keep, type `bigint`, FK to `users.users_id`
- `projects_date`: keep, type `timestamptz`
- `projects_act`: keep, type `boolean`
- `projects_address`: keep, type `text`
- `projects_address2`: keep, type `text`
- `projects_city`: keep, type `text`
- `projects_phone`: keep, type `text`
- `projects_fax`: keep, type `text`
- `projects_mail`: keep, type `citext`
- `projects_company_id`: keep, type `bigint`, FK to `company.company_id`
- `projects_contractor`: keep, type `bigint`
- `projects_datebegin`: keep, type `date`
- `projects_dateend`: keep, type `date`
- `projects_desc`: keep, type `text`
- `projects_info`: keep, type `text`
- `projects_name`: keep, type `text`
- `projects_num`: keep, type `text`
- `projects_projectsstatus_id`: keep, type `bigint`
- `projects_state_id`: keep, type `bigint`
- `projects_url`: keep, type `text`
- `projects_value`: keep, type `numeric(14,2)`
- `projects_zip`: keep, type `text`
- `projects_ocip`: keep, type `text`
- `projects_medfac8`: keep, type `integer`
- `projects_medfac24`: keep, type `integer`
- `projects_glocip`: keep, type `text`
- `projects_glbid`: keep, type `text`
- `projects_wcocip`: keep, type `text`
- `projects_wcbid`: keep, type `text`
- `projects_status`: keep, type `text`
- `projects_year`: keep, type `text`
- `projects_pc`: keep, type `text`
- `projects_rate`: keep, type `text`
- `projects_type`: keep, type `text`
- `projects_detailer`: keep, type `bigint`
- `projects_estimator`: keep, type `bigint`
- `projects_salesp`: keep, type `bigint`
- `projects_sov`: keep, type `text`
- `projects_estnum`: keep, type `text`
- `projects_estweight`: keep, type `text`
- `projects_fiunit`: keep, type `text`
- `projects_averate`: keep, type `text`
- `projects_camount`: keep, type `text`
- `projects_detunit`: keep, type `text`
- `projects_mrg`: keep, type `text`
- `projects_gamount`: keep, type `text`
- `projects_gmanhr`: keep, type `text`
- `projects_grate`: keep, type `text`
- `projects_lettersent`: keep, type `date`
- `projects_complete`: keep, type `date`
- `projects_contact`: keep, type `bigint`
- `projects_ptvender`: keep, type `bigint`
- `projects_sub`: keep, type `text`
- `projects_ve`: keep, type `text`
- `projects_payroll`: keep, type `text`
- `projects_applied`: keep, type `date`
- `projects_approved`: keep, type `date`
- `projects_pinnam`: keep, type `text`
- `projects_pinncost`: keep, type `text`
- `projects_pinnmarg`: keep, type `text`
- `projects_pinnpr`: keep, type `text`
- `projects_pcode`: keep, type `text`
- `projects_OHP`: keep, type `text`
- `projects_prman`: keep, type `bigint`
- `projects_psuper`: keep, type `bigint`
- `projects_psafrep`: keep, type `bigint`
- `projects_tar`: keep, type `bigint`
- `projects_subcontr`: keep, type `bigint`
- `projects_guid`: keep, type `uuid not null`
- `projects_demo`: keep, type `boolean`
- `projects_NAICSCode`: keep, type `text`
- `projects_inddesc`: keep, type `text`
- `projects_size`: keep, type `text`
- `projects_avg`: keep, type `text`
- `projects_geocode`: keep, type `text`

Required indexes:

- unique `(projects_tenant_id, projects_guid)`
- index `(projects_tenant_id, projects_name)`
- index `(projects_tenant_id, projects_num)`
- index `(projects_tenant_id, projects_company_id)`
- index `(projects_tenant_id, projects_user)`
- index `(projects_tenant_id, projects_act)`

## `projectsaccess`

Purpose:

- tenant-local project access mapping between projects and users

System columns to add:

- `projectsaccess_tenant_id bigint not null`
- `projectsaccess_created_at timestamptz not null default now()`
- `projectsaccess_updated_at timestamptz not null default now()`

Field decisions:

- `projectsaccess_id`: keep, type `bigint`, primary key
- `projectsaccess_rowstamp`: drop, replaced by `projectsaccess_updated_at`
- `projectsaccess_projects_id`: keep, type `bigint`, FK to `projects.projects_id`
- `projectsaccess_users_id`: keep, type `bigint`, FK to `users.users_id`
- `projectsaccess_role`: keep, type `text`

Required indexes:

- unique `(projectsaccess_tenant_id, projectsaccess_projects_id, projectsaccess_users_id, projectsaccess_role)`
- index `(projectsaccess_tenant_id, projectsaccess_projects_id)`
- index `(projectsaccess_tenant_id, projectsaccess_users_id)`

Design note:

- do not add `projectsaccess_guid` in the first baseline
- this is a link table, not a stable external business entity

## `events`

Purpose:

- tenant-local business and system event log

System columns to add:

- `events_tenant_id bigint not null`
- `events_created_at timestamptz not null default now()`
- `events_updated_at timestamptz not null default now()`

Field decisions:

- `events_id`: keep, type `bigint`, primary key
- `events_rowstamp`: drop, replaced by `events_updated_at`
- `events_date`: keep, type `date`
- `events_event`: keep, type `text`
- `events_module`: keep, type `text`
- `events_record`: keep, type `bigint`
- `events_table`: keep, type `text`
- `events_text`: keep, type `text`
- `events_time`: keep, type `timestamptz`
- `events_timezone`: keep, type `text`
- `events_users_id`: keep, type `bigint`, FK to `users.users_id`
- `events_users_ip`: keep, type `inet` if valid, otherwise `text`; default recommendation `inet`
- `events_to`: keep, type `text`
- `events_subject`: keep, type `text`
- `events_body`: keep, type `text`
- `events_files`: keep, type `jsonb` if structured, otherwise `text`; default recommendation `jsonb`
- `events_urls`: keep, type `jsonb` if structured, otherwise `text`; default recommendation `jsonb`

Required indexes:

- index `(events_tenant_id, events_event)`
- index `(events_tenant_id, events_module)`
- index `(events_tenant_id, events_record)`
- index `(events_tenant_id, events_table)`
- index `(events_tenant_id, events_users_id)`
- index `(events_tenant_id, events_time desc)`

Partitioning note:

- this is one of the first candidates for time-based partitioning in sandbox databases

Design note:

- do not add `events_guid` in the first baseline
- this is a high-volume history table and should optimize for tenant/time access patterns

## `mails`

Purpose:

- tenant-local outbound mail history

System columns to add:

- `mails_tenant_id bigint not null`
- `mails_created_at timestamptz not null default now()`
- `mails_updated_at timestamptz not null default now()`

Field decisions:

- `mails_id`: keep, type `bigint`, primary key
- `mails_rowstamp`: drop, replaced by `mails_updated_at`
- `mails_users_id`: keep, type `bigint`, FK to `users.users_id`
- `mails_date`: keep, type `timestamptz`
- `mails_timezone`: keep, type `text`
- `mails_from`: keep, type `text`
- `mails_to`: keep, type `text`
- `mails_cc`: keep, type `text`
- `mails_bcc`: keep, type `text`
- `mails_subject`: keep, type `text`
- `mails_body`: keep, type `text`
- `mails_who`: keep, type `text`
- `mails_files`: keep, type `jsonb` if structured, otherwise `text`; default recommendation `jsonb`
- `mails_urls`: keep, type `jsonb` if structured, otherwise `text`; default recommendation `jsonb`
- `mails_table`: keep, type `text`
- `mails_recid`: keep, type `bigint`

Required indexes:

- index `(mails_tenant_id, mails_users_id)`
- index `(mails_tenant_id, mails_recid)`
- index `(mails_tenant_id, mails_date desc)`

Partitioning note:

- this is one of the first candidates for time-based partitioning in sandbox databases

Design note:

- do not add `mails_guid` in the first baseline
- this is a high-volume history table and should optimize for tenant/time access patterns

## Transitional Current-Live Vs Final-Starter Note

Current live bundle still has:

- `contacts`

But the final starter set should move toward:

- `users`
- `company`
- `companytype`
- `projects`
- `projectsaccess`
- `events`
- `mails`
- plus technical/auth-support tables already approved separately

This means the current tenant bootstrap bundle must be rebuilt after these target decisions are approved.
