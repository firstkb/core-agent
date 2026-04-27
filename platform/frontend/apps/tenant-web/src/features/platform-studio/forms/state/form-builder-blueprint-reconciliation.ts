import type { FormsPlaceholderField, FormsPlaceholderObject } from "../forms-placeholder-data";
import type { FormBuilderSubformType } from "../forms-builder-contract";
import type {
  FormBuilderDocument,
  FormBuilderNode,
  FormBuilderNodeType,
  FormBuilderScopeUiSchema,
} from "../forms-builder-state";
import { getFieldSchemaScopeKey } from "./form-builder-default-document";
import {
  getLayoutBlueprintContainers,
  getLayoutBlueprintFieldPlacements,
  getLayoutBlueprintScope,
  getLayoutBlueprintUnplacedFieldIds,
  isBlueprintContainerType,
  isFormBuilderScopeRootPlacementKey,
} from "./form-builder-layout-blueprint";
import { getActiveFormBuilderScope } from "./form-builder-selectors";

type BlueprintReconciliationInternals = {
  appendFieldNodeToScopeParent: (
    document: FormBuilderDocument,
    scopeId: "root" | string,
    parentId: string | null,
    field: FormsPlaceholderField,
    order?: number,
    idFactory?: (prefix: string) => string,
  ) => FormBuilderDocument;
  appendScopeUnplacedFieldIds: (uiSchema: FormBuilderScopeUiSchema, fieldIds: ReadonlyArray<string>) => FormBuilderScopeUiSchema;
  createNode: (
    type: FormBuilderNodeType,
    parentId: string | null,
    order: number,
    partial?: Partial<FormBuilderNode>,
    idFactory?: (prefix: string) => string,
  ) => FormBuilderNode;
  dedupeFieldIds: (values: ReadonlyArray<string>) => string[];
  defaultNodeId: (prefix: string) => string;
  getScopeNodes: (document: FormBuilderDocument, scopeId: "root" | string) => ReadonlyArray<FormBuilderNode>;
  isSubformType: (value: unknown) => value is FormBuilderSubformType;
  updateFormBuilderNode: (
    document: FormBuilderDocument,
    nodeId: string,
    patch: Partial<FormBuilderNode>,
  ) => FormBuilderDocument;
  updateScopeUiSchema: (
    document: FormBuilderDocument,
    scopeId: "root" | string,
    updater: (uiSchema: FormBuilderScopeUiSchema) => FormBuilderScopeUiSchema,
    options?: { extraFieldIds?: ReadonlyArray<string> },
  ) => FormBuilderDocument;
};

type BlueprintReconciliationInput = {
  document: FormBuilderDocument;
  fieldById: ReadonlyMap<string, FormsPlaceholderField>;
  internals: BlueprintReconciliationInternals;
  layoutBlueprint: unknown;
  object: FormsPlaceholderObject;
  options?: {
    enforceCanonicalFieldPlacements?: boolean;
  };
};

