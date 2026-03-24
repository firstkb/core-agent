import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CollectionLoadingState,
  LoadingState,
  Skeleton,
  SkeletonText,
  TableLoadingState,
} from "@platform/ui-kit";
import {
  getDemoTenant,
  getTenantMetrics,
  tenantStatusToBadgeVariant,
} from "@platform/tenant-core";

import { offlineSyncStatus } from "../../offline/sync-status";

type DashboardMetricCard = {
  badge: string;
  id: string;
  label: string;
  tone: "brand" | "success" | "warning" | "neutral";
  widths: string[];
};

const tenant = getDemoTenant("northwind");
const metrics = getTenantMetrics(tenant);

const tenantDashboardSectionIds = {
  activity: "tenant-dashboard-activity",
  modules: "tenant-dashboard-modules",
  queue: "tenant-dashboard-sync-queue",
} as const;

const dashboardMetricCards: DashboardMetricCard[] = metrics.map((metric, index) => ({
  badge: metric.value,
  id: metric.label.toLowerCase().replace(/\s+/g, "-"),
  label: metric.label,
  tone: metric.tone,
  widths:
    index === 0
      ? ["74%", "58%", "42%"]
      : index === 1
        ? ["70%", "64%", "44%"]
        : index === 2
          ? ["78%", "54%", "36%"]
          : ["66%", "60%", "40%"],
}));

const queueMockRows = [
  {
    id: "member-invite",
    textWidths: ["14rem", "10rem"],
    titleWidth: "9rem",
  },
  {
    id: "sync-hydration",
    textWidths: ["16rem", "12rem"],
    titleWidth: "11rem",
  },
  {
    id: "workspace-permissions",
    textWidths: ["15rem", "10rem"],
    titleWidth: "10rem",
  },
  {
    id: "billing-handoff",
    textWidths: ["13rem", "11rem"],
    titleWidth: "8rem",
  },
];

