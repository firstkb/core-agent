export type FormBuilderFilterToken =
  | "currentUser.companyId"
  | "currentUser.companyName"
  | "currentUser.divisionId"
  | "currentUser.divisionName"
  | "currentUser.projectAccessIds";
export type FormBuilderLookupDynamicToken =
  | "assigned_projects"
  | "current_user_company_id"
  | "current_user_company_name"
  | "current_user_division_id"
  | "current_user_division_name"
  | "current_user_id";
export type FormBuilderLookupPreset =
  | "company_lookup"
  | "contact_lookup"
  | "generic_db_lookup"
  | "project_lookup";
export type FormBuilderRelativeDatePreset =
  | "current_month"
  | "current_quarter"
  | "current_week"
  | "current_year"
  | "last_12_months"
  | "last_month"
  | "last_quarter"
  | "last_week"
  | "last_year"
  | "next_3_days"
  | "next_5_days"
  | "next_7_days"
  | "next_month"
  | "next_quarter"
  | "next_week"
  | "next_year"
  | "today_or_earlier"
  | "today_or_later";
export type FormBuilderFilterScalar = boolean | number | string;
export type FormBuilderFilterValueSource =
  | {
      kind: "literal";
      value: FormBuilderFilterScalar;
    }
  | {
      kind: "literal_array";
      value: ReadonlyArray<FormBuilderFilterScalar>;
    }
  | {
      kind: "token";
      token: FormBuilderFilterToken;
    }
  | {
      end: FormBuilderFilterScalar;
      kind: "scalar_range";
      start: FormBuilderFilterScalar;
    }
  | {
      kind: "relative_date";
      preset: FormBuilderRelativeDatePreset;
    };
export type FormBuilderFilterOperator =
  | "between"
  | "contains"
  | "eq"
  | "gt"
  | "gte"
  | "in"
  | "is_empty"
  | "is_not_empty"
  | "lt"
  | "lte"
  | "neq"
  | "not_contains"
  | "relative_date";
export type FormBuilderRuleOperator =
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
export type FormBuilderLookupFilterClause = {
  clauseKey: string;
  dynamicToken?: FormBuilderLookupDynamicToken;
  id: string;
  value?: FormBuilderFilterScalar;
  valueMode: "boolean_flag" | "dynamic_token" | "literal";
};
export type FormBuilderScalarFilterCondition = {
  fieldId: string;
  operator: FormBuilderFilterOperator;
  valueSource?: FormBuilderFilterValueSource;
};
export type FormBuilderLookupFilterCondition = {
  clauses: ReadonlyArray<FormBuilderLookupFilterClause>;
  editorType: "lookup";
  fieldId: string;
  lookupPreset: FormBuilderLookupPreset;
};
export type FormBuilderFilterCondition =
  | FormBuilderLookupFilterCondition
  | FormBuilderScalarFilterCondition;
export type FormBuilderRuleScalar = boolean | number | string;
export type FormBuilderRuleCondition = {
  fieldId: string;
  id: string;
  operator: FormBuilderRuleOperator;
  value?: FormBuilderRuleScalar;
  values?: ReadonlyArray<FormBuilderRuleScalar>;
};
export type FormBuilderVisibilityRule = {
  effect: "hide" | "show";
  id: string;
  when: {
    all: ReadonlyArray<FormBuilderRuleCondition>;
  };
};
export type FormBuilderRequirementRule = {
  effect: "optional" | "required";
  id: string;
  when: {
    all: ReadonlyArray<FormBuilderRuleCondition>;
  };
};
export type FormBuilderNodeRules = {
  requirementRules: ReadonlyArray<FormBuilderRequirementRule>;
  visibilityRules: ReadonlyArray<FormBuilderVisibilityRule>;
};
export type FormBuilderFilterGroup = {
  conditions: ReadonlyArray<FormBuilderFilterCondition>;
  logic: "and";
};
export type FormBuilderQuickFilter = {
  color?: string;
  conditions: ReadonlyArray<FormBuilderFilterCondition>;
  id: string;
  label: string;
  logic: "and";
};
export type FormBuilderFilterDefinitions = {
  defaultFilters: FormBuilderFilterGroup;
  quickFilters: ReadonlyArray<FormBuilderQuickFilter>;
  version: 1;
};
