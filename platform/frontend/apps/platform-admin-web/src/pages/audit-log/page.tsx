import { DateRangeField, SecondaryTab, SecondaryTabs, SummaryStrip, ViewPresetBar } from "@platform/ui-kit";
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
import { AdminTableSurfaceContract } from "../../widgets/admin-table-surface-contract/admin-table-surface-contract";
import type { AdminTableSortField } from "../../widgets/admin-table-surface-contract/admin-table-surface-contract";

type AuditSection = "events" | "access-changes" | "system-jobs";
type AuditPreset = "all" | "investigations" | "automation-watch" | "access-review";

const auditDatePresets = [
  { id: "all-time", label: "All time", startDate: "", endDate: "" },
  { id: "today", label: "Today", startDate: "2026-03-20", endDate: "2026-03-20" },
  { id: "last-3d", label: "Last 3 days", startDate: "2026-03-18", endDate: "2026-03-20" },
  { id: "last-7d", label: "Last 7 days", startDate: "2026-03-14", endDate: "2026-03-20" },
] as const;

function matchesDateRange(value: string, startDate: string, endDate: string) {
  if (!startDate && !endDate) return true;
  if (startDate && value < startDate) return false;
  if (endDate && value > endDate) return false;
  return true;
}

function matchesAuditPreset(item: { facets: Record<string, string>; actorLabel: string; severityVariant: string }, preset: AuditPreset) {
  switch (preset) {
    case "investigations":
      return item.severityVariant === "warning" || item.severityVariant === "danger";
    case "automation-watch":
      return item.actorLabel === "System" || item.actorLabel === "Automation";
    case "access-review":
      return item.facets.scope === "access";
    default:
      return true;
  }
}

const baseAuditFilterGroups = [
  {
    description: "Governance domain to scan before dropping into a selected event.",
    key: "scope",
    label: "Scope",
    options: [
      { label: "All scopes", value: "all" },
      { label: "Access", value: "access" },
      { label: "Tenant config", value: "tenant-config" },
      { label: "Billing", value: "billing" },
    ],
  },
  {
    description: "Signal level for sorting routine traces from escalations.",
    key: "severity",
    label: "Severity",
    options: [
      { label: "All levels", value: "all" },
      { label: "Info", value: "info" },
      { label: "Attention", value: "attention" },
      { label: "Critical", value: "critical" },
    ],
  },
  {
    description: "Who or what emitted the event into the audit stream.",
    key: "actor",
    label: "Actor",
    options: [
      { label: "All actors", value: "all" },
      { label: "Operator", value: "operator" },
      { label: "System", value: "system" },
      { label: "Automation", value: "automation" },
    ],
  },
] as const;

