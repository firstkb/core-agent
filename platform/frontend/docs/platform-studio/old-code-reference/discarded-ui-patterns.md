# Discarded UI Patterns

These patterns from the retired Platform Studio should not be used as the V2 baseline.
They are documented here so the archive does not need to keep the full raw UI source tree around.

## Do Not Reuse

### Builder as a tenant sidebar module

Discard:

- `Platform Studio` as a permanent sidebar section with peer pages like `Models`, `View Builder`, `Navigation`, `Access`, `Workflows`, and `Publish`

Reason:

- V2 docs say Platform Studio is a builder workspace, not normal tenant runtime navigation
- entry should move to trail bar or workspace header later, not remain in the main tenant sidebar

### Cockpit-style control surface

Discard:

- builder hero + diagnostics cards + action/state rail as the dominant composition pattern

Reason:

- V2 explicitly rejects cockpit-style control panels
- the old UI made inspection and source-state reporting more prominent than authoring

### Diagnostics-first top-level pages

Discard:

- `Access`
- `Publish`
- `Workflows`
- metadata-heavy summary dashboards

Reason:

- V2 says these should be contextual, secondary, or deferred until product behavior proves the need
- making them first-class tabs pushed the product away from Forms and Navigation authoring

### Metadata-over-canvas editing

Discard:

- list/detail surfaces dominated by ids, summaries, policy copy, validation copy, and registry cards

Reason:

- V2 requires real builder workspaces centered on composed UI, not metadata card inspection

### Preview and publish as the organizing center

Discard:

- preview paths and publish controls as central navigation anchors for the builder

Reason:

- V2 should begin with authoring flow, not publish-center-first UX

### Local capability allowlist as product framing

Discard:

- protected builder-route experience driven by demo allowlists and local overrides

Reason:

- that pattern belonged to the retired feature rollout, not the long-term product model
- V2 permissions should be built around schema locks, field locks, UI-author roles, and publishing roles instead

## Useful Only As Technical Reference

The archived snapshot still has value for:

- mutation patterns in draft state
- typed manifest flow
- route resolution examples
- policy evaluation examples

It does not have value as a UI baseline.
