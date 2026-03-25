import { Suspense, lazy, useEffect, useState } from "react";
import {
  BellIcon,
  DashboardGridIcon,
  DocumentListIcon,
  Kbd,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  PlusIcon,
  SearchIcon,
  ShieldKeyIcon,
  StarIcon,
} from "@platform/ui-kit";
import { getAppBuildMetadata, WorkspaceShell } from "@platform/app-shell";
import { getDemoSession, useAuth } from "@platform/auth-core";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AdminAuditLogPage } from "../pages/audit-log/page";
import { AdminBillingPage } from "../pages/billing/page";
import { AdminDashboardPage } from "../pages/dashboard/page";
import {
  AdminRailUtilitySheet,
  type AdminRailUtilityPanel,
} from "../widgets/admin-rail-utility-sheet/admin-rail-utility-sheet";
import {
  getActiveAdminRoute,
  getAdminHeaderTitle,
  getAdminNavigation,
  getAdminRouteMeta,
} from "../shared/navigation";
import "./app.css";

type AdminThemeMode = "light" | "dark";

const adminThemeStorageKey = "platform-admin-theme";
const session = getDemoSession("admin");
const appBuild = getAppBuildMetadata();
const AdminUiLabPage = lazy(async () => {
  const module = await import("../internal/ui-lab");
  return { default: module.AdminUiLabPage };
});

