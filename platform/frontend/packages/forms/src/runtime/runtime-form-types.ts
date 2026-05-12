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
export type RuntimeFormInputMode =
  | "decimal"
  | "email"
  | "none"
  | "numeric"
  | "search"
  | "tel"
  | "text"
  | "url";
export type RuntimeFormTextInputType = "email" | "tel" | "text" | "url";
export type RuntimeFormTextValidation = "email" | "phone" | "url";
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
export type RuntimeFormActiveTabs = Record<string, string>;
export type RuntimeFormSubformColumnType = "badge" | "boolean" | "date" | "date_time" | "html" | "text";
export type RuntimeFormSubformSortDirection = "asc" | "desc";

export type RuntimeFormFieldOption = {
  description?: ReactNode;
  fields?: Record<string, string>;
  label: string;
  styleVariant?: RuntimeFormChoiceOptionStyleVariant;
  value: string;
};

export type RuntimeFormLookupDisplayMode = "catalog_modal" | "search_select";
export type RuntimeFormLookupSelectionMode = "multiple" | "single";
export type RuntimeFormLookupValueMode = "stored_value" | "text";
export type RuntimeFormLookupFilterOperator =
  | "contains"
  | "eq"
  | "in"
  | "is_empty"
  | "is_not_empty"
  | "not_eq"
  | "starts_with";
export type RuntimeFormLookupFilterScalar = boolean | number | string;

export type RuntimeFormLookupFilter = {
  field: string;
  operator?: RuntimeFormLookupFilterOperator;
  value?: RuntimeFormLookupFilterScalar | ReadonlyArray<RuntimeFormLookupFilterScalar>;
};

export type RuntimeFormLookupDefinition = {
  dictionary?: string;
  displayFields?: ReadonlyArray<string>;
  displayMode: RuntimeFormLookupDisplayMode;
  displayTemplate?: string;
  filters?: ReadonlyArray<RuntimeFormLookupFilter>;
  preset?: string;
  searchFields?: ReadonlyArray<string>;
  selectionMode: RuntimeFormLookupSelectionMode;
  sortField?: string;
  sourceModel?: string;
  storedTextFields?: ReadonlyArray<string>;
  storedValueField?: string;
  valueMode: RuntimeFormLookupValueMode;
};

export type RuntimeFormLookupOption = {
  description?: string;
  fields?: Record<string, string>;
  label: string;
  value: string;
};

export type RuntimeFormLookupOptionsRequest = {
  fieldId: string;
  ids?: ReadonlyArray<string>;
  lookup: RuntimeFormLookupDefinition;
  page: number;
  pageSize: number;
  search?: string;
};

export type RuntimeFormLookupOptionsResponse = {
  hasMore: boolean;
  options: ReadonlyArray<RuntimeFormLookupOption>;
};

export type RuntimeFormFieldChangeMeta = {
  lookupLabels?: Record<string, string>;
};

export type RuntimeFormLookupLoader = (
  request: RuntimeFormLookupOptionsRequest,
) => Promise<RuntimeFormLookupOptionsResponse>;

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
  autocomplete?: string;
  choiceAllowEmpty?: boolean;
  choiceLayout?: RuntimeFormChoiceLayout;
  choiceOrientation?: RuntimeFormChoiceOrientation;
  choiceRenderStyle?: RuntimeFormChoiceRenderStyle;
  disabled?: boolean;
  helperText?: ReactNode;
  id: string;
  inputMode?: RuntimeFormInputMode;
  inputType?: RuntimeFormTextInputType;
  label: string;
  labelLayout?: RuntimeFormFieldLabelLayout;
  lookup?: RuntimeFormLookupDefinition;
  mask?: string;
  nodeType?: "field";
  options?: ReadonlyArray<RuntimeFormFieldOption>;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  rows?: number;
  rules?: RuntimeFormNodeRules;
  type: RuntimeFormFieldType;
  validation?: RuntimeFormTextValidation;
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

export type RuntimeFormSubformColumnDefinition = {
  fieldId: string;
  id: string;
  label: string;
  type: RuntimeFormSubformColumnType;
};

export type RuntimeFormSubformActions = {
  canAdd: boolean;
  canDelete: boolean;
  canEdit: boolean;
};

