import {
  AspectRatio,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  TableMetaCell,
} from "@platform/ui-kit";

import {
  demoRows,
  getStatusTone,
} from "../../model/leaf-meta";
import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../../components/docs-cards";

export function renderScrollAreaDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Vertical viewport</CardTitle>
          <CardDescription>Scroll area should support bounded overflow without forcing the page itself to become the scrolling contract.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Vertical" stacked>
            <ScrollArea className="ui-lab-page__scroll-demo">
              <div className="ui-lab-page__scroll-list">
                {demoRows.map((row) => (
                  <div className="ui-lab-page__scroll-item" key={`scroll-${row.id}`}>
                    <TableMetaCell
                      description={row.note}
                      title={row.id.replace("tenant-", "")}
                    />
                    <Badge appearance="soft" variant={getStatusTone(row.status)}>
                      {row.status}
                    </Badge>
                  </div>
                ))}
                <div className="ui-lab-page__scroll-item">
                  <TableMetaCell
                    description="4 regions · synced 6m ago"
                    title="solstice"
                  />
                  <Badge appearance="soft" variant="success">
                    Healthy
                  </Badge>
                </div>
                <div className="ui-lab-page__scroll-item">
                  <TableMetaCell
                    description="2 regions · synced 1h ago"
                    title="meridian"
                  />
                  <Badge appearance="soft" variant="warning">
                    Review
                  </Badge>
                </div>
              </div>
            </ScrollArea>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horizontal viewport</CardTitle>
          <CardDescription>Horizontal overflow should stay useful for dense chip rows and compact preview rails.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Horizontal" stacked>
            <ScrollArea className="ui-lab-page__scroll-demo ui-lab-page__scroll-demo--horizontal" orientation="horizontal">
              <div className="ui-lab-page__scroll-chip-row">
                <Badge appearance="soft" variant="brand">Workspace scope</Badge>
                <Badge appearance="soft" variant="success">Healthy tenants</Badge>
                <Badge appearance="soft" variant="warning">2 active filters</Badge>
                <Badge appearance="soft" variant="info">Signal review</Badge>
                <Badge appearance="soft" variant="neutral">Compact mode</Badge>
                <Badge appearance="soft" variant="brand">Shared primitive</Badge>
                <Badge appearance="soft" variant="warning">Range override</Badge>
                <Badge appearance="soft" variant="danger">Escalation required</Badge>
                <Badge appearance="soft" variant="neutral">Regional rollout</Badge>
                <Badge appearance="soft" variant="brand">Enterprise only</Badge>
                <Badge appearance="soft" variant="info">Muted overflow rail</Badge>
              </div>
            </ScrollArea>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the bounded-overflow wrapper used by dense lists, chip rows, and preview rails.", [
        { name: "orientation", type: "\"vertical\" | \"horizontal\" | \"both\"", notes: "Controls which axis may overflow while keeping the wrapper and viewport contract stable." },
        { name: "viewportClassName", type: "string", notes: "Allows local viewport-level padding or layout tuning without replacing the shared wrapper." },
        { name: "children", type: "ReactNode", notes: "Scroll area stays composition-first so list stacks, rows, and chip rails remain product-owned content." },
        { name: "native div props", type: "HTMLAttributes<HTMLDivElement>", notes: "Use standard attributes for sizing and labeling rather than creating a large scroll API." },
      ])}

      {renderReferenceNotesCard(
        "Scroll area should document a calm bounded-overflow contract, not a second layout system.",
        [
          "The stable anatomy is root wrapper plus viewport that owns the actual overflow behavior.",
          "Orientation belongs to the primitive because overflow direction is part of the shared behavior contract.",
          "Content inside the viewport should remain normal composition rather than a bespoke scroll-item API.",
        ],
        [
          "Use scroll area when the surface itself needs bounded overflow inside a card, panel, or preview slot.",
          "Keep content ownership outside the primitive so lists, chip rows, and dense rails stay compositional.",
          "Use `viewportClassName` for small spacing adjustments instead of introducing product-specific variants.",
        ],
        [
          "Do not rely on hidden overflow regions for critical content without clear sizing and discoverable scrolling.",
          "Preserve normal reading order and semantic structure inside the viewport.",
          "Keep scrollable regions predictable so keyboard and assistive users can understand what scrolls.",
        ],
      )}

      {renderUsageReviewCard(
        "Scroll area works best when a bounded surface needs overflow management without changing the outer page layout.",
        [
          "A card, panel, or preview slot needs its own scrolling region.",
          "Dense inline metadata or chip clusters need horizontal overflow instead of wrapping into unreadable rows.",
        ],
        [
          "Use scroll area for local overflow and keep the boundary visually obvious.",
          "Size the region deliberately so the user can understand why scrolling exists.",
          "Keep the content semantic and compositional inside the viewport.",
        ],
        [
          "Do not replace normal page scrolling with nested scroll areas without a strong reason.",
          "Do not hide essential actions or validation in tiny overflow regions.",
          "Do not turn scroll area into a product-specific data-list primitive.",
        ],
      )}
    </div>
  );
}

