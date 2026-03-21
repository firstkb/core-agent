import { Badge, Button, Checkbox, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@platform/ui-kit";
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

function getSortIndicator(
  currentField: TenantSortField,
  activeField: TenantSortField,
  direction: TenantSortDirection,
) {
  if (currentField !== activeField) return "-";
  return direction === "asc" ? "^" : "v";
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
    <button
      className="tenant-health-table__sort-button"
      onClick={() => onSort?.(field)}
      type="button"
    >
      <span>{children}</span>
      <span className="tenant-health-table__sort-indicator">
        {getSortIndicator(field, activeField, direction)}
      </span>
    </button>
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
              <div className="tenant-health-table__tenant-cell">
                <span className="tenant-health-table__tenant-name">{tenant.name}</span>
                <span className="tenant-health-table__tenant-slug">{tenant.slug}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={tenantStatusToBadgeVariant(tenant.status)}>{tenant.status}</Badge>
            </TableCell>
            <TableCell>{tenant.plan}</TableCell>
            <TableCell>{tenant.members}</TableCell>
            <TableCell>{tenant.lastSyncLabel}</TableCell>
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
