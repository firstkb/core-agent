import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@platform/ui-kit";
import { getDemoTenant } from "@platform/tenant-core";

const tenant = getDemoTenant("northwind");

export function WorkspaceStatusWidget() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Workspace status</CardTitle>
          <CardDescription>Tenant-scoped summary for support, onboarding, and release readiness.</CardDescription>
        </div>
        <Badge variant="brand">Tenant</Badge>
      </CardHeader>
      <CardContent>
        <div className="tenant-web__stack">
          <p className="tenant-web__metric-label">Current tenant</p>
          <p className="tenant-web__metric-value">{tenant.name}</p>
          <p className="tenant-web__metric-label">Regions: {tenant.regions.join(", ")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
