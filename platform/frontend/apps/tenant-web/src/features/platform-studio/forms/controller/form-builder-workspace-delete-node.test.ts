import { describe, expect, it } from "vitest";

import { getDeleteNodeConfirmationAction } from "./form-builder-workspace-delete-node";

describe("Form Builder delete node actions", () => {
  it("does not delete locked managed fields", () => {
    expect(getDeleteNodeConfirmationAction({
      isSelectedFieldLocked: true,
      isSelectedFieldPersisted: false,
      selectedField: { id: "notes" },
      selectedNode: { id: "field-notes", type: "field" },
    })).toEqual({ kind: "noop" });
  });

  it("deletes unlocked draft fields from model storage", () => {
    expect(getDeleteNodeConfirmationAction({
      isSelectedFieldLocked: false,
      isSelectedFieldPersisted: false,
      selectedField: { id: "draft" },
      selectedNode: { id: "field-draft", type: "field" },
    })).toEqual({
      fieldId: "draft",
      kind: "delete-unsaved-field",
      nodeId: "field-draft",
    });
  });
});
