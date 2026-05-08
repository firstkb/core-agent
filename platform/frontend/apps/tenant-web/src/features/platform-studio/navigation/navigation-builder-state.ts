import type {
  FormsPlaceholderModel,
  FormsPlaceholderView,
} from "../forms/forms-placeholder-data";
import {
  getFormsPlaceholderModelRouteId,
  getFormsPlaceholderViewRouteId,
} from "../forms/forms-route-helpers";

export type NavigationBuilderNodeKind =
  | "locked-dashboard"
  | "section"
  | "menu-group"
  | "app-module"
  | "entry";

export type NavigationBuilderTargetKind =
  | "form-view"
  | "app-page"
  | "external-link"
  | "app-module";

export type NavigationBuilderAccessMode =
  | "inherit"
  | "all-authenticated"
  | "root-only"
  | "selected-only"
  | "everyone-except";

export type NavigationBuilderAccessPolicy = {
  companies: string[];
  companyTypes: string[];
  jobtypes: string[];
  mode: NavigationBuilderAccessMode;
  users: string[];
};

export type NavigationBuilderAccessRecipientKind =
  | "companies"
  | "companyTypes"
  | "jobtypes"
  | "users";

export type NavigationBuilderNodeStatus =
  | "visible"
  | "restricted"
  | "hidden"
  | "broken";

export type NavigationBuilderChannel = "all" | "web";

export type NavigationBuilderFormViewTarget = {
  description: string;
  id: string;
  label: string;
  modelId: string;
  modelLabel: string;
  routePath: string;
  viewId: string;
  viewLabel: string;
};

export type NavigationBuilderTarget =
  | {
      kind: "form-view";
      modelLabel?: string;
      modelId: string;
      routePath: string;
      targetType: "form_builder_view";
      viewLabel?: string;
      viewId: string;
    }
  | {
      kind: "app-page";
      pageKey: string;
      routePath: string;
    }
  | {
      kind: "external-link";
      url: string;
    }
  | {
      disabled: true;
      kind: "app-module";
      moduleKey: string;
    };

export type NavigationBuilderNode = {
  access: NavigationBuilderAccessPolicy;
  accessMode: NavigationBuilderAccessMode;
  accessSummary: string;
  channel: NavigationBuilderChannel;
  description?: string;
  diagnostic?: string;
  iconKey?: string;
  id: string;
  isActive?: boolean;
  isLocked?: boolean;
  kind: NavigationBuilderNodeKind;
  label: string;
  order: number;
  parentId?: string;
  routeKey?: string;
  status: NavigationBuilderNodeStatus;
  target?: NavigationBuilderTarget;
  targetKind?: NavigationBuilderTargetKind;
};

export type NavigationBuilderRailItem = {
  access: NavigationBuilderAccessPolicy;
  accessMode: NavigationBuilderAccessMode;
  accessSummary: string;
  channel: NavigationBuilderChannel;
  description: string;
  id: string;
  isActive?: boolean;
  label: string;
  routeKey: string;
  status: Exclude<NavigationBuilderNodeStatus, "broken">;
};

export type NavigationBuilderAddNodeKind =
  | "section"
  | "menu-group"
  | "external-link"
  | "app-module"
  | "app-page"
  | "form-view";

export type NavigationBuilderMoveDirection = "down" | "up";

export const navigationBuilderDashboardNodeId = "nav.locked.dashboard";

export const navigationBuilderAppPages = [
  {
    description: "Company, contact, project, job, and employee hierarchy.",
    key: "business-tree",
    label: "Business Tree",
    routePath: "/app/pages/business-tree",
  },
] as const;

export const navigationBuilderAppModules = [
  {
    description: "Future first-class app module with nested module pages.",
    key: "training",
    label: "Training",
  },
  {
    description: "Future task and assignment workspace.",
    key: "task-manager",
    label: "Task Manager",
  },
] as const;

