import { describe, expect, it } from "vitest";

import type { FormBuilderDocument } from "../forms-builder-state";
import type { FormsPlaceholderField } from "../forms-placeholder-data";
import {
  getFieldsWithViewOnlyGridTargets,
  getFieldsWithLookupDerivedOutputs,
  getViewFilterBaseFields,
  getViewFilterTargetFields,
} from "./form-builder-workspace-lookup-derived-outputs";

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

describe("Form Builder lookup derived outputs", () => {
  it("excludes multiple lookup fields from View filter targets", () => {
    expect(getViewFilterBaseFields([
      createField("contact", "Contact", {
        family: "preset",
        kind: "db_lookup",
        preset: "contact_lookup",
        selectionMode: "single",
      }),
      createField("contacts", "Contacts", {
        family: "preset",
        kind: "db_lookup",
        preset: "contact_lookup",
        selectionMode: "multiple",
      }),
      createField("status", "Status", {
        family: "choice",
        kind: "single_select",
      }),
    ]).map((field) => field.id)).toEqual(["contact", "status"]);
  });

  it("does not add lookup derived output aliases to View filter targets", () => {
    const fields = [
      createField("reported-by", "Reported By", {
        family: "preset",
        kind: "db_lookup",
        preset: "contact_lookup",
        selectionMode: "single",
      }),
      createField("company", "Company", {
        family: "preset",
        kind: "db_lookup",
        preset: "company_lookup",
        selectionMode: "single",
      }),
      createField("project", "Project", {
        family: "preset",
        kind: "db_lookup",
        preset: "project_lookup",
        selectionMode: "single",
      }),
      createField("db-lookup", "DB Lookup", {
        family: "choice",
        kind: "db_lookup",
        selectionMode: "single",
      }),
    ];
    const getFieldLabelAndBoundField = (field: FormsPlaceholderField) => ({
      boundField: field.label,
      labelField: `${field.label} title`,
    });

    expect(getFieldsWithLookupDerivedOutputs({
      document: {} as FormBuilderDocument,
      fields,
      getFieldLabelAndBoundField,
      t: ((key: string) => key) as never,
    }).some((field) => field.id.includes("::lookup_output::"))).toBe(true);

    const targets = getViewFilterTargetFields({
      document: {} as FormBuilderDocument,
      fields,
      getFieldLabelAndBoundField,
    });

    expect(targets.map((field) => field.id)).toEqual(["reported-by", "company", "project", "db-lookup"]);
    expect(targets.some((field) => field.id.includes("::lookup_output::"))).toBe(false);
    expect(targets.map((field) => field.label)).toEqual([
      "Reported By title",
      "Company title",
      "Project title",
      "DB Lookup title",
    ]);
  });

  it("uses explicit view-only fields instead of automatic lookup aliases for Grid targets", () => {
    const fields = [
      createField("company", "Company", {
        family: "preset",
        kind: "db_lookup",
        preset: "company_lookup",
        selectionMode: "single",
      }),
    ];
    const document = {
      rootScope: {
        uiSchema: {
          nodes: [
            {
              id: "view-only-main-company",
              order: 0,
              parentId: null,
              title: "Business Unit parent",
              type: "view_only_field",
              viewOnlyBinding: {
                kind: "lookup_derived_output",
                outputKey: "main_company_name",
                sourceFieldId: "company",
              },
              visibility: "visible",
            },
          ],
        },
      },
      subformScopes: [],
    } as unknown as FormBuilderDocument;
    const getFieldLabelAndBoundField = (field: FormsPlaceholderField) => ({
      boundField: field.label,
      labelField: `${field.label} title`,
    });

    const targets = getFieldsWithViewOnlyGridTargets({
      columns: [],
      document,
      fields,
      getFieldLabelAndBoundField,
      scopeSubformId: null,
      t: ((key: string) => key) as never,
    });

    expect(targets.map((field) => field.id)).toEqual([
      "company",
      "company::lookup_output::main_company_name",
    ]);
    expect(targets.map((field) => field.label)).toEqual([
      "Company title",
      "Business Unit parent",
    ]);
    expect(targets.some((field) => field.id === "company::lookup_output::label")).toBe(false);
  });

  it("keeps visible legacy lookup aliases manageable in Grid targets", () => {
    const fields = [
      createField("company", "Company", {
        family: "preset",
        kind: "db_lookup",
        preset: "company_lookup",
        selectionMode: "single",
      }),
    ];
    const document = {
      rootScope: {
        uiSchema: {
          nodes: [],
        },
      },
      subformScopes: [],
    } as unknown as FormBuilderDocument;
    const getFieldLabelAndBoundField = (field: FormsPlaceholderField) => ({
      boundField: field.label,
      labelField: `${field.label} title`,
    });

    const targets = getFieldsWithViewOnlyGridTargets({
      columns: [
        {
          fieldId: "company::lookup_output::main_company_name",
          id: "grid-company-main",
          order: 0,
          visible: true,
        },
      ],
      document,
      fields,
      getFieldLabelAndBoundField,
      scopeSubformId: null,
      t: ((key: string) => key) as never,
    });

    expect(targets.map((field) => field.id)).toEqual([
      "company",
      "company::lookup_output::main_company_name",
    ]);
  });

  it("adds explicit Doc.id view-only fields to root Grid targets", () => {
    const document = {
      rootScope: {
        uiSchema: {
          nodes: [
            {
              id: "view-only-doc-id",
              order: 0,
              parentId: null,
              title: "Document number",
              type: "view_only_field",
              viewOnlyBinding: {
                kind: "root_record_id",
              },
              visibility: "visible",
            },
          ],
        },
      },
      subformScopes: [],
    } as unknown as FormBuilderDocument;

    const targets = getFieldsWithViewOnlyGridTargets({
      columns: [],
      document,
      fields: [],
      getFieldLabelAndBoundField: (field) => ({
        boundField: field.label,
        labelField: field.label,
      }),
      scopeSubformId: null,
      t: ((key: string) => key) as never,
    });

    expect(targets).toMatchObject([
      {
        id: "root::record_id",
        label: "Document number",
        sourceLabel: "doc_id",
      },
    ]);
  });
});
