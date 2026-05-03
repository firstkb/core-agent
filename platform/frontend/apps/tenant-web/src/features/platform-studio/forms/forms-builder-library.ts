import type {
  FormBuilderElementCategory,
  FormBuilderNodeType,
  FormBuilderPaletteSectionKey,
  FormBuilderSubformType,
  FormsPlaceholderAcceptedFieldKind,
  FormsPlaceholderFieldPreset,
} from "./forms-builder-contract";
import {
  formsPlaceholderRelationshipPresets,
  formsPlaceholderReadyMadePresets,
} from "./forms-builder-contract";
import type {
  FormsPlaceholderField,
  FormsPlaceholderFieldFamily,
} from "./forms-placeholder-data";
import { createUniqueFormsPlaceholderStorageKey } from "./forms-placeholder-data";

type FieldLike = {
  family?: string;
  kind: FormsPlaceholderAcceptedFieldKind;
  preset?: FormsPlaceholderFieldPreset;
};

export type FormBuilderPaletteSectionDefinition = {
  key: FormBuilderPaletteSectionKey;
  labelKey: string;
};

export type FormBuilderLibraryElementDefinition = {
  category: FormBuilderElementCategory;
  descriptionKey: string;
  iconKey: string;
  initialNode?: {
    subformType?: FormBuilderSubformType;
    title?: string;
  };
  labelKey: string;
  nodeType: Exclude<FormBuilderNodeType, "field">;
  searchTerms: ReadonlyArray<string>;
  section: Extract<FormBuilderPaletteSectionKey, "content" | "layout">;
};

export type FormBuilderLibraryFieldDefinition = {
  idBase: string;
  labelKey: string;
  searchTerms: ReadonlyArray<string>;
  section: Exclude<FormBuilderPaletteSectionKey, "content" | "layout" | "systemFields">;
  template: Omit<FormsPlaceholderField, "id">;
};

export const formBuilderPaletteSectionDefinitions: ReadonlyArray<FormBuilderPaletteSectionDefinition> = [
  {
    key: "basicFields",
    labelKey: "tenant.platformStudio.forms.builder.category.basicFields",
  },
  {
    key: "choiceFields",
    labelKey: "tenant.platformStudio.forms.builder.category.choiceFields",
  },
  {
    key: "relationships",
    labelKey: "tenant.platformStudio.forms.builder.category.relationships",
  },
  {
    key: "systemFields",
    labelKey: "tenant.platformStudio.forms.builder.category.systemFields",
  },
  {
    key: "readyMadeFields",
    labelKey: "tenant.platformStudio.forms.builder.category.readyMadeFields",
  },
  {
    key: "advancedFields",
    labelKey: "tenant.platformStudio.forms.builder.category.advancedFields",
  },
  {
    key: "layout",
    labelKey: "tenant.platformStudio.forms.builder.category.layout",
  },
  {
    key: "content",
    labelKey: "tenant.platformStudio.forms.builder.category.content",
  },
];