export type RuntimeFormSubformDefinition = {
  actions: RuntimeFormSubformActions;
  columns: ReadonlyArray<RuntimeFormSubformColumnDefinition>;
  defaultSort?: {
    columnId: string;
    direction: RuntimeFormSubformSortDirection;
  };
  id: string;
  nodeType: "subform";
  rules?: RuntimeFormNodeRules;
  schemaScopeId: string;
  subformType: string;
  tableKey: string;
  title: ReactNode;
  width?: RuntimeFormFieldWidth;
};

export type RuntimeFormSubformCell = {
  displayValue?: string;
  html?: string;
  label?: string;
  value: boolean | number | string;
};

export type RuntimeFormSubformRow = {
  cells: Record<string, RuntimeFormSubformCell>;
  id: string;
};

export type RuntimeFormSubformData = {
  rows: ReadonlyArray<RuntimeFormSubformRow>;
};

export type RuntimeFormSubformDataById = Record<string, RuntimeFormSubformData | undefined>;

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
  | RuntimeFormLayoutDefinition
  | RuntimeFormSubformDefinition;

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
  booleanNo: string;
  booleanYes: string;
  catalogEmpty: ReactNode;
  catalogGroupOther: string;
  catalogLoadError: ReactNode;
  catalogLoading: ReactNode;
  catalogNoSelection: ReactNode;
  catalogOpen: string;
  catalogRetry: ReactNode;
  catalogSearchPlaceholder: string;
  catalogSelect: ReactNode;
  createModeInfo: ReactNode;
  createTitle: ReactNode;
  editModeInfo: ReactNode;
  editTitle: ReactNode;
  emptyValue: string;
  finish: ReactNode;
  finishBackInfoActionTemplate: string;
  finishBackInfoCreateBackTemplate: string;
  finishBackInfoEditBackTemplate: string;
  finishBackInfoStatusTemplate: string;
  finishBackInfo?: ReactNode;
  generatedAccordionItemTitle: ReactNode;
  generatedOutputLabel: string;
  generatedSubformTitle: ReactNode;
  generatedTabTitle: ReactNode;
  invalidEmailError: string;
  invalidMaskError: string;
  invalidPhoneError: string;
  invalidUrlError: string;
  loadMore: ReactNode;
  noOptions: ReactNode;
  onlineFormTitle: ReactNode;
  requiredError: string;
  search: string;
  saveStates: Record<RuntimeFormSaveState, ReactNode>;
  selectPlaceholder: string;
  selectValuesPlaceholder: string;
  subformAdd: ReactNode;
  subformDelete: ReactNode;
  subformEdit: ReactNode;
  subformEmpty: ReactNode;
  validationFillField: string;
  validationFillFieldCorrectly: string;
};

export type RuntimeFormLabels = Partial<Omit<RuntimeFormResolvedLabels, "saveStates">> & {
  saveStates?: Partial<Record<RuntimeFormSaveState, ReactNode>>;
};

export type RuntimeFormScaffoldProps = {
  className?: string;
  definition: RuntimeFormDefinition;
  errors?: RuntimeFormValidationErrors;
  labels?: RuntimeFormLabels;
  activeTabs?: RuntimeFormActiveTabs;
  onActiveTabChange?: (layoutId: string, tabId: string) => void;
  onBack: () => void;
  onFieldChange: (
    fieldId: string,
    value: RuntimeFormValue,
    field: RuntimeFormFieldDefinition,
    meta?: RuntimeFormFieldChangeMeta,
  ) => void;
  onFinish: () => void;
  loadLookupOptions?: RuntimeFormLookupLoader;
  onSubformAdd?: (subform: RuntimeFormSubformDefinition) => void;
  onSubformDelete?: (subform: RuntimeFormSubformDefinition, row: RuntimeFormSubformRow) => void;
  onSubformEdit?: (subform: RuntimeFormSubformDefinition, row: RuntimeFormSubformRow) => void;
  revealFieldId?: string;
  revealRequestKey?: number;
  saveState?: RuntimeFormSaveState;
  subforms?: RuntimeFormSubformDataById;
  values: RuntimeFormValues;
};