export function reconcileFormBuilderDocumentWithLayoutBlueprint({
  document,
  fieldById,
  internals,
  layoutBlueprint,
  object,
  options,
}: BlueprintReconciliationInput) {
  let nextDocument = document;

  const reconcileScope = (
    scopeId: "root" | string,
    availableFieldIds: ReadonlyArray<string>,
    blueprintScopeKey: string = scopeId,
  ) => {
    const blueprintScope = getLayoutBlueprintScope(layoutBlueprint, blueprintScopeKey) ?? {
      containers: [],
      fieldPlacements: [],
      schemaScopeId: blueprintScopeKey,
      unplacedFieldIds: [],
    };
    const availableFieldIdSet = new Set(availableFieldIds);
    const normalizeContainerNodes = () =>
      internals.getScopeNodes(nextDocument, scopeId).filter((node) => isBlueprintContainerType(node.type));
    let containerNodeIdsByKey = new Map(
      normalizeContainerNodes()
        .filter((node) => typeof node.containerKey === "string" && node.containerKey.trim().length > 0)
        .map((node) => [node.containerKey as string, node.id]),
    );

    getLayoutBlueprintContainers(blueprintScope.containers, internals.isSubformType)
      .forEach((container) => {
        if (containerNodeIdsByKey.has(container.containerKey)) {
          return;
        }

        let existingNodeId: string | null = null;
        if (container.containerType === "subform") {
          const existingNode = internals.getScopeNodes(nextDocument, scopeId).find((node) =>
            node.type === "subform"
            && (
              (container.tableKey && node.tableKey === container.tableKey)
              || (container.schemaScopeId && node.schemaScopeId === container.schemaScopeId)
            ),
          );
          if (existingNode) {
            existingNodeId = existingNode.id;
            nextDocument = internals.updateFormBuilderNode(nextDocument, existingNode.id, {
              containerKey: container.containerKey,
              schemaScopeId: container.schemaScopeId,
              subformType: container.subformType,
              tableKey: container.tableKey,
              title: container.title,
            });
          }
        }

        if (existingNodeId) {
          containerNodeIdsByKey.set(container.containerKey, existingNodeId);
          return;
        }

        const parentId = container.parentContainerKey
          ? (containerNodeIdsByKey.get(container.parentContainerKey) ?? null)
          : null;
        let createdNodeId: string | null = null;
        nextDocument = internals.updateScopeUiSchema(nextDocument, scopeId, (uiSchema) => {
          const nextNode = internals.createNode(
            container.containerType,
            parentId,
            container.order,
            {
              containerKey: container.containerKey,
              schemaScopeId: container.schemaScopeId,
              subformType: container.subformType,
              tableKey: container.tableKey,
              title: container.title,
            },
            (prefix) => {
              createdNodeId = internals.defaultNodeId(prefix);
              return createdNodeId;
            },
          );

          return {
            ...uiSchema,
            nodes: [...uiSchema.nodes, nextNode],
          };
        });
        if (createdNodeId) {
          containerNodeIdsByKey.set(container.containerKey, createdNodeId);
        }
      });

    const validContainerNodeIds = new Set(containerNodeIdsByKey.values());
    const placements = getLayoutBlueprintFieldPlacements(
      blueprintScope.fieldPlacements,
      availableFieldIdSet,
    );
    const blueprintUnplacedFieldIds = getLayoutBlueprintUnplacedFieldIds(
      blueprintScope.unplacedFieldIds,
      availableFieldIdSet,
    );
    const scopeRootPlacementFieldIds = new Set(
      placements
        .filter((placement) => isFormBuilderScopeRootPlacementKey(placement.containerKey))
        .map((placement) => placement.fieldId),
    );
    const expectedParentIdByFieldId = new Map<string, string | null>(
      placements.flatMap((placement) => {
        const expectedParentId = isFormBuilderScopeRootPlacementKey(placement.containerKey)
          ? null
          : (containerNodeIdsByKey.get(placement.containerKey) ?? null);
        if (!isFormBuilderScopeRootPlacementKey(placement.containerKey) && !expectedParentId) {
          return [];
        }

        return [[placement.fieldId, expectedParentId] as const];
      }),
    );
    const blueprintUnplacedFieldIdSet = new Set(blueprintUnplacedFieldIds);
    const invalidFieldIds = internals.dedupeFieldIds(
      internals.getScopeNodes(nextDocument, scopeId)
        .filter((node): node is FormBuilderNode & { fieldId: string } =>
          node.type === "field"
          && typeof node.fieldId === "string"
          && (
            (node.parentId === null && !scopeRootPlacementFieldIds.has(node.fieldId))
            || (node.parentId !== null && !validContainerNodeIds.has(node.parentId))
            || (
              options?.enforceCanonicalFieldPlacements === true
              && (
                blueprintUnplacedFieldIdSet.has(node.fieldId)
                || (
                  expectedParentIdByFieldId.has(node.fieldId)
                  && node.parentId !== (expectedParentIdByFieldId.get(node.fieldId) ?? null)
                )
              )
            )
          ))
        .map((node) => node.fieldId),
    );
    if (invalidFieldIds.length > 0) {
      const invalidFieldIdSet = new Set(invalidFieldIds);
      nextDocument = internals.updateScopeUiSchema(nextDocument, scopeId, (uiSchema) => ({
        ...internals.appendScopeUnplacedFieldIds(uiSchema, invalidFieldIds),
        nodes: uiSchema.nodes.filter((node) =>
          node.type !== "field"
          || typeof node.fieldId !== "string"
          || !invalidFieldIdSet.has(node.fieldId)
        ),
      }), { extraFieldIds: invalidFieldIds });
    }

    const boundFieldIds = new Set(
      internals.getScopeNodes(nextDocument, scopeId)
        .filter((node): node is FormBuilderNode & { fieldId: string } =>
          node.type === "field" && typeof node.fieldId === "string")
        .map((node) => node.fieldId),
    );

    placements.forEach((placement) => {
      if (boundFieldIds.has(placement.fieldId)) {
        return;
      }

      const field = fieldById.get(placement.fieldId);
      const isScopeRootPlacement = isFormBuilderScopeRootPlacementKey(placement.containerKey);
      const parentId = isScopeRootPlacement
        ? null
        : (containerNodeIdsByKey.get(placement.containerKey) ?? null);
      if (!field || (!isScopeRootPlacement && !parentId)) {
        return;
      }

      nextDocument = internals.appendFieldNodeToScopeParent(
        nextDocument,
        scopeId,
        parentId,
        field,
        placement.order,
      );
      boundFieldIds.add(placement.fieldId);
    });

    const nextBoundFieldIds = new Set(
      internals.getScopeNodes(nextDocument, scopeId)
        .filter((node): node is FormBuilderNode & { fieldId: string } =>
          node.type === "field" && typeof node.fieldId === "string")
        .map((node) => node.fieldId),
    );
    const nextUnplacedFieldIds = internals.dedupeFieldIds([
      ...getActiveFormBuilderScope(
        scopeId === "root"
          ? nextDocument
          : {
              ...nextDocument,
              activeScopeId: scopeId,
            } as FormBuilderDocument,
      ).uiSchema.unplacedFieldIds,
      ...blueprintUnplacedFieldIds,
      ...availableFieldIds.filter((fieldId) => !nextBoundFieldIds.has(fieldId)),
    ]);

    nextDocument = internals.updateScopeUiSchema(nextDocument, scopeId, (uiSchema) => ({
      ...uiSchema,
      unplacedFieldIds: nextUnplacedFieldIds,
    }), { extraFieldIds: availableFieldIds });
  };

  reconcileScope(
    "root",
    object.fields
      .filter((field) => {
        const scopeKey = getFieldSchemaScopeKey(field);
        return scopeKey === null || scopeKey === "root";
      })
      .map((field) => field.id),
  );
  nextDocument.subformScopes.forEach((scope) => {
    reconcileScope(
      scope.scopeId,
      object.fields
        .filter((field) => getFieldSchemaScopeKey(field) === scope.tableKey)
        .map((field) => field.id),
      scope.tableKey,
    );
  });

  return nextDocument;
}
