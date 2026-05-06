import type {
  TenantNavigationDefinition,
  TenantNavigationNode,
  TenantNavigationNodeType,
  TenantNavigationRailItem,
  TenantNavigationTarget,
} from "@platform/api-client";

import {
  cloneNavigationBuilderNodes,
  createInitialNavigationBuilderNodes,
  getNavigationBuilderChildren,
  getNavigationBuilderTargetRoute,
  isNavigationBuilderNodeActive,
  navigationBuilderDashboardNodeId,
  type NavigationBuilderAccessMode,
  type NavigationBuilderChannel,
  type NavigationBuilderNode,
  type NavigationBuilderNodeKind,
  type NavigationBuilderNodeStatus,
  type NavigationBuilderRailItem,
  type NavigationBuilderTarget,
  type NavigationBuilderTargetKind,
} from "./navigation-builder-state";

const navigationBuilderSchemaVersion = 1;

type NavigationBuilderNodeMeta = {
  accessMode?: NavigationBuilderAccessMode;
  accessSummary?: string;
  builderKind?: NavigationBuilderNodeKind;
  description?: string;
  diagnostic?: string;
  routeKey?: string;
  status?: NavigationBuilderNodeStatus;
  targetKind?: NavigationBuilderTargetKind;
  targetLabels?: {
    modelLabel?: string;
    viewLabel?: string;
  };
};

