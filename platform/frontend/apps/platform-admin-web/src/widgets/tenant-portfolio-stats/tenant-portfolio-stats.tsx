import { Badge, StatCard } from "@platform/ui-kit";
import type { StatCardProps } from "@platform/ui-kit";
import type { TenantSummary } from "@platform/tenant-core";
import { summarizeTenantPortfolio } from "@platform/tenant-core";

type TenantPortfolioStatsProps = {
  tenants: TenantSummary[];
};

export function TenantPortfolioStats({ tenants }: TenantPortfolioStatsProps) {
  const summary = summarizeTenantPortfolio(tenants);
  const uniqueRegions = new Set(tenants.flatMap((tenant) => tenant.regions)).size;
  const pausedTenants = tenants.filter((tenant) => tenant.status === "paused").length;
  const rolloutRisks = tenants.filter((tenant) => tenant.status !== "active").length;

  const cards: StatCardProps[] = [
    {
      label: "Tenants",
      value: String(summary.totalTenants),
      trendLabel: String(summary.activeTenants),
      trendDirection: "up" as const,
      footer: `${summary.activeTenants} active production tenants in the control plane.`,
      badge: (
        <Badge appearance="soft" variant="brand">
          Portfolio
        </Badge>
      ),
    },
    {
      label: "Members",
      value: summary.totalMembers.toLocaleString(),
      trendLabel: String(summary.trialTenants),
      trendDirection: "neutral" as const,
      footer: `${summary.trialTenants} tenant teams are still onboarding or trialing.`,
      badge: (
        <Badge appearance="soft" variant="info">
          Access
        </Badge>
      ),
    },
    {
      label: "Regions",
      value: String(uniqueRegions),
      trendLabel: String(tenants.filter((tenant) => tenant.regions.length > 1).length),
      trendDirection: "up" as const,
      footer: "Cross-region coverage determines rollout and support complexity.",
      badge: (
        <Badge appearance="soft" variant="success">
          Footprint
        </Badge>
      ),
    },
    {
      label: "Risks",
      value: String(rolloutRisks),
      trendLabel: String(pausedTenants),
      trendDirection: pausedTenants > 0 ? "down" : "neutral",
      footer: pausedTenants > 0 ? `${pausedTenants} paused tenant requires intervention.` : "No paused tenants in the current sample set.",
      badge: (
        <Badge appearance="soft" variant={pausedTenants > 0 ? "warning" : "success"}>
          Ops
        </Badge>
      ),
    },
  ];

  return (
    <div className="admin-web__metric-grid">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          badge={card.badge}
          footer={card.footer}
          label={card.label}
          trendDirection={card.trendDirection}
          trendLabel={card.trendLabel}
          value={card.value}
        />
      ))}
    </div>
  );
}
