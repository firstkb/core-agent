import { useEffect, useState } from "react";

import type {
  FormBuilderSubformType,
  FormsPlaceholderAcceptedFieldKind,
  FormsPlaceholderFieldPreset,
} from "./forms-builder-contract";
import {
  migrateLegacyFieldKind,
  migrateLegacyFieldPreset,
} from "./forms-builder-migrations";

export type { FormsPlaceholderFieldPreset } from "./forms-builder-contract";

export type FormsPlaceholderFieldFamily = "advanced" | "choice" | "core" | "preset";
export type FormsPlaceholderFieldKind = FormsPlaceholderAcceptedFieldKind;
export type FormsPlaceholderChoiceRenderStyle = "buttons" | "native";
export type FormsPlaceholderChoiceOrientation = "horizontal" | "vertical";
export type FormsPlaceholderFieldValidation = "email" | "phone" | "url";
export type FormsPlaceholderFieldStatus = "draft" | "persisted" | "published";
export type FormsPlaceholderFieldSemanticRole = "reportedBy" | "reportedDate" | "workflowStatus";
export type FormsPlaceholderTagMode = "create_only" | "select_existing" | "select_or_create";
export type FormsPlaceholderLookupDisplayMode = "catalog_modal" | "search_select";
export type FormsPlaceholderLookupSearchBehavior = "ajax" | "prefetch";
export type FormsPlaceholderSelectionMode = "multiple" | "single";
export type FormsPlaceholderFieldOptionStyle = {
  backgroundColor?: string;
  borderColor?: string;
  option: string;
  textColor?: string;
};
export type FormsPlaceholderChoiceDisplay = {
  allowEmpty?: boolean;
  maxSelections?: number;
  minSelections?: number;
  optionStyles?: ReadonlyArray<FormsPlaceholderFieldOptionStyle>;
  orientation?: FormsPlaceholderChoiceOrientation;
  renderStyle?: FormsPlaceholderChoiceRenderStyle;
};
export type FormsPlaceholderLookupConfig = {
  displayMode?: FormsPlaceholderLookupDisplayMode;
  displayTemplate?: string;
  groupByField?: string;
  itemLabelFields?: ReadonlyArray<string>;
  searchBehavior?: FormsPlaceholderLookupSearchBehavior;
  searchFields?: ReadonlyArray<string>;
  sortField?: string;
  sourceModel?: string;
  storedTextFields?: ReadonlyArray<string>;
  storedValueField?: string;
};
export type FormsPlaceholderSuggestSearchMode = "contains" | "prefix";
export type FormsPlaceholderSuggestSourceMode = "same_field_distinct_values";
export type FormsPlaceholderSuggestConfig = {
  allowCustomValue?: boolean;
  maxResults?: number;
  minQueryLength?: number;
  searchMode?: FormsPlaceholderSuggestSearchMode;
  sourceMode?: FormsPlaceholderSuggestSourceMode;
};

export type FormsPlaceholderSchemaScope = {
  displayName: string;
  key: string;
  scopeType: "SUBFORM";
  subformType: FormBuilderSubformType;
};

export type FormsPlaceholderField = {
  autocomplete?: string;
  choiceDisplay?: FormsPlaceholderChoiceDisplay;
  defaultValueMode?: "today";
  dependentFilter?: string;
  displayName?: string;
  displayFormat?: string;
  displayFields?: ReadonlyArray<string>;
  family: FormsPlaceholderFieldFamily;
  historicalUpdates?: boolean;
  id: string;
  inputMode?: string;
  isPersisted?: boolean;
  isLocked: boolean;
  kind: FormsPlaceholderFieldKind;
  label: string;
  lookupConfig?: FormsPlaceholderLookupConfig;
  mask?: string;
  maxTags?: number;
  options?: ReadonlyArray<string>;
  placeholder?: string;
  preset?: FormsPlaceholderFieldPreset;
  readonly?: boolean;
  semanticRole?: FormsPlaceholderFieldSemanticRole;
  selectionMode?: FormsPlaceholderSelectionMode;
  schemaScopeKey?: string;
  suggestConfig?: FormsPlaceholderSuggestConfig;
  sourceFilters?: ReadonlyArray<string>;
  sourceLabel?: string;
  status?: FormsPlaceholderFieldStatus;
  storageKey?: string;
  tagMode?: FormsPlaceholderTagMode;
  validation?: FormsPlaceholderFieldValidation;
};

export type FormsPlaceholderScreen = {
  description: string;
  displayName?: string;
  guid?: string;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  isViewLocked?: boolean;
  key: string;
  kind: "detail" | "form";
  lastAlignedModelStructureVersion?: number;
  title: string;
  viewVersion?: number;
};

export type FormsPlaceholderObject = {
  canEditViewsOnly: boolean;
  dataCount?: number;
  description: string;
  displayName?: string;
  fields: ReadonlyArray<FormsPlaceholderField>;
  guid?: string;
  id: string;
  isStructureLocked: boolean;
  key: string;
  modelStructureVersion?: number;
  owner: string;
  schemaScopes?: ReadonlyArray<FormsPlaceholderSchemaScope>;
  screens: ReadonlyArray<FormsPlaceholderScreen>;
  sourceType?: string;
  title: string;
  version?: number;
};

export type FormsPlaceholderView = FormsPlaceholderScreen;
export type FormsPlaceholderModel = FormsPlaceholderObject;

