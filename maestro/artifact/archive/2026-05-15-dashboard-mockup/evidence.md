# Evidence

## Checks

- `pnpm --filter @platform/tenant-web typecheck` passed.
- `pnpm --filter @platform/tenant-web lint` passed.
- `pnpm --filter @platform/tenant-web build:dev` passed.
  - Local warning: Node is `18.17.0`; Vite requests `20.19+` or `22.12+`.
  - Existing build warning: generated app chunk is larger than 500 kB.
  - ECharts is dynamically imported into async chunks instead of being bundled
    fully into the main app chunk.
- `scripts/preflight.sh` initially failed because system `python3` is `3.9.6`
  and lacks `tomllib`.
- `PATH="/opt/homebrew/bin:$PATH" scripts/preflight.sh` passed with Python 3.11.

## Browser Smoke

- Browser Use target: `https://demo.platform.localhost/dashboard`.
- Auth: local seeded dev login.
- Desktop viewport `1440x900`:
  - heading rendered: `Safety Intelligence`;
  - 4 KPI cards rendered;
  - ECharts trend chart canvas rendered;
  - ECharts activity heatmap canvas rendered;
  - KPI matrix rendered;
  - page-level horizontal overflow: false.
- Mobile viewport `390x844`:
  - heading rendered: `Safety Intelligence`;
  - ECharts trend chart canvas rendered;
  - ECharts activity heatmap canvas rendered;
  - page-level horizontal overflow: false;
  - heatmap uses internal horizontal scroll.
- Interaction smoke:
  - selecting `Negative Hazards` changed the active card and chart title to
    `Negative Hazards trend`.

## Limitation

- In-app browser screenshot capture timed out during `Page.captureScreenshot`.
  DOM/layout and interaction smoke completed, but screenshot-based visual
  signoff was not collected in this slice.
