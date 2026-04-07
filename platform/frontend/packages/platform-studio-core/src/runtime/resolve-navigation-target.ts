import type { NavigationTarget } from "../contracts/navigation";
import type { PublishedManifest } from "../contracts/publish";
import type { ViewDefinition } from "../contracts/view";

import {
  buildRouteMap,
  type PublishedRouteMapEntry,
} from "./build-route-map";
import { PublishedManifestRuntimeError } from "./published-manifest-runtime-error";
import { resolveViewDefinition } from "./resolve-view-definition";

type ViewNavigationTarget = Extract<NavigationTarget, { kind: "view" }>;
type SystemModuleNavigationTarget = Extract<
  NavigationTarget,
  { kind: "system-module" }
>;
type ExternalLinkNavigationTarget = Extract<
  NavigationTarget,
  { kind: "external-link" }
>;

export type ResolvedViewNavigationTarget = {
  kind: "view";
  route: PublishedRouteMapEntry;
  target: ViewNavigationTarget;
  view: ViewDefinition;
};

export type ResolvedSystemModuleNavigationTarget = {
  kind: "system-module";
  route: PublishedRouteMapEntry;
  target: SystemModuleNavigationTarget;
};

export type ResolvedExternalLinkNavigationTarget = {
  kind: "external-link";
  route: PublishedRouteMapEntry;
  target: ExternalLinkNavigationTarget;
};

export type ResolvedNavigationTarget =
  | ResolvedViewNavigationTarget
  | ResolvedSystemModuleNavigationTarget
  | ResolvedExternalLinkNavigationTarget;

export function resolveNavigationTarget(
  manifest: PublishedManifest,
  routeKey: string,
): ResolvedNavigationTarget {
  const route = buildRouteMap(manifest).get(routeKey);

  if (!route) {
    throw new PublishedManifestRuntimeError(
      "route-key-not-found",
      `Route key "${routeKey}" was not found in published manifest.`,
      { routeKey },
    );
  }

  const { target } = route.navigationNode;

  switch (target.kind) {
    case "view": {
      try {
        return {
          kind: "view",
          route,
          target,
          view: resolveViewDefinition(manifest, target.viewId),
        };
      } catch (error) {
        if (
          error instanceof PublishedManifestRuntimeError
          && error.code === "view-not-found"
        ) {
          throw new PublishedManifestRuntimeError(
            "view-not-found",
            `View "${target.viewId}" referenced by route key "${routeKey}" was not found in published manifest.`,
            {
              routeKey,
              viewId: target.viewId,
            },
          );
        }

        throw error;
      }
    }

    case "system-module":
      return {
        kind: "system-module",
        route,
        target,
      };

    case "external-link":
      return {
        kind: "external-link",
        route,
        target,
      };
  }
}
