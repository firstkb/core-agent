import { useEffect, useState } from "react";

import type {
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
  sourceModel?: string;
  storedValueField?: string;
};

export type FormsPlaceholderField = {
  autocomplete?: string;
  choiceDisplay?: FormsPlaceholderChoiceDisplay;
  defaultValueMode?: "today";
  dependentFilter?: string;
  displayFormat?: string;
  displayFields?: ReadonlyArray<string>;
  family: FormsPlaceholderFieldFamily;
  historicalUpdates?: boolean;
  id: string;
  inputMode?: string;
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
  selectionMode?: FormsPlaceholderSelectionMode;
  sourceFilters?: ReadonlyArray<string>;
  sourceLabel?: string;
  tagMode?: FormsPlaceholderTagMode;
  validation?: FormsPlaceholderFieldValidation;
};

export type FormsPlaceholderScreen = {
  description: string;
  id: string;
  isActive: boolean;
  kind: "detail" | "form";
  title: string;
};

export type FormsPlaceholderObject = {
  canEditViewsOnly: boolean;
  description: string;
  fields: ReadonlyArray<FormsPlaceholderField>;
  id: string;
  isStructureLocked: boolean;
  owner: string;
  screens: ReadonlyArray<FormsPlaceholderScreen>;
  title: string;
};

export type FormsPlaceholderView = FormsPlaceholderScreen;
export type FormsPlaceholderModel = FormsPlaceholderObject;

const formsPlaceholderStorageKey = "tenant-web-platform-studio-objects";
const formsTitleCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function cloneField(field: FormsPlaceholderField): FormsPlaceholderField {
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
    displayFields: field.displayFields ? [...field.displayFields] : undefined,
    lookupConfig: field.lookupConfig
      ? {
          ...field.lookupConfig,
          itemLabelFields: field.lookupConfig.itemLabelFields ? [...field.lookupConfig.itemLabelFields] : undefined,
          searchFields: field.lookupConfig.searchFields ? [...field.lookupConfig.searchFields] : undefined,
        }
      : undefined,
    options: field.options ? [...field.options] : undefined,
    selectionMode: field.selectionMode,
    sourceFilters: field.sourceFilters ? [...field.sourceFilters] : undefined,
  };
}

const defaultFormsPlaceholderObjects: ReadonlyArray<FormsPlaceholderObject> = [
  {
    canEditViewsOnly: true,
    description: "Customer onboarding structure with a locked identity core and multiple screen variants.",
    fields: [
      { family: "core", id: "customer-name", isLocked: true, kind: "short_text", label: "Customer name" },
      {
        family: "preset",
        id: "customer-email",
        isLocked: false,
        kind: "short_text",
        label: "Email",
        preset: "email",
      },
      {
        family: "core",
        historicalUpdates: true,
        id: "activity-notes",
        isLocked: false,
        kind: "long_text",
        label: "Activity notes",
      },
      {
        family: "preset",
        id: "account-tags",
        isLocked: false,
        kind: "multi_select",
        label: "Account tags",
        options: ["VIP", "Renewal", "Escalated"],
        preset: "tags",
      },
      {
        dependentFilter: "Limit by selected account team.",
        displayFields: ["Full name", "Email"],
        family: "preset",
        id: "assigned-owner",
        isLocked: false,
        kind: "db_lookup",
        label: "Assigned owner",
        preset: "contact_lookup",
        selectionMode: "single",
        sourceFilters: ["Only active users"],
        sourceLabel: "Users",
      },
      {
        family: "choice",
        id: "customer-status",
        isLocked: true,
        kind: "single_select",
        label: "Status",
        options: ["Draft", "Active", "Paused"],
      },
    ],
    id: "customer-profile",
    isStructureLocked: true,
    owner: "Schema Ops",
    screens: [
      {
        description: "Primary customer intake flow for onboarding and identity capture.",
        id: "intake-form",
        isActive: true,
        kind: "form",
        title: "Intake Form",
      },
      {
        description: "Condensed read-focused summary for customer profile review.",
        id: "detail-summary",
        isActive: false,
        kind: "detail",
        title: "Detail Summary",
      },
    ],
    title: "Customer Profile",
  },
  {
    canEditViewsOnly: false,
    description: "Field inspection structure kept editable while the route scaffold is being wired.",
    fields: [
      { family: "core", id: "site-name", isLocked: false, kind: "short_text", label: "Site name" },
      { family: "core", id: "audit-date", isLocked: false, kind: "date", label: "Audit date" },
      {
        family: "choice",
        id: "risk-tier",
        isLocked: false,
        kind: "single_select",
        label: "Risk tier",
        options: ["Low", "Medium", "High"],
      },
      {
        family: "preset",
        id: "follow-up-phone",
        isLocked: false,
        kind: "short_text",
        label: "Follow-up phone",
        preset: "phone",
      },
      {
        family: "core",
        id: "last-reviewed-at",
        isLocked: false,
        kind: "date_time",
        label: "Last reviewed at",
      },
      {
        family: "core",
        id: "estimated-loss",
        isLocked: false,
        kind: "currency",
        label: "Estimated loss",
      },
      {
        family: "core",
        id: "needs-follow-up",
        isLocked: false,
        kind: "boolean",
        label: "Needs follow-up",
      },
    ],
    id: "site-audit",
    isStructureLocked: false,
    owner: "Operations QA",
    screens: [
      {
        description: "Operational checklist used during live field inspections.",
        id: "field-checklist",
        isActive: true,
        kind: "form",
        title: "Field Checklist",
      },
      {
        description: "Read-only inspection recap for supervisors and follow-up review.",
        id: "inspection-summary",
        isActive: false,
        kind: "detail",
        title: "Inspection Summary",
      },
    ],
    title: "Site Audit",
  },
];

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

