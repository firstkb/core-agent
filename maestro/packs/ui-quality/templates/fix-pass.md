# UI Fix Pass Prompt Template

Use after a critique when the owner or active workflow asks for targeted fixes.

```text
Use UI Quality Pack targeted fix pass.

Inputs:
- Critique findings:
- Changed files:
- Owner intent:
- Existing design/product contract:

Apply:
- P0 fixes always when in scope.
- P1 fixes when they are focused and low-risk.
- P2 polish only if owner explicitly asked.

Rules:
- Keep diffs small.
- Do not change product intent.
- Do not replace existing components unnecessarily.
- Do not introduce a new design system.
- Re-run relevant checks.
- Re-run a short critique summary.

Return:
- fixes applied;
- files changed;
- checks run;
- deferred issues;
- remaining risks.
```
