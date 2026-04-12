import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { FormsAuthoringAccess } from "./forms-actors";
import type {
  FormsPlaceholderField,
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "./forms-placeholder-data";
import {
  getFormsPlaceholderFieldIconKey,
  getFormsPlaceholderFieldSearchText,
} from "./forms-placeholder-data";
import type {
  FormBuilderElementCategory as FormBuilderElementCategoryContract,
  FormBuilderNodeType as FormBuilderNodeTypeContract,
  FormBuilderPaletteSectionKey,
  FormBuilderSubformType,
} from "./forms-builder-contract";
import {
  formBuilderElementDefinitions as formBuilderLibraryElementDefinitions,
  formBuilderFieldDefinitions,
  getFormBuilderFieldPaletteSection,
  type FormBuilderLibraryFieldDefinition,
} from "./forms-builder-library";
import {
  unwrapPersistedWorkspaceDocument,
  wrapWorkspaceDocumentForPersistence,
} from "./forms-builder-migrations";

export type FormBuilderElementCategory = FormBuilderElementCategoryContract;
export type FormBuilderNodeType = FormBuilderNodeTypeContract;
export type FormBuilderNodeVisibility = "hidden" | "readonly" | "visible";
export type FormBuilderRuntimePreset =
  | "badge"
  | "geo_capture"
  | "radio_chips"
  | "readonly_card"
  | "relation_summary_card"
  | "select"
  | "signature_pad";
export type FormBuilderFieldPaletteCategory = Exclude<
  FormBuilderPaletteSectionKey,
  "content" | "layout" | "systemFields"
>;
type FormBuilderContainerNodeType = "column" | "grid" | "group" | "section" | "subform" | "tab_item" | "tabs";
export type FormBuilderSystemFields = {
  version: 1;
  reportedBy?: {
    fieldId: string;
  };
  reportedDate?: {
    fieldId: string;
  };
  workflowStatus?: {
    fieldId: string;
    finalValue?: string;
    initialValue?: string;
  };
};
export type FormBuilderFilterToken =
  | "currentUser.companyId"
  | "currentUser.companyName"
  | "currentUser.divisionId"
  | "currentUser.divisionName"
  | "currentUser.projectAccessIds";
export type FormBuilderLookupDynamicToken =
  | "assigned_projects"
  | "current_user_company_id"
  | "current_user_company_name"
  | "current_user_division_id"
  | "current_user_division_name"
  | "current_user_id";
export type FormBuilderLookupPreset =
  | "company_lookup"
  | "contact_lookup"
  | "generic_db_lookup"
  | "project_lookup";
export type FormBuilderRelativeDatePreset =
  | "current_month"
  | "current_quarter"
  | "current_week"
  | "current_year"
  | "last_12_months"
  | "last_month"
  | "last_quarter"
  | "last_week"
  | "last_year"
  | "next_3_days"
  | "next_5_days"
  | "next_7_days"
  | "next_month"
  | "next_quarter"
  | "next_week"
  | "next_year"
  | "today_or_earlier"
  | "today_or_later";
export type FormBuilderFilterScalar = boolean | number | string;
export type FormBuilderFilterValueSource =
  | {
      kind: "literal";
      value: FormBuilderFilterScalar;
    }
  | {
      kind: "literal_array";
      value: ReadonlyArray<FormBuilderFilterScalar>;
    }
  | {
      kind: "token";
      token: FormBuilderFilterToken;
    }
  | {
      end: FormBuilderFilterScalar;
      kind: "scalar_range";
      start: FormBuilderFilterScalar;
    }
  | {
      kind: "relative_date";
      preset: FormBuilderRelativeDatePreset;
    };
export type FormBuilderFilterOperator =
  | "between"
  | "contains"
  | "eq"
  | "gt"
  | "gte"
  | "in"
  | "is_empty"
  | "is_not_empty"
  | "lt"
  | "lte"
  | "neq"
  | "not_contains"
  | "relative_date";
export type FormBuilderRuleOperator =
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "is_empty"
  | "not_empty"
  | "gt"
  | "gte"
  | "lt"
  | "lte";
export type FormBuilderLookupFilterClause = {
  clauseKey: string;
  dynamicToken?: FormBuilderLookupDynamicToken;
  id: string;
  value?: FormBuilderFilterScalar;
  valueMode: "boolean_flag" | "dynamic_token" | "literal";
};
export type FormBuilderScalarFilterCondition = {
  fieldId: string;
  operator: FormBuilderFilterOperator;
  valueSource?: FormBuilderFilterValueSource;
};
export type FormBuilderLookupFilterCondition = {
  clauses: ReadonlyArray<FormBuilderLookupFilterClause>;
  editorType: "lookup";
  fieldId: string;
  lookupPreset: FormBuilderLookupPreset;
};
export type FormBuilderFilterCondition =
  | FormBuilderLookupFilterCondition
  | FormBuilderScalarFilterCondition;
export type FormBuilderRuleScalar = boolean | number | string;
export type FormBuilderRuleCondition = {
  fieldId: string;
  id: string;
  operator: FormBuilderRuleOperator;
  value?: FormBuilderRuleScalar;
  values?: ReadonlyArray<FormBuilderRuleScalar>;
};
export type FormBuilderVisibilityRule = {
  effect: "hide" | "show";
  id: string;
  when: {
    all: ReadonlyArray<FormBuilderRuleCondition>;
  };
};
export type FormBuilderRequirementRule = {
  effect: "optional" | "required";
  id: string;
  when: {
    all: ReadonlyArray<FormBuilderRuleCondition>;
  };
};
export type FormBuilderNodeRules = {
  requirementRules: ReadonlyArray<FormBuilderRequirementRule>;
  visibilityRules: ReadonlyArray<FormBuilderVisibilityRule>;
};
export type FormBuilderViewOnlyBinding =
  | {
      kind: "lookup_derived_output";
      outputKey: string;
      sourceFieldId: string;
    }
  | {
      kind: "root_record_id";
    };
export type FormBuilderFilterGroup = {
  conditions: ReadonlyArray<FormBuilderFilterCondition>;
  logic: "and";
};
export type FormBuilderQuickFilter = {
  color?: string;
  conditions: ReadonlyArray<FormBuilderFilterCondition>;
  id: string;
  label: string;
  logic: "and";
};
export type FormBuilderGridColumnDefinition = {
  fieldId: string;
  id: string;
  order: number;
  visible: boolean;
};
export type FormBuilderFilterDefinitions = {
  defaultFilters: FormBuilderFilterGroup;
  quickFilters: ReadonlyArray<FormBuilderQuickFilter>;
  version: 1;
};

export type FormBuilderNode = {
  fieldId?: string;
  helperText?: string;
  id: string;
  order: number;
  parentId: string | null;
  childGridColumns?: ReadonlyArray<FormBuilderGridColumnDefinition>;
  required?: boolean;
  rules?: FormBuilderNodeRules;
  runtimePreset?: FormBuilderRuntimePreset;
  subformType?: FormBuilderSubformType;
  text?: string;
  title?: string;
  type: FormBuilderNodeType;
  viewOnlyBinding?: FormBuilderViewOnlyBinding;
  visibility: FormBuilderNodeVisibility;
};

export type FormBuilderViewSettings = {
  actions: {
    canAdd: boolean;
    canDelete: boolean;
    canEdit: boolean;
    canView: boolean;
  };
  correctiveAction: {
    enabled: boolean;
    modelKey: "corrective_action";
    sourceType: "platform_static";
  };
  iconDataUrl?: string;
  list: {
    columns: ReadonlyArray<FormBuilderGridColumnDefinition>;
    sorting: {
      direction: "asc" | "desc";
      fieldId?: string;
    };
  };
};

export type FormBuilderSubformViewSettings = {
  actions: {
    canAdd: boolean;
    canDelete: boolean;
    canEdit: boolean;
  };
  list: {
    columns: ReadonlyArray<FormBuilderGridColumnDefinition>;
    sorting: {
      direction: "asc" | "desc";
      fieldId?: string;
    };
  };
};

export type FormBuilderScopeUiSchema = {
  currentParentId: string | null;
  nodes: ReadonlyArray<FormBuilderNode>;
  selectedNodeId: string | null;
};

export type FormBuilderRootScope = {
  dataSchema: {
    fieldIds: ReadonlyArray<string>;
  };
  scopeId: "root";
  scopeType: "ROOT";
  uiSchema: FormBuilderScopeUiSchema;
};

export type FormBuilderSubformScope = {
  dataSchema: {
    fieldIds: ReadonlyArray<string>;
  };
  filterDefinitions: FormBuilderFilterDefinitions;
  parentSubformNodeId: string;
  scopeId: string;
  scopeType: "SUBFORM";
  subformType: FormBuilderSubformType;
  tableKey: string;
  uiSchema: FormBuilderScopeUiSchema;
  viewSettings: FormBuilderSubformViewSettings;
};

export type FormBuilderScope = FormBuilderRootScope | FormBuilderSubformScope;

export type FormBuilderDocument = {
  activeScopeId: "root" | string;
  currentParentId: string | null;
  filterDefinitions: FormBuilderFilterDefinitions;
  nodes: ReadonlyArray<FormBuilderNode>;
  rootScope: FormBuilderRootScope;
  selectedNodeId: string | null;
  subformScopes: ReadonlyArray<FormBuilderSubformScope>;
  systemFields: FormBuilderSystemFields;
  viewKind: "detail" | "form";
  viewSettings: FormBuilderViewSettings;
  viewDescription: string;
  viewTitle: string;
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
  initialNode?: {
    subformType?: FormBuilderSubformType;
    title?: string;
  };
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
  definition: FormBuilderLibraryFieldDefinition;
  iconKey: string;
  kind: "field";
};

export type FormBuilderPaletteItem = FormBuilderElementPaletteItem | FormBuilderFieldPaletteItem;

const legacyFormsWorkspaceStoragePrefix = "tenant-web-platform-studio-screen-document";
const formsWorkspaceSavedStoragePrefix = "tenant-web-platform-studio-screen-document-saved";
const formBuilderRuntimePresetValues = new Set<FormBuilderRuntimePreset>([
  "badge",
  "geo_capture",
  "radio_chips",
  "readonly_card",
  "relation_summary_card",
  "select",
  "signature_pad",
]);
const formBuilderFilterTokenValues = new Set<FormBuilderFilterToken>([
  "currentUser.companyId",
  "currentUser.companyName",
  "currentUser.divisionId",
  "currentUser.divisionName",
  "currentUser.projectAccessIds",
]);
const formBuilderLookupDynamicTokenValues = new Set<FormBuilderLookupDynamicToken>([
  "assigned_projects",
  "current_user_company_id",
  "current_user_company_name",
  "current_user_division_id",
  "current_user_division_name",
  "current_user_id",
]);
const formBuilderLookupPresetValues = new Set<FormBuilderLookupPreset>([
  "company_lookup",
  "contact_lookup",
  "generic_db_lookup",
  "project_lookup",
]);
const formBuilderRelativeDatePresetValues = new Set<FormBuilderRelativeDatePreset>([
  "current_month",
  "current_quarter",
  "current_week",
  "current_year",
  "last_12_months",
  "last_month",
  "last_quarter",
  "last_week",
  "last_year",
  "next_3_days",
  "next_5_days",
  "next_7_days",
  "next_month",
  "next_quarter",
  "next_week",
  "next_year",
  "today_or_earlier",
  "today_or_later",
]);
const formBuilderFilterOperatorValues = new Set<FormBuilderFilterOperator>([
  "between",
  "contains",
  "eq",
  "gt",
  "gte",
  "in",
  "is_empty",
  "is_not_empty",
  "lt",
  "lte",
  "neq",
  "not_contains",
  "relative_date",
]);
const formBuilderRuleOperatorValues = new Set<FormBuilderRuleOperator>([
  "eq",
  "neq",
  "in",
  "not_in",
  "is_empty",
  "not_empty",
  "gt",
  "gte",
  "lt",
  "lte",
]);

const containerChildTypes: Record<"root" | FormBuilderContainerNodeType, ReadonlyArray<FormBuilderNodeType>> = {
  column: ["group", "grid", "tabs", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  grid: ["column"],
  group: ["group", "grid", "tabs", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  root: ["section", "group", "grid", "tabs", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  section: ["group", "grid", "tabs", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  subform: ["section", "group", "grid", "tabs", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field"],
  tab_item: ["group", "grid", "heading", "text", "rich_text", "view_only_field", "divider", "spacer", "field", "subform"],
  tabs: ["tab_item"],
};

export const formBuilderElementDefinitions: ReadonlyArray<FormBuilderElementDefinition> = formBuilderLibraryElementDefinitions;

const formBuilderElementLabels: Record<Exclude<FormBuilderNodeType, "field">, string> = {
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

function createDefaultSystemFields(): FormBuilderSystemFields {
  return {
    version: 1,
  };
}

function createDefaultFilterDefinitions(): FormBuilderFilterDefinitions {
  return {
    defaultFilters: {
      conditions: [],
      logic: "and",
    },
    quickFilters: [],
    version: 1,
  };
}

function createDefaultNodeRules(): FormBuilderNodeRules {
  return {
    requirementRules: [],
    visibilityRules: [],
  };
}

function createDefaultViewSettings(): FormBuilderViewSettings {
  return {
    actions: {
      canAdd: true,
      canDelete: true,
      canEdit: true,
      canView: true,
    },
    correctiveAction: {
      enabled: false,
      modelKey: "corrective_action",
      sourceType: "platform_static",
    },
    list: {
      columns: [],
      sorting: {
        direction: "asc",
      },
    },
  };
}

function createDefaultSubformViewSettings(): FormBuilderSubformViewSettings {
  return {
    actions: {
      canAdd: true,
      canDelete: true,
      canEdit: true,
    },
    list: {
      columns: [],
      sorting: {
        direction: "asc",
      },
    },
  };
}

function isRuntimePreset(value: unknown): value is FormBuilderRuntimePreset {
  return typeof value === "string" && formBuilderRuntimePresetValues.has(value as FormBuilderRuntimePreset);
}

function isFilterToken(value: unknown): value is FormBuilderFilterToken {
  return typeof value === "string" && formBuilderFilterTokenValues.has(value as FormBuilderFilterToken);
}

function isLookupDynamicToken(value: unknown): value is FormBuilderLookupDynamicToken {
  return typeof value === "string" && formBuilderLookupDynamicTokenValues.has(value as FormBuilderLookupDynamicToken);
}

function isLookupPreset(value: unknown): value is FormBuilderLookupPreset {
  return typeof value === "string" && formBuilderLookupPresetValues.has(value as FormBuilderLookupPreset);
}

function isRelativeDatePreset(value: unknown): value is FormBuilderRelativeDatePreset {
  return typeof value === "string" && formBuilderRelativeDatePresetValues.has(value as FormBuilderRelativeDatePreset);
}

function isFilterOperator(value: unknown): value is FormBuilderFilterOperator {
  return typeof value === "string" && formBuilderFilterOperatorValues.has(value as FormBuilderFilterOperator);
}

function isRuleOperator(value: unknown): value is FormBuilderRuleOperator {
  return typeof value === "string" && formBuilderRuleOperatorValues.has(value as FormBuilderRuleOperator);
}

function isFilterScalar(value: unknown): value is FormBuilderFilterScalar {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function normalizeSystemFieldBinding(
  value: unknown,
  fieldIds: ReadonlySet<string>,
) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as { fieldId?: unknown };
  if (typeof candidate.fieldId !== "string" || !fieldIds.has(candidate.fieldId)) {
    return undefined;
  }

  return {
    fieldId: candidate.fieldId,
  };
}

function normalizeWorkflowStatusBinding(
  value: unknown,
  fieldIds: ReadonlySet<string>,
) {
  const binding = normalizeSystemFieldBinding(value, fieldIds);
  if (!binding || !value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as { finalValue?: unknown; initialValue?: unknown };

  return {
    ...binding,
    finalValue: typeof candidate.finalValue === "string" && candidate.finalValue.trim().length > 0
      ? candidate.finalValue
      : undefined,
    initialValue: typeof candidate.initialValue === "string" && candidate.initialValue.trim().length > 0
      ? candidate.initialValue
      : undefined,
  };
}

function normalizeSystemFields(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderSystemFields {
  if (!value || typeof value !== "object") {
    return createDefaultSystemFields();
  }

  const candidate = value as Partial<FormBuilderSystemFields>;

  return {
    reportedBy: normalizeSystemFieldBinding(candidate.reportedBy, fieldIds),
    reportedDate: normalizeSystemFieldBinding(candidate.reportedDate, fieldIds),
    version: 1,
    workflowStatus: normalizeWorkflowStatusBinding(candidate.workflowStatus, fieldIds),
  };
}

function normalizeFilterValueSource(
  value: unknown,
): FormBuilderFilterValueSource | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<FormBuilderFilterValueSource> & { value?: unknown };

  if (candidate.kind === "literal" && isFilterScalar(candidate.value)) {
    return {
      kind: "literal",
      value: candidate.value,
    };
  }

  if (
    candidate.kind === "literal_array" &&
    Array.isArray(candidate.value) &&
    candidate.value.length > 0 &&
    candidate.value.every((entry) => isFilterScalar(entry))
  ) {
    return {
      kind: "literal_array",
      value: [...candidate.value],
    };
  }

  if (candidate.kind === "token" && isFilterToken(candidate.token)) {
    return {
      kind: "token",
      token: candidate.token,
    };
  }

  if (
    candidate.kind === "scalar_range" &&
    isFilterScalar(candidate.start) &&
    isFilterScalar(candidate.end)
  ) {
    return {
      end: candidate.end,
      kind: "scalar_range",
      start: candidate.start,
    };
  }

  if (candidate.kind === "relative_date" && isRelativeDatePreset(candidate.preset)) {
    return {
      kind: "relative_date",
      preset: candidate.preset,
    };
  }

  return undefined;
}

function operatorNeedsValue(operator: FormBuilderFilterOperator) {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

function normalizeLookupFilterClause(
  value: unknown,
): FormBuilderLookupFilterClause | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderLookupFilterClause>;
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    typeof candidate.clauseKey !== "string" ||
    candidate.clauseKey.trim().length === 0
  ) {
    return null;
  }

  if (candidate.valueMode === "dynamic_token") {
    if (!isLookupDynamicToken(candidate.dynamicToken)) {
      return null;
    }

    return {
      clauseKey: candidate.clauseKey,
      dynamicToken: candidate.dynamicToken,
      id: candidate.id,
      valueMode: "dynamic_token",
    };
  }

  if (candidate.valueMode === "boolean_flag") {
    return {
      clauseKey: candidate.clauseKey,
      id: candidate.id,
      value: typeof candidate.value === "boolean" ? candidate.value : true,
      valueMode: "boolean_flag",
    };
  }

  if (candidate.valueMode === "literal" && isFilterScalar(candidate.value)) {
    return {
      clauseKey: candidate.clauseKey,
      id: candidate.id,
      value: candidate.value,
      valueMode: "literal",
    };
  }

  return null;
}

function normalizeFilterCondition(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderFilterCondition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderFilterCondition>;
  if (typeof candidate.fieldId !== "string" || !fieldIds.has(candidate.fieldId)) {
    return null;
  }

  if ((candidate as Partial<FormBuilderLookupFilterCondition>).editorType === "lookup") {
    const lookupCandidate = candidate as Partial<FormBuilderLookupFilterCondition>;
    if (
      typeof lookupCandidate.fieldId !== "string" ||
      !isLookupPreset(lookupCandidate.lookupPreset) ||
      !Array.isArray(lookupCandidate.clauses)
    ) {
      return null;
    }

    const clauses = lookupCandidate.clauses
      .map((entry) => normalizeLookupFilterClause(entry))
      .filter((entry): entry is FormBuilderLookupFilterClause => Boolean(entry));

    return {
      clauses,
      editorType: "lookup",
      fieldId: lookupCandidate.fieldId,
      lookupPreset: lookupCandidate.lookupPreset,
    };
  }

  if (!isFilterOperator((candidate as Partial<FormBuilderScalarFilterCondition>).operator)) {
    return null;
  }

  const scalarCandidate = candidate as Partial<FormBuilderScalarFilterCondition>;
  if (typeof scalarCandidate.fieldId !== "string") {
    return null;
  }
  const operator = scalarCandidate.operator;
  if (!operator) {
    return null;
  }
  const valueSource = normalizeFilterValueSource(scalarCandidate.valueSource);
  if (operatorNeedsValue(operator) && !valueSource) {
    return null;
  }

  return {
    fieldId: scalarCandidate.fieldId,
    operator,
    valueSource,
  };
}

function normalizeFilterGroup(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderFilterGroup {
  if (!value || typeof value !== "object") {
    return {
      conditions: [],
      logic: "and",
    };
  }

  const candidate = value as { conditions?: unknown; logic?: unknown };
  const normalizedConditions = Array.isArray(candidate.conditions)
    ? candidate.conditions
        .map((entry) => normalizeFilterCondition(entry, fieldIds))
        .filter((entry): entry is FormBuilderFilterCondition => Boolean(entry))
    : [];

  return {
    conditions: normalizedConditions,
    logic: "and",
  };
}

function normalizeQuickFilter(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderQuickFilter | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderQuickFilter>;
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    typeof candidate.label !== "string" ||
    candidate.label.trim().length === 0
  ) {
    return null;
  }

  return {
    color: typeof candidate.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(candidate.color)
      ? candidate.color
      : undefined,
    conditions: normalizeFilterGroup(candidate, fieldIds).conditions,
    id: candidate.id,
    label: candidate.label,
    logic: "and",
  };
}

function normalizeGridColumn(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderGridColumnDefinition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderGridColumnDefinition>;
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    typeof candidate.fieldId !== "string" ||
    !fieldIds.has(candidate.fieldId) ||
    typeof candidate.order !== "number" ||
    Number.isNaN(candidate.order)
  ) {
    return null;
  }

  return {
    fieldId: candidate.fieldId,
    id: candidate.id,
    order: candidate.order,
    visible: typeof candidate.visible === "boolean" ? candidate.visible : true,
  };
}

function normalizeGridColumns(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): ReadonlyArray<FormBuilderGridColumnDefinition> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeGridColumn(entry, fieldIds))
    .filter((entry): entry is FormBuilderGridColumnDefinition => Boolean(entry))
    .sort((left, right) => left.order - right.order);
}

function normalizeFilterDefinitions(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderFilterDefinitions {
  if (!value || typeof value !== "object") {
    return createDefaultFilterDefinitions();
  }

  const candidate = value as Partial<FormBuilderFilterDefinitions>;
  const quickFilters = Array.isArray(candidate.quickFilters)
    ? candidate.quickFilters
        .map((entry) => normalizeQuickFilter(entry, fieldIds))
        .filter((entry): entry is FormBuilderQuickFilter => Boolean(entry))
    : [];

  return {
    defaultFilters: normalizeFilterGroup(candidate.defaultFilters, fieldIds),
    quickFilters,
    version: 1,
  };
}

function normalizeRuleCondition(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderRuleCondition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderRuleCondition>;
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    typeof candidate.fieldId !== "string" ||
    !fieldIds.has(candidate.fieldId) ||
    !isRuleOperator(candidate.operator)
  ) {
    return null;
  }

  const usesArray = candidate.operator === "in" || candidate.operator === "not_in";
  const values = Array.isArray(candidate.values) && candidate.values.every((entry) => isFilterScalar(entry))
    ? [...candidate.values]
    : undefined;
  const valueScalar = isFilterScalar(candidate.value) ? candidate.value : undefined;

  return {
    fieldId: candidate.fieldId,
    id: candidate.id,
    operator: candidate.operator,
    value: usesArray ? undefined : valueScalar,
    values: usesArray ? values : undefined,
  };
}

function normalizeVisibilityRule(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderVisibilityRule | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderVisibilityRule> & { when?: { all?: unknown } };
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    (candidate.effect !== "show" && candidate.effect !== "hide")
  ) {
    return null;
  }

  const all = Array.isArray(candidate.when?.all)
    ? candidate.when.all
        .map((entry) => normalizeRuleCondition(entry, fieldIds))
        .filter((entry): entry is FormBuilderRuleCondition => Boolean(entry))
    : [];

  return {
    effect: candidate.effect,
    id: candidate.id,
    when: {
      all,
    },
  };
}

function normalizeRequirementRule(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderRequirementRule | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderRequirementRule> & { when?: { all?: unknown } };
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    (candidate.effect !== "required" && candidate.effect !== "optional")
  ) {
    return null;
  }

  const all = Array.isArray(candidate.when?.all)
    ? candidate.when.all
        .map((entry) => normalizeRuleCondition(entry, fieldIds))
        .filter((entry): entry is FormBuilderRuleCondition => Boolean(entry))
    : [];

  return {
    effect: candidate.effect,
    id: candidate.id,
    when: {
      all,
    },
  };
}

function normalizeNodeRules(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderNodeRules {
  if (!value || typeof value !== "object") {
    return createDefaultNodeRules();
  }

  const candidate = value as Partial<FormBuilderNodeRules>;
  return {
    requirementRules: Array.isArray(candidate.requirementRules)
      ? candidate.requirementRules
          .map((entry) => normalizeRequirementRule(entry, fieldIds))
          .filter((entry): entry is FormBuilderRequirementRule => Boolean(entry))
      : [],
    visibilityRules: Array.isArray(candidate.visibilityRules)
      ? candidate.visibilityRules
          .map((entry) => normalizeVisibilityRule(entry, fieldIds))
          .filter((entry): entry is FormBuilderVisibilityRule => Boolean(entry))
      : [],
  };
}

function normalizeViewOnlyBinding(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderViewOnlyBinding | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<FormBuilderViewOnlyBinding>;
  if (candidate.kind === "root_record_id") {
    return {
      kind: "root_record_id",
    };
  }

  if (
    candidate.kind !== "lookup_derived_output" ||
    typeof candidate.sourceFieldId !== "string" ||
    !fieldIds.has(candidate.sourceFieldId) ||
    typeof candidate.outputKey !== "string" ||
    candidate.outputKey.trim().length === 0
  ) {
    return undefined;
  }

  return {
    kind: "lookup_derived_output",
    outputKey: candidate.outputKey.trim(),
    sourceFieldId: candidate.sourceFieldId,
  };
}

function normalizeViewSettings(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderViewSettings {
  const defaults = createDefaultViewSettings();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const candidate = value as Partial<FormBuilderViewSettings>;
  const actions = candidate.actions && typeof candidate.actions === "object"
    ? candidate.actions
    : undefined;
  const correctiveAction = candidate.correctiveAction && typeof candidate.correctiveAction === "object"
    ? candidate.correctiveAction
    : undefined;
  const list = candidate.list && typeof candidate.list === "object"
    ? candidate.list
    : undefined;
  const sorting = list?.sorting && typeof list.sorting === "object"
    ? list.sorting
    : undefined;

  return {
    actions: {
      canAdd: typeof actions?.canAdd === "boolean" ? actions.canAdd : defaults.actions.canAdd,
      canDelete: typeof actions?.canDelete === "boolean" ? actions.canDelete : defaults.actions.canDelete,
      canEdit: typeof actions?.canEdit === "boolean" ? actions.canEdit : defaults.actions.canEdit,
      canView: typeof actions?.canView === "boolean" ? actions.canView : defaults.actions.canView,
    },
    correctiveAction: {
      enabled: typeof correctiveAction?.enabled === "boolean" ? correctiveAction.enabled : defaults.correctiveAction.enabled,
      modelKey: "corrective_action",
      sourceType: "platform_static",
    },
    iconDataUrl: typeof candidate.iconDataUrl === "string" && candidate.iconDataUrl.trim().length > 0
      ? candidate.iconDataUrl
      : undefined,
    list: {
      columns: normalizeGridColumns(list?.columns, fieldIds),
      sorting: {
        direction: sorting?.direction === "desc" ? "desc" : "asc",
        fieldId: typeof sorting?.fieldId === "string" && fieldIds.has(sorting.fieldId)
          ? sorting.fieldId
          : undefined,
      },
    },
  };
}

function normalizeSubformViewSettings(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderSubformViewSettings {
  const defaults = createDefaultSubformViewSettings();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const candidate = value as Partial<FormBuilderSubformViewSettings>;
  const actions = candidate.actions && typeof candidate.actions === "object"
    ? candidate.actions
    : undefined;
  const list = candidate.list && typeof candidate.list === "object"
    ? candidate.list
    : undefined;
  const sorting = list?.sorting && typeof list.sorting === "object"
    ? list.sorting
    : undefined;

  return {
    actions: {
      canAdd: typeof actions?.canAdd === "boolean" ? actions.canAdd : defaults.actions.canAdd,
      canDelete: typeof actions?.canDelete === "boolean" ? actions.canDelete : defaults.actions.canDelete,
      canEdit: typeof actions?.canEdit === "boolean" ? actions.canEdit : defaults.actions.canEdit,
    },
    list: {
      columns: normalizeGridColumns(list?.columns, fieldIds),
      sorting: {
        direction: sorting?.direction === "desc" ? "desc" : "asc",
        fieldId: typeof sorting?.fieldId === "string" && fieldIds.has(sorting.fieldId)
          ? sorting.fieldId
          : undefined,
      },
    },
  };
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
    required: false,
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
    type === "subform"
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
  const viewDescription = `${screen.title} for ${object.title}.`;

  return buildScopedDocumentFromFlatWorkspace(
    {
      currentParentId: null,
      nodes: [section, ...fieldNodes],
      selectedNodeId: null,
    },
    createDocumentShell(
      screen.title,
      screen.kind,
      viewDescription,
      object.fields.map((field) => field.id),
    ),
  );
}

function isValidNodeType(value: unknown): value is FormBuilderNodeType {
  return (
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

function isSubformType(value: unknown): value is FormBuilderSubformType {
  return value === "CHECKLIST" || value === "DEFAULT";
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
    return new Set(document.rootScope.dataSchema.fieldIds);
  }

  const subformScope = document.subformScopes.find((scope) => scope.scopeId === scopeSubformId);
  return new Set(subformScope?.dataSchema.fieldIds ?? []);
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

  if (!isFormBuilderContainer(parentType)) {
    return [];
  }

  return containerChildTypes[parentType];
}

type FormBuilderFlatWorkspaceState = {
  currentParentId: string | null;
  nodes: ReadonlyArray<FormBuilderNode>;
  selectedNodeId: string | null;
};

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

function createDocumentShell(
  viewTitle: string,
  viewKind: "detail" | "form",
  viewDescription: string,
  rootFieldIds: ReadonlyArray<string>,
): FormBuilderDocument {
  return {
    activeScopeId: "root",
    currentParentId: null,
    filterDefinitions: createDefaultFilterDefinitions(),
    nodes: [],
    rootScope: {
      dataSchema: {
        fieldIds: dedupeFieldIds(rootFieldIds),
      },
      scopeId: "root",
      scopeType: "ROOT",
      uiSchema: {
        currentParentId: null,
        nodes: [],
        selectedNodeId: null,
      },
    },
    selectedNodeId: null,
    subformScopes: [],
    systemFields: createDefaultSystemFields(),
    viewKind,
    viewSettings: createDefaultViewSettings(),
    viewDescription,
    viewTitle,
  };
}

function getNodeMap(nodes: ReadonlyArray<FormBuilderNode>) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function getContainingSubformScopeId(
  node: FormBuilderNode,
  nodeMap: ReadonlyMap<string, FormBuilderNode>,
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

function getScopeIdForFlatCurrentParent(
  nodeId: string | null | undefined,
  nodeMap: ReadonlyMap<string, FormBuilderNode>,
): "root" | string | null {
  if (!nodeId) {
    return null;
  }

  const node = nodeMap.get(nodeId);
  if (!node) {
    return null;
  }

  if (node.type === "subform") {
    return node.id;
  }

  return getContainingSubformScopeId(node, nodeMap) ?? "root";
}

function getScopeIdForFlatSelection(
  nodeId: string | null | undefined,
  nodeMap: ReadonlyMap<string, FormBuilderNode>,
): "root" | string | null {
  if (!nodeId) {
    return null;
  }

  const node = nodeMap.get(nodeId);
  if (!node) {
    return null;
  }

  return getContainingSubformScopeId(node, nodeMap) ?? "root";
}

function buildScopeUiNodes(
  nodes: ReadonlyArray<FormBuilderNode>,
  parentScopeNodeId: string | null,
): ReadonlyArray<FormBuilderNode> {
  return nodes.map((node) => ({
    ...node,
    childGridColumns: node.type === "subform" ? undefined : node.childGridColumns,
    parentId: parentScopeNodeId !== null && node.parentId === parentScopeNodeId
      ? null
      : node.parentId,
  }));
}

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
  options?: {
    allowNull?: boolean;
  },
) {
  if (candidate && nodes.some((node) => node.id === candidate)) {
    return candidate;
  }

  return getDefaultSelectedNodeIdForScope(nodes, options?.allowNull ?? false);
}

function localizeFlatNodeIdForSubformScope(
  nodeId: string | null | undefined,
  scopeId: string,
) {
  if (!nodeId || nodeId === scopeId) {
    return null;
  }

  return nodeId;
}

function getKnownFieldIds(
  document: FormBuilderDocument,
  nodes: ReadonlyArray<FormBuilderNode>,
  extraFieldIds: ReadonlyArray<string> = [],
) {
  return dedupeFieldIds([
    ...document.rootScope.dataSchema.fieldIds,
    ...document.subformScopes.flatMap((scope) => scope.dataSchema.fieldIds),
    ...nodes
      .filter((node): node is FormBuilderNode & { fieldId: string } =>
        node.type === "field" && typeof node.fieldId === "string")
      .map((node) => node.fieldId),
    ...extraFieldIds,
  ]);
}

function getSubformScope(
  document: Pick<FormBuilderDocument, "activeScopeId" | "subformScopes">,
  scopeId: string | null | undefined,
) {
  if (!scopeId || scopeId === "root") {
    return null;
  }

  return document.subformScopes.find((scope) => scope.scopeId === scopeId) ?? null;
}

function getScopeNodes(
  document: FormBuilderDocument,
  scopeId: "root" | string,
) {
  return scopeId === "root"
    ? document.rootScope.uiSchema.nodes
    : (document.subformScopes.find((scope) => scope.scopeId === scopeId)?.uiSchema.nodes ?? []);
}

function createSubformScopeFromNode(
  subformNode: FormBuilderNode,
  existingScope?: FormBuilderSubformScope,
): FormBuilderSubformScope {
  const fieldIds = new Set(existingScope?.dataSchema.fieldIds ?? []);
  const nextColumns = subformNode.childGridColumns ?? existingScope?.viewSettings.list.columns ?? [];

  return {
    dataSchema: {
      fieldIds: existingScope?.dataSchema.fieldIds ?? [],
    },
    filterDefinitions: normalizeFilterDefinitions(
      existingScope?.filterDefinitions,
      fieldIds,
    ),
    parentSubformNodeId: subformNode.id,
    scopeId: subformNode.id,
    scopeType: "SUBFORM",
    subformType: subformNode.subformType ?? existingScope?.subformType ?? "DEFAULT",
    tableKey: existingScope?.tableKey ?? `pb_${slugifyScopeKey(subformNode.title?.trim() || subformNode.id)}`,
    uiSchema: existingScope?.uiSchema ?? {
      currentParentId: null,
      nodes: [],
      selectedNodeId: null,
    },
    viewSettings: normalizeSubformViewSettings(
      {
        ...existingScope?.viewSettings,
        list: {
          ...existingScope?.viewSettings.list,
          columns: nextColumns,
        },
      },
      fieldIds,
    ),
  };
}

function finalizeScopedDocument(
  document: FormBuilderDocument,
  extraFieldIds: ReadonlyArray<string> = [],
): FormBuilderDocument {
  const rootSubformNodes = document.rootScope.uiSchema.nodes
    .filter((node): node is FormBuilderNode & { type: "subform" } => node.type === "subform")
    .sort((left, right) => left.order - right.order);
  const subformScopes = rootSubformNodes.map((subformNode) =>
    createSubformScopeFromNode(
      subformNode,
      document.subformScopes.find((scope) => scope.parentSubformNodeId === subformNode.id),
    ),
  ).map((scope) => ({
    ...scope,
    uiSchema: {
      ...scope.uiSchema,
      currentParentId: normalizeScopeCurrentParentId(scope.uiSchema.nodes, scope.uiSchema.currentParentId),
      selectedNodeId: normalizeScopeSelectedNodeId(scope.uiSchema.nodes, scope.uiSchema.selectedNodeId, { allowNull: true }),
    },
  }));
  const subformFieldIds = new Set<string>();
  const normalizedSubformScopes = subformScopes.map((scope) => {
    const fieldIds = dedupeFieldIds(
      scope.uiSchema.nodes
        .filter((node): node is FormBuilderNode & { fieldId: string } =>
          node.type === "field" && typeof node.fieldId === "string")
        .map((node) => node.fieldId),
    );
    fieldIds.forEach((fieldId) => subformFieldIds.add(fieldId));

    return {
      ...scope,
      dataSchema: {
        fieldIds,
      },
      filterDefinitions: normalizeFilterDefinitions(scope.filterDefinitions, new Set(fieldIds)),
      viewSettings: normalizeSubformViewSettings(
        {
          ...scope.viewSettings,
          list: {
            ...scope.viewSettings.list,
            columns: scope.viewSettings.list.columns,
          },
        },
        new Set(fieldIds),
      ),
    };
  });
  const knownFieldIds = dedupeFieldIds([
    ...document.rootScope.dataSchema.fieldIds,
    ...normalizedSubformScopes.flatMap((scope) => scope.dataSchema.fieldIds),
    ...document.rootScope.uiSchema.nodes
      .filter((node): node is FormBuilderNode & { fieldId: string } =>
        node.type === "field" && typeof node.fieldId === "string")
      .map((node) => node.fieldId),
    ...extraFieldIds,
  ]);
  const activeScopeId = document.activeScopeId === "root" || normalizedSubformScopes.some((scope) => scope.scopeId === document.activeScopeId)
    ? document.activeScopeId
    : "root";

  return withFlatCompatibilityCache({
    ...document,
    activeScopeId,
    rootScope: {
      ...document.rootScope,
      dataSchema: {
        fieldIds: knownFieldIds.filter((fieldId) => !subformFieldIds.has(fieldId)),
      },
      uiSchema: {
        ...document.rootScope.uiSchema,
        currentParentId: normalizeScopeCurrentParentId(document.rootScope.uiSchema.nodes, document.rootScope.uiSchema.currentParentId),
        selectedNodeId: normalizeScopeSelectedNodeId(document.rootScope.uiSchema.nodes, document.rootScope.uiSchema.selectedNodeId),
      },
    },
    subformScopes: normalizedSubformScopes,
  });
}

function updateScopeUiSchema(
  document: FormBuilderDocument,
  scopeId: "root" | string,
  updater: (
    uiSchema: FormBuilderScopeUiSchema,
  ) => FormBuilderScopeUiSchema,
  options?: {
    extraFieldIds?: ReadonlyArray<string>;
  },
) {
  if (scopeId === "root") {
    return finalizeScopedDocument({
      ...document,
      rootScope: {
        ...document.rootScope,
        uiSchema: updater(document.rootScope.uiSchema),
      },
    }, options?.extraFieldIds);
  }

  return finalizeScopedDocument({
    ...document,
    subformScopes: document.subformScopes.map((scope) =>
      scope.scopeId === scopeId
        ? {
            ...scope,
            uiSchema: updater(scope.uiSchema),
          }
        : scope,
    ),
  }, options?.extraFieldIds);
}

function flattenScopedNodes(
  document: Pick<FormBuilderDocument, "rootScope" | "subformScopes">,
) {
  const childGridColumnsBySubformId = new Map(
    document.subformScopes.map((scope) => [scope.parentSubformNodeId, scope.viewSettings.list.columns]),
  );
  const rootNodes = document.rootScope.uiSchema.nodes.map((node) =>
    node.type === "subform"
      ? {
          ...node,
          childGridColumns: childGridColumnsBySubformId.get(node.id) ?? [],
        }
      : node,
  );
  const subformNodes = document.subformScopes.flatMap((scope) =>
    scope.uiSchema.nodes.map((node) => ({
      ...node,
      parentId: node.parentId === null ? scope.parentSubformNodeId : node.parentId,
    })),
  );

  return [...rootNodes, ...subformNodes];
}

function getFlatCurrentParentId(
  document: Pick<FormBuilderDocument, "activeScopeId" | "rootScope" | "subformScopes">,
) {
  const activeSubformScope = getSubformScope(document, document.activeScopeId);
  if (!activeSubformScope) {
    return document.rootScope.uiSchema.currentParentId;
  }

  return activeSubformScope.uiSchema.currentParentId ?? activeSubformScope.parentSubformNodeId;
}

function getFlatSelectedNodeId(
  document: Pick<FormBuilderDocument, "activeScopeId" | "rootScope" | "subformScopes">,
) {
  const activeSubformScope = getSubformScope(document, document.activeScopeId);
  if (!activeSubformScope) {
    return document.rootScope.uiSchema.selectedNodeId;
  }

  return activeSubformScope.uiSchema.selectedNodeId ?? activeSubformScope.parentSubformNodeId;
}

function withFlatCompatibilityCache(document: FormBuilderDocument): FormBuilderDocument {
  const activeScopeId = document.activeScopeId === "root" || document.subformScopes.some((scope) => scope.scopeId === document.activeScopeId)
    ? document.activeScopeId
    : "root";
  const nextDocument = {
    ...document,
    activeScopeId,
  };

  return {
    ...nextDocument,
    currentParentId: getFlatCurrentParentId(nextDocument),
    nodes: flattenScopedNodes(nextDocument),
    selectedNodeId: getFlatSelectedNodeId(nextDocument),
  };
}

function buildScopedDocumentFromFlatWorkspace(
  flatState: FormBuilderFlatWorkspaceState,
  baseDocument: FormBuilderDocument,
  extraFieldIds: ReadonlyArray<string> = [],
) {
  const nodes = [...flatState.nodes];
  const nodeMap = getNodeMap(nodes);
  const currentParentScopeId = getScopeIdForFlatCurrentParent(flatState.currentParentId, nodeMap);
  const selectedNodeScopeId = getScopeIdForFlatSelection(flatState.selectedNodeId, nodeMap);
  const subformNodes = nodes
    .filter((node) => node.type === "subform")
    .sort((left, right) => left.order - right.order);
  const activeScopeIdCandidate =
    currentParentScopeId ??
    selectedNodeScopeId ??
    (baseDocument.activeScopeId === "root" || subformNodes.some((node) => node.id === baseDocument.activeScopeId)
      ? baseDocument.activeScopeId
      : "root");
  const knownFieldIds = getKnownFieldIds(baseDocument, nodes, extraFieldIds);
  const rootScopeNodes = buildScopeUiNodes(
    nodes.filter((node) => getContainingSubformScopeId(node, nodeMap) === null),
    null,
  );
  const rootCurrentParentCandidate =
    activeScopeIdCandidate === "root" && (currentParentScopeId === "root" || flatState.currentParentId === null)
      ? (flatState.currentParentId ?? null)
      : baseDocument.rootScope.uiSchema.currentParentId;
  const rootSelectedCandidate =
    activeScopeIdCandidate === "root" && (selectedNodeScopeId === "root" || flatState.selectedNodeId === null)
      ? (flatState.selectedNodeId ?? null)
      : baseDocument.rootScope.uiSchema.selectedNodeId;
  const subformFieldIds = new Set<string>();
  const subformScopes = subformNodes.map((subformNode) => {
    const scopedNodes = buildScopeUiNodes(
      nodes.filter((node) => getContainingSubformScopeId(node, nodeMap) === subformNode.id),
      subformNode.id,
    );
    const existingScope = baseDocument.subformScopes.find((scope) => scope.scopeId === subformNode.id);
    const currentParentCandidate =
      activeScopeIdCandidate === subformNode.id && currentParentScopeId === subformNode.id
        ? localizeFlatNodeIdForSubformScope(flatState.currentParentId, subformNode.id)
        : existingScope?.uiSchema.currentParentId;
    const selectedCandidate =
      activeScopeIdCandidate === subformNode.id && selectedNodeScopeId === subformNode.id
        ? localizeFlatNodeIdForSubformScope(flatState.selectedNodeId, subformNode.id)
        : existingScope?.uiSchema.selectedNodeId;
    const fieldIds = dedupeFieldIds(
      scopedNodes
        .filter((node): node is FormBuilderNode & { fieldId: string } =>
          node.type === "field" && typeof node.fieldId === "string")
        .map((node) => node.fieldId),
    );
    fieldIds.forEach((fieldId) => subformFieldIds.add(fieldId));

    return {
      dataSchema: {
        fieldIds,
      },
      filterDefinitions: normalizeFilterDefinitions(
        existingScope?.filterDefinitions,
        new Set(fieldIds),
      ),
      parentSubformNodeId: subformNode.id,
      scopeId: subformNode.id,
      scopeType: "SUBFORM" as const,
      subformType: subformNode.subformType ?? existingScope?.subformType ?? "DEFAULT",
      tableKey: existingScope?.tableKey ?? `pb_${slugifyScopeKey(subformNode.title?.trim() || subformNode.id)}`,
      uiSchema: {
        currentParentId: normalizeScopeCurrentParentId(scopedNodes, currentParentCandidate),
        nodes: scopedNodes,
        selectedNodeId: normalizeScopeSelectedNodeId(scopedNodes, selectedCandidate, { allowNull: true }),
      },
      viewSettings: normalizeSubformViewSettings(
        {
          ...existingScope?.viewSettings,
          list: {
            ...existingScope?.viewSettings.list,
            columns: subformNode.childGridColumns ?? existingScope?.viewSettings.list.columns ?? [],
          },
        },
        new Set(fieldIds),
      ),
    };
  });

  return withFlatCompatibilityCache({
    ...baseDocument,
    activeScopeId: activeScopeIdCandidate,
    rootScope: {
      dataSchema: {
        fieldIds: knownFieldIds.filter((fieldId) => !subformFieldIds.has(fieldId)),
      },
      scopeId: "root",
      scopeType: "ROOT",
      uiSchema: {
        currentParentId: normalizeScopeCurrentParentId(rootScopeNodes, rootCurrentParentCandidate),
        nodes: rootScopeNodes,
        selectedNodeId: normalizeScopeSelectedNodeId(rootScopeNodes, rootSelectedCandidate),
      },
    },
    subformScopes,
  });
}

function normalizeDocument(
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

      nodes.push({
        childGridColumns: node.type === "subform"
          ? normalizeGridColumns(node.childGridColumns, fieldIds)
          : undefined,
        fieldId: typeof node.fieldId === "string" ? node.fieldId : undefined,
        helperText: typeof node.helperText === "string" ? node.helperText : "",
        id: node.id,
        order: node.order,
        parentId: typeof node.parentId === "string" ? node.parentId : null,
        required: Boolean(node.required),
        rules: normalizeNodeRules(node.rules, fieldIds),
        runtimePreset: isRuntimePreset(node.runtimePreset) ? node.runtimePreset : undefined,
        subformType: node.type === "subform" && isSubformType(node.subformType) ? node.subformType : undefined,
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

  if (nodes.length === 0) {
    return createDefaultFormBuilderDocument(object, screen);
  }

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
    object.fields.map((field) => field.id),
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
          },
          filterDefinitions: normalizeFilterDefinitions(scope.filterDefinitions, new Set(normalizedFieldIds)),
          parentSubformNodeId: scope.parentSubformNodeId,
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

function getPersistedFormBuilderDocument(document: FormBuilderDocument): FormBuilderDocument {
  return resetFormBuilderWorkspaceNavigation(document);
}

function resetFormBuilderWorkspaceNavigation(document: FormBuilderDocument): FormBuilderDocument {
  return withFlatCompatibilityCache({
    ...document,
    activeScopeId: "root",
    rootScope: {
      ...document.rootScope,
      uiSchema: {
        ...document.rootScope.uiSchema,
        currentParentId: null,
        selectedNodeId: null,
      },
    },
    subformScopes: document.subformScopes.map((scope) => ({
      ...scope,
      uiSchema: {
        ...scope.uiSchema,
        currentParentId: null,
        selectedNodeId: null,
      },
    })),
  });
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
    window.localStorage.setItem(
      savedStorageKey,
      JSON.stringify(wrapWorkspaceDocumentForPersistence(
        getPersistedFormBuilderDocument(document),
        object.fields.map((field) => field.id),
      )),
    );
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
  }, [storageSignature, object.id, screen.id]);

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
  const scopeId = getFormBuilderNodeScopeId(document, nodeId);
  if (!scopeId) {
    return document;
  }

  return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
    ...uiSchema,
    nodes: uiSchema.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            ...updates,
          }
        : node),
  }));
}

export function setFormBuilderCurrentParent(
  document: FormBuilderDocument,
  parentId: string | null,
): FormBuilderDocument {
  if (!parentId) {
    return withFlatCompatibilityCache({
      ...document,
      activeScopeId: "root",
      rootScope: {
        ...document.rootScope,
        uiSchema: {
          ...document.rootScope.uiSchema,
          currentParentId: null,
          selectedNodeId:
            document.rootScope.uiSchema.selectedNodeId ??
            getDefaultSelectedNodeIdForScope(document.rootScope.uiSchema.nodes, false),
        },
      },
    });
  }

  const parentNode = getFormBuilderNode(document, parentId);
  if (!parentNode || !isFormBuilderContainer(parentNode.type)) {
    return document;
  }

  const scopeId = parentNode.type === "subform"
    ? parentNode.id
    : (getFormBuilderNodeScopeId(document, parentNode.id) ?? "root");

  if (scopeId === "root") {
    return withFlatCompatibilityCache({
      ...document,
      activeScopeId: "root",
      rootScope: {
        ...document.rootScope,
        uiSchema: {
          ...document.rootScope.uiSchema,
          currentParentId: parentNode.id,
          selectedNodeId: parentNode.id,
        },
      },
    });
  }

  const subformScope = getSubformScope(document, scopeId);
  if (!subformScope) {
    return document;
  }

  return withFlatCompatibilityCache({
    ...document,
    activeScopeId: scopeId,
    subformScopes: document.subformScopes.map((scope) =>
      scope.scopeId === scopeId
        ? {
            ...scope,
            uiSchema: {
              ...scope.uiSchema,
              currentParentId: parentNode.type === "subform" ? null : parentNode.id,
              selectedNodeId: parentNode.type === "subform"
                ? (scope.uiSchema.nodes.find((node) => node.parentId === null)?.id ?? null)
                : parentNode.id,
            },
          }
        : scope,
    ),
  });
}

export function selectFormBuilderNode(
  document: FormBuilderDocument,
  nodeId: string | null,
): FormBuilderDocument {
  if (!nodeId) {
    const activeScope = getActiveFormBuilderScope(document);
    return updateScopeUiSchema(document, activeScope.scopeId, (uiSchema) => ({
      ...uiSchema,
      selectedNodeId: null,
    }));
  }

  const scopeId = getFormBuilderNodeScopeId(document, nodeId);
  if (!scopeId || !getFormBuilderNode(document, nodeId)) {
    return document;
  }

  if (scopeId === "root") {
    return withFlatCompatibilityCache({
      ...document,
      activeScopeId: "root",
      rootScope: {
        ...document.rootScope,
        uiSchema: {
          ...document.rootScope.uiSchema,
          selectedNodeId: nodeId,
        },
      },
    });
  }

  return withFlatCompatibilityCache({
    ...document,
    activeScopeId: scopeId,
    subformScopes: document.subformScopes.map((scope) =>
      scope.scopeId === scopeId
        ? {
            ...scope,
            uiSchema: {
              ...scope.uiSchema,
              selectedNodeId: nodeId,
            },
          }
        : scope,
    ),
  });
}

function getNextOrderValue(
  nodes: ReadonlyArray<FormBuilderNode>,
  parentId: string | null,
) {
  const siblings = nodes.filter((node) => node.parentId === parentId);
  return siblings.length;
}

export function addFormBuilderElementNode(
  document: FormBuilderDocument,
  parentId: string | null,
  nodeType: Exclude<FormBuilderNodeType, "field">,
  initialNode?: Partial<FormBuilderNode>,
  idFactory?: (prefix: string) => string,
): FormBuilderDocument {
  const parentNode = getFormBuilderNode(document, parentId);
  const activeScope = getActiveFormBuilderScope(document);
  const targetScopeId = parentNode?.type === "subform"
    ? parentNode.id
    : (parentNode ? (getFormBuilderNodeScopeId(document, parentNode.id) ?? "root") : activeScope.scopeId);
  const localParentId = parentNode?.type === "subform" ? null : parentId;
  const parentType = parentNode?.type ?? (activeScope.scopeType === "SUBFORM" ? "subform" : null);
  const allowedTypes = getAllowedChildNodeTypes(parentType);
  if (!allowedTypes.includes(nodeType)) {
    return document;
  }

  const scopeNodes = getScopeNodes(document, targetScopeId);
  const nextNode = createNode(nodeType, localParentId, getNextOrderValue(scopeNodes, localParentId), initialNode, idFactory);

  return updateScopeUiSchema(document, targetScopeId, (uiSchema) => ({
    ...uiSchema,
    nodes: [...uiSchema.nodes, nextNode],
    selectedNodeId: nextNode.id,
  }));
}

export function addFormBuilderFieldNode(
  document: FormBuilderDocument,
  parentId: string | null,
  field: FormsPlaceholderField,
  idFactory?: (prefix: string) => string,
): FormBuilderDocument {
  const parentNode = getFormBuilderNode(document, parentId);
  const activeScope = getActiveFormBuilderScope(document);
  const targetScopeId = parentNode?.type === "subform"
    ? parentNode.id
    : (parentNode ? (getFormBuilderNodeScopeId(document, parentNode.id) ?? "root") : activeScope.scopeId);
  const localParentId = parentNode?.type === "subform" ? null : parentId;
  const parentType = parentNode?.type ?? (activeScope.scopeType === "SUBFORM" ? "subform" : null);
  const allowedTypes = getAllowedChildNodeTypes(parentType);
  if (!allowedTypes.includes("field")) {
    return document;
  }

  if (getBoundFieldIds(document).has(field.id)) {
    return document;
  }

  const nextNode = createNode(
    "field",
    localParentId,
    getNextOrderValue(getScopeNodes(document, targetScopeId), localParentId),
    {
      fieldId: field.id,
      helperText: "",
      title: field.label,
    },
    idFactory,
  );

  return updateScopeUiSchema(document, targetScopeId, (uiSchema) => ({
    ...uiSchema,
    nodes: [...uiSchema.nodes, nextNode],
    selectedNodeId: nextNode.id,
  }), { extraFieldIds: [field.id] });
}

function collectDescendantIds(nodes: ReadonlyArray<FormBuilderNode>, nodeId: string) {
  const descendantIds = new Set<string>([nodeId]);
  let changed = true;

  while (changed) {
    changed = false;

    nodes.forEach((node) => {
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

function getFallbackSelectedNodeId(
  nodes: ReadonlyArray<FormBuilderNode>,
  parentId: string | null,
  options?: {
    allowNull?: boolean;
  },
) {
  const siblingCandidate = [...nodes]
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.order - right.order)[0]?.id;

  if (siblingCandidate) {
    return siblingCandidate;
  }

  return getDefaultSelectedNodeIdForScope(nodes, options?.allowNull ?? false);
}

export function removeFormBuilderNode(
  document: FormBuilderDocument,
  nodeId: string,
): FormBuilderDocument {
  const node = getFormBuilderNode(document, nodeId);
  if (!node) {
    return document;
  }

  const scopeId = getFormBuilderNodeScopeId(document, nodeId);
  if (!scopeId) {
    return document;
  }

  const scopeNodes = getScopeNodes(document, scopeId);
  const descendants = collectDescendantIds(scopeNodes, nodeId);
  const nextNodes = resequenceSiblingOrders(
    scopeNodes.filter((entry) => !descendants.has(entry.id)),
    node.parentId,
  );

  if (scopeId === "root") {
    const currentParentRemoved = document.rootScope.uiSchema.currentParentId
      ? descendants.has(document.rootScope.uiSchema.currentParentId)
      : false;
    const selectedRemoved = document.rootScope.uiSchema.selectedNodeId
      ? descendants.has(document.rootScope.uiSchema.selectedNodeId)
      : false;

    return finalizeScopedDocument({
      ...document,
      activeScopeId: document.activeScopeId === nodeId ? "root" : document.activeScopeId,
      rootScope: {
        ...document.rootScope,
        uiSchema: {
          ...document.rootScope.uiSchema,
          currentParentId: currentParentRemoved ? node.parentId : document.rootScope.uiSchema.currentParentId,
          nodes: nextNodes,
          selectedNodeId: selectedRemoved
            ? getFallbackSelectedNodeId(nextNodes, node.parentId, { allowNull: false })
            : document.rootScope.uiSchema.selectedNodeId,
        },
      },
      subformScopes: document.subformScopes.filter((scope) => scope.parentSubformNodeId !== nodeId),
    });
  }

  const currentScope = getSubformScope(document, scopeId);
  if (!currentScope) {
    return document;
  }

  const currentParentRemoved = currentScope.uiSchema.currentParentId
    ? descendants.has(currentScope.uiSchema.currentParentId)
    : false;
  const selectedRemoved = currentScope.uiSchema.selectedNodeId
    ? descendants.has(currentScope.uiSchema.selectedNodeId)
    : false;

  return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
    ...uiSchema,
    currentParentId: currentParentRemoved ? node.parentId : uiSchema.currentParentId,
    nodes: nextNodes,
    selectedNodeId: selectedRemoved
      ? getFallbackSelectedNodeId(nextNodes, node.parentId, { allowNull: true })
      : uiSchema.selectedNodeId,
  }));
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

  const scopeId = getFormBuilderNodeScopeId(document, nodeId);
  if (!scopeId) {
    return document;
  }

  const scopeNodes = getScopeNodes(document, scopeId);
  const siblings = [...scopeNodes]
    .filter((entry) => entry.parentId === node.parentId)
    .sort((left, right) => left.order - right.order);
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

  return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
    ...uiSchema,
    nodes: uiSchema.nodes.map((entry) => {
      if (entry.parentId !== node.parentId) {
        return entry;
      }

      return {
        ...entry,
        order: nextOrderMap.get(entry.id) ?? entry.order,
      };
    }),
  }));
}