function cloneDefaultObjects() {
  return sortFormsPlaceholderObjects(
    defaultFormsPlaceholderObjects.map((object) => ({
      ...object,
      fields: object.fields.map(cloneField),
      screens: object.screens.map((screen) => ({ ...screen })),
    })),
  );
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
    value === "company_lookup" ||
    value === "contact_lookup" ||
    value === "date_today" ||
    value === "email" ||
    value === "phone" ||
    value === "project_lookup" ||
    value === "radio_group" ||
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
    sourceModel: normalizeOptionalString(candidate.sourceModel, fallback?.sourceModel),
    storedValueField: normalizeOptionalString(candidate.storedValueField, fallback?.storedValueField),
  };
}

function normalizeStoredScreens(value: unknown, fallbackScreens: ReadonlyArray<FormsPlaceholderScreen>) {
  if (!Array.isArray(value)) {
    return sortFormsPlaceholderScreens(fallbackScreens.map((screen) => ({ ...screen })));
  }

  return sortFormsPlaceholderScreens(
    value.map((entry, index) => {
      const candidate = typeof entry === "object" && entry ? entry as Partial<FormsPlaceholderScreen> : {};
      const fallback =
        fallbackScreens.find((screen) => screen.id === candidate.id) ??
        fallbackScreens[index] ??
        fallbackScreens[0];

      return {
        ...fallback,
        ...candidate,
        description:
          typeof candidate.description === "string"
            ? candidate.description
            : fallback.description,
        isActive: typeof candidate.isActive === "boolean" ? candidate.isActive : fallback.isActive,
      };
    }),
  );
}