const formsPlaceholderStorageKey = "tenant-web-platform-studio-objects";
const formsPlaceholderStorageEvent = "tenant-web-platform-studio-objects-updated";
const formsTitleCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function normalizeStorageKeyPart(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeStableKey(value: string | undefined, fallbackId: string) {
  const trimmedValue = value?.trim();
  if (trimmedValue) {
    return trimmedValue;
  }

  return fallbackId;
}

function normalizeOptionalGuid(value: string | undefined, fallback?: string) {
  const trimmedValue = value?.trim();
  if (trimmedValue) {
    return trimmedValue;
  }

  return fallback;
}

export function createFormsPlaceholderStorageKey(
  label: string | undefined,
  fallbackId: string | undefined,
) {
  const normalizedLabel = normalizeStorageKeyPart(label);
  if (normalizedLabel) {
    return normalizedLabel;
  }

  const normalizedFallbackId = normalizeStorageKeyPart(fallbackId);
  return normalizedFallbackId || "field";
}

function getFormsPlaceholderFieldStorageScopeKey(
  field: Pick<FormsPlaceholderField, "schemaScopeKey">,
) {
  return normalizeOptionalString(field.schemaScopeKey, undefined) ?? "root";
}

function createUniqueStorageKeyCandidate(baseKey: string, usedKeys: ReadonlySet<string>) {
  if (!usedKeys.has(baseKey)) {
    return baseKey;
  }

  let suffix = 2;
  let nextKey = `${baseKey}_${suffix}`;
  while (usedKeys.has(nextKey)) {
    suffix += 1;
    nextKey = `${baseKey}_${suffix}`;
  }

  return nextKey;
}

export function createUniqueFormsPlaceholderStorageKey(
  label: string | undefined,
  fallbackId: string | undefined,
  fields: ReadonlyArray<Pick<FormsPlaceholderField, "id" | "schemaScopeKey" | "storageKey">>,
  options?: {
    excludeFieldId?: string;
    schemaScopeKey?: string;
  },
) {
  const scopeKey = normalizeOptionalString(options?.schemaScopeKey, undefined) ?? "root";
  const usedKeys = new Set(
    fields.flatMap((field) => {
      if (getFormsPlaceholderFieldStorageScopeKey(field) !== scopeKey) {
        return [];
      }
      if (options?.excludeFieldId && field.id === options.excludeFieldId) {
        return [];
      }

      return [createFormsPlaceholderStorageKey(field.storageKey, field.id)];
    }),
  );

  return createUniqueStorageKeyCandidate(
    createFormsPlaceholderStorageKey(label, fallbackId),
    usedKeys,
  );
}

function humanizeSchemaScopeKey(value: string) {
  return value
    .replace(/^pb_/, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Subform";
}

export function getFormsPlaceholderFieldDisplayName(field: FormsPlaceholderField) {
  return field.displayName?.trim() || field.label;
}

function dedupeFormsPlaceholderFieldStorageKeys(
  fields: ReadonlyArray<FormsPlaceholderField>,
) {
  const usedKeysByScope = new Map<string, Set<string>>();

  return fields.map((field) => {
    const scopeKey = getFormsPlaceholderFieldStorageScopeKey(field);
    const usedKeys = usedKeysByScope.get(scopeKey) ?? new Set<string>();
    const nextStorageKey = createUniqueStorageKeyCandidate(
      createFormsPlaceholderStorageKey(
        field.storageKey ?? getFormsPlaceholderFieldDisplayName(field),
        field.id,
      ),
      usedKeys,
    );

    usedKeys.add(nextStorageKey);
    usedKeysByScope.set(scopeKey, usedKeys);

    if (field.storageKey === nextStorageKey) {
      return field;
    }

    return {
      ...field,
      storageKey: nextStorageKey,
    };
  });
}

function cloneFormsPlaceholderSchemaScope(scope: FormsPlaceholderSchemaScope): FormsPlaceholderSchemaScope {
  return {
    displayName: scope.displayName.trim() || humanizeSchemaScopeKey(scope.key),
    key: scope.key.trim(),
    scopeType: "SUBFORM",
    subformType: scope.subformType === "CHECKLIST" ? "CHECKLIST" : "DEFAULT",
  };
}

function normalizeSchemaScopes(
  value: unknown,
  fallback: ReadonlyArray<FormsPlaceholderSchemaScope> | undefined,
): ReadonlyArray<FormsPlaceholderSchemaScope> | undefined {
  if (!Array.isArray(value)) {
    return fallback ? fallback.map(cloneFormsPlaceholderSchemaScope) : undefined;
  }

  const scopes = value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const candidate = entry as Partial<FormsPlaceholderSchemaScope>;
    const key = typeof candidate.key === "string" && candidate.key.trim().length > 0
      ? candidate.key.trim()
      : "";
    if (!key) {
      return [];
    }

    return [{
      displayName:
        typeof candidate.displayName === "string" && candidate.displayName.trim().length > 0
          ? candidate.displayName.trim()
          : humanizeSchemaScopeKey(key),
      key,
      scopeType: "SUBFORM" as const,
      subformType: (candidate.subformType === "CHECKLIST" ? "CHECKLIST" : "DEFAULT") as FormBuilderSubformType,
    }];
  });

  if (scopes.length === 0) {
    return fallback ? fallback.map(cloneFormsPlaceholderSchemaScope) : undefined;
  }

  const seen = new Set<string>();
  return scopes.filter((scope) => {
    if (seen.has(scope.key)) {
      return false;
    }

    seen.add(scope.key);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractFieldsFromCanonicalDataSchema(
  value: unknown,
) {
  if (!isRecord(value)) {
    return null;
  }

  const rootScope = isRecord(value.rootScope) ? value.rootScope : null;
  const subformScopes = Array.isArray(value.subformScopes) ? value.subformScopes : [];
  const fields: Partial<FormsPlaceholderField>[] = [];

  const appendFields = (
    scopeKey: string,
    scopeFields: unknown,
  ) => {
    if (!Array.isArray(scopeFields)) {
      return;
    }

    scopeFields.forEach((entry) => {
      if (!isRecord(entry)) {
        return;
      }

      const fieldId = typeof entry.fieldId === "string" && entry.fieldId.trim().length > 0
        ? entry.fieldId
        : typeof entry.id === "string" && entry.id.trim().length > 0
          ? entry.id
          : typeof entry.storageKey === "string" && entry.storageKey.trim().length > 0
            ? entry.storageKey
            : "";
      if (!fieldId) {
        return;
      }

      fields.push({
        ...entry,
        id: fieldId,
        schemaScopeKey: scopeKey,
      });
    });
  };

  appendFields("root", rootScope?.fields);
  subformScopes.forEach((entry) => {
    if (!isRecord(entry)) {
      return;
    }

    const scopeKey = typeof entry.schemaScopeId === "string" && entry.schemaScopeId.trim().length > 0
      ? entry.schemaScopeId
      : typeof entry.tableKey === "string" && entry.tableKey.trim().length > 0
        ? entry.tableKey
        : "";
    if (!scopeKey) {
      return;
    }

    appendFields(scopeKey, entry.fields);
  });

  return fields.length > 0 ? fields : null;
}

function extractSchemaScopesFromCanonicalDataSchema(
  value: unknown,
): ReadonlyArray<FormsPlaceholderSchemaScope> | undefined {
  if (!isRecord(value) || !Array.isArray(value.subformScopes)) {
    return undefined;
  }

  return normalizeSchemaScopes(
    value.subformScopes.map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      const key = typeof entry.schemaScopeId === "string" && entry.schemaScopeId.trim().length > 0
        ? entry.schemaScopeId
        : typeof entry.tableKey === "string" && entry.tableKey.trim().length > 0
          ? entry.tableKey
          : "";
      if (!key) {
        return null;
      }

      return {
        displayName:
          typeof entry.displayName === "string" && entry.displayName.trim().length > 0
            ? entry.displayName
            : humanizeSchemaScopeKey(key),
        key,
        scopeType: "SUBFORM",
        subformType: entry.subformType === "CHECKLIST" ? "CHECKLIST" : "DEFAULT",
      };
    }),
    undefined,
  );
}

function getDefaultFieldStatus(field: FormsPlaceholderField) {
  if (field.status) {
    return field.status;
  }

  return field.isPersisted === false ? "draft" : "persisted";
}

function getDefaultFieldSemanticRole(field: Pick<FormsPlaceholderField, "id" | "kind" | "semanticRole">) {
  if (field.semanticRole) {
    return field.semanticRole;
  }

  if (field.kind === "db_lookup" && field.id.startsWith("reported-by")) {
    return "reportedBy";
  }

  if (field.kind === "date" && field.id.startsWith("reported-date")) {
    return "reportedDate";
  }

  if (field.kind === "single_select" && field.id === "status") {
    return "workflowStatus";
  }

  return undefined;
}

function getDefaultViewVersion(screen: FormsPlaceholderScreen) {
  return typeof screen.viewVersion === "number" && Number.isFinite(screen.viewVersion) && screen.viewVersion > 0
    ? Math.floor(screen.viewVersion)
    : 1;
}

function getDefaultAlignedVersion(
  object: Pick<FormsPlaceholderObject, "modelStructureVersion">,
  screen: FormsPlaceholderScreen,
) {
  if (
    typeof screen.lastAlignedModelStructureVersion === "number"
    && Number.isFinite(screen.lastAlignedModelStructureVersion)
    && screen.lastAlignedModelStructureVersion > 0
  ) {
    return Math.floor(screen.lastAlignedModelStructureVersion);
  }

  return typeof object.modelStructureVersion === "number" && Number.isFinite(object.modelStructureVersion) && object.modelStructureVersion > 0
    ? Math.floor(object.modelStructureVersion)
    : 1;
}

export function cloneFormsPlaceholderField(field: FormsPlaceholderField): FormsPlaceholderField {
  const displayName = getFormsPlaceholderFieldDisplayName(field);

  return {
    ...field,
    choiceDisplay: field.choiceDisplay
      ? {
          ...field.choiceDisplay,
          optionStyles: field.choiceDisplay.optionStyles
            ? field.choiceDisplay.optionStyles.map((style) => ({ ...style }))
            : undefined,
        }
      : undefined,
    displayName,
    displayFields: field.displayFields ? [...field.displayFields] : undefined,
    isPersisted: field.isPersisted ?? getDefaultFieldStatus(field) !== "draft",
    lookupConfig: field.lookupConfig
      ? {
          ...field.lookupConfig,
          itemLabelFields: field.lookupConfig.itemLabelFields ? [...field.lookupConfig.itemLabelFields] : undefined,
          searchFields: field.lookupConfig.searchFields ? [...field.lookupConfig.searchFields] : undefined,
          sortField: field.lookupConfig.sortField,
          storedTextFields: field.lookupConfig.storedTextFields ? [...field.lookupConfig.storedTextFields] : undefined,
        }
      : undefined,
    options: field.options ? [...field.options] : undefined,
    semanticRole: getDefaultFieldSemanticRole(field),
    selectionMode: field.selectionMode,
    schemaScopeKey: normalizeOptionalString(field.schemaScopeKey, undefined),
    sourceFilters: field.sourceFilters ? [...field.sourceFilters] : undefined,
    status: getDefaultFieldStatus(field),
    storageKey: createFormsPlaceholderStorageKey(field.storageKey ?? displayName, field.id),
  };
}

export function cloneFormsPlaceholderView(
  screen: FormsPlaceholderScreen,
  object?: Pick<FormsPlaceholderObject, "modelStructureVersion">,
): FormsPlaceholderScreen {
  return {
    ...screen,
    displayName: screen.displayName?.trim() || screen.title,
    guid: normalizeOptionalGuid(screen.guid),
    isDefault: screen.isDefault ?? false,
    isViewLocked: screen.isViewLocked ?? false,
    key: normalizeStableKey(screen.key, screen.id),
    lastAlignedModelStructureVersion: getDefaultAlignedVersion(object ?? { modelStructureVersion: 1 }, screen),
    viewVersion: getDefaultViewVersion(screen),
  };
}

export function cloneFormsPlaceholderModel(model: FormsPlaceholderObject): FormsPlaceholderObject {
  const normalizedModelStructureVersion =
    typeof model.modelStructureVersion === "number" && Number.isFinite(model.modelStructureVersion) && model.modelStructureVersion > 0
      ? Math.floor(model.modelStructureVersion)
      : 1;
  const normalizedVersion =
    typeof model.version === "number" && Number.isFinite(model.version) && model.version > 0
      ? Math.floor(model.version)
      : normalizedModelStructureVersion;
  const baseModel = {
    ...model,
    displayName: model.displayName?.trim() || model.title,
    guid: normalizeOptionalGuid(model.guid),
    key: normalizeStableKey(model.key, model.id),
    modelStructureVersion: normalizedModelStructureVersion,
    version: normalizedVersion,
  };

  return {
    ...baseModel,
    fields: dedupeFormsPlaceholderFieldStorageKeys(model.fields.map(cloneFormsPlaceholderField)),
    schemaScopes: normalizeSchemaScopes(model.schemaScopes, model.schemaScopes),
    screens: model.screens.map((screen) => cloneFormsPlaceholderView(screen, baseModel)),
  };
}

export function sortFormsPlaceholderScreens(screens: ReadonlyArray<FormsPlaceholderScreen>) {
  return [...screens].sort((left, right) => formsTitleCollator.compare(left.title, right.title));
}

export function sortFormsPlaceholderObjects(objects: ReadonlyArray<FormsPlaceholderObject>) {
  return [...objects]
    .map((object) => ({
      ...object,
      screens: sortFormsPlaceholderScreens(object.screens),
    }))
    .sort((left, right) => formsTitleCollator.compare(left.title, right.title));
}

export const sortFormsPlaceholderViews = sortFormsPlaceholderScreens;
export const sortFormsPlaceholderModels = sortFormsPlaceholderObjects;

function createFallbackField(candidate: Partial<FormsPlaceholderField>, index: number): FormsPlaceholderField {
  const id =
    (typeof candidate.id === "string" && candidate.id.trim().length > 0 ? candidate.id : undefined)
    ?? `field-${index + 1}`;
  const label =
    (typeof candidate.label === "string" && candidate.label.trim().length > 0 ? candidate.label : undefined)
    ?? id;

  return {
    family: isFieldFamily(candidate.family) ? candidate.family : "core",
    id,
    isLocked: typeof candidate.isLocked === "boolean" ? candidate.isLocked : false,
    kind: isFieldKind(candidate.kind) ? candidate.kind : "short_text",
    label,
  };
}

function createFallbackScreen(candidate: Partial<FormsPlaceholderScreen>, index: number): FormsPlaceholderScreen {
  const id =
    (typeof candidate.id === "string" && candidate.id.trim().length > 0 ? candidate.id : undefined)
    ?? (typeof candidate.key === "string" && candidate.key.trim().length > 0 ? candidate.key : undefined)
    ?? `view-${index + 1}`;
  const title =
    (typeof candidate.title === "string" && candidate.title.trim().length > 0 ? candidate.title : undefined)
    ?? (typeof candidate.displayName === "string" && candidate.displayName.trim().length > 0 ? candidate.displayName : undefined)
    ?? id;

  return {
    description: typeof candidate.description === "string" ? candidate.description : "",
    displayName: typeof candidate.displayName === "string" && candidate.displayName.trim().length > 0
      ? candidate.displayName
      : title,
    guid: normalizeOptionalGuid(typeof candidate.guid === "string" ? candidate.guid : undefined),
    id,
    isActive: typeof candidate.isActive === "boolean" ? candidate.isActive : index === 0,
    isDefault: typeof candidate.isDefault === "boolean" ? candidate.isDefault : false,
    isViewLocked: typeof candidate.isViewLocked === "boolean" ? candidate.isViewLocked : false,
    key: normalizeStableKey(typeof candidate.key === "string" ? candidate.key : undefined, id),
    kind: candidate.kind === "detail" ? "detail" : "form",
    lastAlignedModelStructureVersion:
      typeof candidate.lastAlignedModelStructureVersion === "number"
      && Number.isFinite(candidate.lastAlignedModelStructureVersion)
      && candidate.lastAlignedModelStructureVersion > 0
        ? Math.floor(candidate.lastAlignedModelStructureVersion)
        : 1,
    title,
    viewVersion:
      typeof candidate.viewVersion === "number" && Number.isFinite(candidate.viewVersion) && candidate.viewVersion > 0
        ? Math.floor(candidate.viewVersion)
        : 1,
  };
}

function createFallbackModel(candidate: Partial<FormsPlaceholderObject>, index: number): FormsPlaceholderObject {
  const id =
    (typeof candidate.id === "string" && candidate.id.trim().length > 0 ? candidate.id : undefined)
    ?? (typeof candidate.key === "string" && candidate.key.trim().length > 0 ? candidate.key : undefined)
    ?? `model-${index + 1}`;
  const title =
    (typeof candidate.title === "string" && candidate.title.trim().length > 0 ? candidate.title : undefined)
    ?? (typeof candidate.displayName === "string" && candidate.displayName.trim().length > 0 ? candidate.displayName : undefined)
    ?? id;

  return {
    canEditViewsOnly: typeof candidate.canEditViewsOnly === "boolean" ? candidate.canEditViewsOnly : false,
    description: typeof candidate.description === "string" ? candidate.description : "",
    displayName: typeof candidate.displayName === "string" && candidate.displayName.trim().length > 0
      ? candidate.displayName
      : title,
    fields: [],
    guid: normalizeOptionalGuid(typeof candidate.guid === "string" ? candidate.guid : undefined),
    id,
    isStructureLocked: typeof candidate.isStructureLocked === "boolean" ? candidate.isStructureLocked : false,
    key: normalizeStableKey(typeof candidate.key === "string" ? candidate.key : undefined, id),
    modelStructureVersion:
      typeof candidate.modelStructureVersion === "number" && Number.isFinite(candidate.modelStructureVersion) && candidate.modelStructureVersion > 0
        ? Math.floor(candidate.modelStructureVersion)
        : 1,
    owner: typeof candidate.owner === "string" ? candidate.owner : "",
    schemaScopes: [],
    screens: [],
    title,
    version:
      typeof candidate.version === "number" && Number.isFinite(candidate.version) && candidate.version > 0
        ? Math.floor(candidate.version)
        : 1,
  };
}

function isFieldFamily(value: unknown): value is FormsPlaceholderFieldFamily {
  return value === "advanced" || value === "choice" || value === "core" || value === "preset";
}

function isFieldKind(value: unknown): value is FormsPlaceholderFieldKind {
  return (
    value === "attachment" ||
    value === "boolean" ||
    value === "currency" ||
    value === "date" ||
    value === "date_time" ||
    value === "db_lookup" ||
    value === "decimal" ||
    value === "geo_point" ||
    value === "integer" ||
    value === "long_text" ||
    value === "multi_select" ||
    value === "rich_text" ||
    value === "short_text" ||
    value === "signature" ||
    value === "single_select"
  );
}

function isFieldPreset(value: unknown): value is FormsPlaceholderFieldPreset {
  return (
    value === "checkbox_group" ||
    value === "db_lookup_value" ||
    value === "company_lookup" ||
    value === "contact_lookup" ||
    value === "date_today" ||
    value === "email" ||
    value === "phone" ||
    value === "project_lookup" ||
    value === "radio_group" ||
    value === "suggest_text" ||
    value === "tags" ||
    value === "url"
  );
}

function isChoiceRenderStyle(value: unknown): value is FormsPlaceholderChoiceRenderStyle {
  return value === "buttons" || value === "native";
}

function isChoiceOrientation(value: unknown): value is FormsPlaceholderChoiceOrientation {
  return value === "horizontal" || value === "vertical";
}

function isFieldValidation(value: unknown): value is FormsPlaceholderFieldValidation {
  return value === "email" || value === "phone" || value === "url";
}

function isFieldStatus(value: unknown): value is FormsPlaceholderFieldStatus {
  return value === "draft" || value === "persisted" || value === "published";
}

function isFieldSemanticRole(value: unknown): value is FormsPlaceholderFieldSemanticRole {
  return value === "reportedBy" || value === "reportedDate" || value === "workflowStatus";
}

function isTagMode(value: unknown): value is FormsPlaceholderTagMode {
  return value === "create_only" || value === "select_existing" || value === "select_or_create";
}

function isLookupDisplayMode(value: unknown): value is FormsPlaceholderLookupDisplayMode {
  return value === "catalog_modal" || value === "search_select";
}

function isLookupSearchBehavior(value: unknown): value is FormsPlaceholderLookupSearchBehavior {
  return value === "ajax" || value === "prefetch";
}

function isSelectionMode(value: unknown): value is FormsPlaceholderSelectionMode {
  return value === "multiple" || value === "single";
}

function normalizeStringList(value: unknown, fallback: ReadonlyArray<string> | undefined) {
  if (!Array.isArray(value)) {
    return fallback ? [...fallback] : undefined;
  }

  const nextValues = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  if (nextValues.length === 0) {
    return fallback ? [...fallback] : undefined;
  }

  return nextValues;
}

function normalizeOptionalString(value: unknown, fallback: string | undefined) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function normalizeColor(value: unknown) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value.trim())
    ? value.trim()
    : undefined;
}

