import { describe, expect, it } from "vitest";

import {
  normalizeFormBuilderDocument,
} from "../forms-builder-state";
import type {
  FormsPlaceholderField,
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "../forms-placeholder-data";
import { removeFormBuilderSubformFromDocumentAndModel } from "./form-builder-workspace-delete-subform";

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

const screen: FormsPlaceholderScreen = {
  description: "",
  id: "view-default",
  isDefault: true,
  key: "default",
  kind: "form",
  title: "Default",
};

function createModel(): FormsPlaceholderObject {
  return {
    canEditViewsOnly: false,
    description: "",
    fields: [
      createField("site_name", "Site name"),
      createField("note", "Note", { schemaScopeKey: "pb_notes" }),
    ],
    id: "inspection",
    isStructureLocked: false,
    key: "inspection",
    owner: "tenant",
    schemaScopes: [
      {
        displayName: "Notes",
        key: "pb_notes",
        scopeType: "SUBFORM",
        subformType: "DEFAULT",
      },
    ],
    screens: [screen],
    title: "Inspection",
  };
}

describe("Form Builder subform deletion", () => {
  it("removes the subform scope and scoped fields from the model draft", () => {
    const model = createModel();
    const document = normalizeFormBuilderDocument(
      {
        filterDefinitions: {},
        nodes: [
          {
            id: "section-main",
            order: 0,
            parentId: null,
            title: "Main",
            type: "section",
            visibility: "visible",
          },
          {
            id: "subform-notes",
            order: 0,
            parentId: "section-main",
            schemaScopeId: "pb_notes",
            subformType: "DEFAULT",
            tableKey: "pb_notes",
            title: "Notes",
            type: "subform",
            visibility: "visible",
          },
          {
            fieldId: "note",
            id: "field-note",
            order: 0,
            parentId: "subform-notes",
            type: "field",
            visibility: "visible",
          },
        ],
        systemFields: {},
        viewDescription: "",
        viewKind: "form",
        viewSettings: { list: { columns: [] } },
        viewTitle: "Default",
      },
      model,
      screen,
    );
    const subformNode = document.rootScope.uiSchema.nodes.find((node) => node.id === "subform-notes");

    if (!subformNode) {
      throw new Error("Expected subform node");
    }

    const nextState = removeFormBuilderSubformFromDocumentAndModel({
      document,
      model,
      node: subformNode,
      view: screen,
    });

    expect(nextState.model.fields.map((field) => field.id)).toEqual(["site_name"]);
    expect(nextState.model.schemaScopes).toEqual([]);
    expect(nextState.document.rootScope.uiSchema.nodes.map((node) => node.id)).toEqual(["section-main"]);
    expect(nextState.document.subformScopes).toEqual([]);
    expect(nextState.document.rootScope.uiSchema.unplacedFieldIds).not.toContain("note");
  });
});
