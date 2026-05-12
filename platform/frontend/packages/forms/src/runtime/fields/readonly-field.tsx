import {
  formatReadonlyValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function ReadonlyField({ controlId, field, labels, value }: RuntimeFieldControlProps) {
  return (
    <div aria-labelledby={`${controlId}-label`} className="platform-runtime-form__readonly-value" id={controlId}>
      {formatReadonlyValue(field, value, labels)}
    </div>
  );
}
