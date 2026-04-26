import {
  Badge,
  Button,
  EyeIcon,
} from "@platform/ui-kit";

import { FormBuilderElementIcon } from "../forms-builder-icons";

export type BuilderCanvasNodeVisibility = "hidden" | "readonly" | "visible";

export type BuilderCanvasNodeItem = {
  hasAttention: boolean;
  iconKey: string;
  id: string;
  isContainer: boolean;
  label: string;
  summary: string;
  visibility: BuilderCanvasNodeVisibility;
};

type BuilderCanvasNodeRowProps = {
  canEditVisibility: boolean;
  canMoveItems: boolean;
  currentLevelBadgeLabel: string;
  currentLevelId: string | null;
  dragOverNodeId: string | null;
  dragToReorderLabel: string;
  draggedNodeId: string | null;
  item: BuilderCanvasNodeItem;
  onDragEnd: () => void;
  onDragOverNode: () => void;
  onDragStartNode: () => void;
  onDropNode: () => void;
  onOpenLevel: () => void;
  onSelect: () => void;
  onToggleVisibility: () => void;
  openWorkspaceLabel: string;
  selectedNodeId: string | null;
  visibilityLabels: Record<BuilderCanvasNodeVisibility, string>;
};

export function BuilderCanvasNodeRow({
  canEditVisibility,
  canMoveItems,
  currentLevelBadgeLabel,
  currentLevelId,
  dragOverNodeId,
  dragToReorderLabel,
  draggedNodeId,
  item,
  onDragEnd,
  onDragOverNode,
  onDragStartNode,
  onDropNode,
  onOpenLevel,
  onToggleVisibility,
  onSelect,
  openWorkspaceLabel,
  selectedNodeId,
  visibilityLabels,
}: BuilderCanvasNodeRowProps) {
  const isSelected = selectedNodeId === item.id;
  const isCurrentLevel = currentLevelId === item.id;
  const isDragging = draggedNodeId === item.id;
  const isDropTarget = dragOverNodeId === item.id && draggedNodeId !== item.id;
  const visibilityToneClass =
    item.visibility === "readonly"
      ? " tenant-web__platform-studio-canvas-visibility-button--readonly"
      : item.visibility === "hidden"
        ? " tenant-web__platform-studio-canvas-visibility-button--hidden"
        : " tenant-web__platform-studio-canvas-visibility-button--visible";

  return (
    <div
      className={`tenant-web__platform-studio-canvas-item${isSelected ? " tenant-web__platform-studio-canvas-item--selected" : ""}${isDragging ? " tenant-web__platform-studio-canvas-item--dragging" : ""}${isDropTarget ? " tenant-web__platform-studio-canvas-item--drop-target" : ""}${item.hasAttention ? " tenant-web__platform-studio-canvas-item--attention" : ""}`}
      draggable={canMoveItems}
      role="button"
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDragOverNode();
      }}
      onDragStart={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.id);
        onDragStartNode();
      }}
      onDrop={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDropNode();
      }}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="tenant-web__platform-studio-canvas-item-main">
        {canMoveItems ? (
          <span className="tenant-web__platform-studio-drag-handle" title={dragToReorderLabel}>
            <DragHandleIcon />
          </span>
        ) : null}
        <span className="tenant-web__platform-studio-item-icon tenant-web__platform-studio-item-icon--canvas">
          <FormBuilderElementIcon iconKey={item.iconKey} />
        </span>
        <div className="tenant-web__platform-studio-canvas-copy">
          <span className="tenant-web__platform-studio-canvas-item-title">{item.label}</span>
          <span className="tenant-web__platform-studio-canvas-item-summary">{item.summary}</span>
        </div>
      </div>

      <div className="tenant-web__platform-studio-canvas-actions">
        <button
          aria-label={visibilityLabels[item.visibility]}
          className={`tenant-web__platform-studio-canvas-visibility-button${visibilityToneClass}`}
          disabled={!canEditVisibility}
          onClick={(event) => {
            event.stopPropagation();
            onToggleVisibility();
          }}
          title={visibilityLabels[item.visibility]}
          type="button"
        >
          <EyeIcon />
        </button>
        {item.isContainer ? (
          <>
            {isCurrentLevel ? (
              <Badge appearance="soft" size="sm" variant="brand">
                {currentLevelBadgeLabel}
              </Badge>
            ) : (
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenLevel();
                }}
                size="sm"
                variant="secondary"
              >
                {openWorkspaceLabel}
              </Button>
            )}
          </>
        ) : null}
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
