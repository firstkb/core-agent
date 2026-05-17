import { describe, expect, it } from "vitest";

import type { RuntimeFormDefinition } from "@platform/forms";

import {
  collectRuntimeControlValueChanges,
  type RuntimeFormDomControl,
} from "./form-runtime-dom-sync";

const definition: RuntimeFormDefinition = {
  commitMode: "autosave",
  id: "test-form",
  mode: "edit",
  sections: [
    {
      id: "main",
      nodes: [
        {
          id: "step-title",
          label: "Step title",
          required: true,
          type: "short_text",
        },
        {
          id: "notes",
          label: "Notes",
          type: "long_text",
        },
        {
          disabled: true,
          id: "disabled-field",
          label: "Disabled",
          type: "short_text",
        },
      ],
      title: "Main",
    },
  ],
  title: "Test form",
};

function control(fieldId: string, value: string, overrides: Partial<RuntimeFormDomControl> = {}): RuntimeFormDomControl {
  return {
    dataset: {
      runtimeFieldId: fieldId,
    },
    value,
    ...overrides,
  };
}

describe("form runtime DOM sync", () => {
  it("collects uncommitted input and textarea values before submit validation", () => {
    expect(collectRuntimeControlValueChanges(definition, [
      control("step-title", "Typed title"),
      control("notes", "Updated notes"),
    ], {
      notes: "Initial notes",
    })).toEqual({
      notes: "Updated notes",
      "step-title": "Typed title",
    });
  });

  it("ignores unchanged, disabled, read-only, and unknown controls", () => {
    expect(collectRuntimeControlValueChanges(definition, [
      control("step-title", "Existing title"),
      control("notes", "Ignored read only", { readOnly: true }),
      control("disabled-field", "Ignored disabled field"),
      control("missing-field", "Ignored unknown field"),
      { dataset: {}, value: "Ignored without field id" },
    ], {
      "step-title": "Existing title",
    })).toEqual({});
  });
});
