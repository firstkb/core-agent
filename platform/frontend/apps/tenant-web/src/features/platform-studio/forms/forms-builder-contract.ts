export type FormBuilderPaletteSectionKey =
  | "basicFields"
  | "choiceFields"
  | "relationships"
  | "systemFields"
  | "readyMadeFields"
  | "advancedFields"
  | "layout"
  | "content";

export const formBuilderPaletteSectionOrder: ReadonlyArray<FormBuilderPaletteSectionKey> = [
  "basicFields",
  "choiceFields",
  "relationships",
  "systemFields",
  "readyMadeFields",
  "advancedFields",
  "layout",
  "content",
];

export type FormsPlaceholderAcceptedFieldKind =
  | "attachment"
  | "boolean"
  | "currency"
  | "date"
  | "date_time"
  | "db_lookup"
  | "decimal"
  | "geo_point"
  | "integer"
  | "long_text"
  | "multi_select"
  | "rich_text"
  | "short_text"
  | "signature"
  | "single_select";

export const formsPlaceholderAcceptedFieldKinds: ReadonlySet<FormsPlaceholderAcceptedFieldKind> = new Set([
  "attachment",
  "boolean",
  "currency",
  "date",
  "date_time",
  "db_lookup",
  "decimal",
  "geo_point",
  "integer",
  "long_text",
  "multi_select",
  "rich_text",
  "short_text",
  "signature",
  "single_select",
]);

export type FormsPlaceholderReadyMadePreset =
  | "checkbox_group"
  | "date_today"
  | "email"
  | "phone"
  | "radio_group"
  | "tags"
  | "url";

export type FormsPlaceholderRelationshipPreset =
  | "company_lookup"
  | "contact_lookup"
  | "db_lookup_value"
  | "project_lookup";

export type FormsPlaceholderFieldPreset =
  | FormsPlaceholderReadyMadePreset
  | FormsPlaceholderRelationshipPreset;

export const formsPlaceholderReadyMadePresets: ReadonlySet<FormsPlaceholderReadyMadePreset> = new Set([
  "checkbox_group",
  "date_today",
  "email",
  "phone",
  "radio_group",
  "tags",
  "url",
]);

export const formsPlaceholderRelationshipPresets: ReadonlySet<FormsPlaceholderRelationshipPreset> = new Set([
  "company_lookup",
  "contact_lookup",
  "db_lookup_value",
  "project_lookup",
]);

export const formsPlaceholderAcceptedFieldPresets: ReadonlySet<FormsPlaceholderFieldPreset> = new Set([
  ...formsPlaceholderReadyMadePresets,
  ...formsPlaceholderRelationshipPresets,
]);

export type FormBuilderSubformType = "CHECKLIST" | "DEFAULT";

export type FormBuilderNodeType =
  | "column"
  | "divider"
  | "field"
  | "grid"
  | "group"
  | "heading"
  | "rich_text"
  | "section"
  | "spacer"
  | "subform"
  | "tab_item"
  | "tabs"
  | "text"
  | "view_only_field";

export type FormBuilderElementCategory = "content" | "layout";
