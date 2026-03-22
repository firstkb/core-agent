import {
  Badge,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableMetaCell,
  TableRow,
  TableSortButton,
} from "@platform/ui-kit";
import type { TenantSummary } from "@platform/tenant-core";
import { tenantStatusToBadgeVariant } from "@platform/tenant-core";

export type TenantSortField = "name" | "status" | "plan" | "members" | "lastSync";
export type TenantSortDirection = "asc" | "desc";

type TenantHealthTableProps = {
  tenants: TenantSummary[];
  selectedTenantId?: string | null;
  selectedTenantIds: string[];
  allVisibleSelected: boolean;
  partiallyVisibleSelected: boolean;
  sortField: TenantSortField;
  sortDirection: TenantSortDirection;
  onSelectTenant?: (tenantId: string) => void;
  onToggleTenant?: (tenantId: string, checked: boolean) => void;
  onToggleAllVisible?: (checked: boolean) => void;
  onSort?: (field: TenantSortField) => void;
};

function getRegionMeta(tenant: TenantSummary) {
  const regionCount = tenant.regions.length;
  const countLabel = `${regionCount} region${regionCount === 1 ? "" : "s"}`;
  const regionsLabel = tenant.regions.join(" · ");

  return {
    countLabel,
    regionsLabel,
  };
}

function getMembersMeta(tenant: TenantSummary) {
  return `${tenant.members} workspace member${tenant.members === 1 ? "" : "s"}`;
}

function getSyncMeta(tenant: TenantSummary) {
  if (tenant.status === "paused") return "sync paused until tenant resumes";
  if (tenant.status === "trial") return "trial posture under observation";
  return "control-plane sync healthy";
}

function SortHeaderButton({
  activeField,
  children,
  direction,
  field,
  onSort,
}: {
  activeField: TenantSortField;
  children: string;
  direction: TenantSortDirection;
  field: TenantSortField;
  onSort?: (field: TenantSortField) => void;
}) {
  return (
    <TableSortButton
      direction={field === activeField ? direction : null}
      onClick={() => onSort?.(field)}
    >
      {children}
    </TableSortButton>
  );
}

export function TenantHealthTable({
  tenants,
  selectedTenantId,
  selectedTenantIds,
  allVisibleSelected,
  partiallyVisibleSelected,
  sortField,
  sortDirection,
  onSelectTenant,
  onToggleTenant,
  onToggleAllVisible,
  onSort,
}: TenantHealthTableProps) {
  return (
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell className="tenant-health-table__cell--selection">
            <Checkbox
              aria-label="Select all visible tenants"
              checked={allVisibleSelected}
              indeterminate={partiallyVisibleSelected}
              onChange={(event) => onToggleAllVisible?.(event.target.checked)}
              onClick={(event) => event.stopPropagation()}
            />
          </TableHeaderCell>
          <TableHeaderCell>
            <SortHeaderButton
              activeField={sortField}
              direction={sortDirection}
              field="name"
              onSort={onSort}
            >
              Tenant
            </SortHeaderButton>
          </TableHeaderCell>
          <TableHeaderCell>
            <SortHeaderButton
              activeField={sortField}
              direction={sortDirection}
              field="status"
              onSort={onSort}
            >
              Status
            </SortHeaderButton>
          </TableHeaderCell>
          <TableHeaderCell>
            <SortHeaderButton
              activeField={sortField}
              direction={sortDirection}
              field="plan"
              onSort={onSort}
            >
              Plan
            </SortHeaderButton>
          </TableHeaderCell>
          <TableHeaderCell>
            <SortHeaderButton
              activeField={sortField}
              direction={sortDirection}
              field="members"
              onSort={onSort}
            >
              Members
            </SortHeaderButton>
          </TableHeaderCell>
          <TableHeaderCell>
            <SortHeaderButton
              activeField={sortField}
              direction={sortDirection}
              field="lastSync"
              onSort={onSort}
            >
              Last Sync
            </SortHeaderButton>
          </TableHeaderCell>
          <TableHeaderCell className="tenant-health-table__cell--action">Action</TableHeaderCell>
        </tr>
      </TableHead>
      <TableBody>
        {tenants.map((tenant) => (
          <TableRow
            className={[
              "tenant-health-table__row",
              tenant.id === selectedTenantId ? "tenant-health-table__row--selected" : "",
              selectedTenantIds.includes(tenant.id) ? "tenant-health-table__row--checked" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={tenant.id}
            onClick={() => onSelectTenant?.(tenant.id)}
          >
            <TableCell className="tenant-health-table__cell--selection">
              <Checkbox
                aria-label={`Select ${tenant.name}`}
                checked={selectedTenantIds.includes(tenant.id)}
                onChange={(event) => onToggleTenant?.(tenant.id, event.target.checked)}
                onClick={(event) => event.stopPropagation()}
              />
            </TableCell>
            <TableCell>
              <TableMetaCell
                caption={getRegionMeta(tenant).regionsLabel}
                description={tenant.slug}
                title={tenant.name}
              />
            </TableCell>
            <TableCell>
              <Badge variant={tenantStatusToBadgeVariant(tenant.status)}>{tenant.status}</Badge>
            </TableCell>
            <TableCell>
              <TableMetaCell
                description={getRegionMeta(tenant).countLabel}
                title={tenant.plan}
              />
            </TableCell>
            <TableCell>
              <TableMetaCell
                description={getMembersMeta(tenant)}
                title={String(tenant.members)}
              />
            </TableCell>
            <TableCell>
              <TableMetaCell
                description={getSyncMeta(tenant)}
                title={tenant.lastSyncLabel}
              />
            </TableCell>
            <TableCell className="tenant-health-table__cell--action">
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectTenant?.(tenant.id);
                }}
                size="sm"
                variant={tenant.id === selectedTenantId ? "secondary" : "outline"}
              >
                Inspect
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
