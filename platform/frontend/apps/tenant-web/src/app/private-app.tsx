import { useEffect, useState } from "react";

import {
  getAppBuildMetadata,
  LocaleMenuItems,
  WorkspaceShell,
} from "@platform/app-shell";
import { useAuth } from "@platform/auth-core";
import { useTranslation } from "@platform/i18n";
import {
  BellIcon,
  BuildingOfficeIcon,
  DashboardGridIcon,
  DocumentListIcon,
  HelpCircleIcon,
  Kbd,
  LayersIcon,
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
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  isPlatformBuilderPath,
  platformBuilderPaths,
} from "../features/platform-builder-v2";
import { offlineSyncStatus } from "../offline/sync-status";
import {
  getTenantShellHeaderMeta,
  getTenantShellHeaderTitle,
} from "../shared/navigation";
import { TenantSidebarNavigation } from "../shared/tenant-sidebar-navigation";
import {
  TenantRailUtilitySheet,
  type TenantRailUtilityPanel,
} from "../widgets/tenant-rail-utility-sheet/tenant-rail-utility-sheet";
import type { TenantWorkspaceUserSession } from "./app";
import { TenantBrandImage } from "./tenant-brand-image";
import "./app.css";

declare global {
  interface Window {
    __tenantPlatformBuilderLeaveGuard?: () => boolean | Promise<boolean>;
  }
}

type TenantThemeMode = "light" | "dark";

const tenantThemeStorageKey = "tenant-workspace-theme";
const tenantSidebarCollapsedStorageKey = "tenant-workspace-sidebar-collapsed";
const appBuild = getAppBuildMetadata();

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable || target.closest("[contenteditable='true']")) {
    return true;
  }

  return ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

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

export function PrivateApp({
  tenantName,
  userSession,
}: {
  tenantName?: string;
  userSession: TenantWorkspaceUserSession;
}) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const shellBrand = tenantName?.trim() ? tenantName : t("tenant.shell.brand");
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

  useEffect(() => {
    if (location.pathname !== "/dashboard") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      scrollToDashboardSection(location.hash ? location.hash.slice(1) : undefined);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.hash, location.pathname]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.shiftKey) {
        return;
      }

      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      if (event.key.toLowerCase() !== "k") {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setUtilityPanel("search");
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function canLeaveCurrentPlatformBuilderSurface() {
    if (typeof window === "undefined") {
      return true;
    }

    const guard = window.__tenantPlatformBuilderLeaveGuard;
    if (!guard) {
      return true;
    }

    const result = guard();
    return typeof result === "boolean" ? result : await result;
  }

  async function guardedNavigate(nextPath: string | { hash?: string; pathname: string }) {
    const canLeave = await canLeaveCurrentPlatformBuilderSurface();
    if (!canLeave) {
      return;
    }

    navigate(nextPath);
  }

  function openDashboard(sectionId?: string) {
    const nextHash = sectionId ? `#${sectionId}` : "";

    if (location.pathname === "/dashboard" && location.hash === nextHash) {
      scrollToDashboardSection(sectionId);
      return;
    }

    void guardedNavigate({
      hash: nextHash,
      pathname: "/dashboard",
    });
  }

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
        brand={shellBrand}
        enableCollapsedRailHoverPreview
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
                <MenuItem onClick={() => openDashboard()}>{t("tenant.shell.menu.openDashboard")}</MenuItem>
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
        headerCenter={
          <button
            aria-label={t("tenant.shell.aria.openWorkspaceSearch")}
            className="workspace-shell__header-search"
            onClick={() => setUtilityPanel("search")}
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
        headerMeta={getTenantShellHeaderMeta(t, location.pathname)}
        headerTitle={getTenantShellHeaderTitle(t, location.pathname)}
        layout="rail"
        mobileHeaderBrand={(
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
        )}
        navigation={[]}
        railBottom={(
          <div className="workspace-shell__rail-bottom-block">
            <div className="workspace-shell__rail-status">
              <span className="workspace-shell__rail-status-label">{appBuild.env}</span>
              <span className="workspace-shell__rail-status-meta">v{appBuild.version}</span>
            </div>
          </div>
        )}
        railBottomCollapsed={(
          <Menu align="end">
            <MenuTrigger>
              <button
                aria-label={t("tenant.shell.aria.openUserMenu")}
                className="workspace-shell__header-profile-trigger workspace-shell__rail-user-trigger"
                type="button"
              >
                <span className="workspace-shell__header-profile-initial">
                  {userSession.initial}
                </span>
              </button>
            </MenuTrigger>
            <MenuContent className="workspace-shell__header-menu workspace-shell__header-menu--profile">
              {renderProfileMenuItems()}
            </MenuContent>
          </Menu>
        )}
        railBrandLabel={t("tenant.navigation.dashboard.label")}
        railBrandOnSelect={() => openDashboard()}
        railMark={<DashboardGridIcon />}
        railUtilities={[
          {
            active: isPlatformBuilderPath(location.pathname),
            icon: <LayersIcon />,
            label: t("tenant.navigation.platformBuilder.label"),
            onSelect: () => navigate(platformBuilderPaths.forms),
          },
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
          {
            icon: <HelpCircleIcon />,
            label: t("tenant.shell.menu.helpCenter"),
            onSelect: () => setUtilityPanel("help"),
          },
        ]}
        showHeaderSurfaceMarker={false}
        showRailCollapse
        showSidebarSurfaceMarker={false}
        sidebarCollapsedStorageKey={tenantSidebarCollapsedStorageKey}
        sidebarNavigationLabel={(
          <TenantSidebarNavigation
            navigate={(path) => {
              void guardedNavigate(path);
            }}
            pathname={location.pathname}
          />
        )}
        sidebarFooter={(
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
                  {userSession.initial}
                </div>
                <div className="workspace-shell__sidebar-user-copy">
                  <span className="workspace-shell__sidebar-user-name">{userSession.displayName}</span>
                  <span className="workspace-shell__sidebar-user-email">{userSession.secondaryLabel}</span>
                </div>
              </button>
            </MenuTrigger>
            <MenuContent className="workspace-shell__header-menu workspace-shell__header-menu--profile">
              {renderProfileMenuItems()}
            </MenuContent>
          </Menu>
        )}
        sidebarHeader={(
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
        )}
        surfaceIcon={<BuildingOfficeIcon />}
        surfaceLabel={t("tenant.shell.surfaceLabel")}
        surfaceTone="workspace"
      >
        <Outlet />
      </WorkspaceShell>

      <TenantRailUtilitySheet
        onOpenChange={(open) => {
          if (!open) {
            setUtilityPanel(null);
          }
        }}
        onScrollToSection={(sectionId) => openDashboard(sectionId)}
        panel={utilityPanel}
      />
    </>
  );
}
