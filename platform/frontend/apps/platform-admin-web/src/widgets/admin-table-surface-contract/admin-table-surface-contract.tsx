import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  Badge,
  type BadgeVariant,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CollectionEmptyState,
  type CollectionEmptyStateHighlight,
  DataToolbar,
  DataToolbarGroup,
  DataToolbarMeta,
  DetailPanel,
  DetailPanelBody,
  DetailPanelDescription,
  DetailPanelFooter,
  DetailPanelHeader,
  DetailPanelMeta,
  DetailPanelSection,
  DetailPanelSectionTitle,
  DetailPanelTitle,
  FilterChip,
  FilterRail,
  FilterRailGroup,
  Input,
  PageToolbar,
  Table,
  TableBody,
  TableCell,
  type TableDensity,
  TableHead,
  TableHeaderCell,
  TableMetaCell,
  TableRow,
  TableSortButton,
  type TableSortDirection,
  TimelineFeed,
  type TimelineFeedGroup,
} from "@platform/ui-kit";

import { getAdminRoutePath } from "../../shared/navigation";

export type AdminTableSurfaceFilterGroup = {
  key: string;
  label: string;
  description?: string;
  options: ReadonlyArray<{
    label: string;
    value: string;
  }>;
};

export type AdminTableSurfaceItem = {
  id: string;
  eventTitle: string;
  eventMeta: string;
  scopeLabel: string;
  severityLabel: string;
  severityVariant: BadgeVariant;
  actorLabel: string;
  sourceLabel: string;
  recordedAt: string;
  recordedOn: string;
  summary: string;
  facets: Record<string, string>;
  detailDescription: string;
  detailMeta: string;
  detailSections: ReadonlyArray<{
    title: string;
    items: ReadonlyArray<string>;
  }>;
  timelineGroups?: ReadonlyArray<TimelineFeedGroup>;
};

export type AdminTableSortField = "event" | "scope" | "severity" | "actor" | "source" | "recorded";

type AdminTableSurfaceContractProps = {
  title: string;
  eyebrow: string;
  description: string;
  sectionTabs?: ReactNode;
  summaryStrip?: ReactNode;
  controlStrip?: ReactNode;
  toolbarControls?: ReactNode;
  onResetExternalControls?: () => void;
  externalStateHighlights?: ReadonlyArray<CollectionEmptyStateHighlight>;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  activeFilters?: Record<string, string>;
  onActiveFiltersChange?: (filters: Record<string, string>) => void;
  railTitle: string;
  railDescription: string;
  tableTitle: string;
  tableDescription: string;
  detailEyebrow: string;
  filterGroups: ReadonlyArray<AdminTableSurfaceFilterGroup>;
  items: ReadonlyArray<AdminTableSurfaceItem>;
  sortField?: AdminTableSortField;
  sortDirection?: Exclude<TableSortDirection, null>;
  onSortChange?: (
    field: AdminTableSortField,
    direction: Exclude<TableSortDirection, null>,
  ) => void;
};

