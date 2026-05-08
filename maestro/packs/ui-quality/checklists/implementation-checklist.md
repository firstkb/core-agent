# UI Implementation Checklist

Use before final response for visible frontend implementation.

## Project Fit

- Existing framework and route/component conventions used.
- Existing UI Kit, tokens, theme, and CSS conventions preferred.
- No isolated demo app unless requested.
- No unnecessary dependency introduced.
- Naming conventions and file organization preserved.
- App/package boundaries respected.

## Design

- Clear visual hierarchy.
- Accent used sparingly and consistently.
- Typography follows project rules.
- Component styles are consistent.
- No generic AI gradients, emoji icon rows, placeholder copy, or invented
  metrics.
- The screen has one dominant archetype.

## UX States

- Loading state.
- Empty state.
- Error/retry state.
- Disabled, readonly, or permission state where applicable.
- Long text/overflow behavior.
- Responsive behavior checked with relevant viewport evidence or a stated
  limitation.

## Accessibility

- Semantic HTML or accessible components.
- Keyboard/focus-visible states.
- Labels for inputs and icon buttons.
- Contrast considered.
- Touch targets on mobile are reasonable.
- Destructive actions are clear.

## Engineering

- Typecheck/lint/test/build commands discovered and run as needed.
- Tests updated or added when risk justifies them.
- No dead code or duplicate component system.
- No hardcoded fake data where a real product data contract exists.
- Final response lists changed files, checks, skipped checks, and residual risk.
