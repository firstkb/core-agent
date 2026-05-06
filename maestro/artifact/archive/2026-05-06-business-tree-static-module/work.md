# Business Tree Static Module

## Current State

The owner wants the first static module in the tenant app: Business Tree.
Implementation is now approved for the first slice described below.

The module should be compatible with the future Navigation Builder. A static
module may expose one canonical route or multiple routes. Navigation Builder
must eventually be able to add the module as either a single sidebar item or a
group with child entries, using module-provided metadata instead of hard-coded
sidebar wiring.

## Relevant Existing Surfaces

- Tenant app owns tenant-scoped routes and shell:
  `platform/frontend/apps/tenant-web`.
- Published runtime currently owns `/app/:routeKey/*` catch-all behavior.
- UI Lab already has `Navigation Primitives / Tree View / Read-only snapshot`.
  Read-only tree behavior should still allow branch expansion, but should not
  apply active selection styling or item activation effects.
- Legacy reference code is under `reference-code/business_tree/` and is a
  behavior reference only, not source code to copy.

## URL Direction

Recommended canonical namespace for app-local static modules:

```text
/app/modules/:moduleKey
/app/modules/:moduleKey/:routeKey
/app/modules/:moduleKey/*
```

For the first Business Tree slice:

```text
/app/modules/business-tree
```

Owner decision: use `/app/modules/business-tree` for the first implementation.

If the old Reference Manager grouping becomes a first-class static module later:

```text
/app/modules/reference-manager/business-tree
/app/modules/reference-manager/contacts
/app/modules/reference-manager/business-units
```

Rationale: keep `/app/:routeKey/*` as the published Navigation Builder/runtime
route-key namespace. Static modules can still be connected by Navigation
Builder through target metadata, but their direct canonical routes should not
compete with authored/published route keys.

## Static Module Registry Direction

Use an app-local static module registry first, then promote or share the
contract only when Navigation Builder needs it.

Draft shape:

```ts
type StaticModuleDefinition = {
  moduleKey: string;
  label: string;
  defaultRouteId: string;
  routes: StaticModuleRoute[];
  navigation:
    | { kind: "single"; routeId: string }
    | { kind: "group"; label: string; children: string[]; defaultOpen?: boolean };
};
```

Navigation Builder should eventually be able to add a whole module and derive
default sidebar nodes from `navigation`, rather than requiring the owner to
manually recreate module internals.

## Business Tree Legacy Behavior

The old ASP endpoint returns an XML tree and lazy-loads children:

- no request id: returns the configured root company;
- numeric id: returns active child companies;
- `c@companyId`: returns active contacts/users for that company;
- `p@companyId`: returns active projects for that company;
- each company node may expose special child branches for contacts and projects
  with counts.

Important finding: `CONFIG_COMPANYID` is used by the legacy tree endpoint as a
foreign key to the root `company` row. It is not just the tenant display name.
The old root query is equivalent to "start the business tree at this company
id", then render the company label from the company table.

Additional reference-code search found other legacy usage passing
`CONFIG_COMPANYID` as a `company_id` into OSHA/report add-ons. That supports the
same interpretation: the value is an operational company/business-unit pointer,
not merely a display name. Legacy session values such as `CONFIG_COMPANYNAME`,
`CONFIG_COMPANYCITY`, and `CONFIG_COMPANYSTATE` appear to be denormalized
company metadata derived from that configured company.

## CONFIG_COMPANYID Decision

The current master database has `tenant.name`, which is the tenant display name.
The current tenant database has a `company` table with `main_company_id`, which
models a business-unit hierarchy inside the tenant.
The current backend request context and tenant profile already expose
`tenant.name` from master data, so displaying tenant identity does not require
recreating the legacy `config` table.

These are related product concepts but not identical:

- `tenant.name`: workspace/customer/tenant identity in master data;
- root `company`: first business unit node for Business Tree;
- `CONFIG_COMPANYID`: legacy pointer to that root company node.

Owner decision: do not replace legacy `CONFIG_COMPANYID` with a new explicit
root-company setting for the first implementation. Treat the configured root as
absent (`NULL` / `0`) and build the tree directly from tenant company hierarchy.
Do not render a synthetic visual `Root` node.

Resolved direction:

- `tenant.name` remains tenant/workspace identity from master data.
- Business Tree starts from tenant-local active companies with
  `main_company_id IS NULL`.
- If there is one top-level company, it is the first visible node.
- If there are multiple top-level companies, render them as sibling first-level
  nodes.
- If there are no top-level companies, show an empty state.
- The first implementation should not introduce a replacement
  `CONFIG_COMPANYID` setting.

Current recommendation before implementation:

1. Do not use `tenant.name` as a replacement for `CONFIG_COMPANYID`.
2. Derive top-level nodes from tenant `company` data where
   `main_company_id IS NULL`.
3. Add an explicit setting only later if legacy imports or product behavior
   require a chosen root company that cannot be inferred from top-level company
   records.

Potential future setting, if needed:

```text
tenant_business_tree.root_company_id
```

or a broader tenant settings table entry, scoped inside the tenant database and
validated against the tenant's own `company` rows.

## Backend Direction

Prefer JSON over legacy XML:

```ts
type BusinessTreeNode = {
  id: string;
  kind: "root" | "company" | "contactsGroup" | "projectsGroup" | "contact" | "project";
  label: string;
  expandable: boolean;
  childCount?: number;
  children?: BusinessTreeNode[];
};
```

Possible secure tenant endpoints:

```text
GET /app/modules/business-tree/tree
GET /app/modules/business-tree/nodes?parent=root|company:2|contacts:2|projects:2
```

Tenant scope must come from trusted tenant runtime context/RLS, not from request
parameters.

Access control decision for the first development slice:

- allow authenticated tenant users;
- add a clear `TODO` at the module route/service boundary for Navigation
  Builder/module permission integration;
- do not invent a module-specific permission system in this slice.

## UI Direction

Render the module with the UI Kit TreeView read-only mode. Branches must remain
expandable. Item activation, active selection, and pressed/selected styling
should be disabled for the Business Tree snapshot.

Use lazy loading for the first implementation. Extend TreeView with an explicit
lazy expansion contract instead of relying on placeholder children. The exact
prop names can follow existing UI Kit style, but the behavior must support:

- expandable nodes without preloaded children;
- async child loading when a branch is expanded;
- loading and error state at branch level;
- read-only mode that still permits expansion.

Group labels should use modern product labels:

```text
Contacts (n)
Projects (n)
```

Contact labels should use only:

```text
jobtype.name @ First Last
```

If `jobtype.name` is missing, show only:

```text
First Last
```

Do not restore legacy `users_title` and do not invent `Contact @ ...`.

Lazy API decision:

- return children only for the requested parent;
- include lightweight metadata on each returned child, especially `childCount`
  and `expandable`, so TreeView can show expandable branches before loading
  their children.

## Decisions Needed Before Product-Code Work

All product decisions needed for the first implementation slice are resolved.

## Next Allowed Action

Implement the first slice:

- backend tenant Business Tree service, repository, handler, and secure route;
- frontend direct route `/app/modules/business-tree`;
- UI Kit TreeView lazy expansion support;
- focused FE/BE checks and repository preflight.
