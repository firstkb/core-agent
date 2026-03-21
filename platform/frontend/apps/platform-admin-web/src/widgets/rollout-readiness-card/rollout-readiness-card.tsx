import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ProgressBar } from "@platform/ui-kit";
import type { TenantSummary } from "@platform/tenant-core";

type RolloutReadinessCardProps = {
  tenants: TenantSummary[];
};

type ReadinessItem = {
  label: string;
  value: number;
  tone: "success" | "warning" | "neutral";
};

function getReadinessScore(tenants: TenantSummary[]) {
  const weightedScore = tenants.reduce((sum, tenant) => {
    if (tenant.status === "active") return sum + 100;
    if (tenant.status === "trial") return sum + 60;
    return sum + 20;
  }, 0);

  return tenants.length === 0 ? 0 : Math.round(weightedScore / tenants.length);
}

export function RolloutReadinessCard({ tenants }: RolloutReadinessCardProps) {
  const activeTenants = tenants.filter((tenant) => tenant.status === "active").length;
  const trialTenants = tenants.filter((tenant) => tenant.status === "trial").length;
  const pausedTenants = tenants.filter((tenant) => tenant.status === "paused").length;
  const readinessScore = getReadinessScore(tenants);

  const items: ReadinessItem[] = [
    { label: "Active", value: activeTenants, tone: "success" },
    { label: "Trial", value: trialTenants, tone: "warning" },
    { label: "Paused", value: pausedTenants, tone: "neutral" },
  ];

  return (
    <Card className="admin-web__panel-card" variant="accent">
      <CardHeader>
        <div>
          <CardTitle>Rollout readiness</CardTitle>
          <CardDescription>Metronic-inspired operational summary rewritten for tenant activation and sync posture.</CardDescription>
        </div>
        <Badge appearance="soft" variant={readinessScore >= 75 ? "success" : readinessScore >= 50 ? "warning" : "danger"}>
          {readinessScore}% ready
        </Badge>
      </CardHeader>
      <CardContent className="admin-web__readiness-card">
        <div className="admin-web__readiness-header">
          <div>
            <p className="admin-web__readiness-label">Activation confidence</p>
            <p className="admin-web__readiness-value">{readinessScore}%</p>
          </div>
          <Button size="sm" variant="outline">
            Review onboarding
          </Button>
        </div>

        <ProgressBar tone={readinessScore >= 75 ? "success" : readinessScore >= 50 ? "warning" : "danger"} value={readinessScore} />

        <div className="admin-web__readiness-grid">
          {items.map((item) => (
            <div key={item.label} className="admin-web__readiness-item">
              <span className={`admin-web__readiness-item-value admin-web__readiness-item-value--${item.tone}`}>{item.value}</span>
              <span className="admin-web__readiness-item-label">{item.label}</span>
            </div>
          ))}
        </div>

        <p className="admin-web__readiness-footnote">
          Next milestone: reduce trial-to-active handoff time and clear paused tenants before enabling broader self-serve rollout.
        </p>
      </CardContent>
    </Card>
  );
}
