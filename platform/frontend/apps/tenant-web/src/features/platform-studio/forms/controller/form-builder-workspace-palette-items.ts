import { type useTranslation } from "@platform/i18n";

import { type FieldPaletteDisplaySection } from "../components/field-palette";
import { type FormBuilderLibraryFieldDefinition } from "../forms-builder-library";
import {
  type FormBuilderElementPaletteItem,
  type FormBuilderFieldPaletteItem,
} from "../forms-builder-state";

type Translate = ReturnType<typeof useTranslation>["t"];

export type SystemFieldRole = "reportedBy" | "reportedDate" | "workflowStatus";

export type SystemFieldPaletteItem = {
  descriptionKey: string;
  disabled: boolean;
  disabledReasonKey: string | null;
  iconKey: string;
  key: SystemFieldRole;
  kind: "systemField";
  labelKey: string;
  searchTerms: ReadonlyArray<string>;
};

type PaletteSection = {
  items: ReadonlyArray<FormBuilderElementPaletteItem | FormBuilderFieldPaletteItem | SystemFieldPaletteItem>;
  key: string;
  labelKey: string;
};

export const systemFieldRoles: ReadonlyArray<SystemFieldRole> = ["reportedBy", "reportedDate", "workflowStatus"];

export function createPaletteDisplaySections({
  getFieldPaletteDescription,
  onAddElement,
  onCreateLibraryField,
  onCreateSystemField,
  sections,
  t,
}: {
  getFieldPaletteDescription: (
    field: FormBuilderLibraryFieldDefinition["template"],
    t: Translate,
  ) => string;
  onAddElement: (
    nodeType: FormBuilderElementPaletteItem["nodeType"],
    initialNode: FormBuilderElementPaletteItem["initialNode"],
  ) => void;
  onCreateLibraryField: (definition: FormBuilderLibraryFieldDefinition) => void;
  onCreateSystemField: (role: SystemFieldRole) => void;
  sections: ReadonlyArray<PaletteSection>;
  t: Translate;
}): ReadonlyArray<FieldPaletteDisplaySection> {
  return sections.map((section) => ({
    items: section.items.map((item) => {
      if (item.kind === "element") {
        return {
          description: t(item.descriptionKey),
          disabled: item.disabled,
          disabledReason: item.disabledReasonKey ? t(item.disabledReasonKey) : null,
          iconKey: item.iconKey,
          key: `${item.nodeType}:${item.labelKey}`,
          label: t(item.labelKey),
          onClick: () => onAddElement(item.nodeType, item.initialNode),
        };
      }

      if (item.kind === "systemField") {
        return {
          description: t(item.descriptionKey),
          disabled: item.disabled,
          disabledReason: item.disabledReasonKey ? t(item.disabledReasonKey) : null,
          iconKey: item.iconKey,
          key: item.key,
          label: t(item.labelKey),
          onClick: () => onCreateSystemField(item.key),
        };
      }

      return {
        description: getFieldPaletteDescription(item.definition.template, t),
        disabled: item.disabled,
        disabledReason: item.disabledReasonKey ? t(item.disabledReasonKey) : null,
        iconKey: item.iconKey,
        key: item.definition.idBase,
        label: t(item.definition.labelKey),
        onClick: () => onCreateLibraryField(item.definition),
      };
    }),
    key: section.key,
    label: t(section.labelKey),
  }));
}