function normalizeChoiceOptionStyles(
  value: unknown,
  fallback: ReadonlyArray<FormsPlaceholderFieldOptionStyle> | undefined,
  options: ReadonlyArray<string> | undefined,
) {
  const normalizedOptionSet = new Set(options ?? []);
  const nextValues = Array.isArray(value)
    ? value.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const candidate = entry as Partial<FormsPlaceholderFieldOptionStyle>;
        if (typeof candidate.option !== "string" || !normalizedOptionSet.has(candidate.option)) {
          return [];
        }

        return [{
          backgroundColor: normalizeColor(candidate.backgroundColor),
          borderColor: normalizeColor(candidate.borderColor),
          option: candidate.option,
          textColor: normalizeColor(candidate.textColor),
        }];
      })
    : (fallback ? fallback.filter((style) => normalizedOptionSet.has(style.option)).map((style) => ({ ...style })) : []);

  return nextValues.length > 0 ? nextValues : undefined;
}

function normalizeChoiceDisplay(
  value: unknown,
  fallback: FormsPlaceholderChoiceDisplay | undefined,
  options: ReadonlyArray<string> | undefined,
) {
  if (!value || typeof value !== "object") {
    return fallback
      ? {
          ...fallback,
          optionStyles: normalizeChoiceOptionStyles(fallback.optionStyles, fallback.optionStyles, options),
        }
      : undefined;
  }

  const candidate = value as Partial<FormsPlaceholderChoiceDisplay>;
  return {
    allowEmpty: typeof candidate.allowEmpty === "boolean" ? candidate.allowEmpty : fallback?.allowEmpty,
    maxSelections: typeof candidate.maxSelections === "number" && Number.isFinite(candidate.maxSelections)
      ? candidate.maxSelections
      : fallback?.maxSelections,
    minSelections: typeof candidate.minSelections === "number" && Number.isFinite(candidate.minSelections)
      ? candidate.minSelections
      : fallback?.minSelections,
    optionStyles: normalizeChoiceOptionStyles(candidate.optionStyles, fallback?.optionStyles, options),
    orientation: isChoiceOrientation(candidate.orientation) ? candidate.orientation : fallback?.orientation,
    renderStyle: isChoiceRenderStyle(candidate.renderStyle) ? candidate.renderStyle : fallback?.renderStyle,
  };
}

