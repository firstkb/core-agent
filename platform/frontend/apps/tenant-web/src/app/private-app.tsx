import { useEffect, useMemo, useState } from "react";

import {
  getAppBuildMetadata,
  LocaleMenuItems,
  WorkspaceShell,
} from "@platform/app-shell";
import {
  createTenantFavoritesClient,
  createTenantNavigationClient,
  getApiClientRequestActivitySnapshot,
  isUnauthorizedApiError,
  subscribeApiClientRequestActivity,
  type TenantFavoriteShortcut,
  type TenantRuntimeCreateAction,
  type TenantRuntimeNavigationItem,
} from "@platform/api-client";
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
  ShieldKeyIcon,
  StarIcon,
  TopLoader,
  createTopLoaderController,
} from "@platform/ui-kit";
import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  isPlatformStudioPath,
  platformStudioPaths,
} from "../features/platform-studio";
import { subscribeFormsPlaceholderModelsCache } from "../features/platform-studio/forms/forms-placeholder-data";
import { offlineSyncStatus } from "../offline/sync-status";
import {
  getTenantShellHeaderMeta,
  getTenantShellHeaderTitle,
} from "../shared/navigation";
import { TenantFavoritesRefreshProvider } from "../shared/tenant-favorites-refresh";
import { TenantSidebarNavigation } from "../shared/tenant-sidebar-navigation";
import {
  tenantRuntimeNavigationIncludesTargetPath,
  tenantRuntimeNavigationRefreshEvent,
} from "../shared/tenant-runtime-navigation";
import {
  TenantRailUtilitySheet,
  type TenantRailUtilityPanel,
} from "../widgets/tenant-rail-utility-sheet/tenant-rail-utility-sheet";
import {
  TenantWorkspaceSearchDialog,
  type TenantWorkspaceSearchUtility,
} from "../widgets/tenant-workspace-search-dialog/tenant-workspace-search-dialog";
import { TenantBrandImage } from "./tenant-brand-image";
import { useTenantRuntimeConfig } from "./tenant-runtime-config-context";
import { TenantWorkspaceUserProvider } from "./tenant-workspace-user-context";
import type { TenantWorkspaceUserSession } from "./tenant-workspace-user-session";
import "./app.css";

declare global {
  interface Window {
    __tenantPlatformStudioLeaveGuard?: () => boolean | Promise<boolean>;
  }
}

type TenantThemeMode = "light" | "dark";

const tenantThemeStorageKey = "tenant-workspace-theme";
const tenantSidebarCollapsedStorageKey = "tenant-workspace-sidebar-collapsed";
const appBuild = getAppBuildMetadata();
const tenantShellTopLoaderController = createTopLoaderController();

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

type RuntimeFormRouteTarget = {
  modelId: string;
  viewId: string;
};

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getRuntimeFormRouteTarget(pathname: string): RuntimeFormRouteTarget | null {
  const match = /^\/app\/forms\/([^/]+)\/views\/([^/]+)(?:\/|$)/.exec(pathname);
  if (!match) {
    return null;
  }

  const modelId = decodePathSegment(match[1] ?? "").trim();
  const viewId = decodePathSegment(match[2] ?? "").trim();
  if (!modelId || !viewId) {
    return null;
  }

  return { modelId, viewId };
}

function isRuntimeAppPageRoute(pathname: string) {
  const match = /^\/app\/pages\/([^/]+)(?:\/|$)/.exec(pathname);
  if (!match) {
    return false;
  }

  const pageId = decodePathSegment(match[1] ?? "").trim();
  return Boolean(pageId);
}

function RouteAccessDenied({
  actionLabel,
  description,
  eyebrow,
  onOpenDashboard,
  title,
}: {
  actionLabel: string;
  description: string;
  eyebrow: string;
  onOpenDashboard: () => void;
  title: string;
}) {
  return (
    <main className="tenant-web__route-access-denied">
      <section className="tenant-web__route-access-denied-surface">
        <span className="tenant-web__route-access-denied-icon" aria-hidden="true">
          <ShieldKeyIcon />
        </span>
        <span className="tenant-web__route-access-denied-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <button
          className="tenant-web__route-access-denied-button"
          onClick={onOpenDashboard}
          type="button"
        >
          {actionLabel}
        </button>
      </section>
    </main>
  );
}