export const navigationBuilderIconOptions = [
  { key: "clipboard-check", label: "Checklist" },
  { key: "warning", label: "Hazard" },
  { key: "camera", label: "Camera" },
  { key: "shield", label: "Safety" },
  { key: "briefcase", label: "Work" },
  { key: "toolbox", label: "Maintenance" },
  { key: "hard-hat", label: "PPE" },
  { key: "fire", label: "Fire" },
  { key: "car", label: "Fleet" },
  { key: "wrench", label: "Equipment" },
  { key: "building", label: "Company" },
  { key: "users", label: "People" },
  { key: "map-pin", label: "Location" },
  { key: "folder", label: "Folder" },
  { key: "layers", label: "Module" },
  { key: "document", label: "Docs" },
  { key: "form", label: "Forms" },
  { key: "chart", label: "Reports" },
  { key: "route", label: "Routes" },
  { key: "pulse", label: "Activity" },
  { key: "check-circle", label: "Completed" },
  { key: "star", label: "Favorites" },
  { key: "help", label: "Help" },
  { key: "settings", label: "Settings" },
] as const;

export const navigationBuilderRailItems = [
  {
    access: createNavigationBuilderAccessPolicy("inherit"),
    accessMode: "inherit",
    accessSummary: "Inherits parent access",
    channel: "web",
    description: "Opens Platform Studio from the utility rail.",
    id: "rail.platform-studio",
    isActive: true,
    label: "Platform Studio",
    routeKey: "platform-studio",
    status: "restricted",
  },
  {
    access: createNavigationBuilderAccessPolicy("inherit"),
    accessMode: "inherit",
    accessSummary: "Inherits parent access",
    channel: "web",
    description: "Future task and assignment workspace.",
    id: "rail.task-manager",
    isActive: false,
    label: "Task Manager",
    routeKey: "task-manager",
    status: "hidden",
  },
  {
    access: createNavigationBuilderAccessPolicy("all-authenticated"),
    accessMode: "all-authenticated",
    accessSummary: "Visible to all authenticated tenant users",
    channel: "web",
    description: "Opens saved app menu entries.",
    id: "rail.favorites",
    isActive: true,
    label: "Favorites",
    routeKey: "favorites",
    status: "visible",
  },
  {
    access: createNavigationBuilderAccessPolicy("all-authenticated"),
    accessMode: "all-authenticated",
    accessSummary: "Visible to all authenticated tenant users",
    channel: "web",
    description: "Opens help and support.",
    id: "rail.help-center",
    isActive: true,
    label: "Help Center",
    routeKey: "help-center",
    status: "visible",
  },
] satisfies ReadonlyArray<NavigationBuilderRailItem>;

export function createNavigationBuilderAccessPolicy(
  mode: NavigationBuilderAccessMode = "inherit",
  overrides: Partial<Omit<NavigationBuilderAccessPolicy, "mode">> = {},
): NavigationBuilderAccessPolicy {
  return {
    companies: [...(overrides.companies ?? [])],
    companyTypes: [...(overrides.companyTypes ?? [])],
    jobtypes: [...(overrides.jobtypes ?? [])],
    mode,
    users: [...(overrides.users ?? [])],
  };
}

export function getNavigationBuilderAccessSummary(
  access: NavigationBuilderAccessPolicy,
) {
  const recipientCount =
    access.users.length +
    access.companies.length +
    access.companyTypes.length +
    access.jobtypes.length;

  switch (access.mode) {
    case "inherit":
      return "Inherits parent access";
    case "all-authenticated":
      return "Visible to all authenticated tenant users";
    case "root-only":
      return "Visible only to root users";
    case "selected-only":
      return recipientCount === 0
        ? "No recipients selected"
        : `Visible to ${formatNavigationBuilderRecipientCount(access)}`;
    case "everyone-except":
      return recipientCount === 0
        ? "No exclusions selected"
        : `Hidden from ${formatNavigationBuilderRecipientCount(access)}`;
  }
}

function formatNavigationBuilderRecipientCount(access: NavigationBuilderAccessPolicy) {
  const parts = [
    formatCount(access.users.length, "user"),
    formatCount(access.companies.length, "company", "companies"),
    formatCount(access.companyTypes.length, "company type"),
    formatCount(access.jobtypes.length, "job type"),
  ].filter(Boolean);

  return parts.join(", ");
}

function formatCount(count: number, singular: string, plural = `${singular}s`) {
  if (count === 0) {
    return "";
  }
  return `${count} ${count === 1 ? singular : plural}`;
}

