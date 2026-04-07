import {
  matchPath,
  type PathMatch,
} from "react-router-dom";

import {
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
  root: "/builder",
  view: "/builder/forms/:modelId/views/:viewId",
} as const;

export const platformStudioPaths = {
  forms: platformStudioRoutePatterns.forms,
  model(modelId: string) {
    return `${platformStudioPaths.forms}/${encodeURIComponent(modelId)}`;
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
      kind: "root" | "forms";
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

function formatRouteLabel(value: string | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.slice(0, 1).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getPlatformStudioRouteMeta(pathname: string): PlatformStudioRouteMeta | null {
  if (pathname === platformStudioRoutePatterns.root) {
    return { kind: "root" };
  }

  if (pathname === platformStudioRoutePatterns.forms) {
    return { kind: "forms" };
  }

  const canonicalViewMatch = matchPath(platformStudioRoutePatterns.view, pathname) as PathMatch<"modelId" | "viewId"> | null;
  const legacyViewMatch = matchPath(platformStudioRoutePatterns.legacyView, pathname) as PathMatch<"modelId" | "viewId"> | null;
  const legacyObjectViewMatch = matchPath(platformStudioRoutePatterns.legacyObjectView, pathname) as PathMatch<"objectId" | "screenId"> | null;
  const legacyObjectScreenMatch = matchPath(platformStudioRoutePatterns.legacyObjectScreen, pathname) as PathMatch<"objectId" | "screenId"> | null;
  if (canonicalViewMatch || legacyViewMatch || legacyObjectViewMatch || legacyObjectScreenMatch) {
    const modelId =
      canonicalViewMatch?.params.modelId ??
      legacyViewMatch?.params.modelId ??
      legacyObjectViewMatch?.params.objectId ??
      legacyObjectScreenMatch?.params.objectId ??
      "";
    const viewId =
      canonicalViewMatch?.params.viewId ??
      legacyViewMatch?.params.viewId ??
      legacyObjectViewMatch?.params.screenId ??
      legacyObjectScreenMatch?.params.screenId ??
      "";
    const model = getFormsPlaceholderModel(modelId);
    const view = getFormsPlaceholderView(modelId, viewId);

    return {
      kind: "view",
      modelId,
      modelLabel: model?.title ?? formatRouteLabel(modelId),
      viewId,
      viewLabel: view?.title ?? formatRouteLabel(viewId),
    };
  }

  const modelMatch = matchPath(platformStudioRoutePatterns.model, pathname) as PathMatch<"modelId"> | null;
  if (modelMatch) {
    const modelId = modelMatch.params.modelId ?? "";
    const model = getFormsPlaceholderModel(modelId);

    return {
      kind: "model",
      modelId,
      modelLabel: model?.title ?? formatRouteLabel(modelId),
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
    case "view":
      return routeMeta.viewLabel;
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
    case "model":
      return translate("tenant.navigation.platformStudio.forms.modelHeaderMeta", {
        label: routeMeta.modelLabel,
      });
    case "view":
      return translate("tenant.navigation.platformStudio.forms.viewHeaderMeta", {
        modelLabel: routeMeta.modelLabel,
        viewLabel: routeMeta.viewLabel,
      });
  }
}

export function isPlatformStudioPath(pathname: string) {
  return getPlatformStudioRouteMeta(pathname) !== null;
}