const auditItems = [
  {
    id: "role-grant-review",
    actorLabel: "Operator",
    detailDescription: "Audit detail starts with actor and surface context first, then expands into retention and follow-up rules.",
    detailMeta: "actor: operator · source: access control · retention: 1 year",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Do not mix permission editing with audit review in the same detail zone.",
          "Show traceability and impact, not write actions.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Before/after payload snapshots for the role change.",
          "Resolved actor identity and target surface references.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Decide whether payload diffs stay inline or open in a dedicated compare panel.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "role-grant-recent",
        label: "Recent",
        items: [
          {
            id: "role-grant-1",
            actor: "Operator",
            action: "submitted role grant",
            meta: "admin scope change requested",
            time: "7m ago",
            tone: "info",
          },
          {
            id: "role-grant-2",
            actor: "System",
            action: "persisted access snapshot",
            time: "6m ago",
            tone: "success",
          },
        ],
      },
    ],
    eventMeta: "operator action · admin scope change",
    eventTitle: "Platform role grant",
    facets: {
      actor: "operator",
      scope: "access",
      severity: "info",
    },
    recordedAt: "5 min ago",
    recordedOn: "2026-03-20",
    scopeLabel: "Access",
    severityLabel: "Info",
    severityVariant: "info",
    sourceLabel: "Access control",
    summary: "Contract for viewing actor, target, and before/after traces without yet committing to the final governance UI.",
  },
  {
    id: "tenant-config-change",
    actorLabel: "Operator",
    detailDescription: "This detail zone shows how config events can keep change summary, affected surfaces, and review notes in one narrow rail.",
    detailMeta: "actor: operator · source: tenant config sheet · retention: 180 days",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Keep rollback or editing flows outside audit review.",
          "Summarize changed fields and affected tenant routing surfaces.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Field-level change summary from config mutations.",
          "Surface ownership and tenant metadata for context.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Choose whether affected fields deserve a compact diff block or table summary.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "tenant-config-recent",
        label: "Recent",
        items: [
          {
            id: "tenant-config-1",
            actor: "Operator",
            action: "saved tenant config change",
            meta: "host and auth posture updated",
            time: "19m ago",
            tone: "warning",
          },
          {
            id: "tenant-config-2",
            actor: "System",
            action: "recorded field diff",
            time: "18m ago",
            tone: "info",
          },
        ],
      },
    ],
    eventMeta: "tenant host and auth posture changed",
    eventTitle: "Tenant config updated",
    facets: {
      actor: "operator",
      scope: "tenant-config",
      severity: "attention",
    },
    recordedAt: "18 min ago",
    recordedOn: "2026-03-20",
    scopeLabel: "Tenant config",
    severityLabel: "Attention",
    severityVariant: "warning",
    sourceLabel: "Tenant config sheet",
    summary: "Layout contract for reviewing tenant-surface changes with enough detail to validate ownership and blast radius.",
  },
  {
    id: "sso-policy-updated",
    actorLabel: "Operator",
    detailDescription: "Access-related audit review still benefits from a table-heavy stream, but it deserves a dedicated subroute so it does not drown in unrelated platform events.",
    detailMeta: "actor: operator · source: access policy · retention: 1 year",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Keep policy editing out of the audit page.",
          "Expose traceability, blast radius, and approval context only.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Policy diff snapshot and affected tenant or role scope.",
          "Resolved operator identity and approval metadata.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Decide whether access events need grouped diffs by policy domain.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "access-policy-recent",
        label: "Recent",
        items: [
          {
            id: "access-policy-1",
            actor: "Operator",
            action: "updated SSO policy",
            meta: "enterprise cohort",
            time: "28m ago",
            tone: "warning",
          },
          {
            id: "access-policy-2",
            actor: "System",
            action: "attached approval reference",
            time: "26m ago",
            tone: "info",
          },
        ],
      },
    ],
    eventMeta: "SSO enforcement updated for enterprise cohort",
    eventTitle: "Access policy updated",
    facets: {
      actor: "operator",
      scope: "access",
      severity: "attention",
    },
    recordedAt: "27 min ago",
    recordedOn: "2026-03-20",
    scopeLabel: "Access",
    severityLabel: "Attention",
    severityVariant: "warning",
    sourceLabel: "Access policy",
    summary: "Seeded access-change event for route-level separation between operator access history and the broader audit stream.",
  },
  {
    id: "billing-export-trigger",
    actorLabel: "System",
    detailDescription: "A route-complete audit layout must also support high-signal automated events, not only human operations.",
    detailMeta: "actor: system · source: billing exporter · retention: 2 years",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Keep exporter controls out of audit review and focus on traceability.",
          "Expose delivery targets, failures, and acknowledgement posture.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Job execution trace and target delivery receipts.",
          "Correlation identifiers shared with billing operations.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Decide whether machine events need grouping by job run or by affected tenant set.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "billing-export-recent",
        label: "Recent",
        items: [
          {
            id: "billing-export-1",
            actor: "System",
            action: "generated export bundle",
            meta: "downstream finance sync",
            time: "43m ago",
            tone: "danger",
          },
          {
            id: "billing-export-2",
            actor: "Automation",
            action: "captured delivery receipt",
            time: "41m ago",
            tone: "success",
          },
        ],
      },
    ],
    eventMeta: "scheduled export job · downstream finance sync",
    eventTitle: "Billing export generated",
    facets: {
      actor: "system",
      scope: "billing",
      severity: "critical",
    },
    recordedAt: "42 min ago",
    recordedOn: "2026-03-19",
    scopeLabel: "Billing",
    severityLabel: "Critical",
    severityVariant: "danger",
    sourceLabel: "Billing exporter",
    summary: "Seeded governance view for machine-generated events and downstream delivery confirmation.",
  },
  {
    id: "retention-sweep-completed",
    actorLabel: "Automation",
    detailDescription: "System-job audit review is high-volume and machine-heavy, which is why it stays table-first with a narrow detail rail.",
    detailMeta: "actor: automation · source: audit retention job · retention: 2 years",
    detailSections: [
      {
        title: "Contract boundary",
        items: [
          "Keep scheduling and job control surfaces outside audit review.",
          "Expose run outcome, target scope, and correlation trace only.",
        ],
      },
      {
        title: "Dependencies",
        items: [
          "Job run summary and archival target results.",
          "Correlation IDs shared with storage and retention services.",
        ],
      },
      {
        title: "Next layout decision",
        items: [
          "Decide whether machine-job traces need grouped runs or flat event rows by default.",
        ],
      },
    ],
    timelineGroups: [
      {
        id: "retention-recent",
        label: "Recent",
        items: [
          {
            id: "retention-1",
            actor: "Automation",
            action: "completed retention sweep",
            meta: "archival rotation",
            time: "1h ago",
            tone: "info",
          },
          {
            id: "retention-2",
            actor: "System",
            action: "stored correlation trace",
            time: "58m ago",
            tone: "success",
          },
        ],
      },
    ],
    eventMeta: "nightly retention sweep · archival rotation",
    eventTitle: "Retention sweep completed",
    facets: {
      actor: "automation",
      scope: "billing",
      severity: "info",
    },
    recordedAt: "1 hr ago",
    recordedOn: "2026-03-18",
    scopeLabel: "System job",
    severityLabel: "Info",
    severityVariant: "info",
    sourceLabel: "Audit retention job",
    summary: "Seeded automation event for system-job trace review and retention verification.",
  },
] as const;

