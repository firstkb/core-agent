# Visual Review Rubric

Use after implementing or modifying a visible UI. Score from 0 to 10 and cite
evidence from actual files, rendered states, screenshots, or browser checks.
Do not inflate scores. A 7 is strong, not merely acceptable.

## 1. Philosophy Consistency

Question: Does the screen choose one clear design direction and follow it?

Look for:

- consistent visual vocabulary;
- product-specific identity;
- no mixed dashboard, landing, glassmorphism, and playful styles;
- alignment with UI Kit and product context.

Low score: three styles fight each other.
High score: every major visual decision supports the same product thesis.

## 2. Visual Hierarchy

Question: Can a user tell what to read and do first, second, third?

Look for:

- primary action prominence;
- title and section hierarchy;
- spacing rhythm;
- table/list scanability;
- clear panel importance.

Low score: everything has equal weight.
High score: the eye moves naturally through the workflow.

## 3. Detail Execution

Question: Does it feel finished?

Look for:

- alignment;
- spacing consistency;
- typography discipline;
- icon sizing;
- row density;
- overflow handling;
- focus states;
- responsive edge cases.

Low score: visible rough edges.
High score: small details feel deliberate.

## 4. Functionality

Question: Does the interface work for real product usage?

Look for:

- loading, empty, error, disabled, permission, and responsive states;
- accessible labels;
- keyboard/focus behavior;
- realistic data and actions;
- clear recovery paths.

Low score: looks fine but only supports the happy path.
High score: defensively designed for normal and edge states.

## 5. Innovation

Question: Is there one useful, memorable design move?

Look for:

- distinctive but relevant layout;
- product-specific interaction;
- helpful microcopy;
- clever data presentation;
- restrained visual detail that improves comprehension.

Low score: could be any generated SaaS template.
High score: one or two details are worth reusing.

## Output Shape

```text
UI critique:
- Philosophy Consistency: X/10
  Evidence:
  Keep:
  Fix:
  Quick win:

- Visual Hierarchy: X/10
  Evidence:
  Keep:
  Fix:
  Quick win:

- Detail Execution: X/10
  Evidence:
  Keep:
  Fix:
  Quick win:

- Functionality: X/10
  Evidence:
  Keep:
  Fix:
  Quick win:

- Innovation: X/10
  Evidence:
  Keep:
  Fix:
  Quick win:

P0/P1 fixes to apply now:
1.
2.

Deferred:
1.
```
