import { describe, expect, it } from "vitest";

import type {
  FormBuilderDocument,
} from "../forms-builder-state";
import type {
  FormsPlaceholderField,
  FormsPlaceholderModel,
} from "../forms-placeholder-data";
import {
  buildDataSchemaStructureSignature,
  getCanvasAttentionNodeIds,
} from "./form-builder-workspace-diff-helpers";

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

function createModel(fields: ReadonlyArray<FormsPlaceholderField>): FormsPlaceholderModel {
  return {
    canEditViewsOnly: false,
    description: "",
    fields,
    id: "inspection",
    isStructureLocked: false,
    key: "inspection",
    owner: "tenant",
    screens: [],
    title: "Inspection",
  };
}

function createFilterDefinitions() {
  return {
    defaultFilters: {
      conditions: [],
      logic: "and" as const,
    },
    quickFilters: [],
    version: 1 as const,
  };
}

function createDocument(): FormBuilderDocument {
  return {
    activeScopeId: "root",
    currentParentId: null,
    filterDefinitions: createFilterDefinitions(),
    nodes: [],
    rootScope: {
      dataSchema: {
        fieldIds: ["site_name"],
      },
      scopeId: "root",
      scopeType: "ROOT",
      uiSchema: {
        currentParentId: null,
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
        ],
        selectedNodeId: null,
        unplacedFieldIds: [],
      },
    },
    selectedNodeId: null,
    subformScopes: [
      {
        dataSchema: {
          fieldIds: ["note"],
        },
        filterDefinitions: createFilterDefinitions(),
        parentSubformNodeId: "subform-notes",
        scopeId: "subform-notes",
        scopeType: "SUBFORM",
        subformType: "DEFAULT",
        tableKey: "pb_notes",
        uiSchema: {
          currentParentId: null,
          nodes: [
            {
              fieldId: "note",
              id: "field-note",
              order: 0,
              parentId: null,
              type: "field",
              visibility: "visible",
            },
          ],
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
    systemFields: {
      version: 1,
    },
    viewDescription: "",
    viewKind: "form",
    viewSettings: {
      actions: {
        canAdd: true,
        canDelete: true,
        canEdit: true,
        canView: true,
      },
      correctiveAction: {
        enabled: false,
        modelKey: "corrective_action",
        sourceType: "platform_static",
      },
      list: {
        columns: [],
        sorting: {
          direction: "asc",
        },
      },
    },
    viewTitle: "Default",
  };
}

describe("Form Builder changed-node attention", () => {
  it("ignores field settings when comparing model structure", () => {
    const baseline = {
      rootScope: {
        fields: [
          {
            autocomplete: "on",
            id: "site-name",
            kind: "short_text",
            label: "Site name",
            placeholder: "Site name",
          },
        ],
        schemaScopeId: "root",
      },
      subformScopes: [
        {
          fields: [
            {
              displayFormat: "MM/dd/yyyy",
              id: "note-date",
              kind: "date",
              label: "Note date",
            },
          ],
          schemaScopeId: "pb_notes",
          subformType: "DEFAULT",
          tableKey: "pb_notes",
        },
      ],
    };
    const settingsChanged = {
      rootScope: {
        fields: [
          {
            autocomplete: "name",
            id: "site-name",
            kind: "short_text",
            label: "Site",
            placeholder: "Updated placeholder",
            uniqueValue: true,
            validation: "email",
          },
        ],
        schemaScopeId: "root",
      },
      subformScopes: [
        {
          displayName: "Notes",
          fields: [
            {
              displayFormat: "yyyy-MM-dd",
              id: "note-date",
              kind: "date_time",
              label: "Date",
              readonly: true,
            },
          ],
          schemaScopeId: "pb_notes",
          subformType: "DEFAULT",
          tableKey: "pb_notes",
        },
      ],
    };

    expect(buildDataSchemaStructureSignature(settingsChanged)).toBe(buildDataSchemaStructureSignature(baseline));
  });

  it("detects field and scope membership changes as model structure", () => {
    const baseline = {
      rootScope: {
        fields: [
          { id: "site-name" },
          { id: "status" },
        ],
      },
      subformScopes: [
        {
          fields: [
            { id: "note" },
          ],
          schemaScopeId: "pb_notes",
          subformType: "DEFAULT",
          tableKey: "pb_notes",
        },
      ],
    };
    const addedField = {
      ...baseline,
      rootScope: {
        fields: [
          { id: "site-name" },
          { id: "status" },
          { id: "priority" },
        ],
      },
    };
    const movedField = {
      rootScope: {
        fields: [
          { id: "site-name" },
        ],
      },
      subformScopes: [
        {
          fields: [
            { id: "note" },
            { id: "status" },
          ],
          schemaScopeId: "pb_notes",
          subformType: "DEFAULT",
          tableKey: "pb_notes",
        },
      ],
    };

    expect(buildDataSchemaStructureSignature(addedField)).not.toBe(buildDataSchemaStructureSignature(baseline));
    expect(buildDataSchemaStructureSignature(movedField)).not.toBe(buildDataSchemaStructureSignature(baseline));
  });

  it("propagates subform field changes to the parent subform and root ancestors", () => {
    const savedDocument = createDocument();
    const currentDocument = createDocument();
    const savedModel = createModel([
      createField("site_name", "Site name"),
      createField("note", "Note", { schemaScopeKey: "pb_notes" }),
    ]);
    const currentModel = createModel([
      createField("site_name", "Site name"),
      createField("note", "Updated note", { schemaScopeKey: "pb_notes" }),
    ]);

    const attentionNodeIds = getCanvasAttentionNodeIds(
      currentDocument,
      savedDocument,
      currentModel,
      savedModel,
    );

    expect([...attentionNodeIds].sort()).toEqual([
      "field-note",
      "section-main",
      "subform-notes",
    ]);
  });
});
