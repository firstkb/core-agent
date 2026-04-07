import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { FormsAuthoringAccess } from "./forms-actors";
import type {
  FormsPlaceholderField,
  FormsPlaceholderFieldFamily,
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "./forms-placeholder-data";
import {
  getFormsPlaceholderFieldIconKey,
  getFormsPlaceholderFieldSearchText,
} from "./forms-placeholder-data";

export type FormBuilderElementCategory = "containers" | "content" | "layout";
export type FormBuilderNodeType =
  | "column"
  | "divider"
  | "field"
  | "grid"
  | "group"
  | "heading"
  | "repeater"
  | "rich_text"
  | "section"
  | "spacer"
  | "subform"
  | "tab_item"
  | "tabs"
  | "text";
export type FormBuilderNodeVisibility = "hidden" | "readonly" | "visible";
export type FormBuilderFieldPaletteCategory = FormsPlaceholderFieldFamily;
type FormBuilderContainerNodeType = "column" | "grid" | "group" | "repeater" | "section" | "subform" | "tab_item" | "tabs";

export type FormBuilderNode = {
  fieldId?: string;
  helperText?: string;
  id: string;
  order: number;
  parentId: string | null;
  text?: string;
  title?: string;
  type: FormBuilderNodeType;
  visibility: FormBuilderNodeVisibility;
};

export type FormBuilderDocument = {
  currentParentId: string | null;
  nodes: ReadonlyArray<FormBuilderNode>;
  selectedNodeId: string | null;
  viewDescription: string;
};

export type FormBuilderWorkspaceAccess = {
  canAddItems: boolean;
  canEditSettings: boolean;
  canMoveItems: boolean;
  canRemoveItems: boolean;
  lockReasonKey: string | null;
};

export type FormBuilderElementDefinition = {
  category: FormBuilderElementCategory;
  descriptionKey: string;
  iconKey: string;
  labelKey: string;
  nodeType: Exclude<FormBuilderNodeType, "field">;
  searchTerms: ReadonlyArray<string>;
};

export type FormBuilderElementPaletteItem = FormBuilderElementDefinition & {
  disabled: boolean;
  disabledReasonKey: string | null;
  kind: "element";
};

export type FormBuilderFieldPaletteItem = {
  category: FormBuilderFieldPaletteCategory;
  descriptionKey: string;
  disabled: boolean;
  disabledReasonKey: string | null;
  field: FormsPlaceholderField;
  iconKey: string;
  kind: "field";
};

export type FormBuilderPaletteItem = FormBuilderElementPaletteItem | FormBuilderFieldPaletteItem;

const legacyFormsWorkspaceStoragePrefix = "tenant-web-platform-studio-screen-document";
const formsWorkspaceSavedStoragePrefix = "tenant-web-platform-studio-screen-document-saved";

const containerChildTypes: Record<"root" | FormBuilderContainerNodeType, ReadonlyArray<FormBuilderNodeType>> = {
  column: ["group", "grid", "tabs", "heading", "text", "rich_text", "divider", "spacer", "field", "subform", "repeater"],
  grid: ["column"],
  group: ["group", "grid", "tabs", "heading", "text", "rich_text", "divider", "spacer", "field", "subform", "repeater"],
  repeater: ["group", "grid", "tabs", "heading", "text", "rich_text", "divider", "spacer", "field"],
  root: ["section", "group", "grid", "tabs", "heading", "text", "rich_text", "divider", "spacer", "field", "subform", "repeater"],
  section: ["group", "grid", "tabs", "heading", "text", "rich_text", "divider", "spacer", "field", "subform", "repeater"],
  subform: ["group", "grid", "tabs", "heading", "text", "rich_text", "divider", "spacer", "field"],
  tab_item: ["group", "grid", "heading", "text", "rich_text", "divider", "spacer", "field", "subform", "repeater"],
  tabs: ["tab_item"],
};

export const formBuilderElementDefinitions: ReadonlyArray<FormBuilderElementDefinition> = [
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.sectionDescription",
    iconKey: "section",
    labelKey: "tenant.platformStudio.forms.builder.palette.section",
    nodeType: "section",
    searchTerms: ["section"],
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.groupDescription",
    iconKey: "group",
    labelKey: "tenant.platformStudio.forms.builder.palette.group",
    nodeType: "group",
    searchTerms: ["group"],
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.gridDescription",
    iconKey: "grid",
    labelKey: "tenant.platformStudio.forms.builder.palette.grid",
    nodeType: "grid",
    searchTerms: ["grid", "grid layout", "columns"],
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.columnDescription",
    iconKey: "column",
    labelKey: "tenant.platformStudio.forms.builder.palette.column",
    nodeType: "column",
    searchTerms: ["column"],
  },
  {
    category: "containers",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.tabsDescription",
    iconKey: "tabs",
    labelKey: "tenant.platformStudio.forms.builder.palette.tabs",
    nodeType: "tabs",
    searchTerms: ["tabs", "tabbed"],
  },
  {
    category: "containers",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.tabItemDescription",
    iconKey: "tab_item",
    labelKey: "tenant.platformStudio.forms.builder.palette.tabItem",
    nodeType: "tab_item",
    searchTerms: ["tab", "tab item"],
  },
  {
    category: "containers",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.subformDescription",
    iconKey: "subform",
    labelKey: "tenant.platformStudio.forms.builder.palette.subform",
    nodeType: "subform",
    searchTerms: ["subform", "nested form", "related model"],
  },
  {
    category: "containers",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.repeaterDescription",
    iconKey: "repeater",
    labelKey: "tenant.platformStudio.forms.builder.palette.repeater",
    nodeType: "repeater",
    searchTerms: ["repeater", "repeatable group"],
  },
  {
    category: "content",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.headingDescription",
    iconKey: "heading",
    labelKey: "tenant.platformStudio.forms.builder.palette.heading",
    nodeType: "heading",
    searchTerms: ["heading", "title"],
  },
  {
    category: "content",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.textDescription",
    iconKey: "text",
    labelKey: "tenant.platformStudio.forms.builder.palette.text",
    nodeType: "text",
    searchTerms: ["text", "text block", "copy"],
  },
  {
    category: "content",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.richTextDescription",
    iconKey: "rich_text",
    labelKey: "tenant.platformStudio.forms.builder.palette.richText",
    nodeType: "rich_text",
    searchTerms: ["rich text", "formatted content"],
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.dividerDescription",
    iconKey: "divider",
    labelKey: "tenant.platformStudio.forms.builder.palette.divider",
    nodeType: "divider",
    searchTerms: ["divider", "separator"],
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.spacerDescription",
    iconKey: "spacer",
    labelKey: "tenant.platformStudio.forms.builder.palette.spacer",
    nodeType: "spacer",
    searchTerms: ["spacer", "space", "gap"],
  },
] as const;

