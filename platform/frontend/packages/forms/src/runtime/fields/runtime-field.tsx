import {
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
} from "@platform/ui-kit";

import {
  isRuntimeFieldRequired,
} from "../runtime-form-rules";
import type {
  RuntimeFormFieldDefinition,
  RuntimeFormResolvedLabels,
  RuntimeFormScaffoldProps,
  RuntimeFormValidationErrors,
  RuntimeFormValue,
  RuntimeFormValues,
} from "../runtime-form-types";
import {
  cx,
} from "../runtime-form-utils";
import { BooleanField } from "./boolean-field";
import { GeoPointField } from "./geo-point-field";
import { InputField } from "./input-field";
import { MultiSelectField } from "./multi-select-field";
import { RadioField } from "./radio-field";
import { ReadonlyField } from "./readonly-field";
import { SelectField } from "./select-field";
import { LongTextField } from "./text-field";
import type { RuntimeFieldControlProps } from "./field-types";

export type RuntimeFieldLabelActivation = "focus" | "native" | "none";

export function getRuntimeFieldLabelActivation(field: RuntimeFormFieldDefinition): RuntimeFieldLabelActivation {
  if (field.readonly || field.type === "readonly" || field.type === "system") {
    return "none";
  }

  if (field.lookup?.displayMode === "catalog_modal") {
    return "none";
  }

  if (field.type === "radio" || field.choiceRenderStyle === "buttons") {
    return "none";
  }

  if (field.lookup || field.type === "single_select" || field.type === "multi_select") {
    return "focus";
  }

  return "native";
}

function RuntimeFieldControl(props: RuntimeFieldControlProps) {
  const { field } = props;

  if (field.readonly || field.type === "readonly" || field.type === "system") {
    return <ReadonlyField {...props} />;
  }

  if (field.type === "long_text" || field.type === "rich_text") {
    return <LongTextField {...props} />;
  }

  if (field.type === "single_select") {
    return <SelectField {...props} />;
  }

  if (field.type === "radio") {
    return <RadioField {...props} />;
  }

  if (field.type === "multi_select") {
    return <MultiSelectField {...props} />;
  }

  if (field.type === "boolean") {
    return <BooleanField {...props} />;
  }

  if (field.type === "geo_point") {
    return <GeoPointField {...props} />;
  }

  return <InputField {...props} />;
}

export function RuntimeField({
  definitionId,
  errors,
  field,
  isResolvingGeoPoint,
  labels,
  loadLookupOptions,
  onFieldChange,
  resolveGeoPoint,
  value,
  values,
}: {
  definitionId: string;
  errors: RuntimeFormValidationErrors;
  field: RuntimeFormFieldDefinition;
  isResolvingGeoPoint?: boolean;
  labels: RuntimeFormResolvedLabels;
  loadLookupOptions?: RuntimeFormScaffoldProps["loadLookupOptions"];
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
  resolveGeoPoint?: RuntimeFormScaffoldProps["resolveGeoPoint"];
  value: RuntimeFormValue | undefined;
  values: RuntimeFormValues;
}) {
  const controlId = `runtime-form-${definitionId}-${field.id}`;
  const error = errors[field.id];
  const labelLayout = field.labelLayout ?? (field.width === "full" ? "responsive-inline" : "stacked");
  const required = isRuntimeFieldRequired(field, values, field.required);
  const disabled = field.type === "geo_point" ? Boolean(field.disabled) : field.disabled || field.readonly || false;
  const usesCatalogLookup = field.lookup?.displayMode === "catalog_modal";
  const labelActivation = getRuntimeFieldLabelActivation(field);

  function handleLabelClick() {
    if (labelActivation !== "focus" || typeof document === "undefined") {
      return;
    }

    document.getElementById(controlId)?.focus();
  }

  return (
    <Field
      className={cx(
        "platform-runtime-form__field",
        field.width === "full" && "platform-runtime-form__field--full",
        usesCatalogLookup && "platform-runtime-form__field--catalog-lookup",
      )}
      invalid={Boolean(error)}
      layout={usesCatalogLookup ? "stacked" : labelLayout}
      required={required}
    >
      {usesCatalogLookup ? null : (
        <FieldLabel
          htmlFor={labelActivation === "native" ? controlId : undefined}
          id={`${controlId}-label`}
          onClick={handleLabelClick}
        >
          {field.label}
        </FieldLabel>
      )}
      <RuntimeFieldControl
        controlId={controlId}
        disabled={disabled}
        error={error}
        field={field}
        groupName={`${definitionId}-${field.id}`}
        isResolvingGeoPoint={isResolvingGeoPoint}
        labels={labels}
        loadLookupOptions={loadLookupOptions}
        onFieldChange={onFieldChange}
        resolveGeoPoint={resolveGeoPoint}
        required={required}
        value={value}
      />
      {field.helperText ? <FieldHint>{field.helperText}</FieldHint> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