export function PrivateApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [utilityPanel, setUtilityPanel] = useState<AdminRailUtilityPanel | null>(null);
  const [themeMode, setThemeMode] = useState<AdminThemeMode>(() => {
    if (typeof window !== "undefined") {
      const storedTheme = window.localStorage.getItem(adminThemeStorageKey);
      if (storedTheme === "dark" || storedTheme === "light") {
        return storedTheme;
      }
    }

    if (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark") {
      return "dark";
    }

    return "light";
  });
  const isUiLabRoute = location.pathname.startsWith("/root/ui-lab");
  const activeThemeLabel = themeMode === "dark" ? "Dark" : "Light";
  const activeRoute = getActiveAdminRoute(location.pathname);
  const activeRouteMeta = getAdminRouteMeta(location.pathname);
  const quickActionMenuLabel = activeRoute === "billing"
    ? "Billing Actions"
    : activeRoute === "audit-log"
      ? "Audit Actions"
      : "Dashboard Actions";
  const notificationSummary = activeRoute === "billing"
    ? "Billing review surfaces are live"
    : activeRoute === "audit-log"
      ? "Audit event streams are live"
      : "Dashboard placeholder set refreshed";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

    window.localStorage.setItem(adminThemeStorageKey, themeMode);
  }, [themeMode]);

  function renderProfileMenuItems() {
    return (
      <>
        <MenuItem>My profile</MenuItem>
        <MenuItem>Preferences</MenuItem>
        <MenuSeparator />
        <MenuItem onClick={() => setThemeMode((value) => (value === "dark" ? "light" : "dark"))}>
          <>
            <span>Theme switcher</span>
            <span className="admin-web__profile-theme-value">{activeThemeLabel}</span>
          </>
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          onClick={() => {
            void signOut();
          }}
          tone="danger"
        >
          Sign out
        </MenuItem>
      </>
    );
  }

  function renderQuickActionMenuItems() {
    switch (activeRoute) {
      case "billing":
        return (
          <>
            <MenuItem onClick={() => navigate("/billing/queue")}>Open billing queue</MenuItem>
            <MenuItem onClick={() => navigate("/billing/exceptions")}>Open exceptions lane</MenuItem>
            <MenuItem onClick={() => navigate("/billing/plan-deltas")}>Review plan deltas</MenuItem>
          </>
        );
      case "audit-log":
        return (
          <>
            <MenuItem onClick={() => navigate("/audit-log/events")}>Open audit events</MenuItem>
            <MenuItem onClick={() => navigate("/audit-log/access-changes")}>Review access changes</MenuItem>
            <MenuItem onClick={() => navigate("/audit-log/system-jobs")}>Open system jobs</MenuItem>
          </>
        );
      default:
        return (
          <>
            <MenuItem onClick={() => navigate("/dashboard")}>Open dashboard</MenuItem>
            <MenuItem onClick={() => setUtilityPanel("tasks")}>Open tasks center</MenuItem>
            <MenuItem onClick={() => setUtilityPanel("favorites")}>Review saved mockups</MenuItem>
          </>
        );
    }
  }

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
    <>
      <WorkspaceShell
        brand="Platform Admin"
        layout="rail"
        showHeaderSurfaceMarker={false}
        showSidebarSurfaceMarker={false}
        surfaceIcon={<ShieldKeyIcon />}
        surfaceLabel="Admin Console"
        surfaceTone="admin"
        railBottom={
          <div className="admin-web__rail-bottom-block">
            <div className="admin-web__rail-environment">
              <span className="admin-web__rail-environment-label">{appBuild.env}</span>
              <span className="admin-web__rail-environment-version">v{appBuild.version}</span>
            </div>
          </div>
        }
        railBottomCollapsed={
          <Menu align="end">
            <MenuTrigger>
              <button
                aria-label="Open user menu"
                className="admin-web__header-profile-trigger admin-web__rail-user-trigger"
                type="button"
              >
                <span className="admin-web__header-profile-initial">
                  {session.displayName.slice(0, 1).toUpperCase()}
                </span>
              </button>
            </MenuTrigger>
            <MenuContent className="admin-web__header-menu admin-web__header-menu--profile">
              {renderProfileMenuItems()}
            </MenuContent>
          </Menu>
        }
        railBrandLabel="Dashboard"
        railBrandOnSelect={() => navigate("/dashboard")}
        railMark={<DashboardGridIcon />}
        railUtilities={[
          {
            badge: "3",
            icon: <DocumentListIcon />,
            label: "Tasks center",
            onSelect: () => setUtilityPanel("tasks"),
          },
          {
            icon: <StarIcon />,
            label: "Favorites",
            onSelect: () => setUtilityPanel("favorites"),
          },
        ]}
        showRailCollapse
        sidebarNavigationLabel={
          <div className="admin-web__sidebar-section-heading">Admin Console</div>
        }
        sidebarFooter={
          <Menu align="end">
            <MenuTrigger>
              <button
                aria-label="Open user menu"
                className="admin-web__sidebar-user"
                type="button"
              >
                <div aria-hidden="true" className="admin-web__sidebar-user-avatar">
                  {session.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="admin-web__sidebar-user-copy">
                  <span className="admin-web__sidebar-user-name">{session.displayName}</span>
                  <span className="admin-web__sidebar-user-email">{session.email}</span>
                </div>
              </button>
            </MenuTrigger>
            <MenuContent className="admin-web__header-menu admin-web__header-menu--profile">
              {renderProfileMenuItems()}
            </MenuContent>
          </Menu>
        }
        mobileHeaderBrand={
          <div className="admin-web__mobile-logo-lockup">
            <img
              alt="FirstKB Admin"
              className="admin-web__mobile-logo admin-web__mobile-logo--dark"
              src="/assets/logo-dark.svg"
            />
            <img
              alt="FirstKB Admin"
              className="admin-web__mobile-logo admin-web__mobile-logo--light"
              src="/assets/logo-light.svg"
            />
          </div>
        }
        sidebarHeader={
          <div className="admin-web__sidebar-logo-lockup">
            <img
              alt="FirstKB Admin"
              className="admin-web__sidebar-logo admin-web__sidebar-logo--dark"
              src="/assets/logo-dark.svg"
            />
            <img
              alt="FirstKB Admin"
              className="admin-web__sidebar-logo admin-web__sidebar-logo--light"
              src="/assets/logo-light.svg"
            />
          </div>
        }
        navigation={getAdminNavigation(location.pathname, (path) => navigate(path))}
        headerTitle={getAdminHeaderTitle(location.pathname)}
        headerCenter={
          <button
            aria-label="Open global search"
            className="admin-web__header-search"
            title={`${activeRouteMeta.headerTitle} command search will be wired in a later step.`}
            type="button"
          >
            <span className="admin-web__header-search-copy">
              <SearchIcon className="admin-web__header-search-icon" />
              <span className="admin-web__header-search-label">Search or run command</span>
            </span>
            <Kbd className="admin-web__header-search-shortcut" size="sm">
              Ctrl K
            </Kbd>
          </button>
        }
        headerActions={
          <div className="admin-web__header-utility-bar">
            <Menu align="end">
              <MenuTrigger>
                <button
                  aria-label="Open quick create menu"
                  className="admin-web__header-icon-button"
                  type="button"
                >
                  <PlusIcon />
                </button>
              </MenuTrigger>
              <MenuContent className="admin-web__header-menu">
                <MenuLabel>{quickActionMenuLabel}</MenuLabel>
                {renderQuickActionMenuItems()}
              </MenuContent>
            </Menu>

            <Menu align="end">
              <MenuTrigger>
                <button
                  aria-label="Open notifications"
                  className="admin-web__header-icon-button"
                  type="button"
                >
                  <BellIcon />
                  <span className="admin-web__header-icon-badge">3</span>
                </button>
              </MenuTrigger>
              <MenuContent className="admin-web__header-menu">
                <MenuLabel>Notifications</MenuLabel>
                <MenuItem onClick={() => navigate(activeRouteMeta.path)}>{notificationSummary}</MenuItem>
                <MenuItem onClick={() => setUtilityPanel("help")}>Loading state guidance available</MenuItem>
                <MenuItem onClick={() => setUtilityPanel("tasks")}>3 operator notes still pinned</MenuItem>
              </MenuContent>
            </Menu>

          </div>
        }
      >
        <Routes>
          <Route element={<Navigate replace to="/dashboard" />} path="/" />
          <Route element={<AdminDashboardPage />} path="/dashboard" />
          <Route element={<Navigate replace to="/dashboard" />} path="/overview" />
          <Route element={<Navigate replace to="/dashboard" />} path="/tenants" />
          <Route element={<Navigate replace to="/dashboard" />} path="/signals" />
          <Route element={<Navigate replace to="/billing/queue" />} path="/billing" />
          <Route element={<AdminBillingPage section="queue" />} path="/billing/queue" />
          <Route element={<AdminBillingPage section="exceptions" />} path="/billing/exceptions" />
          <Route element={<AdminBillingPage section="plan-deltas" />} path="/billing/plan-deltas" />
          <Route element={<Navigate replace to="/billing/queue" />} path="/billing/*" />
          <Route element={<Navigate replace to="/audit-log/events" />} path="/audit-log" />
          <Route element={<AdminAuditLogPage section="events" />} path="/audit-log/events" />
          <Route element={<AdminAuditLogPage section="access-changes" />} path="/audit-log/access-changes" />
          <Route element={<AdminAuditLogPage section="system-jobs" />} path="/audit-log/system-jobs" />
          <Route element={<Navigate replace to="/audit-log/events" />} path="/audit-log/*" />
          <Route element={<Navigate replace to="/dashboard" />} path="*" />
        </Routes>
      </WorkspaceShell>

      <AdminRailUtilitySheet
        onNavigate={(path) => navigate(path)}
        onOpenChange={(open) => {
          if (!open) {
            setUtilityPanel(null);
          }
        }}
        panel={utilityPanel}
      />
    </>
  );
}
