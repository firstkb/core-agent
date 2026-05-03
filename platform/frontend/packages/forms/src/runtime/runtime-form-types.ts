import type { ReactNode } from "react";

export type RuntimeFormMode = "create" | "edit";
export type RuntimeFormCommitMode = "autosave" | "finish";
export type RuntimeFormSaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export type RuntimeFormFieldType =
  | "short_text"
  | "long_text"
  | "rich_text"
  | "integer"
  | "decimal"
  | "currency"
  | "boolean"
  | "date"
  | "date_time"
  | "single_select"
  | "multi_select"
  | "radio"
  | "readonly"
  | "system";

export type RuntimeFormFieldWidth = "full" | "half";
export type RuntimeFormFieldLabelLayout = "stacked" | "responsive-inline";
export type RuntimeFormChoiceLayout = "inline" | "stacked";
export type RuntimeFormChoiceOrientation = "horizontal" | "vertical";
export type RuntimeFormChoiceRenderStyle = "buttons" | "native";
export type RuntimeFormChoiceOptionStyleVariant =
  | "danger"
  | "default"
  | "info"
  | "primary"
  | "secondary"
  | "success"
  | "warning";
export type RuntimeFormTabsSize = "sm" | "md" | "lg";
export type RuntimeFormTabsVariant = "surface" | "line";
export type RuntimeFormValue = string | boolean | ReadonlyArray<string>;
export type RuntimeFormValues = Record<string, RuntimeFormValue | undefined>;
export type RuntimeFormValidationErrors = Record<string, string | undefined>;

export type RuntimeFormFieldOption = {
  label: string;
  styleVariant?: RuntimeFormChoiceOptionStyleVariant;
  value: string;
};

export type RuntimeFormRuleOperator =
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "is_empty"
  | "not_empty"
  | "gt"
  | "gte"
  | "lt"
  | "lte";

export type RuntimeFormRuleValue = string | number | boolean;

export type RuntimeFormRuleCondition = {
  fieldId: string;
  operator: RuntimeFormRuleOperator;
  value?: RuntimeFormRuleValue;
  values?: ReadonlyArray<RuntimeFormRuleValue>;
};

export type RuntimeFormRuleClause = {
  all: ReadonlyArray<RuntimeFormRuleCondition>;
};

export type RuntimeFormVisibilityRule = {
  effect: "show" | "hide";
  id: string;
  when: RuntimeFormRuleClause;
};

export type RuntimeFormRequirementRule = {
  effect: "required" | "optional";
  id: string;
  when: RuntimeFormRuleClause;
};

export type RuntimeFormNodeRules = {
  requirementRules?: ReadonlyArray<RuntimeFormRequirementRule>;
  visibilityRules?: ReadonlyArray<RuntimeFormVisibilityRule>;
};

export type RuntimeFormFieldDefinition = {
  choiceAllowEmpty?: boolean;
  choiceLayout?: RuntimeFormChoiceLayout;
  choiceOrientation?: RuntimeFormChoiceOrientation;
  choiceRenderStyle?: RuntimeFormChoiceRenderStyle;
  disabled?: boolean;
  helperText?: ReactNode;
  id: string;
  label: string;
  labelLayout?: RuntimeFormFieldLabelLayout;
  nodeType?: "field";
  options?: ReadonlyArray<RuntimeFormFieldOption>;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  rows?: number;
  rules?: RuntimeFormNodeRules;
  type: RuntimeFormFieldType;
  width?: RuntimeFormFieldWidth;
};

export type RuntimeFormContentAlignment = "left" | "center" | "right";
export type RuntimeFormContentType = "heading" | "text" | "rich_text_block" | "view_only_field";

export type RuntimeFormContentDefinition = {
  alignment?: RuntimeFormContentAlignment;
  content?: ReactNode;
  contentType: RuntimeFormContentType;
  id: string;
  label?: ReactNode;
  level?: 1 | 2 | 3 | 4;
  nodeType: "content";
  rules?: RuntimeFormNodeRules;
  styleVariant?: "default" | "muted" | "info";
  value?: ReactNode;
  width?: RuntimeFormFieldWidth;
};

