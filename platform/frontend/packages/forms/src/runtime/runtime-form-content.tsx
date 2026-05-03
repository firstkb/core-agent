import type {
  RuntimeFormContentDefinition,
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
}: {
  content: RuntimeFormContentDefinition;
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
    return (
      <div className={className}>
        {content.label ? <span className="platform-runtime-form__view-only-label">{content.label}</span> : null}
        <span className="platform-runtime-form__view-only-value">{content.value ?? "-"}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {content.content}
    </div>
  );
}