function renderMetricCard(card: DashboardMetricCard) {
  return (
    <Card className="tenant-web__dashboard-metric-card" key={card.id}>
      <CardHeader>
        <div className="tenant-web__dashboard-metric-card-header">
          <div>
            <CardTitle>{card.label}</CardTitle>
            <CardDescription>
              Tenant dashboard keeps shared loading grammar visible while real modules are still being wired.
            </CardDescription>
          </div>
          <Badge appearance="soft" size="sm" variant={card.tone}>
            {card.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="tenant-web__dashboard-metric-card-body">
        <div className="tenant-web__dashboard-metric-value">
          <Skeleton height="2.5rem" width="7rem" />
          <Skeleton height="1.9rem" width="4.75rem" />
        </div>
        <SkeletonText lines={3} widths={card.widths} />
        <div className="tenant-web__dashboard-metric-meta">
          <Skeleton height="0.875rem" variant="text" width="38%" />
          <Skeleton height="0.875rem" variant="text" width="26%" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TenantDashboardPage() {
  return (
    <div className="tenant-web__dashboard-shell">
      <section className="tenant-web__dashboard-hero">
        <div className="tenant-web__dashboard-hero-tags">
          <Badge size="sm" variant="brand">Dashboard</Badge>
          <Badge appearance="soft" size="sm" variant={tenantStatusToBadgeVariant(tenant.status)}>
            {tenant.status}
          </Badge>
          <Badge appearance="outline" size="sm" variant="neutral">
            {tenant.plan} tenant
          </Badge>
          <Badge appearance="soft" size="sm" variant="info">
            {offlineSyncStatus.queuedActions} queued sync actions
          </Badge>
        </div>

        <div className="tenant-web__dashboard-hero-copy">
          <h2 className="tenant-web__dashboard-hero-title">Loading-first tenant workspace canvas</h2>
          <p className="tenant-web__dashboard-hero-description">
            Tenant app is now reduced to a single dashboard route. The surface uses shared skeleton and loading-state
            primitives so we can move into real tenant screens without reopening shell work.
          </p>
        </div>
      </section>

      <section className="tenant-web__dashboard-metric-grid">
        {dashboardMetricCards.map((card) => renderMetricCard(card))}
      </section>

      <section
        className="tenant-web__dashboard-section-grid tenant-web__dashboard-section-grid--lead"
        id={tenantDashboardSectionIds.modules}
      >
        <Card className="tenant-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Workspace modules</CardTitle>
              <CardDescription>
                The first block keeps a wide collection placeholder in view while the tenant shell settles into real
                dashboard sections.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CollectionLoadingState
              className="tenant-web__dashboard-pattern"
              description="Preparing workspace modules, summary cards, and member-facing sections."
              items={4}
              layout="grid"
              title={`Hydrating ${tenant.name}`}
            />
          </CardContent>
        </Card>

        <Card className="tenant-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Route loading</CardTitle>
              <CardDescription>
                A smaller route-level state stays visible beside the richer dashboard canvas for basic tenant screens.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <LoadingState
              className="tenant-web__dashboard-loading-state"
              description="Preparing workspace context, member permissions, and tenant-scoped controls."
              title="Loading workspace context"
            />
          </CardContent>
        </Card>
      </section>

      <section
        className="tenant-web__dashboard-section-grid"
        id={tenantDashboardSectionIds.activity}
      >
        <Card className="tenant-web__dashboard-card tenant-web__dashboard-card--tall">
          <CardHeader>
            <div>
              <CardTitle>Activity table placeholder</CardTitle>
              <CardDescription>
                The denser tenant surface keeps table rhythm visible for future member activity and sync history.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TableLoadingState
              className="tenant-web__dashboard-pattern"
              columns={5}
              description="Preparing tenant activity table, quick filters, and row-level actions."
              rows={6}
              title="Loading activity stream"
            />
          </CardContent>
        </Card>

        <Card className="tenant-web__dashboard-card tenant-web__dashboard-card--tall">
          <CardHeader>
            <div>
              <CardTitle>Workspace skeleton composition</CardTitle>
              <CardDescription>
                Shared skeleton primitives are composed into tenant-specific identity, members, and sync queue shapes.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="tenant-web__dashboard-skeleton-stack">
            <div className="tenant-web__dashboard-skeleton-panel tenant-web__dashboard-skeleton-panel--hero">
              <div className="tenant-web__dashboard-skeleton-identity">
                <Skeleton height="3.5rem" variant="circle" width="3.5rem" />
                <div className="tenant-web__dashboard-skeleton-identity-copy">
                  <Skeleton height="1rem" variant="text" width="11rem" />
                  <SkeletonText lines={2} widths={["15rem", "11rem"]} />
                </div>
              </div>

              <div className="tenant-web__dashboard-skeleton-chip-row">
                <Skeleton height="2rem" width="7rem" />
                <Skeleton height="2rem" width="6rem" />
                <Skeleton height="2rem" width="5.25rem" />
              </div>
            </div>

            <div className="tenant-web__dashboard-skeleton-panel">
              {queueMockRows.map((row) => (
                <div className="tenant-web__dashboard-queue-row" key={row.id}>
                  <Skeleton height="2.75rem" variant="circle" width="2.75rem" />
                  <div className="tenant-web__dashboard-queue-copy">
                    <Skeleton height="0.95rem" variant="text" width={row.titleWidth} />
                    <SkeletonText lines={2} widths={row.textWidths} />
                  </div>
                  <Skeleton height="1.75rem" width="4.5rem" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        className="tenant-web__dashboard-section-grid tenant-web__dashboard-section-grid--balanced"
        id={tenantDashboardSectionIds.queue}
      >
        <Card className="tenant-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Tenant sync queue mock</CardTitle>
              <CardDescription>
                This taller section gives us real desktop scroll under the fixed shell while tenant content is still a
                placeholder surface.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="tenant-web__dashboard-queue-surface">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="tenant-web__dashboard-queue-surface-row" key={index}>
                <div className="tenant-web__dashboard-queue-surface-copy">
                  <Skeleton height="1rem" variant="text" width={index % 2 === 0 ? "11rem" : "9rem"} />
                  <SkeletonText lines={2} widths={["100%", index % 2 === 0 ? "72%" : "64%"]} />
                </div>
                <div className="tenant-web__dashboard-queue-surface-meta">
                  <Skeleton height="1.75rem" width="5rem" />
                  <Skeleton height="0.875rem" variant="text" width="4.25rem" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="tenant-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>List loading state</CardTitle>
              <CardDescription>
                A narrower list placeholder stays visible for onboarding tasks, support notes, and lightweight tenant
                inbox surfaces.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CollectionLoadingState
              className="tenant-web__dashboard-pattern"
              description="Preparing onboarding tasks, support notes, and tenant reminders."
              items={3}
              layout="list"
              title="Loading tenant queue"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export { tenantDashboardSectionIds };
