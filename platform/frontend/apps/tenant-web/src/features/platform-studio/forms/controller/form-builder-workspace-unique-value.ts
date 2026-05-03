import {
  type FormsPlaceholderField,
} from "../forms-placeholder-data";

export function supportsUniqueValue(
  field: Pick<FormsPlaceholderField, "kind" | "preset" | "validation"> | null | undefined,
) {
  const isEmailOrPhone = field?.preset === "email"
    || field?.preset === "phone"
    || field?.validation === "email"
    || field?.validation === "phone";
  const isPlainShortText = !field?.preset && !field?.validation;

  return field?.kind === "short_text" && (
    isPlainShortText
    || isEmailOrPhone
  );
}
