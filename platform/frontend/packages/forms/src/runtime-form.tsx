import type { ChangeEvent, FormEvent, ReactNode } from "react";

import {
  Button,
  Checkbox,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  FormGrid,
  FormSection,
  FormSectionDescription,
  FormSectionHeader,
  FormShell,
  FormSectionTitle,
  InlineStatus,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  Textarea,
} from "@platform/ui-kit";

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
export type RuntimeFormValue = string | boolean | ReadonlyArray<string>;
export type RuntimeFormValues = Record<string, RuntimeFormValue | undefined>;
export type RuntimeFormValidationErrors = Record<string, string | undefined>;

export type RuntimeFormFieldOption = {
  label: string;
  value: string;
};

export type RuntimeFormFieldDefinition = {
  choiceLayout?: RuntimeFormChoiceLayout;
  disabled?: boolean;
  helperText?: ReactNode;
  id: string;
  label: string;
  labelLayout?: RuntimeFormFieldLabelLayout;
  options?: ReadonlyArray<RuntimeFormFieldOption>;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  rows?: number;
  type: RuntimeFormFieldType;
  width?: RuntimeFormFieldWidth;
};

export type RuntimeFormSectionDefinition = {
  description?: ReactNode;
  fields: ReadonlyArray<RuntimeFormFieldDefinition>;
  id: string;
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

type RuntimeFormResolvedLabels = {
  backToList: ReactNode;
  finish: ReactNode;
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
  saveState?: RuntimeFormSaveState;
  values: RuntimeFormValues;
};

const defaultRuntimeFormLabels: RuntimeFormResolvedLabels = {
  backToList: "Back to list",
  finish: "Finish",
  requiredError: "This field is required.",
  saveStates: {
    dirty: "Unsaved",
    error: "Needs attention",
    idle: "Ready",
    saved: "Saved",
    saving: "Saving",
  },
  selectPlaceholder: "Select...",
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function resolveRuntimeFormLabels(labels?: RuntimeFormLabels): RuntimeFormResolvedLabels {
  return {
    ...defaultRuntimeFormLabels,
    ...labels,
    saveStates: {
      ...defaultRuntimeFormLabels.saveStates,
      ...labels?.saveStates,
    },
  };
}

function isRuntimeFormStringArray(value: RuntimeFormValue | undefined): value is ReadonlyArray<string> {
  return Array.isArray(value);
}

export function isRuntimeFormValueEmpty(value: RuntimeFormValue | undefined) {
  if (isRuntimeFormStringArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "boolean") {
    return false;
  }

  return !value?.trim();
}

export function findRuntimeFormField(definition: RuntimeFormDefinition, fieldId: string) {
  for (const section of definition.sections) {
    const field = section.fields.find((candidate) => candidate.id === fieldId);
    if (field) {
      return field;
    }
  }

  return null;
}

export function validateRuntimeForm(
  definition: RuntimeFormDefinition,
  values: RuntimeFormValues,
  labels?: RuntimeFormLabels,
): RuntimeFormValidationErrors {
  const resolvedLabels = resolveRuntimeFormLabels(labels);
  const errors: RuntimeFormValidationErrors = {};

  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (!field.required || field.readonly || field.disabled) {
        continue;
      }

      if (isRuntimeFormValueEmpty(values[field.id])) {
        errors[field.id] = resolvedLabels.requiredError;
      }
    }
  }

  return errors;
}

export function applyRuntimeWorkflowStatus(
  definition: RuntimeFormDefinition,
  values: RuntimeFormValues,
  target: "initial" | "final",
): RuntimeFormValues {
  const binding = definition.workflowStatus;
  if (!binding?.fieldId) {
    return values;
  }

  const statusValue = target === "initial" ? binding.initialValue : binding.finalValue;
  const statusField = findRuntimeFormField(definition, binding.fieldId);
  if (!statusValue || !statusField) {
    return values;
  }

  if (statusField.options?.length && !statusField.options.some((option) => option.value === statusValue)) {
    return values;
  }

  return {
    ...values,
    [binding.fieldId]: statusValue,
  };
}

function getStringValue(value: RuntimeFormValue | undefined) {
  if (typeof value === "string") {
    return value;
  }

  return "";
}

function getArrayValue(value: RuntimeFormValue | undefined) {
  return isRuntimeFormStringArray(value) ? value : [];
}

