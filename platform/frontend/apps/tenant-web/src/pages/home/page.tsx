import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageToolbar } from "@platform/ui-kit";
import { getDemoTenant, getTenantMetrics } from "@platform/tenant-core";

import { offlineSyncStatus } from "../../offline/sync-status";
import { WorkspaceStatusWidget } from "../../widgets/workspace-status/workspace-status";

const tenant = getDemoTenant("northwind");
const metrics = getTenantMetrics(tenant);

export function HomePage() {
  return (
    <div className="tenant-web__stack">
      <PageToolbar
        eyebrow="Tenant"
        title={tenant.name}
        description="Tenant-facing workspace with app-specific offline capability kept inside the app boundary."
        actions={<Badge variant="success">Healthy</Badge>}
      />

      <div className="tenant-web__metric-grid">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle>{metric.label}</CardTitle>
              <Badge variant={metric.tone}>{metric.label}</Badge>
            </CardHeader>
            <CardContent>
              <p className="tenant-web__metric-value">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <WorkspaceStatusWidget />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Offline sync posture</CardTitle>
            <CardDescription>Early offline support stays in `tenant-web/src/offline`.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="tenant-web__metric-label">Queued actions</p>
          <p className="tenant-web__metric-value">{offlineSyncStatus.queuedActions}</p>
          <p className="tenant-web__metric-label">Last sync: {offlineSyncStatus.lastSyncLabel}</p>
        </CardContent>
      </Card>

      <EmptyState
        title="No shared inbox widgets yet"
        description="Feature-specific widgets should remain inside the tenant app until a second consumer appears."
      />
    </div>
  );
}
