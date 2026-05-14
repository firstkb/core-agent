import type {
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "../forms-placeholder-data";
import type {
  FormBuilderSubformType,
} from "../forms-builder-contract";
import type {
  FormBuilderChecklistConfig,
  FormBuilderDataScopeRuntime,
  FormBuilderDocument,
  FormBuilderFilterDefinitions,
  FormBuilderGridColumnDefinition,
  FormBuilderNode,
  FormBuilderNodeRules,
  FormBuilderNodeType,
  FormBuilderRuntimePreset,
  FormBuilderScopeUiSchema,
  FormBuilderSubformScope,
  FormBuilderSubformViewSettings,
  FormBuilderSystemFields,
  FormBuilderViewOnlyBinding,
  FormBuilderViewScopeRuntime,
  FormBuilderViewSettings,
} from "../forms-builder-state";
import { unwrapPersistedWorkspaceDocument } from "../forms-builder-migrations";
import { getRootSeedFieldIds } from "./form-builder-default-document";
import type { FormBuilderFlatWorkspaceState } from "./form-builder-flat-workspace";

type DocumentNormalizationInternals = {
  buildScopedDocumentFromFlatWorkspace: (flatState: FormBuilderFlatWorkspaceState, baseDocument: FormBuilderDocument, extraFieldIds?: ReadonlyArray<string>) => FormBuilderDocument;
  createDefaultFormBuilderDocument: (object: FormsPlaceholderObject, screen: FormsPlaceholderScreen) => FormBuilderDocument;
  createDocumentShell: (viewTitle: string, viewKind: "detail" | "form", viewDescription: string, rootFieldIds: ReadonlyArray<string>) => FormBuilderDocument;
  createEmptyFormBuilderDocument: (object: FormsPlaceholderObject, screen: FormsPlaceholderScreen) => FormBuilderDocument;
  dedupeFieldIds: (values: ReadonlyArray<string>) => string[];
  isFormBuilderContainer: (type: FormBuilderNodeType) => boolean;
  isRuntimePreset: (value: unknown) => value is FormBuilderRuntimePreset;
  isSubformType: (value: unknown) => value is FormBuilderSubformType;
  normalizeDataScopeRuntime: (value: unknown) => FormBuilderDataScopeRuntime | undefined;
  normalizeFilterDefinitions: (value: unknown, fieldIds: ReadonlySet<string>) => FormBuilderFilterDefinitions;
  normalizeGridColumns: (value: unknown, fieldIds: ReadonlySet<string>) => ReadonlyArray<FormBuilderGridColumnDefinition>;
  normalizeNodeRules: (value: unknown, fieldIds: ReadonlySet<string>) => FormBuilderNodeRules;
  normalizeScopeUnplacedFieldIds: (uiSchema: Pick<FormBuilderScopeUiSchema, "nodes" | "unplacedFieldIds">, availableFieldIds: ReadonlyArray<string>) => string[];
  normalizeSubformViewSettings: (value: unknown, fieldIds: ReadonlySet<string>) => FormBuilderSubformViewSettings;
  normalizeSystemFields: (value: unknown, fieldIds: ReadonlySet<string>) => FormBuilderSystemFields;
  normalizeViewOnlyBinding: (value: unknown, fieldIds: ReadonlySet<string>) => FormBuilderViewOnlyBinding | undefined;
  normalizeViewScopeRuntime: (value: unknown) => FormBuilderViewScopeRuntime | undefined;
  normalizeViewSettings: (value: unknown, fieldIds: ReadonlySet<string>) => FormBuilderViewSettings;
  slugifyScopeKey: (value: string) => string;
};

function isValidNodeType(value: unknown): value is FormBuilderNodeType {
  return (
    value === "accordion" ||
    value === "accordion_item" ||
    value === "column" ||
    value === "section" ||
    value === "group" ||
    value === "grid" ||
    value === "heading" ||
    value === "rich_text" ||
    value === "spacer" ||
    value === "subform" ||
    value === "tabs" ||
    value === "tab_item" ||
    value === "text" ||
    value === "view_only_field" ||
    value === "divider" ||
    value === "field"
  );
}

function normalizeChecklistConfig(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderChecklistConfig | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Partial<FormBuilderChecklistConfig>;
  const lookupFieldId =
    typeof candidate.lookupFieldId === "string" && fieldIds.has(candidate.lookupFieldId)
      ? candidate.lookupFieldId
      : undefined;
  const resultFieldId =
    typeof candidate.resultFieldId === "string" && fieldIds.has(candidate.resultFieldId)
      ? candidate.resultFieldId
      : undefined;
  const notesFieldId =
    typeof candidate.notesFieldId === "string" && fieldIds.has(candidate.notesFieldId)
      ? candidate.notesFieldId
      : undefined;
  const grouping = candidate.grouping === "by_first_display_field"
    ? "by_first_display_field"
    : candidate.grouping === "flat"
      ? "flat"
      : undefined;

  if (!lookupFieldId && !resultFieldId && !notesFieldId && !grouping) {
    return undefined;
  }

  return {
    grouping,
    lookupFieldId,
    notesFieldId,
    resultFieldId,
  };
}

export function createFormBuilderDocumentNormalizationHelpers({
  buildScopedDocumentFromFlatWorkspace,
  createDefaultFormBuilderDocument,
  createDocumentShell,
  createEmptyFormBuilderDocument,
  dedupeFieldIds,
  isFormBuilderContainer,
  isRuntimePreset,
  isSubformType,
  normalizeDataScopeRuntime,
  normalizeFilterDefinitions,
  normalizeGridColumns,
  normalizeNodeRules,
  normalizeScopeUnplacedFieldIds,
  normalizeSubformViewSettings,
  normalizeSystemFields,
  normalizeViewOnlyBinding,
  normalizeViewScopeRuntime,
  normalizeViewSettings,
  slugifyScopeKey,
}: DocumentNormalizationInternals) {
  function normalizeFormBuilderDocument(
    rawValue: unknown,
    object: FormsPlaceholderObject,
    screen: FormsPlaceholderScreen,
  ) {
    const normalizedRawValue = unwrapPersistedWorkspaceDocument(rawValue);
    if (!normalizedRawValue || typeof normalizedRawValue !== "object") {
      return createDefaultFormBuilderDocument(object, screen);
    }

    const candidate = normalizedRawValue as Partial<FormBuilderDocument> & { nodes?: unknown };
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

        const legacyChildGridColumns = node.type === "subform" && Array.isArray(node.childGridColumns)
          ? normalizeGridColumns(node.childGridColumns, fieldIds)
          : undefined;

        nodes.push({
          childGridColumns: legacyChildGridColumns && legacyChildGridColumns.length > 0
            ? legacyChildGridColumns
            : undefined,
          containerKey: typeof node.containerKey === "string" ? node.containerKey : undefined,
          fieldId: typeof node.fieldId === "string" ? node.fieldId : undefined,
          helperText: typeof node.helperText === "string" ? node.helperText : "",
          id: node.id,
          order: node.order,
          parentId: typeof node.parentId === "string" ? node.parentId : null,
          required: Boolean(node.required),
          rules: normalizeNodeRules(node.rules, fieldIds),
          runtimePreset: isRuntimePreset(node.runtimePreset) ? node.runtimePreset : undefined,
          schemaScopeId: typeof node.schemaScopeId === "string" ? node.schemaScopeId : undefined,
          checklistConfig: node.type === "subform" && node.subformType === "CHECKLIST"
            ? normalizeChecklistConfig(node.checklistConfig, fieldIds)
            : undefined,
          subformType: node.type === "subform" && isSubformType(node.subformType) ? node.subformType : undefined,
          tableKey: typeof node.tableKey === "string" ? node.tableKey : undefined,
          text: typeof node.text === "string" ? node.text : undefined,
          title: typeof node.title === "string" ? node.title : undefined,
          type: node.type,
          viewOnlyBinding: node.type === "view_only_field"
            ? normalizeViewOnlyBinding(node.viewOnlyBinding, fieldIds)
            : undefined,
          visibility:
            node.visibility === "hidden" || node.visibility === "readonly"
              ? node.visibility
              : "visible",
        });
      });

    const currentParentNode = typeof candidate.currentParentId === "string"
      ? nodes.find((node) => node.id === candidate.currentParentId)
      : null;
    const currentParentId = currentParentNode && isFormBuilderContainer(currentParentNode.type)
      ? currentParentNode.id
      : null;
    const selectedNodeId = typeof candidate.selectedNodeId === "string"
      ? candidate.selectedNodeId
      : null;
    const normalizedDocument = createDocumentShell(
      typeof candidate.viewTitle === "string"
        ? candidate.viewTitle
        : screen.title,
      candidate.viewKind === "detail" || candidate.viewKind === "form"
        ? candidate.viewKind
        : screen.kind,
      typeof candidate.viewDescription === "string"
        ? candidate.viewDescription
        : `${screen.title} for ${object.title}.`,
      getRootSeedFieldIds(object.fields),
    );

    normalizedDocument.filterDefinitions = normalizeFilterDefinitions(candidate.filterDefinitions, fieldIds);
    normalizedDocument.systemFields = normalizeSystemFields(candidate.systemFields, fieldIds);
    normalizedDocument.viewSettings = normalizeViewSettings(candidate.viewSettings, fieldIds);
    normalizedDocument.viewDescription =
      typeof candidate.viewDescription === "string"
        ? candidate.viewDescription
        : `${screen.title} for ${object.title}.`;
    normalizedDocument.viewTitle =
      typeof candidate.viewTitle === "string"
        ? candidate.viewTitle
        : screen.title;
    normalizedDocument.viewKind =
      candidate.viewKind === "detail" || candidate.viewKind === "form"
        ? candidate.viewKind
        : screen.kind;
    normalizedDocument.rootScope.dataSchema.runtime = normalizeDataScopeRuntime(candidate.rootScope?.dataSchema?.runtime);
    normalizedDocument.rootScope.runtime = normalizeViewScopeRuntime(candidate.rootScope?.runtime);
    normalizedDocument.rootScope.uiSchema.unplacedFieldIds = normalizeScopeUnplacedFieldIds(
      {
        nodes: [],
        unplacedFieldIds: Array.isArray(candidate.rootScope?.uiSchema?.unplacedFieldIds)
          ? candidate.rootScope.uiSchema.unplacedFieldIds.filter((value): value is string => typeof value === "string")
          : [],
      },
      normalizedDocument.rootScope.dataSchema.fieldIds,
    );
    normalizedDocument.subformScopes = Array.isArray(candidate.subformScopes)
      ? candidate.subformScopes.flatMap((entry) => {
          if (!entry || typeof entry !== "object") {
            return [];
          }

          const scope = entry as Partial<FormBuilderSubformScope>;
          if (
            scope.scopeType !== "SUBFORM" ||
            typeof scope.scopeId !== "string" ||
            typeof scope.parentSubformNodeId !== "string"
          ) {
            return [];
          }

          const candidateFieldIds = Array.isArray(scope.dataSchema?.fieldIds)
            ? scope.dataSchema.fieldIds.filter((value): value is string => typeof value === "string" && fieldIds.has(value))
            : [];
          const normalizedFieldIds = dedupeFieldIds(candidateFieldIds);

          return [{
            dataSchema: {
              fieldIds: normalizedFieldIds,
              runtime: normalizeDataScopeRuntime(scope.dataSchema?.runtime),
            },
            filterDefinitions: normalizeFilterDefinitions(scope.filterDefinitions, new Set(normalizedFieldIds)),
            parentSubformNodeId: scope.parentSubformNodeId,
            runtime: normalizeViewScopeRuntime(scope.runtime),
            scopeId: scope.scopeId,
            scopeType: "SUBFORM" as const,
            subformType: isSubformType(scope.subformType) ? scope.subformType : "DEFAULT",
            tableKey: typeof scope.tableKey === "string" && scope.tableKey.trim().length > 0
              ? scope.tableKey
              : `pb_${slugifyScopeKey(scope.scopeId)}`,
            uiSchema: {
              currentParentId: null,
              nodes: [],
              selectedNodeId: null,
              unplacedFieldIds: normalizeScopeUnplacedFieldIds(
                {
                  nodes: [],
                  unplacedFieldIds: Array.isArray(scope.uiSchema?.unplacedFieldIds)
                    ? scope.uiSchema.unplacedFieldIds.filter((value): value is string => typeof value === "string")
                    : [],
                },
                normalizedFieldIds,
              ),
            },
            viewSettings: normalizeSubformViewSettings(scope.viewSettings, new Set(normalizedFieldIds)),
          }];
        })
      : [];

    return buildScopedDocumentFromFlatWorkspace(
      {
        currentParentId,
        nodes,
        selectedNodeId,
      },
      normalizedDocument,
    );
  }

  function normalizePersistedFormBuilderDocument(
    rawValue: unknown,
    object: FormsPlaceholderObject,
    screen: FormsPlaceholderScreen,
  ) {
    const normalizedRawValue = unwrapPersistedWorkspaceDocument(rawValue);
    if (!normalizedRawValue || typeof normalizedRawValue !== "object") {
      return createEmptyFormBuilderDocument(object, screen);
    }

    const candidate = normalizedRawValue as { nodes?: unknown };
    if (!Array.isArray(candidate.nodes)) {
      return createEmptyFormBuilderDocument(object, screen);
    }

    return normalizeFormBuilderDocument(rawValue, object, screen);
  }

  return {
    normalizeFormBuilderDocument,
    normalizePersistedFormBuilderDocument,
  } as const;
}
