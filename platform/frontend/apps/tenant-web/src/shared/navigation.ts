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

export function getTenantSidebarActiveItemId(pathname: string) {
  if (isPlatformStudioPath(pathname)) {
    return "";
  }

  if (isFormRuntimePath(pathname)) {
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

export function getTenantShellHeaderTitle(translate: TranslateFunction, pathname: string) {
  const platformStudioHeaderTitle = getPlatformStudioHeaderTitle(translate, pathname);
  if (platformStudioHeaderTitle) {
    return platformStudioHeaderTitle;
  }

  const formRuntimeHeaderTitle = getFormRuntimeHeaderTitle(translate, pathname);
  if (formRuntimeHeaderTitle) {
    return formRuntimeHeaderTitle;
  }

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return translate("tenant.navigation.runtime.headerTitle");
  }

  return translate("tenant.navigation.dashboard.headerTitle");
}

export function getTenantShellHeaderMeta(translate: TranslateFunction, pathname: string) {
  const platformStudioHeaderMeta = getPlatformStudioHeaderMeta(translate, pathname);
  if (platformStudioHeaderMeta) {
    return platformStudioHeaderMeta;
  }

  const formRuntimeHeaderMeta = getFormRuntimeHeaderMeta(translate, pathname);
  if (formRuntimeHeaderMeta) {
    return formRuntimeHeaderMeta;
  }

  return null;
}
