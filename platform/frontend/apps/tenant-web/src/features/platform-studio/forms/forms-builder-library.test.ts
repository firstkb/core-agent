import { describe, expect, it } from "vitest";

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
});