export function createInitialNavigationBuilderNodes(): NavigationBuilderNode[] {
  return [
    {
      access: createNavigationBuilderAccessPolicy("all-authenticated"),
      accessMode: "all-authenticated",
      accessSummary: "Visible to all authenticated tenant users",
      channel: "web",
      description: "Workspace landing page that is always shown.",
      iconKey: "dashboard",
      id: navigationBuilderDashboardNodeId,
      isLocked: true,
      kind: "locked-dashboard",
      label: "Dashboard",
      order: 0,
      routeKey: "dashboard",
      status: "visible",
      target: {
        kind: "app-page",
        pageKey: "dashboard",
        routePath: "/dashboard",
      },
      targetKind: "app-page",
    },
  ];
}

export function cloneNavigationBuilderNodes(
  nodes: ReadonlyArray<NavigationBuilderNode>,
): NavigationBuilderNode[] {
  return nodes.map((node) => ({
    ...node,
    access: cloneNavigationBuilderAccessPolicy(node.access),
    target: node.target ? { ...node.target } : undefined,
  }));
}

export function cloneNavigationBuilderRailItems(
  railItems: ReadonlyArray<NavigationBuilderRailItem>,
): NavigationBuilderRailItem[] {
  return railItems.map((item) => ({
    ...item,
    access: cloneNavigationBuilderAccessPolicy(item.access),
  }));
}

function cloneNavigationBuilderAccessPolicy(
  access: NavigationBuilderAccessPolicy,
): NavigationBuilderAccessPolicy {
  return {
    companies: [...access.companies],
    companyTypes: [...access.companyTypes],
    jobtypes: [...access.jobtypes],
    mode: access.mode,
    users: [...access.users],
  };
}

export function isNavigationBuilderContainerNode(
  node: Pick<NavigationBuilderNode, "kind">,
) {
  return node.kind === "menu-group" || node.kind === "app-module";
}

export function isNavigationBuilderNodeActive(
  node: Pick<NavigationBuilderNode, "isActive" | "status">,
) {
  return node.isActive !== false && node.status !== "hidden";
}

export function setNavigationBuilderNodeActive(
  node: NavigationBuilderNode,
  isActive: boolean,
): NavigationBuilderNode {
  if (!isActive) {
    return {
      ...node,
      isActive: false,
    };
  }

  return {
    ...node,
    isActive: true,
    status: node.status === "hidden" ? "visible" : node.status,
  };
}

export function isNavigationBuilderRailItemActive(
  item: Pick<NavigationBuilderRailItem, "isActive" | "status">,
) {
  return item.isActive !== false && item.status !== "hidden";
}

export function setNavigationBuilderRailItemActive(
  item: NavigationBuilderRailItem,
  isActive: boolean,
): NavigationBuilderRailItem {
  if (!isActive) {
    return {
      ...item,
      isActive: false,
      status: "hidden",
    };
  }

  return {
    ...item,
    isActive: true,
    status: item.access.mode === "inherit" || item.access.mode === "all-authenticated"
      ? "visible"
      : "restricted",
  };
}

export function sortNavigationBuilderSiblings(
  nodes: ReadonlyArray<NavigationBuilderNode>,
) {
  return [...nodes].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.label.localeCompare(right.label);
  });
}

export function getNavigationBuilderChildren(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  parentId?: string,
) {
  return sortNavigationBuilderSiblings(
    nodes.filter((node) => node.parentId === parentId),
  );
}

export function findNavigationBuilderNode(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  nodeId: string,
) {
  return nodes.find((node) => node.id === nodeId) ?? null;
}

export function getNavigationBuilderNodePath(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  nodeId: string,
) {
  const path: NavigationBuilderNode[] = [];
  let current = findNavigationBuilderNode(nodes, nodeId);

  while (current) {
    path.unshift(current);
    current = current.parentId
      ? findNavigationBuilderNode(nodes, current.parentId)
      : null;
  }

  return path;
}

export function buildNavigationBuilderFormViewTargets(
  models: ReadonlyArray<FormsPlaceholderModel>,
): NavigationBuilderFormViewTarget[] {
  return models.flatMap((model) =>
    model.screens.map((view) => createFormViewTarget(model, view)),
  );
}

