import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Button,
  DataToolbar,
  DataToolbarGroup,
  DataToolbarMeta,
  EmptyState,
  FilterChip,
  Input,
} from "@platform/ui-kit";
import type { TenantPlan, TenantStatus, TenantSummary } from "@platform/tenant-core";

import { useMediaQuery } from "../../shared/use-media-query";
import {
  TenantHealthTable,
  type TenantSortDirection,
  type TenantSortField,
} from "../tenant-health-table/tenant-health-table";
import { TenantActionDialog } from "../tenant-action-dialog/tenant-action-dialog";
import { TenantConfigSheet } from "../tenant-config-sheet/tenant-config-sheet";
import { TenantDetailSurface } from "../tenant-detail-surface/tenant-detail-surface";

type TenantOperationsWorkbenchProps = {
  tenants: TenantSummary[];
};

type TenantFilterValue<T extends string> = "all" | T;

const statusFilters: Array<TenantFilterValue<TenantStatus>> = ["all", "active", "trial", "paused"];
const planFilters: Array<TenantFilterValue<TenantPlan>> = ["all", "Starter", "Growth", "Enterprise"];
const compactTenantDetailQuery = "(max-width: 960px)";
const tenantStatusSortOrder: Record<TenantStatus, number> = {
  active: 0,
  trial: 1,
  paused: 2,
};
const tenantPlanSortOrder: Record<TenantPlan, number> = {
  Enterprise: 0,
  Growth: 1,
  Starter: 2,
};

