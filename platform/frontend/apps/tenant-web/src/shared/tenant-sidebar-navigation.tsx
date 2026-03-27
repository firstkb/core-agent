import { useTranslation } from "@platform/i18n";
import {
  DashboardGridIcon,
  SidebarNav,
  SparkIcon,
  type SidebarNavItem,
} from "@platform/ui-kit";

import { usePublishedNavigationSection } from "../features/published-app";
import {
  getTenantNavigationPath,
  getTenantSidebarActiveItemId,
  publishedRuntimeSectionId,
} from "./navigation";

type TenantSidebarNavigationProps = {
  pathname: string;
  navigate: (path: string) => void;
};

function containsSidebarItem(items: SidebarNavItem[], itemId: string): boolean {
  return items.some((item) => {
    if (item.id === itemId) {
      return true;
    }

    return item.children ? containsSidebarItem(item.children, itemId) : false;
  });
}

export function TenantSidebarNavigation({
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

  const items: SidebarNavItem[] = [
    {
      icon: <DashboardGridIcon />,
      id: "dashboard",
      label: t("tenant.navigation.dashboard.label"),
    },
    {
      ...publishedNavigationSection,
      icon: <SparkIcon />,
    },
  ];
  const activeItemId = getTenantSidebarActiveItemId(pathname);
  const resolvedActiveItemId =
    pathname === "/app" || pathname.startsWith("/app/")
      ? containsSidebarItem(items, activeItemId)
        ? activeItemId
        : publishedRuntimeSectionId
      : activeItemId;

  return (
    <SidebarNav
      activeItemId={resolvedActiveItemId}
      ariaLabel={t("shell.aria.primaryModuleNavigation")}
      className="workspace-shell__sidebar-nav"
      compact
      items={items}
      onActiveItemChange={(itemId) => {
        const path = getTenantNavigationPath(itemId);
        if (path) {
          navigate(path);
        }
      }}
    />
  );
}
