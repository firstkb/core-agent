import {
  addFormBuilderFieldNode,
  reorderFormBuilderNode,
  selectFormBuilderNode,
  setFormBuilderCurrentParent,
  type FormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";
import { applyCanvasNodeVisibilityCycleUpdate } from "./form-builder-workspace-canvas-actions";

type CreateCanvasHandlersInput = {
  currentScopeParentId: string | null;
  currentScopeUnplacedFields: ReadonlyArray<FormsPlaceholderField>;
  draggedNodeId: string | null;
  selectInspectorSelectionTab: () => void;
  setDragOverNodeId: (nodeId: string | null) => void;
  setDraggedNodeId: (nodeId: string | null) => void;
  updateDocument: (
    updater: (currentDocument: FormBuilderDocument) => FormBuilderDocument,
  ) => void;
};

export function createFormBuilderCanvasHandlers({
  currentScopeParentId,
  currentScopeUnplacedFields,
  draggedNodeId,
  selectInspectorSelectionTab,
  setDragOverNodeId,
  setDraggedNodeId,
  updateDocument,
}: CreateCanvasHandlersInput) {
  function resetCanvasDragState() {
    setDraggedNodeId(null);
    setDragOverNodeId(null);
  }

  function handleCanvasDragStart(nodeId: string) {
    setDraggedNodeId(nodeId);
    setDragOverNodeId(nodeId);
  }

  function handleCanvasDrop(nodeId: string) {
    if (!draggedNodeId || draggedNodeId === nodeId) {
      setDragOverNodeId(null);
      return;
    }

    updateDocument((currentDocument) =>
      reorderFormBuilderNode(currentDocument, draggedNodeId, nodeId)
    );
    resetCanvasDragState();
  }

  function openCanvasLevel(nodeId: string) {
    updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, nodeId));
  }

  function openCanvasRoot() {
    updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, null));
  }

  function placeCanvasUnplacedField(fieldId: string) {
    const field = currentScopeUnplacedFields.find((entry) => entry.id === fieldId);
    if (!field) {
      return;
    }

    updateDocument((currentDocument) =>
      addFormBuilderFieldNode(currentDocument, currentScopeParentId, field)
    );
  }

  function selectCanvasNode(nodeId: string) {
    updateDocument((currentDocument) => selectFormBuilderNode(currentDocument, nodeId));
    selectInspectorSelectionTab();
  }

  function toggleCanvasNodeVisibility(
    nodeId: string,
    visibility: FormBuilderNode["visibility"],
  ) {
    updateDocument((currentDocument) => applyCanvasNodeVisibilityCycleUpdate(currentDocument, nodeId, visibility));
  }

  return {
    handleCanvasDragStart,
    handleCanvasDrop,
    openCanvasLevel,
    openCanvasRoot,
    placeCanvasUnplacedField,
    resetCanvasDragState,
    selectCanvasNode,
    toggleCanvasNodeVisibility,
  } as const;
}
