import {
  type FormBuilderFilterScalar,
  type FormBuilderLookupDynamicToken,
  type FormBuilderLookupFilterClause,
  type FormBuilderLookupFilterCondition,
  type FormBuilderLookupPreset,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";

export const lookupDynamicTokenOptions = [
  "current_user_id",
  "current_user_company_id",
  "current_user_division_id",
  "current_user_company_name",
  "current_user_division_name",
  "assigned_projects",
] as const satisfies ReadonlyArray<FormBuilderLookupDynamicToken>;

export type LookupClauseDefinition = {
  clauseKey: string;
  defaultDynamicToken?: FormBuilderLookupDynamicToken;
  defaultValue?: FormBuilderFilterScalar;
  literalOptions?: ReadonlyArray<{
    label: string;
    value: string;
  }>;
  tokenOptions?: ReadonlyArray<FormBuilderLookupDynamicToken>;
  valueMode: FormBuilderLookupFilterClause["valueMode"];
};

const mockBusinessUnitTypeOptions = [
  { label: "Business Unit", value: "business_unit" },
  { label: "Division", value: "division" },
  { label: "Department", value: "department" },
  { label: "Vendor", value: "vendor" },
] as const;

const mockBusinessUnitOptions = [
  { label: "Roofing", value: "roofing" },
  { label: "Electrical", value: "electrical" },
  { label: "Safety", value: "safety" },
  { label: "Operations", value: "operations" },
] as const;

const lookupClauseDefinitionsByPreset: Record<
  Exclude<FormBuilderLookupPreset, "generic_db_lookup">,
  ReadonlyArray<LookupClauseDefinition>
> = {
  company_lookup: [
    { clauseKey: "business_unit_type", literalOptions: mockBusinessUnitTypeOptions, valueMode: "literal" },
    { clauseKey: "business_unit_name", valueMode: "literal" },
    { clauseKey: "main_company_name", valueMode: "literal" },
    {
      clauseKey: "business_unit_scope",
      defaultDynamicToken: "current_user_company_id",
      tokenOptions: ["current_user_company_id", "current_user_division_id"],
      valueMode: "dynamic_token",
    },
    {
      clauseKey: "main_company_scope",
      defaultDynamicToken: "current_user_company_name",
      tokenOptions: ["current_user_company_name", "current_user_division_name"],
      valueMode: "dynamic_token",
    },
  ],
  contact_lookup: [
    {
      clauseKey: "active_account",
      defaultValue: false,
      valueMode: "boolean_flag",
    },
    {
      clauseKey: "by_user_company",
      defaultValue: false,
      valueMode: "boolean_flag",
    },
  ],
  project_lookup: [
    { clauseKey: "business_unit_id", literalOptions: mockBusinessUnitOptions, valueMode: "literal" },
    {
      clauseKey: "assigned_projects",
      defaultDynamicToken: "assigned_projects",
      tokenOptions: ["assigned_projects"],
      valueMode: "dynamic_token",
    },
  ],
};

export function getLookupDynamicTokenKey(token: FormBuilderLookupDynamicToken) {
  return `tenant.platformStudio.forms.builder.filter.lookupToken.${token}`;
}

export function getLookupClauseKey(clauseKey: string) {
  return `tenant.platformStudio.forms.builder.filter.lookupClause.${clauseKey}`;
}

export function getLookupPresetFromField(field: FormsPlaceholderField): FormBuilderLookupPreset {
  if (field.preset === "contact_lookup" || field.preset === "company_lookup" || field.preset === "project_lookup") {
    return field.preset;
  }

  return "generic_db_lookup";
}

export function isPresetLookupField(field: FormsPlaceholderField) {
  return field.kind === "db_lookup" && (
    field.preset === "contact_lookup" ||
    field.preset === "company_lookup" ||
    field.preset === "project_lookup"
  );
}

function createLookupClauseId(clauseKey: string) {
  return `lookup-clause-${clauseKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultLookupClause(definition: LookupClauseDefinition): FormBuilderLookupFilterClause {
  if (definition.valueMode === "dynamic_token") {
    return {
      clauseKey: definition.clauseKey,
      dynamicToken: definition.defaultDynamicToken ?? definition.tokenOptions?.[0] ?? lookupDynamicTokenOptions[0],
      id: createLookupClauseId(definition.clauseKey),
      valueMode: "dynamic_token",
    };
  }

  if (definition.valueMode === "boolean_flag") {
    return {
      clauseKey: definition.clauseKey,
      id: createLookupClauseId(definition.clauseKey),
      value: typeof definition.defaultValue === "boolean" ? definition.defaultValue : true,
      valueMode: "boolean_flag",
    };
  }

  return {
    clauseKey: definition.clauseKey,
    id: createLookupClauseId(definition.clauseKey),
    value: definition.defaultValue ?? "",
    valueMode: "literal",
  };
}

function normalizeLookupClauseForDefinition(
  clause: FormBuilderLookupFilterClause,
  definition: LookupClauseDefinition,
): FormBuilderLookupFilterClause {
  if (definition.valueMode === "boolean_flag") {
    return {
      clauseKey: definition.clauseKey,
      id: clause.id,
      value: typeof clause.value === "boolean"
        ? clause.value
        : typeof definition.defaultValue === "boolean"
          ? definition.defaultValue
          : true,
      valueMode: "boolean_flag",
    };
  }

  if (definition.valueMode === "dynamic_token") {
    const tokenOptions = definition.tokenOptions ?? lookupDynamicTokenOptions;
    const dynamicToken = clause.dynamicToken && tokenOptions.includes(clause.dynamicToken)
      ? clause.dynamicToken
      : definition.defaultDynamicToken ?? tokenOptions[0] ?? lookupDynamicTokenOptions[0];

    return {
      clauseKey: definition.clauseKey,
      dynamicToken,
      id: clause.id,
      valueMode: "dynamic_token",
    };
  }

  return {
    clauseKey: definition.clauseKey,
    id: clause.id,
    value: typeof clause.value === "string" || typeof clause.value === "number" || typeof clause.value === "boolean"
      ? clause.value
      : definition.defaultValue ?? "",
    valueMode: "literal",
  };
}

export function getLookupClauseDefinitions(
  lookupPreset: FormBuilderLookupPreset,
) {
  if (lookupPreset === "generic_db_lookup") {
    return [];
  }

  return lookupClauseDefinitionsByPreset[lookupPreset];
}

export function sanitizeLookupFilterCondition(
  condition: FormBuilderLookupFilterCondition,
): FormBuilderLookupFilterCondition {
  const definitions = getLookupClauseDefinitions(condition.lookupPreset);
  if (definitions.length === 0) {
    return {
      ...condition,
      clauses: [],
    };
  }

  const clauses = definitions
    .flatMap((definition) => {
      const existingClause = condition.clauses.find((entry) => entry.clauseKey === definition.clauseKey);
      return existingClause
        ? [normalizeLookupClauseForDefinition(existingClause, definition)]
        : [];
    })
    .filter((clause) => clause.valueMode !== "boolean_flag" || Boolean(clause.value));

  return {
    ...condition,
    clauses,
  };
}
