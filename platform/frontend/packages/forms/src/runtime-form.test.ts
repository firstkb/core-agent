import { describe, expect, it } from "vitest";

import {
  applyRuntimeWorkflowStatus,
  findFirstRuntimeChecklistRequiredError,
  findRuntimeFormField,
  validateRuntimeForm,
} from "./runtime-form";
import type { RuntimeFormDefinition, RuntimeFormSubformDefinition } from "./runtime-form";
import { createRuntimeFormFixture } from "./runtime-form-fixtures";
import { createRuntimeFormDefinitionFromSchema } from "./runtime-form-schema";
import { getRuntimeFieldLabelActivation } from "./runtime/fields/runtime-field";
import { getRuntimeChecklistVisibleGroups } from "./runtime/runtime-form-checklist";
import { formatReadonlyValue } from "./runtime/runtime-form-utils";

describe("runtime form helpers", () => {
  it("validates required editable fields from a fixture definition", () => {
    const { definition, values } = createRuntimeFormFixture({
      mode: "create",
      modelId: "sor",
      viewId: "default",
    });

    const errors = validateRuntimeForm(definition, values);

    expect(errors.location).toBe("This field is required.");
    expect(errors.inspection_date).toBe("This field is required.");
    expect(errors.type).toBe("This field is required.");
    expect(errors.categories).toBe("This field is required.");
    expect(errors.comment).toBeUndefined();
    expect(errors.status).toBeUndefined();
  });

  it("finds fields nested inside layout nodes", () => {
    const { definition } = createRuntimeFormFixture({
      mode: "create",
      modelId: "sor",
      viewId: "default",
    });

    expect(findRuntimeFormField(definition, "crew_size")?.type).toBe("integer");
    expect(findRuntimeFormField(definition, "work_scope")?.type).toBe("long_text");
  });

  it("formats readonly date values in US display format", () => {
    expect(formatReadonlyValue({
      id: "inspection_date",
      label: "Inspection date",
      type: "date",
    }, "2026-05-03")).toBe("05/03/2026");
    expect(formatReadonlyValue({
      id: "follow_up_at",
      label: "Follow-up at",
      type: "date_time",
    }, "2026-05-03T14:05")).toBe("05/03/2026 2:05 PM");
  });

  it("classifies runtime field label activation by control behavior", () => {
    expect(getRuntimeFieldLabelActivation({
      id: "name",
      label: "Name",
      type: "short_text",
    })).toBe("native");
    expect(getRuntimeFieldLabelActivation({
      id: "active",
      label: "Active",
      type: "boolean",
    })).toBe("native");
    expect(getRuntimeFieldLabelActivation({
      id: "status",
      label: "Status",
      options: [{ label: "Open", value: "open" }],
      type: "single_select",
    })).toBe("focus");
    expect(getRuntimeFieldLabelActivation({
      id: "contact",
      label: "Contact",
      lookup: {
        displayMode: "search_select",
        selectionMode: "single",
        valueMode: "stored_value",
      },
      type: "single_select",
    })).toBe("focus");
    expect(getRuntimeFieldLabelActivation({
      id: "catalog",
      label: "Catalog",
      lookup: {
        displayMode: "catalog_modal",
        selectionMode: "single",
        valueMode: "stored_value",
      },
      type: "single_select",
    })).toBe("none");
    expect(getRuntimeFieldLabelActivation({
      choiceRenderStyle: "buttons",
      id: "priority",
      label: "Priority",
      options: [{ label: "High", value: "high" }],
      type: "single_select",
    })).toBe("none");
    expect(getRuntimeFieldLabelActivation({
      id: "readonly",
      label: "Readonly",
      readonly: true,
      type: "short_text",
    })).toBe("none");
    expect(getRuntimeFieldLabelActivation({
      id: "coordinates",
      label: "Coordinates",
      type: "geo_point",
    })).toBe("native");
  });

  it("compiles and validates geo point fields", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [
            {
              id: "gps",
              kind: "geo_point",
              label: "GPS coordinates",
            },
          ],
        },
      },
      mode: "create",
      modelId: "site",
      uiSchema: {
        rootScope: {
          nodes: [
            {
              fieldId: "gps",
              id: "node-gps",
              order: 0,
              required: true,
              type: "field",
              visibility: "readonly",
            },
          ],
        },
      },
      viewId: "default",
    });

    const field = findRuntimeFormField(definition, "gps");
    expect(field?.type).toBe("geo_point");
    expect(field?.readonly).toBe(false);
    expect(validateRuntimeForm(definition, {}).gps).toBe("This field is required.");
    expect(validateRuntimeForm(definition, {
      gps: "Latitude: 91.000000, Longitude: -73.000000",
    }).gps).toBe("Please enter a valid geographic point.");
    expect(validateRuntimeForm(definition, {
      gps: "Latitude: 40.712800, Longitude: -74.006000",
    }).gps).toBeUndefined();
  });

  it("applies same-scope requirement rules during validation", () => {
    const { definition, values } = createRuntimeFormFixture({
      mode: "create",
      modelId: "sor",
      viewId: "default",
    });

    const errors = validateRuntimeForm(definition, {
      ...values,
      categories: ["aerial_lifts"],
      inspection_date: "2026-02-20",
      location: "TEST",
      needs_corrective_action: true,
      type: "unsatisfactory",
    });

    expect(errors.comment).toBe("This field is required.");
  });

  it("validates short text email, phone, URL, and mask settings", () => {
    const definition: RuntimeFormDefinition = {
      commitMode: "autosave",
      id: "runtime-text-validation",
      mode: "create",
      sections: [
        {
          id: "default",
          nodes: [
            {
              id: "email",
              inputType: "email",
              label: "Email",
              required: true,
              type: "short_text",
              validation: "email",
            },
            {
              id: "phone",
              inputType: "tel",
              label: "Phone",
              mask: "(999) 999-9999",
              required: true,
              type: "short_text",
              validation: "phone",
            },
            {
              id: "website",
              inputType: "url",
              label: "Website",
              required: true,
              type: "short_text",
              validation: "url",
            },
            {
              id: "ticket",
              label: "Ticket",
              mask: "AAA-999",
              required: true,
              type: "short_text",
            },
          ],
        },
      ],
      title: "Text validation",
    };

    const invalidErrors = validateRuntimeForm(definition, {
      email: "wrong",
      phone: "(555) 123",
      ticket: "AB-12",
      website: "example.com",
    });
    const validErrors = validateRuntimeForm(definition, {
      email: "demo@example.com",
      phone: "(555) 123-4567",
      ticket: "ABC-123",
      website: "https://example.com",
    });

    expect(invalidErrors.email).toBe("Please enter a valid email address.");
    expect(invalidErrors.phone).toBe("Please enter a value that matches the required format.");
    expect(invalidErrors.ticket).toBe("Please enter a value that matches the required format.");
    expect(invalidErrors.website).toBe("Please enter a valid URL.");
    expect(validErrors).toEqual({});
  });

  it("treats show visibility rules as hidden until their condition matches", () => {
    const { definition, values } = createRuntimeFormFixture({
      mode: "create",
      modelId: "sor",
      viewId: "default",
    });
    const withRuleField: RuntimeFormDefinition = {
      ...definition,
      sections: [
        ...definition.sections,
        {
          id: "visibility-test",
          nodes: [
            {
              id: "corrective_action_note",
              label: "Corrective action note",
              required: true,
              rules: {
                visibilityRules: [
                  {
                    effect: "show",
                    id: "show-for-unsatisfactory",
                    when: {
                      all: [
                        {
                          fieldId: "type",
                          operator: "eq",
                          value: "unsatisfactory",
                        },
                      ],
                    },
                  },
                ],
              },
              type: "short_text",
            },
          ],
        },
      ],
    };

    const hiddenErrors = validateRuntimeForm(withRuleField, {
      ...values,
      categories: ["aerial_lifts"],
      inspection_date: "2026-02-20",
      location: "TEST",
      needs_corrective_action: true,
      type: "satisfactory",
    });
    const visibleErrors = validateRuntimeForm(withRuleField, {
      ...values,
      categories: ["aerial_lifts"],
      inspection_date: "2026-02-20",
      location: "TEST",
      needs_corrective_action: true,
      type: "unsatisfactory",
    });

    expect(hiddenErrors.corrective_action_note).toBeUndefined();
    expect(visibleErrors.corrective_action_note).toBe("This field is required.");
  });

  it("applies workflow status only through explicit binding values", () => {
    const { definition, values } = createRuntimeFormFixture({
      mode: "create",
      modelId: "sor",
      viewId: "default",
    });

    expect(applyRuntimeWorkflowStatus(definition, values, "initial").status).toBe("current");
    expect(applyRuntimeWorkflowStatus(definition, values, "final").status).toBe("complete");
  });

  it("does not invent workflow status when the bound field is absent", () => {
    const { definition, values } = createRuntimeFormFixture({
      mode: "create",
      modelId: "sor",
      viewId: "default",
    });
    const withoutStatusField = {
      ...definition,
      workflowStatus: {
        fieldId: "missing_status",
        finalValue: "complete",
        initialValue: "current",
      },
    };

    expect(applyRuntimeWorkflowStatus(withoutStatusField, values, "initial")).toBe(values);
  });

  it("does not apply workflow status values outside the bound field options", () => {
    const { definition, values } = createRuntimeFormFixture({
      mode: "create",
      modelId: "sor",
      viewId: "default",
    });
    const withInvalidFinalValue = {
      ...definition,
      workflowStatus: {
        fieldId: "status",
        initialValue: "current",
        finalValue: "not_in_options",
      },
    };

    expect(applyRuntimeWorkflowStatus(withInvalidFinalValue, values, "final")).toBe(values);
  });

  it("compiles Form Builder runtime schema into sections, fields, rules, and workflow status", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [
            {
              fieldId: "location",
              kind: "short_text",
              label: "Location",
              required: true,
            },
            {
              fieldId: "status",
              kind: "single_select",
              label: "Status",
              options: [
                { label: "New", value: "new" },
                { label: "Finish", value: "finish" },
              ],
            },
            {
              choiceDisplay: {
                orientation: "horizontal",
                renderStyle: "buttons",
              },
              fieldId: "priority",
              kind: "single_select",
              label: "Priority",
              options: [
                { label: "Normal", value: "normal" },
                { label: "High", value: "high" },
              ],
            },
            {
              fieldId: "reported_by",
              kind: "db_lookup",
              label: "Reported By",
              options: [
                { label: "Andrew Owner", value: "77" },
              ],
              preset: "contact_lookup",
              selectionMode: "single",
              semanticRole: "reportedBy",
            },
          ],
        },
      },
      mode: "create",
      modelId: "sor",
      title: "SOR",
      uiSchema: {
        rootScope: {
          nodes: [
            {
              id: "summary",
              order: 1,
              parentId: null,
              title: "Summary",
              type: "section",
              visibility: "visible",
            },
            {
              fieldId: "location",
              id: "node-location",
              order: 1,
              parentId: "summary",
              rules: {
                requirementRules: [
                  {
                    effect: "required",
                    id: "require-location",
                    when: {
                      all: [
                        {
                          fieldId: "priority",
                          id: "condition-1",
                          operator: "eq",
                          value: "high",
                        },
                      ],
                    },
                  },
                ],
                visibilityRules: [],
              },
              type: "field",
              visibility: "visible",
            },
            {
              fieldId: "status",
              id: "node-status",
              order: 2,
              parentId: "summary",
              type: "field",
              visibility: "readonly",
            },
            {
              fieldId: "priority",
              id: "node-priority",
              order: 3,
              parentId: "summary",
              runtimePreset: "radio_chips",
              type: "field",
              visibility: "visible",
            },
            {
              fieldId: "reported_by",
              id: "node-reported-by",
              order: 4,
              parentId: "summary",
              type: "field",
              visibility: "visible",
            },
          ],
          systemFields: {
            workflowStatus: {
              fieldId: "status",
              finalValue: "finish",
              initialValue: "new",
            },
          },
        },
      },
      viewId: "default",
    });

    expect(definition.sections).toHaveLength(1);
    expect(definition.sections[0]?.title).toBe("Summary");
    expect(definition.workflowStatus?.fieldId).toBe("status");
    expect(findRuntimeFormField(definition, "location")?.width).toBe("full");
    expect(findRuntimeFormField(definition, "location")?.rules?.requirementRules).toHaveLength(1);
    expect(findRuntimeFormField(definition, "status")?.readonly).toBe(true);
    expect(findRuntimeFormField(definition, "priority")?.type).toBe("single_select");
    expect(findRuntimeFormField(definition, "priority")?.choiceRenderStyle).toBe("buttons");
    expect(findRuntimeFormField(definition, "priority")?.choiceOrientation).toBe("horizontal");
    expect(findRuntimeFormField(definition, "reported_by")?.type).toBe("single_select");
    expect(findRuntimeFormField(definition, "reported_by")?.readonly).toBe(false);
    expect(findRuntimeFormField(definition, "reported_by")?.options?.[0]?.label).toBe("Andrew Owner");
  });

  it("normalizes authored string options for select and multi-select fields", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [
            {
              id: "inspection_type",
              kind: "single_select",
              label: "Inspection type",
              options: ["Satisfactory", "Unsatisfactory"],
            },
            {
              id: "failed_categories",
              kind: "multi_select",
              label: "Failed categories",
              options: ["Aerial lifts", "PPE"],
            },
          ],
        },
      },
      mode: "edit",
      modelId: "test-inspection",
      title: "Test Inspection",
      uiSchema: {
        rootScope: {
          nodes: [
            {
              fieldId: "inspection_type",
              id: "node-inspection-type",
              order: 1,
              type: "field",
              visibility: "visible",
            },
            {
              fieldId: "failed_categories",
              id: "node-failed-categories",
              order: 2,
              type: "field",
              visibility: "visible",
            },
          ],
        },
      },
      viewId: "default",
    });

    expect(findRuntimeFormField(definition, "inspection_type")?.options).toEqual([
      { label: "Satisfactory", value: "Satisfactory" },
      { label: "Unsatisfactory", value: "Unsatisfactory" },
    ]);
    expect(findRuntimeFormField(definition, "failed_categories")?.options).toEqual([
      { label: "Aerial lifts", value: "Aerial lifts" },
      { label: "PPE", value: "PPE" },
    ]);
  });

  it("compiles lookup fields into async select definitions", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [
            {
              displayFields: ["name"],
              fieldId: "company",
              kind: "db_lookup",
              label: "Company",
              lookupConfig: {
                displayMode: "search_select",
                filters: [
                  { field: "active", operator: "eq", value: true },
                ],
                searchFields: ["name"],
                sortField: "name",
                sourceModel: "company",
                storedValueField: "doc_id",
              },
              preset: "company_lookup",
              selectionMode: "single",
              storageKey: "company",
            },
            {
              fieldId: "contacts",
              kind: "db_lookup",
              label: "Contacts",
              lookupConfig: {
                displayMode: "search_select",
                sourceModel: "contact",
              },
              selectionMode: "multiple",
              storageKey: "contacts",
            },
            {
              fieldId: "vendor_name",
              kind: "db_lookup",
              label: "Vendor Name",
              lookupConfig: {
                displayMode: "catalog_modal",
                displayFields: ["name"],
                sourceModel: "company",
                storedTextFields: ["name"],
              },
              preset: "db_lookup_value",
              storageKey: "vendor_name",
            },
          ],
        },
      },
      mode: "edit",
      modelId: "lookup",
      uiSchema: {
        rootScope: {
          nodes: [
            { fieldId: "company", id: "node-company", order: 1, type: "field" },
            { fieldId: "contacts", id: "node-contacts", order: 2, type: "field" },
            { fieldId: "vendor_name", id: "node-vendor-name", order: 3, type: "field" },
          ],
        },
      },
      viewId: "default",
    });

    expect(findRuntimeFormField(definition, "company")).toMatchObject({
      lookup: {
        displayFields: ["name"],
        displayMode: "search_select",
        filters: [{ field: "active", operator: "eq", value: true }],
        preset: "company_lookup",
        searchFields: ["name"],
        selectionMode: "single",
        sortField: "name",
        sourceModel: "company",
        storedValueField: "doc_id",
        valueMode: "stored_value",
      },
      type: "single_select",
    });
    expect(findRuntimeFormField(definition, "contacts")).toMatchObject({
      lookup: {
        selectionMode: "multiple",
      },
      type: "multi_select",
    });
    expect(findRuntimeFormField(definition, "vendor_name")).toMatchObject({
      lookup: {
        displayMode: "catalog_modal",
        displayFields: ["name"],
        selectionMode: "single",
        storedTextFields: ["name"],
        valueMode: "text",
      },
    });
  });

  it("compiles view-only lookup output bindings", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [
            {
              displayFields: ["Full name", "Email"],
              fieldId: "reported-by",
              kind: "db_lookup",
              label: "Reported By",
              preset: "contact_lookup",
              selectionMode: "single",
              storageKey: "reported_by",
            },
          ],
        },
      },
      mode: "edit",
      modelId: "lookup",
      uiSchema: {
        rootScope: {
          nodes: [
            { fieldId: "reported-by", id: "node-reported-by", order: 1, type: "field" },
            {
              id: "node-company-name",
              order: 2,
              title: "Company name",
              type: "view_only_field",
              viewOnlyBinding: {
                kind: "lookup_derived_output",
                outputKey: "company_name",
                sourceFieldId: "reported-by",
              },
            },
          ],
        },
      },
      viewId: "default",
    });

    const viewOnlyNode = definition.sections
      .flatMap((section) => section.nodes ?? [])
      .find((node) => node.nodeType === "content"
        && "contentType" in node
        && node.contentType === "view_only_field");

    expect(viewOnlyNode).toMatchObject({
      contentType: "view_only_field",
      label: "Company name",
      labelLayout: "responsive-inline",
      valueBinding: {
        kind: "lookup_derived_output",
        outputKey: "company_name",
        sourceFieldId: "reported-by",
      },
    });
  });

  it("compiles view-only root record id bindings", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [],
        },
      },
      mode: "edit",
      modelId: "lookup-option",
      uiSchema: {
        rootScope: {
          nodes: [
            {
              id: "node-doc-id",
              order: 0,
              title: "Doc.id",
              type: "view_only_field",
              viewOnlyBinding: {
                kind: "root_record_id",
              },
            },
          ],
        },
      },
      viewId: "default",
    });

    const viewOnlyNode = definition.sections
      .flatMap((section) => section.nodes ?? [])
      .find((node) => node.nodeType === "content"
        && "contentType" in node
        && node.contentType === "view_only_field");

    expect(viewOnlyNode).toMatchObject({
      contentType: "view_only_field",
      label: "Doc.id",
      labelLayout: "responsive-inline",
      valueBinding: {
        kind: "root_record_id",
      },
    });
  });

  it("compiles short text input settings and ready-made text presets", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [
            {
              autocomplete: "on",
              id: "reference",
              kind: "short_text",
              label: "Reference",
              mask: "AAA-999",
              placeholder: "Ticket or reference",
            },
            {
              autocomplete: "email",
              id: "email",
              inputMode: "email",
              kind: "short_text",
              label: "Email",
              placeholder: "name@example.com",
              preset: "email",
              validation: "email",
            },
            {
              autocomplete: "tel",
              id: "phone",
              inputMode: "tel",
              kind: "short_text",
              label: "Phone",
              mask: "(999) 999-9999",
              placeholder: "(555) 555-5555",
              preset: "phone",
              validation: "phone",
            },
            {
              autocomplete: "url",
              id: "website",
              inputMode: "url",
              kind: "short_text",
              label: "Website",
              placeholder: "https://example.com",
              preset: "url",
              validation: "url",
            },
            {
              id: "city",
              kind: "short_text",
              label: "City",
              placeholder: "Start typing",
              preset: "suggest_text",
              suggestConfig: {
                allowCustomValue: true,
                maxResults: 20,
                minQueryLength: 1,
                searchMode: "contains",
                sourceMode: "same_field_distinct_values",
              },
            },
          ],
        },
      },
      mode: "edit",
      modelId: "test-inspection",
      uiSchema: {
        rootScope: {
          nodes: [
            {
              fieldId: "reference",
              id: "node-reference",
              order: 1,
              placeholder: "UI node placeholder",
              type: "field",
              visibility: "visible",
            },
            {
              fieldId: "email",
              id: "node-email",
              order: 2,
              type: "field",
              visibility: "visible",
            },
            {
              fieldId: "phone",
              id: "node-phone",
              order: 3,
              type: "field",
              visibility: "visible",
            },
            {
              fieldId: "website",
              id: "node-website",
              order: 4,
              type: "field",
              visibility: "visible",
            },
            {
              fieldId: "city",
              id: "node-city",
              order: 5,
              type: "field",
              visibility: "visible",
            },
          ],
        },
      },
      viewId: "default",
    });

    expect(findRuntimeFormField(definition, "reference")).toMatchObject({
      autocomplete: "on",
      mask: "AAA-999",
      placeholder: "UI node placeholder",
      type: "short_text",
    });
    expect(findRuntimeFormField(definition, "email")).toMatchObject({
      autocomplete: "email",
      inputMode: "email",
      inputType: "email",
      placeholder: "name@example.com",
      validation: "email",
    });
    expect(findRuntimeFormField(definition, "phone")).toMatchObject({
      autocomplete: "tel",
      inputMode: "tel",
      inputType: "tel",
      mask: "(999) 999-9999",
      validation: "phone",
    });
    expect(findRuntimeFormField(definition, "website")).toMatchObject({
      autocomplete: "url",
      inputMode: "url",
      inputType: "url",
      validation: "url",
    });
    expect(findRuntimeFormField(definition, "city")).toMatchObject({
      placeholder: "Start typing",
      type: "short_text",
    });
  });

  it("compiles Form Builder choice render style and orientation settings", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [
            {
              choiceDisplay: {
                orientation: "vertical",
                optionStyles: [
                  { option: "New", variant: "success" },
                  { option: "In progress", variant: "warning" },
                  { option: "Complete", variant: "default" },
                  { backgroundColor: "#000000", option: "Legacy raw color" },
                ],
                renderStyle: "buttons",
              },
              id: "status",
              kind: "single_select",
              label: "Status",
              options: ["New", "In progress", "Complete"],
            },
            {
              choiceDisplay: {
                orientation: "horizontal",
                optionStyles: [
                  { option: "PPE", variant: "danger" },
                ],
                renderStyle: "buttons",
              },
              id: "categories",
              kind: "multi_select",
              label: "Categories",
              options: ["Aerial lifts", "PPE"],
            },
            {
              choiceDisplay: {
                orientation: "vertical",
                renderStyle: "native",
              },
              id: "type",
              kind: "single_select",
              label: "Type",
              options: ["Satisfactory", "Unsatisfactory"],
              preset: "radio_group",
            },
          ],
        },
      },
      mode: "edit",
      modelId: "test-inspection",
      uiSchema: {
        rootScope: {
          nodes: [
            {
              fieldId: "status",
              id: "node-status",
              order: 1,
              type: "field",
              visibility: "visible",
            },
            {
              fieldId: "categories",
              id: "node-categories",
              order: 2,
              type: "field",
              visibility: "visible",
            },
            {
              fieldId: "type",
              id: "node-type",
              order: 3,
              type: "field",
              visibility: "visible",
            },
          ],
        },
      },
      viewId: "default",
    });

    const status = findRuntimeFormField(definition, "status");
    const categories = findRuntimeFormField(definition, "categories");
    const type = findRuntimeFormField(definition, "type");

    expect(status?.type).toBe("single_select");
    expect(status?.choiceRenderStyle).toBe("buttons");
    expect(status?.choiceOrientation).toBe("vertical");
    expect(status?.options).toEqual([
      { label: "New", styleVariant: "success", value: "New" },
      { label: "In progress", styleVariant: "warning", value: "In progress" },
      { label: "Complete", value: "Complete" },
    ]);
    expect(categories?.type).toBe("multi_select");
    expect(categories?.choiceRenderStyle).toBe("buttons");
    expect(categories?.choiceOrientation).toBe("horizontal");
    expect(categories?.options).toEqual([
      { label: "Aerial lifts", value: "Aerial lifts" },
      { label: "PPE", styleVariant: "danger", value: "PPE" },
    ]);
    expect(type?.type).toBe("single_select");
    expect(type?.choiceRenderStyle).toBe("native");
  });

  it("compiles Form Builder subform nodes from subform grid settings", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [
            {
              id: "location",
              kind: "short_text",
              label: "Location",
            },
          ],
        },
        subformScopes: [
          {
            displayName: "Contacts",
            fields: [
              {
                id: "email",
                kind: "short_text",
                label: "Email",
              },
              {
                id: "phone",
                kind: "short_text",
                label: "Phone",
              },
            ],
            schemaScopeId: "subform-contacts",
            subformType: "DEFAULT",
            tableKey: "contacts",
          },
        ],
      },
      mode: "edit",
      modelId: "test-inspection",
      uiSchema: {
        rootScope: {
          nodes: [
            {
              fieldId: "location",
              id: "node-location",
              order: 1,
              type: "field",
              visibility: "visible",
            },
            {
              id: "node-contacts",
              order: 2,
              schemaScopeId: "subform-contacts",
              tableKey: "contacts",
              title: "Contact list",
              type: "subform",
              visibility: "visible",
            },
          ],
        },
        subformScopes: [
          {
            schemaScopeId: "subform-contacts",
            viewSettings: {
              actions: {
                canAdd: true,
                canDelete: false,
                canEdit: true,
              },
              list: {
                columns: [
                  {
                    fieldId: "phone",
                    id: "grid-phone",
                    order: 0,
                  },
                  {
                    fieldId: "email",
                    id: "grid-email",
                    order: 1,
                  },
                ],
                sorting: {
                  direction: "desc",
                  fieldId: "phone",
                },
              },
            },
          },
        ],
      },
      viewId: "default",
    });

    const subform = definition.sections[0]?.nodes?.find((node) => node.nodeType === "subform") as RuntimeFormSubformDefinition | undefined;

    expect(subform?.schemaScopeId).toBe("subform-contacts");
    expect(subform?.title).toBe("Contact list");
    expect(subform?.actions).toEqual({
      canAdd: true,
      canDelete: false,
      canEdit: true,
    });
    expect(subform?.columns.map((column) => column.fieldId)).toEqual(["phone", "email"]);
    expect(subform?.defaultSort).toEqual({
      columnId: "phone",
      direction: "desc",
    });
  });

  it("compiles checklist detail nodes from subform scope", () => {
    const definition = createRuntimeFormDefinitionFromSchema({
      commitMode: "autosave",
      dataSchema: {
        rootScope: {
          fields: [],
        },
        subformScopes: [
          {
            displayName: "Checklist",
            fields: [
              { id: "item", kind: "db_lookup", label: "Item", selectionMode: "single" },
              { id: "result", kind: "single_select", label: "Result", options: ["Yes", "No"] },
              { id: "notes", kind: "long_text", label: "Notes" },
              { id: "comment", kind: "short_text", label: "Comment" },
              { id: "due-date", kind: "date", label: "Due date" },
              { id: "severity", kind: "single_select", label: "Severity", options: ["Low", "High"] },
            ],
            schemaScopeId: "inspection-checklist",
            subformType: "CHECKLIST",
            tableKey: "inspection-checklist",
          },
        ],
      },
      mode: "edit",
      modelId: "inspection",
      uiSchema: {
        rootScope: {
          nodes: [{
            checklistConfig: {
              lookupFieldId: "item",
              notesFieldId: "notes",
              resultFieldId: "result",
            },
            id: "checklist-node",
            schemaScopeId: "inspection-checklist",
            subformType: "CHECKLIST",
            tableKey: "inspection-checklist",
            title: "Checklist",
            type: "subform",
          }],
        },
        subformScopes: [{
          nodes: [
            { fieldId: "item", id: "field-item", order: 0, type: "field" },
            { fieldId: "result", id: "field-result", order: 1, type: "field" },
            { fieldId: "notes", id: "field-notes", order: 2, type: "field" },
            { fieldId: "comment", id: "field-comment", order: 3, type: "field" },
            { fieldId: "due-date", id: "field-due-date", order: 4, type: "field" },
            { fieldId: "severity", id: "field-severity", order: 5, type: "field" },
            { id: "heading", order: 6, title: "Follow up", type: "heading" },
            { id: "text", order: 7, text: "Add supporting details.", type: "text" },
          ],
          schemaScopeId: "inspection-checklist",
        }],
      },
      viewId: "default",
    });

    const subform = definition.sections[0]?.nodes?.[0] as RuntimeFormSubformDefinition | undefined;

    expect(subform?.checklistDetails?.map((node) => node.id)).toEqual([
      "notes",
      "comment",
      "due-date",
      "severity",
      "heading",
      "text",
    ]);
    expect(subform?.checklistDetails?.some((node) => node.id === "item")).toBe(false);
    expect(subform?.checklistDetails?.some((node) => node.id === "result")).toBe(false);
  });

  it("finds the first required unanswered checklist item", () => {
    const definition: RuntimeFormDefinition = {
      commitMode: "autosave",
      id: "inspection",
      mode: "edit",
      sections: [{
        id: "main",
        nodes: [{
          actions: {
            canAdd: false,
            canDelete: false,
            canEdit: false,
          },
          columns: [],
          id: "checklist-node",
          nodeType: "subform",
          schemaScopeId: "inspection-checklist",
          subformType: "CHECKLIST",
          tableKey: "inspection-checklist",
          title: "Checklist",
        }],
      }],
      title: "Inspection",
    };

    const error = findFirstRuntimeChecklistRequiredError(definition, {}, {
      "inspection-checklist": {
        checklist: {
          groups: [{
            id: "onsite-documents",
            items: [{
              label: "EHS Daily Reports",
              required: true,
              sourceValue: "42",
            }],
            title: "Onsite Documents",
          }],
        },
      },
    });

    expect(error).toMatchObject({
      groupId: "onsite-documents",
      nodeId: "checklist-node",
      sourceValue: "42",
      subformId: "inspection-checklist",
    });

    expect(findFirstRuntimeChecklistRequiredError(definition, {}, {
      "inspection-checklist": {
        checklist: {
          groups: [{
            id: "onsite-documents",
            items: [{
              label: "EHS Daily Reports",
              required: true,
              sourceValue: "42",
              value: "Yes",
            }],
            title: "Onsite Documents",
          }],
        },
      },
    })).toBeNull();
  });

  it("filters checklist items by visible_when source answers", () => {
    const visibleGroups = getRuntimeChecklistVisibleGroups({
      groups: [{
        id: "default",
        items: [
          {
            label: "Primary question",
            sourceValue: "7",
            value: "No",
          },
          {
            label: "Follow-up question",
            sourceValue: "8",
            visibleWhen: "7=No|N/A",
          },
          {
            label: "Invalid expression",
            sourceValue: "9",
            visibleWhen: "broken-expression",
          },
          {
            label: "Self-hidden source",
            sourceValue: "10",
            visibleWhen: "12=Yes",
          },
          {
            label: "Depends on source",
            sourceValue: "11",
            visibleWhen: "10=yes",
          },
        ],
      }],
    });

    expect(visibleGroups[0]?.items.map((item) => item.sourceValue)).toEqual(["7", "8", "10"]);
    expect(getRuntimeChecklistVisibleGroups({
      groups: [{
        id: "default",
        items: [
          {
            label: "Primary question",
            sourceValue: "7",
            value: "Yes",
          },
          {
            label: "Follow-up question",
            sourceValue: "8",
            visibleWhen: "7=No|N/A",
          },
        ],
      }],
    })[0]?.items.map((item) => item.sourceValue)).toEqual(["7"]);
  });

  it("ignores hidden visible_when checklist items during required validation", () => {
    const definition: RuntimeFormDefinition = {
      commitMode: "autosave",
      id: "inspection",
      mode: "edit",
      sections: [{
        id: "main",
        nodes: [{
          actions: {
            canAdd: false,
            canDelete: false,
            canEdit: false,
          },
          columns: [],
          id: "checklist-node",
          nodeType: "subform",
          schemaScopeId: "inspection-checklist",
          subformType: "CHECKLIST",
          tableKey: "inspection-checklist",
          title: "Checklist",
        }],
      }],
      title: "Inspection",
    };
    const checklistSubform = {
      "inspection-checklist": {
        checklist: {
          groups: [{
            id: "onsite-documents",
            items: [
              {
                label: "Primary question",
                sourceValue: "7",
                value: "Yes",
              },
              {
                label: "Follow-up question",
                required: true,
                sourceValue: "8",
                visibleWhen: "7=No|N/A",
              },
            ],
            title: "Onsite Documents",
          }],
        },
      },
    };

    expect(findFirstRuntimeChecklistRequiredError(definition, {}, checklistSubform)).toBeNull();
    expect(findFirstRuntimeChecklistRequiredError(definition, {}, {
      "inspection-checklist": {
        checklist: {
          groups: [{
            id: "onsite-documents",
            items: [
              {
                label: "Primary question",
                sourceValue: "7",
                value: "No",
              },
              {
                label: "Follow-up question",
                required: true,
                sourceValue: "8",
                visibleWhen: "7=No|N/A",
              },
            ],
            title: "Onsite Documents",
          }],
        },
      },
    })?.sourceValue).toBe("8");
  });
});
