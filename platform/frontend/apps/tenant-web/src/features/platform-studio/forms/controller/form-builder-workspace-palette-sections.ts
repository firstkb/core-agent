import { formBuilderPaletteSectionDefinitions } from "../forms-builder-library";
import {
  getElementPaletteItems,
  getFieldPaletteItems,
  type FormBuilderDocument,
  type FormBuilderFieldPaletteCategory,
  type FormBuilderWorkspaceAccess,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
} from "../forms-placeholder-data";
import {
  getAuthoringFieldLabel,
} from "./form-builder-workspace-field-scope-grid";
import {
  createPaletteDisplaySections,
} from "./form-builder-workspace-palette-items";
import {
  createSystemFieldPaletteItems,
} from "./form-builder-workspace-system-fields";

type PaletteSections = Parameters<typeof createPaletteDisplaySections>[0]["sections"];

export function getCurrentScopeUnplacedFields({
  currentScopeUnplacedFieldIds,
  document,
  fields,
}: {
  currentScopeUnplacedFieldIds: ReadonlyArray<string>;
  document: FormBuilderDocument;
  fields: ReadonlyArray<FormsPlaceholderField>;
}) {
  const fieldById = new Map(fields.map((field) => [field.id, {
    ...field,
    label: getAuthoringFieldLabel(field, document),
  }]));

  return currentScopeUnplacedFieldIds.flatMap((fieldId) => {
    const field = fieldById.get(fieldId);
    return field ? [field] : [];
  });
}

export function createFormBuilderWorkspacePaletteSections({
  canPlaceFieldAtCurrentLevel,
  document,
  paletteQuery,
  structureEditingAccess,
}: {
  canPlaceFieldAtCurrentLevel: boolean;
  document: FormBuilderDocument;
  paletteQuery: string;
  structureEditingAccess: FormBuilderWorkspaceAccess;
}): PaletteSections {
  const elementItems = getElementPaletteItems(document, structureEditingAccess, paletteQuery);
  const fieldItems = getFieldPaletteItems(document, structureEditingAccess, paletteQuery);
  const systemFieldItems = createSystemFieldPaletteItems({
    canPlaceFieldAtCurrentLevel,
    document,
    fieldPlacementAccess: structureEditingAccess,
    paletteQuery,
  });

  return formBuilderPaletteSectionDefinitions
    .map((section) => {
      if (section.key === "layout" || section.key === "content") {
        return {
          items: elementItems.filter((item) => item.category === section.key),
          key: section.key,
          labelKey: section.labelKey,
        };
      }

      if (section.key === "systemFields") {
        return {
          items: systemFieldItems,
          key: section.key,
          labelKey: section.labelKey,
        };
      }

      return {
        items: fieldItems.filter((item) => item.category === section.key as FormBuilderFieldPaletteCategory),
        key: section.key,
        labelKey: section.labelKey,
      };
    })
    .filter((section) => section.items.length > 0);
}
