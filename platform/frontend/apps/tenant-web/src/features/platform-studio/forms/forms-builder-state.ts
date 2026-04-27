import type {
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "./forms-placeholder-data";
import type {
  FormBuilderDocument,
  FormBuilderElementDefinition,
  FormBuilderNode,
  FormBuilderNodeType,
  FormBuilderSubformType,
} from "./state/form-builder-types";
import { formBuilderElementDefinitions as formBuilderLibraryElementDefinitions } from "./forms-builder-library";
import { createFormBuilderActions } from "./state/form-builder-actions";
import {
  createPersistedFormBuilderDocument as createPersistedFormBuilderDocumentWithInternals,
  readFormBuilderDocument as readFormBuilderDocumentWithInternals,
  saveFormBuilderDocument as saveFormBuilderDocumentWithInternals,
  useFormBuilderDocument as useFormBuilderDocumentWithInternals,
  type FormBuilderDocumentStorageInternals,
} from "./state/form-builder-document-storage";
import { createFormBuilderDocumentNormalizationHelpers } from "./state/form-builder-document-normalization";
import {
  createFormBuilderDefaultDocumentHelpers,
} from "./state/form-builder-default-document";
import {
  createDefaultFilterDefinitions,
  normalizeFilterDefinitions,
} from "./state/form-builder-filter-normalization";
import { createFormBuilderFlatWorkspaceHelpers } from "./state/form-builder-flat-workspace";
import { createFormBuilderReconciliationHelpers } from "./state/form-builder-reconciliation";
import {
  createDefaultNodeRules,
  normalizeNodeRules,
} from "./state/form-builder-rule-normalization";
import {
  isRuntimePreset,
  normalizeDataScopeRuntime,
  normalizeViewScopeRuntime,
} from "./state/form-builder-runtime-normalization";
import { createFormBuilderScopedDocumentHelpers } from "./state/form-builder-scoped-document";
import {
  createDefaultSystemFields,
  normalizeSystemFields,
} from "./state/form-builder-system-field-normalization";
import {
  createDefaultSubformViewSettings,
  createDefaultViewSettings,
  normalizeGridColumns,
  normalizeViewOnlyBinding,
  normalizeSubformViewSettings,
  normalizeViewSettings,
} from "./state/form-builder-view-normalization";
import {
  getElementPaletteItems,
  getFieldPaletteItems,
  getFormBuilderDisplayLabel,
  getFormBuilderNodeSummary,
  getFormsWorkspaceAccess,
  isFormBuilderContainer,
} from "./state/form-builder-palette-selectors";
import {
  getActiveFormBuilderScope,
  getBoundFieldIds,
  getCurrentFormBuilderChildren,
  getCurrentFormBuilderInsertParentId,
  getCurrentFormBuilderParentId,
  getCurrentFormBuilderScopeSubformNode,
  getCurrentFormBuilderSelectedNodeId,
  getFormBuilderBreadcrumb,
  getFormBuilderChildren,
  getFormBuilderNode,
  getFormBuilderNodeScopeId,
  getFormBuilderScopeFieldIds,
  getFormBuilderScopeUnplacedFieldIds,
} from "./state/form-builder-selectors";

export {
  getElementPaletteItems,
  getFieldPaletteItems,
  getFormBuilderDisplayLabel,
  getFormBuilderNodeSummary,
  getFormsWorkspaceAccess,
  isFormBuilderContainer,
} from "./state/form-builder-palette-selectors";

export {
  formBuilderScopeRootPlacementKey,
} from "./state/form-builder-layout-blueprint";

export {
  normalizeDataScopeRuntime,
  normalizeViewScopeRuntime,
} from "./state/form-builder-runtime-normalization";

export {
  getActiveFormBuilderScope,
  getAllowedChildNodeTypes,
  getBoundFieldIds,
  getCurrentFormBuilderChildren,
  getCurrentFormBuilderInsertParentId,
  getCurrentFormBuilderParentId,
  getCurrentFormBuilderScopeSubformNode,
  getCurrentFormBuilderSelectedNodeId,
  getFormBuilderBreadcrumb,
  getFormBuilderChildren,
  getFormBuilderNode,
  getFormBuilderNodeScopeId,
  getFormBuilderScopeFieldIds,
  getFormBuilderScopeUnplacedFieldIds,
} from "./state/form-builder-selectors";

export type * from "./state/form-builder-types";

export const formBuilderElementDefinitions: ReadonlyArray<FormBuilderElementDefinition> = formBuilderLibraryElementDefinitions;

const formBuilderElementLabels: Record<Exclude<FormBuilderNodeType, "field">, string> = {
  accordion: "Accordion",
  accordion_item: "Accordion item",
  column: "Column",
  divider: "Divider",
  grid: "Grid layout",
  group: "Group",
  heading: "Heading",
  rich_text: "Rich text",
  section: "Section",
  spacer: "Spacer",
  subform: "Subform",
  tab_item: "Tab",
  tabs: "Tabs",
  text: "Text",
  view_only_field: "View-only field",
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
  const nextId = idFactory(type);

  return {
    helperText: "",
    id: nextId,
    order,
    parentId,
    required: false,
    schemaScopeId: type === "subform" ? (partial?.schemaScopeId ?? partial?.tableKey ?? nextId) : partial?.schemaScopeId,
    tableKey: type === "subform" ? (partial?.tableKey ?? partial?.schemaScopeId ?? nextId) : partial?.tableKey,
    text: partial?.text ?? baseText,
    title: partial?.title ?? baseTitle,
    type,
    visibility: "visible",
    ...partial,
  };
}

function isSubformType(value: unknown): value is FormBuilderSubformType {
  return value === "CHECKLIST" || value === "DEFAULT";
}

function dedupeFieldIds(values: ReadonlyArray<string>) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function slugifyScopeKey(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "subform";
}

const scopedDocumentHelpers = createFormBuilderScopedDocumentHelpers({
  dedupeFieldIds,
  isFormBuilderContainer,
  normalizeFilterDefinitions,
  normalizeSubformViewSettings,
  slugifyScopeKey,
});

const {
  appendScopeUnplacedFieldIds,
  finalizeScopedDocument,
  getDefaultSelectedNodeIdForScope,
  getScopeNodes,
  getScopedFieldIds,
  getSubformScope,
  normalizeScopeCurrentParentId,
  normalizeScopeSelectedNodeId,
  normalizeScopeUnplacedFieldIds,
  removeScopeUnplacedFieldId,
  updateScopeUiSchema,
  withFlatCompatibilityCache,
} = scopedDocumentHelpers;

const flatWorkspaceHelpers = createFormBuilderFlatWorkspaceHelpers({
  dedupeFieldIds,
  getScopedFieldIds,
  normalizeFilterDefinitions,
  normalizeScopeCurrentParentId,
  normalizeScopeSelectedNodeId,
  normalizeScopeUnplacedFieldIds,
  normalizeSubformViewSettings,
  slugifyScopeKey,
  withFlatCompatibilityCache,
});

const {
  buildScopedDocumentFromFlatWorkspace,
} = flatWorkspaceHelpers;

const defaultDocumentHelpers = createFormBuilderDefaultDocumentHelpers({
  buildScopedDocumentFromFlatWorkspace,
  createDefaultFilterDefinitions,
  createDefaultSubformViewSettings,
  createDefaultSystemFields,
  createDefaultViewSettings,
  createNode,
  dedupeFieldIds,
});

const {
  createDocumentShell,
  createEmptyFormBuilderDocument,
} = defaultDocumentHelpers;

export function createDefaultFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
): FormBuilderDocument {
  return defaultDocumentHelpers.createDefaultFormBuilderDocument(object, screen);
}

