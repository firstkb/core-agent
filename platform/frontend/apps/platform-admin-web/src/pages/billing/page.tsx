import { Badge, DateRangeField, SecondaryTab, SecondaryTabs, ViewPresetBar } from "@platform/ui-kit";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  getDefaultFilterState,
  readDateSearchParam,
  readEnumSearchParam,
  readFilterSearchParams,
  setSearchParamsBatch,
  toSearchString,
} from "../../shared/search-params";
import { AdminSurfaceContract } from "../../widgets/admin-surface-contract/admin-surface-contract";

type BillingSection = "queue" | "exceptions" | "plan-deltas";
type BillingPreset = "all" | "attention-needed" | "finance-owned" | "revenue-owned" | "platform-review";

function BillingSummaryStrip({
  items,
}: {
  items: ReadonlyArray<{ id: string; label: string; value: string; meta?: string; tone?: "brand" | "info" | "warning" | "success" | "danger" | "neutral" }>;
}) {
  return (
    <div className="admin-web__surface-summary-grid">
      {items.map((item) => (
        <section className="admin-web__surface-summary-card" key={item.id}>
          <div className="admin-web__toolbar admin-web__toolbar--compact">
            <span className="admin-web__surface-summary-label">{item.label}</span>
            {item.tone ? (
              <Badge appearance="soft" size="sm" variant={item.tone}>
                {item.tone}
              </Badge>
            ) : null}
          </div>
          <div className="admin-web__surface-summary-value">{item.value}</div>
          {item.meta ? <p className="admin-web__surface-summary-label">{item.meta}</p> : null}
        </section>
      ))}
    </div>
  );
}

const billingDatePresets = [
  { id: "all-time", label: "All time", startDate: "", endDate: "" },
  { id: "march-window", label: "March window", startDate: "2026-03-01", endDate: "2026-03-31" },
  { id: "late-quarter", label: "Late quarter", startDate: "2026-03-15", endDate: "2026-04-30" },
  { id: "april-window", label: "April window", startDate: "2026-04-01", endDate: "2026-04-30" },
] as const;

function matchesDateRange(value: string, startDate: string, endDate: string) {
  if (!startDate && !endDate) return true;
  if (startDate && value < startDate) return false;
  if (endDate && value > endDate) return false;
  return true;
}

function matchesBillingPreset(
  item: { facets: Record<string, string> },
  preset: BillingPreset,
) {
  switch (preset) {
    case "attention-needed":
      return item.facets.status === "open" || item.facets.status === "review";
    case "finance-owned":
      return item.facets.owner === "finance";
    case "revenue-owned":
      return item.facets.owner === "revenue-ops";
    case "platform-review":
      return item.facets.owner === "platform";
    default:
      return true;
  }
}

const baseBillingFilterGroups = [
  {
    description: "Workflow posture for the current billing queue or review lane.",
    key: "status",
    label: "Status",
    options: [
      { label: "All states", value: "all" },
      { label: "Open", value: "open" },
      { label: "Review", value: "review" },
      { label: "Scheduled", value: "scheduled" },
    ],
  },
  {
    description: "Responsible team expected to own the next follow-up step.",
    key: "owner",
    label: "Owner",
    options: [
      { label: "All owners", value: "all" },
      { label: "Finance", value: "finance" },
      { label: "Revenue Ops", value: "revenue-ops" },
      { label: "Platform", value: "platform" },
    ],
  },
] as const;

