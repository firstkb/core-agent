import type {
  FormBuilderChecklistConfig,
  FormBuilderChecklistGrouping,
} from "./forms-builder-state";
import {
  createUniqueFormsPlaceholderStorageKey,
  type FormsPlaceholderField,
} from "./forms-placeholder-data";

const checklistDefaultResultOptions = ["Yes", "No", "N/A"] as const;

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

function createChecklistField({
  baseId,
  fields,
  label,
  partial,
  schemaScopeKey,
}: {
  baseId: string;
  fields: ReadonlyArray<FormsPlaceholderField>;
  label: string;
  partial: Omit<FormsPlaceholderField, "displayName" | "id" | "isLocked" | "isPersisted" | "label" | "schemaScopeKey" | "status" | "storageKey">;
  schemaScopeKey: string;
}): FormsPlaceholderField {
  const id = createUniqueFieldId(baseId, fields);

  return {
    ...partial,
    displayName: label,
    id,
    isLocked: true,
    isPersisted: false,
    label,
    schemaScopeKey,
    status: "draft",
    storageKey: createUniqueFormsPlaceholderStorageKey(label, id, fields, { schemaScopeKey }),
  };
}

export function createChecklistSubformDraftFields(
  fields: ReadonlyArray<FormsPlaceholderField>,
  schemaScopeKey: string,
) {
  const lookupField = createChecklistField({
    baseId: "item",
    fields,
    label: "Item",
    partial: {
      family: "choice",
      kind: "db_lookup",
      lookupConfig: {
        displayMode: "search_select",
        searchBehavior: "ajax",
      },
      selectionMode: "single",
      sourceLabel: "Lookup source",
    },
    schemaScopeKey,
  });
  const resultField = createChecklistField({
    baseId: "result",
    fields: [...fields, lookupField],
    label: "Result",
    partial: {
      choiceDisplay: {
        allowEmpty: false,
        optionStyles: [
          { option: checklistDefaultResultOptions[0], variant: "success" },
          { option: checklistDefaultResultOptions[1], variant: "danger" },
          { option: checklistDefaultResultOptions[2], variant: "secondary" },
        ],
        orientation: "horizontal",
        renderStyle: "buttons",
      },
      family: "choice",
      kind: "single_select",
      options: [...checklistDefaultResultOptions],
    },
    schemaScopeKey,
  });
  const notesField = createChecklistField({
    baseId: "notes",
    fields: [...fields, lookupField, resultField],
    label: "Notes",
    partial: {
      family: "core",
      kind: "long_text",
    },
    schemaScopeKey,
  });

  return {
    config: {
      grouping: "flat" satisfies FormBuilderChecklistGrouping,
      lookupFieldId: lookupField.id,
      notesFieldId: notesField.id,
      resultFieldId: resultField.id,
    } satisfies FormBuilderChecklistConfig,
    fields: [lookupField, resultField, notesField],
    lookupField,
    notesField,
    resultField,
  };
}
