import {
  Switch,
} from "@platform/ui-kit";

import {
  getBooleanValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function BooleanField({
  controlId,
  disabled,
  field,
  onFieldChange,
  value,
}: RuntimeFieldControlProps) {
  const descriptionId = field.placeholder ? `${controlId}-description` : undefined;

  return (
    <div className="platform-runtime-form__boolean-control">
      <Switch
        aria-describedby={descriptionId}
        aria-labelledby={`${controlId}-label`}
        checked={getBooleanValue(value)}
        disabled={disabled}
        id={controlId}
        onCheckedChange={(checked) => onFieldChange(field.id, checked, field)}
        size="md"
      />
      {field.placeholder ? <span id={descriptionId}>{field.placeholder}</span> : null}
    </div>
  );
}
