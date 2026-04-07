import type {
  PublishedManifest,
  ResolvedExternalLinkNavigationTarget,
  ResolvedSystemModuleNavigationTarget,
  ResolvedViewNavigationTarget,
  VisibilitySubjectContext,
} from "@platform/platform-studio-core";
import {
  buildRouteMap,
  PublishedManifestRuntimeError,
  resolveNavigationTarget,
} from "@platform/platform-studio-core";

import {
  resolvePublishedNavigationItemAccess,
  type PublishedNavigationItemConfigurationErrorAccessResult,
  type PublishedNavigationItemDeniedAccessResult,
} from "./published-navigation-access";
import {
  resolveRuntimeSystemModule,
  type RuntimeSystemModule,
} from "./runtime-system-modules";

type ResolvedPublishedNavigationTarget =
  | ResolvedViewNavigationTarget
  | ResolvedSystemModuleNavigationTarget
  | ResolvedExternalLinkNavigationTarget;

export type PublishedAppRouteResolvedState =
  | {
    availableRouteKeys: string[];
    routeKey: string;
    status: "missing-route";
  }
  | {
    access: PublishedNavigationItemDeniedAccessResult;
    availableRouteKeys: string[];
    manifest: PublishedManifest;
    resolvedTarget: ResolvedPublishedNavigationTarget;
    routeKey: string;
    status: "access-denied";
  }
  | {
    access: PublishedNavigationItemConfigurationErrorAccessResult;
    availableRouteKeys: string[];
    manifest: PublishedManifest;
    resolvedTarget: ResolvedPublishedNavigationTarget;
    routeKey: string;
    status: "visibility-config-error";
  }
  | {
    availableRouteKeys: string[];
    error: PublishedManifestRuntimeError;
    routeKey: string;
    status: "runtime-error";
  }
  | {
    availableRouteKeys: string[];
    manifest: PublishedManifest;
    resolvedTarget: ResolvedViewNavigationTarget;
    routeKey: string;
    status: "view";
  }
  | {
    availableRouteKeys: string[];
    manifest: PublishedManifest;
    resolvedTarget: ResolvedSystemModuleNavigationTarget;
    routeKey: string;
    status: "system-module";
    systemModule: RuntimeSystemModule | null;
  }
  | {
    availableRouteKeys: string[];
    manifest: PublishedManifest;
    resolvedTarget: ResolvedExternalLinkNavigationTarget;
    routeKey: string;
    status: "external-link";
  };

export function resolvePublishedAppRoutePageState({
  manifest,
  routeKey,
  subject,
}: {
  manifest: PublishedManifest;
  routeKey: string;
  subject: VisibilitySubjectContext;
}): PublishedAppRouteResolvedState {
  let availableRouteKeys: string[] = [];

  try {
    availableRouteKeys = Array.from(buildRouteMap(manifest).keys());
  } catch (error) {
    if (error instanceof PublishedManifestRuntimeError) {
      return {
        availableRouteKeys,
        error,
        routeKey,
        status: "runtime-error",
      };
    }

    throw error;
  }

  if (!routeKey) {
    return {
      availableRouteKeys,
      routeKey,
      status: "missing-route",
    };
  }

  try {
    const resolvedTarget = resolveNavigationTarget(manifest, routeKey);
    const access = resolvePublishedNavigationItemAccess({
      manifest,
      navigationItem: resolvedTarget.route.navigationNode,
      subject,
    });

    if (access.status === "configuration-error") {
      return {
        access,
        availableRouteKeys,
        manifest,
        resolvedTarget,
        routeKey,
        status: "visibility-config-error",
      };
    }

    if (access.status === "denied") {
      return {
        access,
        availableRouteKeys,
        manifest,
        resolvedTarget,
        routeKey,
        status: "access-denied",
      };
    }

    switch (resolvedTarget.kind) {
      case "view":
        return {
          availableRouteKeys,
          manifest,
          resolvedTarget,
          routeKey,
          status: "view",
        };
      case "system-module":
        return {
          availableRouteKeys,
          manifest,
          resolvedTarget,
          routeKey,
          status: "system-module",
          systemModule: resolveRuntimeSystemModule(
            resolvedTarget.target.moduleKey,
          ),
        };
      case "external-link":
        return {
          availableRouteKeys,
          manifest,
          resolvedTarget,
          routeKey,
          status: "external-link",
        };
    }
  } catch (error) {
    if (
      error instanceof PublishedManifestRuntimeError
      && error.code === "route-key-not-found"
    ) {
      return {
        availableRouteKeys,
        routeKey,
        status: "missing-route",
      };
    }

    if (error instanceof PublishedManifestRuntimeError) {
      return {
        availableRouteKeys,
        error,
        routeKey,
        status: "runtime-error",
      };
    }

    throw error;
  }
}
