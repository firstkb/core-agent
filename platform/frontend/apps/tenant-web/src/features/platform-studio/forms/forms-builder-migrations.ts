import type {
  FormsPlaceholderAcceptedFieldKind,
  FormsPlaceholderFieldPreset,
} from "./forms-builder-contract";
import {
  formsPlaceholderAcceptedFieldKinds,
  formsPlaceholderAcceptedFieldPresets,
} from "./forms-builder-contract";

type LegacyWorkspaceDocumentShape = {
  currentParentId: string | null;
  filterDefinitions: unknown;
  nodes: unknown;
  selectedNodeId: string | null;
  subformScopes?: unknown;
  systemFields: unknown;
  viewKind?: "detail" | "form";
  viewSettings?: unknown;
  viewDescription: string;
  viewTitle?: string;
};

type PersistedScopeUiSchema = {
  currentParentId: string | null;
  nodes: unknown;
  selectedNodeId: string | null;
};

type PersistedWorkspaceDocumentV2 = {
  rootScope: {
    currentParentId: string | null;
    nodes: unknown;
    scopeId: "root";
    scopeType: "ROOT";
    selectedNodeId: string | null;
  };
  rootView: {
    filterDefinitions: unknown;
    systemFields: unknown;
    viewKind?: "detail" | "form";
    viewSettings?: unknown;
    viewDescription: string;
    viewTitle?: string;
  };
  selectedScopeId: "root";
  subformScopes: [];
  version: 2;
};

type PersistedWorkspaceDocumentV3 = {
  rootScope: {
    dataSchema: {
      fieldIds: ReadonlyArray<string>;
    };
    scopeId: "root";
    scopeType: "ROOT";
    uiSchema: PersistedScopeUiSchema;
  };
  rootView: {
    filterDefinitions: unknown;
    systemFields: unknown;
    viewKind?: "detail" | "form";
    viewSettings?: unknown;
    viewDescription: string;
    viewTitle?: string;
  };
  selectedScopeId: "root";
  subformScopes: ReadonlyArray<{
    dataSchema: {
      fieldIds: ReadonlyArray<string>;
    };
    filterDefinitions?: unknown;
    parentSubformNodeId: string;
    scopeId: string;
    scopeType: "SUBFORM";
    subformType: "CHECKLIST" | "DEFAULT";
    tableKey: string;
    uiSchema: PersistedScopeUiSchema;
    viewSettings?: {
      actions?: {
        canAdd?: boolean;
        canDelete?: boolean;
        canEdit?: boolean;
      };
      list?: {
        columns?: unknown;
        sorting?: {
          direction?: unknown;
          fieldId?: unknown;
        };
      };
    };
  }>;
  version: 3;
};

type WorkspaceNodeLike = {
  [key: string]: unknown;
  fieldId?: string;
  id: string;
  parentId: string | null;
  subformType?: unknown;
  title?: unknown;
  type: string;
};

export function isAcceptedFieldKind(value: unknown): value is FormsPlaceholderAcceptedFieldKind {
  return typeof value === "string" && formsPlaceholderAcceptedFieldKinds.has(value as FormsPlaceholderAcceptedFieldKind);
}

export function isAcceptedFieldPreset(value: unknown): value is FormsPlaceholderFieldPreset {
  return typeof value === "string" && formsPlaceholderAcceptedFieldPresets.has(value as FormsPlaceholderFieldPreset);
}

export function migrateLegacyFieldKind(
  rawKind: unknown,
  fallback: FormsPlaceholderAcceptedFieldKind,
): FormsPlaceholderAcceptedFieldKind {
  if (rawKind === "text") {
    return "short_text";
  }

  if (rawKind === "number") {
    return "integer";
  }

  if (rawKind === "status") {
    return "single_select";
  }

  return isAcceptedFieldKind(rawKind) ? rawKind : fallback;
}

export function migrateLegacyFieldPreset(
  rawKind: unknown,
  rawPreset: unknown,
  fallback?: FormsPlaceholderFieldPreset,
): FormsPlaceholderFieldPreset | undefined {
  if (rawKind === "status" || rawPreset === "status") {
    return undefined;
  }

  return isAcceptedFieldPreset(rawPreset) ? rawPreset : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function getWorkspaceNodes(value: unknown): WorkspaceNodeLike[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.type !== "string") {
      return [];
    }

    return [{
      ...entry,
      fieldId: typeof entry.fieldId === "string" ? entry.fieldId : undefined,
      id: entry.id,
      parentId: typeof entry.parentId === "string" ? entry.parentId : null,
      title: typeof entry.title === "string" ? entry.title : undefined,
      type: entry.type,
    }];
  });
}