function getBooleanValue(value: RuntimeFormValue | undefined) {
  return typeof value === "boolean" ? value : false;
}

function getOptionLabel(field: RuntimeFormFieldDefinition, value: string) {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

function formatReadonlyValue(field: RuntimeFormFieldDefinition, value: RuntimeFormValue | undefined) {
  if (isRuntimeFormStringArray(value)) {
    return value.length > 0 ? value.map((item) => getOptionLabel(field, item)).join(", ") : "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (!value?.trim()) {
    return "-";
  }

  if (field.options?.length) {
    return getOptionLabel(field, value);
  }

  return value;
}

function getSaveStateTone(saveState: RuntimeFormSaveState) {
  if (saveState === "saved") {
    return "success";
  }

  if (saveState === "saving" || saveState === "dirty") {
    return "warning";
  }

  if (saveState === "error") {
    return "danger";
  }

  return "neutral";
}

function toggleMultiSelectValue(
  currentValue: RuntimeFormValue | undefined,
  optionValue: string,
  checked: boolean,
) {
  const currentValues = getArrayValue(currentValue);
  if (checked) {
    return currentValues.includes(optionValue)
      ? currentValues
      : [...currentValues, optionValue];
  }

  return currentValues.filter((value) => value !== optionValue);
}

function RuntimeFieldControl({
  controlId,
  error,
  field,
  groupName,
  labels,
  onFieldChange,
  value,
}: {
  controlId: string;
  error?: string;
  field: RuntimeFormFieldDefinition;
  groupName: string;
  labels: RuntimeFormResolvedLabels;
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
  value: RuntimeFormValue | undefined;
}) {
  const disabled = field.disabled || field.readonly;
  const stringValue = getStringValue(value);

  if (field.readonly || field.type === "readonly" || field.type === "system") {
    return (
      <div aria-labelledby={`${controlId}-label`} className="platform-runtime-form__readonly-value" id={controlId}>
        {formatReadonlyValue(field, value)}
      </div>
    );
  }

  if (field.type === "long_text" || field.type === "rich_text") {
    return (
      <Textarea
        aria-invalid={error ? "true" : undefined}
        disabled={disabled}
        id={controlId}
        invalid={Boolean(error)}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onFieldChange(field.id, event.currentTarget.value, field)}
        placeholder={field.placeholder}
        rows={field.rows}
        value={stringValue}
      />
    );
  }

  if (field.type === "single_select") {
    return (
      <Select
        aria-invalid={error ? "true" : undefined}
        disabled={disabled}
        id={controlId}
        invalid={Boolean(error)}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onFieldChange(field.id, event.currentTarget.value, field)}
        value={stringValue}
      >
        <option value="">{field.placeholder ?? labels.selectPlaceholder}</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === "radio") {
    return (
      <RadioGroup
        aria-labelledby={`${controlId}-label`}
        className="platform-runtime-form__choice-group"
        orientation={field.choiceLayout === "inline" ? "horizontal" : "vertical"}
      >
        {(field.options ?? []).map((option) => {
          const optionId = `${controlId}-${option.value}`;

          return (
            <label className="platform-runtime-form__choice" htmlFor={optionId} key={option.value}>
              <RadioGroupItem
                checked={stringValue === option.value}
                disabled={disabled}
                id={optionId}
                invalid={Boolean(error)}
                name={groupName}
                onChange={() => onFieldChange(field.id, option.value, field)}
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </RadioGroup>
    );
  }

  if (field.type === "multi_select") {
    const selectedValues = getArrayValue(value);

    return (
      <div className="platform-runtime-form__choice-group" role="group" aria-labelledby={`${controlId}-label`}>
        {(field.options ?? []).map((option) => {
          const optionId = `${controlId}-${option.value}`;

          return (
            <label className="platform-runtime-form__choice" htmlFor={optionId} key={option.value}>
              <Checkbox
                checked={selectedValues.includes(option.value)}
                disabled={disabled}
                id={optionId}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  onFieldChange(
                    field.id,
                    toggleMultiSelectValue(value, option.value, event.currentTarget.checked),
                    field,
                  );
                }}
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="platform-runtime-form__boolean-control" htmlFor={controlId}>
        <Checkbox
          checked={getBooleanValue(value)}
          disabled={disabled}
          id={controlId}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onFieldChange(field.id, event.currentTarget.checked, field)}
        />
        <span>{field.placeholder ?? field.label}</span>
      </label>
    );
  }

  const inputType = field.type === "date"
    ? "date"
    : field.type === "date_time"
      ? "datetime-local"
      : field.type === "integer" || field.type === "decimal" || field.type === "currency"
        ? "number"
        : "text";
  const step = field.type === "integer" ? "1" : field.type === "decimal" || field.type === "currency" ? "0.01" : undefined;

  return (
    <Input
      aria-invalid={error ? "true" : undefined}
      disabled={disabled}
      id={controlId}
      invalid={Boolean(error)}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onFieldChange(field.id, event.currentTarget.value, field)}
      placeholder={field.placeholder}
      step={step}
      type={inputType}
      value={stringValue}
    />
  );
}

function RuntimeField({
  definitionId,
  errors,
  field,
  labels,
  onFieldChange,
  value,
}: {
  definitionId: string;
  errors: RuntimeFormValidationErrors;
  field: RuntimeFormFieldDefinition;
  labels: RuntimeFormResolvedLabels;
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
  value: RuntimeFormValue | undefined;
}) {
  const controlId = `runtime-form-${definitionId}-${field.id}`;
  const error = errors[field.id];
  const labelLayout = field.labelLayout ?? (field.width === "full" ? "responsive-inline" : "stacked");

  return (
    <Field
      className={cx(
        "platform-runtime-form__field",
        field.width === "full" && "platform-runtime-form__field--full",
      )}
      invalid={Boolean(error)}
      layout={labelLayout}
      required={field.required}
    >
      <FieldLabel
        htmlFor={field.type === "radio" || field.type === "multi_select" || field.readonly || field.type === "readonly" || field.type === "system" ? undefined : controlId}
        id={`${controlId}-label`}
      >
        {field.label}
      </FieldLabel>
      <RuntimeFieldControl
        controlId={controlId}
        error={error}
        field={field}
        groupName={`${definitionId}-${field.id}`}
        labels={labels}
        onFieldChange={onFieldChange}
        value={value}
      />
      {field.helperText ? <FieldHint>{field.helperText}</FieldHint> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

export function RuntimeFormScaffold({
  className,
  definition,
  errors = {},
  labels,
  onBack,
  onFieldChange,
  onFinish,
  saveState = "idle",
  values,
}: RuntimeFormScaffoldProps) {
  const resolvedLabels = resolveRuntimeFormLabels(labels);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onFinish();
  }

  return (
    <FormShell className={cx("platform-runtime-form", className)} onSubmit={handleSubmit}>
      <div className="platform-runtime-form__topbar">
        <Button onClick={onBack} size="sm" type="button" variant="secondary">
          {resolvedLabels.backToList}
        </Button>
        <InlineStatus aria-live="polite" size="sm" tone={getSaveStateTone(saveState)}>
          {resolvedLabels.saveStates[saveState]}
        </InlineStatus>
      </div>

      <header className="platform-runtime-form__header">
        <div className="platform-runtime-form__title-block">
          <h1 className="platform-runtime-form__title">{definition.title}</h1>
          {definition.description ? (
            <p className="platform-runtime-form__description">{definition.description}</p>
          ) : null}
        </div>
      </header>

      <div className="platform-runtime-form__sections">
        {definition.sections.map((section) => (
          <FormSection className="platform-runtime-form__section" key={section.id}>
            {section.title || section.description ? (
              <FormSectionHeader>
                {section.title ? <FormSectionTitle>{section.title}</FormSectionTitle> : null}
                {section.description ? <FormSectionDescription>{section.description}</FormSectionDescription> : null}
              </FormSectionHeader>
            ) : null}
            <FormGrid columns={2}>
              {section.fields.map((field) => (
                <RuntimeField
                  definitionId={definition.id}
                  errors={errors}
                  field={field}
                  key={field.id}
                  labels={resolvedLabels}
                  onFieldChange={onFieldChange}
                  value={values[field.id]}
                />
              ))}
            </FormGrid>
          </FormSection>
        ))}
      </div>

      <div className="platform-runtime-form__footer">
        <Button onClick={onBack} type="button" variant="secondary">
          {resolvedLabels.backToList}
        </Button>
        <Button type="submit" variant="success">
          {resolvedLabels.finish}
        </Button>
      </div>
    </FormShell>
  );
}
