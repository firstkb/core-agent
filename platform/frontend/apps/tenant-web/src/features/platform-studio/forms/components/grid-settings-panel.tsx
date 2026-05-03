import { useState } from "react";

import { Switch } from "@platform/ui-kit";

import { FormBuilderElementIcon } from "../forms-builder-icons";

export type GridSettingsFieldItem = {
  iconKey: string;
  id: string;
  label: string;
  visible: boolean;
};

type GridSettingsPanelProps = {
  canEdit: boolean;
  canMoveItems: boolean;
  checklistUnsupportedText: string;
  dragOverFieldId: string | null;
  dragToReorderLabel: string;
  draggedFieldId: string | null;
  fieldItems: ReadonlyArray<GridSettingsFieldItem>;
  isChecklistGridScope: boolean;
  meta: string;
  noVisibleFieldsText: string;
  noFieldsText: string;
  onDragEnd: () => void;
  onDragOverField: (fieldId: string) => void;
  onDragStartField: (fieldId: string) => void;
  onDropField: (fieldId: string) => void;
  onToggleVisible: (fieldId: string, checked: boolean) => void;
  title: string;
  showVisibleOnlyText: string;
  visibleInGridText: string;
  hiddenInGridText: string;
};

export function GridSettingsPanel({
  canEdit,
  canMoveItems,
  checklistUnsupportedText,
  dragOverFieldId,
  dragToReorderLabel,
  draggedFieldId,
  fieldItems,
  isChecklistGridScope,
  meta,
  noVisibleFieldsText,
  noFieldsText,
  onDragEnd,
  onDragOverField,
  onDragStartField,
  onDropField,
  onToggleVisible,
  title,
  showVisibleOnlyText,
  visibleInGridText,
  hiddenInGridText,
}: GridSettingsPanelProps) {
  const [showVisibleOnly, setShowVisibleOnly] = useState(false);
  const visibleFieldItems = getFilteredGridSettingsFieldItems(fieldItems, showVisibleOnly);

  return (
    <div className="tenant-web__platform-studio-builder-stack">
      <div className="tenant-web__platform-studio-inspector-section">
        <div className="tenant-web__platform-studio-inspector-head">
          <div>
            <p className="tenant-web__platform-studio-inspector-title">
              {title}
            </p>
            <p className="tenant-web__platform-studio-inspector-meta">
              {meta}
            </p>
          </div>
        </div>

        <div className="tenant-web__platform-studio-builder-stack">
          {isChecklistGridScope ? (
            <p className="tenant-web__platform-studio-inline-help">
              {checklistUnsupportedText}
            </p>
          ) : fieldItems.length === 0 ? (
            <p className="tenant-web__platform-studio-inline-help">
              {noFieldsText}
            </p>
          ) : (
            <div className="tenant-web__platform-studio-builder-stack">
              <div className="tenant-web__platform-studio-switch-row tenant-web__platform-studio-switch-row--plain tenant-web__platform-studio-switch-row--element-inline">
                <span className="tenant-web__platform-studio-form-inline-label">
                  {showVisibleOnlyText}
                </span>
                <Switch
                  aria-label={showVisibleOnlyText}
                  checked={showVisibleOnly}
                  onCheckedChange={setShowVisibleOnly}
                  size="sm"
                />
              </div>

              {visibleFieldItems.length === 0 ? (
                <p className="tenant-web__platform-studio-inline-help">
                  {noVisibleFieldsText}
                </p>
              ) : visibleFieldItems.map((field) => (
                <GridColumnRow
                  canEdit={canEdit}
                  canMoveItems={canMoveItems}
                  dragOverFieldId={dragOverFieldId}
                  dragToReorderLabel={dragToReorderLabel}
                  draggedFieldId={draggedFieldId}
                  field={field}
                  hiddenInGridText={hiddenInGridText}
                  key={`grid-column-${field.id}`}
                  onDragEnd={onDragEnd}
                  onDragOverField={() => onDragOverField(field.id)}
                  onDragStartField={() => onDragStartField(field.id)}
                  onDropField={() => onDropField(field.id)}
                  onToggleVisible={(checked) => onToggleVisible(field.id, checked)}
                  visibleInGridText={visibleInGridText}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function getFilteredGridSettingsFieldItems(
  fieldItems: ReadonlyArray<GridSettingsFieldItem>,
  showVisibleOnly: boolean,
) {
  return showVisibleOnly ? fieldItems.filter((field) => field.visible) : fieldItems;
}

function GridColumnRow({
  canEdit,
  canMoveItems,
  dragOverFieldId,
  draggedFieldId,
  dragToReorderLabel,
  field,
  hiddenInGridText,
  onDragEnd,
  onDragOverField,
  onDragStartField,
  onDropField,
  onToggleVisible,
  visibleInGridText,
}: {
  canEdit: boolean;
  canMoveItems: boolean;
  dragOverFieldId: string | null;
  draggedFieldId: string | null;
  dragToReorderLabel: string;
  field: GridSettingsFieldItem;
  hiddenInGridText: string;
  onDragEnd: () => void;
  onDragOverField: () => void;
  onDragStartField: () => void;
  onDropField: () => void;
  onToggleVisible: (checked: boolean) => void;
  visibleInGridText: string;
}) {
  const isDragging = draggedFieldId === field.id;
  const isDropTarget = dragOverFieldId === field.id && draggedFieldId !== field.id;

  return (
    <div
      className={`tenant-web__platform-studio-canvas-item tenant-web__platform-studio-grid-column-item${isDragging ? " tenant-web__platform-studio-canvas-item--dragging" : ""}${isDropTarget ? " tenant-web__platform-studio-canvas-item--drop-target" : ""}`}
      draggable={canMoveItems}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDragOverField();
      }}
      onDragStart={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", field.id);
        onDragStartField();
      }}
      onDrop={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDropField();
      }}
    >
      <div className="tenant-web__platform-studio-canvas-item-main">
        {canMoveItems ? (
          <span className="tenant-web__platform-studio-drag-handle" title={dragToReorderLabel}>
            <DragHandleIcon />
          </span>
        ) : null}
        <span className="tenant-web__platform-studio-item-icon tenant-web__platform-studio-item-icon--canvas">
          <FormBuilderElementIcon iconKey={field.iconKey} />
        </span>
        <div className="tenant-web__platform-studio-canvas-copy">
          <span className="tenant-web__platform-studio-canvas-item-title">{field.label}</span>
          <span className="tenant-web__platform-studio-canvas-item-summary">
            {field.visible ? visibleInGridText : hiddenInGridText}
          </span>
        </div>
      </div>

      <div className="tenant-web__platform-studio-grid-column-switch">
        <Switch
          checked={field.visible}
          disabled={!canEdit}
          onCheckedChange={onToggleVisible}
          size="sm"
        />
      </div>
    </div>
  );
}

function DragHandleIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
    >
      <circle cx="7" cy="6" fill="currentColor" r="1.1" />
      <circle cx="13" cy="6" fill="currentColor" r="1.1" />
      <circle cx="7" cy="10" fill="currentColor" r="1.1" />
      <circle cx="13" cy="10" fill="currentColor" r="1.1" />
      <circle cx="7" cy="14" fill="currentColor" r="1.1" />
      <circle cx="13" cy="14" fill="currentColor" r="1.1" />
    </svg>
  );
}