const formBuilderElementLabels: Record<Exclude<FormBuilderNodeType, "field">, string> = {
  column: "Column",
  divider: "Divider",
  grid: "Grid layout",
  group: "Group",
  heading: "Heading",
  repeater: "Repeater",
  rich_text: "Rich text",
  section: "Section",
  spacer: "Spacer",
  subform: "Subform",
  tab_item: "Tab",
  tabs: "Tabs",
  text: "Text",
};

function defaultNodeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createNode(
  type: FormBuilderNodeType,
  parentId: string | null,
  order: number,
  partial?: Partial<FormBuilderNode>,
  idFactory: (prefix: string) => string = defaultNodeId,
): FormBuilderNode {
  const baseTitle =
    type === "field"
      ? undefined
      : type === "heading"
        ? "Section heading"
        : formBuilderElementLabels[type];
  const baseText =
    type === "text"
      ? "Add supporting guidance or helper copy here."
      : type === "rich_text"
        ? "Use rich text for formatted guidance, callouts, or release notes."
        : undefined;

  return {
    helperText: "",
    id: idFactory(type),
    order,
    parentId,
    text: partial?.text ?? baseText,
    title: partial?.title ?? baseTitle,
    type,
    visibility: "visible",
    ...partial,
  };
}

export function isFormBuilderContainer(type: FormBuilderNodeType) {
  return (
    type === "section" ||
    type === "group" ||
    type === "grid" ||
    type === "column" ||
    type === "tabs" ||
    type === "tab_item" ||
    type === "subform" ||
    type === "repeater"
  );
}

