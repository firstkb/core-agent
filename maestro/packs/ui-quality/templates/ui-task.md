# UI Task Prompt Template

Use this when the owner asks for a visible UI implementation and wants the UI
Quality Pack applied.

```text
Use UI Quality Pack for this UI task.

Task:
<screen or flow>

Before coding:
1. Inspect existing route, components, tokens, UI Kit, styling, and docs.
2. Identify the dominant archetype.
3. State the state coverage: loading, empty, success, error, disabled/permission, responsive.
4. Identify existing components to reuse.
5. Name any product/UX decision that needs owner input.

Implementation:
- Use existing stack and UI Kit.
- Do not create a separate demo app.
- Do not invent colors, type styles, or component systems.
- Do not use generic AI-looking UI patterns.
- Use product-specific copy and realistic domain labels.
- Keep diffs focused.

After coding:
1. Run relevant checks.
2. Run state/accessibility checklist.
3. Run five-axis visual critique.
4. Apply P0/P1 fixes only.
5. Report changed files, checks, evidence, and remaining risks.
```
