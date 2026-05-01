import "./runtime-form.css";

type FieldMessage = {
  id: string;
  message: string;
  tone: "help" | "error";
};

function createFieldHelp(id: string, message: string): FieldMessage {
  return { id, message, tone: "help" };
}

function createFieldError(id: string, message: string): FieldMessage {
  return { id, message, tone: "error" };
}

export { createFieldError, createFieldHelp };
export type { FieldMessage };

export {
  applyRuntimeWorkflowStatus,
  findRuntimeFormField,
  isRuntimeFormValueEmpty,
  RuntimeFormScaffold,
  validateRuntimeForm,
} from "./runtime-form";
export type {
  RuntimeFormChoiceLayout,
  RuntimeFormCommitMode,
  RuntimeFormDefinition,
  RuntimeFormFieldDefinition,
  RuntimeFormFieldOption,
  RuntimeFormFieldLabelLayout,
  RuntimeFormFieldType,
  RuntimeFormFieldWidth,
  RuntimeFormLabels,
  RuntimeFormMode,
  RuntimeFormSaveState,
  RuntimeFormScaffoldProps,
  RuntimeFormSectionDefinition,
  RuntimeFormValidationErrors,
  RuntimeFormValue,
  RuntimeFormValues,
  RuntimeWorkflowStatusBinding,
} from "./runtime-form";
export {
  createRuntimeFormFixture,
  createRuntimeFormFixtureDefinition,
} from "./runtime-form-fixtures";
export type {
  RuntimeFormFixture,
  RuntimeFormFixtureInput,
} from "./runtime-form-fixtures";