type AuditFilterGroup = (typeof baseAuditFilterGroups)[number];
type AuditItem = (typeof auditItems)[number];

const auditSectionConfig: Record<
  AuditSection,
  {
    description: string;
    filterGroups: ReadonlyArray<AuditFilterGroup>;
    items: ReadonlyArray<AuditItem>;
    path: string;
    tabLabel: string;
    tableDescription: string;
    tableTitle: string;
    title: string;
  }
> = {
  events: {
    description: "The top-level audit stream stays table-heavy because this surface is fundamentally about scanning and selecting events, not stepping through workflow cards.",
    filterGroups: baseAuditFilterGroups,
    items: auditItems,
    path: "/audit-log/events",
    tabLabel: "Events",
    tableDescription: "Cross-cutting event stream for access, config, and machine-generated platform traces.",
    tableTitle: "Audit event stream",
    title: "Audit events",
  },
  "access-changes": {
    description: "Access changes deserve their own subroute because operators often review entitlement and policy history separately from the wider system event stream.",
    filterGroups: baseAuditFilterGroups,
    items: auditItems.filter((item) => item.facets.scope === "access"),
    path: "/audit-log/access-changes",
    tabLabel: "Access Changes",
    tableDescription: "Focused access-change stream for role grants, policy updates, and related entitlement events.",
    tableTitle: "Access change stream",
    title: "Access changes",
  },
  "system-jobs": {
    description: "System jobs also remain table-heavy, but they need their own subroute because machine traces scale differently from human operator events.",
    filterGroups: baseAuditFilterGroups,
    items: auditItems.filter((item) => item.actorLabel === "System" || item.actorLabel === "Automation"),
    path: "/audit-log/system-jobs",
    tabLabel: "System Jobs",
    tableDescription: "Machine-generated trace stream for exporters, retention jobs, and other scheduled platform operations.",
    tableTitle: "System job stream",
    title: "System jobs",
  },
};

type AdminAuditLogPageProps = {
  section: AuditSection;
};

const auditPresetMeta: Record<
  AuditPreset,
  { label: string; meta: string; tone: "brand" | "info" | "warning" }
> = {
  all: { label: "All events", meta: "full governance stream", tone: "brand" },
  investigations: {
    label: "Investigations",
    meta: "warning and critical events",
    tone: "warning",
  },
  "automation-watch": {
    label: "Automation watch",
    meta: "system and scheduled traces",
    tone: "info",
  },
  "access-review": {
    label: "Access review",
    meta: "identity and policy stream",
    tone: "info",
  },
};

const auditPresetOrder: Record<AuditSection, ReadonlyArray<AuditPreset>> = {
  events: ["all", "investigations", "automation-watch", "access-review"],
  "access-changes": ["all", "investigations", "access-review"],
  "system-jobs": ["all", "automation-watch", "investigations"],
};