function dedupeStringValues(values: ReadonlyArray<string>) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function slugifyScopeKey(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "subform";
}

function getNearestSubformScopeId(
  node: WorkspaceNodeLike,
  nodeMap: ReadonlyMap<string, WorkspaceNodeLike>,
) {
  const visited = new Set<string>();
  let currentParentId = node.parentId;

  while (typeof currentParentId === "string") {
    if (visited.has(currentParentId)) {
      return null;
    }

    visited.add(currentParentId);
    const parentNode = nodeMap.get(currentParentId);
    if (!parentNode) {
      return null;
    }

    if (parentNode.type === "subform") {
      return parentNode.id;
    }

    currentParentId = parentNode.parentId;
  }

  return null;
}

function buildScopeUiSchema(
  nodes: ReadonlyArray<WorkspaceNodeLike>,
  parentScopeNodeId: string | null,
  options?: {
    stripSubformGridColumns?: boolean;
  },
): PersistedScopeUiSchema {
  const scopeNodes = nodes.map((node) => ({
    ...(options?.stripSubformGridColumns && node.type === "subform"
      ? {
          ...node,
          childGridColumns: undefined,
        }
      : node),
    parentId: parentScopeNodeId !== null && node.parentId === parentScopeNodeId
      ? null
      : node.parentId,
  }));

  return {
    currentParentId: null,
    nodes: scopeNodes,
    selectedNodeId: scopeNodes.find((node) => node.parentId === null)?.id ?? scopeNodes[0]?.id ?? null,
  };
}

export function unwrapPersistedWorkspaceDocument(rawValue: unknown): unknown {
  if (!rawValue || typeof rawValue !== "object") {
    return rawValue;
  }

  const candidateV3 = rawValue as Partial<PersistedWorkspaceDocumentV3>;
  if (candidateV3.version === 3 && candidateV3.rootScope && candidateV3.rootView) {
    const rootScope = isRecord(candidateV3.rootScope) ? candidateV3.rootScope : null;
    const rootUiSchema = rootScope && isRecord(rootScope.uiSchema) ? rootScope.uiSchema : null;
    const subformGridColumnsByNodeId = new Map<string, unknown>();
    if (Array.isArray(candidateV3.subformScopes)) {
      candidateV3.subformScopes.forEach((scopeEntry) => {
        if (!isRecord(scopeEntry) || scopeEntry.scopeType !== "SUBFORM" || typeof scopeEntry.parentSubformNodeId !== "string") {
          return;
        }

        const scopeViewSettings = isRecord(scopeEntry.viewSettings) ? scopeEntry.viewSettings : null;
        const list = scopeViewSettings && isRecord(scopeViewSettings.list) ? scopeViewSettings.list : null;
        if (list?.columns !== undefined) {
          subformGridColumnsByNodeId.set(scopeEntry.parentSubformNodeId, list.columns);
        }
      });
    }

    const rootNodes = getWorkspaceNodes(rootUiSchema?.nodes).map((node) => {
      if (node.type !== "subform") {
        return node;
      }

      const persistedColumns = subformGridColumnsByNodeId.get(node.id);
      return persistedColumns === undefined
        ? node
        : {
            ...node,
            childGridColumns: persistedColumns,
          };
    });
    const subformNodes = Array.isArray(candidateV3.subformScopes)
      ? candidateV3.subformScopes.flatMap((scopeEntry) => {
          if (!isRecord(scopeEntry) || scopeEntry.scopeType !== "SUBFORM" || typeof scopeEntry.parentSubformNodeId !== "string") {
            return [];
          }

          const scopeUiSchema = isRecord(scopeEntry.uiSchema) ? scopeEntry.uiSchema : null;
          return getWorkspaceNodes(scopeUiSchema?.nodes).map((node) => ({
            ...node,
            parentId: node.parentId === null ? scopeEntry.parentSubformNodeId : node.parentId,
          }));
        })
      : [];

    return {
      currentParentId: typeof rootUiSchema?.currentParentId === "string" ? rootUiSchema.currentParentId : null,
      filterDefinitions: candidateV3.rootView.filterDefinitions,
      nodes: [...rootNodes, ...subformNodes],
      selectedNodeId: typeof rootUiSchema?.selectedNodeId === "string" ? rootUiSchema.selectedNodeId : null,
      subformScopes: candidateV3.subformScopes,
      systemFields: candidateV3.rootView.systemFields,
      viewKind: candidateV3.rootView.viewKind,
      viewSettings: candidateV3.rootView.viewSettings,
      viewDescription: candidateV3.rootView.viewDescription,
      viewTitle: candidateV3.rootView.viewTitle,
    } satisfies LegacyWorkspaceDocumentShape;
  }

  const candidate = rawValue as Partial<PersistedWorkspaceDocumentV2>;
  if (candidate.version !== 2 || !candidate.rootScope || !candidate.rootView) {
    return rawValue;
  }

  return {
    currentParentId: candidate.rootScope.currentParentId ?? null,
    filterDefinitions: candidate.rootView.filterDefinitions,
    nodes: candidate.rootScope.nodes,
    selectedNodeId: candidate.rootScope.selectedNodeId ?? null,
    systemFields: candidate.rootView.systemFields,
    viewKind: candidate.rootView.viewKind,
    viewSettings: candidate.rootView.viewSettings,
    viewDescription: candidate.rootView.viewDescription,
    viewTitle: candidate.rootView.viewTitle,
  } satisfies LegacyWorkspaceDocumentShape;
}

