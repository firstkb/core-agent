import { describe, expect, it } from "vitest";

import {
  cloneFormsPlaceholderModel,
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";
import { buildCanonicalDataSchema } from "./form-builder-workspace-data-schema";
import {
  supportsUniqueValue,
} from "./form-builder-workspace-selected-field-settings-handlers";

function createTextField(
  id: string,
  overrides: Partial<FormsPlaceholderField> = {},
): FormsPlaceholderField {
  return {
    family: "core",
    id,
    isLocked: false,
    kind: "short_text",
    label: id,
    ...overrides,
  };
}

function createModel(fields: ReadonlyArray<FormsPlaceholderField>): FormsPlaceholderModel {
  return {
    canEditViewsOnly: false,
    description: "",
    fields,
    id: "users",
    isStructureLocked: false,
    key: "users",
    owner: "tenant",
    screens: [],
    title: "Users",
  };
}

describe("Form Builder unique text values", () => {
  it("supports unique values for email and phone text fields only", () => {
    expect(supportsUniqueValue(createTextField("email", { preset: "email", validation: "email" }))).toBe(true);
    expect(supportsUniqueValue(createTextField("phone", { preset: "phone", validation: "phone" }))).toBe(true);
    expect(supportsUniqueValue(createTextField("short-email", { validation: "email" }))).toBe(true);
    expect(supportsUniqueValue(createTextField("short-phone", { validation: "phone" }))).toBe(true);
    expect(supportsUniqueValue(createTextField("name"))).toBe(false);
    expect(supportsUniqueValue(createTextField("url", { preset: "url", validation: "url" }))).toBe(false);
  });

  it("keeps uniqueValue true through model clone and omits disabled values from canonical schema", () => {
    const model = cloneFormsPlaceholderModel(createModel([
      createTextField("email", {
        autocomplete: "email",
        preset: "email",
        uniqueValue: true,
        validation: "email",
      }),
      createTextField("phone", {
        autocomplete: "tel",
        preset: "phone",
        validation: "phone",
      }),
    ]));

    const dataSchema = buildCanonicalDataSchema(model);
    const rootFields = dataSchema.rootScope.fields as ReadonlyArray<Record<string, unknown>>;

    expect(model.fields[0]?.uniqueValue).toBe(true);
    expect(rootFields.find((field) => field.id === "email")?.uniqueValue).toBe(true);
    expect(rootFields.find((field) => field.id === "phone")?.uniqueValue).toBeUndefined();
  });
});
