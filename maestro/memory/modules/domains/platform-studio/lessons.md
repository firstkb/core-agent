# Platform Studio Lessons

Status: active lessons

## Lessons

- Never infer view identity from mutable keys, titles, or database GUIDs. Use stable `viewId`.
- Do not treat `Save` as publication. Site exposure belongs to Navigation Builder and privileges.
- Do not treat Form Builder as the owner of every Platform Studio feature. Sidebar/access, actions/events, PDF, and reports need separate tool boundaries.
- Do not let non-default views mutate model-owned `dataSchema` or `layoutBlueprint`.
- Do not auto-author layout nodes for a brand-new empty model's first view.
- Do not advance `modelStructureVersion` for administrative lock toggles.
- Do not silently place unresolved fields at root; surface `Unplaced fields`.
- Do not preserve old runtime naming as supported compatibility after v1.1 metadata exists.
- Do not invent runtime grants before Navigation Builder ACL exists.
- Do not hide post-save runtime apply failures; preserve authoring success and surface execution context.
- Do not seed static Form Builder container UI nodes without explicit `containerKey` values matching the model-owned `layoutBlueprint`; otherwise reconciliation can create duplicate empty containers.
- Do not replace Form Builder generated data-view drop/recreate with a `CREATE OR REPLACE VIEW`-only refresh for shape changes; PostgreSQL accepts only compatible append-style changes and rejects inserted/reordered columns.
- Do not replay old local temp authoring-save scripts against a live tenant model/view. Always fetch current `/authoring`, write a rollback backup, verify the target view, and use current expected versions before saving. If metadata was overwritten while generated runtime relations remain, the runtime-name conflict guard may block reusing orphaned relation names; restore through `/authoring` with fresh generated relation names and migrate data, or do an explicit approved metadata repair.