export function PrivateApp({
  tenantName,
  userSession,
}: {
  tenantName?: string;
  userSession: TenantWorkspaceUserSession;
}) {
  const { t } = useTranslation();
  const runtimeConfig = useTenantRuntimeConfig();
  const favoritesClient = useMemo(
    () => createTenantFavoritesClient(runtimeConfig.tenantApiUrl),
    [runtimeConfig.tenantApiUrl],
  );
  const navigationClient = useMemo(
    () => createTenantNavigationClient(runtimeConfig.tenantApiUrl),
    [runtimeConfig.tenantApiUrl],
  );
  const { getAccessToken, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const shellBrand = tenantName?.trim() ? tenantName : t("tenant.shell.brand");
  const [, setPlatformStudioHeaderVersion] = useState(0);
  const [favoriteShortcuts, setFavoriteShortcuts] = useState<TenantFavoriteShortcut[]>([]);
  const [runtimeCreateActions, setRuntimeCreateActions] = useState<TenantRuntimeCreateAction[]>([]);
  const [runtimeNavigationItems, setRuntimeNavigationItems] = useState<TenantRuntimeNavigationItem[]>([]);
  const [runtimeNavigationReady, setRuntimeNavigationReady] = useState(false);
  const [runtimeUtilityRailItems, setRuntimeUtilityRailItems] =
    useState<TenantRuntimeNavigationItem[] | null>(null);
  const [workspaceSearchOpen, setWorkspaceSearchOpen] = useState(false);
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
  const runtimeUtilityRailItemKeys = useMemo(() => {
    if (runtimeUtilityRailItems === null) {
      return null;
    }

    const keys = new Set<string>();
    for (const item of runtimeUtilityRailItems) {
      keys.add(item.id);
      if (item.key) {
        keys.add(item.key);
      }
    }
    return keys;
  }, [runtimeUtilityRailItems]);

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
      setWorkspaceSearchOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return subscribeFormsPlaceholderModelsCache(() => {
      setPlatformStudioHeaderVersion((value) => value + 1);
    });
  }, []);

  useEffect(() => {
    void refreshFavoriteShortcuts();
  }, [favoritesClient, getAccessToken, signOut]);

  useEffect(() => {
    void refreshRuntimeNavigation();
  }, [navigationClient, getAccessToken, signOut]);

  useEffect(() => {
    function handleRuntimeNavigationRefresh() {
      void refreshRuntimeNavigation();
    }

    window.addEventListener(tenantRuntimeNavigationRefreshEvent, handleRuntimeNavigationRefresh);

    return () => {
      window.removeEventListener(tenantRuntimeNavigationRefreshEvent, handleRuntimeNavigationRefresh);
    };
  }, [navigationClient, getAccessToken, signOut]);

  useEffect(() => {
    function syncTransportActivity() {
      const snapshot = getApiClientRequestActivitySnapshot();

      if (snapshot.activeRequestCount > 0) {
        tenantShellTopLoaderController.start();
        return;
      }

      tenantShellTopLoaderController.done();
    }

    syncTransportActivity();

    return subscribeApiClientRequestActivity(syncTransportActivity);
  }, []);

  async function canLeaveCurrentPlatformStudioSurface() {
    if (typeof window === "undefined") {
      return true;
    }

    const guard = window.__tenantPlatformStudioLeaveGuard;
    if (!guard) {
      return true;
    }

    const result = guard();
    return typeof result === "boolean" ? result : await result;
  }

  async function guardedNavigate(nextPath: string | { hash?: string; pathname: string }) {
    const canLeave = await canLeaveCurrentPlatformStudioSurface();
    if (!canLeave) {
      return;
    }

    navigate(nextPath);
  }

  async function refreshFavoriteShortcuts() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    try {
      const nextFavorites = await favoritesClient.getFavorites(accessToken);
      setFavoriteShortcuts(nextFavorites);
    } catch (favoritesError) {
      if (isUnauthorizedApiError(favoritesError)) {
        void signOut();
      }
    }
  }

  async function refreshRuntimeNavigation() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    try {
      const nextNavigation = await navigationClient.getRuntimeNavigation(accessToken);
      setRuntimeCreateActions(nextNavigation.createActions);
      setRuntimeNavigationItems(nextNavigation.items);
      setRuntimeUtilityRailItems(nextNavigation.utilityRailConfigured ? nextNavigation.utilityRail : null);
      setRuntimeNavigationReady(true);
    } catch (navigationError) {
      if (isUnauthorizedApiError(navigationError)) {
        void signOut();
      }
    }
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

  function railUtilityIsVisible(id: string, key: string) {
    return runtimeUtilityRailItemKeys === null ||
      runtimeUtilityRailItemKeys.has(id) ||
      runtimeUtilityRailItemKeys.has(key);
  }

  const platformStudioIsVisible = railUtilityIsVisible("rail.platform-studio", "platform-studio");
  const platformStudioRouteDenied = isPlatformStudioPath(location.pathname) && !platformStudioIsVisible;
  const runtimeFormRouteTarget = useMemo(
    () => getRuntimeFormRouteTarget(location.pathname),
    [location.pathname],
  );
  const runtimeFormRouteDenied = runtimeNavigationReady &&
    runtimeFormRouteTarget !== null &&
    !tenantRuntimeNavigationIncludesTargetPath(runtimeNavigationItems, "form_view", location.pathname);
  const isRuntimeAppPageRoutePath = useMemo(
    () => isRuntimeAppPageRoute(location.pathname),
    [location.pathname],
  );
  const runtimeAppPageRouteDenied = runtimeNavigationReady &&
    isRuntimeAppPageRoutePath &&
    !tenantRuntimeNavigationIncludesTargetPath(runtimeNavigationItems, "app_page", location.pathname);
  const routeAccessDenied = platformStudioRouteDenied
    ? {
      actionLabel: t("tenant.navigation.platformStudio.deniedAction"),
      description: t("tenant.navigation.platformStudio.deniedDescription"),
      eyebrow: t("tenant.navigation.platformStudio.deniedEyebrow"),
      title: t("tenant.navigation.platformStudio.deniedTitle"),
    }
    : runtimeFormRouteDenied
      ? {
        actionLabel: t("tenant.navigation.runtime.forms.deniedAction"),
        description: t("tenant.navigation.runtime.forms.deniedDescription"),
        eyebrow: t("tenant.navigation.runtime.forms.deniedEyebrow"),
        title: t("tenant.navigation.runtime.forms.deniedTitle"),
      }
      : runtimeAppPageRouteDenied
        ? {
          actionLabel: t("tenant.navigation.runtime.appPages.deniedAction"),
          description: t("tenant.navigation.runtime.appPages.deniedDescription"),
          eyebrow: t("tenant.navigation.runtime.appPages.deniedEyebrow"),
          title: t("tenant.navigation.runtime.appPages.deniedTitle"),
        }
        : null;

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

  function renderCreateActionMenuItems() {
    if (runtimeCreateActions.length === 0) {
      return (
        <MenuItem disabled>
          {t("tenant.shell.menu.noCreateActions")}
        </MenuItem>
      );
    }

    return runtimeCreateActions.map((action) => {
      const breadcrumb = action.breadcrumb.length > 0
        ? action.breadcrumb.join(" / ")
        : t("tenant.shell.menu.formViewCreateFallback");

      return (
        <MenuItem
          className="tenant-web__quick-create-menu-item"
          key={action.id}
          onClick={() => {
            void guardedNavigate(action.path);
          }}
        >
          <span className="tenant-web__quick-create-menu-copy">
            <span className="tenant-web__quick-create-menu-label">{action.label}</span>
            <span className="tenant-web__quick-create-menu-meta">{breadcrumb}</span>
          </span>
        </MenuItem>
      );
    });
  }

  const railUtilities = [
    {
      item: {
        active: isPlatformStudioPath(location.pathname),
        icon: <LayersIcon />,
        label: t("tenant.navigation.platformStudio.label"),
        onSelect: () => navigate(platformStudioPaths.forms),
      },
      runtimeRailId: "rail.platform-studio",
      runtimeRailKey: "platform-studio",
    },
    {
      item: {
        badge: String(offlineSyncStatus.queuedActions),
        icon: <DocumentListIcon />,
        label: t("tenant.shell.menu.tasksCenter"),
        onSelect: () => setUtilityPanel("tasks"),
      },
      runtimeRailId: "rail.task-manager",
      runtimeRailKey: "task-manager",
    },
    {
      item: {
        badge: favoriteShortcuts.length > 0 ? String(favoriteShortcuts.length) : undefined,
        icon: <StarIcon />,
        label: t("tenant.shell.menu.favorites"),
        onSelect: () => setUtilityPanel("favorites"),
      },
      runtimeRailId: "rail.favorites",
      runtimeRailKey: "favorites",
    },
    {
      item: {
        icon: <HelpCircleIcon />,
        label: t("tenant.shell.menu.helpCenter"),
        onSelect: () => setUtilityPanel("help"),
      },
      runtimeRailId: "rail.help-center",
      runtimeRailKey: "help-center",
    },
  ].filter(({ runtimeRailId, runtimeRailKey }) =>
    railUtilityIsVisible(runtimeRailId, runtimeRailKey),
  ).map(({ item }) => item);
  const workspaceSearchUtilities: TenantWorkspaceSearchUtility[] = [
    {
      description: t("tenant.shell.workspaceSearch.utilities.dashboard"),
      icon: "dashboard",
      id: "dashboard",
      label: t("tenant.navigation.dashboard.label"),
      path: "/dashboard",
    },
    ...(platformStudioIsVisible
      ? [{
        description: t("tenant.shell.workspaceSearch.utilities.platformStudio"),
        icon: "platform-studio" as const,
        id: "platform-studio",
        label: t("tenant.navigation.platformStudio.label"),
        path: platformStudioPaths.forms,
      }]
      : []),
    ...(railUtilityIsVisible("rail.task-manager", "task-manager")
      ? [{
        description: t("tenant.shell.workspaceSearch.utilities.tasks"),
        icon: "tasks" as const,
        id: "tasks",
        label: t("tenant.shell.menu.tasksCenter"),
        panel: "tasks" as const,
      }]
      : []),
    ...(railUtilityIsVisible("rail.favorites", "favorites")
      ? [{
        description: t("tenant.shell.workspaceSearch.utilities.favorites"),
        icon: "favorites" as const,
        id: "favorites",
        label: t("tenant.shell.menu.favorites"),
        panel: "favorites" as const,
      }]
      : []),
    ...(railUtilityIsVisible("rail.help-center", "help-center")
      ? [{
        description: t("tenant.shell.workspaceSearch.utilities.help"),
        icon: "help" as const,
        id: "help",
        label: t("tenant.shell.menu.helpCenter"),
        panel: "help" as const,
      }]
      : []),
  ];

  return (
    <TenantWorkspaceUserProvider value={userSession}>
      <TenantFavoritesRefreshProvider onFavoritesRefresh={refreshFavoriteShortcuts}>
      <>
        <TopLoader controller={tenantShellTopLoaderController} />
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
              <MenuContent className="workspace-shell__header-menu tenant-web__quick-create-menu">
                <MenuLabel>{t("tenant.shell.startNewLabel")}</MenuLabel>
                {renderCreateActionMenuItems()}
              </MenuContent>
            </Menu>

            <button
              aria-label={t("tenant.shell.aria.notificationsComingSoon")}
              className="workspace-shell__header-icon-button tenant-web__header-icon-button--disabled"
              disabled
              title={t("tenant.shell.menu.notificationsComingSoon")}
              type="button"
            >
              <BellIcon />
            </button>
          </div>
        }
        headerCenter={
          <button
            aria-label={t("tenant.shell.aria.openWorkspaceSearch")}
            className="workspace-shell__header-search"
            onClick={() => setWorkspaceSearchOpen(true)}
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
        headerMeta={getTenantShellHeaderMeta(t, location.pathname, runtimeNavigationItems)}
        headerTitle={getTenantShellHeaderTitle(t, location.pathname, runtimeNavigationItems)}
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
                className={`workspace-shell__header-profile-trigger workspace-shell__rail-user-trigger${userSession.isRoot ? " workspace-shell__header-profile-trigger--root" : ""}`}
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
        railUtilities={railUtilities}
        showHeaderSurfaceMarker={false}
        showRailCollapse
        showSidebarSurfaceMarker={false}
        sidebarCollapsedStorageKey={tenantSidebarCollapsedStorageKey}
        sidebarNavigationLabel={({ closeSidebarSurfaces }) => (
          <TenantSidebarNavigation
            navigate={(path) => {
              void guardedNavigate(path);
            }}
            onAction={closeSidebarSurfaces}
            pathname={location.pathname}
            runtimeNavigationItems={runtimeNavigationItems}
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
                  className={`workspace-shell__sidebar-user-avatar${userSession.isRoot ? " workspace-shell__sidebar-user-avatar--root" : ""}`}
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
          {routeAccessDenied ? (
            <RouteAccessDenied
              actionLabel={routeAccessDenied.actionLabel}
              description={routeAccessDenied.description}
              eyebrow={routeAccessDenied.eyebrow}
              onOpenDashboard={() => openDashboard()}
              title={routeAccessDenied.title}
            />
          ) : (
            <Outlet />
          )}
        </WorkspaceShell>

        <TenantRailUtilitySheet
          favorites={favoriteShortcuts}
          onNavigate={(path) => {
            void guardedNavigate(path);
          }}
          onOpenChange={(open) => {
            if (!open) {
              setUtilityPanel(null);
            }
          }}
          onScrollToSection={(sectionId) => openDashboard(sectionId)}
          panel={utilityPanel}
        />
        <TenantWorkspaceSearchDialog
          createActions={runtimeCreateActions}
          favorites={favoriteShortcuts}
          navigationItems={runtimeNavigationItems}
          onNavigate={(path) => {
            void guardedNavigate(path);
          }}
          onOpenChange={setWorkspaceSearchOpen}
          onOpenExternal={(url) => {
            window.open(url, "_blank", "noopener,noreferrer");
          }}
          onOpenUtilityPanel={setUtilityPanel}
          open={workspaceSearchOpen}
          utilities={workspaceSearchUtilities}
        />
      </>
      </TenantFavoritesRefreshProvider>
    </TenantWorkspaceUserProvider>
  );
}
