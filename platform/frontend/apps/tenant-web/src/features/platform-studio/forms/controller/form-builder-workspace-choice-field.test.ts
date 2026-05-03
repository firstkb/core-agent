import { describe, expect, it } from "vitest";

import {
  applyChoiceFieldOptionsUpdate,
  applyChoiceOptionStyleUpdate,
  renameChoiceFieldOption,
} from "./form-builder-workspace-choice-field";
import type { FormsPlaceholderField } from "../forms-placeholder-data";

function createChoiceField(): FormsPlaceholderField {
  return {
    choiceDisplay: {
      optionStyles: [
        { option: "Pass", variant: "success" },
        { option: "Fail", variant: "danger" },
      ],
      renderStyle: "buttons",
    },
    family: "choice",
    id: "status",
    isLocked: false,
    kind: "single_select",
    label: "Status",
    options: ["Pass", "Fail", "Review"],
  };
}

describe("Form Builder choice field option styles", () => {
  it("stores semantic option style variants and removes default entries", () => {
    const field = createChoiceField();
    const withWarning = {
      ...field,
      choiceDisplay: applyChoiceOptionStyleUpdate(field.choiceDisplay, "Review", () => ({
        option: "Review",
        variant: "warning",
      })),
    };
    const withDefault = {
      ...withWarning,
      choiceDisplay: applyChoiceOptionStyleUpdate(withWarning.choiceDisplay, "Fail", () => undefined),
    };

    expect(withWarning.choiceDisplay?.optionStyles).toContainEqual({
      option: "Review",
      variant: "warning",
    });
    expect(withDefault.choiceDisplay?.optionStyles).toEqual([
      { option: "Pass", variant: "success" },
      { option: "Review", variant: "warning" },
    ]);
  });

  it("keeps option styles aligned when options are renamed or removed", () => {
    const renamed = renameChoiceFieldOption(createChoiceField(), 0, "Accepted");
    const removed = applyChoiceFieldOptionsUpdate(renamed, (options) =>
      options.filter((option) => option !== "Fail")
    );

    expect(renamed.choiceDisplay?.optionStyles).toContainEqual({
      option: "Accepted",
      variant: "success",
    });
    expect(removed.choiceDisplay?.optionStyles).toEqual([
      { option: "Accepted", variant: "success" },
    ]);
  });
});
