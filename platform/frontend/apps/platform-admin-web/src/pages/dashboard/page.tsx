import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  FilterChip,
  LoadingState,
  PageToolbar,
  SecondaryTab,
  SecondaryTabs,
} from "@platform/ui-kit";
import { listDemoTenants } from "@platform/tenant-core";

import {
  getAdminTabPath,
  type AdminPageTab,
} from "../../shared/navigation";
import { RolloutReadinessCard } from "../../widgets/rollout-readiness-card/rollout-readiness-card";
import { TenantActivityFeed } from "../../widgets/tenant-activity-feed/tenant-activity-feed";
import { TenantOperationsWorkbench } from "../../widgets/tenant-operations-workbench/tenant-operations-workbench";
import { TenantPortfolioStats } from "../../widgets/tenant-portfolio-stats/tenant-portfolio-stats";

const tenants = listDemoTenants();

type AdminPageFlowState = "ready" | "loading" | "error" | "empty";

const pageCopy: Record<
  AdminPageTab,
  {
    description: string;
    title: string;
  }
> = {
  overview: {
    description:
      "Metronic-inspired control-plane dashboard for monitoring tenant health, rollout posture, and operational follow-up.",
    title: "Tenant operations overview",
  },
  tenants: {
    description:
      "Route-aware rollout workbench with URL-driven tenant detail, bulk actions, and operational drill-down.",
    title: "Tenant rollout workbench",
  },
  signals: {
    description:
      "Secondary operational surface for alert routing, automation posture, and follow-up review flows.",
    title: "Signal review surface",
  },
};

type AdminDashboardPageProps = {
  activeTab: AdminPageTab;
};

export function AdminDashboardPage({ activeTab }: AdminDashboardPageProps) {
  const navigate = useNavigate();
  const [pageFlowState, setPageFlowState] = useState<AdminPageFlowState>("ready");

  function renderReadyTab() {
    if (activeTab === "overview") {
      return (
        <>
          <TenantPortfolioStats tenants={tenants} />

          <div className="admin-web__dashboard-grid">
            <RolloutReadinessCard tenants={tenants} />
            <TenantActivityFeed tenants={tenants} />
          </div>
        </>
      );
    }

    if (activeTab === "signals") {
      return (
        <>
          <div className="admin-web__dashboard-grid">
            <TenantActivityFeed tenants={tenants} />
            <EmptyState
              actions={<Button variant="outline">Create automation</Button>}
              description="Secondary page-flow states stay explicit instead of hiding behind menu config or route-only logic."
              title="No saved signal automations yet"
            />
          </div>

          <EmptyState
            actions={<Button variant="outline">Connect notification routing</Button>}
            description="Alerting and workflow rules become meaningful only after backend control-plane endpoints are wired."
            title="Escalation flows remain in setup"
          />
        </>
      );
    }

    return (
      <Card className="admin-web__panel-card">
        <CardHeader>
          <div>
            <CardTitle>Tenant rollout health</CardTitle>
            <CardDescription>Search, filter, inspect, and review seeded tenants through a Metronic-inspired operations workbench.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TenantOperationsWorkbench tenants={tenants} />
        </CardContent>
      </Card>
    );
  }

  function renderPageFlow() {
    if (pageFlowState === "loading") {
      return (
        <LoadingState
          className="admin-web__page-state"
          description="Simulating a control-plane fetch while keeping the whole page-flow surface explicit."
          title="Loading admin surface"
        />
      );
    }

    if (pageFlowState === "error") {
      return (
        <ErrorState
          actions={
            <Button onClick={() => setPageFlowState("ready")} variant="outline">
              Retry surface
            </Button>
          }
          className="admin-web__page-state"
          description="The whole page-flow is intentionally replaced by an error surface instead of scattering failure states across cards."
          title="Failed to load control-plane data"
        />
      );
    }

    if (pageFlowState === "empty") {
      return (
        <EmptyState
          actions={
            <Button onClick={() => setPageFlowState("ready")} variant="outline">
              Return to ready state
            </Button>
          }
          className="admin-web__page-state"
          description="Useful when backend or tenant filters return no records and the entire page-flow needs a deliberate empty mode."
          title="No control-plane content available"
        />
      );
    }

    return renderReadyTab();
  }

  return (
    <div className="admin-web__stack">
      <PageToolbar
        actions={
          <>
            <Button size="sm" variant="outline">
              Export status
            </Button>
            <Button size="sm" variant="secondary">
              Review rollout
            </Button>
          </>
        }
        eyebrow="Platform"
        title={pageCopy[activeTab].title}
        description={pageCopy[activeTab].description}
      />

      <div className="admin-web__page-flow-bar">
        <SecondaryTabs>
          <SecondaryTab
            active={activeTab === "overview"}
            badge="1"
            onClick={() => navigate(getAdminTabPath("overview"))}
          >
            Overview
          </SecondaryTab>
          <SecondaryTab
            active={activeTab === "tenants"}
            badge={String(tenants.length)}
            onClick={() => navigate(getAdminTabPath("tenants"))}
          >
            Tenants
          </SecondaryTab>
          <SecondaryTab
            active={activeTab === "signals"}
            badge="2"
            onClick={() => navigate(getAdminTabPath("signals"))}
          >
            Signals
          </SecondaryTab>
        </SecondaryTabs>

        <div className="admin-web__page-flow-state-switcher">
          <span className="admin-web__page-flow-state-label">Flow state</span>
          <div className="admin-web__page-flow-state-row">
            {(["ready", "loading", "error", "empty"] as const).map((state) => (
              <FilterChip
                active={pageFlowState === state}
                key={state}
                onClick={() => setPageFlowState(state)}
              >
                {state}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {renderPageFlow()}
    </div>
  );
}
