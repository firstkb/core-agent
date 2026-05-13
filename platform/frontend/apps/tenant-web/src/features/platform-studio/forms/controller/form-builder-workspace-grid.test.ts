import { describe, expect, it } from "vitest";

import {
  normalizeFormBuilderDocument,
  type FormBuilderGridColumnDefinition,
} from "../forms-builder-state";
import type {
  FormsPlaceholderField,
  FormsPlaceholderObject,
  FormsPlaceholderScreen,
} from "../forms-placeholder-data";
import { normalizeViewSettings } from "../state/form-builder-view-normalization";
import { buildCanonicalDataSchema } from "./form-builder-workspace-data-schema";
import { buildWorkspaceDocumentFromCanonicalSchemas } from "./form-builder-workspace-document-hydration";
import {
  applyCurrentScopeSubformTitleUpdate,
  applyRootViewGridColumnsUpdate,
} from "./form-builder-workspace-document-updates";
import { getVisibleGridScopeFields } from "./form-builder-workspace-field-scope-grid";
import { deriveModelSchemaScopes } from "./form-builder-workspace-schema-utils";
import { buildCanonicalUiSchema } from "./form-builder-workspace-ui-schema";

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

function createModel(fields: ReadonlyArray<FormsPlaceholderField>): FormsPlaceholderObject {
  return {
    canEditViewsOnly: false,
    description: "",
    fields,
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

describe("Form Builder grid settings", () => {
  it("keeps persisted subform grid columns when legacy node columns are absent", () => {
    const noteColumn: FormBuilderGridColumnDefinition = {
      fieldId: "note",
      id: "grid-note",
      order: 0,
      visible: true,
    };
    const model = createModel([
      createField("site_name", "Site name"),
      createField("note", "Note", { schemaScopeKey: "pb_notes" }),
    ]);

    const document = normalizeFormBuilderDocument(
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
                columns: [noteColumn],
                sorting: {
                  direction: "desc",
                  fieldId: "note",
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

    expect(document.subformScopes[0]?.viewSettings.list.columns).toEqual([noteColumn]);
    expect(document.subformScopes[0]?.viewSettings.list.sorting.fieldId).toBe("note");
  });

  it("keeps subform grid columns through canonical save hydration", () => {
    const noteColumn: FormBuilderGridColumnDefinition = {
      fieldId: "note",
      id: "grid-note",
      order: 0,
      visible: true,
    };
    const model = createModel([
      createField("site_name", "Site name"),
      createField("note", "Note", { schemaScopeKey: "pb_notes" }),
    ]);
    const document = normalizeFormBuilderDocument(
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
                columns: [noteColumn],
                sorting: {
                  direction: "desc",
                  fieldId: "note",
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

    const hydratedDocument = buildWorkspaceDocumentFromCanonicalSchemas(
      {
        ...model,
        dataSchema: buildCanonicalDataSchema(model, document),
      },
      {
        ...screen,
        uiSchema: buildCanonicalUiSchema(document, model),
      },
      model,
      screen,
    );

    expect(hydratedDocument.subformScopes[0]?.viewSettings.list.columns).toEqual([noteColumn]);
    expect(hydratedDocument.subformScopes[0]?.viewSettings.list.sorting.fieldId).toBe("note");
  });

  it("updates the active subform title without changing subform identity", () => {
    const model = createModel([
      createField("site_name", "Site name"),
      createField("note", "Note", { schemaScopeKey: "pb_notes" }),
    ]);
    const document = normalizeFormBuilderDocument(
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

    const nextDocument = applyCurrentScopeSubformTitleUpdate(
      { ...document, activeScopeId: "subform-notes" },
      { scopeId: "subform-notes", scopeType: "SUBFORM" },
      "Findings",
    );
    const subformNode = nextDocument.rootScope.uiSchema.nodes.find((node) => node.id === "subform-notes");
    const schemaScope = deriveModelSchemaScopes(model, nextDocument).find((scope) => scope.key === "pb_notes");

    expect(subformNode?.title).toBe("Findings");
    expect(subformNode?.schemaScopeId).toBe("pb_notes");
    expect(subformNode?.tableKey).toBe("pb_notes");
    expect(schemaScope?.displayName).toBe("Findings");
  });

  it("uses only visible grid outputs for sorting choices", () => {
    const visibleLookupOutputId = "company::lookup_output::label";
    const fields = [
      createField("hidden_name", "Hidden name"),
      createField("company", "Company", { family: "advanced", kind: "db_lookup" }),
      createField(visibleLookupOutputId, "Company label", {
        family: "advanced",
        readonly: true,
        sourceLabel: "company__label",
      }),
    ];
    const columns: ReadonlyArray<FormBuilderGridColumnDefinition> = [
      { fieldId: "hidden_name", id: "grid-hidden-name", order: 0, visible: false },
      { fieldId: visibleLookupOutputId, id: "grid-company-label", order: 1, visible: true },
    ];

    expect(getVisibleGridScopeFields(fields, columns).map((field) => field.id))
      .toEqual([visibleLookupOutputId]);
  });

  it("normalizes sorting to visible grid columns only", () => {
    const fieldIds = new Set(["hidden_name", "company"]);
    const visibleLookupOutputId = "company::lookup_output::label";

    const hiddenSort = normalizeViewSettings(
      {
        list: {
          columns: [
            { fieldId: "hidden_name", id: "grid-hidden-name", order: 0, visible: false },
          ],
          sorting: {
            direction: "desc",
            fieldId: "hidden_name",
          },
        },
      },
      fieldIds,
    );
    const visibleLookupSort = normalizeViewSettings(
      {
        list: {
          columns: [
            { fieldId: visibleLookupOutputId, id: "grid-company-label", order: 0, visible: true },
          ],
          sorting: {
            direction: "desc",
            fieldId: visibleLookupOutputId,
          },
        },
      },
      fieldIds,
    );

    expect(hiddenSort.list.sorting.fieldId).toBeUndefined();
    expect(hiddenSort.list.sorting.direction).toBe("desc");
    expect(visibleLookupSort.list.sorting.fieldId).toBe(visibleLookupOutputId);
  });

  it("normalizes second row field to visible grid columns only", () => {
    const fieldIds = new Set(["hidden_name", "company"]);
    const visibleLookupOutputId = "company::lookup_output::label";

    const hiddenRowLayout = normalizeViewSettings(
      {
        list: {
          columns: [
            { fieldId: "hidden_name", id: "grid-hidden-name", order: 0, visible: false },
          ],
          rowLayout: {
            secondaryRowFieldId: "hidden_name",
          },
        },
      },
      fieldIds,
    );
    const visibleLookupRowLayout = normalizeViewSettings(
      {
        list: {
          columns: [
            { fieldId: visibleLookupOutputId, id: "grid-company-label", order: 0, visible: true },
          ],
          rowLayout: {
            secondaryRowFieldId: visibleLookupOutputId,
          },
        },
      },
      fieldIds,
    );

    expect(hiddenRowLayout.list.rowLayout).toBeUndefined();
    expect(visibleLookupRowLayout.list.rowLayout?.secondaryRowFieldId).toBe(visibleLookupOutputId);
  });

  it("clears sorting and second row field when the selected grid column is hidden", () => {
    const viewSettings = normalizeViewSettings(
      {
        list: {
          columns: [
            { fieldId: "site_name", id: "grid-site-name", order: 0, visible: true },
          ],
          sorting: {
            direction: "asc",
            fieldId: "site_name",
          },
          rowLayout: {
            secondaryRowFieldId: "site_name",
          },
        },
      },
      new Set(["site_name"]),
    );

    const nextViewSettings = applyRootViewGridColumnsUpdate(
      viewSettings,
      (columns) => columns.map((column) => ({
        ...column,
        visible: false,
      })),
    );

    expect(nextViewSettings.list.sorting.fieldId).toBeUndefined();
    expect(nextViewSettings.list.rowLayout).toBeUndefined();
  });
});