export function reorderFormBuilderNode(
  document: FormBuilderDocument,
  activeNodeId: string,
  overNodeId: string,
): FormBuilderDocument {
  const activeNode = getFormBuilderNode(document, activeNodeId);
  const overNode = getFormBuilderNode(document, overNodeId);

  const scopeId = getFormBuilderNodeScopeId(document, activeNodeId);
  if (
    !activeNode ||
    !overNode ||
    !scopeId ||
    scopeId !== getFormBuilderNodeScopeId(document, overNodeId) ||
    activeNode.parentId !== overNode.parentId ||
    activeNode.id === overNode.id
  ) {
    return document;
  }

  const scopeNodes = getScopeNodes(document, scopeId);
  const siblings = [...scopeNodes]
    .filter((node) => node.parentId === activeNode.parentId)
    .sort((left, right) => left.order - right.order);
  const activeIndex = siblings.findIndex((node) => node.id === activeNodeId);
  const overIndex = siblings.findIndex((node) => node.id === overNodeId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return document;
  }

  const reordered = [...siblings];
  const [moved] = reordered.splice(activeIndex, 1);
  reordered.splice(overIndex, 0, moved);
  const nextOrderMap = new Map(reordered.map((entry, index) => [entry.id, index]));

  return updateScopeUiSchema(document, scopeId, (uiSchema) => ({
    ...uiSchema,
    nodes: uiSchema.nodes.map((entry) => {
      if (entry.parentId !== activeNode.parentId) {
        return entry;
      }

      return {
        ...entry,
        order: nextOrderMap.get(entry.id) ?? entry.order,
      };
    }),
  }));
}

