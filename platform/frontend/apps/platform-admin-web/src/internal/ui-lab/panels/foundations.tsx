import { Card, CardContent, CardDescription, CardHeader, CardTitle, Code, Kbd } from "@platform/ui-kit";

import {
  foundationMotion,
  foundationRadii,
  foundationSpacing,
  foundationSwatches,
  foundationTypeScale,
} from "../model/leaf-meta";
import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../components/docs-cards";

export function renderKbdDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Sizes and variants</CardTitle>
          <CardDescription>Kbd should stay small, stable, and quiet enough for inline shortcuts across docs and dense admin surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default">
            <Kbd size="xs">Esc</Kbd>
            <Kbd size="sm">Tab</Kbd>
            <Kbd size="md">Enter</Kbd>
            <Kbd>⌘K</Kbd>
          </ShowcaseRow>
          <ShowcaseRow label="Outline">
            <Kbd size="xs" variant="outline">
              F
            </Kbd>
            <Kbd size="sm" variant="outline">
              ⇧⌘P
            </Kbd>
            <Kbd size="md" variant="outline">
              Space
            </Kbd>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inline usage</CardTitle>
          <CardDescription>Kbd works best as supporting hint content near another primary control or documentation sentence.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Shortcuts" stacked>
            <div className="ui-lab-page__stack">
              <div className="ui-lab-page__kbd-copy">
                <span>Open command search with</span>
                <span className="ui-lab-page__kbd-sequence">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </div>
              <div className="ui-lab-page__kbd-copy">
                <span>Submit the current review with</span>
                <span className="ui-lab-page__kbd-sequence">
                  <Kbd variant="outline">⌘</Kbd>
                  <Kbd variant="outline">↵</Kbd>
                </span>
              </div>
              <div className="ui-lab-page__kbd-copy">
                <span>Dismiss temporary overlays with</span>
                <span className="ui-lab-page__kbd-sequence">
                  <Kbd>Esc</Kbd>
                </span>
              </div>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the lightweight keyboard-hint primitive used inside docs, toolbars, and dense action copy.", [
        { name: "variant", type: "\"default\" | \"outline\"", notes: "Controls whether the keycap reads as a filled muted surface or a calmer outlined hint." },
        { name: "size", type: "\"xs\" | \"sm\" | \"md\"", notes: "Adjusts density so the same primitive can fit tiny inline hints and slightly larger shortcut callouts." },
        { name: "children", type: "ReactNode", notes: "Visible key label content such as `Esc`, `⌘K`, or `Shift`." },
        { name: "native kbd props", type: "HTMLAttributes<HTMLElement>", notes: "Allows small semantic and layout adjustments without turning kbd into a larger pattern." },
      ])}

      {renderReferenceNotesCard(
        "Kbd should stay one of the smallest stable supporting primitives in the shared kit.",
        [
          "The stable anatomy is a compact keycap surface with mono text and minimal surrounding chrome.",
          "Kbd belongs inline with other content rather than acting as a badge, filter, or button substitute.",
          "Variant and size change density only; they do not change the semantic role of the key hint.",
        ],
        [
          "Use short key labels or compact key sequences that remain readable at small sizes.",
          "Compose multiple `Kbd` instances for sequences instead of inventing a bespoke shortcut container primitive.",
          "Keep the contract limited to keycap rendering and let surrounding copy explain the meaning of the shortcut.",
        ],
        [
          "Visible shortcut hints should still be understandable to users who do not rely on keyboard shortcuts.",
          "Do not depend on Kbd as the only accessible name for the control it describes.",
          "Keep inline reading order natural when multiple keycaps appear in one sentence.",
        ],
      )}

      {renderUsageReviewCard(
        "Kbd is appropriate for keyboard shortcut hints and compact key references that support another primary piece of UI or documentation.",
        [
          "A dense surface needs to show a keyboard shortcut next to a visible command or control.",
          "Documentation or help copy needs a small keycap hint without introducing a custom shortcut component.",
        ],
        [
          "Keep key labels short and familiar.",
          "Use multiple small keycaps for sequences instead of one large decorated token.",
          "Let surrounding text explain the action tied to the shortcut.",
        ],
        [
          "Do not use Kbd as a badge, filter chip, or status label.",
          "Do not put long instructional prose inside the primitive.",
          "Do not rely on shortcut hints alone to make a feature discoverable.",
        ],
      )}
    </div>
  );
}