function normalizeLookupConfig(
  value: unknown,
  fallback: FormsPlaceholderLookupConfig | undefined,
) {
  if (!value || typeof value !== "object") {
    return fallback
      ? {
          ...fallback,
          itemLabelFields: fallback.itemLabelFields ? [...fallback.itemLabelFields] : undefined,
          searchFields: fallback.searchFields ? [...fallback.searchFields] : undefined,
          storedTextFields: fallback.storedTextFields ? [...fallback.storedTextFields] : undefined,
        }
      : undefined;
  }

  const candidate = value as Partial<FormsPlaceholderLookupConfig>;
  return {
    displayMode: isLookupDisplayMode(candidate.displayMode) ? candidate.displayMode : fallback?.displayMode,
    displayTemplate: normalizeOptionalString(candidate.displayTemplate, fallback?.displayTemplate),
    groupByField: normalizeOptionalString(candidate.groupByField, fallback?.groupByField),
    itemLabelFields: normalizeStringList(candidate.itemLabelFields, fallback?.itemLabelFields),
    searchBehavior: isLookupSearchBehavior(candidate.searchBehavior) ? candidate.searchBehavior : fallback?.searchBehavior,
    searchFields: normalizeStringList(candidate.searchFields, fallback?.searchFields),
    sortField: normalizeOptionalString(candidate.sortField, fallback?.sortField),
    sourceModel: normalizeOptionalString(candidate.sourceModel, fallback?.sourceModel),
    storedTextFields: normalizeStringList(candidate.storedTextFields, fallback?.storedTextFields),
    storedValueField: normalizeOptionalString(candidate.storedValueField, fallback?.storedValueField),
  };
}

