import type { TenantRuntimeNavigationItem } from "@platform/api-client";

export const tenantRuntimeNavigationRefreshEvent = "tenant-runtime-navigation-refresh";

export type TenantRuntimeNavigationTarget =
  | {
      kind: "external";
      url: string;
    }
  | {
      kind: "internal";
      path: string;
    };

export type TenantRuntimeNavigationHeader = {
  breadcrumb: string;
  title: string;
};

function walkRuntimeNavigationItems(
  items: ReadonlyArray<TenantRuntimeNavigationItem>,
  visit: (item: TenantRuntimeNavigationItem) => void,
) {
  for (const item of items) {
    visit(item);
    walkRuntimeNavigationItems(item.children, visit);
  }
}

export function findTenantRuntimeNavigationItem(
  items: ReadonlyArray<TenantRuntimeNavigationItem>,
  itemId: string,
): TenantRuntimeNavigationItem | null {
  let match: TenantRuntimeNavigationItem | null = null;
  walkRuntimeNavigationItems(items, (item) => {
    if (!match && item.id === itemId) {
      match = item;
    }
  });
  return match;
}

function pathnameMatchesRuntimePath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function findTenantRuntimeNavigationItemByPath(
  items: ReadonlyArray<TenantRuntimeNavigationItem>,
  pathname: string,
): TenantRuntimeNavigationItem | null {
  let match: TenantRuntimeNavigationItem | null = null;
  walkRuntimeNavigationItems(items, (item) => {
    if (!item.path || !pathnameMatchesRuntimePath(pathname, item.path)) {
      return;
    }

    if (!match || item.path.length > (match.path?.length ?? 0)) {
      match = item;
    }
  });
  return match;
}

export function getTenantRuntimeNavigationTarget(
  items: ReadonlyArray<TenantRuntimeNavigationItem>,
  itemId: string,
): TenantRuntimeNavigationTarget | null {
  const item = findTenantRuntimeNavigationItem(items, itemId);
  if (!item) {
    return null;
  }

  if (item.externalUrl) {
    return {
      kind: "external",
      url: item.externalUrl,
    };
  }

  if (item.path) {
    return {
      kind: "internal",
      path: item.path,
    };
  }

  return null;
}

export function getTenantRuntimeNavigationActiveItemId(
  pathname: string,
  items: ReadonlyArray<TenantRuntimeNavigationItem>,
) {
  return findTenantRuntimeNavigationItemByPath(items, pathname)?.id ?? "";
}

export function getTenantRuntimeNavigationHeader(
  pathname: string,
  items: ReadonlyArray<TenantRuntimeNavigationItem>,
): TenantRuntimeNavigationHeader | null {
  const item = findTenantRuntimeNavigationItemByPath(items, pathname);
  if (!item) {
    return null;
  }

  return {
    breadcrumb: item.breadcrumb.length > 0 ? item.breadcrumb.join(" / ") : item.label,
    title: item.label,
  };
}