export function renderCodeDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Variants and sizes</CardTitle>
          <CardDescription>Code should stay calm and compact enough for inline technical values, identifiers, and short snippets.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default">
            <Code size="sm">tenant_id</Code>
            <Code>workspace_slug</Code>
            <Code size="lg">demo.platform.local</Code>
          </ShowcaseRow>
          <ShowcaseRow label="Variants">
            <Code>GET /tenants</Code>
            <Code variant="outline">tenant.core.ready</Code>
            <Code variant="danger">DELETE /workspace</Code>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inline usage</CardTitle>
          <CardDescription>Code should support short technical references without turning into a documentation-only or syntax-highlighting system.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Examples" stacked>
            <div className="ui-lab-page__stack">
              <p className="ui-lab-page__code-copy">
                Use <Code>tenant_slug</Code> as the stable workspace identifier in shared admin routes.
              </p>
              <p className="ui-lab-page__code-copy">
                Webhook signatures are validated against <Code variant="outline">x-platform-signature</Code>.
              </p>
              <p className="ui-lab-page__code-copy">
                Reserve <Code variant="danger">DELETE</Code> tone for technical values that imply irreversible action or high-risk status.
              </p>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared inline-code primitive used by docs, endpoint hints, and short technical identifiers.", [
        { name: "variant", type: "\"default\" | \"outline\" | \"danger\"", notes: "Controls whether the code token reads as muted, framed, or cautionary while keeping the same calm footprint." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Adjusts density for tiny inline identifiers and larger highlighted values." },
        { name: "children", type: "ReactNode", notes: "Short code-like content such as endpoints, keys, headers, or internal identifiers." },
        { name: "native code props", type: "HTMLAttributes<HTMLElement>", notes: "Keeps the primitive semantic and layout-friendly without turning it into a copy or syntax API." },
      ])}

      {renderReferenceNotesCard(
        "Code should stay a lightweight mono-token primitive for short technical content, not a replacement for rich code blocks.",
        [
          "The stable anatomy is one compact mono surface carrying short technical content.",
          "Variant and size adjust emphasis and density without changing the primitive into a badge or alert.",
          "Code belongs inline with surrounding content rather than acting as a multi-line documentation panel.",
        ],
        [
          "Use `Code` for identifiers, endpoints, headers, environment values, and other short technical references.",
          "Keep the content short enough that it still scans as one inline token or short phrase.",
          "Leave copy actions, syntax highlighting, and large code blocks outside the primitive until a real gap is proven.",
        ],
        [
          "Code content should still make sense in surrounding sentence context when read by assistive technology.",
          "Do not rely only on color or tone to signal dangerous meaning; the text itself must remain explicit.",
          "Avoid long opaque abbreviations that lose meaning outside their immediate surrounding copy.",
        ],
      )}

      {renderUsageReviewCard(
        "Code works best for short technical identifiers and inline system values that need mono emphasis without becoming a larger documentation block.",
        [
          "A page or doc surface needs to show a short endpoint, header, variable, or internal identifier.",
          "Technical tokens need a calm mono treatment that remains distinct from badges and buttons.",
        ],
        [
          "Keep code values short and contextually explained nearby.",
          "Use the quiet default treatment for most technical labels.",
          "Reserve caution tone for rare destructive or high-risk technical markers.",
        ],
        [
          "Do not use Code as a badge, pill, or interactive button.",
          "Do not push large multi-line snippets into the primitive.",
          "Do not invent workflow-specific variants when inline mono emphasis already solves the need.",
        ],
      )}
    </div>
  );
}


