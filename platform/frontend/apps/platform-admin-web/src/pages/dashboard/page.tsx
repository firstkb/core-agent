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

type DashboardMetricCard = {
  badge: string;
  id: string;
  label: string;
  tone: "brand" | "info" | "neutral";
  widths: string[];
};

type DashboardStatusTile = {
  id: string;
  label: string;
  value: string;
};

const dashboardMetricCards: DashboardMetricCard[] = [
  {
    badge: "23 queued",
    id: "sync-operations",
    label: "Sync operations",
    tone: "brand",
    widths: ["78%", "58%", "42%"],
  },
  {
    badge: "5 regions",
    id: "region-coverage",
    label: "Region coverage",
    tone: "info",
    widths: ["74%", "62%", "48%"],
  },
  {
    badge: "12 reviews",
    id: "policy-review",
    label: "Policy review load",
    tone: "neutral",
    widths: ["82%", "52%", "38%"],
  },
];

const dashboardStatusTiles: DashboardStatusTile[] = [
  {
    id: "environment",
    label: "Environment",
    value: "DEV v3.0.0",
  },
  {
    id: "operators",
    label: "Operators online",
    value: "14 active",
  },
  {
    id: "incidents",
    label: "Elevated incidents",
    value: "2 open",
  },
  {
    id: "tenants",
    label: "Tenant coverage",
    value: "148 workspaces",
  },
];

const queueMockRows = [
  {
    id: "policy-drift",
    titleWidth: "10.5rem",
    textWidths: ["15rem", "11rem"],
  },
  {
    id: "incident-routing",
    titleWidth: "11rem",
    textWidths: ["17rem", "12rem"],
  },
  {
    id: "region-saturation",
    titleWidth: "10rem",
    textWidths: ["14rem", "10rem"],
  },
  {
    id: "audit-handoff",
    titleWidth: "10.5rem",
    textWidths: ["16rem", "12rem"],
  },
];

