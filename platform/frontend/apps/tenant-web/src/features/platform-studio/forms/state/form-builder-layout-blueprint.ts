import type { FormBuilderSubformType } from "../forms-builder-contract";
import type { FormBuilderNodeType } from "../forms-builder-state";

export type FormBuilderLayoutBlueprintContainerNodeType =
  | "accordion"
  | "accordion_item"
  | "column"
  | "grid"
  | "group"
  | "section"
  | "subform"
  | "tab_item"
  | "tabs";

export type FormBuilderLayoutBlueprintContainer = {
  containerKey: string;
  containerType: FormBuilderLayoutBlueprintContainerNodeType;
  order: number;
  parentContainerKey: string;
  schemaScopeId?: string;
  subformType?: FormBuilderSubformType;
  tableKey?: string;
  title?: string;
};

export type FormBuilderLayoutBlueprintFieldPlacement = {
  containerKey: string;
  fieldId: string;
  order: number;
};

const blueprintContainerNodeTypes = new Set<FormBuilderLayoutBlueprintContainerNodeType>([
  "accordion",
  "accordion_item",
  "column",
  "grid",
  "group",
  "section",
  "subform",
  "tab_item",
  "tabs",
]);

export const formBuilderScopeRootPlacementKey = "__scope_root__";

export function isBlueprintContainerType(
  value: FormBuilderNodeType | string | null | undefined,
): value is FormBuilderLayoutBlueprintContainerNodeType {
  return typeof value === "string" && blueprintContainerNodeTypes.has(value as FormBuilderLayoutBlueprintContainerNodeType);
}

export function isFormBuilderScopeRootPlacementKey(value: string | null | undefined) {
  return typeof value === "string" && value.trim() === formBuilderScopeRootPlacementKey;
}

export function getLayoutBlueprintScope(
  layoutBlueprint: unknown,
  scopeKey: string,
) {
  if (!layoutBlueprint || typeof layoutBlueprint !== "object") {
    return null;
  }

  const candidate = layoutBlueprint as {
    rootScope?: unknown;
    subformScopes?: unknown;
  };
  if (scopeKey === "root") {
    return candidate.rootScope && typeof candidate.rootScope === "object"
      ? candidate.rootScope as Record<string, unknown>
      : null;
  }

  if (!Array.isArray(candidate.subformScopes)) {
    return null;
  }

  const scope = candidate.subformScopes.find((entry) =>
    entry && typeof entry === "object" && (
      (typeof (entry as { schemaScopeId?: unknown }).schemaScopeId === "string"
        && (entry as { schemaScopeId: string }).schemaScopeId === scopeKey)
      || (typeof (entry as { tableKey?: unknown }).tableKey === "string"
        && (entry as { tableKey: string }).tableKey === scopeKey)
    ),
  );

  return scope && typeof scope === "object" ? scope as Record<string, unknown> : null;
}

export function getLayoutBlueprintContainers(
  value: unknown,
  isSubformType: (value: unknown) => value is FormBuilderSubformType,
): ReadonlyArray<FormBuilderLayoutBlueprintContainer> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const container = entry as Record<string, unknown>;
      const containerKey = typeof container.containerKey === "string" ? container.containerKey.trim() : "";
      const containerType = typeof container.type === "string" ? container.type : "";
      if (!containerKey || !isBlueprintContainerType(containerType)) {
        return [];
      }

      return [{
        containerKey,
        containerType,
        order: typeof container.order === "number" ? container.order : index,
        parentContainerKey: typeof container.parentContainerKey === "string"
          ? container.parentContainerKey
          : "",
        schemaScopeId: typeof container.schemaScopeId === "string" ? container.schemaScopeId : undefined,
        subformType: isSubformType(container.subformType) ? container.subformType : undefined,
        tableKey: typeof container.tableKey === "string" ? container.tableKey : undefined,
        title: typeof container.title === "string" ? container.title : undefined,
      }];
    })
    .sort((left, right) => left.order - right.order);
}

export function getLayoutBlueprintFieldPlacements(
  value: unknown,
  availableFieldIds: ReadonlySet<string>,
): ReadonlyArray<FormBuilderLayoutBlueprintFieldPlacement> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const placement = entry as Record<string, unknown>;
      const fieldId = typeof placement.fieldId === "string" ? placement.fieldId : "";
      const containerKey = typeof placement.containerKey === "string" ? placement.containerKey.trim() : "";
      if (!fieldId || !containerKey || !availableFieldIds.has(fieldId)) {
        return [];
      }

      return [{
        containerKey,
        fieldId,
        order: typeof placement.order === "number" ? placement.order : index,
      }];
    })
    .sort((left, right) => left.order - right.order);
}

export function getLayoutBlueprintUnplacedFieldIds(
  value: unknown,
  availableFieldIds: ReadonlySet<string>,
) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string =>
      typeof entry === "string" && availableFieldIds.has(entry))
    : [];
}
