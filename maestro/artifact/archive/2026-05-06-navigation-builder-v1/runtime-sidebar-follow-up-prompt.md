# Runtime Sidebar Follow-Up Prompt

Status: superseded by Navigation Builder V1 closeout.

Runtime sidebar projection, active filtering, configured Form View/App Page
routes, title/breadcrumb metadata, and direct target guards landed during V1.
Retain this file only as historical context.

We have a UI-first Navigation Builder V1 in tenant-web. The next slice should
connect Navigation Builder persistence/publication to real tenant sidebar
output.

Scope:

- Backend persistence for Navigation Builder draft/saved configuration.
- Publication/runtime read model for app menu entries.
- Runtime sidebar rendering from the saved/published Navigation Builder model.
- Target resolution for Form View, App Page, External Link, and future App
  Module containers.
- Active/inactive filtering for runtime app menu output.
- Per-parent ordering preservation.
- Duplicate target prevention at persistence/API boundaries, matching the V1 UI.
- Utility rail visibility/access remains planned unless explicitly included.
- Access controls remain preview/mock unless backend ACL enforcement is approved
  for the slice.

Important shell rule:

- When a user opens a configured App Page or Form View from the real sidebar,
  the tenant top bar title and breadcrumb must resolve from the Navigation
  Builder path and target metadata. Example: `Safety > Inspections` should show
  a title/breadcrumb that matches the configured navigation path, not a raw route
  id, `view-default`, or a generic technical fallback.

Suggested acceptance:

- Saved Navigation Builder entries can be loaded by tenant runtime.
- Sidebar displays configured items below Dashboard.
- Clicking a Form View target opens `/app/forms/:modelId/views/:viewId`.
- Clicking an App Page target opens its configured app page route.
- Hidden/inactive entries are absent from runtime sidebar.
- Runtime top bar title and breadcrumb match the configured Navigation Builder
  entry/path for Form View and App Page targets.