export function getElementPaletteItems(
  document: FormBuilderDocument,
  access: FormBuilderWorkspaceAccess,
  searchTerm: string,
): ReadonlyArray<FormBuilderElementPaletteItem> {
  const activeScope = getActiveFormBuilderScope(document);
  const parentType =
    activeScope.uiSchema.currentParentId
      ? getFormBuilderNode(document, activeScope.uiSchema.currentParentId)?.type ?? null
      : (activeScope.scopeType === "SUBFORM" ? "subform" : null);
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
  access: FormBuilderWorkspaceAccess,
  searchTerm: string,
): ReadonlyArray<FormBuilderFieldPaletteItem> {
  const activeScope = getActiveFormBuilderScope(document);
  const parentType =
    activeScope.uiSchema.currentParentId
      ? getFormBuilderNode(document, activeScope.uiSchema.currentParentId)?.type ?? null
      : (activeScope.scopeType === "SUBFORM" ? "subform" : null);
  const allowedTypes = new Set(getAllowedChildNodeTypes(parentType));
  if (!allowedTypes.has("field")) {
    return [];
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  return formBuilderFieldDefinitions
    .filter((definition) =>
      !normalizedSearch || getFormsPlaceholderFieldSearchText({ ...definition.template, id: definition.idBase }).includes(normalizedSearch),
    )
    .map((definition) => ({
      category: getFormBuilderFieldPaletteSection(definition.template),
      descriptionKey: "tenant.platformStudio.forms.builder.palette.fieldDescription",
      definition,
      disabled: !access.canAddItems,
      disabledReasonKey: access.canAddItems ? null : access.lockReasonKey,
      iconKey: getFormsPlaceholderFieldIconKey({ ...definition.template, id: definition.idBase }),
      kind: "field" as const,
    }));
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

  if (node.type === "view_only_field") {
    return node.viewOnlyBinding
      ? "tenant.platformStudio.forms.builder.summary.viewOnlyField"
      : "tenant.platformStudio.forms.builder.summary.viewOnlyFieldEmpty";
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