function normalizeStoredScreens(value: unknown, fallbackScreens: ReadonlyArray<FormsPlaceholderScreen>) {
  if (!Array.isArray(value)) {
    return sortFormsPlaceholderScreens(
      fallbackScreens.map((screen) =>
        cloneFormsPlaceholderView(screen, { modelStructureVersion: getDefaultAlignedVersion({ modelStructureVersion: 1 }, screen) }),
      ),
    );
  }

  return sortFormsPlaceholderScreens(
    value.map((entry, index) => {
      const candidate = typeof entry === "object" && entry ? entry as Partial<FormsPlaceholderScreen> : {};
      const fallback =
        fallbackScreens.find((screen) => screen.id === candidate.id) ??
        fallbackScreens[index] ??
        createFallbackScreen(candidate, index);
      const normalizedViewVersion =
        typeof candidate.viewVersion === "number" && Number.isFinite(candidate.viewVersion) && candidate.viewVersion > 0
          ? Math.floor(candidate.viewVersion)
          : getDefaultViewVersion(fallback);

      return {
        ...fallback,
        ...candidate,
        description:
          typeof candidate.description === "string"
            ? candidate.description
            : fallback.description,
        displayName:
          typeof candidate.displayName === "string" && candidate.displayName.trim().length > 0
            ? candidate.displayName
            : (fallback.displayName?.trim() || fallback.title),
        guid: normalizeOptionalGuid(typeof candidate.guid === "string" ? candidate.guid : undefined, fallback.guid),
        isActive: typeof candidate.isActive === "boolean" ? candidate.isActive : fallback.isActive,
        isDefault: typeof candidate.isDefault === "boolean" ? candidate.isDefault : (fallback.isDefault ?? false),
        isViewLocked: typeof candidate.isViewLocked === "boolean" ? candidate.isViewLocked : (fallback.isViewLocked ?? false),
        key: normalizeStableKey(
          typeof candidate.key === "string" ? candidate.key : undefined,
          fallback.key,
        ),
        lastAlignedModelStructureVersion:
          typeof candidate.lastAlignedModelStructureVersion === "number"
            && Number.isFinite(candidate.lastAlignedModelStructureVersion)
            && candidate.lastAlignedModelStructureVersion > 0
            ? Math.floor(candidate.lastAlignedModelStructureVersion)
            : fallback.lastAlignedModelStructureVersion,
        viewVersion: normalizedViewVersion,
      };
    }),
  );
}