export type RuntimeFormLayoutBase = {
  description?: ReactNode;
  id: string;
  nodeType: "layout";
  rules?: RuntimeFormNodeRules;
  title?: ReactNode;
  width?: RuntimeFormFieldWidth;
};

export type RuntimeFormGroupLayoutDefinition = RuntimeFormLayoutBase & {
  layoutType: "group";
  nodes: ReadonlyArray<RuntimeFormNodeDefinition>;
};

export type RuntimeFormGridLayoutDefinition = RuntimeFormLayoutBase & {
  columns?: 1 | 2 | 3;
  layoutType: "grid";
  nodes: ReadonlyArray<RuntimeFormNodeDefinition>;
};

export type RuntimeFormTabsLayoutDefinition = RuntimeFormLayoutBase & {
  defaultTabId?: string;
  layoutType: "tabs";
  scrollable?: boolean;
  size?: RuntimeFormTabsSize;
  styleVariant?: RuntimeFormTabsVariant;
  tabs: ReadonlyArray<{
    id: string;
    nodes: ReadonlyArray<RuntimeFormNodeDefinition>;
    title: ReactNode;
  }>;
};

export type RuntimeFormAccordionLayoutDefinition = RuntimeFormLayoutBase & {
  items: ReadonlyArray<{
    id: string;
    nodes: ReadonlyArray<RuntimeFormNodeDefinition>;
    title: ReactNode;
  }>;
  layoutType: "accordion";
};

export type RuntimeFormDividerLayoutDefinition = RuntimeFormLayoutBase & {
  label?: ReactNode;
  layoutType: "divider";
};

export type RuntimeFormSpacerLayoutDefinition = RuntimeFormLayoutBase & {
  layoutType: "spacer";
  size?: "sm" | "md" | "lg";
};

export type RuntimeFormLayoutDefinition =
  | RuntimeFormGroupLayoutDefinition
  | RuntimeFormGridLayoutDefinition
  | RuntimeFormTabsLayoutDefinition
  | RuntimeFormAccordionLayoutDefinition
  | RuntimeFormDividerLayoutDefinition
  | RuntimeFormSpacerLayoutDefinition;

export type RuntimeFormNodeDefinition =
  | RuntimeFormFieldDefinition
  | RuntimeFormContentDefinition
  | RuntimeFormLayoutDefinition;

export type RuntimeFormSectionDefinition = {
  description?: ReactNode;
  fields?: ReadonlyArray<RuntimeFormFieldDefinition>;
  id: string;
  nodes?: ReadonlyArray<RuntimeFormNodeDefinition>;
  title?: ReactNode;
};

export type RuntimeWorkflowStatusBinding = {
  fieldId: string;
  finalValue?: string;
  initialValue?: string;
};

export type RuntimeFormDefinition = {
  commitMode: RuntimeFormCommitMode;
  description?: ReactNode;
  id: string;
  mode: RuntimeFormMode;
  sections: ReadonlyArray<RuntimeFormSectionDefinition>;
  title: ReactNode;
  workflowStatus?: RuntimeWorkflowStatusBinding;
};

export type RuntimeFormResolvedLabels = {
  backToList: ReactNode;
  createModeInfo: ReactNode;
  editModeInfo: ReactNode;
  finish: ReactNode;
  finishBackInfo?: ReactNode;
  onlineFormTitle: ReactNode;
  requiredError: string;
  saveStates: Record<RuntimeFormSaveState, ReactNode>;
  selectPlaceholder: string;
};

export type RuntimeFormLabels = Partial<Omit<RuntimeFormResolvedLabels, "saveStates">> & {
  saveStates?: Partial<Record<RuntimeFormSaveState, ReactNode>>;
};

export type RuntimeFormScaffoldProps = {
  className?: string;
  definition: RuntimeFormDefinition;
  errors?: RuntimeFormValidationErrors;
  labels?: RuntimeFormLabels;
  onBack: () => void;
  onFieldChange: (fieldId: string, value: RuntimeFormValue, field: RuntimeFormFieldDefinition) => void;
  onFinish: () => void;
  revealFieldId?: string;
  revealRequestKey?: number;
  saveState?: RuntimeFormSaveState;
  values: RuntimeFormValues;
};
