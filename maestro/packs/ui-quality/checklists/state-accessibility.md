# State And Accessibility Checklist

Use before finalizing substantial UI implementation or review.

## Page States

| State | Required | Notes |
| --- | --- | --- |
| Loading | yes | Skeleton, spinner, or progressive loading appropriate to the surface. |
| Empty | yes | Helpful next step, not a blank page. |
| Success/default | yes | Normal populated state. |
| Error/retry | yes | Clear message and recovery path. |
| Permission denied | if relevant | Explain unavailable access calmly. |
| Disabled/readonly | if relevant | Explain why action is unavailable when not obvious. |
| Stale/offline | if relevant | Especially for live dashboards, synced state, or cached views. |
| Long/overflow data | if relevant | Long names, IDs, dates, and table content must not break layout. |
| Large data set | if relevant | Filtering, pagination, virtualization, or clear limits. |
| Mobile/narrow | yes for visible UI | Primary job remains usable. |

## Component States

- Button: default, hover, active, focus-visible, disabled, loading.
- Input: empty, filled, focus, error, disabled, readonly.
- Select/combobox: closed, open, focused, selected, empty, no results, error.
- Table/list: loading, empty, sorted, filtered, selected, row error, no results.
- Card/panel: default, highlighted, disabled/locked, overflow.
- Modal/drawer: opening, open, submitting, error, success, close/escape.
- Chart: loading, no data, normal, partial data, stale.
- Nav/sidebar: active, collapsed, hover, focus, overflow.

## Accessibility Pass

Check:

- semantic headings and landmarks where useful;
- labelled form controls;
- icon-only buttons have accessible names;
- focus-visible states are not removed;
- keyboard path for core interactions;
- form errors are associated with controls;
- required and disabled states are communicated;
- color contrast is sufficient for body text and controls;
- touch targets are large enough on mobile;
- destructive actions have clear affordance and confirmation when needed.

## Required Output

For evidence or final response:

```text
State/accessibility:
- Covered:
- Not applicable:
- Missing or deferred:
- Remaining risk:
```
