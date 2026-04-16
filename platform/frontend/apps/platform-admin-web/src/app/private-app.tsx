import { Fragment, Suspense, lazy, useEffect, useState } from "react";
import {
  getApiClientRequestActivitySnapshot,
  subscribeApiClientRequestActivity,
  type AdminNavigation,
} from "@platform/api-client";
import {
  BellIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
  TopLoader,
  createTopLoaderController,
} from "@platform/ui-kit";
import {
  getAppBuildMetadata,
  LocaleMenuItems,
  WorkspaceShell,
} from "@platform/app-shell";
import { useAuth } from "@platform/auth-core";
import { useTranslation } from "@platform/i18n";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AdminDashboardPage } from "../pages/dashboard/page";
import { AdminEmployeeEditPage } from "../pages/employees-edit/page";
import { AdminEmployeesListPage } from "../pages/employees-list/page";
import { AdminModuleEditPage } from "../pages/modules-edit/page";
import { AdminModulesListPage } from "../pages/modules-list/page";
import { AdminRuntimeSectionPage } from "../pages/runtime-section/page";
import { AdminTenantsListPage } from "../pages/tenants-list/page";
import {
  AdminRailUtilitySheet,
  type AdminRailUtilityPanel,
} from "../widgets/admin-rail-utility-sheet/admin-rail-utility-sheet";
import {
  buildAdminFavoriteShortcuts,
  getAdminNavigation,
  getAdminRouteMeta,
} from "../shared/navigation";
import { AdminNavigationRefreshProvider } from "../shared/admin-navigation-refresh";
import type { AdminWorkspaceUserSession } from "./app";
import "./app.css";

type AdminThemeMode = "light" | "dark";

const adminThemeStorageKey = "platform-admin-theme";
const adminSidebarCollapsedStorageKey = "platform-admin-sidebar-collapsed";
const modulesListResetPath = "/modules/list?reset=1";
const appBuild = getAppBuildMetadata();
const adminShellTopLoaderController = createTopLoaderController();
const AdminUiLabPage = lazy(async () => {
  const module = await import("../internal/ui-lab");
  return { default: module.AdminUiLabPage };
});