function matchesSearch(item: AdminTableSurfaceItem, searchQuery: string) {
  if (!searchQuery) return true;

  const normalizedQuery = searchQuery.toLowerCase();
  const haystack = [
    item.eventTitle,
    item.eventMeta,
    item.scopeLabel,
    item.actorLabel,
    item.sourceLabel,
    item.summary,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getScopeMeta(item: AdminTableSurfaceItem) {
  switch (item.facets.scope) {
    case "access":
      return "identity and entitlement";
    case "tenant-config":
      return "tenant runtime policy";
    case "billing":
      return "finance and export trace";
    default:
      return "governance surface";
  }
}

function getActorMeta(item: AdminTableSurfaceItem) {
  switch (item.facets.actor) {
    case "operator":
      return "human review path";
    case "system":
      return "runtime emitted";
    case "automation":
      return "scheduled workflow";
    default:
      return "platform actor";
  }
}

function getSourceMeta(item: AdminTableSurfaceItem) {
  switch (item.facets.scope) {
    case "access":
      return "policy and role mutation";
    case "tenant-config":
      return "tenant config change";
    case "billing":
      return "machine finance event";
    default:
      return "control-plane trace";
  }
}

function getSeverityRank(item: AdminTableSurfaceItem) {
  switch (item.severityVariant) {
    case "danger":
      return 4;
    case "warning":
      return 3;
    case "brand":
      return 2;
    case "info":
      return 1;
    default:
      return 0;
  }
}

function compareValues(left: number | string, right: number | string) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

function getSortedItems(
  items: ReadonlyArray<AdminTableSurfaceItem>,
  sortField: AdminTableSortField,
  direction: Exclude<TableSortDirection, null>,
) {
  const sortedItems = [...items].sort((left, right) => {
    let leftValue: number | string;
    let rightValue: number | string;

    switch (sortField) {
      case "event":
        leftValue = left.eventTitle;
        rightValue = right.eventTitle;
        break;
      case "scope":
        leftValue = left.scopeLabel;
        rightValue = right.scopeLabel;
        break;
      case "severity":
        leftValue = getSeverityRank(left);
        rightValue = getSeverityRank(right);
        break;
      case "actor":
        leftValue = left.actorLabel;
        rightValue = right.actorLabel;
        break;
      case "source":
        leftValue = left.sourceLabel;
        rightValue = right.sourceLabel;
        break;
      case "recorded":
        leftValue = Date.parse(left.recordedOn);
        rightValue = Date.parse(right.recordedOn);
        break;
    }

    const result = compareValues(leftValue, rightValue);
    return direction === "asc" ? result : -result;
  });

  return sortedItems;
}

export function AdminTableSurfaceContract({
  activeFilters: controlledActiveFilters,
  controlStrip,
  description,
  detailEyebrow,
  externalStateHighlights,
  filterGroups,
  items,
  eyebrow,
  onActiveFiltersChange,
  onResetExternalControls,
  onSearchQueryChange,
  railDescription,
  railTitle,
  searchQuery: controlledSearchQuery,
  sectionTabs,
  summaryStrip,
  sortDirection: controlledSortDirection,
  sortField: controlledSortField,
  tableDescription,
  tableTitle,
  toolbarControls,
  title,
  onSortChange,
}: AdminTableSurfaceContractProps) {
  const navigate = useNavigate();
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [internalSortField, setInternalSortField] = useState<AdminTableSortField>("recorded");
  const [internalSortDirection, setInternalSortDirection] = useState<Exclude<TableSortDirection, null>>("desc");
  const [tableDensity, setTableDensity] = useState<TableDensity>("comfortable");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id ?? null);
  const [internalActiveFilters, setInternalActiveFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(filterGroups.map((group) => [group.key, group.options[0]?.value ?? "all"])),
  );

  const searchQuery = controlledSearchQuery ?? internalSearchQuery;
  const activeFilters = controlledActiveFilters ?? internalActiveFilters;
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const sortField = controlledSortField ?? internalSortField;
  const sortDirection = controlledSortDirection ?? internalSortDirection;
  const defaultFilterState = useMemo(
    () =>
      Object.fromEntries(
        filterGroups.map((group) => [group.key, group.options[0]?.value ?? "all"]),
      ) as Record<string, string>,
    [filterGroups],
  );

  const filterCounts = useMemo(() => {
    return Object.fromEntries(
      filterGroups.map((group) => [
        group.key,
        Object.fromEntries(
          group.options.map((option) => [
            option.value,
            option.value === "all"
              ? items.length
              : items.filter((item) => item.facets[group.key] === option.value).length,
          ]),
        ),
      ]),
    ) as Record<string, Record<string, number>>;
  }, [filterGroups, items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!matchesSearch(item, deferredSearchQuery)) return false;

      return filterGroups.every((group) => {
        const activeValue = activeFilters[group.key];
        return activeValue === "all" || item.facets[group.key] === activeValue;
      });
    });
  }, [activeFilters, deferredSearchQuery, filterGroups, items]);

  const visibleItems = useMemo(
    () => getSortedItems(filteredItems, sortField, sortDirection),
    [filteredItems, sortDirection, sortField],
  );

  useEffect(() => {
    if (visibleItems.length === 0) {
      setSelectedItemId(null);
      return;
    }

    if (!visibleItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(visibleItems[0].id);
    }
  }, [selectedItemId, visibleItems]);

  const selectedItem = visibleItems.find((item) => item.id === selectedItemId) ?? null;
  const activeFilterCount = filterGroups.filter(
    (group) => (activeFilters[group.key] ?? "all") !== "all",
  ).length;
  const collectionStateHighlights = [
    {
      id: "search",
      label: "Search",
      value: searchQuery ? `"${searchQuery}"` : "No query",
      tone: searchQuery ? "brand" : "info",
    },
    {
      id: "filters",
      label: "Rail filters",
      value: activeFilterCount ? `${activeFilterCount} active` : "Default state",
      tone: activeFilterCount ? "warning" : "success",
    },
    {
      id: "density",
      label: "Density",
      value: tableDensity === "compact" ? "Compact" : "Comfortable",
      tone: tableDensity === "compact" ? "warning" : "info",
    },
    ...(externalStateHighlights ?? []),
  ] as const;
  const detailStateHighlights = [
    {
      id: "visible",
      label: "Visible rows",
      value: String(visibleItems.length),
      tone: visibleItems.length ? "info" : "warning",
    },
    {
      id: "filters",
      label: "Rail filters",
      value: activeFilterCount ? `${activeFilterCount} active` : "Default state",
      tone: activeFilterCount ? "warning" : "success",
    },
    {
      id: "density",
      label: "Density",
      value: tableDensity === "compact" ? "Compact" : "Comfortable",
      tone: tableDensity === "compact" ? "warning" : "info",
    },
    ...(externalStateHighlights ?? []),
  ] as const;

  function resetFilters() {
    if (onSearchQueryChange) {
      onSearchQueryChange("");
    } else {
      setInternalSearchQuery("");
    }

    if (onActiveFiltersChange) {
      onActiveFiltersChange(defaultFilterState);
    } else {
      setInternalActiveFilters(defaultFilterState);
    }

    onResetExternalControls?.();
  }

  function toggleSort(nextField: AdminTableSortField) {
    const nextDirection =
      sortField === nextField
        ? sortDirection === "asc"
          ? "desc"
          : "asc"
        : nextField === "recorded"
          ? "desc"
          : "asc";

    if (onSortChange) {
      onSortChange(nextField, nextDirection);
      return;
    }

    setInternalSortField(nextField);
    setInternalSortDirection(nextDirection);
  }

  function getSortDirectionFor(field: AdminTableSortField): TableSortDirection {
    return sortField === field ? sortDirection : null;
  }

  return (
    <div className="admin-web__stack">
      <PageToolbar
        actions={
          <>
            <Button
              onClick={() => navigate(getAdminRoutePath("overview"))}
              size="sm"
              variant="outline"
            >
              Return to overview
            </Button>
            <Button
              onClick={() => navigate(getAdminRoutePath("tenants"))}
              size="sm"
              variant="secondary"
            >
              Open tenant workbench
            </Button>
          </>
        }
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      {sectionTabs ? <div className="admin-web__section-tabs-bar">{sectionTabs}</div> : null}
      {summaryStrip}
      {controlStrip}

      <div className="admin-web__contract-grid">
        <FilterRail
          className="admin-web__contract-rail"
          description={railDescription}
          footer={
            <Button onClick={resetFilters} size="sm" variant="ghost">
              Reset rail
            </Button>
          }
          title={railTitle}
        >
          {filterGroups.map((group) => (
            <FilterRailGroup description={group.description} key={group.key} label={group.label}>
              {group.options.map((option) => (
                <FilterChip
                  active={activeFilters[group.key] === option.value}
                  count={filterCounts[group.key]?.[option.value]}
                  key={option.value}
                  onClick={() => {
                    const nextFilters = {
                      ...activeFilters,
                      [group.key]: option.value,
                    };

                    if (onActiveFiltersChange) {
                      onActiveFiltersChange(nextFilters);
                    } else {
                      setInternalActiveFilters(nextFilters);
                    }
                  }}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterRailGroup>
          ))}
        </FilterRail>

        <Card className="admin-web__contract-table-zone">
          <CardHeader>
            <div>
              <CardTitle>{tableTitle}</CardTitle>
              <CardDescription>{tableDescription}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="admin-web__contract-list-content">
            <DataToolbar className="admin-web__contract-table-toolbar">
              <DataToolbarGroup>
                <Input
                  className="admin-web__contract-search"
                  onChange={(event) => {
                    if (onSearchQueryChange) {
                      onSearchQueryChange(event.target.value);
                    } else {
                      setInternalSearchQuery(event.target.value);
                    }
                  }}
                  placeholder="Search seeded events..."
                  value={searchQuery}
                />
                {searchQuery ? (
                  <Button
                    onClick={() => {
                      if (onSearchQueryChange) {
                        onSearchQueryChange("");
                      } else {
                        setInternalSearchQuery("");
                      }
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Clear
                  </Button>
                ) : null}
              </DataToolbarGroup>

              <DataToolbarGroup align="end">
                {toolbarControls}
                <div className="admin-web__contract-density-toggle" role="group" aria-label="Table density">
                  <Button
                    aria-pressed={tableDensity === "comfortable"}
                    onClick={() => setTableDensity("comfortable")}
                    size="sm"
                    variant={tableDensity === "comfortable" ? "secondary" : "ghost"}
                  >
                    Comfortable
                  </Button>
                  <Button
                    aria-pressed={tableDensity === "compact"}
                    onClick={() => setTableDensity("compact")}
                    size="sm"
                    variant={tableDensity === "compact" ? "secondary" : "ghost"}
                  >
                    Compact
                  </Button>
                </div>
                <DataToolbarMeta>
                  {visibleItems.length} of {items.length} seeded events visible
                </DataToolbarMeta>
              </DataToolbarGroup>
            </DataToolbar>

            {visibleItems.length === 0 ? (
              <CollectionEmptyState
                actions={
                  <Button onClick={resetFilters} variant="outline">
                    Reset search and filters
                  </Button>
                }
                className="admin-web__contract-empty"
                description="Audit surfaces should keep their dense table contract explicit even when no rows match the current filters."
                eyebrow="Current table state"
                highlights={collectionStateHighlights}
                title="No seeded events match the current table state"
              />
            ) : (
              <div className="admin-web__contract-table-surface">
                <Table density={tableDensity}>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>
                        <TableSortButton
                          direction={getSortDirectionFor("event")}
                          onClick={() => toggleSort("event")}
                        >
                          Event
                        </TableSortButton>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <TableSortButton
                          direction={getSortDirectionFor("scope")}
                          onClick={() => toggleSort("scope")}
                        >
                          Scope
                        </TableSortButton>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <TableSortButton
                          direction={getSortDirectionFor("severity")}
                          onClick={() => toggleSort("severity")}
                        >
                          Severity
                        </TableSortButton>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <TableSortButton
                          direction={getSortDirectionFor("actor")}
                          onClick={() => toggleSort("actor")}
                        >
                          Actor
                        </TableSortButton>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <TableSortButton
                          direction={getSortDirectionFor("source")}
                          onClick={() => toggleSort("source")}
                        >
                          Source
                        </TableSortButton>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <TableSortButton
                          direction={getSortDirectionFor("recorded")}
                          onClick={() => toggleSort("recorded")}
                        >
                          Recorded
                        </TableSortButton>
                      </TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {visibleItems.map((item) => (
                      <TableRow
                        className={`admin-web__contract-table-row${selectedItemId === item.id ? " admin-web__contract-table-row--active" : ""}`}
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <TableCell className="admin-web__contract-table-event-cell">
                          <TableMetaCell
                            caption={item.summary}
                            description={item.eventMeta}
                            title={item.eventTitle}
                          />
                        </TableCell>
                        <TableCell>
                          <TableMetaCell
                            description={getScopeMeta(item)}
                            title={item.scopeLabel}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge appearance="soft" variant={item.severityVariant}>
                            {item.severityLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TableMetaCell
                            description={getActorMeta(item)}
                            title={item.actorLabel}
                          />
                        </TableCell>
                        <TableCell>
                          <TableMetaCell
                            description={getSourceMeta(item)}
                            title={item.sourceLabel}
                          />
                        </TableCell>
                        <TableCell>
                          <TableMetaCell
                            description={`${item.severityLabel} signal`}
                            title={item.recordedAt}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <DetailPanel className="admin-web__contract-detail-zone">
          {selectedItem ? (
            <>
              <DetailPanelHeader>
                <div className="admin-web__contract-detail-title-group">
                  <p className="admin-web__contract-detail-eyebrow">{detailEyebrow}</p>
                  <DetailPanelTitle>{selectedItem.eventTitle}</DetailPanelTitle>
                  <DetailPanelDescription>{selectedItem.detailDescription}</DetailPanelDescription>
                </div>
                <Badge variant={selectedItem.severityVariant}>{selectedItem.severityLabel}</Badge>
                <DetailPanelMeta>{selectedItem.detailMeta}</DetailPanelMeta>
              </DetailPanelHeader>

              <DetailPanelBody>
                {selectedItem.detailSections.map((section) => (
                  <DetailPanelSection key={section.title}>
                    <DetailPanelSectionTitle>{section.title}</DetailPanelSectionTitle>
                    <ul className="admin-web__contract-detail-list">
                      {section.items.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  </DetailPanelSection>
                ))}
                {selectedItem.timelineGroups?.length ? (
                  <DetailPanelSection>
                    <DetailPanelSectionTitle>Timeline</DetailPanelSectionTitle>
                    <TimelineFeed groups={selectedItem.timelineGroups} />
                  </DetailPanelSection>
                ) : null}
              </DetailPanelBody>

              <DetailPanelFooter>
                <Button size="sm" variant="outline">
                  Open event trace
                </Button>
                <Button size="sm">Review retention</Button>
              </DetailPanelFooter>
            </>
          ) : (
            <DetailPanelBody>
              <CollectionEmptyState
                actions={
                  <Button onClick={resetFilters} variant="outline">
                    Reset contract state
                  </Button>
                }
                className="admin-web__contract-empty"
                description="The detail zone remains explicit even when the audit table has no active row."
                eyebrow="Detail state"
                highlights={detailStateHighlights}
                title="No audit event selected"
              />
            </DetailPanelBody>
          )}
        </DetailPanel>
      </div>
    </div>
  );
}
