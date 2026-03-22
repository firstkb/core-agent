/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  GuidedEmptyState,
  SummaryPillStrip,
  TableColumnVisibility,
  TablePaginationBar,
  ViewPresetBar,
} from "@platform/ui-kit";

import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../components/docs-cards";

export function renderSummaryPillStripDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Summary pill strip remains provisional and is best reviewed as a compact, tone-led summary layer.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Preview" stacked>
            <SummaryPillStrip
              items={[
                { id: "healthy", label: "Healthy", tone: "success", value: "104" },
                { id: "review", label: "Review", tone: "warning", value: "12" },
                { id: "degraded", label: "Degraded", tone: "danger", value: "3" },
                { id: "trial", label: "Trial", tone: "brand", value: "9" },
              ]}
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the provisional summary pill strip used for concise status-led totals.", [
        { name: "items", type: "Array<{ id, label, value, tone? }>", notes: "Supplies compact pill items where tone is more visible than in the base summary strip." },
      ])}

      {renderReferenceNotesCard(
        "Summary pill strip remains provisional because its tone-led presentation may still be too opinionated for general shared display language.",
        [
          "The anatomy is a row of pill-like totals with short label, short value, and optional semantic tone on the whole item.",
          "It is denser and more status-forward than summary strip, which makes it useful but easier to over-apply.",
          "The pattern is best treated as review material until multiple surfaces prove the same compact rhythm.",
        ],
        [
          "Keep labels and values very short so each pill remains legible.",
          "Use tones consistently with the shared semantic palette instead of inventing one-off color meanings.",
          "Prefer this only when the whole row genuinely benefits from pill styling rather than calmer strip styling.",
        ],
        [
          "Do not rely on tone alone to communicate state.",
          "Do not mix long explanatory text into pill items.",
          "Do not let the pill row become a substitute for fuller state explanation elsewhere on the page.",
        ],
      )}

      {renderUsageReviewCard(
        "Summary pill strip can work for compact status-led totals, but it remains provisional until we are certain the higher visual emphasis is broadly reusable.",
        [
          "A surface needs a tight row of short status totals that are easier to compare as discrete pills.",
          "The content is compact enough that longer card or strip treatment would feel too heavy.",
        ],
        [
          "Use this only for short labels and short values.",
          "Keep the row secondary to the main page content.",
          "Treat the pattern as review-only until more than one module confirms the same fit.",
        ],
        [
          "Do not turn pill items into mini cards with long copy.",
          "Do not attach actions or route switching to the same row.",
          "Do not assume every metric row benefits from stronger tone-led styling.",
        ],
      )}
    </div>
  );
}

export function renderViewPresetBarDocs(
  activePresetId: string,
  onPresetSelect: (presetId: string) => void,
) {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Interactive preview</CardTitle>
          <CardDescription>View preset bar is still provisional because its saved-view semantics may still be too workflow-specific for the stable shared layer.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Preview" stacked>
            <ViewPresetBar
              activePresetId={activePresetId}
              onPresetSelect={onPresetSelect}
              presets={[
                { id: "health", label: "Health", count: "24", meta: "Operational overview", tone: "success" },
                { id: "risk", label: "Risk", count: "7", meta: "Needs follow-up", tone: "warning" },
                { id: "access", label: "Access", count: "3", meta: "Privilege review", tone: "brand" },
              ]}
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review notes</CardTitle>
          <CardDescription>This stays in inventory because reuse exists, but the preset model still overlaps with route-bound saved views more than with generic shared navigation.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Active preset" stacked>
            <div className="ui-lab-page__inline-wrap">
              <Badge appearance="soft" variant="brand">
                {activePresetId}
              </Badge>
              <Badge appearance="soft" variant="warning">
                Provisional
              </Badge>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the provisional preset-selection bar used by denser review surfaces.", [
        { name: "presets", type: "Array<{ id, label, meta?, count?, tone? }>", notes: "Supplies each selectable preset with optional supporting metadata and tone." },
        { name: "activePresetId", type: "string", notes: "Keeps selection controlled outside the pattern so routing or screen state remains app-owned." },
        { name: "onPresetSelect", type: "(presetId: string) => void", notes: "Returns the chosen preset while leaving filtering, routing, and persistence outside the shared layer." },
      ])}

      {renderReferenceNotesCard(
        "View preset bar remains provisional because selection semantics, density, and relation to saved-view workflow state still need broader product confirmation.",
        [
          "The anatomy is a selectable row of preset items with label, optional count, optional meta, and optional semantic tone.",
          "It sits closer to workflow orchestration than a plain display strip because selection changes what the surrounding surface shows.",
          "The active state is intentionally external so the pattern does not become a route or filtering framework.",
        ],
        [
          "Use the bar only when the same preset rhythm would likely repeat across comparable dense surfaces.",
          "Keep preset labels short and count/meta secondary to the main selection label.",
          "Leave persistence, URL state, and screen-specific query logic outside the pattern.",
        ],
        [
          "Do not assume every tab-like or filter-like control should become a preset bar.",
          "Do not hide critical state changes behind tone or count alone.",
          "Do not merge saved views, density, filters, and column controls into one shared bar until that grouping is proven.",
        ],
      )}

      {renderUsageReviewCard(
        "View preset bar is useful for comparing a few dense preconfigured views, but it remains provisional because its workflow fit is more specific than a base navigation primitive.",
        [
          "A surface has a small set of named review presets that operators switch between repeatedly.",
          "Each preset represents a meaningful state or lens rather than a generic tab or filter token.",
        ],
        [
          "Keep the number of presets small and the labels explicit.",
          "Treat this as a higher-level review pattern rather than a replacement for base tabs.",
          "Validate the same selection model across multiple real modules before promotion.",
        ],
        [
          "Do not use this as a generic catch-all toolbar for view state.",
          "Do not couple the bar directly to screen-specific filter logic in the shared API.",
          "Do not promote it until preset semantics are stable across more than one product surface.",
        ],
      )}
    </div>
  );
}

