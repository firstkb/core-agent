import {
  useState,
} from "react";

import {
  type FormBuilderDocument,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
} from "../forms-placeholder-data";
import {
  createFormBuilderCanvasHandlers,
} from "./form-builder-workspace-canvas-handlers";

type UpdateDocument = (
  updater: (currentDocument: FormBuilderDocument) => FormBuilderDocument,
) => void;

type UseFormBuilderWorkspaceDragControllersInput = {
  currentScopeParentId: string | null;
  currentScopeUnplacedFields: ReadonlyArray<FormsPlaceholderField>;
  reorderGridColumns: (sourceFieldId: string, targetFieldId: string) => void;
  reorderSelectedFieldOption: (fromIndex: number, toIndex: number) => void;
  selectInspectorSelectionTab: () => void;
  updateDocument: UpdateDocument;
};

export function useFormBuilderWorkspaceDragControllers({
  currentScopeParentId,
  currentScopeUnplacedFields,
  reorderGridColumns,
  reorderSelectedFieldOption,
  selectInspectorSelectionTab,
  updateDocument,
}: UseFormBuilderWorkspaceDragControllersInput) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [draggedGridFieldId, setDraggedGridFieldId] = useState<string | null>(null);
  const [dragOverGridFieldId, setDragOverGridFieldId] = useState<string | null>(null);
  const [draggedChoiceOptionIndex, setDraggedChoiceOptionIndex] = useState<number | null>(null);
  const [dragOverChoiceOptionIndex, setDragOverChoiceOptionIndex] = useState<number | null>(null);

  function resetChoiceOptionDragState() {
    setDraggedChoiceOptionIndex(null);
    setDragOverChoiceOptionIndex(null);
  }

  function handleChoiceOptionDragStart(optionIndex: number) {
    setDraggedChoiceOptionIndex(optionIndex);
    setDragOverChoiceOptionIndex(optionIndex);
  }

  function handleChoiceOptionDrop(optionIndex: number) {
    if (draggedChoiceOptionIndex === null || draggedChoiceOptionIndex === optionIndex) {
      setDragOverChoiceOptionIndex(null);
      return;
    }

    reorderSelectedFieldOption(draggedChoiceOptionIndex, optionIndex);
    resetChoiceOptionDragState();
  }

  function resetGridFieldDragState() {
    setDraggedGridFieldId(null);
    setDragOverGridFieldId(null);
  }

  function handleGridFieldDragStart(fieldId: string) {
    setDraggedGridFieldId(fieldId);
    setDragOverGridFieldId(fieldId);
  }

  function handleGridFieldDrop(fieldId: string) {
    if (!draggedGridFieldId || draggedGridFieldId === fieldId) {
      return;
    }

    reorderGridColumns(draggedGridFieldId, fieldId);
    resetGridFieldDragState();
  }

  const canvasHandlers = createFormBuilderCanvasHandlers({
    currentScopeParentId,
    currentScopeUnplacedFields,
    draggedNodeId,
    selectInspectorSelectionTab,
    setDragOverNodeId,
    setDraggedNodeId,
    updateDocument,
  });

  return {
    ...canvasHandlers,
    dragOverChoiceOptionIndex,
    dragOverGridFieldId,
    dragOverNodeId,
    draggedChoiceOptionIndex,
    draggedGridFieldId,
    draggedNodeId,
    handleChoiceOptionDragStart,
    handleChoiceOptionDrop,
    handleGridFieldDragStart,
    handleGridFieldDrop,
    resetChoiceOptionDragState,
    resetGridFieldDragState,
    setDragOverChoiceOptionIndex,
    setDragOverGridFieldId,
    setDragOverNodeId,
    setDraggedChoiceOptionIndex,
  } as const;
}