function normalizeStoredObjects(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as FormsPlaceholderObject[];
  }

  return sortFormsPlaceholderObjects(
    value.map((entry, index) => {
      const candidate = typeof entry === "object" && entry ? entry as Partial<FormsPlaceholderObject> : {};
      const fallback = createFallbackModel(candidate, index);
      const canonicalFields = extractFieldsFromCanonicalDataSchema(
        (candidate as { dataSchema?: unknown }).dataSchema,
      );
      const canonicalSchemaScopes = extractSchemaScopesFromCanonicalDataSchema(
        (candidate as { dataSchema?: unknown }).dataSchema,
      );
      const normalizedModelStructureVersion =
        typeof candidate.modelStructureVersion === "number"
          && Number.isFinite(candidate.modelStructureVersion)
          && candidate.modelStructureVersion > 0
          ? Math.floor(candidate.modelStructureVersion)
          : (fallback.modelStructureVersion ?? 1);
      const normalizedVersion =
        typeof candidate.version === "number" && Number.isFinite(candidate.version) && candidate.version > 0
          ? Math.floor(candidate.version)
          : (fallback.version ?? normalizedModelStructureVersion);
      const rawFields = canonicalFields ?? candidate.fields;

      return {
        ...fallback,
        ...candidate,
        displayName:
          typeof candidate.displayName === "string" && candidate.displayName.trim().length > 0
            ? candidate.displayName
            : (fallback.displayName?.trim() || fallback.title),
        fields: Array.isArray(rawFields)
          ? dedupeFormsPlaceholderFieldStorageKeys(rawFields.map((field, fieldIndex) => {
              const nextField =
                typeof field === "object" && field
                  ? field as Partial<FormsPlaceholderField>
                  : {};
              const fallbackField = fallback.fields.find((item) => item.id === nextField.id)
                ?? fallback.fields[fieldIndex]
                ?? createFallbackField(nextField, fieldIndex);
              const rawKind = typeof (nextField as { kind?: unknown }).kind === "string"
                ? (nextField as { kind?: string }).kind
                : undefined;
              const normalizedKind = migrateLegacyFieldKind(rawKind, fallbackField.kind);
              const normalizedPreset = migrateLegacyFieldPreset(rawKind, nextField.preset, fallbackField.preset);
              const normalizedFamily = normalizedPreset
                ? "preset"
                : (isFieldFamily(nextField.family) ? nextField.family : fallbackField.family);
              const normalizedDisplayName =
                typeof nextField.displayName === "string" && nextField.displayName.trim().length > 0
                  ? nextField.displayName
                  : getFormsPlaceholderFieldDisplayName(fallbackField);
              const normalizedStatus = isFieldStatus(nextField.status)
                ? nextField.status
                : getDefaultFieldStatus(fallbackField);
              const normalizedIsPersisted =
                typeof nextField.isPersisted === "boolean"
                  ? nextField.isPersisted
                  : normalizedStatus !== "draft";
              const normalizedStorageKey = createFormsPlaceholderStorageKey(
                typeof nextField.storageKey === "string" && nextField.storageKey.trim().length > 0
                  ? nextField.storageKey
                  : normalizedDisplayName,
                nextField.id ?? fallbackField.id,
              );
              const normalizedSemanticRole = isFieldSemanticRole(nextField.semanticRole)
                ? nextField.semanticRole
                : getDefaultFieldSemanticRole(fallbackField);

              return {
                ...fallbackField,
                ...nextField,
                autocomplete: normalizeOptionalString(nextField.autocomplete, fallbackField.autocomplete),
                choiceDisplay: normalizeChoiceDisplay(
                  nextField.choiceDisplay,
                  fallbackField.choiceDisplay,
                  normalizeStringList(nextField.options, fallbackField.options),
                ),
                defaultValueMode: nextField.defaultValueMode === "today" ? "today" : fallbackField.defaultValueMode,
                dependentFilter:
                  typeof nextField.dependentFilter === "string"
                    ? nextField.dependentFilter
                    : fallbackField.dependentFilter,
                displayName: normalizedDisplayName,
                displayFormat: normalizeOptionalString(nextField.displayFormat, fallbackField.displayFormat),
                displayFields: normalizeStringList(nextField.displayFields, fallbackField.displayFields),
                family: normalizedFamily,
                historicalUpdates:
                  typeof nextField.historicalUpdates === "boolean"
                    ? nextField.historicalUpdates
                    : fallbackField.historicalUpdates,
                inputMode: normalizeOptionalString(nextField.inputMode, fallbackField.inputMode),
                isPersisted: normalizedIsPersisted,
                isLocked: typeof nextField.isLocked === "boolean" ? nextField.isLocked : fallbackField.isLocked,
                kind: normalizedKind,
                lookupConfig: normalizeLookupConfig(nextField.lookupConfig, fallbackField.lookupConfig),
                mask: normalizeOptionalString(nextField.mask, fallbackField.mask),
                maxTags: typeof nextField.maxTags === "number" && Number.isFinite(nextField.maxTags)
                  ? nextField.maxTags
                  : fallbackField.maxTags,
                options: normalizeStringList(nextField.options, fallbackField.options),
                placeholder: normalizeOptionalString(nextField.placeholder, fallbackField.placeholder),
                preset: normalizedPreset,
                readonly: typeof nextField.readonly === "boolean" ? nextField.readonly : fallbackField.readonly,
                semanticRole: normalizedSemanticRole,
                selectionMode: isSelectionMode(nextField.selectionMode) ? nextField.selectionMode : fallbackField.selectionMode,
                schemaScopeKey: normalizeOptionalString(nextField.schemaScopeKey, fallbackField.schemaScopeKey),
                sourceFilters: normalizeStringList(nextField.sourceFilters, fallbackField.sourceFilters),
                sourceLabel:
                  typeof nextField.sourceLabel === "string" && nextField.sourceLabel.trim().length > 0
                    ? nextField.sourceLabel
                    : fallbackField.sourceLabel,
                status: normalizedStatus,
                storageKey: normalizedStorageKey,
                tagMode: isTagMode(nextField.tagMode) ? nextField.tagMode : fallbackField.tagMode,
                validation: isFieldValidation(nextField.validation) ? nextField.validation : fallbackField.validation,
              };
            }))
          : fallback.fields,
        modelStructureVersion: normalizedModelStructureVersion,
        owner: typeof candidate.owner === "string" && candidate.owner.trim() ? candidate.owner : fallback.owner,
        guid: normalizeOptionalGuid(typeof candidate.guid === "string" ? candidate.guid : undefined, fallback.guid),
        key: normalizeStableKey(
          typeof candidate.key === "string" ? candidate.key : undefined,
          fallback.key,
        ),
        schemaScopes: normalizeSchemaScopes(
          canonicalSchemaScopes ?? candidate.schemaScopes,
          fallback.schemaScopes,
        ),
        screens: normalizeStoredScreens(candidate.screens, fallback.screens).map((screen) => ({
          ...screen,
          lastAlignedModelStructureVersion:
            typeof screen.lastAlignedModelStructureVersion === "number" && screen.lastAlignedModelStructureVersion > 0
              ? screen.lastAlignedModelStructureVersion
              : normalizedModelStructureVersion,
        })),
        sourceType:
          typeof candidate.sourceType === "string" && candidate.sourceType.trim().length > 0
            ? candidate.sourceType.trim()
            : fallback.sourceType,
        version: normalizedVersion,
      };
    }),
  );
}