export function renderFoundationsOverviewDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Foundation baseline</CardTitle>
          <CardDescription>Foundations should reflect the live token layer already consumed by stable primitives, not a parallel design wishlist.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__note-list">
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Canvas</span>
            <strong>#EFF4F7 light / #0B1220 dark</strong>
            <p className="ui-lab-page__muted">The app shell stays off pure white and pure black so dense enterprise surfaces read calmer.</p>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Typography</span>
            <strong>Inter, Helvetica, sans-serif</strong>
            <p className="ui-lab-page__muted">Compact admin-first text scale with calm weight and clear label hierarchy.</p>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Control form</span>
            <strong>12px control radius</strong>
            <p className="ui-lab-page__muted">Text entry should stay restrained and donor-aligned rather than overly rounded.</p>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Surface discipline</span>
            <strong>Border first, shadow second</strong>
            <p className="ui-lab-page__muted">Cards and panels should separate primarily through surface and border, with elevation used sparingly.</p>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Interaction</span>
            <strong>Neutral hover, focused ring</strong>
            <p className="ui-lab-page__muted">Focus remains explicit, but it should not jump too sharply from hover or dominate the surface.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved foundation rules</CardTitle>
          <CardDescription>These rules should stay visible while new donor components are evaluated in the lab.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ui-lab-page__review-grid">
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Token first</span>
              <ul className="ui-lab-page__review-list">
                <li>Promote semantic colors and sizing tokens before promoting higher-order patterns.</li>
                <li>Keep one canonical token vocabulary so future AI agents do not have to guess between duplicate naming systems.</li>
              </ul>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Component calm</span>
              <ul className="ui-lab-page__review-list">
                <li>Prefer stable, light primitives over decorative or highly opinionated surfaces.</li>
                <li>Use accent and heavy elevation sparingly so dense admin UI stays readable.</li>
              </ul>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Boundary discipline</span>
              <ul className="ui-lab-page__review-list">
                <li>Do not let product layout decisions leak into `ui-kit` under the banner of visual polish.</li>
                <li>Keep `UI Lab` as a review surface, not a second product shell.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function renderFoundationsTokensDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Color tokens</CardTitle>
          <CardDescription>Semantic surfaces, accents, borders, and text tokens that anchor the live shared visual layer.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__swatch-grid">
          {foundationSwatches.map((swatch) => (
            <div className="ui-lab-page__swatch" key={swatch.id}>
              <span className="ui-lab-page__swatch-preview" style={{ background: swatch.value }} />
              <span className="ui-lab-page__swatch-label">{swatch.label}</span>
              <code className="ui-lab-page__token-code">{swatch.value}</code>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography scale</CardTitle>
          <CardDescription>Type tokens should stay compact and operational rather than oversized or decorative, even before a fuller numeric type scale lands.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__foundations-stack">
          {foundationTypeScale.map((sample) => (
            <div className="ui-lab-page__type-row" key={sample.id}>
              <div className="ui-lab-page__type-meta">
                <span className="ui-lab-page__note-label">{sample.label}</span>
                <code className="ui-lab-page__token-code">{sample.size}</code>
              </div>
              <div className="ui-lab-page__type-sample">
                <p
                  className="ui-lab-page__type-sample-text"
                  style={{ fontSize: sample.size, fontWeight: sample.weight }}
                >
                  {sample.sample}
                </p>
                <span className="ui-lab-page__type-caption">{sample.meta}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function renderFoundationsSurfaceRulesDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Spacing and radius</CardTitle>
          <CardDescription>Spacing and radius tokens define the calm structural rhythm behind every approved primitive and should match the live token files exactly.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__foundations-grid">
          <div className="ui-lab-page__stack">
            {foundationSpacing.map((token) => (
              <div className="ui-lab-page__metric-row" key={token.id}>
                <div className="ui-lab-page__metric-meta">
                  <span className="ui-lab-page__note-label">{token.label}</span>
                  <code className="ui-lab-page__token-code">{token.value}</code>
                </div>
                <span className="ui-lab-page__metric-bar" style={{ width: `calc(${token.value} * 6)` }} />
              </div>
            ))}
          </div>
          <div className="ui-lab-page__stack">
            {foundationRadii.map((token) => (
              <div className="ui-lab-page__metric-row" key={token.id}>
                <div className="ui-lab-page__metric-meta">
                  <span className="ui-lab-page__note-label">{token.label}</span>
                  <code className="ui-lab-page__token-code">{token.value}</code>
                </div>
                <span className="ui-lab-page__radius-chip" style={{ borderRadius: token.value }}>
                  Surface
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motion and elevation</CardTitle>
          <CardDescription>Motion and elevation should support the interface quietly, with elevation used as a token scale rather than ad-hoc one-off shadows.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__foundations-stack">
          {foundationMotion.map((token) => (
            <div className="ui-lab-page__metric-row" key={token.id}>
              <div className="ui-lab-page__metric-meta">
                <span className="ui-lab-page__note-label">{token.label}</span>
                <code className="ui-lab-page__token-code">{token.value}</code>
              </div>
              <div className="ui-lab-page__metric-note">{token.meta}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function renderFoundationsLayoutGridDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Canonical layout roles</CardTitle>
          <CardDescription>Layout should stay explicit and bounded. The goal is not a framework-style 12-column system, but a small set of reusable roles that keep width stable.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ui-lab-page__review-grid">
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">App shell</span>
              <strong>Sidebar + content</strong>
              <p className="ui-lab-page__muted">Use an explicit sidebar width and a content column based on <Code>minmax(0, 1fr)</Code>.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Content container</span>
              <strong>One column by default</strong>
              <p className="ui-lab-page__muted">Route and docs content should start as a stable single-column stack before opting into comparison layouts.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Section grid</span>
              <strong>1 column mobile / 2 desktop</strong>
              <p className="ui-lab-page__muted">Use two columns only when the section genuinely benefits from side-by-side review or bounded comparison.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Form grid</span>
              <strong><Code>FormGrid</Code> is canonical</strong>
              <p className="ui-lab-page__muted">Forms should use the shared grid layer and keep label-control rows from sizing the whole surface by content width.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Inline rows</span>
              <strong>Wrap in height, not width</strong>
              <p className="ui-lab-page__muted">Chip rows, compact actions, and filter groups may wrap vertically, but they should not stretch their parent surface.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Rails and panels</span>
              <strong>Bounded local surfaces</strong>
              <p className="ui-lab-page__muted">Filter rails and detail panels fill their slot with <Code>width: 100%</Code> and keep internals shrinkable with <Code>min-width: 0</Code>.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Width stability rules</CardTitle>
          <CardDescription>These defaults prevent the common enterprise UI failure mode where layout reacts too much to content, expanded sections, or minor scrollbar changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ui-lab-page__review-grid">
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Shrinkable tracks</span>
              <strong><Code>minmax(0, 1fr)</Code></strong>
              <p className="ui-lab-page__muted">Use on content columns so long labels, chips, and helper text cannot force shell-width drift.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Shrinkable children</span>
              <strong><Code>min-width: 0</Code></strong>
              <p className="ui-lab-page__muted">Apply to flex and grid children that can contain long text, controls, or grouped toolbars.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Bounded surfaces</span>
              <strong><Code>width: 100%</Code></strong>
              <p className="ui-lab-page__muted">Page toolbars, side context surfaces, and local filter areas should fill the slot they are given rather than size from content.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Column count</span>
              <strong>1 first, 2 with reason</strong>
              <p className="ui-lab-page__muted">Default to one column and only promote to two columns when side-by-side comparison is clearly useful.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Avoid by default</span>
              <strong>No free-form auto-fit</strong>
              <p className="ui-lab-page__muted">Do not use content-reactive <Code>auto-fit</Code> or <Code>auto-fill</Code> grids as the default strategy for shared shells or summary rows.</p>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Summary rows</span>
              <strong>Bounded, not dashboard-fluid</strong>
              <p className="ui-lab-page__muted">Summary rows and <Code>view-preset-bar</Code> should behave like bounded content rows, not free-flow dashboard mosaics.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderReferenceNotesCard(
        "Layout Grid is a foundation rule set, not another reusable visual component. The point is to keep shells, sections, and rails predictable before module work starts.",
        [
          "The stable layout anatomy is app shell, content container, section grid, form grid, inline control row, and bounded rail or panel surfaces.",
          "One-column mobile is the baseline and two-column desktop is an explicit opt-in, not an automatic response to content width.",
          "Shared layout rules should stay small enough that AI agents can apply them consistently without inventing a second grid language.",
        ],
        [
          "Prefer existing layout surfaces such as `FormGrid` and bounded card stacks before introducing new wrappers.",
          "Use containment rules like `min-width: 0`, `width: 100%`, and `minmax(0, 1fr)` as defaults in shared shells.",
          "Treat summary rows, preset bars, and filter rails as bounded enterprise surfaces rather than fluid dashboard experiments.",
        ],
        [
          "Stable layout also supports accessibility by preserving reading order and keeping responsive changes predictable instead of dramatic.",
          "Avoid moving content into visually clever columns if that harms natural DOM order or makes focus travel feel erratic.",
          "Responsive changes should collapse or stack content cleanly, not hide meaning behind horizontal overflow.",
        ],
      )}

      {renderUsageReviewCard(
        "Use the layout baseline when building route shells, docs surfaces, toolbars, and shared review patterns that must stay calm across breakpoints and content lengths.",
        [
          "A new surface needs a predictable content container or bounded comparison layout.",
          "A toolbar, rail, or detail panel needs to fill its slot without content-driven width jumps.",
          "A module team or AI agent needs a default rule for when layout may become two columns.",
        ],
        [
          "Start from one column and add a second only when there is a clear comparison benefit.",
          "Use `FormGrid` for forms and apply containment rules to rails, toolbars, and grouped control rows.",
          "Keep layout decisions visible in Foundations so future component work inherits the same contract.",
        ],
        [
          "Do not recreate a Bootstrap-like universal grid utility layer.",
          "Do not default to `auto-fit` or `auto-fill` in shared layout surfaces.",
          "Do not let child content decide the width of page-level or panel-level shells.",
        ],
      )}
    </div>
  );
}
