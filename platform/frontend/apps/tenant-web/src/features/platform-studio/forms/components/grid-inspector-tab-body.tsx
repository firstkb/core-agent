import { type useTranslation } from "@platform/i18n";

import {
  GridSettingsPanel,
  type GridSettingsFieldItem,
} from "./grid-settings-panel";

type Translate = ReturnType<typeof useTranslation>["t"];

type GridInspectorTabBodyProps = {
  canEditSettings: boolean;
  canMoveItems: boolean;
  dragOverFieldId: string | null;
  draggedFieldId: string | null;
  fieldItems: ReadonlyArray<GridSettingsFieldItem>;
  isChecklistGridScope: boolean;
  meta: string;
  onDragEnd: () => void;
  onDragOverField: (fieldId: string) => void;
  onDragStartField: (fieldId: string) => void;
  onDropField: (fieldId: string) => void;
  onToggleVisible: (fieldId: string, checked: boolean) => void;
  t: Translate;
  title: string;
};

export function GridInspectorTabBody({
  canEditSettings,
  canMoveItems,
  dragOverFieldId,
  draggedFieldId,
  fieldItems,
  isChecklistGridScope,
  meta,
  onDragEnd,
  onDragOverField,
  onDragStartField,
  onDropField,
  onToggleVisible,
  t,
  title,
}: GridInspectorTabBodyProps) {
  return (
    <GridSettingsPanel
      canEdit={canEditSettings}
      canMoveItems={canMoveItems}
      checklistUnsupportedText={t("tenant.platformStudio.forms.builder.grid.checklistUnsupported")}
      dragOverFieldId={dragOverFieldId}
      draggedFieldId={draggedFieldId}
      dragToReorderLabel={t("tenant.platformStudio.forms.builder.dragToReorder")}
      fieldItems={fieldItems}
      hiddenInGridText={t("tenant.platformStudio.forms.builder.grid.hiddenInGrid")}
      isChecklistGridScope={isChecklistGridScope}
      meta={meta}
      noFieldsText={t("tenant.platformStudio.forms.builder.grid.noFields")}
      onDragEnd={onDragEnd}
      onDragOverField={onDragOverField}
      onDragStartField={onDragStartField}
      onDropField={onDropField}
      onToggleVisible={onToggleVisible}
      title={title}
      visibleInGridText={t("tenant.platformStudio.forms.builder.grid.visibleInGrid")}
    />
  );
}