export function getFormsWorkspaceAccess(
  access: FormsAuthoringAccess,
  object: FormsPlaceholderObject,
): FormBuilderWorkspaceAccess {
  const isLocked = object.isStructureLocked;
  const canEditSettings = access.canEditViews;

  return {
    canAddItems: access.canEditViews && !isLocked,
    canEditSettings,
    canMoveItems: access.canEditViews,
    canRemoveItems: access.canEditViews && !isLocked,
    lockReasonKey: isLocked
      ? "tenant.platformStudio.forms.builder.lockedStructureNotice"
      : access.canEditViews
        ? null
        : (access.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.readonly"),
  };
}

export function createDefaultFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
  idFactory?: (prefix: string) => string,
): FormBuilderDocument {
  const sectionTitle = screen.kind === "detail" ? "Summary" : "Main section";
  const section = createNode("section", null, 0, { title: sectionTitle }, idFactory);
  const fieldNodes = object.fields.map((field, index) =>
    createNode(
      "field",
      section.id,
      index,
      {
        fieldId: field.id,
        helperText: "",
        title: field.label,
      },
      idFactory,
    ),
  );

  return {
    currentParentId: null,
    nodes: [section, ...fieldNodes],
    selectedNodeId: section.id,
    viewDescription: `${screen.title} for ${object.title}.`,
  };
}

function isValidNodeType(value: unknown): value is FormBuilderNodeType {
  return (
    value === "column" ||
    value === "section" ||
    value === "group" ||
    value === "grid" ||
    value === "heading" ||
    value === "repeater" ||
    value === "rich_text" ||
    value === "spacer" ||
    value === "subform" ||
    value === "tabs" ||
    value === "tab_item" ||
    value === "text" ||
    value === "divider" ||
    value === "field"
  );
}

export function getFormBuilderNode(
  document: FormBuilderDocument,
  nodeId: string | null | undefined,
) {
  if (!nodeId) {
    return null;
  }

  return document.nodes.find((node) => node.id === nodeId) ?? null;
}

export function getFormBuilderChildren(
  document: FormBuilderDocument,
  parentId: string | null,
) {
  return [...document.nodes]
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.order - right.order);
}

export function getCurrentFormBuilderChildren(document: FormBuilderDocument) {
  return getFormBuilderChildren(document, document.currentParentId);
}

function findParentNode(document: FormBuilderDocument, nodeId: string | null) {
  const node = getFormBuilderNode(document, nodeId);
  return getFormBuilderNode(document, node?.parentId ?? null);
}

export function getFormBuilderBreadcrumb(document: FormBuilderDocument) {
  const breadcrumb: FormBuilderNode[] = [];
  let currentNode = getFormBuilderNode(document, document.currentParentId);

  while (currentNode) {
    breadcrumb.unshift(currentNode);
    currentNode = findParentNode(document, currentNode.id);
  }

  return breadcrumb;
}

export function getBoundFieldIds(document: FormBuilderDocument) {
  return new Set(
    document.nodes
      .filter((node) => node.type === "field" && node.fieldId)
      .map((node) => node.fieldId as string),
  );
}

export function getAllowedChildNodeTypes(
  parentType: FormBuilderNodeType | null,
): ReadonlyArray<FormBuilderNodeType> {
  if (!parentType) {
    return containerChildTypes.root;
  }

  if (!isFormBuilderContainer(parentType)) {
    return [];
  }

  return containerChildTypes[parentType];
}

