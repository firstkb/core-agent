import type {
  RuntimeFormLabels,
  RuntimeFormResolvedLabels,
} from "./runtime-form-types";

const defaultRuntimeFormLabels: RuntimeFormResolvedLabels = {
  backToList: "Back to list",
  createModeInfo: "Complete the required fields to create this record. Changes will save automatically after it is created.",
  editModeInfo: "This form saves changes automatically as you work. You can continue working with it later.",
  finish: "Finish",
  invalidEmailError: "Please enter a valid email address.",
  invalidMaskError: "Please enter a value that matches the required format.",
  invalidPhoneError: "Please enter a valid phone number.",
  invalidUrlError: "Please enter a valid URL.",
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
