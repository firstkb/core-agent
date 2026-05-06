import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

import { useTranslation } from "@platform/i18n";
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  CloseIcon,
  MenuIcon,
  SidebarNav,
  type SidebarNavItem,
  SparkIcon,
  SunMoonIcon,
  SidebarCollapseIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@platform/ui-kit";

import {
  getWorkspaceShellSidebarState,
  readWorkspaceShellSidebarCollapsedPreference,
  writeWorkspaceShellSidebarCollapsedPreference,
  type WorkspaceShellLayout,
} from "./workspace-shell-sidebar-state";

const mobileViewportQuery = "(max-width: 960px)";
const collapsedRailHoverPreviewOpenDelayMs = 140;
const collapsedRailHoverPreviewCloseDelayMs = 160;

type WorkspaceNavItem = {
  id?: string;
  children?: WorkspaceNavItem[];
  defaultOpen?: boolean;
  icon?: ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  badge?: string;
  note?: string;
  onNavigate?: () => void;
  shortLabel?: string;
};

type WorkspaceRailItem = {
  active?: boolean;
  badge?: string;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  onSelect?: () => void;
};

type WorkspaceShellTheme = "light" | "dark";
type WorkspaceSurfaceTone = "admin" | "workspace" | "neutral";

type WorkspaceShellSidebarControls = {
  closeSidebarSurfaces: () => void;
};

type WorkspaceShellProps = {
  brand: string;
  surfaceLabel?: string;
  surfaceIcon?: ReactNode;
  surfaceTone?: WorkspaceSurfaceTone;
  showHeaderSurfaceMarker?: boolean;
  showSidebarSurfaceMarker?: boolean;
  sidebarNavigationLabel?: ReactNode | ((controls: WorkspaceShellSidebarControls) => ReactNode);
  navigation: WorkspaceNavItem[];
  headerTitle?: string;
  headerMeta?: ReactNode;
  headerCenter?: ReactNode;
  headerActions?: ReactNode;
  mobileHeaderBrand?: ReactNode;
  layout?: WorkspaceShellLayout;
  railBottom?: ReactNode;
  railBottomCollapsed?: ReactNode;
  railBrandLabel?: string;
  railBrandOnSelect?: () => void;
  railMark?: ReactNode;
  railUtilities?: WorkspaceRailItem[];
  sidebarFooter?: ReactNode;
  sidebarHeader?: ReactNode;
  // Temporarily expands the collapsed desktop rail on hover without changing pinned collapse state.
  enableCollapsedRailHoverPreview?: boolean;
  showRailCollapse?: boolean;
  sidebarCollapsedStorageKey?: string;
  showRailThemeToggle?: boolean;
  themeStorageKey?: string;
  children: ReactNode;
};

