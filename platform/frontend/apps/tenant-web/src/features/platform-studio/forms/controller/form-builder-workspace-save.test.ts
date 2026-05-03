import { describe, expect, it } from "vitest";

import {
  normalizeFormBuilderDocument,
  setFormBuilderCurrentParent,
  selectFormBuilderNode,
  type FormBuilderDocument,
} from "../forms-builder-state";
import type {
  FormsPlaceholderField,
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "../forms-placeholder-data";
import {
  preserveFormBuilderWorkspaceNavigation,
} from "./form-builder-workspace-navigation";
import {
  resolveHydratedDraftDocuments,
} from "./use-form-builder-draft-hydration";

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
  isActive: true,
  isDefault: true,
  key: "default",
  kind: "form",
  title: "Default",
};

const model: FormsPlaceholderObject = {
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

function createSubformDocument() {
  return normalizeFormBuilderDocument(
    {
      filterDefinitions: {},
      nodes: [
        {
          id: "subform-notes",
          order: 0,
          parentId: null,
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
      subformScopes: [
        {
          dataSchema: { fieldIds: ["note"] },
          parentSubformNodeId: "subform-notes",
          scopeId: "subform-notes",
          scopeType: "SUBFORM",
          subformType: "DEFAULT",
          tableKey: "pb_notes",
          uiSchema: {
            currentParentId: null,
            nodes: [],
            selectedNodeId: null,
            unplacedFieldIds: [],
          },
          viewSettings: {
            actions: {
              canAdd: true,
              canDelete: true,
              canEdit: true,
            },
            list: {
              columns: [],
              sorting: {
                direction: "asc",
              },
            },
          },
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
}

function resetWorkspaceNavigation(document: FormBuilderDocument): FormBuilderDocument {
  return {
    ...document,
    activeScopeId: "root",
    rootScope: {
      ...document.rootScope,
      uiSchema: {
        ...document.rootScope.uiSchema,
        currentParentId: null,
        selectedNodeId: null,
      },
    },
    subformScopes: document.subformScopes.map((scope) => ({
      ...scope,
      uiSchema: {
        ...scope.uiSchema,
        currentParentId: null,
        selectedNodeId: null,
      },
    })),
  };
}

describe("Form Builder workspace save behavior", () => {
  it("preserves subform canvas context after save hydration", () => {
    const document = createSubformDocument();
    const previousDocument = selectFormBuilderNode(
      setFormBuilderCurrentParent(document, "subform-notes"),
      "field-note",
    );
    const savedDocument = resetWorkspaceNavigation(document);

    const restoredDocument = preserveFormBuilderWorkspaceNavigation(savedDocument, previousDocument);

    expect(restoredDocument.activeScopeId).toBe("subform-notes");
    expect(restoredDocument.subformScopes[0]?.uiSchema.currentParentId).toBeNull();
    expect(restoredDocument.subformScopes[0]?.uiSchema.selectedNodeId).toBe("field-note");
    expect(restoredDocument.currentParentId).toBe("subform-notes");
    expect(restoredDocument.selectedNodeId).toBe("field-note");
  });

  it("keeps reconciled drift as working document while retaining server baseline", () => {
    const serverDocument = createSubformDocument();
    const reconciledDocument = {
      ...serverDocument,
      viewDescription: "Reconciled with new Default View field",
    };

    const result = resolveHydratedDraftDocuments(serverDocument, reconciledDocument);

    expect(result.hasReconciledChanges).toBe(true);
    expect(result.baselineDocument).toBe(reconciledDocument);
    expect(result.savedDocument).toBe(serverDocument);
  });
});