function createFormViewTarget(
  model: FormsPlaceholderModel,
  view: FormsPlaceholderView,
): NavigationBuilderFormViewTarget {
  const modelId = getFormsPlaceholderModelRouteId(model);
  const viewId = getFormsPlaceholderViewRouteId(view);

  return {
    description: view.description || model.description || "",
    id: `${modelId}:${viewId}`,
    label: `${model.title} / ${view.title}`,
    modelId,
    modelLabel: model.title,
    routePath: `/app/forms/${encodeURIComponent(modelId)}/views/${encodeURIComponent(viewId)}`,
    viewId,
    viewLabel: view.title,
  };
}

export function getNavigationBuilderTargetLabel(
  target: NavigationBuilderTarget | undefined,
  formViewTargets: ReadonlyArray<NavigationBuilderFormViewTarget>,
) {
  if (!target) {
    return "No target";
  }

  switch (target.kind) {
    case "form-view": {
      const formTarget = formViewTargets.find((candidate) =>
        candidate.modelId === target.modelId && candidate.viewId === target.viewId
      );

      if (formTarget) {
        return formTarget.label;
      }

      if (target.modelLabel && target.viewLabel) {
        return `${target.modelLabel} / ${target.viewLabel}`;
      }

      return `${target.modelId} / ${target.viewId}`;
    }
    case "app-page":
      return navigationBuilderAppPages.find((page) => page.key === target.pageKey)?.label
        ?? target.routePath;
    case "external-link":
      return target.url;
    case "app-module":
      return navigationBuilderAppModules.find((module) => module.key === target.moduleKey)?.label
        ?? target.moduleKey;
  }
}

export function getNavigationBuilderFormViewTarget(
  node: Pick<NavigationBuilderNode, "target">,
  formViewTargets: ReadonlyArray<NavigationBuilderFormViewTarget>,
) {
  const nodeTarget = node.target;
  if (nodeTarget?.kind !== "form-view") {
    return null;
  }

  return formViewTargets.find((target) =>
    target.modelId === nodeTarget.modelId && target.viewId === nodeTarget.viewId
  ) ?? null;
}

export function getNavigationBuilderNodeLabel(
  node: NavigationBuilderNode,
  formViewTargets: ReadonlyArray<NavigationBuilderFormViewTarget>,
) {
  if (node.target?.kind !== "form-view" && node.targetKind !== "form-view") {
    return node.label;
  }

  if (node.target?.kind === "form-view") {
    return getNavigationBuilderFormViewTarget(node, formViewTargets)?.viewLabel
      ?? node.target.viewLabel
      ?? node.label;
  }

  return node.label;
}

export function syncNavigationBuilderFormViewLabels(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  formViewTargets: ReadonlyArray<NavigationBuilderFormViewTarget>,
): NavigationBuilderNode[] {
  if (formViewTargets.length === 0) {
    return [...nodes];
  }

  let didChange = false;
  const nextNodes = nodes.map((node) => {
    if (node.target?.kind !== "form-view") {
      return node;
    }

    const formViewTarget = getNavigationBuilderFormViewTarget(node, formViewTargets);
    if (!formViewTarget) {
      return node;
    }

    const target = node.target;
    const nextTarget = {
      ...target,
      modelLabel: formViewTarget.modelLabel,
      routePath: formViewTarget.routePath,
      viewLabel: formViewTarget.viewLabel,
    };

    if (
      node.label === formViewTarget.viewLabel &&
      target.modelLabel === nextTarget.modelLabel &&
      target.routePath === nextTarget.routePath &&
      target.viewLabel === nextTarget.viewLabel
    ) {
      return node;
    }

    didChange = true;
    return {
      ...node,
      label: formViewTarget.viewLabel,
      target: nextTarget,
    };
  });

  return didChange ? nextNodes : [...nodes];
}

export function getNavigationBuilderTargetRoute(
  target: NavigationBuilderTarget | undefined,
) {
  if (!target) {
    return "";
  }

  switch (target.kind) {
    case "form-view":
    case "app-page":
      return target.routePath;
    case "external-link":
      return target.url;
    case "app-module":
      return "Future App Module page";
  }
}