export function renderAspectRatioDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Media framing</CardTitle>
          <CardDescription>Aspect ratio should keep previews and media shells stable without introducing donor page cards.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="16:9" stacked>
            <AspectRatio className="ui-lab-page__aspect-demo" ratio={16 / 9}>
              <div className="ui-lab-page__aspect-fill ui-lab-page__aspect-fill--wide">
                <strong>16:9 media shell</strong>
                <span className="ui-lab-page__muted">Useful for dashboard previews, embeds, and feature hero surfaces.</span>
              </div>
            </AspectRatio>
          </ShowcaseRow>
          <ShowcaseRow label="1:1" stacked>
            <AspectRatio className="ui-lab-page__aspect-demo" ratio={1}>
              <div className="ui-lab-page__aspect-fill ui-lab-page__aspect-fill--square">
                <strong>1:1 identity tile</strong>
                <span className="ui-lab-page__muted">Square framing keeps avatars, media thumbs, and preview tiles aligned.</span>
              </div>
            </AspectRatio>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card composition</CardTitle>
          <CardDescription>Aspect ratio should compose inside other surfaces instead of becoming a content card by itself.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Inside card" stacked>
            <Card>
              <CardHeader>
                <CardTitle>Embedded preview</CardTitle>
                <CardDescription>Media framing stays stable even when the surrounding card content changes.</CardDescription>
              </CardHeader>
              <CardContent>
                <AspectRatio className="ui-lab-page__aspect-demo ui-lab-page__aspect-demo--inline" ratio={4 / 3}>
                  <div className="ui-lab-page__aspect-fill ui-lab-page__aspect-fill--inline">
                    <strong>4:3 evidence snapshot</strong>
                  </div>
                </AspectRatio>
              </CardContent>
            </Card>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the layout utility that keeps media and preview surfaces framed predictably.", [
        { name: "ratio", type: "number", notes: "Defines the width-to-height relationship for the framed content area." },
        { name: "children", type: "ReactNode", notes: "Rendered inside the positioned inner wrapper that fills the ratio box." },
        { name: "className / native div props", type: "HTMLAttributes<HTMLDivElement>", notes: "Allow local framing adjustments without turning the primitive into a media card." },
      ])}

      {renderReferenceNotesCard(
        "Aspect ratio should stay a quiet layout utility that frames media and previews, not a visual component with its own content language.",
        [
          "The stable anatomy is only a ratio wrapper plus an inner fill area for composed content.",
          "The primitive should work with images, media placeholders, charts, and lightweight preview shells.",
          "It provides framing, not semantics, media loading logic, or content styling.",
        ],
        [
          "Use aspect ratio wherever the same content family needs consistent framing across variable container widths.",
          "Compose other stable primitives inside it instead of baking a dedicated media card into the utility.",
          "Keep the ratio values explicit and reusable instead of hardcoding one-off padding hacks in app code.",
        ],
        [
          "Do not rely on aspect ratio as the only way to communicate media meaning or state.",
          "Do not turn the primitive into an image loader, gallery, or page hero system.",
          "Keep readable fallback copy available when visual previews are incomplete or decorative.",
        ],
      )}

      {renderUsageReviewCard(
        "Aspect ratio fits previews, embeds, cover blocks, and stable media shells that need predictable framing at different widths.",
        [
          "A card, dashboard, or docs surface needs media or illustration framing that stays stable during resize.",
          "Preview content should hold a predictable ratio instead of collapsing into arbitrary height based on surrounding copy.",
        ],
        [
          "Use one ratio wrapper and compose your content inside it.",
          "Prefer explicit ratio values like 16:9, 4:3, or 1:1 for repeatable layout decisions.",
          "Keep styling calm so the primitive remains about framing, not decoration.",
        ],
        [
          "Do not build media player logic or product-specific hero systems into the primitive.",
          "Do not use aspect ratio when plain intrinsic content sizing already reads well.",
          "Do not overload the wrapper with page-specific spacing and state logic that belongs in a surrounding surface.",
        ],
      )}
    </div>
  );
}
