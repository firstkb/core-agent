import type {
  FormBuilderDocument,
  FormBuilderNode,
  FormBuilderNodeType,
  FormBuilderScope,
  FormBuilderScopeUiSchema,
} from "../forms-builder-state";

type FormBuilderContainerNodeType =
  | "accordion"
  | "accordion_item"
  | "column"
  | "grid"
  | "group"
  | "section"
  | "subform"
  | "tab_item"
  | "tabs";

const containerChildTypes: Record<"root" | FormBuilderContainerNodeType, ReadonlyArray<FormBuilderNodeType>> = {
  accordion: ["accordion_item"],
  accordion_item: ["group", "grid", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  column: ["group", "grid", "tabs", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  grid: ["column"],
  group: ["group", "grid", "tabs", "accordion", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  root: ["section", "group", "grid", "tabs", "accordion", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  section: ["group", "grid", "tabs", "accordion", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  subform: ["section", "group", "grid", "tabs", "accordion", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field"],
  tab_item: ["group", "grid", "accordion", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  tabs: ["tab_item"],
};

function isFormBuilderContainerType(
  value: FormBuilderNodeType | string | null | undefined,
): value is FormBuilderContainerNodeType {
  return typeof value === "string" && value in containerChildTypes && value !== "root";
}

function dedupeFieldIds(values: ReadonlyArray<string>) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function getScopedFieldIds(scope: FormBuilderScopeUiSchema) {
  return dedupeFieldIds(
    scope.nodes
      .filter((node): node is FormBuilderNode & { fieldId: string } =>
        node.type === "field" && typeof node.fieldId === "string")
      .map((node) => node.fieldId),
  );
}

function getEffectiveScopeFieldIds(
  scope: Pick<FormBuilderScope, "dataSchema" | "uiSchema">,
) {
  return dedupeFieldIds([
    ...scope.dataSchema.fieldIds,
    ...getScopedFieldIds(scope.uiSchema),
  ]);
}

export function getFormBuilderNode(
  document: FormBuilderDocument,
  nodeId: string | null | undefined,
) {
  if (!nodeId) {
    return null;
  }

  return document.rootScope.uiSchema.nodes.find((node) => node.id === nodeId)
    ?? document.subformScopes
      .flatMap((scope) => scope.uiSchema.nodes)
      .find((node) => node.id === nodeId)
    ?? null;
}

export function getActiveFormBuilderScope(document: FormBuilderDocument): FormBuilderScope {
  if (document.activeScopeId === "root") {
    return document.rootScope;
  }

  return document.subformScopes.find((scope) => scope.scopeId === document.activeScopeId) ?? document.rootScope;
}

export function getCurrentFormBuilderParentId(document: FormBuilderDocument) {
  return getActiveFormBuilderScope(document).uiSchema.currentParentId;
}

export function getCurrentFormBuilderSelectedNodeId(document: FormBuilderDocument) {
  return getActiveFormBuilderScope(document).uiSchema.selectedNodeId;
}

export function getCurrentFormBuilderInsertParentId(document: FormBuilderDocument) {
  const activeScope = getActiveFormBuilderScope(document);
  if (activeScope.uiSchema.currentParentId) {
    return activeScope.uiSchema.currentParentId;
  }

  return activeScope.scopeType === "SUBFORM"
    ? activeScope.parentSubformNodeId
    : null;
}

export function getCurrentFormBuilderScopeSubformNode(document: FormBuilderDocument) {
  if (document.activeScopeId === "root") {
    return null;
  }

  return getFormBuilderNode(document, document.activeScopeId);
}

export function getFormBuilderScopeFieldIds(
  document: FormBuilderDocument,
  scopeSubformId: string | null,
) {
  if (!scopeSubformId) {
    return new Set(getEffectiveScopeFieldIds(document.rootScope));
  }

  const subformScope = document.subformScopes.find((scope) => scope.scopeId === scopeSubformId);
  return new Set(subformScope ? getEffectiveScopeFieldIds(subformScope) : []);
}

export function getFormBuilderScopeUnplacedFieldIds(
  document: FormBuilderDocument,
  scopeSubformId: string | null,
) {
  if (!scopeSubformId) {
    return [...document.rootScope.uiSchema.unplacedFieldIds];
  }

  const subformScope = document.subformScopes.find((scope) => scope.scopeId === scopeSubformId);
  return [...(subformScope?.uiSchema.unplacedFieldIds ?? [])];
}

export function getFormBuilderNodeScopeId(
  document: FormBuilderDocument,
  nodeId: string | null | undefined,
): "root" | string | null {
  if (!nodeId) {
    return null;
  }

  if (document.rootScope.uiSchema.nodes.some((node) => node.id === nodeId)) {
    return "root";
  }

  const subformScope = document.subformScopes.find((scope) =>
    scope.uiSchema.nodes.some((node) => node.id === nodeId),
  );

  return subformScope?.scopeId ?? null;
}

export function getFormBuilderChildren(
  document: FormBuilderDocument,
  parentId: string | null,
) {
  if (parentId === null) {
    return [...document.rootScope.uiSchema.nodes]
      .filter((node) => node.parentId === null)
      .sort((left, right) => left.order - right.order);
  }

  const subformScope = document.subformScopes.find((scope) => scope.parentSubformNodeId === parentId);
  if (subformScope) {
    return [...subformScope.uiSchema.nodes]
      .filter((node) => node.parentId === null)
      .sort((left, right) => left.order - right.order);
  }

  const scopeId = getFormBuilderNodeScopeId(document, parentId);
  const scopeNodes = scopeId === "root"
    ? document.rootScope.uiSchema.nodes
    : document.subformScopes.find((scope) => scope.scopeId === scopeId)?.uiSchema.nodes ?? [];

  return [...scopeNodes]
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.order - right.order);
}

export function getCurrentFormBuilderChildren(document: FormBuilderDocument) {
  const activeScope = getActiveFormBuilderScope(document);
  return [...activeScope.uiSchema.nodes]
    .filter((node) => node.parentId === activeScope.uiSchema.currentParentId)
    .sort((left, right) => left.order - right.order);
}

function findParentNode(document: FormBuilderDocument, nodeId: string | null) {
  const node = getFormBuilderNode(document, nodeId);
  return getFormBuilderNode(document, node?.parentId ?? null);
}

export function getFormBuilderBreadcrumb(document: FormBuilderDocument) {
  const breadcrumb: FormBuilderNode[] = [];
  const activeScope = getActiveFormBuilderScope(document);
  let currentNode = getFormBuilderNode(document, activeScope.uiSchema.currentParentId);

  while (currentNode) {
    breadcrumb.unshift(currentNode);
    currentNode = findParentNode(document, currentNode.id);
  }

  if (activeScope.scopeType === "SUBFORM") {
    const scopeNode = getFormBuilderNode(document, activeScope.parentSubformNodeId);
    if (scopeNode && breadcrumb[0]?.id !== scopeNode.id) {
      breadcrumb.unshift(scopeNode);
    }
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

  if (!isFormBuilderContainerType(parentType)) {
    return [];
  }

  return containerChildTypes[parentType];
}
