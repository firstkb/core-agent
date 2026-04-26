import {
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@platform/ui-kit";

export type ChoiceOptionRowLabels = {
  actionsMenu: string;
  dragToReorder: string;
  removeOption: string;
};

type ChoiceOptionRowProps = {
  canEdit: boolean;
  canMoveItems: boolean;
  dragOverOptionIndex: number | null;
  draggedOptionIndex: number | null;
  index: number;
  labels: ChoiceOptionRowLabels;
  onChangeValue: (value: string) => void;
  onDragEnd: () => void;
  onDragOverOption: () => void;
  onDragStartOption: () => void;
  onDropOption: () => void;
  onRemove: () => void;
  value: string;
};

export function ChoiceOptionRow({
  canEdit,
  canMoveItems,
  dragOverOptionIndex,
  draggedOptionIndex,
  index,
  labels,
  onChangeValue,
  onDragEnd,
  onDragOverOption,
  onDragStartOption,
  onDropOption,
  onRemove,
  value,
}: ChoiceOptionRowProps) {
  const isDragging = draggedOptionIndex === index;
  const isDropTarget = dragOverOptionIndex === index && draggedOptionIndex !== index;

  return (
    <div
      className={`tenant-web__platform-studio-compact-row tenant-web__platform-studio-choice-option-row${isDragging ? " tenant-web__platform-studio-canvas-item--dragging" : ""}${isDropTarget ? " tenant-web__platform-studio-canvas-item--drop-target" : ""}`}
      draggable={canMoveItems}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDragOverOption();
      }}
      onDragStart={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
        onDragStartOption();
      }}
      onDrop={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDropOption();
      }}
    >
      <div className="tenant-web__platform-studio-choice-option-main">
        {canMoveItems ? (
          <span
            className="tenant-web__platform-studio-drag-handle"
            title={labels.dragToReorder}
          >
            <DragHandleIcon />
          </span>
        ) : null}

        <div className="tenant-web__platform-studio-choice-option-editor">
          <Input
            disabled={!canEdit}
            id={`tenant-platform-studio-choice-option-${index}`}
            onChange={(event) => onChangeValue(event.target.value)}
            value={value}
          />
        </div>
      </div>

      <Menu align="end">
        <MenuTrigger>
          <button
            aria-label={labels.actionsMenu}
            className="tenant-web__platform-studio-menu-trigger tenant-web__platform-studio-menu-trigger--compact"
            disabled={!canEdit}
            type="button"
          >
            <span aria-hidden="true" className="tenant-web__platform-studio-menu-trigger-dots">⋮</span>
          </button>
        </MenuTrigger>
        <MenuContent className="tenant-web__platform-studio-menu">
          <MenuItem
            onClick={onRemove}
            tone="danger"
          >
            {labels.removeOption}
          </MenuItem>
        </MenuContent>
      </Menu>
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