function normalizeDocument(
  rawValue: unknown,
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
) {
  if (!rawValue || typeof rawValue !== "object") {
    return createDefaultFormBuilderDocument(object, screen);
  }

  const candidate = rawValue as Partial<FormBuilderDocument> & { nodes?: unknown };
  if (!Array.isArray(candidate.nodes)) {
    return createDefaultFormBuilderDocument(object, screen);
  }

  const fieldIds = new Set(object.fields.map((field) => field.id));
  const nodes: FormBuilderNode[] = [];

  candidate.nodes.forEach((entry) => {
      const node = typeof entry === "object" && entry ? entry as Partial<FormBuilderNode> : null;
      if (!node || typeof node.id !== "string" || typeof node.order !== "number" || !isValidNodeType(node.type)) {
        return;
      }

      if (node.type === "field" && (!node.fieldId || !fieldIds.has(node.fieldId))) {
        return;
      }

      nodes.push({
        fieldId: typeof node.fieldId === "string" ? node.fieldId : undefined,
        helperText: typeof node.helperText === "string" ? node.helperText : "",
        id: node.id,
        order: node.order,
        parentId: typeof node.parentId === "string" ? node.parentId : null,
        text: typeof node.text === "string" ? node.text : undefined,
        title: typeof node.title === "string" ? node.title : undefined,
        type: node.type,
        visibility:
          node.visibility === "hidden" || node.visibility === "readonly"
            ? node.visibility
            : "visible",
      });
    });

  if (nodes.length === 0) {
    return createDefaultFormBuilderDocument(object, screen);
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const currentParentNode = typeof candidate.currentParentId === "string" ? nodes.find((node) => node.id === candidate.currentParentId) : null;
  const currentParentId = currentParentNode && isFormBuilderContainer(currentParentNode.type) ? currentParentNode.id : null;
  const selectedNodeId =
    typeof candidate.selectedNodeId === "string" && nodeIds.has(candidate.selectedNodeId)
      ? candidate.selectedNodeId
      : nodes[0]?.id ?? null;

  return {
    currentParentId,
    nodes,
    selectedNodeId,
    viewDescription:
      typeof candidate.viewDescription === "string"
        ? candidate.viewDescription
        : `${screen.title} for ${object.title}.`,
  } satisfies FormBuilderDocument;
}

function getDefaultSelectedNodeId(document: FormBuilderDocument) {
  const rootChildren = getFormBuilderChildren(document, null);
  return rootChildren[0]?.id ?? document.nodes[0]?.id ?? null;
}

function getPersistedFormBuilderDocument(document: FormBuilderDocument): FormBuilderDocument {
  return {
    ...document,
    currentParentId: null,
    selectedNodeId: getDefaultSelectedNodeId(document),
  };
}

function resetFormBuilderWorkspaceNavigation(document: FormBuilderDocument): FormBuilderDocument {
  return {
    ...document,
    currentParentId: null,
    selectedNodeId: getDefaultSelectedNodeId(document),
  };
}

export function readFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
): FormBuilderDocument {
  if (typeof window === "undefined") {
    return createDefaultFormBuilderDocument(object, screen);
  }

  const savedStorageKey = `${formsWorkspaceSavedStoragePrefix}:${object.id}:${screen.id}`;
  const legacyStorageKey = `${legacyFormsWorkspaceStoragePrefix}:${object.id}:${screen.id}`;

  try {
    const savedValue = window.localStorage.getItem(savedStorageKey);
    if (savedValue) {
      return resetFormBuilderWorkspaceNavigation(normalizeDocument(JSON.parse(savedValue), object, screen));
    }

    const legacyValue = window.localStorage.getItem(legacyStorageKey);
    if (legacyValue) {
      return resetFormBuilderWorkspaceNavigation(normalizeDocument(JSON.parse(legacyValue), object, screen));
    }
  } catch {
    return createDefaultFormBuilderDocument(object, screen);
  }

  return createDefaultFormBuilderDocument(object, screen);
}

export function saveFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
  document: FormBuilderDocument,
) {
  if (typeof window === "undefined") {
    return;
  }

  const savedStorageKey = `${formsWorkspaceSavedStoragePrefix}:${object.id}:${screen.id}`;
  const legacyStorageKey = `${legacyFormsWorkspaceStoragePrefix}:${object.id}:${screen.id}`;

  try {
    window.localStorage.setItem(savedStorageKey, JSON.stringify(getPersistedFormBuilderDocument(document)));
    window.localStorage.removeItem(legacyStorageKey);
  } catch {
    // Ignore localStorage failures so the builder stays usable in restricted environments.
  }
}

