import type { ReactNode } from "react";

import {
  Field,
  FieldLabel,
} from "@platform/ui-kit";

import type {
  RuntimeFormContentDefinition,
  RuntimeFormResolvedLabels,
} from "./runtime-form-types";
import {
  cx,
} from "./runtime-form-utils";

function getHeadingTag(level: RuntimeFormContentDefinition["level"]) {
  if (level === 1) {
    return "h1";
  }

  if (level === 2) {
    return "h2";
  }

  if (level === 4) {
    return "h4";
  }

  return "h3";
}

export function RuntimeContentNode({
  content,
  labels,
  value,
}: {
  content: RuntimeFormContentDefinition;
  labels: RuntimeFormResolvedLabels;
  value?: ReactNode;
}) {
  const className = cx(
    "platform-runtime-form__content",
    `platform-runtime-form__content--${content.contentType}`,
    content.width === "full" && "platform-runtime-form__field--full",
    content.alignment && `platform-runtime-form__content--align-${content.alignment}`,
    content.styleVariant && `platform-runtime-form__content--${content.styleVariant}`,
  );

  if (content.contentType === "heading") {
    const HeadingTag = getHeadingTag(content.level);

    return (
      <HeadingTag className={className}>
        {content.content}
      </HeadingTag>
    );
  }

  if (content.contentType === "view_only_field") {
    const labelLayout = content.labelLayout ?? (content.width === "full" ? "responsive-inline" : "stacked");
    const displayValue = value ?? content.value ?? labels.emptyValue;

    return (
      <Field
        className={cx(
          "platform-runtime-form__field",
          content.width === "full" && "platform-runtime-form__field--full",
          "platform-runtime-form__field--view-only",
        )}
        layout={labelLayout}
        required={false}
      >
        {content.label ? <FieldLabel>{content.label}</FieldLabel> : null}
        <div className="platform-runtime-form__readonly-value">
          {displayValue}
        </div>
      </Field>
    );
  }

  return (
    <div className={className}>
      {content.content}
    </div>
  );
}
