import { useEffect, useState } from "react";

import {
  BellIcon,
  BuildingOfficeIcon,
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
  StarIcon,
} from "@platform/ui-kit";
import {
  getAppBuildMetadata,
  LocaleMenuItems,
  WorkspaceShell,
} from "@platform/app-shell";
import { getDemoSession, useAuth } from "@platform/auth-core";
import { useTranslation } from "@platform/i18n";

import { offlineSyncStatus } from "../offline/sync-status";
import { TenantDashboardPage } from "../pages/dashboard/page";
import { getTenantNavigation } from "../shared/navigation";
import {
  TenantRailUtilitySheet,
  type TenantRailUtilityPanel,
} from "../widgets/tenant-rail-utility-sheet/tenant-rail-utility-sheet";
import { TenantBrandImage } from "./tenant-brand-image";
import "./app.css";

type TenantThemeMode = "light" | "dark";

const tenantThemeStorageKey = "tenant-workspace-theme";
const session = getDemoSession("tenant");
const appBuild = getAppBuildMetadata();

function scrollToDashboardSection(sectionId?: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (!sectionId) {
    window.scrollTo({ behavior: "smooth", top: 0 });
    return;
  }

  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest",
  });
}

export function PrivateApp() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [utilityPanel, setUtilityPanel] = useState<TenantRailUtilityPanel | null>(null);
  const [themeMode, setThemeMode] = useState<TenantThemeMode>(() => {
    if (typeof window !== "undefined") {
      const storedTheme = window.localStorage.getItem(tenantThemeStorageKey);
      if (storedTheme === "dark" || storedTheme === "light") {
        return storedTheme;
      }
    }

    if (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark") {
      return "dark";
    }

    return "light";
  });
  const activeThemeLabel = themeMode === "dark" ? t("common.themes.dark") : t("common.themes.light");

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

    window.localStorage.setItem(tenantThemeStorageKey, themeMode);
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
            <span className="tenant-web__profile-theme-value">{activeThemeLabel}</span>
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

  return (
    <>
      <WorkspaceShell
        brand={t("tenant.shell.brand")}
        layout="rail"
        showHeaderSurfaceMarker={false}
        showSidebarSurfaceMarker={false}
        surfaceIcon={<BuildingOfficeIcon />}
        surfaceLabel={t("tenant.shell.surfaceLabel")}
        surfaceTone="workspace"
        railBottom={
          <div className="workspace-shell__rail-bottom-block">
            <div className="workspace-shell__rail-status">
              <span className="workspace-shell__rail-status-label">{appBuild.env}</span>
              <span className="workspace-shell__rail-status-meta">v{appBuild.version}</span>
            </div>
          </div>
        }
        railBottomCollapsed={
          <Menu align="end">
            <MenuTrigger>
              <button
                aria-label={t("tenant.shell.aria.openUserMenu")}
                className="workspace-shell__header-profile-trigger workspace-shell__rail-user-trigger"
                type="button"
              >
                <span className="workspace-shell__header-profile-initial">
                  {session.displayName.slice(0, 1).toUpperCase()}
                </span>
              </button>
            </MenuTrigger>
            <MenuContent className="workspace-shell__header-menu workspace-shell__header-menu--profile">
              {renderProfileMenuItems()}
            </MenuContent>
          </Menu>
        }
        railBrandLabel={t("tenant.navigation.dashboard.label")}
        railBrandOnSelect={() => scrollToDashboardSection()}
        railMark={<DashboardGridIcon />}
        railUtilities={[
          {
            badge: String(offlineSyncStatus.queuedActions),
            icon: <DocumentListIcon />,
            label: t("tenant.shell.menu.tasksCenter"),
            onSelect: () => setUtilityPanel("tasks"),
          },
          {
            icon: <StarIcon />,
            label: t("tenant.shell.menu.favorites"),
            onSelect: () => setUtilityPanel("favorites"),
          },
        ]}
        showRailCollapse
        sidebarFooter={
          <Menu align="end">
            <MenuTrigger>
              <button
                aria-label={t("tenant.shell.aria.openUserMenu")}
                className="workspace-shell__sidebar-user"
                type="button"
              >
                <div
                  aria-hidden="true"
                  className="workspace-shell__sidebar-user-avatar"
                >
                  {session.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="workspace-shell__sidebar-user-copy">
                  <span className="workspace-shell__sidebar-user-name">{session.displayName}</span>
                  <span className="workspace-shell__sidebar-user-email">{session.email}</span>
                </div>
              </button>
            </MenuTrigger>
            <MenuContent className="workspace-shell__header-menu workspace-shell__header-menu--profile">
              {renderProfileMenuItems()}
            </MenuContent>
          </Menu>
        }
        mobileHeaderBrand={
          <div className="workspace-shell__mobile-logo-lockup">
            <TenantBrandImage
              alt="Tenant Workspace"
              className="workspace-shell__brand-logo workspace-shell__brand-logo--mobile workspace-shell__brand-logo--dark"
              fallbackSrc="/assets/logo-dark.svg"
              primarySrc="/tenant/logo-dark.svg"
            />
            <TenantBrandImage
              alt="Tenant Workspace"
              className="workspace-shell__brand-logo workspace-shell__brand-logo--mobile workspace-shell__brand-logo--light"
              fallbackSrc="/assets/logo-light.svg"
              primarySrc="/tenant/logo-light.svg"
            />
          </div>
        }
        sidebarHeader={
          <div className="workspace-shell__sidebar-logo-lockup">
            <TenantBrandImage
              alt="Tenant Workspace"
              className="workspace-shell__brand-logo workspace-shell__brand-logo--sidebar workspace-shell__brand-logo--dark"
              fallbackSrc="/assets/logo-dark.svg"
              primarySrc="/tenant/logo-dark.svg"
            />
            <TenantBrandImage
              alt="Tenant Workspace"
              className="workspace-shell__brand-logo workspace-shell__brand-logo--sidebar workspace-shell__brand-logo--light"
              fallbackSrc="/assets/logo-light.svg"
              primarySrc="/tenant/logo-light.svg"
            />
          </div>
        }
        navigation={getTenantNavigation(t).map((item) => ({
          ...item,
          onNavigate: () => scrollToDashboardSection(),
        }))}
        headerTitle={t("tenant.navigation.dashboard.headerTitle")}
        headerCenter={
          <button
            aria-label={t("tenant.shell.aria.openWorkspaceSearch")}
            className="workspace-shell__header-search"
            onClick={() => scrollToDashboardSection()}
            title={t("tenant.shell.searchTitle")}
            type="button"
          >
            <span className="workspace-shell__header-search-copy">
              <SearchIcon className="workspace-shell__header-search-icon" />
              <span className="workspace-shell__header-search-label">{t("tenant.shell.searchPlaceholder")}</span>
            </span>
            <Kbd className="workspace-shell__header-search-shortcut" size="sm">
              Ctrl K
            </Kbd>
          </button>
        }
        headerActions={
          <div className="workspace-shell__header-utility-bar">
            <Menu align="end">
              <MenuTrigger>
                <button
                  aria-label={t("tenant.shell.aria.openWorkspaceActions")}
                  className="workspace-shell__header-icon-button"
                  type="button"
                >
                  <PlusIcon />
                </button>
              </MenuTrigger>
              <MenuContent className="workspace-shell__header-menu">
                <MenuLabel>{t("tenant.shell.actionsLabel")}</MenuLabel>
                <MenuItem onClick={() => scrollToDashboardSection()}>{t("tenant.shell.menu.openDashboard")}</MenuItem>
                <MenuItem onClick={() => setUtilityPanel("tasks")}>{t("tenant.shell.menu.tasksCenter")}</MenuItem>
                <MenuItem onClick={() => setUtilityPanel("favorites")}>{t("tenant.shell.menu.reviewFavorites")}</MenuItem>
              </MenuContent>
            </Menu>

            <Menu align="end">
              <MenuTrigger>
                <button
                  aria-label={t("tenant.shell.aria.openNotifications")}
                  className="workspace-shell__header-icon-button"
                  type="button"
                >
                  <BellIcon />
                  <span className="workspace-shell__header-icon-badge">
                    {offlineSyncStatus.queuedActions}
                  </span>
                </button>
              </MenuTrigger>
              <MenuContent className="workspace-shell__header-menu">
                <MenuLabel>{t("tenant.shell.menu.notifications")}</MenuLabel>
                <MenuItem onClick={() => setUtilityPanel("tasks")}>
                  {t("tenant.shell.menu.dashboardRefreshed")}
                </MenuItem>
                <MenuItem onClick={() => setUtilityPanel("help")}>
                  {t("tenant.shell.menu.loadingGuidance")}
                </MenuItem>
                <MenuItem onClick={() => setUtilityPanel("tasks")}>
                  {t("tenant.shell.menu.operatorNotes", { count: offlineSyncStatus.queuedActions })}
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        }
      >
        <TenantDashboardPage />
      </WorkspaceShell>

      <TenantRailUtilitySheet
        onOpenChange={(open) => {
          if (!open) {
            setUtilityPanel(null);
          }
        }}
        onScrollToSection={(sectionId) => scrollToDashboardSection(sectionId)}
        panel={utilityPanel}
      />
    </>
  );
}
