# Anti-AI-Slop Checklist

Use this as a quality gate, not as a taste manifesto. Repository UI Kit and
product contracts still win.

## P0 Must Fix

- No generic purple, pink, or blue gradient hero unless explicitly requested.
- No default Tailwind indigo/purple hardcoded as the main accent.
- No emoji as generic feature icons.
- No lorem ipsum, `Feature One`, `Metric A`, or placeholder copy in production
  UI.
- No invented metrics such as `10x faster`, `99.9% uptime`, or `3x
  productivity` unless provided by the owner or real data.
- No colored-left-border dashboard card as the default pattern.
- No happy-path-only UI for substantial work. Include loading, empty, error,
  disabled, permission, and responsive states when applicable.
- No new visual token system when project tokens exist.
- No isolated demo app unless the owner asked for one.

## P1 Should Fix

- Accent appears too many times. Aim for one or two clear accent moments per
  screen unless the design system says otherwise.
- All panels/cards have equal visual weight.
- Too many font sizes or weights inside one panel/card.
- Generic hero/features/pricing/FAQ structure where a product-specific workflow
  is needed.
- External placeholder image CDNs.
- Stock-feeling copy that could apply to any SaaS product.
- Tables without useful columns, status semantics, or row hierarchy.
- Empty states that explain nothing or give no next step.
- Focus states missing where the project expects visible keyboard support.

## P2 Polish

- Weak microcopy.
- Minor spacing rhythm issues.
- Overly symmetrical layout with no focal point.
- Missing stable selectors where the project convention uses them.
- Small icon-size inconsistencies.

## Add Product Specificity

Add one or two details that prove the UI belongs to this product:

- real product vocabulary;
- real workflow states;
- meaningful status labels;
- useful keyboard hints;
- realistic data labels;
- one restrained memorable interaction or layout move.
