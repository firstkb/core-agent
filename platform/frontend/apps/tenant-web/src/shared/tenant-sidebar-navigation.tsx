import { useTranslation } from "@platform/i18n";
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  CameraIcon,
  CarFrontIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DashboardGridIcon,
  ClipboardCheckIcon,
  DocumentListIcon,
  FlameIcon,
  FolderIcon,
  FormIcon,
  HardHatIcon,
  LayersIcon,
  MapPinIcon,
  PulseLineIcon,
  RoutePathIcon,
  SidebarNav,
  SlidersIcon,
  ShieldKeyIcon,
  SparkIcon,
  ToolboxIcon,
  type SidebarNavItem,
  UsersIcon,
  WarningTriangleIcon,
  WrenchIcon,
} from "@platform/ui-kit";
import type { TenantRuntimeNavigationItem } from "@platform/api-client";

import { usePublishedNavigationSection } from "../features/published-app";
import {
  getTenantNavigationTarget,
  getTenantSidebarActiveItemId,
  publishedRuntimeSectionId,
} from "./navigation";

type TenantSidebarNavigationProps = {
  onAction?: () => void;
  runtimeNavigationItems?: ReadonlyArray<TenantRuntimeNavigationItem>;
  pathname: string;
  navigate: (path: string) => void;
};

export type TenantSidebarNavigationSection = {
  id: string;
  items: SidebarNavItem[];
  label?: string;
};

const runtimeMenuTitleType = "menu_title";

function containsSidebarItem(items: SidebarNavItem[], itemId: string): boolean {
  return items.some((item) => {
    if (item.id === itemId) {
      return true;
    }

    return item.children ? containsSidebarItem(item.children, itemId) : false;
  });
}

function containsSidebarSectionItem(
  sections: ReadonlyArray<TenantSidebarNavigationSection>,
  itemId: string,
): boolean {
  return sections.some((section) => containsSidebarItem(section.items, itemId));
}

function getRuntimeNavigationIcon(iconKey: string | undefined) {
  switch (iconKey) {
    case "none":
    case undefined:
      return null;
    case "briefcase":
      return <BriefcaseIcon />;
    case "building":
      return <BuildingOfficeIcon />;
    case "camera":
      return <CameraIcon />;
    case "car":
      return <CarFrontIcon />;
    case "chart":
      return <ChartBarIcon />;
    case "clipboard-check":
      return <ClipboardCheckIcon />;
    case "check-circle":
      return <CheckCircleIcon />;
    case "document":
      return <DocumentListIcon />;
    case "fire":
      return <FlameIcon />;
    case "folder":
      return <FolderIcon />;
    case "form":
      return <FormIcon />;
    case "hard-hat":
      return <HardHatIcon />;
    case "layers":
      return <LayersIcon />;
    case "map-pin":
      return <MapPinIcon />;
    case "pulse":
      return <PulseLineIcon />;
    case "route":
      return <RoutePathIcon />;
    case "settings":
      return <SlidersIcon />;
    case "shield":
      return <ShieldKeyIcon />;
    case "toolbox":
      return <ToolboxIcon />;
    case "users":
      return <UsersIcon />;
    case "warning":
      return <WarningTriangleIcon />;
    case "wrench":
      return <WrenchIcon />;
    default:
      return null;
  }
}

function isRuntimeMenuTitleItem(item: TenantRuntimeNavigationItem) {
  return item.type === runtimeMenuTitleType;
}

function runtimeNavigationItemContainsId(item: TenantRuntimeNavigationItem, itemId: string): boolean {
  if (item.id === itemId) {
    return true;
  }

  return item.children.some((childItem) => runtimeNavigationItemContainsId(childItem, itemId));
}

function mapRuntimeNavigationItem(
  item: TenantRuntimeNavigationItem,
  activeItemId: string,
): SidebarNavItem | null {
  if (isRuntimeMenuTitleItem(item)) {
    return null;
  }

  const children = mapRuntimeNavigationItems(item.children, activeItemId);
  const icon = getRuntimeNavigationIcon(item.icon);
  const isOpenForActiveItem =
    Boolean(activeItemId) &&
    item.children.some((childItem) => runtimeNavigationItemContainsId(childItem, activeItemId));

  return {
    children: children.length > 0 ? children : undefined,
    defaultOpen: isOpenForActiveItem,
    disabled: !item.path && !item.externalUrl && children.length === 0,
    icon,
    id: item.id,
    label: item.label,
  };
}

