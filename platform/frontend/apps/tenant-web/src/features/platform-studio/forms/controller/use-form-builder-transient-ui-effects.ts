import {
  useEffect,
  useRef,
} from "react";

import {
  type InspectorPanelTabValue,
} from "../components/inspector-panel";

type FormBuilderFilterTarget = {
  id: string;
};

type UseFormBuilderTransientUiEffectsInput = {
  currentViewFilterTargets: ReadonlyArray<FormBuilderFilterTarget>;
  inspectorTab: InspectorPanelTabValue;
  isViewTabAvailable: boolean;
  pendingDefaultFilterFieldId: string;
  selectedFieldId: string | undefined;
  selectedNodeId: string | undefined;
  closeLookupSourcePicker: () => void;
  closeRequirementRuleEditor: () => void;
  closeVisibilityRuleEditor: () => void;
  setDragOverChoiceOptionIndex: (index: null) => void;
  setDraggedChoiceOptionIndex: (index: null) => void;
  setInspectorTab: (tab: InspectorPanelTabValue) => void;
  setPendingDefaultFilterFieldId: (fieldId: string) => void;
};

export function useFormBuilderTransientUiEffects({
  closeLookupSourcePicker,
  closeRequirementRuleEditor,
  closeVisibilityRuleEditor,
  currentViewFilterTargets,
  inspectorTab,
  isViewTabAvailable,
  pendingDefaultFilterFieldId,
  selectedFieldId,
  selectedNodeId,
  setDragOverChoiceOptionIndex,
  setDraggedChoiceOptionIndex,
  setInspectorTab,
  setPendingDefaultFilterFieldId,
}: UseFormBuilderTransientUiEffectsInput) {
  const selectionPanelTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    closeVisibilityRuleEditor();
    closeRequirementRuleEditor();
    closeLookupSourcePicker();
  }, [
    closeLookupSourcePicker,
    closeRequirementRuleEditor,
    closeVisibilityRuleEditor,
    selectedNodeId,
  ]);

  useEffect(() => {
    setDraggedChoiceOptionIndex(null);
    setDragOverChoiceOptionIndex(null);
  }, [
    selectedFieldId,
    setDragOverChoiceOptionIndex,
    setDraggedChoiceOptionIndex,
  ]);

  useEffect(() => {
    if (inspectorTab !== "selection" || !selectedNodeId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      selectionPanelTopRef.current?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [inspectorTab, selectedNodeId]);

  useEffect(() => {
    if (currentViewFilterTargets.length === 0) {
      if (pendingDefaultFilterFieldId) {
        setPendingDefaultFilterFieldId("");
      }
      return;
    }

    if (!currentViewFilterTargets.some((field) => field.id === pendingDefaultFilterFieldId)) {
      setPendingDefaultFilterFieldId(currentViewFilterTargets[0]?.id ?? "");
    }
  }, [
    currentViewFilterTargets,
    pendingDefaultFilterFieldId,
    setPendingDefaultFilterFieldId,
  ]);

  useEffect(() => {
    if (inspectorTab === "view" && !isViewTabAvailable) {
      setInspectorTab("selection");
    }
  }, [inspectorTab, isViewTabAvailable, setInspectorTab]);

  return {
    selectionPanelTopRef,
  } as const;
}
