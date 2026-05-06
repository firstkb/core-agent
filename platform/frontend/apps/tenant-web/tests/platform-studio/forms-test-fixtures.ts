import { vi } from "vitest";

import type { FormsPlaceholderObject } from "../../src/features/platform-studio/forms/forms-placeholder-data";

const formsPlaceholderStorageKey = "tenant-web-platform-studio-objects";

export const editableFormBuilderModel: FormsPlaceholderObject = {
  canEditViewsOnly: false,
  description: "Editable model fixture for Form Builder tests.",
  displayName: "Site Audit",
  fields: [
    {
      family: "core",
      id: "site-name",
      isLocked: false,
      kind: "short_text",
      label: "Site name",
    },
    {
      family: "core",
      id: "inspection-date",
      isLocked: false,
      kind: "date",
      label: "Inspection date",
    },
  ],
  id: "site-audit",
  isStructureLocked: false,
  key: "site-audit",
  modelStructureVersion: 1,
  owner: "owner",
  screens: [
    {
      description: "Editable checklist fixture.",
      id: "field-checklist",
      isDefault: true,
      key: "field-checklist",
      kind: "form",
      title: "Field Checklist",
      viewVersion: 1,
    },
  ],
  title: "Site Audit",
  version: 1,
};

export const lockedDelegatedFormBuilderModel: FormsPlaceholderObject = {
  canEditViewsOnly: true,
  description: "Locked model fixture with delegated view editing.",
  displayName: "Customer Profile",
  fields: [
    {
      family: "core",
      id: "customer-name",
      isLocked: true,
      kind: "short_text",
      label: "Customer name",
    },
    {
      family: "preset",
      id: "customer-email",
      isLocked: true,
      kind: "short_text",
      label: "Customer email",
      preset: "email",
    },
  ],
  id: "customer-profile",
  isStructureLocked: true,
  key: "customer-profile",
  modelStructureVersion: 1,
  owner: "owner",
  screens: [
    {
      description: "Intake form fixture.",
      id: "intake-form",
      isDefault: true,
      key: "intake-form",
      kind: "form",
      title: "Intake Form",
      viewVersion: 1,
    },
  ],
  title: "Customer Profile",
  version: 1,
};

export const formBuilderTestModels = [
  editableFormBuilderModel,
  lockedDelegatedFormBuilderModel,
] as const;

export function installFormsPlaceholderStorage(
  models: ReadonlyArray<FormsPlaceholderObject> = formBuilderTestModels,
) {
  const storage = new Map<string, string>([
    [formsPlaceholderStorageKey, JSON.stringify(models)],
  ]);

  vi.stubGlobal("window", {
    addEventListener() {},
    dispatchEvent() {
      return true;
    },
    localStorage: {
      clear() {
        storage.clear();
      },
      getItem(key: string) {
        return storage.has(key) ? storage.get(key) ?? null : null;
      },
      removeItem(key: string) {
        storage.delete(key);
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
      },
    },
    removeEventListener() {},
  });

  return storage;
}
