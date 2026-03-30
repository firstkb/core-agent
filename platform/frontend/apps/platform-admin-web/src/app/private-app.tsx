import { Suspense, lazy, useEffect, useState } from "react";
import {
  BellIcon,
  DashboardGridIcon,
  DocumentListIcon,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  PlusIcon,
  ShieldKeyIcon,
  StarIcon,
} from "@platform/ui-kit";
import {
  getAppBuildMetadata,
  LocaleMenuItems,
  WorkspaceShell,
} from "@platform/app-shell";
import { useAuth } from "@platform/auth-core";
import { useTranslation } from "@platform/i18n";
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
import type { AdminWorkspaceUserSession } from "./app";
import "./app.css";

type AdminThemeMode = "light" | "dark";

const adminThemeStorageKey = "platform-admin-theme";
const appBuild = getAppBuildMetadata();
const AdminUiLabPage = lazy(async () => {
  const module = await import("../internal/ui-lab");
  return { default: module.AdminUiLabPage };
});

export function PrivateApp({
  userSession,
}: {
  userSession: AdminWorkspaceUserSession;
}) {
  const { t } = useTranslation();
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
  const activeThemeLabel = themeMode === "dark" ? t("common.themes.dark") : t("common.themes.light");
  const activeRoute = getActiveAdminRoute(location.pathname);
  const activeRouteMeta = getAdminRouteMeta(location.pathname, t);
  const quickActionMenuLabel = activeRoute === "billing"
    ? t("admin.shell.menu.billingActions")
    : activeRoute === "audit-log"
      ? t("admin.shell.menu.auditActions")
      : t("admin.shell.menu.dashboardActions");
  const notificationSummary = activeRoute === "billing"
    ? t("admin.shell.menu.billingReviewLive")
    : activeRoute === "audit-log"
      ? t("admin.shell.menu.auditLive")
      : t("admin.shell.menu.dashboardRefreshed");

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
        <MenuItem>{t("shell.menu.myProfile")}</MenuItem>
        <MenuItem>{t("shell.menu.preferences")}</MenuItem>
        <MenuSeparator />
        <LocaleMenuItems />
        <MenuItem onClick={() => setThemeMode((value) => (value === "dark" ? "light" : "dark"))}>
          <>
            <span>{t("shell.menu.themeSwitcher")}</span>
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
          {t("shell.menu.signOut")}
        </MenuItem>
      </>
    );
  }

  function renderQuickActionMenuItems() {
    switch (activeRoute) {
      case "billing":
        return (
          <>
            <MenuItem onClick={() => navigate("/billing/queue")}>{t("admin.shell.menu.openBillingQueue")}</MenuItem>
            <MenuItem onClick={() => navigate("/billing/exceptions")}>{t("admin.shell.menu.openExceptionsLane")}</MenuItem>
            <MenuItem onClick={() => navigate("/billing/plan-deltas")}>{t("admin.shell.menu.reviewPlanDeltas")}</MenuItem>
          </>
        );
      case "audit-log":
        return (
          <>
            <MenuItem onClick={() => navigate("/audit-log/events")}>{t("admin.shell.menu.openAuditEvents")}</MenuItem>
            <MenuItem onClick={() => navigate("/audit-log/access-changes")}>{t("admin.shell.menu.reviewAccessChanges")}</MenuItem>
            <MenuItem onClick={() => navigate("/audit-log/system-jobs")}>{t("admin.shell.menu.openSystemJobs")}</MenuItem>
          </>
        );
      default:
        return (
          <>
            <MenuItem onClick={() => navigate("/dashboard")}>{t("admin.shell.menu.openDashboard")}</MenuItem>
            <MenuItem onClick={() => setUtilityPanel("tasks")}>{t("admin.shell.menu.tasksCenter")}</MenuItem>
            <MenuItem onClick={() => setUtilityPanel("favorites")}>{t("admin.shell.menu.reviewFavorites")}</MenuItem>
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
              <p className="admin-web__ui-lab-loading-eyebrow">{t("admin.loaders.uiLabEyebrow")}</p>
              <h1 className="admin-web__ui-lab-loading-title">{t("admin.loaders.uiLabTitle")}</h1>
              <p className="admin-web__ui-lab-loading-copy">
                {t("admin.loaders.uiLabCopy")}
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
        brand={t("admin.shell.brand")}
        layout="rail"
        showHeaderSurfaceMarker={false}
        showSidebarSurfaceMarker={false}
        surfaceIcon={<ShieldKeyIcon />}
        surfaceLabel={t("admin.shell.surfaceLabel")}
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
                aria-label={t("admin.shell.aria.openUserMenu")}
                className="admin-web__header-profile-trigger admin-web__rail-user-trigger"
                type="button"
              >
                <span className="admin-web__header-profile-initial">
                  {userSession.initial}
                </span>
              </button>
            </MenuTrigger>
            <MenuContent className="admin-web__header-menu admin-web__header-menu--profile">
              {renderProfileMenuItems()}
            </MenuContent>
          </Menu>
        }
        railBrandLabel={t("admin.navigation.dashboard.label")}
        railBrandOnSelect={() => navigate("/dashboard")}
        railMark={<DashboardGridIcon />}
        railUtilities={[
          {
            badge: "3",
            icon: <DocumentListIcon />,
            label: t("admin.shell.menu.tasksCenter"),
            onSelect: () => setUtilityPanel("tasks"),
          },
          {
            icon: <StarIcon />,
            label: t("admin.shell.menu.favorites"),
            onSelect: () => setUtilityPanel("favorites"),
          },
        ]}
        showRailCollapse
        sidebarNavigationLabel={
          <div className="admin-web__sidebar-section-heading">{t("admin.shell.sidebarSection")}</div>
        }
        sidebarFooter={
          <Menu align="end">
            <MenuTrigger>
              <button
                aria-label={t("admin.shell.aria.openUserMenu")}
                className="admin-web__sidebar-user"
                type="button"
              >
                <div aria-hidden="true" className="admin-web__sidebar-user-avatar">
                  {userSession.initial}
                </div>
                <div className="admin-web__sidebar-user-copy">
                  <span className="admin-web__sidebar-user-name">{userSession.displayName}</span>
                  <span className="admin-web__sidebar-user-email">{userSession.secondaryLabel}</span>
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
        navigation={getAdminNavigation(location.pathname, t, (path) => navigate(path))}
        headerTitle={getAdminHeaderTitle(location.pathname, t)}
        headerActions={
          <div className="admin-web__header-utility-bar">
            <Menu align="end">
              <MenuTrigger>
                <button
                  aria-label={t("admin.shell.aria.openQuickCreateMenu")}
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
                  aria-label={t("admin.shell.aria.openNotifications")}
                  className="admin-web__header-icon-button"
                  type="button"
                >
                  <BellIcon />
                  <span className="admin-web__header-icon-badge">3</span>
                </button>
              </MenuTrigger>
              <MenuContent className="admin-web__header-menu">
                <MenuLabel>{t("admin.shell.menu.notifications")}</MenuLabel>
                <MenuItem onClick={() => navigate(activeRouteMeta.path)}>{notificationSummary}</MenuItem>
                <MenuItem onClick={() => setUtilityPanel("help")}>{t("admin.shell.menu.loadingGuidance")}</MenuItem>
                <MenuItem onClick={() => setUtilityPanel("tasks")}>{t("admin.shell.menu.operatorNotes", { count: 3 })}</MenuItem>
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
