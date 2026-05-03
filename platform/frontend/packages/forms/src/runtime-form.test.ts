import { describe, expect, it } from "vitest";

import {
  applyRuntimeWorkflowStatus,
  findRuntimeFormField,
  validateRuntimeForm,
} from "./runtime-form";
import type { RuntimeFormDefinition } from "./runtime-form";
import { createRuntimeFormFixture } from "./runtime-form-fixtures";
import { createRuntimeFormDefinitionFromSchema } from "./runtime-form-schema";

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
});