export function getNavigationBuilderTargetIdentity(
  target: NavigationBuilderTarget | undefined,
) {
  if (!target) {
    return "";
  }

  switch (target.kind) {
    case "form-view":
      return `form-view:${target.modelId}:${target.viewId}`;
    case "app-page":
      return `app-page:${target.pageKey}`;
    case "external-link":
      return `external-link:${target.url.trim().toLowerCase()}`;
    case "app-module":
      return `app-module:${target.moduleKey}`;
  }
}

export function createNavigationBuilderNode(
  kind: NavigationBuilderAddNodeKind,
  parentId: string | undefined,
  nodes: ReadonlyArray<NavigationBuilderNode>,
): NavigationBuilderNode {
  const normalizedParentId = kind === "section" ? undefined : parentId;
  const siblings = getNavigationBuilderChildren(nodes, normalizedParentId);
  const order = siblings.reduce((maxOrder, node) => Math.max(maxOrder, node.order), 0) + 1;
  const idSuffix = `${kind}.${nodes.length + 1}`;

  switch (kind) {
    case "section":
      return {
        access: createNavigationBuilderAccessPolicy("inherit"),
        accessMode: "inherit",
        accessSummary: "Menu titles do not have access rules",
        channel: "web",
        id: `nav.section.${idSuffix}`,
        kind: "section",
        label: "New menu title",
        order,
        status: "visible",
      };
    case "menu-group":
      return {
        access: createNavigationBuilderAccessPolicy("inherit"),
        accessMode: "inherit",
        accessSummary: "Inherits parent access",
        channel: "web",
        iconKey: "folder",
        id: `nav.group.${idSuffix}`,
        kind: "menu-group",
        label: "New menu group",
        order,
        parentId: normalizedParentId,
        status: "visible",
      };
    case "app-module":
      return {
        access: createNavigationBuilderAccessPolicy("inherit"),
        accessMode: "inherit",
        accessSummary: "Module access applies to child entries unless overridden",
        channel: "web",
        iconKey: "layers",
        id: `nav.module.${idSuffix}`,
        kind: "app-module",
        label: "New app module",
        order,
        parentId: normalizedParentId,
        routeKey: "new-app-module",
        status: "broken",
        targetKind: "app-module",
      };
    case "app-page":
      return {
        access: createNavigationBuilderAccessPolicy("inherit"),
        accessMode: "inherit",
        accessSummary: "Inherits parent access",
        channel: "web",
        diagnostic: "Select an app page before saving this item.",
        id: `nav.entry.${idSuffix}`,
        kind: "entry",
        label: "New app page",
        order,
        parentId: normalizedParentId,
        routeKey: "new-app-page",
        status: "broken",
        targetKind: "app-page",
      };
    case "form-view":
      return {
        access: createNavigationBuilderAccessPolicy("inherit"),
        accessMode: "inherit",
        accessSummary: "Inherits parent access",
        channel: "web",
        diagnostic: "Select a form view before saving this item.",
        id: `nav.entry.${idSuffix}`,
        kind: "entry",
        label: "New form view",
        order,
        parentId: normalizedParentId,
        routeKey: "new-form-view",
        status: "broken",
        targetKind: "form-view",
      };
    case "external-link":
      return {
        access: createNavigationBuilderAccessPolicy("inherit"),
        accessMode: "inherit",
        accessSummary: "Inherits parent access",
        channel: "web",
        diagnostic: "Enter a valid link before saving this item.",
        id: `nav.entry.${idSuffix}`,
        kind: "entry",
        label: "New link",
        order,
        parentId: normalizedParentId,
        routeKey: "new-link",
        status: "broken",
        targetKind: "external-link",
      };
  }
}

export function addNavigationBuilderNode(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  kind: NavigationBuilderAddNodeKind,
  parentId?: string,
) {
  return [
    ...nodes,
    createNavigationBuilderNode(kind, parentId, nodes),
  ];
}

export function updateNavigationBuilderNode(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  nodeId: string,
  update: (node: NavigationBuilderNode) => NavigationBuilderNode,
) {
  return nodes.map((node) => (node.id === nodeId ? update(node) : node));
}