const billingItems = [
  {
    id: "march-invoice-run",
    eyebrow: "Cycle",
    title: "March invoice run",
    meta: "12 enterprise tenants · renewal sweep",
    summary: "Layout contract for invoice batching, reconciliation checks, and billing release posture.",
    statusLabel: "scheduled",
    statusVariant: "brand",
    windowOn: "2026-03-20",
    facets: {
      owner: "finance",
      scope: "tenant-cycle",
      status: "scheduled",
    },
    detailDescription: "Primary detail zone for a billing run stays narrow on purpose: context, blockers, and downstream follow-up only.",
    detailMeta: "owner: Finance · cadence: monthly close · region group: global",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Keep invoice batching logic out of the page surface.",
          "Expose only control states, queue posture, and operator handoff points.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Subscription data contract from backend billing service.",
          "Tenant-level pricing and discount snapshots.",
          "Export/reconciliation status feed for finance operations.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Decide whether exceptions live inline in the list or open in a side sheet.",
          "Define if invoice preview stays in this page or moves to a dedicated flow.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "queue-recent",
        label: "Recent",
        items: [
          {
            id: "queue-recent-1",
            actor: "Finance",
            action: "validated renewal batch scope",
            meta: "12 enterprise tenants included",
            time: "2h ago",
            tone: "brand",
          },
          {
            id: "queue-recent-2",
            actor: "Platform",
            action: "locked pricing snapshot",
            description: "Prevents drift before invoice generation starts.",
            time: "4h ago",
            tone: "success",
          },
        ],
      },
    ],
  },
  {
    id: "april-renewal-prep",
    eyebrow: "Cycle",
    title: "April renewal prep",
    meta: "8 growth tenants · scheduled renewals",
    summary: "Seeded workflow for validating the next renewal batch before the close window opens.",
    statusLabel: "open",
    statusVariant: "info",
    windowOn: "2026-04-06",
    facets: {
      owner: "finance",
      scope: "tenant-cycle",
      status: "open",
    },
    detailDescription: "Queue-oriented billing work benefits from a concise operational summary rather than a dense raw-record table.",
    detailMeta: "owner: Finance · cadence: pre-close validation",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Keep renewal generation and charge execution outside the page layer.",
          "Expose queue readiness, blockers, and ownership only.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Renewal candidate list from subscription contracts.",
          "Confirmation that pricing snapshots are locked for the run.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Decide whether queue review needs a compact timeline or status cards.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "renewal-prep-recent",
        label: "Recent",
        items: [
          {
            id: "renewal-prep-1",
            actor: "Finance",
            action: "opened validation window",
            meta: "8 growth tenants pending",
            time: "1h ago",
            tone: "info",
          },
          {
            id: "renewal-prep-2",
            actor: "Revenue Ops",
            action: "confirmed owner coverage",
            time: "3h ago",
            tone: "success",
          },
        ],
      },
    ],
  },
  {
    id: "collection-watchlist",
    eyebrow: "Exceptions",
    title: "Collection watchlist",
    meta: "4 overdue enterprise accounts · follow-up required",
    summary: "Contract for exception triage, not a full collections console.",
    statusLabel: "review",
    statusVariant: "warning",
    windowOn: "2026-03-19",
    facets: {
      owner: "revenue-ops",
      scope: "collections",
      status: "review",
    },
    detailDescription: "The list/detail split is useful here because operators usually triage one account cluster while keeping the exception list visible.",
    detailMeta: "owner: Revenue Ops · SLA: 48h review window",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Keep payment retries and ledger writes outside the frontend page.",
          "Expose only exception state, escalation owner, and tenant impact summary.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Collections risk scores and payment status snapshots.",
          "Account owner directory for escalation routing.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Decide whether account notes live in the detail rail or open in a dialog.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "watchlist-recent",
        label: "Recent",
        items: [
          {
            id: "watchlist-1",
            actor: "Revenue Ops",
            action: "flagged overdue cohort",
            meta: "4 enterprise accounts",
            time: "35m ago",
            tone: "warning",
          },
          {
            id: "watchlist-2",
            actor: "Finance",
            action: "requested follow-up note",
            time: "2h ago",
            tone: "info",
          },
        ],
      },
    ],
  },
  {
    id: "failed-payment-retries",
    eyebrow: "Exceptions",
    title: "Failed payment retries",
    meta: "6 accounts · payment recovery in progress",
    summary: "Contract for a focused exception queue where operators resolve billing failures one cluster at a time.",
    statusLabel: "open",
    statusVariant: "danger",
    windowOn: "2026-03-21",
    facets: {
      owner: "revenue-ops",
      scope: "collections",
      status: "open",
    },
    detailDescription: "Exception handling wants list/detail because operators step through cases and need a stable side context.",
    detailMeta: "owner: Revenue Ops · recovery window: active",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Keep retry orchestration and payment writes outside the page.",
          "Expose failure summary, owner, and next follow-up step.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Retry attempt telemetry and last payment gateway result.",
          "Account owner directory for outreach and escalation.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Decide whether exception notes stay in the detail rail or open in a side sheet.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "failed-retries-recent",
        label: "Recent",
        items: [
          {
            id: "failed-retries-1",
            actor: "System",
            action: "recorded gateway failure",
            meta: "retry window still active",
            time: "12m ago",
            tone: "danger",
          },
          {
            id: "failed-retries-2",
            actor: "Revenue Ops",
            action: "queued outreach",
            time: "50m ago",
            tone: "warning",
          },
        ],
      },
    ],
  },
  {
    id: "plan-delta-review",
    eyebrow: "Verification",
    title: "Plan delta review",
    meta: "pricing drift across Starter and Growth cohorts",
    summary: "Seeded surface for comparing plan changes before they land in billable cycles.",
    statusLabel: "open",
    statusVariant: "info",
    windowOn: "2026-03-24",
    facets: {
      owner: "platform",
      scope: "plan-deltas",
      status: "open",
    },
    detailDescription: "This zone demonstrates how a layout can hold pre-billing contract review without pretending to be the final reporting experience.",
    detailMeta: "owner: Platform · source: pricing config drift",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Treat this page as a review surface, not as the source of truth for pricing.",
          "Keep comparison summaries human-readable and approval-focused.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Resolved pricing config snapshots per plan and tenant segment.",
          "Change attribution from release or config systems.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Choose whether plan deltas need diff cards, table rows, or a dedicated compare view.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "plan-delta-recent",
        label: "Recent",
        items: [
          {
            id: "plan-delta-1",
            actor: "Platform",
            action: "detected pricing drift",
            meta: "Starter vs Growth comparison",
            time: "25m ago",
            tone: "info",
          },
          {
            id: "plan-delta-2",
            actor: "Finance",
            action: "requested review packet",
            time: "90m ago",
            tone: "brand",
          },
        ],
      },
    ],
  },
  {
    id: "enterprise-override-audit",
    eyebrow: "Verification",
    title: "Enterprise override audit",
    meta: "custom pricing overrides awaiting review",
    summary: "Seeded review flow for plan override drift before it impacts downstream billing.",
    statusLabel: "review",
    statusVariant: "warning",
    windowOn: "2026-04-12",
    facets: {
      owner: "platform",
      scope: "plan-deltas",
      status: "review",
    },
    detailDescription: "Plan-delta work is review-driven and comparative, which still fits list/detail better than a raw ledger-style table.",
    detailMeta: "owner: Platform · source: override config audit",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Treat this as a review contract, not as pricing authoring.",
          "Keep approval context and override rationale explicit.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Override config snapshots and tenant attribution.",
          "Baseline plan matrices for comparison.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Decide whether override reviews need diff cards or a compare table inside the detail zone.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "override-audit-recent",
        label: "Recent",
        items: [
          {
            id: "override-audit-1",
            actor: "Platform",
            action: "flagged override deviation",
            meta: "custom enterprise pricing",
            time: "40m ago",
            tone: "warning",
          },
          {
            id: "override-audit-2",
            actor: "Finance",
            action: "queued contract review",
            time: "2h ago",
            tone: "info",
          },
        ],
      },
    ],
  },
] as const;

