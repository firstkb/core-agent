import type {
  TenantFavoriteShortcut,
  TenantRuntimeCreateAction,
  TenantRuntimeNavigationItem,
} from "@platform/api-client";

import type { TenantRailUtilityPanel } from "../tenant-rail-utility-sheet/tenant-rail-utility-sheet";

type TenantWorkspaceSearchUtilityIcon = "dashboard" | "favorites" | "help" | "platform-studio" | "tasks";

type TenantWorkspaceSearchUtility = {
  id: string;
  description: string;
  icon: TenantWorkspaceSearchUtilityIcon;
  label: string;
  panel?: TenantRailUtilityPanel;
  path?: string;
};

type SearchResultGroup = "create" | "favorites" | "navigation" | "utilities";

type SearchResult = {
  badge: string;
  group: SearchResultGroup;
  id: string;
  searchText: string;
  subtitle: string;
  title: string;
  externalUrl?: string;
  path?: string;
  utilityPanel?: TenantRailUtilityPanel;
  utilityIcon?: TenantWorkspaceSearchUtilityIcon;
};

const searchGroups: Array<{
  key: SearchResultGroup;
}> = [
  { key: "create" },
  { key: "navigation" },
  { key: "favorites" },
  { key: "utilities" },
];

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function joinBreadcrumb(values: readonly string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join(" / ");
}

function flattenNavigationItems(items: readonly TenantRuntimeNavigationItem[]) {
  const results: SearchResult[] = [];

  function visit(item: TenantRuntimeNavigationItem) {
    const breadcrumb = joinBreadcrumb(item.breadcrumb);
    const subtitle = breadcrumb || item.type.split("_").join(" ");
    if (item.path || item.externalUrl) {
      results.push({
        badge: item.externalUrl ? "Link" : item.targetType === "app_page" ? "Page" : "View",
        externalUrl: item.externalUrl,
        group: "navigation",
        id: `navigation:${item.id}`,
        path: item.path,
        searchText: normalizeSearchText(`${item.label} ${subtitle} ${item.targetType ?? ""}`),
        subtitle,
        title: item.label,
      });
    }

    item.children.forEach(visit);
  }

  items.forEach(visit);
  return results;
}

function buildSearchResults({
  createActions,
  favorites,
  navigationItems,
  utilities,
}: {
  createActions: readonly TenantRuntimeCreateAction[];
  favorites: readonly TenantFavoriteShortcut[];
  navigationItems: readonly TenantRuntimeNavigationItem[];
  utilities: readonly TenantWorkspaceSearchUtility[];
}) {
  const createResults: SearchResult[] = createActions.map((action) => {
    const subtitle = joinBreadcrumb(action.breadcrumb) || "Form view";
    return {
      badge: "New",
      group: "create",
      id: `create:${action.id}`,
      path: action.path,
      searchText: normalizeSearchText(`${action.label} ${subtitle} create new`),
      subtitle,
      title: action.label,
    };
  });

  const favoriteResults: SearchResult[] = favorites.map((favorite) => ({
    badge: "Favorite",
    group: "favorites",
    id: `favorite:${favorite.id}`,
    path: favorite.route_path,
    searchText: normalizeSearchText(`${favorite.title} ${favorite.model_title} favorite`),
    subtitle: favorite.model_title,
    title: favorite.title,
  }));

  const utilityResults: SearchResult[] = utilities.map((utility) => ({
    badge: "Utility",
    group: "utilities",
    id: `utility:${utility.id}`,
    path: utility.path,
    searchText: normalizeSearchText(`${utility.label} ${utility.description}`),
    subtitle: utility.description,
    title: utility.label,
    utilityIcon: utility.icon,
    utilityPanel: utility.panel,
  }));

  return [
    ...createResults,
    ...flattenNavigationItems(navigationItems),
    ...favoriteResults,
    ...utilityResults,
  ];
}

export {
  buildSearchResults,
  normalizeSearchText,
  searchGroups,
};
export type {
  SearchResult,
  SearchResultGroup,
  TenantWorkspaceSearchUtility,
  TenantWorkspaceSearchUtilityIcon,
};