export const formBuilderElementDefinitions: ReadonlyArray<FormBuilderLibraryElementDefinition> = [
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.accordionDescription",
    iconKey: "accordion",
    labelKey: "tenant.platformStudio.forms.builder.palette.accordion",
    nodeType: "accordion",
    searchTerms: ["accordion", "expand", "collapse"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.accordionItemDescription",
    iconKey: "accordion_item",
    labelKey: "tenant.platformStudio.forms.builder.palette.accordionItem",
    nodeType: "accordion_item",
    searchTerms: ["accordion item", "accordion panel"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.sectionDescription",
    iconKey: "section",
    labelKey: "tenant.platformStudio.forms.builder.palette.section",
    nodeType: "section",
    searchTerms: ["section", "card"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.groupDescription",
    iconKey: "group",
    labelKey: "tenant.platformStudio.forms.builder.palette.group",
    nodeType: "group",
    searchTerms: ["group"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.tabsDescription",
    iconKey: "tabs",
    labelKey: "tenant.platformStudio.forms.builder.palette.tabs",
    nodeType: "tabs",
    searchTerms: ["tabs", "tabbed"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.tabItemDescription",
    iconKey: "tab_item",
    labelKey: "tenant.platformStudio.forms.builder.palette.tabItem",
    nodeType: "tab_item",
    searchTerms: ["tab", "tab item"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.gridDescription",
    iconKey: "grid",
    labelKey: "tenant.platformStudio.forms.builder.palette.grid",
    nodeType: "grid",
    searchTerms: ["grid", "grid layout", "columns"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.columnDescription",
    iconKey: "column",
    labelKey: "tenant.platformStudio.forms.builder.palette.column",
    nodeType: "column",
    searchTerms: ["column"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.subformDescription",
    iconKey: "subform",
    initialNode: {
      subformType: "DEFAULT",
    },
    labelKey: "tenant.platformStudio.forms.builder.palette.subform",
    nodeType: "subform",
    searchTerms: ["subform", "nested form", "child table"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.checklistSubformDescription",
    iconKey: "subform",
    initialNode: {
      subformType: "CHECKLIST",
      title: "Checklist",
    },
    labelKey: "tenant.platformStudio.forms.builder.palette.checklistSubform",
    nodeType: "subform",
    searchTerms: ["checklist", "checklist subform", "survey"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.dividerDescription",
    iconKey: "divider",
    labelKey: "tenant.platformStudio.forms.builder.palette.divider",
    nodeType: "divider",
    searchTerms: ["divider", "separator"],
    section: "layout",
  },
  {
    category: "layout",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.spacerDescription",
    iconKey: "spacer",
    labelKey: "tenant.platformStudio.forms.builder.palette.spacer",
    nodeType: "spacer",
    searchTerms: ["spacer", "space", "gap"],
    section: "layout",
  },
  {
    category: "content",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.headingDescription",
    iconKey: "heading",
    labelKey: "tenant.platformStudio.forms.builder.palette.heading",
    nodeType: "heading",
    searchTerms: ["heading", "title"],
    section: "content",
  },
  {
    category: "content",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.textDescription",
    iconKey: "text",
    labelKey: "tenant.platformStudio.forms.builder.palette.text",
    nodeType: "text",
    searchTerms: ["text", "text block", "copy"],
    section: "content",
  },
  {
    category: "content",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.richTextDescription",
    iconKey: "rich_text",
    labelKey: "tenant.platformStudio.forms.builder.palette.richText",
    nodeType: "rich_text",
    searchTerms: ["rich text", "formatted content"],
    section: "content",
  },
  {
    category: "content",
    descriptionKey: "tenant.platformStudio.forms.builder.palette.viewOnlyFieldDescription",
    iconKey: "view_only_field",
    labelKey: "tenant.platformStudio.forms.builder.palette.viewOnlyField",
    nodeType: "view_only_field",
    searchTerms: ["view only field", "readonly field", "derived output", "lookup output"],
    section: "content",
  },
];

function createFieldTemplate(
  family: FormsPlaceholderFieldFamily,
  kind: FormsPlaceholderAcceptedFieldKind,
  label: string,
  partial?: Partial<Omit<FormsPlaceholderField, "family" | "id" | "isLocked" | "kind" | "label">>,
): Omit<FormsPlaceholderField, "id"> {
  return {
    family,
    isLocked: false,
    kind,
    label,
    ...partial,
  };
}

export const formBuilderFieldDefinitions: ReadonlyArray<FormBuilderLibraryFieldDefinition> = [
  {
    idBase: "short-text",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.short_text",
    searchTerms: ["short text", "text", "input"],
    section: "basicFields",
    template: createFieldTemplate("core", "short_text", "Short text", {
      autocomplete: "on",
    }),
  },
  {
    idBase: "long-text",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.long_text",
    searchTerms: ["long text", "textarea", "memo"],
    section: "basicFields",
    template: createFieldTemplate("core", "long_text", "Long text"),
  },
  {
    idBase: "long-text-historical",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.long_text_historical",
    searchTerms: ["long text historical", "memo with updates", "history", "append notes"],
    section: "basicFields",
    template: createFieldTemplate("core", "long_text", "Long text historical", {
      historicalUpdates: true,
    }),
  },
  {
    idBase: "rich-text",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.rich_text",
    searchTerms: ["rich text", "html", "wysiwyg"],
    section: "basicFields",
    template: createFieldTemplate("core", "rich_text", "Rich text"),
  },
  {
    idBase: "integer",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.integer",
    searchTerms: ["integer", "whole number"],
    section: "basicFields",
    template: createFieldTemplate("core", "integer", "Integer"),
  },
  {
    idBase: "decimal",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.decimal",
    searchTerms: ["decimal", "fractional number"],
    section: "basicFields",
    template: createFieldTemplate("core", "decimal", "Decimal"),
  },
  {
    idBase: "currency",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.currency",
    searchTerms: ["currency", "money", "amount"],
    section: "basicFields",
    template: createFieldTemplate("core", "currency", "Currency"),
  },
  {
    idBase: "boolean",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.boolean",
    searchTerms: ["boolean", "checkbox", "toggle"],
    section: "basicFields",
    template: createFieldTemplate("core", "boolean", "Boolean"),
  },
  {
    idBase: "date",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.date",
    searchTerms: ["date", "calendar"],
    section: "basicFields",
    template: createFieldTemplate("core", "date", "Date"),
  },
  {
    idBase: "date-time",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.date_time",
    searchTerms: ["date time", "datetime", "timestamp"],
    section: "basicFields",
    template: createFieldTemplate("core", "date_time", "Date & time"),
  },
  {
    idBase: "signature",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.signature",
    searchTerms: ["signature", "sign"],
    section: "basicFields",
    template: createFieldTemplate("core", "signature", "Signature"),
  },
  {
    idBase: "geo-point",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.geo_point",
    searchTerms: ["geo point", "location", "map", "gps"],
    section: "basicFields",
    template: createFieldTemplate("core", "geo_point", "Geo point"),
  },
  {
    idBase: "attachment",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.attachment",
    searchTerms: ["attachment", "file", "upload"],
    section: "basicFields",
    template: createFieldTemplate("core", "attachment", "Attachment"),
  },
  {
    idBase: "single-select",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.single_select",
    searchTerms: ["single select", "dropdown", "options"],
    section: "choiceFields",
    template: createFieldTemplate("choice", "single_select", "Single select", {
      choiceDisplay: {
        allowEmpty: false,
        orientation: "horizontal",
        renderStyle: "native",
      },
      options: ["Option 1", "Option 2"],
    }),
  },
  {
    idBase: "multi-select",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.multi_select",
    searchTerms: ["multi select", "multiple choice", "options"],
    section: "choiceFields",
    template: createFieldTemplate("choice", "multi_select", "Multi select", {
      choiceDisplay: {
        maxSelections: undefined,
        minSelections: 0,
        orientation: "horizontal",
        renderStyle: "native",
      },
      options: ["Option 1", "Option 2"],
    }),
  },
  {
    idBase: "db-lookup",
    labelKey: "tenant.platformStudio.forms.builder.fieldType.db_lookup",
    searchTerms: ["db lookup", "lookup", "dictionary"],
    section: "relationships",
    template: createFieldTemplate("choice", "db_lookup", "DB lookup", {
      lookupConfig: {
        displayMode: "search_select",
        searchBehavior: "ajax",
      },
      selectionMode: "single",
      sourceLabel: "Lookup source",
    }),
  },
  {
    idBase: "db-lookup-value",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.db_lookup_value",
    searchTerms: ["db lookup value", "lookup value", "lookup text", "dictionary value"],
    section: "relationships",
    template: createFieldTemplate("preset", "db_lookup", "DB lookup value", {
      lookupConfig: {
        displayMode: "search_select",
        searchBehavior: "ajax",
      },
      preset: "db_lookup_value",
      selectionMode: "single",
      sourceLabel: "Lookup source",
    }),
  },
  {
    idBase: "db-lookup-multi",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.db_lookup_multi",
    searchTerms: ["db lookup multi", "lookup multiple", "dictionary multiple"],
    section: "relationships",
    template: createFieldTemplate("choice", "db_lookup", "DB lookup multi", {
      lookupConfig: {
        displayMode: "search_select",
        searchBehavior: "ajax",
      },
      selectionMode: "multiple",
      sourceLabel: "Lookup source",
    }),
  },
  {
    idBase: "contact",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.contact_lookup",
    searchTerms: ["contact", "reported by", "lookup"],
    section: "relationships",
    template: createFieldTemplate("preset", "db_lookup", "Contact", {
      displayFields: ["Full name", "Email"],
      lookupConfig: {
        displayMode: "search_select",
        displayTemplate: "users_firstname + ' ' + users_lastname",
        searchBehavior: "ajax",
        searchFields: ["users_firstname", "users_lastname"],
        sourceModel: "contacts",
        storedValueField: "doc_id",
      },
      preset: "contact_lookup",
      selectionMode: "single",
      sourceFilters: ["Only active contacts"],
      sourceLabel: "Contacts",
    }),
  },
  {
    idBase: "contacts",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.contacts_lookup",
    searchTerms: ["contacts", "reported by multiple", "lookup multiple"],
    section: "relationships",
    template: createFieldTemplate("preset", "db_lookup", "Contacts", {
      displayFields: ["Full name", "Email"],
      lookupConfig: {
        displayMode: "search_select",
        displayTemplate: "users_firstname + ' ' + users_lastname",
        searchBehavior: "ajax",
        searchFields: ["users_firstname", "users_lastname"],
        sourceModel: "contacts",
        storedValueField: "doc_id",
      },
      preset: "contact_lookup",
      selectionMode: "multiple",
      sourceFilters: ["Only active contacts"],
      sourceLabel: "Contacts",
    }),
  },
  {
    idBase: "company",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.company_lookup",
    searchTerms: ["company", "lookup"],
    section: "relationships",
    template: createFieldTemplate("preset", "db_lookup", "Company", {
      displayFields: ["Company name"],
      lookupConfig: {
        displayMode: "search_select",
        displayTemplate: "company_name",
        searchBehavior: "ajax",
        searchFields: ["company_name"],
        sourceModel: "companies",
        storedValueField: "doc_id",
      },
      preset: "company_lookup",
      selectionMode: "single",
      sourceLabel: "Companies",
    }),
  },
  {
    idBase: "companies",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.companies_lookup",
    searchTerms: ["companies", "company multiple", "lookup multiple"],
    section: "relationships",
    template: createFieldTemplate("preset", "db_lookup", "Companies", {
      displayFields: ["Company name"],
      lookupConfig: {
        displayMode: "search_select",
        displayTemplate: "company_name",
        searchBehavior: "ajax",
        searchFields: ["company_name"],
        sourceModel: "companies",
        storedValueField: "doc_id",
      },
      preset: "company_lookup",
      selectionMode: "multiple",
      sourceLabel: "Companies",
    }),
  },
  {
    idBase: "project",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.project_lookup",
    searchTerms: ["project", "lookup"],
    section: "relationships",
    template: createFieldTemplate("preset", "db_lookup", "Project", {
      displayFields: ["Project #", "Project name"],
      lookupConfig: {
        displayMode: "search_select",
        displayTemplate: "projects_num + ', ' + projects_name",
        searchBehavior: "ajax",
        searchFields: ["projects_num", "projects_name"],
        sourceModel: "projects",
        storedValueField: "doc_id",
      },
      preset: "project_lookup",
      selectionMode: "single",
      sourceLabel: "Projects",
    }),
  },
  {
    idBase: "projects",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.projects_lookup",
    searchTerms: ["projects", "project multiple", "lookup multiple"],
    section: "relationships",
    template: createFieldTemplate("preset", "db_lookup", "Projects", {
      displayFields: ["Project #", "Project name"],
      lookupConfig: {
        displayMode: "search_select",
        displayTemplate: "projects_num + ', ' + projects_name",
        searchBehavior: "ajax",
        searchFields: ["projects_num", "projects_name"],
        sourceModel: "projects",
        storedValueField: "doc_id",
      },
      preset: "project_lookup",
      selectionMode: "multiple",
      sourceLabel: "Projects",
    }),
  },
  {
    idBase: "email",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.email",
    searchTerms: ["email", "mail"],
    section: "readyMadeFields",
    template: createFieldTemplate("preset", "short_text", "Email", {
      autocomplete: "email",
      inputMode: "email",
      placeholder: "name@example.com",
      preset: "email",
      validation: "email",
    }),
  },
  {
    idBase: "phone",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.phone",
    searchTerms: ["phone", "telephone"],
    section: "readyMadeFields",
    template: createFieldTemplate("preset", "short_text", "Phone", {
      autocomplete: "tel",
      inputMode: "tel",
      mask: "(999) 999-9999",
      placeholder: "(555) 555-5555",
      preset: "phone",
      validation: "phone",
    }),
  },
  {
    idBase: "url",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.url",
    searchTerms: ["url", "link", "website"],
    section: "readyMadeFields",
    template: createFieldTemplate("preset", "short_text", "URL", {
      autocomplete: "url",
      inputMode: "url",
      placeholder: "https://example.com",
      preset: "url",
      validation: "url",
    }),
  },
  {
    idBase: "suggest-text",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.suggest_text",
    searchTerms: ["suggest text", "combobox", "autocomplete text", "city", "department"],
    section: "readyMadeFields",
    template: createFieldTemplate("preset", "short_text", "Suggest text", {
      placeholder: "Start typing",
      preset: "suggest_text",
      suggestConfig: {
        allowCustomValue: true,
        maxResults: 20,
        minQueryLength: 1,
        searchMode: "contains",
        sourceMode: "same_field_distinct_values",
      },
    }),
  },
  {
    idBase: "tags",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.tags",
    searchTerms: ["tags", "chips"],
    section: "readyMadeFields",
    template: createFieldTemplate("preset", "multi_select", "Tags", {
      choiceDisplay: {
        minSelections: 0,
        orientation: "horizontal",
        renderStyle: "native",
      },
      maxTags: 10,
      options: ["Tag 1", "Tag 2"],
      preset: "tags",
      tagMode: "select_or_create",
    }),
  },
  {
    idBase: "date-today",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.date_today",
    searchTerms: ["date today", "today"],
    section: "readyMadeFields",
    template: createFieldTemplate("preset", "date", "Date today", {
      defaultValueMode: "today",
      preset: "date_today",
    }),
  },
  {
    idBase: "radio-group",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.radio_group",
    searchTerms: ["radio group", "choice buttons"],
    section: "readyMadeFields",
    template: createFieldTemplate("preset", "single_select", "Radio group", {
      choiceDisplay: {
        allowEmpty: false,
        orientation: "vertical",
        renderStyle: "native",
      },
      options: ["Option 1", "Option 2"],
      preset: "radio_group",
    }),
  },
  {
    idBase: "checkbox-group",
    labelKey: "tenant.platformStudio.forms.builder.fieldPreset.checkbox_group",
    searchTerms: ["checkbox group", "multiple choice buttons"],
    section: "readyMadeFields",
    template: createFieldTemplate("preset", "multi_select", "Checkbox group", {
      choiceDisplay: {
        minSelections: 0,
        orientation: "vertical",
        renderStyle: "native",
      },
      options: ["Option 1", "Option 2"],
      preset: "checkbox_group",
    }),
  },
];

function createUniqueFieldId(baseId: string, fields: ReadonlyArray<Pick<FormsPlaceholderField, "id">>) {
  const existingIds = new Set(fields.map((field) => field.id));
  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  let nextId = `${baseId}-${suffix}`;
  while (existingIds.has(nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  return nextId;
}

export function createFormBuilderFieldFromDefinition(
  definition: FormBuilderLibraryFieldDefinition,
  fields: ReadonlyArray<FormsPlaceholderField>,
  schemaScopeKey?: string,
): FormsPlaceholderField {
  const displayName = definition.template.displayName?.trim() || definition.template.label;
  const id = createUniqueFieldId(definition.idBase, fields);

  return {
    ...definition.template,
    displayName,
    displayFields: definition.template.displayFields ? [...definition.template.displayFields] : undefined,
    id,
    isPersisted: false,
    options: definition.template.options ? [...definition.template.options] : undefined,
    schemaScopeKey,
    status: "draft",
    storageKey: createUniqueFormsPlaceholderStorageKey(
      definition.template.storageKey ?? displayName,
      id,
      fields,
      {
        schemaScopeKey,
      },
    ),
    sourceFilters: definition.template.sourceFilters ? [...definition.template.sourceFilters] : undefined,
  };
}

export function getFormBuilderFieldPaletteSection(field: FieldLike): Exclude<
  FormBuilderPaletteSectionKey,
  "content" | "layout" | "systemFields"
> {
  if (
    (field.preset && formsPlaceholderRelationshipPresets.has(field.preset as never)) ||
    field.kind === "db_lookup"
  ) {
    return "relationships";
  }

  if (field.preset && formsPlaceholderReadyMadePresets.has(field.preset as never)) {
    return "readyMadeFields";
  }

  if (field.family === "advanced") {
    return "advancedFields";
  }

  if (field.kind === "single_select" || field.kind === "multi_select") {
    return "choiceFields";
  }

  return "basicFields";
}
