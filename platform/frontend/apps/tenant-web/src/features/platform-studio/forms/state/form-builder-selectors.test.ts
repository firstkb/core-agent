import { describe, expect, it } from "vitest";

import {
  getFormBuilderBreadcrumb,
  normalizeFormBuilderDocument,
  setFormBuilderCurrentParent,
} from "../forms-builder-state";
import type {
  FormsPlaceholderField,
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "../forms-placeholder-data";

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
      createField("question", "Question", { schemaScopeKey: "pb_checklist" }),
    ],
    id: "inspection",
    isStructureLocked: false,
    key: "inspection",
    owner: "tenant",
    schemaScopes: [
      {
        displayName: "Checklist",
        key: "pb_checklist",
        scopeType: "SUBFORM",
        subformType: "CHECKLIST",
      },
    ],
    screens: [screen],
    title: "Inspection",
  };
}

describe("Form Builder selectors", () => {
  it("keeps root container ancestors in the breadcrumb when a nested subform is open", () => {
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
            id: "group-safety",
            order: 0,
            parentId: "section-main",
            title: "Safety",
            type: "group",
            visibility: "visible",
          },
          {
            id: "subform-checklist",
            order: 0,
            parentId: "group-safety",
            schemaScopeId: "pb_checklist",
            subformType: "CHECKLIST",
            tableKey: "pb_checklist",
            title: "Checklist",
            type: "subform",
            visibility: "visible",
          },
          {
            fieldId: "question",
            id: "field-question",
            order: 0,
            parentId: "subform-checklist",
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
      createModel(),
      screen,
    );

    const openSubformDocument = setFormBuilderCurrentParent(document, "subform-checklist");

    expect(getFormBuilderBreadcrumb(openSubformDocument).map((node) => node.id)).toEqual([
      "section-main",
      "group-safety",
      "subform-checklist",
    ]);
  });
});
