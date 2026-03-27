import {
  parsePublishedManifest,
  type DraftSnapshot,
  type NavigationNode,
  type NavigationItemNode,
  type PublishedManifest,
} from "@platform/platform-builder-core";

const BUILDER_PREVIEW_ROUTE_KEY_PREFIX = "preview";
const BUILDER_PREVIEW_NAVIGATION_ITEM_ID_PREFIX = "nav.item.preview.";

function sanitizePreviewRouteSegment(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "view";
}

function getPreviewManifestId(draft: DraftSnapshot) {
  const draftSuffix = draft.draftId.startsWith("draft.")
    ? draft.draftId.slice("draft.".length)
    : draft.draftId;

  return `manifest.preview.${sanitizePreviewRouteSegment(draftSuffix)}`;
}

function buildPreviewRouteKey(routeKeyBase: string, usedRouteKeys: Set<string>) {
  let routeKey = routeKeyBase;
  let suffix = 2;

  while (usedRouteKeys.has(routeKey)) {
    routeKey = `${routeKeyBase}-${suffix}`;
    suffix += 1;
  }

  usedRouteKeys.add(routeKey);

  return routeKey;
}

function getMaxNavigationOrder(draft: DraftSnapshot) {
  if (draft.navigationNodes.length === 0) {
    return 0;
  }

  return Math.max(...draft.navigationNodes.map((node) => node.order));
}

function createPreviewNavigationNodes(draft: DraftSnapshot): NavigationItemNode[] {
  const usedRouteKeys = new Set(
    draft.navigationNodes.flatMap((node) => (node.type === "item" ? [node.routeKey] : [])),
  );
  const nextOrder = getMaxNavigationOrder(draft) + 1;

  return draft.views.map((view, index) => {
    const routeKeyBase = `${BUILDER_PREVIEW_ROUTE_KEY_PREFIX}-${sanitizePreviewRouteSegment(view.id)}`;
    const routeKey = buildPreviewRouteKey(routeKeyBase, usedRouteKeys);

    return {
      channels: [view.channel],
      icon: "spark",
      id: `${BUILDER_PREVIEW_NAVIGATION_ITEM_ID_PREFIX}${sanitizePreviewRouteSegment(view.id)}`,
      label: view.title,
      order: nextOrder + index,
      routeKey,
      target: {
        kind: "view",
        viewId: view.id,
      },
      type: "item",
    };
  });
}

function isPreviewNavigationItem(node: NavigationNode): node is NavigationItemNode {
  return node.type === "item" && node.id.startsWith(BUILDER_PREVIEW_NAVIGATION_ITEM_ID_PREFIX);
}

export function createBuilderPreviewManifest(draft: DraftSnapshot): PublishedManifest {
  return parsePublishedManifest({
    childCollections: draft.childCollections,
    entities: draft.entities,
    fields: draft.fields,
    manifestId: getPreviewManifestId(draft),
    navigationNodes: [
      ...draft.navigationNodes,
      ...createPreviewNavigationNodes(draft),
    ],
    optionSets: draft.optionSets,
    policies: draft.policies,
    publishedAt: draft.updatedAt,
    relations: draft.relations,
    schemaVersion: draft.schemaVersion,
    semanticRoles: draft.semanticRoles,
    snapshotKind: "published",
    version: 1,
    views: draft.views,
    workflows: draft.workflows,
  });
}

export function findBuilderPreviewRouteKey(
  manifest: PublishedManifest,
  viewId: string,
) {
  const previewNode = manifest.navigationNodes.find(
    (node): node is NavigationItemNode => (
      isPreviewNavigationItem(node)
      && node.target.kind === "view"
      && node.target.viewId === viewId
    ),
  );

  return previewNode?.routeKey ?? null;
}