function renderMetricCard(card: DashboardMetricCard) {
  return (
    <Card className="admin-web__dashboard-metric-card" key={card.id}>
      <CardHeader>
        <div className="admin-web__dashboard-metric-card-header">
          <div>
            <CardTitle>{card.label}</CardTitle>
            <CardDescription>Operational placeholder grammar keeps platform health, queue pressure, and review load visible.</CardDescription>
          </div>
          <Badge appearance="soft" size="sm" variant={card.tone}>
            {card.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="admin-web__dashboard-metric-card-body">
        <div className="admin-web__dashboard-metric-value">
          <Skeleton height="2.75rem" width="7.5rem" />
          <Skeleton height="2rem" width="5rem" />
        </div>
        <SkeletonText lines={3} widths={card.widths} />
        <div className="admin-web__dashboard-metric-meta">
          <Skeleton height="0.875rem" variant="text" width="36%" />
          <Skeleton height="0.875rem" variant="text" width="22%" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  return (
    <div className="admin-web__dashboard-shell">
      <section className="admin-web__dashboard-hero">
        <div className="admin-web__dashboard-hero-tags">
          <Badge size="sm" variant="brand">Admin Console</Badge>
          <Badge appearance="outline" size="sm" variant="neutral">Control Plane</Badge>
          <Badge appearance="soft" size="sm" variant="info">Cross-tenant operations</Badge>
        </div>

        <div className="admin-web__dashboard-hero-copy">
          <h2 className="admin-web__dashboard-hero-title">Platform control plane overview</h2>
          <p className="admin-web__dashboard-hero-description">
            Monitor tenant health, regions, policy drift, and sync pressure while the first real admin modules are
            wired into the frozen shell. The mock stays intentionally status-heavy so this surface reads like platform
            operations instead of a general workspace.
          </p>
        </div>
      </section>

      <section className="admin-web__dashboard-status-strip" aria-label="Admin Console status">
        {dashboardStatusTiles.map((tile) => (
          <div className="admin-web__dashboard-status-tile" key={tile.id}>
            <p className="admin-web__dashboard-status-label">{tile.label}</p>
            <p className="admin-web__dashboard-status-value">{tile.value}</p>
          </div>
        ))}
      </section>

      <section className="admin-web__dashboard-metric-grid">
        {dashboardMetricCards.map((card) => renderMetricCard(card))}
      </section>

      <section className="admin-web__dashboard-section-grid admin-web__dashboard-section-grid--lead">
        <Card className="admin-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Platform region board</CardTitle>
              <CardDescription>
                The lead admin surface keeps region health, tenant rollups, and ownership clusters visible while
                platform data resolves.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CollectionLoadingState
              className="admin-web__dashboard-pattern"
              description="Preparing region health boards, incident clusters, and cross-tenant summary cards."
              items={4}
              layout="grid"
              title="Hydrating platform regions"
            />
          </CardContent>
        </Card>

        <Card className="admin-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Incident response state</CardTitle>
              <CardDescription>
                A smaller companion state keeps escalations, routing, and response ownership in view beside the denser
                control-plane board.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <LoadingState
              className="admin-web__dashboard-loading-state"
              description="Preparing escalations, platform signals, and operational summaries for the admin surface."
              title="Loading incident signals"
            />
          </CardContent>
        </Card>
      </section>

      <section className="admin-web__dashboard-section-grid">
        <Card className="admin-web__dashboard-card admin-web__dashboard-card--tall">
          <CardHeader>
            <div>
              <CardTitle>Cross-tenant review table</CardTitle>
              <CardDescription>
                Dense control-plane tables preserve toolbar, filter, and row rhythm while cross-tenant review data is
                still loading.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TableLoadingState
              className="admin-web__dashboard-pattern"
              columns={5}
              description="Preparing policy filters, operator review controls, and row placeholders for the control plane."
              rows={6}
              title="Loading operator review queue"
            />
          </CardContent>
        </Card>

        <Card className="admin-web__dashboard-card admin-web__dashboard-card--tall">
          <CardHeader>
            <div>
              <CardTitle>Operations watchlist</CardTitle>
              <CardDescription>
                Smaller primitives are combined into escalations, ownership notes, and watchlist rows so the surface
                feels operational even before the real data arrives.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="admin-web__dashboard-skeleton-stack">
            <div className="admin-web__dashboard-skeleton-panel admin-web__dashboard-skeleton-panel--hero">
              <div className="admin-web__dashboard-skeleton-identity">
                <Skeleton height="3.5rem" variant="circle" width="3.5rem" />
                <div className="admin-web__dashboard-skeleton-identity-copy">
                  <Skeleton height="1rem" variant="text" width="10rem" />
                  <SkeletonText lines={2} widths={["14rem", "11rem"]} />
                </div>
              </div>

              <div className="admin-web__dashboard-skeleton-chip-row">
                <Skeleton height="2rem" width="7rem" />
                <Skeleton height="2rem" width="6rem" />
                <Skeleton height="2rem" width="5rem" />
              </div>
            </div>

            <div className="admin-web__dashboard-skeleton-panel">
              {queueMockRows.map((row) => (
                <div className="admin-web__dashboard-queue-row" key={row.id}>
                  <Skeleton height="2.75rem" variant="circle" width="2.75rem" />
                  <div className="admin-web__dashboard-queue-copy">
                    <Skeleton height="0.95rem" variant="text" width={row.titleWidth} />
                    <SkeletonText lines={2} widths={row.textWidths} />
                  </div>
                  <Skeleton height="1.75rem" width="4.75rem" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="admin-web__dashboard-section-grid admin-web__dashboard-section-grid--balanced">
        <Card className="admin-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Sync command queue</CardTitle>
              <CardDescription>
                This taller queue keeps real page scroll in the admin shell while still reading like a live command
                surface instead of a generic card list.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="admin-web__dashboard-queue-surface">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="admin-web__dashboard-queue-surface-row" key={index}>
                <div className="admin-web__dashboard-queue-surface-copy">
                  <Skeleton height="1rem" variant="text" width={index % 2 === 0 ? "12rem" : "10rem"} />
                  <SkeletonText lines={2} widths={["100%", index % 2 === 0 ? "74%" : "68%"]} />
                </div>
                <div className="admin-web__dashboard-queue-surface-meta">
                  <Skeleton height="1.75rem" width="5.5rem" />
                  <Skeleton height="0.875rem" variant="text" width="4rem" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="admin-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Audit review list</CardTitle>
              <CardDescription>
                The narrower column keeps audit summaries and review-ready items visible beside the denser queue.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CollectionLoadingState
              className="admin-web__dashboard-pattern"
              description="Preparing audit summaries, review notes, and list-level supporting copy for platform operators."
              items={3}
              layout="list"
              title="Loading audit trail"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