type BillingFilterGroup = (typeof baseBillingFilterGroups)[number];
type BillingItem = (typeof billingItems)[number];

const billingSectionConfig: Record<
  BillingSection,
  {
    description: string;
    filterGroups: ReadonlyArray<BillingFilterGroup>;
    items: ReadonlyArray<BillingItem>;
    listDescription: string;
    listTitle: string;
    path: string;
    tabLabel: string;
    title: string;
  }
> = {
  queue: {
    description: "Billing queue is a workflow surface for renewal batches and billing runs. It should stay list/detail, not collapse into a generic records table.",
    filterGroups: baseBillingFilterGroups,
    items: billingItems.filter((item) => item.facets.scope === "tenant-cycle"),
    listDescription: "Workflow queue for billing runs and renewal batches.",
    listTitle: "Billing queue",
    path: "/billing/queue",
    tabLabel: "Queue",
    title: "Billing queue",
  },
  exceptions: {
    description: "Billing exceptions are operator-driven recovery work. This needs queue triage and focused detail, not a broad table-first layout.",
    filterGroups: baseBillingFilterGroups,
    items: billingItems.filter((item) => item.facets.scope === "collections"),
    listDescription: "Focused exception queue for collections and payment recovery work.",
    listTitle: "Billing exceptions",
    path: "/billing/exceptions",
    tabLabel: "Exceptions",
    title: "Billing exceptions",
  },
  "plan-deltas": {
    description: "Plan deltas are review-oriented and comparative. They should remain a narrower list/detail flow until we know whether a dedicated compare surface is needed.",
    filterGroups: baseBillingFilterGroups,
    items: billingItems.filter((item) => item.facets.scope === "plan-deltas"),
    listDescription: "Review queue for pricing drift, plan changes, and override audits.",
    listTitle: "Plan delta reviews",
    path: "/billing/plan-deltas",
    tabLabel: "Plan Deltas",
    title: "Plan delta review",
  },
};

