import type {
  RuntimeFormLabels,
  RuntimeFormResolvedLabels,
} from "./runtime-form-types";

const defaultRuntimeFormLabels: RuntimeFormResolvedLabels = {
  backToList: "Back to list",
  createModeInfo: "Complete the required fields to create this record. Changes will save automatically after it is created.",
  editModeInfo: "This form saves changes automatically as you work. You can continue working with it later.",
  finish: "Finish",
  onlineFormTitle: "Online Form",
  requiredError: "This field is required.",
  saveStates: {
    dirty: "Unsaved",
    error: "Needs attention",
    idle: "Ready",
    saved: "Saved",
    saving: "Saving",
  },
  selectPlaceholder: "Select...",
  subformAdd: "Add",
  subformDelete: "Delete",
  subformEdit: "Edit",
  subformEmpty: "No records yet.",
};

export function resolveRuntimeFormLabels(labels?: RuntimeFormLabels): RuntimeFormResolvedLabels {
  return {
    ...defaultRuntimeFormLabels,
    ...labels,
    saveStates: {
      ...defaultRuntimeFormLabels.saveStates,
      ...labels?.saveStates,
    },
  };
}