export function useFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
) {
  const storageSignature = useMemo(() => `${object.id}:${screen.id}`, [object.id, screen.id]);
  const [document, setDocument] = useState<FormBuilderDocument>(() => readFormBuilderDocument(object, screen));
  const [savedDocument, setSavedDocument] = useState<FormBuilderDocument>(() =>
    getPersistedFormBuilderDocument(readFormBuilderDocument(object, screen)),
  );

  useEffect(() => {
    const nextSavedDocument = readFormBuilderDocument(object, screen);
    setDocument(nextSavedDocument);
    setSavedDocument(getPersistedFormBuilderDocument(nextSavedDocument));
  }, [object, screen, storageSignature]);

  const isDirty = useMemo(
    () => JSON.stringify(getPersistedFormBuilderDocument(document)) !== JSON.stringify(savedDocument),
    [document, savedDocument],
  );

  const saveDocument = useCallback(() => {
    saveFormBuilderDocument(object, screen, document);
    setSavedDocument(getPersistedFormBuilderDocument(document));
  }, [document, object, screen]);

  return {
    document,
    isDirty,
    saveDocument,
    savedDocument,
    setDocument,
  } as const;
}

export function updateFormBuilderNode(
  document: FormBuilderDocument,
  nodeId: string,
  updates: Partial<FormBuilderNode>,
): FormBuilderDocument {
  return {
    ...document,
    nodes: document.nodes.map((node) => {
      if (node.id !== nodeId) {
        return node;
      }

      return {
        ...node,
        ...updates,
      };
    }),
  };
}

export function setFormBuilderCurrentParent(
  document: FormBuilderDocument,
  parentId: string | null,
): FormBuilderDocument {
  if (!parentId) {
    return {
      ...document,
      currentParentId: null,
    };
  }

  const parentNode = getFormBuilderNode(document, parentId);
  if (!parentNode || !isFormBuilderContainer(parentNode.type)) {
    return document;
  }

  return {
    ...document,
    currentParentId: parentNode.id,
    selectedNodeId: parentNode.id,
  };
}

export function selectFormBuilderNode(
  document: FormBuilderDocument,
  nodeId: string | null,
): FormBuilderDocument {
  if (!nodeId) {
    return {
      ...document,
      selectedNodeId: null,
    };
  }

  if (!getFormBuilderNode(document, nodeId)) {
    return document;
  }

  return {
    ...document,
    selectedNodeId: nodeId,
  };
}

function getNextOrderValue(document: FormBuilderDocument, parentId: string | null) {
  const siblings = getFormBuilderChildren(document, parentId);
  return siblings.length;
}

export function addFormBuilderElementNode(
  document: FormBuilderDocument,
  parentId: string | null,
  nodeType: Exclude<FormBuilderNodeType, "field">,
  idFactory?: (prefix: string) => string,
): FormBuilderDocument {
  const parentNode = getFormBuilderNode(document, parentId);
  const allowedTypes = getAllowedChildNodeTypes(parentNode?.type ?? null);
  if (!allowedTypes.includes(nodeType)) {
    return document;
  }

  const nextNode = createNode(nodeType, parentId, getNextOrderValue(document, parentId), undefined, idFactory);

  return {
    ...document,
    nodes: [...document.nodes, nextNode],
    selectedNodeId: nextNode.id,
  };
}

export function addFormBuilderFieldNode(
  document: FormBuilderDocument,
  parentId: string | null,
  field: FormsPlaceholderField,
  idFactory?: (prefix: string) => string,
): FormBuilderDocument {
  const parentNode = getFormBuilderNode(document, parentId);
  const allowedTypes = getAllowedChildNodeTypes(parentNode?.type ?? null);
  if (!allowedTypes.includes("field")) {
    return document;
  }

  if (getBoundFieldIds(document).has(field.id)) {
    return document;
  }

  const nextNode = createNode(
    "field",
    parentId,
    getNextOrderValue(document, parentId),
    {
      fieldId: field.id,
      helperText: "",
      title: field.label,
    },
    idFactory,
  );

  return {
    ...document,
    nodes: [...document.nodes, nextNode],
    selectedNodeId: nextNode.id,
  };
}

