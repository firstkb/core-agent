import { describe, expect, it } from "vitest";

import { createChecklistSubformDraftFields } from "./forms-builder-checklist";
import {
  createFormBuilderFieldFromDefinition,
  formBuilderFieldDefinitions,
} from "./forms-builder-library";

function getFieldDefinition(idBase: string) {
  const definition = formBuilderFieldDefinitions.find((item) => item.idBase === idBase);

  if (!definition) {
    throw new Error(`Missing Form Builder field definition ${idBase}.`);
  }

  return definition;
}

describe("Form Builder field library", () => {
  it("defaults new choice fields to horizontal orientation", () => {
    const singleSelect = createFormBuilderFieldFromDefinition(getFieldDefinition("single-select"), []);
    const multiSelect = createFormBuilderFieldFromDefinition(getFieldDefinition("multi-select"), []);

    expect(singleSelect.choiceDisplay?.orientation).toBe("horizontal");
    expect(multiSelect.choiceDisplay?.orientation).toBe("horizontal");
  });

  it("creates checklist subform draft fields with canonical bindings", () => {
    const checklist = createChecklistSubformDraftFields([], "pb_checklist");

    expect(checklist.fields.map((field) => field.id)).toEqual(["item", "result", "notes"]);
    expect(checklist.fields.every((field) => field.isLocked)).toBe(true);
    expect(checklist.lookupField.kind).toBe("db_lookup");
    expect(checklist.lookupField.schemaScopeKey).toBe("pb_checklist");
    expect(checklist.resultField.kind).toBe("single_select");
    expect(checklist.resultField.choiceDisplay?.renderStyle).toBe("buttons");
    expect(checklist.resultField.options).toEqual(["Yes", "No", "N/A"]);
    expect(checklist.config).toEqual({
      grouping: "flat",
      lookupFieldId: "item",
      notesFieldId: "notes",
      resultFieldId: "result",
    });
  });
});