export function normalizeFormsPlaceholderModel(
  candidate: unknown,
  fallbackModel?: FormsPlaceholderObject,
) {
  const normalized = normalizeStoredObjects([candidate])[0];

  if (!fallbackModel) {
    return normalized;
  }

  return cloneFormsPlaceholderModel({
    ...fallbackModel,
    ...normalized,
    fields: normalized.fields,
    screens: normalized.screens.length > 0 ? normalized.screens : fallbackModel.screens,
  });
}

export function normalizeFormsPlaceholderView(
  candidate: unknown,
  fallbackView: FormsPlaceholderScreen,
  object?: Pick<FormsPlaceholderObject, "modelStructureVersion">,
) {
  const normalized = normalizeStoredScreens([candidate], [fallbackView])[0] ?? fallbackView;
  return cloneFormsPlaceholderView(normalized, object);
}

function readStoredFormsPlaceholderObjects() {
  if (typeof window === "undefined") {
    return [] as FormsPlaceholderObject[];
  }

  const storedValue = window.localStorage.getItem(formsPlaceholderStorageKey);
  if (!storedValue) {
    return [] as FormsPlaceholderObject[];
  }

  try {
    return normalizeStoredObjects(JSON.parse(storedValue));
  } catch {
    return [] as FormsPlaceholderObject[];
  }
}

function notifyFormsPlaceholderModelsCacheChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(formsPlaceholderStorageEvent));
}

export function getCachedFormsPlaceholderModels() {
  return readStoredFormsPlaceholderObjects();
}

export function storeFormsPlaceholderModels(models: ReadonlyArray<FormsPlaceholderModel>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    formsPlaceholderStorageKey,
    JSON.stringify(sortFormsPlaceholderObjects(models)),
  );
  notifyFormsPlaceholderModelsCacheChanged();
}

export function clearFormsPlaceholderModelsCache() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(formsPlaceholderStorageKey);
  notifyFormsPlaceholderModelsCacheChanged();
}

export function subscribeFormsPlaceholderModelsCache(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleCustomEvent() {
    onChange();
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === formsPlaceholderStorageKey) {
      onChange();
    }
  }

  window.addEventListener(formsPlaceholderStorageEvent, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(formsPlaceholderStorageEvent, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getFormsPlaceholderObjects() {
  if (typeof window === "undefined") {
    return [] as FormsPlaceholderObject[];
  }

  const storedObjects = readStoredFormsPlaceholderObjects();
  return storedObjects;
}

export function useFormsPlaceholderObjects() {
  const [objects, setObjects] = useState<FormsPlaceholderObject[]>(() => getFormsPlaceholderObjects());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(formsPlaceholderStorageKey, JSON.stringify(objects));
  }, [objects]);

  return [objects, setObjects] as const;
}

export const getFormsPlaceholderModels = getFormsPlaceholderObjects;
export const useFormsPlaceholderModels = useFormsPlaceholderObjects;

function matchesFormsPlaceholderId(
  candidate: Pick<FormsPlaceholderObject | FormsPlaceholderScreen, "id">,
  value: string,
) {
  const normalizedValue = value.trim();

  return normalizedValue.length > 0 && candidate.id === normalizedValue;
}

export function getFormsPlaceholderModelKey(model: Pick<FormsPlaceholderObject, "id" | "key">) {
  return model.key.trim() || model.id;
}

export function getFormsPlaceholderViewKey(view: Pick<FormsPlaceholderScreen, "id" | "key">) {
  return view.key.trim() || view.id;
}

export function getFormsPlaceholderObject(
  objectId: string | undefined,
  objects: ReadonlyArray<FormsPlaceholderObject> = getFormsPlaceholderObjects(),
) {
  if (!objectId) {
    return null;
  }

  return objects.find((object) => matchesFormsPlaceholderId(object, objectId)) ?? null;
}

export function getFormsPlaceholderModel(
  modelId: string | undefined,
  models: ReadonlyArray<FormsPlaceholderModel> = getFormsPlaceholderModels(),
) {
  return getFormsPlaceholderObject(modelId, models);
}

export function getFormsPlaceholderScreen(
  objectId: string | undefined,
  screenId: string | undefined,
  objects: ReadonlyArray<FormsPlaceholderObject> = getFormsPlaceholderObjects(),
) {
  return findFormsPlaceholderScreenById(getFormsPlaceholderObject(objectId, objects)?.screens ?? [], screenId);
}

export function getFormsPlaceholderView(
  modelId: string | undefined,
  viewId: string | undefined,
  models: ReadonlyArray<FormsPlaceholderModel> = getFormsPlaceholderModels(),
) {
  return getFormsPlaceholderScreen(modelId, viewId, models);
}

export function findFormsPlaceholderScreenById(
  screens: ReadonlyArray<FormsPlaceholderScreen>,
  screenId: string | undefined,
) {
  if (!screenId) {
    return null;
  }

  const normalizedScreenId = screenId.trim();
  if (!normalizedScreenId) {
    return null;
  }

  return screens.find((screen) => matchesFormsPlaceholderId(screen, normalizedScreenId)) ?? null;
}

export function getFormsPlaceholderFieldIconKey(field: FormsPlaceholderField) {
  if (field.preset === "email") {
    return "email";
  }

  if (field.preset === "phone") {
    return "phone";
  }

  if (field.preset === "url") {
    return "url";
  }

  if (field.preset === "tags") {
    return "tags";
  }

  if (field.preset === "suggest_text") {
    return "short_text";
  }

  if (field.preset === "contact_lookup" || field.preset === "company_lookup" || field.preset === "project_lookup") {
    return "db_lookup";
  }

  return field.kind;
}

export function getFormsPlaceholderFieldSearchText(field: FormsPlaceholderField) {
  return [
    field.label,
    field.displayName,
    field.family,
    field.kind.replaceAll("_", " "),
    field.preset?.replaceAll("_", " "),
    field.semanticRole,
    field.sourceLabel,
    field.status,
    field.storageKey,
    field.lookupConfig?.sourceModel,
    field.lookupConfig?.displayMode,
    field.lookupConfig?.displayTemplate,
    field.lookupConfig?.searchBehavior,
    field.lookupConfig?.searchFields?.join(" "),
    field.lookupConfig?.sortField,
    field.lookupConfig?.itemLabelFields?.join(" "),
    field.lookupConfig?.groupByField,
    field.lookupConfig?.storedTextFields?.join(" "),
    field.lookupConfig?.storedValueField,
    field.placeholder,
    field.inputMode,
    field.autocomplete,
    field.displayFormat,
    field.validation,
    field.mask,
    field.defaultValueMode,
    field.tagMode,
    typeof field.maxTags === "number" ? String(field.maxTags) : "",
    field.choiceDisplay?.renderStyle,
    field.choiceDisplay?.orientation,
    field.choiceDisplay?.optionStyles?.map((style) => style.option).join(" "),
    field.displayFields?.join(" "),
    field.sourceFilters?.join(" "),
    field.options?.join(" "),
    field.dependentFilter,
    field.historicalUpdates ? "history historical updates memo" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
