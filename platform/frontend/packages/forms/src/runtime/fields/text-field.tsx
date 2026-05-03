import type { ChangeEvent, FocusEvent } from "react";
import { useEffect, useState } from "react";

import {
  Textarea,
} from "@platform/ui-kit";

import {
  getStringValue,
} from "../runtime-form-utils";
import type { RuntimeFieldControlProps } from "./field-types";

export function LongTextField({
  controlId,
  disabled,
  error,
  field,
  onFieldChange,
  value,
}: RuntimeFieldControlProps) {
  const externalValue = getStringValue(value);
  const [draftValue, setDraftValue] = useState(externalValue);

  useEffect(() => {
    setDraftValue(externalValue);
  }, [externalValue]);

  function commitDraft(event: FocusEvent<HTMLTextAreaElement>) {
    const nextValue = event.currentTarget.value;
    if (nextValue !== externalValue) {
      onFieldChange(field.id, nextValue, field);
    }
  }

  return (
    <Textarea
      aria-invalid={error ? "true" : undefined}
      disabled={disabled}
      id={controlId}
      invalid={Boolean(error)}
      onBlur={commitDraft}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraftValue(event.currentTarget.value)}
      placeholder={field.placeholder}
      rows={field.rows}
      value={draftValue}
    />
  );
}
