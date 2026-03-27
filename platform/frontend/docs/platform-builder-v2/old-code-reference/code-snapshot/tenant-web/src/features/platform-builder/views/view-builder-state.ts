import type {
  ChildCollectionDefinition,
  DraftSnapshot,
  FieldDefinition,
  ViewDefinition,
  ViewLayoutNode,
} from "@platform/platform-builder-core";

export type BuilderViewAuthorableNodeKind =
  | "section"
  | "group"
  | "text"
  | "divider"
  | "field";

export type BuilderViewOutlineItem = {
  acceptsBodyChildren: boolean;
  childCount: number;
  depth: number;
  id: string;
  isDetached: boolean;
  isRoot: boolean;
  kind: ViewLayoutNode["kind"];
  label: string;
  node: ViewLayoutNode;
  parentId: string | null;
};

export type BuilderViewContainerOption = {
  depth: number;
  id: string;
  kind: "group" | "section";
  label: string;
};

export type BuilderViewFieldOption = Pick<
  FieldDefinition,
  "dataType" | "id" | "label" | "required"
>;

export type BuilderViewInspectorMeta = {
  label: string;
  value: string;
};

export type BuilderViewInspectorEditableField = {
  control: "input" | "textarea";
  hint: string;
  label: string;
  value: string;
};

export type BuilderViewInspectorState = {
  childCount: number;
  description: string;
  editableField: BuilderViewInspectorEditableField | null;
  kind: ViewLayoutNode["kind"];
  label: string;
  meta: BuilderViewInspectorMeta[];
  nodeId: string;
  readOnlyNotice: string | null;
};

export type BuilderViewSaveFeedback = {
  badgeLabel: string;
  description: string;
  title: string;
};

export type BuilderViewAddNodeInput =
  | {
    kind: "divider" | "group" | "section" | "text";
    parentId: string;
  }
  | {
    fieldId: string;
    kind: "field";
    parentId: string;
    widgetKey?: string;
  };

export type BuilderViewMoveNodeInput = {
  nodeId: string;
  targetIndex: number;
  targetParentId: string;
};

type BuilderViewInspectorSource = Pick<DraftSnapshot, "childCollections" | "fields">;
type BuilderViewNodeLocation = {
  index: number;
  parentId: string;
};
type BuilderViewSupportedContainerNode = Extract<ViewLayoutNode, { kind: "group" | "section" }>;

function normalizeOptionalLabel(value?: string) {
  const nextValue = value?.trim();

  return nextValue && nextValue.length > 0 ? nextValue : undefined;
}

function isBodyContainerNode(node: ViewLayoutNode): node is BuilderViewSupportedContainerNode {
  return node.kind === "group" || node.kind === "section";
}

function getNodeChildIds(node: ViewLayoutNode) {
  switch (node.kind) {
    case "group":
    case "section":
    case "tab":
      return node.slots.body;
    case "tabs":
      return node.slots.tabs;
    default:
      return [];
  }
}

function getFieldDefinition(
  source: BuilderViewInspectorSource | undefined,
  fieldId: string,
): FieldDefinition | null {
  return source?.fields.find((field) => field.id === fieldId) ?? null;
}

function getCollectionDefinition(
  source: BuilderViewInspectorSource | undefined,
  collectionId: string,
): ChildCollectionDefinition | null {
  return source?.childCollections.find((collection) => collection.id === collectionId) ?? null;
}

function getTextLabel(text: string) {
  const collapsed = text.replace(/\s+/g, " ").trim();

  if (collapsed.length === 0) {
    return "Text block";
  }

  return collapsed.length > 56 ? `${collapsed.slice(0, 53)}...` : collapsed;
}

function sanitizeNodeIdSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function createBuilderViewNodeId(
  view: ViewDefinition,
  kind: BuilderViewAuthorableNodeKind,
) {
  const base = `viewnode.${sanitizeNodeIdSegment(view.id)}.${kind}`;
  const existingIds = new Set(view.nodes.map((node) => node.id));
  let index = view.nodes.length + 1;
  let nextId = `${base}.${index}`;

  while (existingIds.has(nextId)) {
    index += 1;
    nextId = `${base}.${index}`;
  }

  return nextId;
}

function getBuilderViewNode(view: ViewDefinition, nodeId: string) {
  return view.nodes.find((node) => node.id === nodeId) ?? null;
}

function collectBuilderViewSubtreeIds(
  view: ViewDefinition,
  rootNodeId: string,
) {
  const nodeMap = new Map(view.nodes.map((node) => [node.id, node]));
  const visitedNodeIds = new Set<string>();

  function visit(nodeId: string) {
    if (visitedNodeIds.has(nodeId)) {
      return;
    }

    const node = nodeMap.get(nodeId);

    if (!node) {
      return;
    }

    visitedNodeIds.add(nodeId);
    getNodeChildIds(node).forEach((childId) => visit(childId));
  }

  visit(rootNodeId);

  return visitedNodeIds;
}

function isBuilderViewNodeDescendant(
  view: ViewDefinition,
  nodeId: string,
  ancestorNodeId: string,
) {
  if (nodeId === ancestorNodeId) {
    return true;
  }

  return collectBuilderViewSubtreeIds(view, ancestorNodeId).has(nodeId);
}

export function getBuilderViewNodeLocation(
  view: ViewDefinition,
  nodeId: string,
): BuilderViewNodeLocation | null {
  for (const node of view.nodes) {
    const childIds = getNodeChildIds(node);
    const index = childIds.indexOf(nodeId);

    if (index >= 0) {
      return {
        index,
        parentId: node.id,
      };
    }
  }

  return null;
}

export function cloneBuilderViewDefinition(view: ViewDefinition): ViewDefinition {
  return {
    ...view,
    nodes: view.nodes.map((node) => {
      switch (node.kind) {
        case "group":
        case "section":
        case "tab":
          return {
            ...node,
            slots: {
              body: [...node.slots.body],
            },
          };
        case "tabs":
          return {
            ...node,
            slots: {
              tabs: [...node.slots.tabs],
            },
          };
        default:
          return {
            ...node,
          };
      }
    }),
  };
}

export function normalizeBuilderViewDefinition(view: ViewDefinition): ViewDefinition {
  return {
    ...cloneBuilderViewDefinition(view),
    description: normalizeOptionalLabel(view.description),
    isDefault: view.isDefault ? true : undefined,
    nodes: view.nodes.map((node) => {
      switch (node.kind) {
        case "section":
          return {
            ...node,
            title: normalizeOptionalLabel(node.title),
          };
        case "group":
          return {
            ...node,
            label: normalizeOptionalLabel(node.label),
          };
        default:
          return {
            ...node,
          };
      }
    }),
    title: view.title.trim(),
  };
}

export function serializeBuilderViewDefinition(view: ViewDefinition) {
  return JSON.stringify(normalizeBuilderViewDefinition(view));
}

export function getBuilderDefaultFieldWidgetKey(field: BuilderViewFieldOption) {
  switch (field.dataType) {
    case "boolean":
      return "checkbox";
    case "date":
      return "date-input";
    case "enum":
      return field.id.includes(".status") ? "status-select" : "select";
    case "relation":
      return "entity-select";
    default:
      return "text-input";
  }
}

