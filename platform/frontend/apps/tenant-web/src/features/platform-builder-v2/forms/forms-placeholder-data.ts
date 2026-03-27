import { useEffect, useState } from "react";

export type FormsPlaceholderField = {
  kind: "checkbox" | "date" | "email" | "number" | "select" | "status" | "text";
  id: string;
  isLocked: boolean;
  label: string;
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

const defaultFormsPlaceholderObjects: ReadonlyArray<FormsPlaceholderObject> = [
  {
    canEditScreensOnly: true,
    description: "Customer onboarding structure with a locked identity core and multiple screen variants.",
    fields: [
      { id: "customer-name", isLocked: true, kind: "text", label: "Customer name" },
      { id: "customer-email", isLocked: false, kind: "email", label: "Email" },
      { id: "customer-status", isLocked: true, kind: "select", label: "Status" },
      { id: "assigned-owner", isLocked: false, kind: "text", label: "Owner" },
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
      { id: "site-name", isLocked: false, kind: "text", label: "Site name" },
      { id: "audit-date", isLocked: false, kind: "date", label: "Audit date" },
      { id: "risk-tier", isLocked: false, kind: "select", label: "Risk tier" },
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
      fields: object.fields.map((field) => ({ ...field })),
      screens: object.screens.map((screen) => ({ ...screen })),
    })),
  );
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
                kind: nextField.kind ?? fallbackField.kind,
                isLocked: typeof nextField.isLocked === "boolean" ? nextField.isLocked : fallbackField.isLocked,
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
