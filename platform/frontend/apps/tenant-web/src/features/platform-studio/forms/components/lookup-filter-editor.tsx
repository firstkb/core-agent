import {
  Input,
  Label,
  Select,
  Switch,
} from "@platform/ui-kit";

import {
  type FormBuilderLookupDynamicToken,
  type FormBuilderLookupFilterCondition,
} from "../forms-builder-state";
import { type FormBuilderTranslationFn } from "./filter-condition-editor-helpers";
import {
  createDefaultLookupClause,
  getLookupClauseDefinitions,
  getLookupClauseKey,
  getLookupDynamicTokenKey,
  lookupDynamicTokenOptions,
} from "./lookup-filter-editor-helpers";

type LookupFilterEditorProps = {
  condition: FormBuilderLookupFilterCondition;
  disabled: boolean;
  onChange: (condition: FormBuilderLookupFilterCondition) => void;
  t: FormBuilderTranslationFn;
};

export function LookupFilterEditor({
  condition,
  disabled,
  onChange,
  t,
}: LookupFilterEditorProps) {
  const clauseDefinitions = getLookupClauseDefinitions(condition.lookupPreset);
  if (clauseDefinitions.length === 0) {
    return (
      <p className="tenant-web__platform-studio-inline-help">
        {t("tenant.platformStudio.forms.builder.filter.genericLookupFallback")}
      </p>
    );
  }

  return (
    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
      {clauseDefinitions.map((definition) => {
        const clause = condition.clauses.find((entry) => entry.clauseKey === definition.clauseKey)
          ?? createDefaultLookupClause(definition);

        if (definition.valueMode === "boolean_flag") {
          return (
            <div className="tenant-web__platform-studio-switch-row" key={definition.clauseKey}>
              <span className="tenant-web__platform-studio-compact-row-label">
                {t(getLookupClauseKey(definition.clauseKey))}
              </span>
              <Switch
                checked={condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey && Boolean(entry.value))}
                disabled={disabled}
                onCheckedChange={(checked) => onChange({
                  ...condition,
                  clauses: checked
                    ? condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey)
                      ? condition.clauses.map((entry) =>
                          entry.clauseKey === definition.clauseKey
                            ? {
                                ...entry,
                                value: true,
                              }
                            : entry,
                        )
                      : [...condition.clauses, { ...clause, value: true }]
                    : condition.clauses.filter((entry) => entry.clauseKey !== definition.clauseKey),
                })}
                size="sm"
              />
            </div>
          );
        }

        if (definition.valueMode === "dynamic_token") {
          const tokenOptions = definition.tokenOptions ?? lookupDynamicTokenOptions;
          const selectedToken = clause.dynamicToken ?? definition.defaultDynamicToken ?? tokenOptions[0];

          if (tokenOptions.length <= 1) {
            return (
              <div className="tenant-web__platform-studio-compact-row" key={definition.clauseKey}>
                <div className="tenant-web__platform-studio-compact-row-main">
                  <span className="tenant-web__platform-studio-compact-row-label">
                    {t(getLookupClauseKey(definition.clauseKey))}
                  </span>
                  <span className="tenant-web__platform-studio-compact-row-summary">
                    {t(getLookupDynamicTokenKey(selectedToken))}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div className="tenant-web__platform-studio-form-group" key={definition.clauseKey}>
              <Label htmlFor={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}>
                {t(getLookupClauseKey(definition.clauseKey))}
              </Label>
              <Select
                disabled={disabled}
                id={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}
                onChange={(event) => onChange({
                  ...condition,
                  clauses: condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey)
                    ? condition.clauses.map((entry) =>
                        entry.clauseKey === definition.clauseKey
                          ? {
                              ...entry,
                              dynamicToken: event.target.value as FormBuilderLookupDynamicToken,
                            }
                          : entry,
                      )
                    : [...condition.clauses, {
                        ...clause,
                        dynamicToken: event.target.value as FormBuilderLookupDynamicToken,
                      }],
                })}
                value={selectedToken}
              >
                {tokenOptions.map((token) => (
                  <option key={token} value={token}>
                    {t(getLookupDynamicTokenKey(token))}
                  </option>
                ))}
              </Select>
            </div>
          );
        }

        return (
          <div className="tenant-web__platform-studio-form-group" key={definition.clauseKey}>
            <Label htmlFor={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}>
              {t(getLookupClauseKey(definition.clauseKey))}
            </Label>
            {definition.literalOptions ? (
              <Select
                disabled={disabled}
                id={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}
                onChange={(event) => onChange({
                  ...condition,
                  clauses: condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey)
                    ? condition.clauses.map((entry) =>
                        entry.clauseKey === definition.clauseKey
                          ? {
                              ...entry,
                              value: event.target.value,
                            }
                          : entry,
                      )
                    : [...condition.clauses, {
                        ...clause,
                        value: event.target.value,
                      }],
                })}
                value={typeof clause.value === "string" || typeof clause.value === "number" ? String(clause.value) : ""}
              >
                <option value="">{t("tenant.platformStudio.forms.builder.systemField.unbound")}</option>
                {definition.literalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                disabled={disabled}
                id={`tenant-platform-studio-lookup-clause-${definition.clauseKey}`}
                onChange={(event) => onChange({
                  ...condition,
                  clauses: condition.clauses.some((entry) => entry.clauseKey === definition.clauseKey)
                    ? condition.clauses.map((entry) =>
                        entry.clauseKey === definition.clauseKey
                          ? {
                              ...entry,
                              value: event.target.value,
                            }
                          : entry,
                      )
                    : [...condition.clauses, {
                        ...clause,
                        value: event.target.value,
                      }],
                })}
                value={typeof clause.value === "string" || typeof clause.value === "number" ? String(clause.value) : ""}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
