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
  findFirstRuntimeChecklistRequiredError,
  findRuntimeFormField,
  isRuntimeFormValueEmpty,
  RuntimeFormScaffold,
  validateRuntimeForm,
} from "./runtime-form";
export type {
  RuntimeFormAccordionLayoutDefinition,
  RuntimeFormActiveTabs,
  RuntimeFormChoiceLayout,
  RuntimeFormChoiceOptionStyleVariant,
  RuntimeFormChoiceOrientation,
  RuntimeFormChoiceRenderStyle,
  RuntimeFormChecklistDetailDefinition,
  RuntimeFormChecklistData,
  RuntimeFormChecklistGroup,
  RuntimeFormChecklistItem,
  RuntimeFormChecklistItemChange,
  RuntimeFormChecklistOption,
  RuntimeFormChecklistRevealRequest,
  RuntimeFormCommitMode,
  RuntimeFormChecklistRequiredError,
  RuntimeFormContentAlignment,
  RuntimeFormContentDefinition,
  RuntimeFormContentType,
  RuntimeFormDefinition,
  RuntimeFormDividerLayoutDefinition,
  RuntimeFormFieldDefinition,
  RuntimeFormFieldChangeMeta,
  RuntimeFormFieldOption,
  RuntimeFormFieldLabelLayout,
  RuntimeFormFieldType,
  RuntimeFormFieldWidth,
  RuntimeFormGeoPoint,
  RuntimeFormGeoPointResolver,
  RuntimeFormGridLayoutDefinition,
  RuntimeFormGroupLayoutDefinition,
  RuntimeFormInputMode,
  RuntimeFormLabels,
  RuntimeFormLayoutDefinition,
  RuntimeFormLookupDefinition,
  RuntimeFormLookupDisplayMode,
  RuntimeFormLookupFilter,
  RuntimeFormLookupFilterOperator,
  RuntimeFormLookupFilterScalar,
  RuntimeFormLookupLoader,
  RuntimeFormLookupOption,
  RuntimeFormLookupOptionsRequest,
  RuntimeFormLookupOptionsResponse,
  RuntimeFormLookupSelectionMode,
  RuntimeFormLookupValueMode,
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
  RuntimeFormSubformActions,
  RuntimeFormSubformCell,
  RuntimeFormSubformColumnDefinition,
  RuntimeFormSubformColumnType,
  RuntimeFormSubformData,
  RuntimeFormSubformDataById,
  RuntimeFormSubformDefinition,
  RuntimeFormSubformRow,
  RuntimeFormSubformSortDirection,
  RuntimeFormTabsLayoutDefinition,
  RuntimeFormTabsSize,
  RuntimeFormTabsVariant,
  RuntimeFormTextInputType,
  RuntimeFormTextValidation,
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
