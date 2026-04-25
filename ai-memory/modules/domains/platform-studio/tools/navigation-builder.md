# Navigation Builder

Status: planned tool
Last compacted: 2026-04-25

## Expected Ownership

- Sidebar and navigation structure.
- Module assembly from authored Form Builder views.
- Runtime exposure of configured application entries.
- Access-facing navigation composition.
- Permission/grant assignment unless a later accepted decision creates a separate Access Builder.

## Current Integration Point

- Form Builder runtime target type is expected to be `{ targetType: form_builder_view, modelId, viewId }`.
- Real runtime list route direction is `/app/forms/:modelId/views/:viewId`.
- Navigation Builder should resolve configured entries to runtime routes, not to Platform Studio preview routes.

## Guardrails

- Do not invent temporary runtime grants before the real Navigation Builder ACL model exists.
- Do not expose non-root runtime entries from frontend-only fabrication.
- Keep `/app/platform-studio/forms/...` as preview/authoring context, not a navigation target.
