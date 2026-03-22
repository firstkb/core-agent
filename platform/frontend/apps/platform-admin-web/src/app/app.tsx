import { Suspense, lazy } from "react";
import { Button } from "@platform/ui-kit";
import { WorkspaceShell } from "@platform/app-shell";
import { formatSessionLabel, getDemoSession } from "@platform/auth-core";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AdminAuditLogPage } from "../pages/audit-log/page";
import { AdminBillingPage } from "../pages/billing/page";
import { AdminDashboardPage } from "../pages/dashboard/page";
import {
  getAdminHeaderTitle,
  getAdminNavigation,
} from "../shared/navigation";
import "./app.css";

const session = getDemoSession("admin");
const AdminUiLabPage = lazy(async () => {
  const module = await import("../internal/ui-lab");
  return { default: module.AdminUiLabPage };
});

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isUiLabRoute = location.pathname.startsWith("/root/ui-lab");

  if (isUiLabRoute) {
    return (
      <Suspense
        fallback={
          <main className="admin-web__ui-lab-loading-shell">
            <div className="admin-web__ui-lab-loading-card">
              <p className="admin-web__ui-lab-loading-eyebrow">UI Lab</p>
              <h1 className="admin-web__ui-lab-loading-title">Loading documentation surface</h1>
              <p className="admin-web__ui-lab-loading-copy">
                Preparing the isolated component lab and token reference view.
              </p>
            </div>
          </main>
        }
      >
        <Routes>
          <Route element={<AdminUiLabPage />} path="/root/ui-lab" />
          <Route element={<Navigate replace to="/root/ui-lab" />} path="*" />
        </Routes>
      </Suspense>
    );
  }

  return (
    <WorkspaceShell
      brand="Platform Admin"
      surfaceLabel="Internal"
      navigation={getAdminNavigation(location.pathname, (path) => navigate(path))}
      headerTitle={getAdminHeaderTitle(location.pathname)}
      headerMeta={formatSessionLabel(session)}
      headerActions={
        <>
          <Button variant="ghost">Review alerts</Button>
          <Button>Create tenant</Button>
        </>
      }
      sidebarFooter={
        <p className="admin-web__sidebar-note">
          Operational control surface for tenants and platform health.
        </p>
      }
    >
      <Routes>
        <Route element={<Navigate replace to="/overview" />} path="/" />
        <Route
          element={<AdminDashboardPage activeTab="overview" />}
          path="/overview"
        />
        <Route
          element={<AdminDashboardPage activeTab="tenants" />}
          path="/tenants"
        />
        <Route
          element={<AdminDashboardPage activeTab="signals" />}
          path="/signals"
        />
        <Route
          element={<Navigate replace to="/billing/queue" />}
          path="/billing"
        />
        <Route
          element={<AdminBillingPage section="queue" />}
          path="/billing/queue"
        />
        <Route
          element={<AdminBillingPage section="exceptions" />}
          path="/billing/exceptions"
        />
        <Route
          element={<AdminBillingPage section="plan-deltas" />}
          path="/billing/plan-deltas"
        />
        <Route
          element={<Navigate replace to="/audit-log/events" />}
          path="/audit-log"
        />
        <Route
          element={<AdminAuditLogPage section="events" />}
          path="/audit-log/events"
        />
        <Route
          element={<AdminAuditLogPage section="access-changes" />}
          path="/audit-log/access-changes"
        />
        <Route
          element={<AdminAuditLogPage section="system-jobs" />}
          path="/audit-log/system-jobs"
        />
        <Route element={<Navigate replace to="/overview" />} path="*" />
      </Routes>
    </WorkspaceShell>
  );
}
