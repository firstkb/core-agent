import { ActivityFeed } from "@platform/ui-kit";
import type { ActivityFeedItem, ActivityFeedTone } from "@platform/ui-kit";
import type { TenantSummary } from "@platform/tenant-core";

type TenantActivityFeedProps = {
  tenants: TenantSummary[];
};

function getTenantActivityItem(tenant: TenantSummary): ActivityFeedItem {
  let tone: ActivityFeedTone = "neutral";
  let title = `${tenant.name} updated`;
  let description = `${tenant.members} members across ${tenant.regions.length} region${tenant.regions.length === 1 ? "" : "s"}.`;

  if (tenant.status === "active") {
    tone = "success";
    title = `${tenant.name} sync healthy`;
    description = `${tenant.plan} tenant is operating normally with recent sync activity across ${tenant.regions.join(", ")}.`;
  } else if (tenant.status === "trial") {
    tone = "warning";
    title = `${tenant.name} onboarding in progress`;
    description = `Trial tenant is still validating auth, data flow, and regional setup in ${tenant.regions.join(", ")}.`;
  } else if (tenant.status === "paused") {
    tone = "danger";
    title = `${tenant.name} requires intervention`;
    description = "Tenant is paused and should be reviewed before the next rollout or support wave.";
  }

  return {
    id: tenant.id,
    title,
    description,
    meta: tenant.lastSyncLabel,
    tone,
  };
}

export function TenantActivityFeed({ tenants }: TenantActivityFeedProps) {
  return (
    <ActivityFeed
      description="Recent tenant signals derived from the current seeded control-plane sample."
      items={tenants.map(getTenantActivityItem)}
      title="Operational activity"
    />
  );
}
