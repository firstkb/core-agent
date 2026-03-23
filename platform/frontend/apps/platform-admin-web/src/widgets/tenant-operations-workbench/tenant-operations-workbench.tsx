import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Button,
  EmptyState,
  FilterChip,
  Input,
  SummaryPillStrip,
  TableColumnVisibility,
  type TableColumnVisibilityItem,
  ToolbarNotice,
} from "@platform/ui-kit";
import type { TenantPlan, TenantStatus, TenantSummary } from "@platform/tenant-core";

import { useMediaQuery } from "../../shared/use-media-query";
import { readEnumSearchParam, setSearchParamsBatch } from "../../shared/search-params";
import {
  TenantHealthTable,
  tenantHealthTableColumnOrder,
  type TenantHealthTableColumnId,
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
type BulkActionNotice = {
  title: string;
  tone: "info" | "success";
};

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
const tenantSortFields = ["name", "status", "plan", "members", "lastSync"] as const;
const tenantSortDirections = ["asc", "desc"] as const;

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
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isConfigSheetOpen, setIsConfigSheetOpen] = useState(false);
  const [bulkActionMessage, setBulkActionMessage] = useState<BulkActionNotice | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<TenantHealthTableColumnId[]>([
    ...tenantHealthTableColumnOrder,
  ]);

  const searchQuery = searchParams.get("q") ?? "";
  const statusFilter = readEnumSearchParam(searchParams, "status", statusFilters, "all");
  const planFilter = readEnumSearchParam(searchParams, "plan", planFilters, "all");
  const sortField = readEnumSearchParam<TenantSortField>(searchParams, "sort", tenantSortFields, "name");
  const sortDirection = readEnumSearchParam<TenantSortDirection>(
    searchParams,
    "dir",
    tenantSortDirections,
    "asc",
  );
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
  const tenantSummaryItems = [
    { id: "active", label: "Active", tone: "success", value: visibleStatusSummary.active },
    { id: "trial", label: "Trial", tone: "warning", value: visibleStatusSummary.trial },
    { id: "paused", label: "Paused", tone: "neutral", value: visibleStatusSummary.paused },
    { id: "selected", label: "Selected", tone: "brand", value: selectedTenantIds.length },
  ] as const;
  const columnVisibilityItems = useMemo<TableColumnVisibilityItem[]>(() => {
    return [
      {
        checked: visibleColumns.includes("name"),
        count: "Required",
        disabled: true,
        id: "name",
        label: "Tenant",
      },
      {
        checked: visibleColumns.includes("status"),
        count: `${new Set(tenants.map((tenant) => tenant.status)).size} states`,
        id: "status",
        label: "Status",
      },
      {
        checked: visibleColumns.includes("plan"),
        count: `${new Set(tenants.map((tenant) => tenant.plan)).size} tiers`,
        id: "plan",
        label: "Plan",
      },
      {
        checked: visibleColumns.includes("members"),
        count: "Optional",
        id: "members",
        label: "Members",
      },
      {
        checked: visibleColumns.includes("lastSync"),
        count: "Optional",
        id: "lastSync",
        label: "Last sync",
      },
    ];
  }, [tenants, visibleColumns]);

  function handleColumnVisibilityChange(columnId: string, checked: boolean) {
    const typedColumnId = columnId as TenantHealthTableColumnId;

    setVisibleColumns((currentColumns) =>
      checked
        ? tenantHealthTableColumnOrder.filter(
            (column) => column === typedColumnId || currentColumns.includes(column),
          )
        : currentColumns.filter((column) => column !== typedColumnId),
    );
    setBulkActionMessage(null);
  }

  function resetFilters() {
    setSearchParams(
      setSearchParamsBatch(searchParams, [
        ["q", null],
        ["status", null],
        ["plan", null],
        ["sort", null],
        ["dir", null],
      ]),
      { replace: true },
    );
    setBulkActionMessage(null);
  }

  function handleSort(field: TenantSortField) {
    const nextDirection =
      field === sortField
        ? sortDirection === "asc"
          ? "desc"
          : "asc"
        : field === "members" || field === "lastSync"
          ? "desc"
          : "asc";

    setSearchParams(
      setSearchParamsBatch(searchParams, [
        ["sort", field === "name" && nextDirection === "asc" ? null : field],
        ["dir", field === "name" && nextDirection === "asc" ? null : nextDirection],
      ]),
      { replace: true },
    );
    setBulkActionMessage(null);
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
      setBulkActionMessage({
        title: `Queued review for ${selectedTenantIds.length} selected tenants.`,
        tone: "info",
      });
      return;
    }

    setBulkActionMessage({
      title: `Prepared export bundle for ${selectedTenantIds.length} selected tenants.`,
      tone: "success",
    });
  }

  return (
    <div className="admin-web__tenant-workbench">
      <div className="admin-web__toolbar admin-web__tenant-toolbar">
        <div className="admin-web__toolbar-group">
          <Input
            className="admin-web__tenant-search"
            onChange={(event) => {
              setSearchParams(setSearchParamsBatch(searchParams, [["q", event.target.value || null]]), {
                replace: true,
              });
              setBulkActionMessage(null);
            }}
            placeholder="Search tenant, slug, region, plan..."
            value={searchQuery}
          />
          {searchQuery ? (
            <Button
              onClick={() => {
                setSearchParams(setSearchParamsBatch(searchParams, [["q", null]]), { replace: true });
                setBulkActionMessage(null);
              }}
              size="sm"
              variant="ghost"
            >
              Clear
            </Button>
          ) : null}
        </div>

        <div className="admin-web__toolbar-group admin-web__toolbar-group--end">
          <p className="admin-web__toolbar-meta">
            {visibleTenants.length} of {tenants.length} tenants visible
          </p>
          <Button onClick={resetFilters} size="sm" variant="outline">
            Reset filters
          </Button>
        </div>
      </div>

      <div className="admin-web__tenant-filter-groups">
        <div className="admin-web__tenant-filter-group">
          <span className="admin-web__tenant-filter-label">Status</span>
          <div className="admin-web__tenant-filter-row">
            {statusFilters.map((filter) => (
              <FilterChip
                active={statusFilter === filter}
                count={getFilterCount(tenants, "status", filter)}
                key={filter}
                onClick={() => {
                  setSearchParams(
                    setSearchParamsBatch(searchParams, [["status", filter === "all" ? null : filter]]),
                    { replace: true },
                  );
                  setBulkActionMessage(null);
                }}
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
                onClick={() => {
                  setSearchParams(
                    setSearchParamsBatch(searchParams, [["plan", filter === "all" ? null : filter]]),
                    { replace: true },
                  );
                  setBulkActionMessage(null);
                }}
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
              <SummaryPillStrip items={tenantSummaryItems} />

              <div className="admin-web__toolbar admin-web__tenant-bulk-toolbar">
                <div className="admin-web__toolbar-group">
                  <p className="admin-web__toolbar-meta">
                    Sorted by {sortField} ({sortDirection})
                  </p>
                  {bulkActionMessage ? (
                    <ToolbarNotice title={bulkActionMessage.title} tone={bulkActionMessage.tone} />
                  ) : null}
                </div>

                <div className="admin-web__toolbar-group admin-web__toolbar-group--end">
                  <TableColumnVisibility
                    columns={columnVisibilityItems}
                    label="Visible tenant columns"
                    onColumnChange={handleColumnVisibilityChange}
                    triggerLabel="Columns"
                  />
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
                </div>
              </div>
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
              visibleColumns={visibleColumns}
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
