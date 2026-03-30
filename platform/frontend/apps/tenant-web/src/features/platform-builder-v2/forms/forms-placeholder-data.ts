import { useEffect, useState } from "react";

export type FormsPlaceholderFieldFamily = "advanced" | "choice" | "core" | "preset";
export type FormsPlaceholderFieldKind =
  | "boolean"
  | "currency"
  | "date"
  | "date_time"
  | "db_lookup"
  | "long_text"
  | "multi_select"
  | "number"
  | "single_select"
  | "status"
  | "text";
export type FormsPlaceholderFieldPreset = "email" | "phone" | "tags" | "url";

export type FormsPlaceholderField = {
  dependentFilter?: string;
  displayFields?: ReadonlyArray<string>;
  family: FormsPlaceholderFieldFamily;
  historicalUpdates?: boolean;
  id: string;
  isLocked: boolean;
  kind: FormsPlaceholderFieldKind;
  label: string;
  options?: ReadonlyArray<string>;
  preset?: FormsPlaceholderFieldPreset;
  sourceFilters?: ReadonlyArray<string>;
  sourceLabel?: string;
};

export type FormsPlaceholderScreen = {
  description: string;
  id: string;
  isActive: boolean;
  kind: "detail" | "form";
  title: string;
};

export type FormsPlaceholderObject = {
  canEditScreensOnly: boolean;
  description: string;
  fields: ReadonlyArray<FormsPlaceholderField>;
  id: string;
  isStructureLocked: boolean;
  owner: string;
  screens: ReadonlyArray<FormsPlaceholderScreen>;
  title: string;
};

const formsPlaceholderStorageKey = "tenant-web-platform-builder-v2-objects";
const formsTitleCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function cloneField(field: FormsPlaceholderField): FormsPlaceholderField {
  return {
    ...field,
    displayFields: field.displayFields ? [...field.displayFields] : undefined,
    options: field.options ? [...field.options] : undefined,
    sourceFilters: field.sourceFilters ? [...field.sourceFilters] : undefined,
  };
}

const defaultFormsPlaceholderObjects: ReadonlyArray<FormsPlaceholderObject> = [
  {
    canEditScreensOnly: true,
    description: "Customer onboarding structure with a locked identity core and multiple screen variants.",
    fields: [
      { family: "core", id: "customer-name", isLocked: true, kind: "text", label: "Customer name" },
      {
        family: "preset",
        id: "customer-email",
        isLocked: false,
        kind: "text",
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
        family: "choice",
        id: "assigned-owner",
        isLocked: false,
        kind: "db_lookup",
        label: "Assigned owner",
        sourceFilters: ["Only active users"],
        sourceLabel: "Users",
      },
      {
        family: "advanced",
        id: "customer-status",
        isLocked: true,
        kind: "status",
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
    canEditScreensOnly: false,
    description: "Field inspection structure kept editable while the route scaffold is being wired.",
    fields: [
      { family: "core", id: "site-name", isLocked: false, kind: "text", label: "Site name" },
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
        kind: "text",
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
    value === "boolean" ||
    value === "currency" ||
    value === "date" ||
    value === "date_time" ||
    value === "db_lookup" ||
    value === "long_text" ||
    value === "multi_select" ||
    value === "number" ||
    value === "single_select" ||
    value === "status" ||
    value === "text"
  );
}

function isFieldPreset(value: unknown): value is FormsPlaceholderFieldPreset {
  return value === "email" || value === "phone" || value === "tags" || value === "url";
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

              return {
                ...fallbackField,
                ...nextField,
                dependentFilter:
                  typeof nextField.dependentFilter === "string"
                    ? nextField.dependentFilter
                    : fallbackField.dependentFilter,
                displayFields: normalizeStringList(nextField.displayFields, fallbackField.displayFields),
                family: isFieldFamily(nextField.family) ? nextField.family : fallbackField.family,
                historicalUpdates:
                  typeof nextField.historicalUpdates === "boolean"
                    ? nextField.historicalUpdates
                    : fallbackField.historicalUpdates,
                isLocked: typeof nextField.isLocked === "boolean" ? nextField.isLocked : fallbackField.isLocked,
                kind: isFieldKind(nextField.kind) ? nextField.kind : fallbackField.kind,
                options: normalizeStringList(nextField.options, fallbackField.options),
                preset: isFieldPreset(nextField.preset) ? nextField.preset : fallbackField.preset,
                sourceFilters: normalizeStringList(nextField.sourceFilters, fallbackField.sourceFilters),
                sourceLabel:
                  typeof nextField.sourceLabel === "string" && nextField.sourceLabel.trim().length > 0
                    ? nextField.sourceLabel
                    : fallbackField.sourceLabel,
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

export function getFormsPlaceholderObject(
  objectId: string | undefined,
  objects: ReadonlyArray<FormsPlaceholderObject> = getFormsPlaceholderObjects(),
) {
  if (!objectId) {
    return null;
  }

  return objects.find((object) => object.id === objectId) ?? null;
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

  return field.kind;
}

export function getFormsPlaceholderFieldSearchText(field: FormsPlaceholderField) {
  return [
    field.label,
    field.family,
    field.kind.replaceAll("_", " "),
    field.preset?.replaceAll("_", " "),
    field.sourceLabel,
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
