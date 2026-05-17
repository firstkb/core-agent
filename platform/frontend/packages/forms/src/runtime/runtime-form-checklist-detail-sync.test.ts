import {
  describe,
  expect,
  it,
} from "vitest";

import {
  collectRuntimeChecklistDetailChanges,
  hasRuntimeChecklistDetailChanges,
} from "./runtime-form-checklist-detail-sync";

describe("runtime checklist detail sync", () => {
  it("collects changed checklist note control values", () => {
    const change = collectRuntimeChecklistDetailChanges([
      {
        dataset: {
          runtimeFieldId: "notes",
        },
        value: "Needs follow-up.",
      },
    ], {
      notes: "Old note.",
    }, "notes");

    expect(change).toEqual({
      notes: "Needs follow-up.",
      values: {
        notes: "Needs follow-up.",
      },
    });
    expect(hasRuntimeChecklistDetailChanges(change)).toBe(true);
  });

  it("ignores unchanged, disabled, readonly, and unknown controls", () => {
    const change = collectRuntimeChecklistDetailChanges([
      {
        dataset: {
          runtimeFieldId: "notes",
        },
        value: "Same note.",
      },
      {
        dataset: {
          runtimeFieldId: "disabled",
        },
        disabled: true,
        value: "Ignored",
      },
      {
        dataset: {
          runtimeFieldId: "readonly",
        },
        readOnly: true,
        value: "Ignored",
      },
      {
        dataset: {},
        value: "Ignored",
      },
    ], {
      notes: "Same note.",
    }, "notes");

    expect(change).toEqual({});
    expect(hasRuntimeChecklistDetailChanges(change)).toBe(false);
  });
});
