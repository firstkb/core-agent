import { describe, expect, it } from "vitest";

import type { FormsPlaceholderField } from "../forms-placeholder-data";
import { getViewFilterBaseFields } from "./form-builder-workspace-lookup-derived-outputs";

function createField(
  id: string,
  label: string,
  overrides: Partial<FormsPlaceholderField> = {},
): FormsPlaceholderField {
  return {
    family: "core",
    id,
    isLocked: false,
    kind: "short_text",
    label,
    ...overrides,
  };
}

describe("Form Builder lookup derived outputs", () => {
  it("excludes multiple lookup fields from View filter targets", () => {
    expect(getViewFilterBaseFields([
      createField("contact", "Contact", {
        family: "preset",
        kind: "db_lookup",
        preset: "contact_lookup",
        selectionMode: "single",
      }),
      createField("contacts", "Contacts", {
        family: "preset",
        kind: "db_lookup",
        preset: "contact_lookup",
        selectionMode: "multiple",
      }),
      createField("status", "Status", {
        family: "choice",
        kind: "single_select",
      }),
    ]).map((field) => field.id)).toEqual(["contact", "status"]);
  });
});