export function PrivateApp({
  adminApiUrl,
  navigation,
  onNavigationRefresh,
  userSession,
}: {
  adminApiUrl: string;
  navigation: AdminNavigation;
  onNavigationRefresh: () => Promise<void>;
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
  const activeRouteMeta = getAdminRouteMeta(location.pathname, navigation, t);
  const favoriteShortcuts = buildAdminFavoriteShortcuts(navigation.favorites);
  const quickActionMenuLabel = activeRouteMeta.kind === "dashboard"
    ? t("admin.shell.menu.dashboardActions")
    : t("admin.shell.menu.sectionActions");
  const notificationSummary = activeRouteMeta.kind === "dashboard"
    ? t("admin.shell.menu.dashboardRefreshed")
    : t("admin.shell.menu.sectionLive", { label: activeRouteMeta.label });

  function renderHeaderBreadcrumb() {
    if (!activeRouteMeta.parentLabel || !activeRouteMeta.parentPath) {
      return null;
    }

    const segments = [
      { label: activeRouteMeta.parentLabel, path: activeRouteMeta.parentPath },
      { current: true, label: activeRouteMeta.label },
    ];

    return (
      <Breadcrumb className="admin-web__header-breadcrumb">
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;

            return (
              <Fragment key={`${segment.label}-${index}`}>
                <BreadcrumbItem>
                  {segment.current ? (
                    <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                  ) : (
                    <button
                      className="ui-breadcrumb__link admin-web__breadcrumb-reset-link"
                      onClick={() => navigate(segment.path ?? modulesListResetPath)}
                      type="button"
                    >
                      {segment.label}
                    </button>
                  )}
                </BreadcrumbItem>
                {!isLast ? <BreadcrumbSeparator>/</BreadcrumbSeparator> : null}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

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

  useEffect(() => {
    function syncTransportActivity() {
      const snapshot = getApiClientRequestActivitySnapshot();

      if (snapshot.activeRequestCount > 0) {
        adminShellTopLoaderController.start();
        return;
      }

      adminShellTopLoaderController.done();
    }

    syncTransportActivity();

    return subscribeApiClientRequestActivity(syncTransportActivity);
  }, []);

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
    return (
      <>
        {activeRouteMeta.kind === "dashboard" ? (
          <MenuItem onClick={() => navigate("/dashboard")}>{t("admin.shell.menu.openDashboard")}</MenuItem>
        ) : activeRouteMeta.kind === "modules-create" || activeRouteMeta.kind === "modules-edit" ? (
          <MenuItem onClick={() => navigate(modulesListResetPath)}>{t("admin.shell.menu.openModulesList")}</MenuItem>
        ) : activeRouteMeta.kind === "employees-edit" ? (
          <MenuItem onClick={() => navigate(activeRouteMeta.parentPath ?? "/admin/users")}>{t("admin.shell.menu.openEmployeesList")}</MenuItem>
        ) : (
          <MenuItem onClick={() => navigate(activeRouteMeta.path)}>
            {t("admin.shell.menu.openCurrentSection", { label: activeRouteMeta.label })}
          </MenuItem>
        )}
        <MenuItem onClick={() => setUtilityPanel("favorites")}>{t("admin.shell.menu.reviewFavorites")}</MenuItem>
        <MenuItem onClick={() => setUtilityPanel("tasks")}>{t("admin.shell.menu.tasksCenter")}</MenuItem>
      </>
    );
  }

  if (isUiLabRoute) {
    return (
      <AdminNavigationRefreshProvider onNavigationRefresh={onNavigationRefresh}>
        <>
          <TopLoader controller={adminShellTopLoaderController} />
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
        </>
      </AdminNavigationRefreshProvider>
    );
  }

  return (
    <AdminNavigationRefreshProvider onNavigationRefresh={onNavigationRefresh}>
      <>
        <TopLoader controller={adminShellTopLoaderController} />
        <WorkspaceShell
          brand={t("admin.shell.brand")}
          enableCollapsedRailHoverPreview
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
              icon: <DocumentListIcon />,
              label: t("admin.shell.menu.tasksCenter"),
              onSelect: () => setUtilityPanel("tasks"),
            },
            {
              badge: favoriteShortcuts.length ? String(favoriteShortcuts.length) : undefined,
              icon: <StarIcon />,
              label: t("admin.shell.menu.favorites"),
              onSelect: () => setUtilityPanel("favorites"),
            },
          ]}
          showRailCollapse
          sidebarCollapsedStorageKey={adminSidebarCollapsedStorageKey}
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
          navigation={getAdminNavigation(location.pathname, navigation, t, (path) => navigate(path))}
          headerMeta={renderHeaderBreadcrumb()}
          headerTitle={activeRouteMeta.label}
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
            <Route element={<AdminModulesListPage />} path="/modules/list" />
            <Route element={<AdminEmployeesListPage />} path="/admin/employees" />
            <Route element={<AdminEmployeesListPage />} path="/admin/users" />
            <Route element={<AdminTenantsListPage />} path="/admin/tenants" />
            <Route element={<AdminEmployeeEditPage adminApiUrl={adminApiUrl} />} path="/admin/users/edit/:userId" />
            <Route element={<AdminEmployeeEditPage adminApiUrl={adminApiUrl} />} path="/admin/employees/edit/:userId" />
            <Route element={<AdminModuleEditPage />} path="/modules/edit/:moduleId" />
            <Route element={<AdminRuntimeSectionPage navigation={navigation} />} path="/admin/*" />
            <Route element={<Navigate replace to="/dashboard" />} path="*" />
          </Routes>
        </WorkspaceShell>

        <AdminRailUtilitySheet
          favorites={favoriteShortcuts}
          onNavigate={(path) => navigate(path)}
          onOpenChange={(open) => {
            if (!open) {
              setUtilityPanel(null);
            }
          }}
          panel={utilityPanel}
        />
      </>
    </AdminNavigationRefreshProvider>
  );
}
