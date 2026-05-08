# UI Critique Prompt Template

Use for review of an existing route, component, or UI diff.

```text
Use UI Quality Pack to review:
<route/component/files>

Read only the relevant implementation files and rendered evidence available.

Review with the five-axis rubric:
1. Philosophy Consistency
2. Visual Hierarchy
3. Detail Execution
4. Functionality
5. Innovation

For each score, cite evidence from actual files, components, classes, rendered
states, screenshots, or browser checks.

Return:
- scores with evidence;
- P0 fixes;
- P1 fixes;
- deferred polish;
- whether owner product/taste decision is needed.

Do not apply fixes until asked unless this review is part of an approved
implementation workflow.
```
