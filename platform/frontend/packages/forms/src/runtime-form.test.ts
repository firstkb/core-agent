import { describe, expect, it } from "vitest";

import {
  applyRuntimeWorkflowStatus,
  findRuntimeFormField,
  validateRuntimeForm,
} from "./runtime-form";
import type { RuntimeFormDefinition } from "./runtime-form";
import { createRuntimeFormFixture } from "./runtime-form-fixtures";

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
});
