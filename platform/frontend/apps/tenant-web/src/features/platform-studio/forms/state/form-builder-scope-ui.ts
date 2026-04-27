import type {
  FormBuilderNode,
  FormBuilderNodeType,
  FormBuilderScopeUiSchema,
} from "../forms-builder-state";

type ScopeUiInternals = {
  dedupeFieldIds: (values: ReadonlyArray<string>) => string[];
  isFormBuilderContainer: (nodeType: FormBuilderNodeType) => boolean;
};

export function createFormBuilderScopeUiHelpers({
  dedupeFieldIds,
  isFormBuilderContainer,
}: ScopeUiInternals) {
  function normalizeScopeCurrentParentId(
    nodes: ReadonlyArray<FormBuilderNode>,
    candidate: string | null | undefined,
  ) {
    if (!candidate) {
      return null;
    }

    const parentNode = nodes.find((node) => node.id === candidate);
    return parentNode && isFormBuilderContainer(parentNode.type)
      ? parentNode.id
      : null;
  }

  function getDefaultSelectedNodeIdForScope(
    nodes: ReadonlyArray<FormBuilderNode>,
    allowNull: boolean,
  ) {
    if (allowNull) {
      return null;
    }

    return nodes.find((node) => node.parentId === null)?.id ?? nodes[0]?.id ?? null;
  }

  function normalizeScopeSelectedNodeId(
    nodes: ReadonlyArray<FormBuilderNode>,
    candidate: string | null | undefined,
    options?: { allowNull?: boolean },
  ) {
    if (candidate && nodes.some((node) => node.id === candidate)) {
      return candidate;
    }

    return getDefaultSelectedNodeIdForScope(nodes, options?.allowNull ?? false);
  }

  function getScopePlacedFieldIds(nodes: ReadonlyArray<FormBuilderNode>) {
    return new Set(
      nodes
        .filter((node): node is FormBuilderNode & { fieldId: string } =>
          node.type === "field" && typeof node.fieldId === "string")
        .map((node) => node.fieldId),
    );
  }

  function getScopedFieldIds(
    uiSchema: Pick<FormBuilderScopeUiSchema, "nodes" | "unplacedFieldIds">,
  ) {
    return dedupeFieldIds([
      ...uiSchema.nodes
        .filter((node): node is FormBuilderNode & { fieldId: string } =>
          node.type === "field" && typeof node.fieldId === "string")
        .map((node) => node.fieldId),
      ...(uiSchema.unplacedFieldIds ?? []),
    ]);
  }

  function normalizeScopeUnplacedFieldIds(
    uiSchema: Pick<FormBuilderScopeUiSchema, "nodes" | "unplacedFieldIds">,
    availableFieldIds: ReadonlyArray<string>,
  ) {
    const availableFieldIdSet = new Set(availableFieldIds);
    const placedFieldIds = getScopePlacedFieldIds(uiSchema.nodes);

    return dedupeFieldIds(
      (uiSchema.unplacedFieldIds ?? []).filter((fieldId) =>
        availableFieldIdSet.has(fieldId) && !placedFieldIds.has(fieldId),
      ),
    );
  }

  function appendScopeUnplacedFieldIds(
    uiSchema: FormBuilderScopeUiSchema,
    fieldIds: ReadonlyArray<string>,
  ) {
    return {
      ...uiSchema,
      unplacedFieldIds: dedupeFieldIds([
        ...uiSchema.unplacedFieldIds,
        ...fieldIds,
      ]),
    };
  }

  function removeScopeUnplacedFieldId(
    uiSchema: FormBuilderScopeUiSchema,
    fieldId: string,
  ) {
    return {
      ...uiSchema,
      unplacedFieldIds: uiSchema.unplacedFieldIds.filter((entry) => entry !== fieldId),
    };
  }

  return {
    appendScopeUnplacedFieldIds,
    getDefaultSelectedNodeIdForScope,
    getScopedFieldIds,
    normalizeScopeCurrentParentId,
    normalizeScopeSelectedNodeId,
    normalizeScopeUnplacedFieldIds,
    removeScopeUnplacedFieldId,
  } as const;
}
