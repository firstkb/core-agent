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

type WorkspaceFocusItem = {
  description: string;
  eyebrow: string;
  id: string;
  title: string;
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

const workspaceFocusItems: WorkspaceFocusItem[] = [
  {
    description: "Keep approvals, follow-ups, and next actions ready at the top of the workspace.",
    eyebrow: "Today",
    id: "tasks",
    title: "My tasks",
  },
  {
    description: "Review team changes, member activity, and announcements without leaving the dashboard.",
    eyebrow: "Team",
    id: "activity",
    title: "Activity stream",
  },
  {
    description: "Stay close to reports, organization health, and lightweight operational summaries.",
    eyebrow: "Reports",
    id: "reports",
    title: "Workspace review",
  },
];

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
              Workspace-facing loading grammar keeps tasks, team health, and reporting surfaces visible while modules
              are still being wired.
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
          <Badge size="sm" variant="brand">Workspace</Badge>
          <Badge appearance="soft" size="sm" variant={tenantStatusToBadgeVariant(tenant.status)}>
            {tenant.status}
          </Badge>
          <Badge appearance="soft" size="sm" variant="info">
            Team operations
          </Badge>
          <Badge appearance="outline" size="sm" variant="neutral">
            {tenant.plan} workspace
          </Badge>
        </div>

        <div className="tenant-web__dashboard-hero-copy">
          <h2 className="tenant-web__dashboard-hero-title">{tenant.name} workspace overview</h2>
          <p className="tenant-web__dashboard-hero-description">
            Keep your team, activity, reports, and daily operations in view while the first real workspace modules are
            wired into the frozen shell. This mock stays intentionally task-and-activity oriented so it reads like an
            organization workspace instead of platform operations.
          </p>
        </div>
      </section>

      <section className="tenant-web__dashboard-focus-strip" aria-label="Workspace focus">
        {workspaceFocusItems.map((item) => (
          <div className="tenant-web__dashboard-focus-card" key={item.id}>
            <p className="tenant-web__dashboard-focus-eyebrow">{item.eyebrow}</p>
            <h3 className="tenant-web__dashboard-focus-title">{item.title}</h3>
            <p className="tenant-web__dashboard-focus-description">{item.description}</p>
          </div>
        ))}
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
              <CardTitle>Daily workspace board</CardTitle>
              <CardDescription>
                The first workspace block keeps tasks, summaries, and team-facing modules in view while the tenant
                shell settles into its real sections.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CollectionLoadingState
              className="tenant-web__dashboard-pattern"
              description="Preparing tasks, workspace summaries, announcements, and member-facing modules."
              items={4}
              layout="grid"
              title={`Hydrating ${tenant.name} workspace`}
            />
          </CardContent>
        </Card>

        <Card className="tenant-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Announcements & briefings</CardTitle>
              <CardDescription>
                A lighter companion block keeps workspace updates and short-form context visible beside the larger board.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <LoadingState
              className="tenant-web__dashboard-loading-state"
              description="Preparing organization updates, member notices, and workspace-level context."
              title="Loading workspace brief"
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
              <CardTitle>Activity stream</CardTitle>
              <CardDescription>
                The denser workspace surface keeps recent activity, approvals, and team events readable while data is
                still loading.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TableLoadingState
              className="tenant-web__dashboard-pattern"
              columns={5}
              description="Preparing activity filters, team updates, and row-level actions for workspace operators."
              rows={6}
              title="Loading activity stream"
            />
          </CardContent>
        </Card>

        <Card className="tenant-web__dashboard-card tenant-web__dashboard-card--tall">
          <CardHeader>
            <div>
              <CardTitle>Team & task composition</CardTitle>
              <CardDescription>
                Shared skeleton primitives are composed into workspace identity, task blocks, member notes, and follow-up
                shapes.
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
              <CardTitle>Upcoming work queue</CardTitle>
              <CardDescription>
                This taller section gives the workspace real desktop scroll while still reading like actionable
                follow-ups instead of platform queue management.
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
                  <Skeleton height="0.875rem" variant="text" width={index % 2 === 0 ? "5.25rem" : "4.5rem"} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="tenant-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Reports & reminders</CardTitle>
              <CardDescription>
                A narrower list placeholder keeps reminders, onboarding notes, and reports within easy reach.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CollectionLoadingState
              className="tenant-web__dashboard-pattern"
              description="Preparing reports, reminders, and lightweight follow-up items for the workspace inbox."
              items={3}
              layout="list"
              title={`Loading ${offlineSyncStatus.queuedActions} workspace follow-ups`}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export { tenantDashboardSectionIds };
