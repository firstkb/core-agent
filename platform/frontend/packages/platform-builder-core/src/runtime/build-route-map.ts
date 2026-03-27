import type { NavigationItemNode } from "../contracts/navigation";
import type { PublishedManifest } from "../contracts/publish";

import { PublishedManifestRuntimeError } from "./published-manifest-runtime-error";

export type PublishedRouteMapEntry = {
  navigationNode: NavigationItemNode;
  routeKey: string;
};

export type PublishedRouteMap = ReadonlyMap<string, PublishedRouteMapEntry>;

export function buildRouteMap(manifest: PublishedManifest): PublishedRouteMap {
  const routeMap = new Map<string, PublishedRouteMapEntry>();

  for (const node of manifest.navigationNodes) {
    if (node.type !== "item") {
      continue;
    }

    if (routeMap.has(node.routeKey)) {
      throw new PublishedManifestRuntimeError(
        "duplicate-route-key",
        `Duplicate route key "${node.routeKey}" found in published manifest navigation nodes.`,
        {
          navigationNodeId: node.id,
          routeKey: node.routeKey,
        },
      );
    }

    routeMap.set(node.routeKey, {
      navigationNode: node,
      routeKey: node.routeKey,
    });
  }

  return routeMap;
}
