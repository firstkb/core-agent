# Compact Communication Pack

Status: active optional Maestro pack
Scope: terse engineering communication without losing precision

This pack distills useful ideas from `juliusbrussee/caveman` into Maestro's
professional communication style. It is not a persona change. It does not make
Maestro talk like caveman. It only removes filler and tightens low-risk output.

## Use When

- owner asks for shorter, terse, compact, low-token, or no-fluff answers;
- status update needs high signal;
- review findings should be easy to scan;
- commit message or PR summary should be concise;
- technical explanation is low-risk and already clear.

## Do Not Use When

- approval, destructive action, release, security warning, migration, auth,
  tenant isolation, or production risk needs full clarity;
- UX/product decision is disputed or nuance matters;
- multi-step instruction could become ambiguous if compressed;
- owner asks for explanation, teaching, or rationale;
- compression hides assumptions, evidence, or residual risk.

## Output Rules

- Drop pleasantries, filler, and hedging.
- Keep exact technical terms, file paths, commands, code symbols, dates, and
  error text.
- Prefer: `Problem. Cause. Fix. Next step.`
- For status: `Done. Evidence. Risk. Next.`
- For review: `file:line: severity: problem. fix.`
- For commit messages: Conventional Commit, imperative mood, short subject;
  body only for why, migration, security, breaking change, or revert context.
- Keep code blocks and quoted errors unchanged.

## Maestro Guardrail

Compact communication is subordinate to Maestro's owner-facing duty. If a terse
answer would reduce safety, product clarity, or trust, switch back to normal
professional prose for that section, then resume compact style after the risk
is handled.

## Example

Verbose:

```text
The most likely issue is that the token expiry comparison is using the wrong
operator. I would recommend changing it and then adding a regression test.
```

Compact:

```text
Bug in token expiry check. Uses wrong comparison. Fix operator, add regression
test.
```
