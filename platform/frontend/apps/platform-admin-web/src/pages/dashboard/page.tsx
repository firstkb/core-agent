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

const dashboardMetricCards: DashboardMetricCard[] = [
  {
    badge: "Live mock",
    id: "tenant-readiness",
    label: "Tenant readiness",
    tone: "brand",
    widths: ["78%", "58%", "42%"],
  },
  {
    badge: "Shared states",
    id: "route-hydration",
    label: "Route hydration",
    tone: "info",
    widths: ["74%", "62%", "48%"],
  },
  {
    badge: "Desktop scroll",
    id: "operator-queue",
    label: "Operator queue",
    tone: "neutral",
    widths: ["82%", "52%", "38%"],
  },
];

const queueMockRows = [
  {
    id: "identity-cluster",
    titleWidth: "10rem",
    textWidths: ["15rem", "11rem"],
  },
  {
    id: "surface-reconciliation",
    titleWidth: "12rem",
    textWidths: ["17rem", "12rem"],
  },
  {
    id: "routing-readiness",
    titleWidth: "9rem",
    textWidths: ["14rem", "10rem"],
  },
  {
    id: "audit-hydration",
    titleWidth: "11rem",
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
            <CardDescription>Shared placeholder grammar from UI Lab, reused as a dashboard-first mock.</CardDescription>
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
          <Badge size="sm" variant="brand">Dashboard</Badge>
          <Badge appearance="outline" size="sm" variant="neutral">UI Lab Mock</Badge>
          <Badge appearance="soft" size="sm" variant="info">Skeleton + Loading States</Badge>
        </div>

        <div className="admin-web__dashboard-hero-copy">
          <h2 className="admin-web__dashboard-hero-title">Loading-first control plane canvas</h2>
          <p className="admin-web__dashboard-hero-description">
            The admin shell now resolves to a single dashboard route. Real module pages are removed from the menu,
            and the surface is intentionally filled with shared loading and skeleton patterns so desktop review can
            focus on shell rhythm, spacing, and scroll behavior.
          </p>
        </div>
      </section>

      <section className="admin-web__dashboard-metric-grid">
        {dashboardMetricCards.map((card) => renderMetricCard(card))}
      </section>

      <section className="admin-web__dashboard-section-grid admin-web__dashboard-section-grid--lead">
        <Card className="admin-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Dashboard collection canvas</CardTitle>
              <CardDescription>
                A wide collection loading block keeps the first screen visually anchored while the shell chrome stays
                sticky above it.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CollectionLoadingState
              className="admin-web__dashboard-pattern"
              description="Preparing dashboard sections, routing summaries, and collection-level placeholders."
              items={4}
              layout="grid"
              title="Hydrating dashboard modules"
            />
          </CardContent>
        </Card>

        <Card className="admin-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Route-level loading state</CardTitle>
              <CardDescription>
                The simple route placeholder remains visible as a secondary pattern beside the richer dashboard mock.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <LoadingState
              className="admin-web__dashboard-loading-state"
              description="Shared route-level state stays product-neutral while larger blocks use structured placeholders."
              title="Loading dashboard context"
            />
          </CardContent>
        </Card>
      </section>

      <section className="admin-web__dashboard-section-grid">
        <Card className="admin-web__dashboard-card admin-web__dashboard-card--tall">
          <CardHeader>
            <div>
              <CardTitle>Table loading surface</CardTitle>
              <CardDescription>
                Dense operational surfaces still preserve toolbar, header, and row rhythm while data is unavailable.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TableLoadingState
              className="admin-web__dashboard-pattern"
              columns={5}
              description="Preparing table filters, review controls, and row placeholders for the dashboard shell."
              rows={6}
              title="Loading review table"
            />
          </CardContent>
        </Card>

        <Card className="admin-web__dashboard-card admin-web__dashboard-card--tall">
          <CardHeader>
            <div>
              <CardTitle>Skeleton composition</CardTitle>
              <CardDescription>
                Smaller skeleton primitives are combined here into identity, note, and queue shapes instead of using
                one fixed dashboard-specific loading card.
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
              <CardTitle>Operator queue mock</CardTitle>
              <CardDescription>
                This section is intentionally taller so the desktop shell can be reviewed with real page scroll below
                the sticky top bar.
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
              <CardTitle>List loading state</CardTitle>
              <CardDescription>
                The narrower column keeps a reusable list placeholder visible beside the taller mock surfaces.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CollectionLoadingState
              className="admin-web__dashboard-pattern"
              description="Preparing grouped review items and list-level supporting copy."
              items={3}
              layout="list"
              title="Loading review queue"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
