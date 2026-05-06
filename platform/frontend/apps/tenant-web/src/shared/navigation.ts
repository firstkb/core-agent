import {
  getPlatformStudioHeaderMeta,
  getPlatformStudioHeaderTitle,
  isPlatformStudioPath,
} from "../features/platform-studio/platform-studio-route-meta";
import {
  getFormRuntimeHeaderMeta,
  getFormRuntimeHeaderTitle,
  isFormRuntimePath,
} from "../features/form-runtime/form-runtime-route-meta";
import {
  getBusinessTreeHeaderMeta,
  getBusinessTreeHeaderTitle,
  isBusinessTreePagePath,
} from "../features/app-pages/business-tree/business-tree-route-meta";
import {
  getTenantRuntimeNavigationActiveItemId,
  getTenantRuntimeNavigationHeader,
  getTenantRuntimeNavigationTarget,
  type TenantRuntimeNavigationTarget,
} from "./tenant-runtime-navigation";
import type { TenantRuntimeNavigationItem } from "@platform/api-client";

type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

const publishedRuntimeItemIdPrefix = "published-runtime:";

export const publishedRuntimeSectionId = "published-runtime";

export function getPublishedRuntimeItemId(routeKey: string) {
  return `${publishedRuntimeItemIdPrefix}${routeKey}`;
}

export function getPublishedRuntimePath(routeKey: string) {
  return `/app/${encodeURIComponent(routeKey)}`;
}

function getPublishedRuntimeRouteKey(itemId: string) {
  if (!itemId.startsWith(publishedRuntimeItemIdPrefix)) {
    return null;
  }

  return itemId.slice(publishedRuntimeItemIdPrefix.length);
}

function getPublishedRuntimeRouteKeyFromPathname(pathname: string) {
  if (pathname === "/app") {
    return null;
  }

  if (!pathname.startsWith("/app/")) {
    return null;
  }

  const [rawRouteKey] = pathname.slice("/app/".length).split("/");
  if (!rawRouteKey) {
    return null;
  }

  try {
    return decodeURIComponent(rawRouteKey);
  } catch {
    return rawRouteKey;
  }
}

export function getTenantSidebarActiveItemId(
  pathname: string,
  runtimeNavigationItems: ReadonlyArray<TenantRuntimeNavigationItem> = [],
) {
  if (isPlatformStudioPath(pathname)) {
    return "";
  }

  const runtimeNavigationActiveItemId =
    getTenantRuntimeNavigationActiveItemId(pathname, runtimeNavigationItems);
  if (runtimeNavigationActiveItemId) {
    return runtimeNavigationActiveItemId;
  }

  if (isFormRuntimePath(pathname)) {
    return "";
  }

  if (isBusinessTreePagePath(pathname)) {
    return "";
  }

  const publishedRouteKey = getPublishedRuntimeRouteKeyFromPathname(pathname);
  if (publishedRouteKey) {
    return getPublishedRuntimeItemId(publishedRouteKey);
  }

  if (pathname === "/app") {
    return publishedRuntimeSectionId;
  }

  if (pathname === "/dashboard") {
    return "dashboard";
  }

  return "dashboard";
}

export function getTenantNavigationPath(itemId: string) {
  const publishedRouteKey = getPublishedRuntimeRouteKey(itemId);
  if (publishedRouteKey) {
    return getPublishedRuntimePath(publishedRouteKey);
  }

  switch (itemId) {
    case "dashboard":
      return "/dashboard";
    default:
      return null;
  }
}

export function getTenantNavigationTarget(
  itemId: string,
  runtimeNavigationItems: ReadonlyArray<TenantRuntimeNavigationItem> = [],
): TenantRuntimeNavigationTarget | null {
  const runtimeNavigationTarget = getTenantRuntimeNavigationTarget(runtimeNavigationItems, itemId);
  if (runtimeNavigationTarget) {
    return runtimeNavigationTarget;
  }

  const path = getTenantNavigationPath(itemId);
  return path
    ? {
        kind: "internal",
        path,
      }
    : null;
}

export function getTenantShellHeaderTitle(
  translate: TranslateFunction,
  pathname: string,
  runtimeNavigationItems: ReadonlyArray<TenantRuntimeNavigationItem> = [],
) {
  const platformStudioHeaderTitle = getPlatformStudioHeaderTitle(translate, pathname);
  if (platformStudioHeaderTitle) {
    return platformStudioHeaderTitle;
  }

  const runtimeNavigationHeader = getTenantRuntimeNavigationHeader(pathname, runtimeNavigationItems);
  if (runtimeNavigationHeader) {
    return runtimeNavigationHeader.title;
  }

  const formRuntimeHeaderTitle = getFormRuntimeHeaderTitle(translate, pathname);
  if (formRuntimeHeaderTitle) {
    return formRuntimeHeaderTitle;
  }

  if (isBusinessTreePagePath(pathname)) {
    return getBusinessTreeHeaderTitle();
  }

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return translate("tenant.navigation.runtime.headerTitle");
  }

  return translate("tenant.navigation.dashboard.headerTitle");
}

export function getTenantShellHeaderMeta(
  translate: TranslateFunction,
  pathname: string,
  runtimeNavigationItems: ReadonlyArray<TenantRuntimeNavigationItem> = [],
) {
  const platformStudioHeaderMeta = getPlatformStudioHeaderMeta(translate, pathname);
  if (platformStudioHeaderMeta) {
    return platformStudioHeaderMeta;
  }

  const runtimeNavigationHeader = getTenantRuntimeNavigationHeader(pathname, runtimeNavigationItems);
  if (runtimeNavigationHeader) {
    return runtimeNavigationHeader.breadcrumb;
  }

  const formRuntimeHeaderMeta = getFormRuntimeHeaderMeta(translate, pathname);
  if (formRuntimeHeaderMeta) {
    return formRuntimeHeaderMeta;
  }

  if (isBusinessTreePagePath(pathname)) {
    return getBusinessTreeHeaderMeta();
  }

  return null;
}
