import {
  Input,
  Label,
  Select,
} from "@platform/ui-kit";

import {
  type FormBuilderFilterCondition,
  type FormBuilderFilterOperator,
  type FormBuilderScalarFilterCondition,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";
import {
  createDefaultFilterCondition,
  createDefaultFilterValueSource,
  getFieldById,
  getFilterOperatorKey,
  getFilterOperatorOptions,
  getRelativeDatePresetKey,
  getScalarInputType,
  parseScalarInput,
  relativeDatePresetOptions,
  stringifyScalarValue,
  type FormBuilderTranslationFn,
} from "./filter-condition-editor-helpers";
import { LookupFilterEditor } from "./lookup-filter-editor";

type FilterConditionEditorProps = {
  condition: FormBuilderFilterCondition;
  disabled: boolean;
  fields: ReadonlyArray<FormsPlaceholderField>;
  idPrefix: string;
  onChange: (condition: FormBuilderFilterCondition) => void;
  onRemove: () => void;
  t: FormBuilderTranslationFn;
};

export function FilterConditionEditor({
  condition,
  disabled,
  fields,
  idPrefix,
  onChange,
  t,
}: FilterConditionEditorProps) {
  const field = getFieldById(fields, condition.fieldId) ?? fields[0] ?? null;
  if (!field) {
    return null;
  }

  if (field.kind === "db_lookup" && "editorType" in condition && condition.editorType === "lookup") {
    return (
      <div className="tenant-web__platform-studio-filter-card">
        <LookupFilterEditor
          condition={condition}
          disabled={disabled}
          onChange={onChange}
          t={t}
        />
      </div>
    );
  }

  const scalarCondition = condition as FormBuilderScalarFilterCondition;
  const operatorOptions = getFilterOperatorOptions(field);
  const operator = operatorOptions.includes(scalarCondition.operator)
    ? scalarCondition.operator
    : operatorOptions[0];
  const rawValueSource = scalarCondition.valueSource ?? createDefaultFilterValueSource(field, operator);
  const valueSource = rawValueSource?.kind === "token"
    ? createDefaultFilterValueSource(field, operator)
    : rawValueSource;

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
            const nextCondition = createDefaultFilterCondition(fields, event.target.value);
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
          {t("tenant.platformStudio.forms.builder.filter.operatorLabel")}
        </Label>
        <Select
          disabled={disabled}
          id={`${idPrefix}-operator`}
          onChange={(event) => {
            const nextOperator = event.target.value as FormBuilderFilterOperator;
            onChange({
              fieldId: field.id,
              operator: nextOperator,
              valueSource: createDefaultFilterValueSource(field, nextOperator),
            });
          }}
          value={operator}
        >
          {operatorOptions.map((item) => (
            <option key={item} value={item}>
              {t(getFilterOperatorKey(item))}
            </option>
          ))}
        </Select>
      </div>

      {(operator !== "is_empty" && operator !== "is_not_empty") ? (
        <>
          {valueSource?.kind === "literal" ? (
            <div className="tenant-web__platform-studio-form-group">
              <Label htmlFor={`${idPrefix}-value`}>
                {t("tenant.platformStudio.forms.builder.filter.valueLabel")}
              </Label>
              {field.kind === "boolean" ? (
                <Select
                  disabled={disabled}
                  id={`${idPrefix}-value`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      kind: "literal",
                      value: parseScalarInput(field, event.target.value),
                    },
                  })}
                  value={stringifyScalarValue(valueSource.value)}
                >
                  <option value="true">{t("tenant.platformStudio.forms.builder.boolean.true")}</option>
                  <option value="false">{t("tenant.platformStudio.forms.builder.boolean.false")}</option>
                </Select>
              ) : field.kind === "single_select" && field.options?.length ? (
                <Select
                  disabled={disabled}
                  id={`${idPrefix}-value`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      kind: "literal",
                      value: event.target.value,
                    },
                  })}
                  value={stringifyScalarValue(valueSource.value)}
                >
                  <option value="">{t("tenant.platformStudio.forms.builder.filter.emptyValue")}</option>
                  {field.options.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  disabled={disabled}
                  id={`${idPrefix}-value`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      kind: "literal",
                      value: parseScalarInput(field, event.target.value),
                    },
                  })}
                  type={getScalarInputType(field.kind)}
                  value={stringifyScalarValue(valueSource.value)}
                />
              )}
            </div>
          ) : null}

          {valueSource?.kind === "literal_array" ? (
            <div className="tenant-web__platform-studio-form-group">
              <Label htmlFor={`${idPrefix}-value-array`}>
                {t("tenant.platformStudio.forms.builder.filter.valueLabel")}
              </Label>
              <Input
                disabled={disabled}
                id={`${idPrefix}-value-array`}
                onChange={(event) => onChange({
                  fieldId: field.id,
                  operator,
                  valueSource: {
                    kind: "literal_array",
                    value: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  },
                })}
                value={valueSource.value.join(", ")}
              />
            </div>
          ) : null}

          {valueSource?.kind === "scalar_range" ? (
            <>
              <div className="tenant-web__platform-studio-form-group">
                <Label htmlFor={`${idPrefix}-range-start`}>
                  {t("tenant.platformStudio.forms.builder.filter.rangeStartLabel")}
                </Label>
                <Input
                  disabled={disabled}
                  id={`${idPrefix}-range-start`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      ...valueSource,
                      start: parseScalarInput(field, event.target.value),
                    },
                  })}
                  type={getScalarInputType(field.kind)}
                  value={stringifyScalarValue(valueSource.start)}
                />
              </div>
              <div className="tenant-web__platform-studio-form-group">
                <Label htmlFor={`${idPrefix}-range-end`}>
                  {t("tenant.platformStudio.forms.builder.filter.rangeEndLabel")}
                </Label>
                <Input
                  disabled={disabled}
                  id={`${idPrefix}-range-end`}
                  onChange={(event) => onChange({
                    fieldId: field.id,
                    operator,
                    valueSource: {
                      ...valueSource,
                      end: parseScalarInput(field, event.target.value),
                    },
                  })}
                  type={getScalarInputType(field.kind)}
                  value={stringifyScalarValue(valueSource.end)}
                />
              </div>
            </>
          ) : null}

          {valueSource?.kind === "relative_date" ? (
            <div className="tenant-web__platform-studio-form-group">
              <Label htmlFor={`${idPrefix}-relative-date`}>
                {t("tenant.platformStudio.forms.builder.filter.valueLabel")}
              </Label>
              <Select
                disabled={disabled}
                id={`${idPrefix}-relative-date`}
                onChange={(event) => onChange({
                  fieldId: field.id,
                  operator,
                  valueSource: {
                    kind: "relative_date",
                    preset: event.target.value as typeof relativeDatePresetOptions[number],
                  },
                })}
                value={valueSource.preset}
              >
                {relativeDatePresetOptions.map((item) => (
                  <option key={item} value={item}>
                    {t(getRelativeDatePresetKey(item))}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