export function WorkspaceShell({
  brand,
  surfaceLabel,
  surfaceIcon,
  surfaceTone = "neutral",
  showHeaderSurfaceMarker = true,
  showSidebarSurfaceMarker = true,
  sidebarNavigationLabel,
  navigation,
  headerTitle,
  headerMeta,
  headerCenter,
  headerActions,
  mobileHeaderBrand,
  layout = "classic",
  railBottom,
  railBottomCollapsed,
  railBrandLabel,
  railBrandOnSelect,
  railMark,
  railUtilities = [],
  sidebarFooter,
  sidebarHeader,
  enableCollapsedRailHoverPreview = false,
  showRailCollapse = false,
  sidebarCollapsedStorageKey,
  showRailThemeToggle = false,
  themeStorageKey = "workspace-shell-theme",
  children,
}: WorkspaceShellProps) {
  const { t } = useTranslation();
  const collapsedRailHoverPreviewTimeoutRef = useRef<number | null>(null);
  const sidebarPersistenceConfigRef = useRef<{
    showRailCollapse: boolean;
    storageKey?: string;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    showRailCollapse
      ? readWorkspaceShellSidebarCollapsedPreference(sidebarCollapsedStorageKey)
      : false,
  );
  const [isCollapsedRailHoverPreviewOpen, setIsCollapsedRailHoverPreviewOpen] = useState(false);
  const [isHeaderElevated, setIsHeaderElevated] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(mobileViewportQuery).matches;
  });
  const [themeMode, setThemeMode] = useState<WorkspaceShellTheme>("light");
  const {
    isCollapsedRailHoverPreviewEnabled,
    isCollapsedRailHoverPreviewVisible,
    shellIsSidebarCollapsed,
  } = getWorkspaceShellSidebarState({
    enableCollapsedRailHoverPreview,
    isCollapsedRailHoverPreviewOpen,
    isMobileViewport,
    isSidebarCollapsed,
    layout,
  });

  function clearCollapsedRailHoverPreviewTimeout() {
    if (collapsedRailHoverPreviewTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(collapsedRailHoverPreviewTimeoutRef.current);
    collapsedRailHoverPreviewTimeoutRef.current = null;
  }

  function closeSidebarSurfaces() {
    clearCollapsedRailHoverPreviewTimeout();
    setIsCollapsedRailHoverPreviewOpen(false);
    setIsSidebarOpen(false);
  }

  function scheduleCollapsedRailHoverPreview(nextOpen: boolean) {
    if (typeof window === "undefined") {
      return;
    }

    clearCollapsedRailHoverPreviewTimeout();

    if (!isCollapsedRailHoverPreviewEnabled) {
      setIsCollapsedRailHoverPreviewOpen(false);
      return;
    }

    collapsedRailHoverPreviewTimeoutRef.current = window.setTimeout(() => {
      setIsCollapsedRailHoverPreviewOpen(nextOpen);
      collapsedRailHoverPreviewTimeoutRef.current = null;
    }, nextOpen ? collapsedRailHoverPreviewOpenDelayMs : collapsedRailHoverPreviewCloseDelayMs);
  }

  useEffect(() => {
    if (!showRailCollapse) {
      setIsSidebarCollapsed(false);
      return;
    }

    setIsSidebarCollapsed(readWorkspaceShellSidebarCollapsedPreference(sidebarCollapsedStorageKey));
  }, [showRailCollapse, sidebarCollapsedStorageKey]);

  useEffect(() => {
    const previousConfig = sidebarPersistenceConfigRef.current;
    const configChanged = !previousConfig
      || previousConfig.showRailCollapse !== showRailCollapse
      || previousConfig.storageKey !== sidebarCollapsedStorageKey;

    sidebarPersistenceConfigRef.current = {
      showRailCollapse,
      storageKey: sidebarCollapsedStorageKey,
    };

    if (configChanged) {
      return;
    }

    if (!showRailCollapse) {
      return;
    }

    writeWorkspaceShellSidebarCollapsedPreference(
      sidebarCollapsedStorageKey,
      isSidebarCollapsed,
    );
  }, [showRailCollapse, sidebarCollapsedStorageKey, isSidebarCollapsed]);

  useEffect(() => {
    if (layout !== "rail") {
      setIsHeaderElevated(false);
      return;
    }

    function syncHeaderElevation() {
      setIsHeaderElevated(window.scrollY > 0);
    }

    syncHeaderElevation();
    window.addEventListener("scroll", syncHeaderElevation, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncHeaderElevation);
    };
  }, [layout]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileViewportQuery);

    function syncViewportMode() {
      const nextIsMobileViewport = mediaQuery.matches;

      setIsMobileViewport(nextIsMobileViewport);
      setIsSidebarOpen(false);
    }

    syncViewportMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewportMode);
    } else {
      mediaQuery.addListener(syncViewportMode);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", syncViewportMode);
      } else {
        mediaQuery.removeListener(syncViewportMode);
      }
    };
  }, [layout]);

  useEffect(() => {
    return () => {
      clearCollapsedRailHoverPreviewTimeout();
    };
  }, []);

  useEffect(() => {
    if (isCollapsedRailHoverPreviewEnabled) {
      return;
    }

    clearCollapsedRailHoverPreviewTimeout();
    setIsCollapsedRailHoverPreviewOpen(false);
  }, [isCollapsedRailHoverPreviewEnabled]);

  useEffect(() => {
    if (!showRailThemeToggle) {
      return;
    }

    const storedTheme = window.localStorage.getItem(themeStorageKey);
    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeMode(storedTheme);
      return;
    }

    const rootTheme = document.documentElement.getAttribute("data-theme");
    if (rootTheme === "dark") {
      setThemeMode("dark");
    }
  }, [showRailThemeToggle, themeStorageKey]);

  useEffect(() => {
    if (!showRailThemeToggle) {
      return;
    }

    const root = document.documentElement;
    if (themeMode === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

    window.localStorage.setItem(themeStorageKey, themeMode);
  }, [showRailThemeToggle, themeMode, themeStorageKey]);

  function getNavigationItemId(item: WorkspaceNavItem) {
    return item.id ?? item.label.toLowerCase().replace(/\s+/g, "-");
  }

  function mapWorkspaceNavigationItem(item: WorkspaceNavItem): SidebarNavItem {
    return {
      children: item.children?.map((childItem) => mapWorkspaceNavigationItem(childItem)),
      defaultOpen: item.defaultOpen,
      icon: item.icon,
      id: getNavigationItemId(item),
      label: item.label,
      meta: item.badge,
    };
  }

  function findNavigationItemById(
    navigationItems: WorkspaceNavItem[],
    itemId: string,
  ): WorkspaceNavItem | undefined {
    for (const item of navigationItems) {
      if (getNavigationItemId(item) === itemId) {
        return item;
      }

      if (item.children?.length) {
        const nestedItem = findNavigationItemById(item.children, itemId);

        if (nestedItem) {
          return nestedItem;
        }
      }
    }

    return undefined;
  }

  function findActiveNavigationItem(
    navigationItems: WorkspaceNavItem[],
  ): WorkspaceNavItem | undefined {
    for (const item of navigationItems) {
      if (item.active) {
        return item;
      }

      if (item.children?.length) {
        const nestedActiveItem = findActiveNavigationItem(item.children);

        if (nestedActiveItem) {
          return nestedActiveItem;
        }
      }
    }

    return undefined;
  }

  function activateNavigationItem(item: WorkspaceNavItem) {
    if (item.onNavigate) {
      item.onNavigate();
    } else if (item.href && typeof window !== "undefined") {
      window.location.assign(item.href);
    }

    closeSidebarSurfaces();
  }

  function handleNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    item: WorkspaceNavItem,
  ) {
    if (item.onNavigate || !item.href) {
      event.preventDefault();
      activateNavigationItem(item);
      return;
    }

    closeSidebarSurfaces();
  }

  function renderRailActionButton(
    item: WorkspaceRailItem,
    options: { active?: boolean } = {},
  ) {
    const isActive = item.active || options.active;

    return (
      <Tooltip align="center" key={item.label} side="right">
        <TooltipTrigger>
          <button
            aria-label={item.label}
            aria-disabled={item.disabled ? "true" : undefined}
            className={`workspace-shell__rail-link${isActive ? " workspace-shell__rail-link--active" : ""}${item.disabled ? " workspace-shell__rail-link--disabled" : ""}${item.className ? ` ${item.className}` : ""}`}
            onClick={() => {
              if (item.disabled) {
                return;
              }

              item.onSelect?.();
              closeSidebarSurfaces();
            }}
            type="button"
          >
            {item.icon ? (
              <span className="workspace-shell__rail-icon">{item.icon}</span>
            ) : (
              <span className="workspace-shell__rail-fallback">{item.label.slice(0, 1).toUpperCase()}</span>
            )}
            {item.badge ? <span className="workspace-shell__rail-badge">{item.badge}</span> : null}
          </button>
        </TooltipTrigger>
        <TooltipContent>{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  function renderSidebarMobileRailButton(
    item: {
      active?: boolean;
      disabled?: boolean;
      icon?: ReactNode;
      label: string;
      onSelect?: () => void;
    },
    key: string,
  ) {
    return (
      <button
        aria-disabled={item.disabled ? "true" : undefined}
        className={`workspace-shell__sidebar-mobile-utility${item.active ? " workspace-shell__sidebar-mobile-utility--active" : ""}${item.disabled ? " workspace-shell__sidebar-mobile-utility--disabled" : ""}`}
        key={key}
        onClick={() => {
          if (item.disabled) {
            return;
          }

          item.onSelect?.();
          setIsSidebarOpen(false);
        }}
        type="button"
      >
        <span className="workspace-shell__sidebar-mobile-utility-icon">
          {item.icon ?? <span className="workspace-shell__rail-fallback">{item.label.slice(0, 1).toUpperCase()}</span>}
        </span>
        <span className="workspace-shell__sidebar-mobile-utility-label">{item.label}</span>
      </button>
    );
  }

  function renderSidebarNavigation() {
    if (layout === "rail") {
      const items: SidebarNavItem[] = navigation.map((item) =>
        mapWorkspaceNavigationItem(item),
      );
      const activeItem = findActiveNavigationItem(navigation);
      const activeItemId = activeItem ? getNavigationItemId(activeItem) : undefined;

      return (
        <SidebarNav
          activeItemId={activeItemId}
          ariaLabel={t("shell.aria.primaryModuleNavigation")}
          className="workspace-shell__sidebar-nav"
          compact
          items={items}
          onActiveItemChange={(itemId) => {
            const targetItem = findNavigationItemById(navigation, itemId);

            if (targetItem) {
              activateNavigationItem(targetItem);
            }
          }}
        />
      );
    }

    return (
      <nav aria-label={t("shell.aria.primary")} className="workspace-shell__nav">
        <ul className="workspace-shell__nav-list">
          {navigation.map((item) => (
            <li key={item.label}>
              <a
                aria-current={item.active ? "page" : undefined}
                className={`workspace-shell__nav-link${item.active ? " workspace-shell__nav-link--active" : ""}`}
                href={item.href ?? "#"}
                onClick={(event) => handleNavigation(event, item)}
              >
                <span className="workspace-shell__nav-link-copy">
                  {item.icon ? <span className="workspace-shell__nav-icon">{item.icon}</span> : null}
                  <span className="workspace-shell__nav-label">{item.label}</span>
                </span>
                {item.badge ? <span className="workspace-shell__nav-badge">{item.badge}</span> : null}
              </a>
              {item.note ? <p className="workspace-shell__nav-note">{item.note}</p> : null}
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  function renderSurfaceMarker() {
    if (!surfaceLabel) {
      return null;
    }

    return (
      <div className={`workspace-shell__surface-marker workspace-shell__surface-marker--${surfaceTone}`}>
        {surfaceIcon ? <span className="workspace-shell__surface-marker-icon">{surfaceIcon}</span> : null}
        <span className="workspace-shell__surface-marker-label">{surfaceLabel}</span>
      </div>
    );
  }

  function renderRailNavigation() {
    if (layout !== "rail") {
      return null;
    }

    const railBrandContent = railMark ?? <SparkIcon />;
    const railBrandTitle = railBrandLabel ?? brand;

    return (
      <div className="workspace-shell__rail">
        <div className="workspace-shell__rail-top">
          {railBrandOnSelect ? (
            <Tooltip align="center" side="right">
              <TooltipTrigger>
                <button
                  aria-label={railBrandTitle}
                  className="workspace-shell__rail-brand workspace-shell__rail-brand--interactive"
                  onClick={() => {
                    railBrandOnSelect();
                    closeSidebarSurfaces();
                  }}
                  type="button"
                >
                  {railBrandContent}
                </button>
              </TooltipTrigger>
              <TooltipContent>{railBrandTitle}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="workspace-shell__rail-brand">{railBrandContent}</div>
          )}

          {showRailCollapse
            ? renderRailActionButton(
                {
                  className: "workspace-shell__rail-link--collapse",
                  icon: <SidebarCollapseIcon />,
                  label: shellIsSidebarCollapsed
                    ? t("shell.actions.expandNavigation")
                    : t("shell.actions.collapseNavigation"),
                  onSelect: () => setIsSidebarCollapsed((value) => !value),
                },
                { active: shellIsSidebarCollapsed },
              )
            : null}

          {showRailThemeToggle
            ? renderRailActionButton(
                {
                  icon: <SunMoonIcon />,
                  label: themeMode === "dark"
                    ? t("shell.actions.switchToLightTheme")
                    : t("shell.actions.switchToDarkTheme"),
                  onSelect: () => setThemeMode((value) => (value === "dark" ? "light" : "dark")),
                },
                { active: themeMode === "dark" },
              )
            : null}
        </div>

        {railUtilities.length > 0 ? (
          <nav aria-label={t("shell.aria.platformUtilities")} className="workspace-shell__rail-nav">
            {railUtilities.map((item) => renderRailActionButton(item))}
          </nav>
        ) : null}

        {railBottom || (shellIsSidebarCollapsed && railBottomCollapsed) ? (
          <div className="workspace-shell__rail-bottom">
            {shellIsSidebarCollapsed ? railBottomCollapsed : null}
            {railBottom}
          </div>
        ) : null}
      </div>
    );
  }

  function renderSidebarMobileUtilities() {
    if (layout !== "rail" || railUtilities.length === 0) {
      return null;
    }

    return (
      <div
        aria-label={t("shell.aria.platformUtilities")}
        className="workspace-shell__sidebar-mobile-utilities"
        role="group"
      >
        {railUtilities.map((item) =>
          renderSidebarMobileRailButton(
            {
              active: item.active,
              disabled: item.disabled,
              icon: item.icon,
              label: item.label,
              onSelect: item.onSelect,
            },
            item.label,
          ),
        )}
      </div>
    );
  }

  function renderSidebarPanel() {
    const resolvedSidebarNavigationLabel = typeof sidebarNavigationLabel === "function"
      ? sidebarNavigationLabel({ closeSidebarSurfaces })
      : sidebarNavigationLabel;

    return (
      <div className="workspace-shell__panel">
        <div className="workspace-shell__sidebar-mobile-bar">
          <button
            aria-label={t("shell.aria.closeNavigation")}
            className="workspace-shell__sidebar-close"
            onClick={closeSidebarSurfaces}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        {sidebarHeader ? (
          <div className="workspace-shell__sidebar-header">{sidebarHeader}</div>
        ) : (
          <div className="workspace-shell__brand">
            <div>
              <p className="workspace-shell__eyebrow">{t("shell.brand.firstkbPlatform")}</p>
              <h2 className="workspace-shell__brand-title">{brand}</h2>
            </div>
          </div>
        )}

        {surfaceLabel && showSidebarSurfaceMarker ? <div className="workspace-shell__sidebar-surface">{renderSurfaceMarker()}</div> : null}

        {renderSidebarMobileUtilities()}

        {resolvedSidebarNavigationLabel ? (
          <div className="workspace-shell__sidebar-navigation-group">
            <div className="workspace-shell__sidebar-navigation-label">{resolvedSidebarNavigationLabel}</div>
            {renderSidebarNavigation()}
          </div>
        ) : (
          renderSidebarNavigation()
        )}

        {layout === "rail" && railBottom ? (
          <div className="workspace-shell__sidebar-mobile-bottom">{railBottom}</div>
        ) : null}

        {sidebarFooter ? <div className="workspace-shell__footer">{sidebarFooter}</div> : null}
      </div>
    );
  }

  return (
    <AppShell
      className={`workspace-shell workspace-shell--${layout}${isMobileViewport ? " workspace-shell--mobile" : ""}${isSidebarOpen ? " workspace-shell--sidebar-open" : ""}${shellIsSidebarCollapsed ? " workspace-shell--sidebar-collapsed" : ""}${isCollapsedRailHoverPreviewEnabled ? " workspace-shell--hover-preview-enabled" : ""}${isCollapsedRailHoverPreviewVisible ? " workspace-shell--sidebar-preview-open" : ""}`}
    >
      <AppShellSidebar
        className="workspace-shell__sidebar"
        onMouseEnter={isCollapsedRailHoverPreviewEnabled
          ? () => scheduleCollapsedRailHoverPreview(true)
          : undefined}
        onMouseLeave={isCollapsedRailHoverPreviewEnabled
          ? () => scheduleCollapsedRailHoverPreview(false)
          : undefined}
      >
        {renderRailNavigation()}
        {renderSidebarPanel()}
      </AppShellSidebar>

      <button
        aria-label={t("shell.aria.closeNavigation")}
        className="workspace-shell__backdrop"
        onClick={closeSidebarSurfaces}
        type="button"
      />

      <AppShellMain>
        <AppShellHeader className={`workspace-shell__header${isHeaderElevated ? " workspace-shell__header--elevated" : ""}`}>
          <div className="workspace-shell__header-left">
            <button
              aria-label={t("shell.aria.openNavigation")}
              className="workspace-shell__sidebar-toggle"
              onClick={() => {
                clearCollapsedRailHoverPreviewTimeout();
                setIsCollapsedRailHoverPreviewOpen(false);

                setIsSidebarOpen(true);
              }}
              type="button"
            >
              <MenuIcon />
            </button>
            {(headerTitle || headerMeta) ? (
              <div className="workspace-shell__header-copy">
                {surfaceLabel && showHeaderSurfaceMarker ? <div className="workspace-shell__header-surface">{renderSurfaceMarker()}</div> : null}
                {headerTitle ? <h1 className="workspace-shell__header-title">{headerTitle}</h1> : null}
                {headerMeta ? <div className="workspace-shell__header-meta">{headerMeta}</div> : null}
              </div>
            ) : null}
          </div>
          {mobileHeaderBrand ? <div className="workspace-shell__mobile-brand">{mobileHeaderBrand}</div> : null}
          {headerCenter ? <div className="workspace-shell__header-center">{headerCenter}</div> : null}
          {headerActions ? <div className="workspace-shell__header-actions">{headerActions}</div> : null}
        </AppShellHeader>
        {isMobileViewport && (headerTitle || headerMeta) ? (
          <div className={`workspace-shell__mobile-context${headerMeta ? " workspace-shell__mobile-context--with-meta" : ""}`}>
            {surfaceLabel && showHeaderSurfaceMarker ? <div className="workspace-shell__header-surface">{renderSurfaceMarker()}</div> : null}
            {headerTitle ? <h1 className="workspace-shell__header-title">{headerTitle}</h1> : null}
            {headerMeta ? <div className="workspace-shell__header-meta">{headerMeta}</div> : null}
          </div>
        ) : null}
        <AppShellContent className="workspace-shell__content">{children}</AppShellContent>
      </AppShellMain>
    </AppShell>
  );
}

export type {
  WorkspaceNavItem,
  WorkspaceRailItem,
  WorkspaceShellSidebarControls,
  WorkspaceShellLayout,
  WorkspaceShellProps,
  WorkspaceSurfaceTone,
  WorkspaceShellTheme,
};