export function getNavigationBuilderDescendantIds(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  nodeId: string,
) {
  const removedIds = new Set([nodeId]);
  let didAdd = true;

  while (didAdd) {
    didAdd = false;

    for (const node of nodes) {
      if (node.parentId && removedIds.has(node.parentId) && !removedIds.has(node.id)) {
        removedIds.add(node.id);
        didAdd = true;
      }
    }
  }

  return removedIds;
}

export function removeNavigationBuilderNode(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  nodeId: string,
) {
  const node = findNavigationBuilderNode(nodes, nodeId);
  if (!node || node.isLocked) {
    return [...nodes];
  }

  const removedIds = getNavigationBuilderDescendantIds(nodes, nodeId);
  return nodes.filter((candidate) => !removedIds.has(candidate.id));
}

export function moveNavigationBuilderNode(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  nodeId: string,
  direction: NavigationBuilderMoveDirection,
) {
  const node = findNavigationBuilderNode(nodes, nodeId);
  if (!node || node.isLocked) {
    return [...nodes];
  }

  const siblings = getNavigationBuilderChildren(nodes, node.parentId);
  const currentIndex = siblings.findIndex((candidate) => candidate.id === nodeId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const targetNode = siblings[targetIndex];

  if (currentIndex < 0 || !targetNode) {
    return [...nodes];
  }

  return nodes.map((candidate) => {
    if (candidate.id === node.id) {
      return { ...candidate, order: targetNode.order };
    }

    if (candidate.id === targetNode.id) {
      return { ...candidate, order: node.order };
    }

    return candidate;
  });
}

export function reorderNavigationBuilderNode(
  nodes: ReadonlyArray<NavigationBuilderNode>,
  activeNodeId: string,
  overNodeId: string,
) {
  const activeNode = findNavigationBuilderNode(nodes, activeNodeId);
  const overNode = findNavigationBuilderNode(nodes, overNodeId);

  if (
    !activeNode ||
    !overNode ||
    activeNode.id === overNode.id ||
    activeNode.isLocked ||
    overNode.isLocked ||
    activeNode.parentId !== overNode.parentId
  ) {
    return [...nodes];
  }

  const siblings = getNavigationBuilderChildren(nodes, activeNode.parentId);
  const activeIndex = siblings.findIndex((node) => node.id === activeNodeId);
  const overIndex = siblings.findIndex((node) => node.id === overNodeId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return [...nodes];
  }

  const reordered = [...siblings];
  const [moved] = reordered.splice(activeIndex, 1);
  reordered.splice(overIndex, 0, moved);
  const nextOrderById = new Map(reordered.map((node, index) => [node.id, index]));

  return nodes.map((node) => {
    if (node.parentId !== activeNode.parentId) {
      return node;
    }

    return {
      ...node,
      order: nextOrderById.get(node.id) ?? node.order,
    };
  });
}

export function countNavigationBuilderUnsavedChanges(
  draftNodes: ReadonlyArray<NavigationBuilderNode>,
  savedNodes: ReadonlyArray<NavigationBuilderNode>,
  draftRailItems: ReadonlyArray<NavigationBuilderRailItem> = [],
  savedRailItems: ReadonlyArray<NavigationBuilderRailItem> = [],
) {
  const draftById = new Map(draftNodes.map((node) => [node.id, node]));
  const savedById = new Map(savedNodes.map((node) => [node.id, node]));
  const nodeIds = new Set([...draftById.keys(), ...savedById.keys()]);
  let count = 0;

  for (const nodeId of nodeIds) {
    if (JSON.stringify(draftById.get(nodeId)) !== JSON.stringify(savedById.get(nodeId))) {
      count += 1;
    }
  }

  const draftRailById = new Map(draftRailItems.map((item) => [item.id, item]));
  const savedRailById = new Map(savedRailItems.map((item) => [item.id, item]));
  const railIds = new Set([...draftRailById.keys(), ...savedRailById.keys()]);
  for (const railId of railIds) {
    if (JSON.stringify(draftRailById.get(railId)) !== JSON.stringify(savedRailById.get(railId))) {
      count += 1;
    }
  }

  return count;
}