export function TablePaginationBarPreview() {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(4);
  const totalItems = 184;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <TablePaginationBar
      currentPage={Math.min(currentPage, totalPages)}
      onPageChange={setCurrentPage}
      onPageSizeChange={(nextPageSize: number) => {
        setPageSize(nextPageSize);
        setCurrentPage(1);
      }}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
}

export function TableColumnVisibilityPreview() {
  const [columns, setColumns] = useState<
    Array<{
      checked: boolean;
      count: string;
      disabled?: boolean;
      id: string;
      label: string;
    }>
  >([
    { checked: true, count: "Always visible", id: "tenant", label: "Tenant" },
    { checked: true, count: "12 values", id: "plan", label: "Plan" },
    { checked: true, count: "5 states", id: "status", label: "Status" },
    { checked: false, count: "Optional", id: "region", label: "Region" },
    { checked: false, count: "Optional", id: "owner", label: "Owner" },
    { checked: true, count: "Required", disabled: true, id: "lastSync", label: "Last sync" },
  ]);

  const visibleCount = columns.filter((column) => column.checked).length;

  return (
    <div className="ui-lab-page__stack">
      <div className="ui-lab-page__inline-wrap">
        <TableColumnVisibility
          columns={columns}
          label="Toggle columns"
          onColumnChange={(id: string, checked: boolean) => {
            setColumns((current) =>
              current.map((column) => (column.id === id ? { ...column, checked } : column)),
            );
          }}
        />
        <Badge appearance="soft" variant="brand">
          Visible columns: {visibleCount}
        </Badge>
      </div>
      <div className="ui-lab-page__inline-wrap">
        {columns.map((column) => (
          <Badge
            appearance={column.checked ? "soft" : "outline"}
            key={column.id}
            variant={column.checked ? "success" : "neutral"}
          >
            {column.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function renderInventoryPatternNotes(title: string, summary: string) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage review</CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent className="ui-lab-page__showcase-list">
        <ShowcaseRow label="Status" stacked>
          <div className="ui-lab-page__inline-wrap">
            <Badge appearance="soft" variant="warning">
              Provisional
            </Badge>
            <Badge appearance="soft" variant="neutral">
              Inventory only
            </Badge>
          </div>
        </ShowcaseRow>
        <div className="ui-lab-page__review-grid">
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">When to use</span>
            <ul className="ui-lab-page__review-list">
              <li>{title} is acceptable only where the same pattern is likely to repeat across multiple surfaces.</li>
              <li>Use this review surface to judge whether the visual density and behavior feel reusable outside one page.</li>
            </ul>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Do</span>
            <ul className="ui-lab-page__review-list">
              <li>Validate reuse, interaction semantics, and API shape before promoting anything into stable shared inventory.</li>
              <li>Keep these patterns isolated in `UI Lab` until at least one more surface confirms the same contract.</li>
            </ul>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Avoid</span>
            <ul className="ui-lab-page__review-list">
              <li>Do not treat this as stable ui-kit inventory until reuse, behavior, and API are explicitly confirmed.</li>
              <li>Do not move app-shaped layout decisions into `ui-kit` just because the preview looks acceptable in isolation.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