type DecodeOptions = {
  seedWhenEmpty?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readAccessMode(value: unknown): NavigationBuilderAccessMode | undefined {
  return value === "inherit" || value === "all-authenticated" || value === "custom-preview"
    ? value
    : undefined;
}

function readChannel(value: unknown): NavigationBuilderChannel {
  return value === "web" ? "web" : "all";
}

function readNodeStatus(value: unknown): NavigationBuilderNodeStatus | undefined {
  return value === "visible" || value === "restricted" || value === "hidden" || value === "broken"
    ? value
    : undefined;
}

function readNodeKind(value: unknown): NavigationBuilderNodeKind | undefined {
  return value === "locked-dashboard" ||
    value === "section" ||
    value === "menu-group" ||
    value === "app-module" ||
    value === "entry"
    ? value
    : undefined;
}

function readTargetKind(value: unknown): NavigationBuilderTargetKind | undefined {
  return value === "form-view" || value === "app-page" || value === "external-link" || value === "app-module"
    ? value
    : undefined;
}

function readNodeMeta(source: TenantNavigationNode): NavigationBuilderNodeMeta {
  if (!isRecord(source.meta)) {
    return {};
  }

  const targetLabels = isRecord(source.meta.targetLabels)
    ? {
        modelLabel: readString(source.meta.targetLabels.modelLabel),
        viewLabel: readString(source.meta.targetLabels.viewLabel),
      }
    : undefined;

  return {
    accessMode: readAccessMode(source.meta.accessMode),
    accessSummary: readString(source.meta.accessSummary),
    builderKind: readNodeKind(source.meta.builderKind),
    description: readString(source.meta.description),
    diagnostic: readString(source.meta.diagnostic),
    routeKey: readString(source.meta.routeKey),
    status: readNodeStatus(source.meta.status),
    targetKind: readTargetKind(source.meta.targetKind),
    targetLabels,
  };
}

function createDashboardNode() {
  return cloneNavigationBuilderNodes(createInitialNavigationBuilderNodes())
    .find((node) => node.id === navigationBuilderDashboardNodeId);
}

function getTargetKindFromNodeType(type: TenantNavigationNodeType): NavigationBuilderTargetKind | undefined {
  switch (type) {
    case "form_view":
      return "form-view";
    case "app_page":
      return "app-page";
    case "external_link":
      return "external-link";
    case "app_module":
      return "app-module";
    default:
      return undefined;
  }
}

function decodeTarget(
  source: TenantNavigationNode,
  meta: NavigationBuilderNodeMeta,
): NavigationBuilderTarget | undefined {
  const target = source.target;
  if (!target) {
    return undefined;
  }

  switch (target.type) {
    case "form_view": {
      if (!target.modelId || !target.viewId) {
        return undefined;
      }
      return {
        kind: "form-view",
        modelId: target.modelId,
        modelLabel: meta.targetLabels?.modelLabel,
        routePath: target.route || `/app/forms/${encodeURIComponent(target.modelId)}/views/${encodeURIComponent(target.viewId)}`,
        targetType: "form_builder_view",
        viewId: target.viewId,
        viewLabel: meta.targetLabels?.viewLabel,
      };
    }
    case "app_page": {
      const pageKey = target.pageId || target.route?.split("/").filter(Boolean).at(-1);
      if (!pageKey) {
        return undefined;
      }
      return {
        kind: "app-page",
        pageKey,
        routePath: target.route || `/app/pages/${encodeURIComponent(pageKey)}`,
      };
    }
    case "external_link":
      return target.url
        ? {
            kind: "external-link",
            url: target.url,
          }
        : undefined;
    case "app_module":
      return target.moduleId
        ? {
            disabled: true,
            kind: "app-module",
            moduleKey: target.moduleId,
          }
        : undefined;
  }
}

function decodeNodeKind(source: TenantNavigationNode, meta: NavigationBuilderNodeMeta): NavigationBuilderNodeKind {
  if (meta.builderKind && meta.builderKind !== "locked-dashboard") {
    return meta.builderKind;
  }

  switch (source.type) {
    case "menu_title":
      return "section";
    case "menu_group":
      return "menu-group";
    case "app_module":
      return "app-module";
    default:
      return "entry";
  }
}

function decodeNavigationNode(
  source: TenantNavigationNode,
  parentId: string | undefined,
  order: number,
): NavigationBuilderNode[] {
  const meta = readNodeMeta(source);
  const target = decodeTarget(source, meta);
  const kind = decodeNodeKind(source, meta);
  const node: NavigationBuilderNode = {
    accessMode: meta.accessMode ?? "inherit",
    accessSummary: meta.accessSummary ?? "Inherits parent access",
    channel: readChannel(source.channel),
    description: meta.description,
    diagnostic: meta.diagnostic,
    iconKey: source.icon,
    id: source.id,
    isActive: source.active === false ? false : true,
    kind,
    label: target?.kind === "form-view"
      ? target.viewLabel ?? source.label
      : source.label,
    order,
    parentId,
    routeKey: meta.routeKey,
    status: meta.status ?? "visible",
    target,
    targetKind: meta.targetKind ?? target?.kind ?? getTargetKindFromNodeType(source.type),
  };

  return [
    node,
    ...source.children.flatMap((child, index) => decodeNavigationNode(child, source.id, index + 1)),
  ];
}

export function decodeNavigationBuilderDefinition(
  definition: TenantNavigationDefinition,
  options: DecodeOptions = {},
): NavigationBuilderNode[] {
  if (definition.appMenu.length === 0 && options.seedWhenEmpty) {
    return cloneNavigationBuilderNodes(createInitialNavigationBuilderNodes());
  }

  const dashboardNode = createDashboardNode();
  const decodedNodes = definition.appMenu.flatMap((node, index) =>
    decodeNavigationNode(node, undefined, index + 1),
  );

  return dashboardNode
    ? [dashboardNode, ...decodedNodes]
    : decodedNodes;
}

function encodeTarget(target: NavigationBuilderTarget | undefined): TenantNavigationTarget | undefined {
  if (!target) {
    return undefined;
  }

  switch (target.kind) {
    case "form-view":
      return {
        modelId: target.modelId,
        route: target.routePath,
        type: "form_view",
        viewId: target.viewId,
      };
    case "app-page":
      return {
        pageId: target.pageKey,
        route: target.routePath,
        type: "app_page",
      };
    case "external-link":
      return {
        type: "external_link",
        url: target.url,
      };
    case "app-module":
      return {
        moduleId: target.moduleKey,
        type: "app_module",
      };
  }
}

function encodeNodeType(node: NavigationBuilderNode, childNodes: ReadonlyArray<NavigationBuilderNode>): TenantNavigationNodeType {
  if (node.kind === "section") {
    return "menu_title";
  }

  if (node.kind === "menu-group") {
    return "menu_group";
  }

  if (node.kind === "app-module") {
    return node.target?.kind === "app-module" && childNodes.length === 0
      ? "app_module"
      : "menu_group";
  }

  switch (node.targetKind ?? node.target?.kind) {
    case "form-view":
      return "form_view";
    case "app-page":
      return "app_page";
    case "external-link":
      return "external_link";
    case "app-module":
      return "app_module";
    default:
      return "menu_group";
  }
}

function encodeNodeMeta(node: NavigationBuilderNode): NavigationBuilderNodeMeta {
  return {
    accessMode: node.accessMode,
    accessSummary: node.accessSummary,
    builderKind: node.kind,
    description: node.description,
    diagnostic: node.diagnostic,
    routeKey: node.routeKey || getNavigationBuilderTargetRoute(node.target),
    status: node.status,
    targetKind: node.targetKind,
    targetLabels: node.target?.kind === "form-view"
      ? {
          modelLabel: node.target.modelLabel,
          viewLabel: node.target.viewLabel,
        }
      : undefined,
  };
}

function encodeNavigationNode(
  node: NavigationBuilderNode,
  nodes: ReadonlyArray<NavigationBuilderNode>,
): TenantNavigationNode {
  const childNodes = getNavigationBuilderChildren(nodes, node.id);
  const nodeType = encodeNodeType(node, childNodes);
  const target = nodeType === "menu_title" || nodeType === "menu_group"
    ? undefined
    : encodeTarget(node.target);

  return {
    active: isNavigationBuilderNodeActive(node),
    channel: node.channel,
    children: nodeType === "menu_title"
      ? []
      : childNodes.map((child) => encodeNavigationNode(child, nodes)),
    icon: node.kind === "section" ? undefined : node.iconKey,
    id: node.id,
    label: node.label,
    meta: encodeNodeMeta(node),
    target,
    type: nodeType,
  };
}

export function encodeNavigationBuilderDefinition(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  railItems: ReadonlyArray<NavigationBuilderRailItem>,
): TenantNavigationDefinition {
  return {
    appMenu: getNavigationBuilderChildren(nodes)
      .filter((node) => node.id !== navigationBuilderDashboardNodeId)
      .map((node) => encodeNavigationNode(node, nodes)),
    schemaVersion: navigationBuilderSchemaVersion,
    utilityRail: railItems.map(encodeNavigationRailItem),
  };
}

function encodeNavigationRailItem(item: NavigationBuilderRailItem): TenantNavigationRailItem {
  return {
    active: item.status !== "hidden",
    access: {
      accessMode: item.accessMode,
      accessSummary: item.accessSummary,
      channel: item.channel,
      description: item.description,
      status: item.status,
    },
    id: item.id,
    key: item.routeKey,
    label: item.label,
  };
}