function mapRuntimeNavigationItems(
  items: ReadonlyArray<TenantRuntimeNavigationItem>,
  activeItemId: string,
): SidebarNavItem[] {
  return items.flatMap((item) => {
    const sidebarItem = mapRuntimeNavigationItem(item, activeItemId);

    return sidebarItem ? [sidebarItem] : [];
  });
}

export function buildTenantRuntimeSidebarSections(
  items: ReadonlyArray<TenantRuntimeNavigationItem>,
  activeItemId = "",
): TenantSidebarNavigationSection[] {
  const sections: TenantSidebarNavigationSection[] = [];
  let currentSection: TenantSidebarNavigationSection = {
    id: "runtime-section:root",
    items: [],
  };

  function flushCurrentSection() {
    if (currentSection.items.length === 0) {
      return;
    }

    sections.push(currentSection);
  }

  for (const item of items) {
    if (isRuntimeMenuTitleItem(item)) {
      flushCurrentSection();
      currentSection = {
        id: `runtime-section:${item.id}`,
        items: [],
        label: item.label,
      };
      continue;
    }

    const sidebarItem = mapRuntimeNavigationItem(item, activeItemId);
    if (sidebarItem) {
      currentSection.items.push(sidebarItem);
    }
  }

  flushCurrentSection();

  return sections;
}

export function TenantSidebarNavigation({
  onAction,
  runtimeNavigationItems = [],
  pathname,
  navigate,
}: TenantSidebarNavigationProps) {
  const { t } = useTranslation();
  const publishedNavigationSection = usePublishedNavigationSection({
    emptyLabel: t("tenant.navigation.runtime.emptyLabel"),
    errorLabel: t("tenant.navigation.runtime.errorLabel"),
    loadingLabel: t("tenant.navigation.runtime.loadingLabel"),
    policyUnavailableLabel: t("tenant.navigation.runtime.policyUnavailableLabel"),
    sectionLabel: t("tenant.navigation.runtime.label"),
  });

  const dashboardItems: SidebarNavItem[] = [
    {
      icon: <DashboardGridIcon />,
      id: "dashboard",
      label: t("tenant.navigation.dashboard.label"),
    },
  ];
  const activeItemId = getTenantSidebarActiveItemId(pathname, runtimeNavigationItems);
  const runtimeSidebarSections = buildTenantRuntimeSidebarSections(runtimeNavigationItems, activeItemId);
  const fallbackSidebarSections: TenantSidebarNavigationSection[] = [{
    id: "runtime-section:published-runtime",
    items: [{
      ...publishedNavigationSection,
      icon: <SparkIcon />,
    }],
  }];
  const sidebarSections =
    runtimeSidebarSections.length > 0 ? runtimeSidebarSections : fallbackSidebarSections;
  const resolvedActiveItemId =
    pathname === "/app" || pathname.startsWith("/app/")
      ? containsSidebarItem(dashboardItems, activeItemId) ||
        containsSidebarSectionItem(sidebarSections, activeItemId)
        ? activeItemId
        : publishedRuntimeSectionId
      : activeItemId;

  function handleActiveItemChange(itemId: string) {
    const target = getTenantNavigationTarget(itemId, runtimeNavigationItems);
    if (!target) {
      return;
    }

    if (target.kind === "external") {
      window.open(target.url, "_blank", "noopener,noreferrer");
      onAction?.();
      return;
    }

    if (target.path) {
      navigate(target.path);
      onAction?.();
    }
  }

  return (
    <div className="workspace-shell__sidebar-nav workspace-shell__sidebar-nav-stack">
      <SidebarNav
        activeItemId={resolvedActiveItemId}
        ariaLabel={t("shell.aria.primaryModuleNavigation")}
        className="workspace-shell__sidebar-section-nav"
        compact
        items={dashboardItems}
        onActiveItemChange={handleActiveItemChange}
      />
      {sidebarSections.map((section) => (
        <section className="workspace-shell__sidebar-nav-section" key={section.id}>
          {section.label ? (
            <div className="workspace-shell__sidebar-nav-section-heading">
              {section.label}
            </div>
          ) : null}
          <SidebarNav
            activeItemId={resolvedActiveItemId}
            ariaLabel={section.label ?? t("shell.aria.primaryModuleNavigation")}
            className="workspace-shell__sidebar-section-nav"
            compact
            items={section.items}
            onActiveItemChange={handleActiveItemChange}
          />
        </section>
      ))}
    </div>
  );
}
