import {
  Button,
  Input,
  Label,
  Select,
} from "@platform/ui-kit";

import { type FormBuilderRuleCondition, type FormBuilderRuleOperator } from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";
import {
  getFieldById,
  getScalarInputType,
  type FormBuilderTranslationFn,
} from "./filter-condition-editor-helpers";
import {
  createNextRuleConditionForField,
  createNextRuleConditionForOperator,
  getDefaultRuleScalarValue,
  getRuleOperatorKey,
  getRuleOperatorOptions,
  parseRuleScalarValue,
  ruleOperatorNeedsValue,
  ruleOperatorUsesArray,
  stringifyRuleScalarValue,
} from "./rule-condition-editor-helpers";

type RuleConditionEditorProps = {
  allowRemove?: boolean;
  condition: FormBuilderRuleCondition;
  disabled: boolean;
  fields: ReadonlyArray<FormsPlaceholderField>;
  idPrefix: string;
  onChange: (condition: FormBuilderRuleCondition) => void;
  onRemove: () => void;
  t: FormBuilderTranslationFn;
};

export function RuleConditionEditor({
  allowRemove = true,
  condition,
  disabled,
  fields,
  idPrefix,
  onChange,
  onRemove,
  t,
}: RuleConditionEditorProps) {
  const field = getFieldById(fields, condition.fieldId) ?? fields[0] ?? null;
  if (!field) {
    return null;
  }

  const operatorOptions = getRuleOperatorOptions(field);
  const operator = operatorOptions.includes(condition.operator)
    ? condition.operator
    : operatorOptions[0];
  const usesArray = ruleOperatorUsesArray(operator);
  const needsValue = ruleOperatorNeedsValue(operator);
  const scalarValue = usesArray
    ? undefined
    : condition.value ?? getDefaultRuleScalarValue(field);
  const arrayValue = usesArray
    ? (condition.values?.length ? [...condition.values] : [String(getDefaultRuleScalarValue(field))])
    : [];

  return (
    <div className="tenant-web__platform-studio-filter-card">
      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor={`${idPrefix}-field`}>
          {t("tenant.platformStudio.forms.builder.filter.fieldLabel")}
        </Label>
        <Select
          disabled={disabled}
          id={`${idPrefix}-field`}
          onChange={(event) => {
            const nextCondition = createNextRuleConditionForField(condition, fields, event.target.value);
            if (nextCondition) {
              onChange(nextCondition);
            }
          }}
          value={field.id}
        >
          {fields.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="tenant-web__platform-studio-form-group">
        <Label htmlFor={`${idPrefix}-operator`}>
          {t("tenant.platformStudio.forms.builder.rule.operatorLabel")}
        </Label>
        <Select
          disabled={disabled}
          id={`${idPrefix}-operator`}
          onChange={(event) => onChange(createNextRuleConditionForOperator(
            condition,
            field,
            event.target.value as FormBuilderRuleOperator,
          ))}
          value={operator}
        >
          {operatorOptions.map((item) => (
            <option key={item} value={item}>
              {t(getRuleOperatorKey(item))}
            </option>
          ))}
        </Select>
      </div>

      {needsValue ? (
        <div className="tenant-web__platform-studio-form-group">
          <Label htmlFor={`${idPrefix}-value`}>
            {t("tenant.platformStudio.forms.builder.rule.valueLabel")}
          </Label>
          {field.kind === "boolean" && !usesArray ? (
            <Select
              disabled={disabled}
              id={`${idPrefix}-value`}
              onChange={(event) => onChange({
                ...condition,
                fieldId: field.id,
                operator,
                value: event.target.value === "true",
                values: undefined,
              })}
              value={stringifyRuleScalarValue(scalarValue)}
            >
              <option value="true">{t("tenant.platformStudio.forms.builder.boolean.true")}</option>
              <option value="false">{t("tenant.platformStudio.forms.builder.boolean.false")}</option>
            </Select>
          ) : field.kind === "single_select" && field.options?.length && !usesArray ? (
            <Select
              disabled={disabled}
              id={`${idPrefix}-value`}
              onChange={(event) => onChange({
                ...condition,
                fieldId: field.id,
                operator,
                value: event.target.value,
                values: undefined,
              })}
              value={stringifyRuleScalarValue(scalarValue)}
            >
              <option value="">{t("tenant.platformStudio.forms.builder.rule.noValue")}</option>
              {field.options.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          ) : usesArray ? (
            <Input
              disabled={disabled}
              id={`${idPrefix}-value`}
              onChange={(event) => onChange({
                ...condition,
                fieldId: field.id,
                operator,
                value: undefined,
                values: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item) => parseRuleScalarValue(field, item)),
              })}
              value={arrayValue.map((item) => stringifyRuleScalarValue(item)).join(", ")}
            />
          ) : (
            <Input
              disabled={disabled}
              id={`${idPrefix}-value`}
              onChange={(event) => onChange({
                ...condition,
                fieldId: field.id,
                operator,
                value: parseRuleScalarValue(field, event.target.value),
                values: undefined,
              })}
              type={getScalarInputType(field.kind)}
              value={stringifyRuleScalarValue(scalarValue)}
            />
          )}
        </div>
      ) : null}

      {allowRemove ? (
        <div className="tenant-web__platform-studio-button-row">
          <Button disabled={disabled} onClick={onRemove} size="sm" variant="ghost">
            {t("tenant.platformStudio.forms.builder.rule.removeCondition")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