function collectDescendantIds(document: FormBuilderDocument, nodeId: string) {
  const descendantIds = new Set<string>([nodeId]);
  let changed = true;

  while (changed) {
    changed = false;

    document.nodes.forEach((node) => {
      if (node.parentId && descendantIds.has(node.parentId) && !descendantIds.has(node.id)) {
        descendantIds.add(node.id);
        changed = true;
      }
    });
  }

  return descendantIds;
}

function resequenceSiblingOrders(nodes: ReadonlyArray<FormBuilderNode>, parentId: string | null) {
  const siblings = [...nodes]
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.order - right.order);
  const nextOrders = new Map(siblings.map((node, index) => [node.id, index]));

  return nodes.map((node) =>
    node.parentId === parentId
      ? {
          ...node,
          order: nextOrders.get(node.id) ?? node.order,
        }
      : node,
  );
}

export function removeFormBuilderNode(
  document: FormBuilderDocument,
  nodeId: string,
): FormBuilderDocument {
  const node = getFormBuilderNode(document, nodeId);
  if (!node) {
    return document;
  }

  const descendants = collectDescendantIds(document, nodeId);
  const nextNodes = resequenceSiblingOrders(
    document.nodes.filter((entry) => !descendants.has(entry.id)),
    node.parentId,
  );

  const currentParentRemoved = document.currentParentId ? descendants.has(document.currentParentId) : false;
  const selectedRemoved = document.selectedNodeId ? descendants.has(document.selectedNodeId) : false;

  return {
    ...document,
    currentParentId: currentParentRemoved ? node.parentId : document.currentParentId,
    nodes: nextNodes,
    selectedNodeId: selectedRemoved ? node.parentId : document.selectedNodeId,
  };
}

export function moveFormBuilderNode(
  document: FormBuilderDocument,
  nodeId: string,
  direction: -1 | 1,
): FormBuilderDocument {
  const node = getFormBuilderNode(document, nodeId);
  if (!node) {
    return document;
  }

  const siblings = getFormBuilderChildren(document, node.parentId);
  const currentIndex = siblings.findIndex((entry) => entry.id === nodeId);
  if (currentIndex === -1) {
    return document;
  }

  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= siblings.length) {
    return document;
  }

  const reordered = [...siblings];
  const [moved] = reordered.splice(currentIndex, 1);
  reordered.splice(nextIndex, 0, moved);
  const nextOrderMap = new Map(reordered.map((entry, index) => [entry.id, index]));

  return {
    ...document,
    nodes: document.nodes.map((entry) => {
      if (entry.parentId !== node.parentId) {
        return entry;
      }

      return {
        ...entry,
        order: nextOrderMap.get(entry.id) ?? entry.order,
      };
    }),
  };
}

export function reorderFormBuilderNode(
  document: FormBuilderDocument,
  activeNodeId: string,
  overNodeId: string,
): FormBuilderDocument {
  const activeNode = getFormBuilderNode(document, activeNodeId);
  const overNode = getFormBuilderNode(document, overNodeId);

  if (!activeNode || !overNode || activeNode.parentId !== overNode.parentId || activeNode.id === overNode.id) {
    return document;
  }

  const siblings = getFormBuilderChildren(document, activeNode.parentId);
  const activeIndex = siblings.findIndex((node) => node.id === activeNodeId);
  const overIndex = siblings.findIndex((node) => node.id === overNodeId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return document;
  }

  const reordered = [...siblings];
  const [moved] = reordered.splice(activeIndex, 1);
  reordered.splice(overIndex, 0, moved);
  const nextOrderMap = new Map(reordered.map((entry, index) => [entry.id, index]));

  return {
    ...document,
    nodes: document.nodes.map((entry) => {
      if (entry.parentId !== activeNode.parentId) {
        return entry;
      }

      return {
        ...entry,
        order: nextOrderMap.get(entry.id) ?? entry.order,
      };
    }),
  };
}

