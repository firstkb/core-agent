import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@platform/ui-kit";
import { tenantStatusToBadgeVariant } from "@platform/tenant-core";
import type { TenantSummary } from "@platform/tenant-core";

type TenantActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantSummary | null;
};

function getActionCopy(tenant: TenantSummary) {
  if (tenant.status === "paused") {
    return {
      title: `Resume rollout for ${tenant.name}?`,
      description: "This confirms operational ownership before taking the tenant out of paused state.",
      confirmLabel: "Resume rollout",
      items: [
        "Reconnect the tenant to the rollout queue and mark the latest sync checkpoint.",
        "Notify the tenant owner that follow-up validation is required after resuming.",
        "Review tenant-specific overrides before allowing new release waves.",
      ],
    };
  }

  if (tenant.status === "trial") {
    return {
      title: `Promote ${tenant.name} to active?`,
      description: "Use this after onboarding, auth, and baseline data flow are all validated.",
      confirmLabel: "Promote tenant",
      items: [
        "Lock the current trial configuration as the initial production baseline.",
        "Enable the default rollout track and tenant operational alerts.",
        "Assign a named owner for the first 7-day monitoring window.",
      ],
    };
  }

  return {
    title: `Run maintenance check for ${tenant.name}?`,
    description: "This creates a lightweight operational checkpoint without changing the tenant's active status.",
    confirmLabel: "Run check",
    items: [
      "Validate last successful sync and release posture across assigned regions.",
      "Review the tenant's support pressure before scheduling changes.",
      "Record a fresh maintenance note for platform operations.",
    ],
  };
}

export function TenantActionDialog({
  open,
  onOpenChange,
  tenant,
}: TenantActionDialogProps) {
  if (!tenant) return null;

  const copy = getActionCopy(tenant);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <div className="admin-web__surface-header-copy">
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </div>
          <Badge appearance="soft" variant={tenantStatusToBadgeVariant(tenant.status)}>
            {tenant.status}
          </Badge>
        </DialogHeader>

        <DialogBody>
          <div className="admin-web__surface-summary-grid">
            <div className="admin-web__surface-summary-card">
              <span className="admin-web__surface-summary-label">Plan</span>
              <span className="admin-web__surface-summary-value">{tenant.plan}</span>
            </div>
            <div className="admin-web__surface-summary-card">
              <span className="admin-web__surface-summary-label">Members</span>
              <span className="admin-web__surface-summary-value">{tenant.members}</span>
            </div>
            <div className="admin-web__surface-summary-card">
              <span className="admin-web__surface-summary-label">Regions</span>
              <span className="admin-web__surface-summary-value">{tenant.regions.length}</span>
            </div>
            <div className="admin-web__surface-summary-card">
              <span className="admin-web__surface-summary-label">Last Sync</span>
              <span className="admin-web__surface-summary-value">{tenant.lastSyncLabel}</span>
            </div>
          </div>

          <div className="admin-web__surface-section">
            <h4 className="admin-web__surface-section-title">Action checklist</h4>
            <ul className="admin-web__surface-list">
              {copy.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>{copy.confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
