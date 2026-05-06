import {
  matchPath,
  type PathMatch,
} from "react-router-dom";

import {
  getCachedFormsPlaceholderModels,
  getFormsPlaceholderModel,
  getFormsPlaceholderView,
} from "./forms/forms-placeholder-data";

type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

const platformStudioRoutePatterns = {
  forms: "/builder/forms",
  legacyObjectView: "/builder/forms/:objectId/views/:screenId",
  legacyObjectScreen: "/builder/forms/:objectId/screens/:screenId",
  legacyView: "/builder/forms/:modelId/screens/:viewId",
  model: "/builder/forms/:modelId",
  navigation: "/builder/navigation",
  previewRuntimeView: "/app/platform-studio/forms/:modelId/views/:viewId",
  root: "/builder",
  view: "/builder/forms/:modelId/views/:viewId",
} as const;

export const platformStudioPaths = {
  forms: platformStudioRoutePatterns.forms,
  navigation: platformStudioRoutePatterns.navigation,
  model(modelId: string) {
    return `${platformStudioPaths.forms}/${encodeURIComponent(modelId)}`;
  },
  previewRuntimeView(modelId: string, viewId: string) {
    return `/app/platform-studio/forms/${encodeURIComponent(modelId)}/views/${encodeURIComponent(viewId)}`;
  },
  root: platformStudioRoutePatterns.root,
  view(modelId: string, viewId: string) {
    return `${platformStudioPaths.model(modelId)}/views/${encodeURIComponent(viewId)}`;
  },
  object(objectId: string) {
    return platformStudioPaths.model(objectId);
  },
  screen(objectId: string, screenId: string) {
    return platformStudioPaths.view(objectId, screenId);
  },
} as const;

type PlatformStudioRouteMeta =
  | {
      kind: "root" | "forms" | "navigation";
    }
  | {
      kind: "model";
      modelId: string;
      modelLabel: string;
    }
  | {
      kind: "view";
      modelId: string;
      modelLabel: string;
      viewId: string;
      viewLabel: string;
    };

export function getPlatformStudioRouteMeta(pathname: string): PlatformStudioRouteMeta | null {
  if (pathname === platformStudioRoutePatterns.root) {
    return { kind: "root" };
  }

  if (pathname === platformStudioRoutePatterns.forms) {
    return { kind: "forms" };
  }

  if (pathname === platformStudioRoutePatterns.navigation) {
    return { kind: "navigation" };
  }

  const canonicalViewMatch = matchPath(platformStudioRoutePatterns.view, pathname) as PathMatch<"modelId" | "viewId"> | null;
  const previewRuntimeViewMatch = matchPath(platformStudioRoutePatterns.previewRuntimeView, pathname) as PathMatch<"modelId" | "viewId"> | null;
  const legacyViewMatch = matchPath(platformStudioRoutePatterns.legacyView, pathname) as PathMatch<"modelId" | "viewId"> | null;
  const legacyObjectViewMatch = matchPath(platformStudioRoutePatterns.legacyObjectView, pathname) as PathMatch<"objectId" | "screenId"> | null;
  const legacyObjectScreenMatch = matchPath(platformStudioRoutePatterns.legacyObjectScreen, pathname) as PathMatch<"objectId" | "screenId"> | null;
  if (canonicalViewMatch || previewRuntimeViewMatch || legacyViewMatch || legacyObjectViewMatch || legacyObjectScreenMatch) {
    const modelId =
      canonicalViewMatch?.params.modelId ??
      previewRuntimeViewMatch?.params.modelId ??
      legacyViewMatch?.params.modelId ??
      legacyObjectViewMatch?.params.objectId ??
      legacyObjectScreenMatch?.params.objectId ??
      "";
    const viewId =
      canonicalViewMatch?.params.viewId ??
      previewRuntimeViewMatch?.params.viewId ??
      legacyViewMatch?.params.viewId ??
      legacyObjectViewMatch?.params.screenId ??
      legacyObjectScreenMatch?.params.screenId ??
      "";
    const cachedModels = getCachedFormsPlaceholderModels();
    const model = getFormsPlaceholderModel(modelId, cachedModels);
    const view = getFormsPlaceholderView(modelId, viewId, cachedModels);

    return {
      kind: "view",
      modelId,
      modelLabel: model?.title ?? "",
      viewId,
      viewLabel: view?.title ?? "",
    };
  }

  const modelMatch = matchPath(platformStudioRoutePatterns.model, pathname) as PathMatch<"modelId"> | null;
  if (modelMatch) {
    const modelId = modelMatch.params.modelId ?? "";
    const model = getFormsPlaceholderModel(modelId, getCachedFormsPlaceholderModels());

    return {
      kind: "model",
      modelId,
      modelLabel: model?.title ?? "",
    };
  }

  return null;
}

export function getPlatformStudioHeaderTitle(translate: TranslateFunction, pathname: string) {
  const routeMeta = getPlatformStudioRouteMeta(pathname);
  if (!routeMeta) {
    return null;
  }

  switch (routeMeta.kind) {
    case "root":
      return translate("tenant.navigation.platformStudio.headerTitle");
    case "forms":
    case "model":
      return translate("tenant.navigation.platformStudio.forms.headerTitle");
    case "navigation":
      return translate("tenant.navigation.platformStudio.navigation.headerTitle");
    case "view":
      return routeMeta.viewLabel || translate("tenant.navigation.platformStudio.forms.headerTitle");
  }
}

export function getPlatformStudioHeaderMeta(translate: TranslateFunction, pathname: string) {
  const routeMeta = getPlatformStudioRouteMeta(pathname);
  if (!routeMeta) {
    return null;
  }

  switch (routeMeta.kind) {
    case "root":
      return translate("tenant.navigation.platformStudio.headerMeta");
    case "forms":
      return translate("tenant.navigation.platformStudio.forms.headerMeta");
    case "navigation":
      return translate("tenant.navigation.platformStudio.navigation.headerMeta");
    case "model":
      if (!routeMeta.modelLabel) {
        return translate("tenant.navigation.platformStudio.forms.headerMeta");
      }

      return translate("tenant.navigation.platformStudio.forms.modelHeaderMeta", {
        label: routeMeta.modelLabel,
      });
    case "view":
      if (!routeMeta.modelLabel || !routeMeta.viewLabel) {
        return translate("tenant.navigation.platformStudio.forms.headerMeta");
      }

      return translate("tenant.navigation.platformStudio.forms.viewHeaderMeta", {
        modelLabel: routeMeta.modelLabel,
        viewLabel: routeMeta.viewLabel,
      });
  }
}

export function isPlatformStudioPath(pathname: string) {
  return getPlatformStudioRouteMeta(pathname) !== null;
}
