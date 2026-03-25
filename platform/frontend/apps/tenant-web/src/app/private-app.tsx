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
import { getAppBuildMetadata, WorkspaceShell } from "@platform/app-shell";
import { getDemoSession, useAuth } from "@platform/auth-core";

import { offlineSyncStatus } from "../offline/sync-status";
import { TenantDashboardPage } from "../pages/dashboard/page";
import { tenantNavigation } from "../shared/navigation";
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
  const activeThemeLabel = themeMode === "dark" ? "Dark" : "Light";

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
        <MenuItem>My profile</MenuItem>
        <MenuItem>Preferences</MenuItem>
        <MenuSeparator />
        <MenuItem onClick={() => setThemeMode((value) => (value === "dark" ? "light" : "dark"))}>
          <>
            <span>Theme switcher</span>
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
          Sign out
        </MenuItem>
      </>
    );
  }

  return (
    <>
      <WorkspaceShell
        brand="Tenant Workspace"
        layout="rail"
        showHeaderSurfaceMarker={false}
        showSidebarSurfaceMarker={false}
        surfaceIcon={<BuildingOfficeIcon />}
        surfaceLabel="Workspace"
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
                aria-label="Open user menu"
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
        railBrandLabel="Dashboard"
        railBrandOnSelect={() => scrollToDashboardSection()}
        railMark={<DashboardGridIcon />}
        railUtilities={[
          {
            badge: String(offlineSyncStatus.queuedActions),
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
        sidebarFooter={
          <Menu align="end">
            <MenuTrigger>
              <button
                aria-label="Open user menu"
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
        navigation={tenantNavigation.map((item) => ({
          ...item,
          onNavigate: () => scrollToDashboardSection(),
        }))}
        headerTitle="Dashboard"
        headerCenter={
          <button
            aria-label="Open workspace search"
            className="workspace-shell__header-search"
            onClick={() => scrollToDashboardSection()}
            title="Workspace command search will be wired in a later step."
            type="button"
          >
            <span className="workspace-shell__header-search-copy">
              <SearchIcon className="workspace-shell__header-search-icon" />
              <span className="workspace-shell__header-search-label">Search or run command</span>
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
                  aria-label="Open workspace actions"
                  className="workspace-shell__header-icon-button"
                  type="button"
                >
                  <PlusIcon />
                </button>
              </MenuTrigger>
              <MenuContent className="workspace-shell__header-menu">
                <MenuLabel>Workspace Actions</MenuLabel>
                <MenuItem onClick={() => scrollToDashboardSection()}>Open dashboard</MenuItem>
                <MenuItem onClick={() => setUtilityPanel("tasks")}>Open tasks center</MenuItem>
                <MenuItem onClick={() => setUtilityPanel("favorites")}>Review saved mockups</MenuItem>
              </MenuContent>
            </Menu>

            <Menu align="end">
              <MenuTrigger>
                <button
                  aria-label="Open notifications"
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
                <MenuLabel>Notifications</MenuLabel>
                <MenuItem onClick={() => setUtilityPanel("tasks")}>
                  Dashboard placeholder set refreshed
                </MenuItem>
                <MenuItem onClick={() => setUtilityPanel("help")}>
                  Loading state guidance available
                </MenuItem>
                <MenuItem onClick={() => setUtilityPanel("tasks")}>
                  {offlineSyncStatus.queuedActions} operator notes still pinned
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