export function getElementPaletteItems(
  document: FormBuilderDocument,
  access: FormBuilderWorkspaceAccess,
  searchTerm: string,
): ReadonlyArray<FormBuilderElementPaletteItem> {
  const parentType = getFormBuilderNode(document, document.currentParentId)?.type ?? null;
  const allowedTypes = new Set(getAllowedChildNodeTypes(parentType));
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return formBuilderElementDefinitions
    .filter((definition) => {
      if (!allowedTypes.has(definition.nodeType)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return definition.searchTerms.some((term) => term.includes(normalizedSearch));
    })
    .map((definition) => ({
      ...definition,
      disabled: !access.canAddItems,
      disabledReasonKey: access.canAddItems ? null : access.lockReasonKey,
      kind: "element",
    }));
}

export function getFieldPaletteItems(
  document: FormBuilderDocument,
  object: FormsPlaceholderObject,
  access: FormBuilderWorkspaceAccess,
  searchTerm: string,
): ReadonlyArray<FormBuilderFieldPaletteItem> {
  const parentType = getFormBuilderNode(document, document.currentParentId)?.type ?? null;
  const allowedTypes = new Set(getAllowedChildNodeTypes(parentType));
  if (!allowedTypes.has("field")) {
    return [];
  }

  const boundFieldIds = getBoundFieldIds(document);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return object.fields
    .filter((field) =>
      !normalizedSearch || getFormsPlaceholderFieldSearchText(field).includes(normalizedSearch),
    )
    .map((field) => {
      const alreadyPlaced = boundFieldIds.has(field.id);
      const disabled = !access.canAddItems || alreadyPlaced;

      return {
        category: field.family,
        descriptionKey: field.isLocked
          ? "tenant.platformStudio.forms.builder.palette.fieldLockedDescription"
          : "tenant.platformStudio.forms.builder.palette.fieldDescription",
        disabled,
        disabledReasonKey: alreadyPlaced
          ? "tenant.platformStudio.forms.builder.palette.fieldAlreadyPlaced"
          : (!access.canAddItems ? access.lockReasonKey : null),
        field,
        iconKey: getFormsPlaceholderFieldIconKey(field),
        kind: "field",
      } satisfies FormBuilderFieldPaletteItem;
    });
}

export function getFormBuilderDisplayLabel(
  node: FormBuilderNode,
  object: FormsPlaceholderObject,
) {
  if (node.type === "field") {
    const field = object.fields.find((entry) => entry.id === node.fieldId);
    return node.title || field?.label || "Field";
  }

  if (node.type === "text") {
    return node.title || "Text";
  }

  return node.title || formBuilderElementLabels[node.type];
}

export function getFormBuilderNodeSummary(
  node: FormBuilderNode,
  document: FormBuilderDocument,
  object: FormsPlaceholderObject,
) {
  if (node.type === "field") {
    const field = object.fields.find((entry) => entry.id === node.fieldId);
    return field?.isLocked
      ? "tenant.platformStudio.forms.builder.summary.fieldLocked"
      : "tenant.platformStudio.forms.builder.summary.field";
  }

  if (node.type === "heading") {
    return "tenant.platformStudio.forms.builder.summary.heading";
  }

  if (node.type === "text") {
    return "tenant.platformStudio.forms.builder.summary.text";
  }

  if (node.type === "rich_text") {
    return "tenant.platformStudio.forms.builder.summary.richText";
  }

  if (node.type === "divider") {
    return "tenant.platformStudio.forms.builder.summary.divider";
  }

  if (node.type === "spacer") {
    return "tenant.platformStudio.forms.builder.summary.spacer";
  }

  const children = getFormBuilderChildren(document, node.id);
  if (children.length > 0) {
    return "tenant.platformStudio.forms.builder.summary.children";
  }

  return "tenant.platformStudio.forms.builder.summary.emptyContainer";
}