export function wrapWorkspaceDocumentForPersistence(
  document: LegacyWorkspaceDocumentShape,
  allFieldIds: ReadonlyArray<string>,
): PersistedWorkspaceDocumentV3 {
  const nodes = getWorkspaceNodes(document.nodes);
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const subformNodes = nodes.filter((node) => node.type === "subform");
  const persistedSubformScopes = Array.isArray(document.subformScopes)
    ? document.subformScopes.filter((entry): entry is Record<string, unknown> => isRecord(entry))
    : [];
  const rootScopeNodes = nodes.filter((node) => getNearestSubformScopeId(node, nodeMap) === null);
  const subformScopes = subformNodes.map((subformNode) => {
    const scopedNodes = nodes.filter((node) => getNearestSubformScopeId(node, nodeMap) === subformNode.id);
    const existingScope = persistedSubformScopes.find((entry) => entry.scopeId === subformNode.id);
    const existingViewSettings = isRecord(existingScope?.viewSettings) ? existingScope.viewSettings : null;
    const existingList = existingViewSettings && isRecord(existingViewSettings.list) ? existingViewSettings.list : null;
    const existingSorting = existingList && isRecord(existingList.sorting) ? existingList.sorting : null;
    const existingActions = existingViewSettings && isRecord(existingViewSettings.actions)
      ? existingViewSettings.actions
      : null;
    const fieldIds = dedupeStringValues(
      scopedNodes
        .filter((node) => node.type === "field" && typeof node.fieldId === "string")
        .map((node) => node.fieldId as string),
    );

    return {
      dataSchema: {
        fieldIds,
      },
      filterDefinitions: existingScope?.filterDefinitions,
      parentSubformNodeId: subformNode.id,
      scopeId: subformNode.id,
      scopeType: "SUBFORM" as const,
      subformType: (subformNode.subformType === "CHECKLIST" ? "CHECKLIST" : "DEFAULT") as "CHECKLIST" | "DEFAULT",
      tableKey: `pb_${slugifyScopeKey(typeof subformNode.title === "string" ? subformNode.title : subformNode.id)}`,
      uiSchema: buildScopeUiSchema(scopedNodes, subformNode.id),
      viewSettings: {
        actions: {
          canAdd: typeof existingActions?.canAdd === "boolean" ? existingActions.canAdd : true,
          canDelete: typeof existingActions?.canDelete === "boolean" ? existingActions.canDelete : true,
          canEdit: typeof existingActions?.canEdit === "boolean" ? existingActions.canEdit : true,
        },
        list: {
          columns: existingList?.columns ?? subformNode.childGridColumns,
          sorting: {
            direction: existingSorting?.direction === "desc" ? "desc" : "asc",
            fieldId: typeof existingSorting?.fieldId === "string" ? existingSorting.fieldId : undefined,
          },
        },
      },
    };
  });
  const subformFieldIds = new Set(
    subformScopes.flatMap((scope) => scope.dataSchema.fieldIds),
  );
  const rootFieldIds = dedupeStringValues(
    allFieldIds.filter((fieldId) => !subformFieldIds.has(fieldId)),
  );

  return {
    rootScope: {
      dataSchema: {
        fieldIds: rootFieldIds,
      },
      scopeId: "root",
      scopeType: "ROOT",
      uiSchema: buildScopeUiSchema(rootScopeNodes, null, { stripSubformGridColumns: true }),
    },
    rootView: {
      filterDefinitions: document.filterDefinitions,
      systemFields: document.systemFields,
      viewKind: document.viewKind,
      viewSettings: document.viewSettings,
      viewDescription: document.viewDescription,
      viewTitle: document.viewTitle,
    },
    selectedScopeId: "root",
    subformScopes,
    version: 3,
  };
}
