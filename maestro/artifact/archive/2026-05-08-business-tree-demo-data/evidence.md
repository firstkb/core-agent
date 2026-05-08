# Evidence

Date: 2026-05-08

## Commands

- `psql -v ON_ERROR_STOP=1 -U postgres -d 108-demo -f maestro/artifact/active/2026-05-08-business-tree-demo-data/business-tree-demo-data.sql`
- SQL verification queries against `108-demo` with `SET app.tenant_id='101'`
- Browser smoke: `https://demo.platform.localhost/app/pages/business-tree`
- `PATH=/opt/homebrew/bin:$PATH scripts/preflight.sh`

## Data Results

Final local tenant row counts:

| table | count |
| --- | ---: |
| `companytype` | 10 |
| `company` | 50 |
| `users` | 152 |
| `projects` | 72 |
| `projectsaccess` | 218 |

Root Business Tree rows observed with backend-equivalent label/count query:

| root label | child companies | contacts | projects |
| --- | ---: | ---: | ---: |
| `Corporate @ Atlas Safety Holdings` | 5 | 5 | 2 |
| `Corporate @ Horizon Construction Group` | 4 | 3 | 2 |
| `Corporate @ Northstar Industrial Partners` | 4 | 3 | 2 |

Integrity checks:

| check | count |
| --- | ---: |
| orphan company parent | 0 |
| project missing company | 0 |
| access missing user | 0 |
| access missing project | 0 |

## Browser Smoke

Authenticated local tenant route loaded and rendered the seeded tree. Expanded
`Corporate @ Atlas Safety Holdings`, `Regional Division @ Central Safety Region`,
`Contacts (5)`, and `Projects (2)`.

Visible examples:

- `Contractor @ Texas Field Partner Network`
- `Project Office @ Chicago Operations Office`
- `Contacts (3)`
- `Projects (2)`
- `[BT-P-006] Site Orientation Launch - Dallas`
- `[BT-P-056] PPE Distribution Upgrade - Dallas`
- `Administrator @ Demo Admin`
- `Manager @ Aiden Adams`

Auth: local seeded dev login.

## Preflight

- Initial `scripts/preflight.sh` failed because `/usr/bin/python3` is Python
  3.9.6 and lacks `tomllib`.
- Re-run with Homebrew Python 3.11 first on `PATH` passed:
  `PATH=/opt/homebrew/bin:$PATH scripts/preflight.sh`.
