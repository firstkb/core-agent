import { describe, expect, it } from "vitest";

import type {
  FormBuilderDocument,
  FormBuilderWorkspaceAccess,
} from "../forms-builder-state";
import {
  getElementPaletteItems,
  getFieldPaletteItems,
} from "./form-builder-palette-selectors";
import { createDefaultFilterDefinitions } from "./form-builder-filter-normalization";
import { createDefaultSystemFields } from "./form-builder-system-field-normalization";
import {
  createDefaultSubformViewSettings,
  createDefaultViewSettings,
} from "./form-builder-view-normalization";

const access: FormBuilderWorkspaceAccess = {
  canAddElementItems: true,
  canAddFieldItems: true,
  canEditSettings: true,
  canMoveItems: true,
  canRemoveItems: true,
  lockReasonKey: null,
  structureLockReasonKey: null,
};

function createChecklistDocument(): FormBuilderDocument {
  return {
    activeScopeId: "subform-checklist",
    currentParentId: "subform-checklist",
    filterDefinitions: createDefaultFilterDefinitions(),
    nodes: [],
    rootScope: {
      dataSchema: {
        fieldIds: [],
      },
      scopeId: "root",
      scopeType: "ROOT",
      uiSchema: {
        currentParentId: null,
        nodes: [
          {
            id: "subform-checklist",
            order: 0,
            parentId: null,
            subformType: "CHECKLIST",
            title: "Checklist",
            type: "subform",
            visibility: "visible",
          },
        ],
        selectedNodeId: "subform-checklist",
        unplacedFieldIds: [],
      },
    },
    selectedNodeId: null,
    subformScopes: [
      {
        dataSchema: {
          fieldIds: [],
        },
        filterDefinitions: createDefaultFilterDefinitions(),
        parentSubformNodeId: "subform-checklist",
        scopeId: "subform-checklist",
        scopeType: "SUBFORM",
        subformType: "CHECKLIST",
        tableKey: "pb_checklist",
        uiSchema: {
          currentParentId: null,
          nodes: [],
          selectedNodeId: null,
          unplacedFieldIds: [],
        },
        viewSettings: createDefaultSubformViewSettings(),
      },
    ],
    systemFields: createDefaultSystemFields(),
    viewDescription: "",
    viewKind: "form",
    viewSettings: createDefaultViewSettings(),
    viewTitle: "Default",
  };
}

describe("Form Builder palette selectors", () => {
  it("limits the checklist scope palette to simple checklist-safe items", () => {
    const document = createChecklistDocument();

    expect(getElementPaletteItems(document, access, "").map((item) => item.nodeType)).toEqual([
      "heading",
      "text",
    ]);
    expect(getFieldPaletteItems(document, access, "").map((item) => item.definition.idBase)).toEqual([
      "short-text",
      "date",
      "single-select",
    ]);
  });
});