type AdminBillingPageProps = {
  section: BillingSection;
};

const billingPresetOrder: Record<BillingSection, ReadonlyArray<BillingPreset>> = {
  queue: ["all", "attention-needed", "finance-owned"],
  exceptions: ["all", "attention-needed", "revenue-owned"],
  "plan-deltas": ["all", "attention-needed", "platform-review"],
};

const billingPresetMeta: Record<
  BillingPreset,
  { label: string; meta: string; tone: "brand" | "info" | "warning" }
> = {
  all: { label: "All items", meta: "full billing lane", tone: "brand" },
  "attention-needed": {
    label: "Attention needed",
    meta: "open or review states",
    tone: "warning",
  },
  "finance-owned": { label: "Finance owned", meta: "close window work", tone: "info" },
  "revenue-owned": { label: "Revenue Ops", meta: "collections focus", tone: "warning" },
  "platform-review": { label: "Platform review", meta: "pricing drift checks", tone: "info" },
};

export function AdminBillingPage({ section }: AdminBillingPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSection = billingSectionConfig[section];
  const allowedPresetIds = billingPresetOrder[section];
  const defaultFilterState = getDefaultFilterState(currentSection.filterGroups);
  const activePresetId = readEnumSearchParam(searchParams, "view", allowedPresetIds, "all");
  const searchQuery = searchParams.get("q") ?? "";
  const activeFilters = readFilterSearchParams(searchParams, currentSection.filterGroups);
  const startDate = readDateSearchParam(searchParams, "from");
  const endDate = readDateSearchParam(searchParams, "to");
  const activeDatePresetId = searchParams.get("range") ?? (!startDate && !endDate ? "all-time" : "");

  const filteredSectionItems = useMemo(() => {
    return currentSection.items.filter((item) => {
      return (
        matchesBillingPreset(item, activePresetId) &&
        matchesDateRange(item.windowOn, startDate, endDate)
      );
    });
  }, [activePresetId, currentSection.items, endDate, startDate]);

  const presetItems = useMemo(() => {
    return allowedPresetIds.map((presetId) => ({
      id: presetId,
      count: String(currentSection.items.filter((item) => matchesBillingPreset(item, presetId)).length),
      label: billingPresetMeta[presetId].label,
      meta: billingPresetMeta[presetId].meta,
      tone: billingPresetMeta[presetId].tone,
    }));
  }, [allowedPresetIds, currentSection.items]);

  const summaryItems = [
    {
      id: "total",
      label: "Visible items",
      meta: "seeded workflow units",
      value: String(filteredSectionItems.length),
      tone: "brand",
    },
    {
      id: "open",
      label: "Open",
      meta: "requires operator action",
      value: String(filteredSectionItems.filter((item) => item.facets.status === "open").length),
      tone: "info",
    },
    {
      id: "review",
      label: "Review",
      meta: "needs validation",
      value: String(filteredSectionItems.filter((item) => item.facets.status === "review").length),
      tone: "warning",
    },
  ] as const;

  function handleDatePresetSelect(presetId: string) {
    const preset = billingDatePresets.find((entry) => entry.id === presetId);
    if (!preset) return;

    setSearchParams(
      setSearchParamsBatch(searchParams, [
        ["range", presetId === "all-time" ? null : presetId],
        ["from", preset.startDate || null],
        ["to", preset.endDate || null],
      ]),
      { replace: true },
    );
  }

  function resetBillingControls() {
    setSearchParams(
      setSearchParamsBatch(searchParams, [
        ["view", null],
        ["range", null],
        ["from", null],
        ["to", null],
      ]),
      { replace: true },
    );
  }

  return (
    <AdminSurfaceContract
      controlStrip={
        <ViewPresetBar
          activePresetId={activePresetId}
          onPresetSelect={(presetId) =>
            setSearchParams(
              setSearchParamsBatch(searchParams, [["view", presetId === "all" ? null : presetId]]),
              { replace: true },
            )
          }
          presets={presetItems}
        />
      }
      description={currentSection.description}
      detailEyebrow="Billing detail"
      externalStateHighlights={[
        {
          id: "view",
          label: "Saved view",
          value: billingPresetMeta[activePresetId].label,
          tone: billingPresetMeta[activePresetId].tone,
        },
        {
          id: "window",
          label: "Date range",
          value: startDate || endDate ? `${startDate || "start"} -> ${endDate || "end"}` : "All time",
          tone: !startDate && !endDate ? "info" : "warning",
        },
      ]}
      filterGroups={[...currentSection.filterGroups]}
      eyebrow="Finance"
      items={[...filteredSectionItems]}
      activeFilters={activeFilters}
      listDescription={currentSection.listDescription}
      listTitle={currentSection.listTitle}
      onResetExternalControls={resetBillingControls}
      onActiveFiltersChange={(filters) =>
        setSearchParams(
          setSearchParamsBatch(
            searchParams,
            currentSection.filterGroups.map(
              (group) =>
                [
                  group.key,
                  filters[group.key] === defaultFilterState[group.key] ? null : filters[group.key],
                ] as const,
            ),
          ),
          { replace: true },
        )
      }
      onSearchQueryChange={(value) =>
        setSearchParams(setSearchParamsBatch(searchParams, [["q", value || null]]), {
          replace: true,
        })
      }
      railDescription="Filter rail stays explicit so large billing surfaces do not collapse into hidden controls."
      railTitle="Billing filters"
      searchQuery={searchQuery}
      sectionTabs={
        <SecondaryTabs>
          {(Object.entries(billingSectionConfig) as Array<[BillingSection, (typeof billingSectionConfig)[BillingSection]]>).map(([key, value]) => (
            <SecondaryTab
              active={section === key}
              badge={String(value.items.length)}
              key={key}
              onClick={() => navigate({ pathname: value.path, search: toSearchString(searchParams) })}
            >
              {value.tabLabel}
            </SecondaryTab>
          ))}
        </SecondaryTabs>
      }
      summaryStrip={<BillingSummaryStrip items={summaryItems} />}
      toolbarControls={
        <DateRangeField
          activePresetId={activeDatePresetId}
          endDate={endDate}
          onEndDateChange={(value) => {
            setSearchParams(
              setSearchParamsBatch(searchParams, [
                ["range", null],
                ["to", value || null],
              ]),
              { replace: true },
            );
          }}
          onPresetSelect={handleDatePresetSelect}
          onStartDateChange={(value) => {
            setSearchParams(
              setSearchParamsBatch(searchParams, [
                ["range", null],
                ["from", value || null],
              ]),
              { replace: true },
            );
          }}
          presets={billingDatePresets.map(({ id, label }) => ({ id, label }))}
          presetLabel="Billing windows"
          startDate={startDate}
        />
      }
      title={currentSection.title}
    />
  );
}