export function getBuilderViewFieldOptions(
  source: Pick<DraftSnapshot, "fields">,
  view: ViewDefinition,
): BuilderViewFieldOption[] {
  return source.fields
    .filter((field) => field.entityId === view.entityId)
    .map((field) => ({
      dataType: field.dataType,
      id: field.id,
      label: field.label,
      required: Boolean(field.required),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function resolveBuilderViewInsertionParentId(
  view: ViewDefinition,
  selectedNodeId: string,
): string | null {
  const selectedNode = getBuilderViewNode(view, selectedNodeId);

  if (selectedNode && isBodyContainerNode(selectedNode)) {
    return selectedNode.id;
  }

  const parentLocation = getBuilderViewNodeLocation(view, selectedNodeId);

  if (!parentLocation) {
    return null;
  }

  const parentNode = getBuilderViewNode(view, parentLocation.parentId);

  return parentNode && isBodyContainerNode(parentNode) ? parentNode.id : null;
}

export function addBuilderViewNode(
  view: ViewDefinition,
  input: BuilderViewAddNodeInput,
): ViewDefinition {
  const parentNode = getBuilderViewNode(view, input.parentId);

  if (!parentNode || !isBodyContainerNode(parentNode)) {
    return view;
  }

  if (input.kind === "field" && input.fieldId.trim().length === 0) {
    return view;
  }

  const nextNodeId = createBuilderViewNodeId(view, input.kind);
  const nextNode: ViewLayoutNode = (() => {
    switch (input.kind) {
      case "section":
        return {
          id: nextNodeId,
          kind: "section",
          slots: {
            body: [],
          },
          title: "New section",
        };
      case "group":
        return {
          id: nextNodeId,
          kind: "group",
          label: "New group",
          slots: {
            body: [],
          },
        };
      case "text":
        return {
          id: nextNodeId,
          kind: "text",
          text: "Add builder-authored guidance.",
        };
      case "divider":
        return {
          id: nextNodeId,
          kind: "divider",
        };
      case "field":
        return {
          fieldId: input.fieldId,
          id: nextNodeId,
          kind: "field",
          widgetKey: input.widgetKey?.trim() || "text-input",
        };
    }
  })();

  return {
    ...view,
    nodes: [
      ...view.nodes.map((node) => {
        if (node.id !== parentNode.id || !isBodyContainerNode(node)) {
          return node;
        }

        return {
          ...node,
          slots: {
            body: [...node.slots.body, nextNodeId],
          },
        };
      }),
      nextNode,
    ],
  };
}

export function moveBuilderViewNode(
  view: ViewDefinition,
  input: BuilderViewMoveNodeInput,
): ViewDefinition {
  if (input.nodeId === view.rootNodeId) {
    return view;
  }

  const currentLocation = getBuilderViewNodeLocation(view, input.nodeId);
  const sourceParent = currentLocation ? getBuilderViewNode(view, currentLocation.parentId) : null;
  const targetParent = getBuilderViewNode(view, input.targetParentId);

  if (
    !currentLocation
    || !sourceParent
    || !targetParent
    || !isBodyContainerNode(sourceParent)
    || !isBodyContainerNode(targetParent)
    || input.targetParentId === input.nodeId
    || isBuilderViewNodeDescendant(view, input.targetParentId, input.nodeId)
  ) {
    return view;
  }

  const targetChildIds = [...targetParent.slots.body];
  const clampedTargetIndex = Math.max(0, Math.min(input.targetIndex, targetChildIds.length));

  if (currentLocation.parentId === input.targetParentId) {
    const reorderedChildIds = [...sourceParent.slots.body];
    reorderedChildIds.splice(currentLocation.index, 1);

    if (clampedTargetIndex === currentLocation.index) {
      return view;
    }

    reorderedChildIds.splice(clampedTargetIndex, 0, input.nodeId);

    return {
      ...view,
      nodes: view.nodes.map((node) => {
        if (node.id !== sourceParent.id || !isBodyContainerNode(node)) {
          return node;
        }

        return {
          ...node,
          slots: {
            body: reorderedChildIds,
          },
        };
      }),
    };
  }

  const nextSourceChildIds = sourceParent.slots.body.filter((childId) => childId !== input.nodeId);
  const nextTargetChildIds = [...targetParent.slots.body];
  nextTargetChildIds.splice(clampedTargetIndex, 0, input.nodeId);

  return {
    ...view,
    nodes: view.nodes.map((node) => {
      if (node.id === sourceParent.id && isBodyContainerNode(node)) {
        return {
          ...node,
          slots: {
            body: nextSourceChildIds,
          },
        };
      }

      if (node.id === targetParent.id && isBodyContainerNode(node)) {
        return {
          ...node,
          slots: {
            body: nextTargetChildIds,
          },
        };
      }

      return node;
    }),
  };
}

export function reorderBuilderViewNode(
  view: ViewDefinition,
  nodeId: string,
  step: -1 | 1,
): ViewDefinition {
  const location = getBuilderViewNodeLocation(view, nodeId);
  const parentNode = location ? getBuilderViewNode(view, location.parentId) : null;

  if (!location || !parentNode || !isBodyContainerNode(parentNode)) {
    return view;
  }

  const targetIndex = location.index + step;

  if (targetIndex < 0 || targetIndex >= parentNode.slots.body.length) {
    return view;
  }

  return moveBuilderViewNode(view, {
    nodeId,
    targetIndex,
    targetParentId: location.parentId,
  });
}

export function deleteBuilderViewNode(
  view: ViewDefinition,
  nodeId: string,
): ViewDefinition {
  if (nodeId === view.rootNodeId) {
    return view;
  }

  const location = getBuilderViewNodeLocation(view, nodeId);
  const parentNode = location ? getBuilderViewNode(view, location.parentId) : null;

  if (!location || !parentNode || !isBodyContainerNode(parentNode)) {
    return view;
  }

  const deletedNodeIds = collectBuilderViewSubtreeIds(view, nodeId);

  return {
    ...view,
    nodes: view.nodes
      .filter((node) => !deletedNodeIds.has(node.id))
      .map((node) => {
        if (node.id !== parentNode.id || !isBodyContainerNode(node)) {
          return node;
        }

        return {
          ...node,
          slots: {
            body: node.slots.body.filter((childId) => childId !== nodeId),
          },
        };
      }),
  };
}

export function updateBuilderViewSelectedNodeValue(
  view: ViewDefinition,
  nodeId: string,
  nextValue: string,
): ViewDefinition {
  let didChange = false;

  const nextNodes = view.nodes.map((node) => {
    if (node.id !== nodeId) {
      return node;
    }

    switch (node.kind) {
      case "section": {
        const nextTitle = normalizeOptionalLabel(nextValue);

        if (node.title === nextTitle) {
          return node;
        }

        didChange = true;

        return {
          ...node,
          title: nextTitle,
        };
      }
      case "group": {
        const nextLabel = normalizeOptionalLabel(nextValue);

        if (node.label === nextLabel) {
          return node;
        }

        didChange = true;

        return {
          ...node,
          label: nextLabel,
        };
      }
      case "text":
        if (node.text === nextValue) {
          return node;
        }

        didChange = true;

        return {
          ...node,
          text: nextValue,
        };
      case "field": {
        const nextWidgetKey = nextValue.trim();

        if (nextWidgetKey.length === 0 || node.widgetKey === nextWidgetKey) {
          return node;
        }

        didChange = true;

        return {
          ...node,
          widgetKey: nextWidgetKey,
        };
      }
      default:
        return node;
    }
  });

  if (!didChange) {
    return view;
  }

  return {
    ...view,
    nodes: nextNodes,
  };
}

export function resolveBuilderViewSaveFeedback({
  didSave,
  viewTitle,
}: {
  didSave: boolean;
  viewTitle: string;
}): BuilderViewSaveFeedback | null {
  if (!didSave) {
    return null;
  }

  const normalizedTitle = viewTitle.trim();
  const label = normalizedTitle.length > 0 ? normalizedTitle : "Untitled view";

  return {
    badgeLabel: "Saved just now",
    description: `${label} now powers the saved draft used by preview and publish.`,
    title: "Draft saved",
  };
}

export function getBuilderViewNodeLabel(
  node: ViewLayoutNode,
  source?: BuilderViewInspectorSource,
) {
  switch (node.kind) {
    case "section":
      return node.title?.trim() || "Untitled section";
    case "group":
      return node.label?.trim() || "Untitled group";
    case "tabs":
      return "Tabs";
    case "tab":
      return node.label;
    case "field":
      return getFieldDefinition(source, node.fieldId)?.label ?? node.fieldId;
    case "collection":
      return getCollectionDefinition(source, node.collectionId)?.label ?? node.collectionId;
    case "text":
      return getTextLabel(node.text);
    case "divider":
      return "Divider";
  }
}

export function buildBuilderViewOutline(
  view: ViewDefinition,
  source?: BuilderViewInspectorSource,
): BuilderViewOutlineItem[] {
  const nodeMap = new Map(view.nodes.map((node) => [node.id, node]));
  const visitedNodeIds = new Set<string>();
  const outline: BuilderViewOutlineItem[] = [];

  function visit(nodeId: string, depth: number, isDetached: boolean, parentId: string | null) {
    const node = nodeMap.get(nodeId);

    if (!node || visitedNodeIds.has(nodeId)) {
      return;
    }

    visitedNodeIds.add(nodeId);
    const childIds = getNodeChildIds(node);

    outline.push({
      acceptsBodyChildren: isBodyContainerNode(node),
      childCount: childIds.length,
      depth,
      id: node.id,
      isDetached,
      isRoot: node.id === view.rootNodeId,
      kind: node.kind,
      label: getBuilderViewNodeLabel(node, source),
      node,
      parentId,
    });

    childIds.forEach((childId) => visit(childId, depth + 1, isDetached, node.id));
  }

  visit(view.rootNodeId, 0, false, null);

  view.nodes.forEach((node) => {
    if (!visitedNodeIds.has(node.id)) {
      visit(node.id, 0, true, null);
    }
  });

  return outline;
}

export function getBuilderViewContainerOptions(
  view: ViewDefinition,
  source?: BuilderViewInspectorSource,
): BuilderViewContainerOption[] {
  return buildBuilderViewOutline(view, source)
    .filter((
      item,
    ): item is BuilderViewOutlineItem & { kind: "group" | "section" } => (
      item.kind === "group" || item.kind === "section"
    ))
    .map((item) => ({
      depth: item.depth,
      id: item.id,
      kind: item.kind,
      label: item.label,
    }));
}

export function getBuilderViewMoveTargetOptions(
  view: ViewDefinition,
  source: BuilderViewInspectorSource,
  nodeId: string,
): BuilderViewContainerOption[] {
  const currentLocation = getBuilderViewNodeLocation(view, nodeId);

  return getBuilderViewContainerOptions(view, source).filter((option) => {
    if (option.id === nodeId || option.id === currentLocation?.parentId) {
      return false;
    }

    return !isBuilderViewNodeDescendant(view, option.id, nodeId);
  });
}

export function getBuilderViewInspectorState(
  source: BuilderViewInspectorSource,
  view: ViewDefinition,
  nodeId: string,
): BuilderViewInspectorState | null {
  const node = view.nodes.find((candidate) => candidate.id === nodeId);

  if (!node) {
    return null;
  }

  const childCount = getNodeChildIds(node).length;

  switch (node.kind) {
    case "section":
      return {
        childCount,
        description: "Section nodes create the main layout spine for this view and accept new authored children in this slice.",
        editableField: {
          control: "input",
          hint: "Used in the outline and the runtime metadata summary.",
          label: "Section title",
          value: node.title ?? "",
        },
        kind: node.kind,
        label: getBuilderViewNodeLabel(node),
        meta: [
          {
            label: "Body slot",
            value: `${childCount} child ${childCount === 1 ? "node" : "nodes"}`,
          },
        ],
        nodeId: node.id,
        readOnlyNotice: null,
      };
    case "group":
      return {
        childCount,
        description: "Group nodes cluster related child nodes and act as bounded authoring containers inside a view.",
        editableField: {
          control: "input",
          hint: "Used in the outline and published runtime metadata.",
          label: "Group title",
          value: node.label ?? "",
        },
        kind: node.kind,
        label: getBuilderViewNodeLabel(node),
        meta: [
          {
            label: "Body slot",
            value: `${childCount} child ${childCount === 1 ? "node" : "nodes"}`,
          },
        ],
        nodeId: node.id,
        readOnlyNotice: null,
      };
    case "text":
      return {
        childCount,
        description: "Text nodes already flow into the shared preview renderer as published copy blocks.",
        editableField: {
          control: "textarea",
          hint: "Saved text appears in the existing preview route without extra runtime wiring.",
          label: "Text content",
          value: node.text,
        },
        kind: node.kind,
        label: getBuilderViewNodeLabel(node),
        meta: [
          {
            label: "Characters",
            value: String(node.text.length),
          },
        ],
        nodeId: node.id,
        readOnlyNotice: null,
      };
    case "field": {
      const field = getFieldDefinition(source, node.fieldId);

      return {
        childCount,
        description: "Field bindings stay grounded in typed field contracts while widget selection remains editable in the authoring slice.",
        editableField: {
          control: "input",
          hint: "This widget key is saved into the draft and reused by preview/runtime placeholders.",
          label: "Widget key",
          value: node.widgetKey,
        },
        kind: node.kind,
        label: getBuilderViewNodeLabel(node, source),
        meta: [
          {
            label: "Field",
            value: field?.label ?? node.fieldId,
          },
          {
            label: "Field id",
            value: node.fieldId,
          },
          {
            label: "Data type",
            value: field?.dataType ?? "Unknown",
          },
          {
            label: "Required",
            value: field?.required ? "Yes" : "No",
          },
        ],
        nodeId: node.id,
        readOnlyNotice: null,
      };
    }
    case "collection": {
      const collection = getCollectionDefinition(source, node.collectionId);

      return {
        childCount,
        description: "Collection nodes stay visible so authored child surfaces remain understandable, but collection editing is intentionally deferred.",
        editableField: null,
        kind: node.kind,
        label: getBuilderViewNodeLabel(node, source),
        meta: [
          {
            label: "Collection",
            value: collection?.label ?? node.collectionId,
          },
          {
            label: "Presentation",
            value: node.presentation ?? "stack",
          },
        ],
        nodeId: node.id,
        readOnlyNotice: "Collection editing is deferred in slice 1 to keep form and view authoring bounded.",
      };
    }
    case "tabs":
      return {
        childCount,
        description: "Tabs containers stay visible in the outline so the authored layout remains understandable.",
        editableField: null,
        kind: node.kind,
        label: getBuilderViewNodeLabel(node),
        meta: [
          {
            label: "Tabs",
            value: `${childCount} configured ${childCount === 1 ? "tab" : "tabs"}`,
          },
        ],
        nodeId: node.id,
        readOnlyNotice: "Tab structure is read-only in this slice.",
      };
    case "tab":
      return {
        childCount,
        description: "Tab nodes are rendered in the outline, but tab label editing and tab structure remain deferred.",
        editableField: null,
        kind: node.kind,
        label: getBuilderViewNodeLabel(node),
        meta: [
          {
            label: "Body slot",
            value: `${childCount} child ${childCount === 1 ? "node" : "nodes"}`,
          },
        ],
        nodeId: node.id,
        readOnlyNotice: "Tab labels remain read-only in this slice.",
      };
    case "divider":
      return {
        childCount,
        description: "Divider nodes separate authored blocks inside supported containers.",
        editableField: null,
        kind: node.kind,
        label: getBuilderViewNodeLabel(node),
        meta: [],
        nodeId: node.id,
        readOnlyNotice: "Divider nodes do not expose additional parameters in this slice.",
      };
  }
}