const documentNormalizationHelpers = createFormBuilderDocumentNormalizationHelpers({
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
});

export function normalizeFormBuilderDocument(
  rawValue: unknown,
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
) {
  return documentNormalizationHelpers.normalizeFormBuilderDocument(
    rawValue,
    object,
    screen,
  );
}

export function normalizePersistedFormBuilderDocument(
  rawValue: unknown,
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
) {
  return documentNormalizationHelpers.normalizePersistedFormBuilderDocument(
    rawValue,
    object,
    screen,
  );
}

const formBuilderDocumentStorageInternals: FormBuilderDocumentStorageInternals = {
  createDefaultFormBuilderDocument,
  normalizeFormBuilderDocument,
  withFlatCompatibilityCache,
};

export function createPersistedFormBuilderDocument(document: FormBuilderDocument) {
  return createPersistedFormBuilderDocumentWithInternals(
    document,
    formBuilderDocumentStorageInternals,
  );
}

export function readFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
): FormBuilderDocument {
  return readFormBuilderDocumentWithInternals(
    object,
    screen,
    formBuilderDocumentStorageInternals,
  );
}

export function saveFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
  document: FormBuilderDocument,
) {
  return saveFormBuilderDocumentWithInternals(
    object,
    screen,
    document,
    formBuilderDocumentStorageInternals,
  );
}

export function useFormBuilderDocument(
  object: FormsPlaceholderObject,
  screen: FormsPlaceholderScreen,
) {
  return useFormBuilderDocumentWithInternals(
    object,
    screen,
    formBuilderDocumentStorageInternals,
  );
}

const formBuilderActions = createFormBuilderActions({
  appendScopeUnplacedFieldIds,
  createNode,
  finalizeScopedDocument,
  getDefaultSelectedNodeIdForScope,
  getNextOrderValue,
  getScopeNodes,
  getSubformScope,
  removeScopeUnplacedFieldId,
  updateScopeUiSchema,
  withFlatCompatibilityCache,
});

export const updateFormBuilderNode = formBuilderActions.updateFormBuilderNode;
export const setFormBuilderCurrentParent = formBuilderActions.setFormBuilderCurrentParent;
export const selectFormBuilderNode = formBuilderActions.selectFormBuilderNode;
export const addFormBuilderElementNode = formBuilderActions.addFormBuilderElementNode;
export const addFormBuilderFieldNode = formBuilderActions.addFormBuilderFieldNode;
export const removeFormBuilderNode = formBuilderActions.removeFormBuilderNode;
export const moveFormBuilderNode = formBuilderActions.moveFormBuilderNode;
export const reorderFormBuilderNode = formBuilderActions.reorderFormBuilderNode;

function getNextOrderValue(
  nodes: ReadonlyArray<FormBuilderNode>,
  parentId: string | null,
) {
  const siblings = nodes.filter((node) => node.parentId === parentId);
  return siblings.length;
}

const reconciliationHelpers = createFormBuilderReconciliationHelpers({
  appendScopeUnplacedFieldIds,
  createNode,
  dedupeFieldIds,
  defaultNodeId,
  getNextOrderValue,
  getScopeNodes,
  isSubformType,
  removeScopeUnplacedFieldId,
  updateFormBuilderNode,
  updateScopeUiSchema,
  withFlatCompatibilityCache,
});

export const reconcileFormBuilderDocumentWithModel =
  reconciliationHelpers.reconcileFormBuilderDocumentWithModel;