export function AdminAuditLogPage({ section }: AdminAuditLogPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSection = auditSectionConfig[section];
  const allowedPresetIds = auditPresetOrder[section];
  const defaultFilterState = getDefaultFilterState(currentSection.filterGroups);
  const activePresetId = readEnumSearchParam(searchParams, "view", allowedPresetIds, "all");
  const searchQuery = searchParams.get("q") ?? "";
  const activeFilters = readFilterSearchParams(searchParams, currentSection.filterGroups);
  const startDate = readDateSearchParam(searchParams, "from");
  const endDate = readDateSearchParam(searchParams, "to");
  const activeDatePresetId = searchParams.get("range") ?? (!startDate && !endDate ? "all-time" : "");
  const sortField = readEnumSearchParam<AdminTableSortField>(
    searchParams,
    "sort",
    ["event", "scope", "severity", "actor", "source", "recorded"] as const,
    "recorded",
  );
  const sortDirection = readEnumSearchParam(searchParams, "dir", ["asc", "desc"] as const, "desc");

  const filteredSectionItems = useMemo(() => {
    return currentSection.items.filter((item) => {
      return (
        matchesAuditPreset(item, activePresetId) &&
        matchesDateRange(item.recordedOn, startDate, endDate)
      );
    });
  }, [activePresetId, currentSection.items, endDate, startDate]);

  const presetItems = useMemo(() => {
    return allowedPresetIds.map((presetId) => ({
      id: presetId,
      count: String(currentSection.items.filter((item) => matchesAuditPreset(item, presetId)).length),
      label: auditPresetMeta[presetId].label,
      meta: auditPresetMeta[presetId].meta,
      tone: auditPresetMeta[presetId].tone,
    }));
  }, [allowedPresetIds, currentSection.items]);

  const summaryItems = [
    {
      id: "total",
      label: "Visible events",
      meta: "seeded event rows",
      value: String(filteredSectionItems.length),
      tone: "brand",
    },
    {
      id: "high-signal",
      label: "Attention+",
      meta: "warning or critical",
      value: String(
        filteredSectionItems.filter(
          (item) => item.severityVariant === "warning" || item.severityVariant === "danger",
        ).length,
      ),
      tone: "warning",
    },
    {
      id: "automated",
      label: "Automated",
      meta: "system or automation",
      value: String(
        filteredSectionItems.filter(
          (item) => item.actorLabel === "System" || item.actorLabel === "Automation",
        ).length,
      ),
      tone: "info",
    },
  ] as const;

  function handleDatePresetSelect(presetId: string) {
    const preset = auditDatePresets.find((entry) => entry.id === presetId);
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

  function resetAuditControls() {
    setSearchParams(
      setSearchParamsBatch(searchParams, [
        ["view", null],
        ["range", null],
        ["from", null],
        ["to", null],
        ["sort", null],
        ["dir", null],
      ]),
      { replace: true },
    );
  }

  return (
    <AdminTableSurfaceContract
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
      detailEyebrow="Audit detail"
      externalStateHighlights={[
        {
          id: "view",
          label: "Saved view",
          value: auditPresetMeta[activePresetId].label,
          tone: auditPresetMeta[activePresetId].tone,
        },
        {
          id: "range",
          label: "Date range",
          value: startDate || endDate ? `${startDate || "start"} -> ${endDate || "end"}` : "All time",
          tone: !startDate && !endDate ? "info" : "warning",
        },
        {
          id: "sort",
          label: "Sort",
          value: `${sortField} (${sortDirection})`,
          tone: "info",
        },
      ]}
      filterGroups={[...currentSection.filterGroups]}
      eyebrow="Governance"
      items={[...filteredSectionItems]}
      activeFilters={activeFilters}
      onResetExternalControls={resetAuditControls}
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
      railDescription="Filter rail stays visible so governance views do not bury scope and severity controls."
      railTitle="Audit filters"
      searchQuery={searchQuery}
      sectionTabs={
        <SecondaryTabs>
          {(Object.entries(auditSectionConfig) as Array<[AuditSection, (typeof auditSectionConfig)[AuditSection]]>).map(([key, value]) => (
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
      summaryStrip={<SummaryStrip items={summaryItems} />}
      tableDescription={currentSection.tableDescription}
      tableTitle={currentSection.tableTitle}
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
          presets={auditDatePresets.map(({ id, label }) => ({ id, label }))}
          presetLabel="Audit windows"
          startDate={startDate}
        />
      }
      onSortChange={(field, direction) =>
        setSearchParams(
          setSearchParamsBatch(searchParams, [
            ["sort", field === "recorded" ? null : field],
            ["dir", field === "recorded" && direction === "desc" ? null : direction],
          ]),
          { replace: true },
        )
      }
      sortDirection={sortDirection}
      sortField={sortField}
      title={currentSection.title}
    />
  );
}