function matchesSearch(tenant: TenantSummary, searchQuery: string) {
  if (!searchQuery) return true;

  const normalizedQuery = searchQuery.toLowerCase();
  const haystack = [
    tenant.name,
    tenant.slug,
    tenant.plan,
    tenant.status,
    tenant.lastSyncLabel,
    ...tenant.regions,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getFilterCount<T extends string>(
  tenants: TenantSummary[],
  field: "status" | "plan",
  filter: TenantFilterValue<T>,
) {
  if (filter === "all") return tenants.length;
  return tenants.filter((tenant) => tenant[field] === filter).length;
}

function parseLastSyncLabel(lastSyncLabel: string) {
  const normalizedLabel = lastSyncLabel.toLowerCase();
  const amount = Number.parseInt(normalizedLabel, 10);

  if (Number.isNaN(amount)) return Number.MAX_SAFE_INTEGER;
  if (normalizedLabel.includes("minute")) return amount;
  if (normalizedLabel.includes("hour")) return amount * 60;
  if (normalizedLabel.includes("day")) return amount * 60 * 24;
  return amount;
}

function compareValues(left: number | string, right: number | string) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

function sortTenants(
  tenants: TenantSummary[],
  field: TenantSortField,
  direction: TenantSortDirection,
) {
  const directionFactor = direction === "asc" ? 1 : -1;

  return [...tenants].sort((leftTenant, rightTenant) => {
    let comparison = 0;

    switch (field) {
      case "name":
        comparison = compareValues(leftTenant.name, rightTenant.name);
        break;
      case "status":
        comparison = compareValues(
          tenantStatusSortOrder[leftTenant.status],
          tenantStatusSortOrder[rightTenant.status],
        );
        break;
      case "plan":
        comparison = compareValues(
          tenantPlanSortOrder[leftTenant.plan],
          tenantPlanSortOrder[rightTenant.plan],
        );
        break;
      case "members":
        comparison = compareValues(leftTenant.members, rightTenant.members);
        break;
      case "lastSync":
        comparison = compareValues(
          parseLastSyncLabel(leftTenant.lastSyncLabel),
          parseLastSyncLabel(rightTenant.lastSyncLabel),
        );
        break;
      default:
        comparison = 0;
    }

    return comparison * directionFactor;
  });
}

export function TenantOperationsWorkbench({ tenants }: TenantOperationsWorkbenchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantFilterValue<TenantStatus>>("all");
  const [planFilter, setPlanFilter] = useState<TenantFilterValue<TenantPlan>>("all");
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<TenantSortField>("name");
  const [sortDirection, setSortDirection] = useState<TenantSortDirection>("asc");
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isConfigSheetOpen, setIsConfigSheetOpen] = useState(false);
  const [bulkActionMessage, setBulkActionMessage] = useState<string | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isCompactTenantDetail = useMediaQuery(compactTenantDetailQuery);
  const selectedTenantId = searchParams.get("tenant");

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      if (statusFilter !== "all" && tenant.status !== statusFilter) return false;
      if (planFilter !== "all" && tenant.plan !== planFilter) return false;
      return matchesSearch(tenant, deferredSearchQuery);
    });
  }, [deferredSearchQuery, planFilter, statusFilter, tenants]);

  const visibleTenants = useMemo(
    () => sortTenants(filteredTenants, sortField, sortDirection),
    [filteredTenants, sortDirection, sortField],
  );

  useEffect(() => {
    if (visibleTenants.length === 0) {
      if (!selectedTenantId) return;

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete("tenant");
      setSearchParams(nextSearchParams, { replace: true });
      return;
    }

    if (selectedTenantId && visibleTenants.some((tenant) => tenant.id === selectedTenantId)) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);

    if (isCompactTenantDetail) {
      nextSearchParams.delete("tenant");
    } else {
      nextSearchParams.set("tenant", visibleTenants[0].id);
    }

    setSearchParams(nextSearchParams, { replace: true });
  }, [isCompactTenantDetail, searchParams, selectedTenantId, setSearchParams, visibleTenants]);

  useEffect(() => {
    const visibleTenantIds = new Set(visibleTenants.map((tenant) => tenant.id));

    setSelectedTenantIds((currentSelection) => {
      const nextSelection = currentSelection.filter((tenantId) => visibleTenantIds.has(tenantId));

      return nextSelection.length === currentSelection.length ? currentSelection : nextSelection;
    });
  }, [visibleTenants]);

  const selectedTenant = visibleTenants.find((tenant) => tenant.id === selectedTenantId) ?? null;
  const selectedTenants = visibleTenants.filter((tenant) => selectedTenantIds.includes(tenant.id));
  const allVisibleSelected = visibleTenants.length > 0 && visibleTenants.every((tenant) => selectedTenantIds.includes(tenant.id));
  const partiallyVisibleSelected = selectedTenantIds.length > 0 && !allVisibleSelected;
  const visibleStatusSummary = {
    active: visibleTenants.filter((tenant) => tenant.status === "active").length,
    trial: visibleTenants.filter((tenant) => tenant.status === "trial").length,
    paused: visibleTenants.filter((tenant) => tenant.status === "paused").length,
  };

  function resetFilters() {
    startTransition(() => {
      setSearchQuery("");
      setStatusFilter("all");
      setPlanFilter("all");
      setBulkActionMessage(null);
    });
  }

  function handleSort(field: TenantSortField) {
    startTransition(() => {
      setBulkActionMessage(null);

      if (field === sortField) {
        setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
        return;
      }

      setSortField(field);
      setSortDirection(field === "members" || field === "lastSync" ? "desc" : "asc");
    });
  }

  function handleSelectTenant(tenantId: string) {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("tenant", tenantId);
    setSearchParams(nextSearchParams, { replace: true });
    setBulkActionMessage(null);
  }

  function handleCloseTenantDetail() {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("tenant");
    setSearchParams(nextSearchParams, { replace: true });
  }

  function handleToggleTenant(tenantId: string, checked: boolean) {
    setSelectedTenantIds((currentSelection) => {
      if (checked) {
        if (currentSelection.includes(tenantId)) return currentSelection;
        return [...currentSelection, tenantId];
      }

      return currentSelection.filter((currentTenantId) => currentTenantId !== tenantId);
    });

    setBulkActionMessage(null);
  }

  function handleToggleAllVisible(checked: boolean) {
    setSelectedTenantIds(checked ? visibleTenants.map((tenant) => tenant.id) : []);
    setBulkActionMessage(null);
  }

  function runBulkAction(action: "queue_review" | "export_selection") {
    if (selectedTenantIds.length === 0) return;

    if (action === "queue_review") {
      setBulkActionMessage(`Queued review for ${selectedTenantIds.length} selected tenants.`);
      return;
    }

    setBulkActionMessage(`Prepared export bundle for ${selectedTenantIds.length} selected tenants.`);
  }

  return (
    <div className="admin-web__tenant-workbench">
      <DataToolbar className="admin-web__tenant-toolbar">
        <DataToolbarGroup>
          <Input
            className="admin-web__tenant-search"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tenant, slug, region, plan..."
            value={searchQuery}
          />
          {searchQuery ? (
            <Button onClick={() => setSearchQuery("")} size="sm" variant="ghost">
              Clear
            </Button>
          ) : null}
        </DataToolbarGroup>

        <DataToolbarGroup align="end">
          <DataToolbarMeta>
            {visibleTenants.length} of {tenants.length} tenants visible
          </DataToolbarMeta>
          <Button onClick={resetFilters} size="sm" variant="outline">
            Reset filters
          </Button>
        </DataToolbarGroup>
      </DataToolbar>

      <div className="admin-web__tenant-filter-groups">
        <div className="admin-web__tenant-filter-group">
          <span className="admin-web__tenant-filter-label">Status</span>
          <div className="admin-web__tenant-filter-row">
            {statusFilters.map((filter) => (
              <FilterChip
                active={statusFilter === filter}
                count={getFilterCount(tenants, "status", filter)}
                key={filter}
                onClick={() =>
                  startTransition(() => {
                    setStatusFilter(filter);
                  })
                }
              >
                {filter === "all" ? "All statuses" : filter}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="admin-web__tenant-filter-group">
          <span className="admin-web__tenant-filter-label">Plan</span>
          <div className="admin-web__tenant-filter-row">
            {planFilters.map((filter) => (
              <FilterChip
                active={planFilter === filter}
                count={getFilterCount(tenants, "plan", filter)}
                key={filter}
                onClick={() =>
                  startTransition(() => {
                    setPlanFilter(filter);
                  })
                }
              >
                {filter === "all" ? "All plans" : filter}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {visibleTenants.length === 0 ? (
        <EmptyState
          actions={
            <Button onClick={resetFilters} variant="outline">
              Reset tenant filters
            </Button>
          }
          description="No tenant matches the current search and filter combination."
          title="No tenants found"
        />
      ) : (
        <div className="admin-web__tenant-workbench-grid">
          <div className="admin-web__tenant-table-surface">
            <div className="admin-web__tenant-table-toolbar">
              <div className="admin-web__tenant-summary-row">
                <div className="admin-web__tenant-summary-pill admin-web__tenant-summary-pill--success">
                  <span className="admin-web__tenant-summary-pill-label">Active</span>
                  <span className="admin-web__tenant-summary-pill-value">{visibleStatusSummary.active}</span>
                </div>
                <div className="admin-web__tenant-summary-pill admin-web__tenant-summary-pill--warning">
                  <span className="admin-web__tenant-summary-pill-label">Trial</span>
                  <span className="admin-web__tenant-summary-pill-value">{visibleStatusSummary.trial}</span>
                </div>
                <div className="admin-web__tenant-summary-pill admin-web__tenant-summary-pill--neutral">
                  <span className="admin-web__tenant-summary-pill-label">Paused</span>
                  <span className="admin-web__tenant-summary-pill-value">{visibleStatusSummary.paused}</span>
                </div>
                <div className="admin-web__tenant-summary-pill admin-web__tenant-summary-pill--brand">
                  <span className="admin-web__tenant-summary-pill-label">Selected</span>
                  <span className="admin-web__tenant-summary-pill-value">{selectedTenantIds.length}</span>
                </div>
              </div>

              <DataToolbar className="admin-web__tenant-bulk-toolbar">
                <DataToolbarGroup>
                  <DataToolbarMeta>
                    Sorted by {sortField} ({sortDirection})
                  </DataToolbarMeta>
                  {bulkActionMessage ? (
                    <p className="admin-web__tenant-bulk-message">{bulkActionMessage}</p>
                  ) : null}
                </DataToolbarGroup>

                <DataToolbarGroup align="end">
                  <Button
                    disabled={selectedTenantIds.length === 0}
                    onClick={() => runBulkAction("queue_review")}
                    size="sm"
                    variant="outline"
                  >
                    Queue review
                  </Button>
                  <Button
                    disabled={selectedTenantIds.length === 0}
                    onClick={() => runBulkAction("export_selection")}
                    size="sm"
                    variant="secondary"
                  >
                    Export selected
                  </Button>
                  {selectedTenantIds.length > 0 ? (
                    <Button
                      onClick={() => {
                        setSelectedTenantIds([]);
                        setBulkActionMessage(null);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Clear selection
                    </Button>
                  ) : null}
                </DataToolbarGroup>
              </DataToolbar>
            </div>

            <TenantHealthTable
              allVisibleSelected={allVisibleSelected}
              onSort={handleSort}
              onSelectTenant={handleSelectTenant}
              onToggleAllVisible={handleToggleAllVisible}
              onToggleTenant={handleToggleTenant}
              partiallyVisibleSelected={partiallyVisibleSelected}
              selectedTenantId={selectedTenantId}
              selectedTenantIds={selectedTenantIds}
              sortDirection={sortDirection}
              sortField={sortField}
              tenants={visibleTenants}
            />
          </div>

          {!isCompactTenantDetail && selectedTenant ? (
            <TenantDetailSurface
              mode="panel"
              onOpenAction={() => setIsActionDialogOpen(true)}
              onOpenConfig={() => setIsConfigSheetOpen(true)}
              selectedTenantsCount={selectedTenants.length}
              tenant={selectedTenant}
            />
          ) : null}
        </div>
      )}

      {isCompactTenantDetail && selectedTenant ? (
        <TenantDetailSurface
          mode="sheet"
          onOpenAction={() => setIsActionDialogOpen(true)}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseTenantDetail();
            }
          }}
          onOpenConfig={() => setIsConfigSheetOpen(true)}
          open={Boolean(selectedTenant)}
          selectedTenantsCount={selectedTenants.length}
          tenant={selectedTenant}
        />
      ) : null}

      <TenantActionDialog
        onOpenChange={setIsActionDialogOpen}
        open={isActionDialogOpen}
        tenant={selectedTenant}
      />

      <TenantConfigSheet
        onOpenChange={setIsConfigSheetOpen}
        open={isConfigSheetOpen}
        tenant={selectedTenant}
      />
    </div>
  );
}
