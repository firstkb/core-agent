import { describe, expect, it } from "vitest";

import type {
  FormsPlaceholderField,
  FormsPlaceholderModel,
} from "../forms-placeholder-data";
import { pruneLeakedChecklistRootFields } from "./form-builder-workspace-checklist-orphans";

function createModel(fields: ReadonlyArray<FormsPlaceholderField>): FormsPlaceholderModel {
  return {
    canEditViewsOnly: false,
    description: "",
    fields,
    id: "lookup",
    isStructureLocked: false,
    key: "lookup",
    owner: "tenant",
    schemaScopes: [
      {
        displayName: "Checklist",
        key: "pb_checklist_2",
        scopeType: "SUBFORM",
        subformType: "CHECKLIST",
      },
    ],
    screens: [],
    title: "LOOKUP",
  };
}

const leakedFields: ReadonlyArray<FormsPlaceholderField> = [
  {
    family: "choice",
    id: "item",
    isLocked: false,
    kind: "db_lookup",
    label: "Item",
    schemaScopeKey: "root",
    storageKey: "item",
  },
  {
    family: "choice",
    id: "result",
    isLocked: false,
    kind: "single_select",
    label: "Result",
    options: ["Yes", "No", "N/A"],
    schemaScopeKey: "root",
    storageKey: "result",
  },
  {
    family: "core",
    id: "notes",
    isLocked: false,
    kind: "long_text",
    label: "Notes",
    schemaScopeKey: "root",
    storageKey: "notes",
  },
];

const checklistScopedFields: ReadonlyArray<FormsPlaceholderField> = [
  {
    family: "choice",
    id: "item-2",
    isLocked: true,
    kind: "db_lookup",
    label: "Item",
    schemaScopeKey: "pb_checklist_2",
    storageKey: "item",
  },
  {
    family: "choice",
    id: "result-2",
    isLocked: true,
    kind: "single_select",
    label: "Result",
    options: ["Yes", "No", "N/A"],
    schemaScopeKey: "pb_checklist_2",
    storageKey: "result",
  },
  {
    family: "core",
    id: "notes-2",
    isLocked: true,
    kind: "long_text",
    label: "Notes",
    schemaScopeKey: "pb_checklist_2",
    storageKey: "notes",
  },
];

describe("pruneLeakedChecklistRootFields", () => {
  it("removes checklist managed fields that leaked into root unplaced fields", () => {
    const nextModel = pruneLeakedChecklistRootFields(
      createModel([...leakedFields, ...checklistScopedFields]),
      {
        rootScope: {
          unplacedFieldIds: ["item", "notes", "result"],
        },
      },
    );

    expect(nextModel.fields.map((field) => field.id)).toEqual(["item-2", "result-2", "notes-2"]);
  });

  it("keeps matching root fields when they are not root unplaced or no checklist scope exists", () => {
    const model = createModel([...leakedFields, ...checklistScopedFields]);
    const nextModel = pruneLeakedChecklistRootFields(model, {
      rootScope: {
        unplacedFieldIds: ["notes"],
      },
    });

    expect(nextModel.fields.map((field) => field.id)).toContain("item");
    expect(nextModel.fields.map((field) => field.id)).toContain("result");
    expect(nextModel.fields.map((field) => field.id)).not.toContain("notes");

    const withoutChecklistScope = pruneLeakedChecklistRootFields(
      {
        ...model,
        fields: leakedFields,
        schemaScopes: [],
      },
      {
        rootScope: {
          unplacedFieldIds: ["item", "notes", "result"],
        },
      },
    );

    expect(withoutChecklistScope.fields.map((field) => field.id)).toContain("item");
    expect(withoutChecklistScope.fields.map((field) => field.id)).toContain("result");
    expect(withoutChecklistScope.fields.map((field) => field.id)).toContain("notes");
  });
});
