import { matchPath } from "react-router-dom";

import {
  getFormsPlaceholderObject,
  getFormsPlaceholderScreen,
} from "./forms/forms-placeholder-data";

type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

const platformBuilderRoutePatterns = {
  forms: "/builder/forms",
  object: "/builder/forms/:objectId",
  root: "/builder",
  view: "/builder/forms/:objectId/views/:screenId",
  legacyScreen: "/builder/forms/:objectId/screens/:screenId",
} as const;

export const platformBuilderPaths = {
  forms: platformBuilderRoutePatterns.forms,
  object(objectId: string) {
    return `${platformBuilderPaths.forms}/${encodeURIComponent(objectId)}`;
  },
  root: platformBuilderRoutePatterns.root,
  screen(objectId: string, screenId: string) {
    return `${platformBuilderPaths.object(objectId)}/views/${encodeURIComponent(screenId)}`;
  },
  view(objectId: string, viewId: string) {
    return `${platformBuilderPaths.object(objectId)}/views/${encodeURIComponent(viewId)}`;
  },
} as const;

type PlatformBuilderRouteMeta =
  | {
      kind: "root" | "forms";
    }
  | {
      kind: "object";
      objectId: string;
      objectLabel: string;
    }
  | {
      kind: "screen";
      objectId: string;
      objectLabel: string;
      screenId: string;
      screenLabel: string;
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

export function getPlatformBuilderRouteMeta(pathname: string): PlatformBuilderRouteMeta | null {
  if (pathname === platformBuilderRoutePatterns.root) {
    return { kind: "root" };
  }

  if (pathname === platformBuilderRoutePatterns.forms) {
    return { kind: "forms" };
  }

  const screenMatch =
    matchPath(platformBuilderRoutePatterns.view, pathname) ??
    matchPath(platformBuilderRoutePatterns.legacyScreen, pathname);
  if (screenMatch) {
    const objectId = screenMatch.params.objectId ?? "";
    const screenId = screenMatch.params.screenId ?? "";
    const object = getFormsPlaceholderObject(objectId);
    const screen = getFormsPlaceholderScreen(objectId, screenId);

    return {
      kind: "screen",
      objectId,
      objectLabel: object?.title ?? formatRouteLabel(objectId),
      screenId,
      screenLabel: screen?.title ?? formatRouteLabel(screenId),
    };
  }

  const objectMatch = matchPath(platformBuilderRoutePatterns.object, pathname);
  if (objectMatch) {
    const objectId = objectMatch.params.objectId ?? "";
    const object = getFormsPlaceholderObject(objectId);

    return {
      kind: "object",
      objectId,
      objectLabel: object?.title ?? formatRouteLabel(objectId),
    };
  }

  return null;
}

export function getPlatformBuilderHeaderTitle(translate: TranslateFunction, pathname: string) {
  const routeMeta = getPlatformBuilderRouteMeta(pathname);
  if (!routeMeta) {
    return null;
  }

  switch (routeMeta.kind) {
    case "root":
      return translate("tenant.navigation.platformBuilder.headerTitle");
    case "forms":
    case "object":
      return translate("tenant.navigation.platformBuilder.forms.headerTitle");
    case "screen":
      return routeMeta.screenLabel;
  }
}

export function getPlatformBuilderHeaderMeta(translate: TranslateFunction, pathname: string) {
  const routeMeta = getPlatformBuilderRouteMeta(pathname);
  if (!routeMeta) {
    return null;
  }

  switch (routeMeta.kind) {
    case "root":
      return translate("tenant.navigation.platformBuilder.headerMeta");
    case "forms":
      return translate("tenant.navigation.platformBuilder.forms.headerMeta");
    case "object":
      return translate("tenant.navigation.platformBuilder.forms.objectHeaderMeta", {
        label: routeMeta.objectLabel,
      });
    case "screen":
      return translate("tenant.navigation.platformBuilder.forms.screenHeaderMeta", {
        objectLabel: routeMeta.objectLabel,
        screenLabel: routeMeta.screenLabel,
      });
  }
}

export function isPlatformBuilderPath(pathname: string) {
  return getPlatformBuilderRouteMeta(pathname) !== null;
}
