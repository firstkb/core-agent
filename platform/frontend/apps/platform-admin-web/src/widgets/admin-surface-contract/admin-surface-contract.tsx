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
  TimelineFeed,
  type TimelineFeedGroup,
} from "@platform/ui-kit";

import { getAdminRoutePath } from "../../shared/navigation";

export type AdminSurfaceFilterGroup = {
  key: string;
  label: string;
  description?: string;
  options: ReadonlyArray<{
    label: string;
    value: string;
  }>;
};

export type AdminSurfaceListItem = {
  id: string;
  eyebrow: string;
  title: string;
  meta: string;
  summary: string;
  statusLabel: string;
  statusVariant: BadgeVariant;
  facets: Record<string, string>;
  detailDescription: string;
  detailMeta: string;
  detailSections: ReadonlyArray<{
    title: string;
    items: ReadonlyArray<string>;
  }>;
  timelineGroups?: ReadonlyArray<TimelineFeedGroup>;
};

type AdminSurfaceContractProps = {
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
  listTitle: string;
  listDescription: string;
  detailEyebrow: string;
  filterGroups: ReadonlyArray<AdminSurfaceFilterGroup>;
  items: ReadonlyArray<AdminSurfaceListItem>;
};

function matchesSearch(item: AdminSurfaceListItem, searchQuery: string) {
  if (!searchQuery) return true;

  const normalizedQuery = searchQuery.toLowerCase();
  const haystack = [item.eyebrow, item.title, item.meta, item.summary].join(" ").toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function AdminSurfaceContract({
  activeFilters: controlledActiveFilters,
  description,
  detailEyebrow,
  controlStrip,
  externalStateHighlights,
  filterGroups,
  items,
  eyebrow,
  listDescription,
  listTitle,
  onActiveFiltersChange,
  onResetExternalControls,
  onSearchQueryChange,
  railDescription,
  railTitle,
  searchQuery: controlledSearchQuery,
  sectionTabs,
  summaryStrip,
  toolbarControls,
  title,
}: AdminSurfaceContractProps) {
  const navigate = useNavigate();
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id ?? null);
  const [internalActiveFilters, setInternalActiveFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(filterGroups.map((group) => [group.key, group.options[0]?.value ?? "all"])),
  );

  const searchQuery = controlledSearchQuery ?? internalSearchQuery;
  const activeFilters = controlledActiveFilters ?? internalActiveFilters;
  const deferredSearchQuery = useDeferredValue(searchQuery);
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

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (!matchesSearch(item, deferredSearchQuery)) return false;

      return filterGroups.every((group) => {
        const activeValue = activeFilters[group.key];
        return activeValue === "all" || item.facets[group.key] === activeValue;
      });
    });
  }, [activeFilters, deferredSearchQuery, filterGroups, items]);

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
      id: "dataset",
      label: "Seeded items",
      value: String(items.length),
      tone: "brand",
    },
    ...(externalStateHighlights ?? []),
  ] as const;
  const detailStateHighlights = [
    {
      id: "visible",
      label: "Visible items",
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
      id: "search",
      label: "Search",
      value: searchQuery ? `"${searchQuery}"` : "No query",
      tone: searchQuery ? "brand" : "info",
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

        <Card className="admin-web__contract-list-zone">
          <CardHeader>
            <div>
              <CardTitle>{listTitle}</CardTitle>
              <CardDescription>{listDescription}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="admin-web__contract-list-content">
            <DataToolbar className="admin-web__contract-toolbar">
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
                  placeholder="Search seeded contract items..."
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
                <DataToolbarMeta>
                  {visibleItems.length} of {items.length} seeded items visible
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
                description="This keeps the list zone structurally present even when the current filter rail produces no results."
                eyebrow="Current list state"
                highlights={collectionStateHighlights}
                title="No seeded items match the current contract state"
              />
            ) : (
              <div className="admin-web__contract-list">
                {visibleItems.map((item) => (
                  <button
                    aria-pressed={selectedItemId === item.id}
                    className={`admin-web__contract-list-item${selectedItemId === item.id ? " admin-web__contract-list-item--active" : ""}`}
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    type="button"
                  >
                    <div className="admin-web__contract-list-item-header">
                      <div>
                        <p className="admin-web__contract-list-item-eyebrow">{item.eyebrow}</p>
                        <h3 className="admin-web__contract-list-item-title">{item.title}</h3>
                      </div>
                      <Badge appearance="soft" variant={item.statusVariant}>
                        {item.statusLabel}
                      </Badge>
                    </div>
                    <p className="admin-web__contract-list-item-meta">{item.meta}</p>
                    <p className="admin-web__contract-list-item-summary">{item.summary}</p>
                  </button>
                ))}
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
                  <DetailPanelTitle>{selectedItem.title}</DetailPanelTitle>
                  <DetailPanelDescription>{selectedItem.detailDescription}</DetailPanelDescription>
                </div>
                <Badge variant={selectedItem.statusVariant}>{selectedItem.statusLabel}</Badge>
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
                  Open contract notes
                </Button>
                <Button size="sm">Continue later</Button>
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
                description="The detail zone remains deliberate even when the list zone has no active item."
                eyebrow="Detail state"
                highlights={detailStateHighlights}
                title="No detail item selected"
              />
            </DetailPanelBody>
          )}
        </DetailPanel>
      </div>
    </div>
  );
}