function normalizeStoredObjects(value: unknown) {
  if (!Array.isArray(value)) {
    return cloneDefaultObjects();
  }

  const defaults = cloneDefaultObjects();

  return sortFormsPlaceholderObjects(
    value.map((entry, index) => {
      const candidate = typeof entry === "object" && entry ? entry as Partial<FormsPlaceholderObject> : {};
      const fallback = defaults.find((item) => item.id === candidate.id) ?? defaults[index] ?? defaults[0];

      return {
        ...fallback,
        ...candidate,
        fields: Array.isArray(candidate.fields)
          ? candidate.fields.map((field, fieldIndex) => {
              const nextField =
                typeof field === "object" && field
                  ? field as Partial<FormsPlaceholderField>
                  : {};
              const fallbackField = fallback.fields.find((item) => item.id === nextField.id) ?? fallback.fields[fieldIndex];
              const rawKind = typeof (nextField as { kind?: unknown }).kind === "string"
                ? (nextField as { kind?: string }).kind
                : undefined;
              const normalizedKind = migrateLegacyFieldKind(rawKind, fallbackField.kind);
              const normalizedPreset = migrateLegacyFieldPreset(rawKind, nextField.preset, fallbackField.preset);
              const normalizedFamily = normalizedPreset
                ? "preset"
                : (isFieldFamily(nextField.family) ? nextField.family : fallbackField.family);

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
                displayFormat: normalizeOptionalString(nextField.displayFormat, fallbackField.displayFormat),
                displayFields: normalizeStringList(nextField.displayFields, fallbackField.displayFields),
                family: normalizedFamily,
                historicalUpdates:
                  typeof nextField.historicalUpdates === "boolean"
                    ? nextField.historicalUpdates
                    : fallbackField.historicalUpdates,
                inputMode: normalizeOptionalString(nextField.inputMode, fallbackField.inputMode),
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
                selectionMode: isSelectionMode(nextField.selectionMode) ? nextField.selectionMode : fallbackField.selectionMode,
                sourceFilters: normalizeStringList(nextField.sourceFilters, fallbackField.sourceFilters),
                sourceLabel:
                  typeof nextField.sourceLabel === "string" && nextField.sourceLabel.trim().length > 0
                    ? nextField.sourceLabel
                    : fallbackField.sourceLabel,
                tagMode: isTagMode(nextField.tagMode) ? nextField.tagMode : fallbackField.tagMode,
                validation: isFieldValidation(nextField.validation) ? nextField.validation : fallbackField.validation,
              };
            })
          : fallback.fields,
        owner: typeof candidate.owner === "string" && candidate.owner.trim() ? candidate.owner : fallback.owner,
        screens: normalizeStoredScreens(candidate.screens, fallback.screens),
      };
    }),
  );
}

export function getFormsPlaceholderObjects() {
  if (typeof window === "undefined") {
    return cloneDefaultObjects();
  }

  const storedValue = window.localStorage.getItem(formsPlaceholderStorageKey);
  if (!storedValue) {
    return cloneDefaultObjects();
  }

  try {
    return normalizeStoredObjects(JSON.parse(storedValue));
  } catch {
    return cloneDefaultObjects();
  }
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

export function getFormsPlaceholderObject(
  objectId: string | undefined,
  objects: ReadonlyArray<FormsPlaceholderObject> = getFormsPlaceholderObjects(),
) {
  if (!objectId) {
    return null;
  }

  return objects.find((object) => object.id === objectId) ?? null;
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
  if (!screenId) {
    return null;
  }

  return getFormsPlaceholderObject(objectId, objects)?.screens.find((screen) => screen.id === screenId) ?? null;
}

export function getFormsPlaceholderView(
  modelId: string | undefined,
  viewId: string | undefined,
  models: ReadonlyArray<FormsPlaceholderModel> = getFormsPlaceholderModels(),
) {
  return getFormsPlaceholderScreen(modelId, viewId, models);
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

  if (field.preset === "contact_lookup" || field.preset === "company_lookup" || field.preset === "project_lookup") {
    return "db_lookup";
  }

  return field.kind;
}

export function getFormsPlaceholderFieldSearchText(field: FormsPlaceholderField) {
  return [
    field.label,
    field.family,
    field.kind.replaceAll("_", " "),
    field.preset?.replaceAll("_", " "),
    field.sourceLabel,
    field.lookupConfig?.sourceModel,
    field.lookupConfig?.displayMode,
    field.lookupConfig?.displayTemplate,
    field.lookupConfig?.searchBehavior,
    field.lookupConfig?.searchFields?.join(" "),
    field.lookupConfig?.itemLabelFields?.join(" "),
    field.lookupConfig?.groupByField,
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
