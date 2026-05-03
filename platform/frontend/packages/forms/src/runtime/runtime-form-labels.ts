import type {
  RuntimeFormLabels,
  RuntimeFormResolvedLabels,
} from "./runtime-form-types";

const defaultRuntimeFormLabels: RuntimeFormResolvedLabels = {
  backToList: "Back to list",
  finish: "Finish",
  requiredError: "This field is required.",
  saveStates: {
    dirty: "Unsaved",
    error: "Needs attention",
    idle: "Ready",
    saved: "Saved",
    saving: "Saving",
  },
  selectPlaceholder: "Select...",
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
