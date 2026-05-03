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
  RuntimeFormAccordionLayoutDefinition,
  RuntimeFormChoiceLayout,
  RuntimeFormCommitMode,
  RuntimeFormContentAlignment,
  RuntimeFormContentDefinition,
  RuntimeFormContentType,
  RuntimeFormDefinition,
  RuntimeFormDividerLayoutDefinition,
  RuntimeFormFieldDefinition,
  RuntimeFormFieldOption,
  RuntimeFormFieldLabelLayout,
  RuntimeFormFieldType,
  RuntimeFormFieldWidth,
  RuntimeFormGridLayoutDefinition,
  RuntimeFormGroupLayoutDefinition,
  RuntimeFormLabels,
  RuntimeFormLayoutDefinition,
  RuntimeFormMode,
  RuntimeFormNodeDefinition,
  RuntimeFormNodeRules,
  RuntimeFormRequirementRule,
  RuntimeFormRuleCondition,
  RuntimeFormRuleOperator,
  RuntimeFormRuleValue,
  RuntimeFormSaveState,
  RuntimeFormScaffoldProps,
  RuntimeFormSectionDefinition,
  RuntimeFormSpacerLayoutDefinition,
  RuntimeFormTabsLayoutDefinition,
  RuntimeFormTabsSize,
  RuntimeFormTabsVariant,
  RuntimeFormValidationErrors,
  RuntimeFormValue,
  RuntimeFormValues,
  RuntimeFormVisibilityRule,
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
export {
  createRuntimeFormDefinitionFromSchema,
} from "./runtime-form-schema";
export type {
  RuntimeFormSchemaSource,
} from "./runtime-form-schema";
