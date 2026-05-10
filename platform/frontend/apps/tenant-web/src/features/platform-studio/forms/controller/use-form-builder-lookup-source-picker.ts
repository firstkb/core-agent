import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getLookupSourceModelById,
  type LookupSourceModelOption,
} from "./form-builder-workspace-lookup-options";
import {
  type FormBuilderLookupSourcePickerState,
  hasActiveLookupFilter,
} from "./form-builder-workspace-lookup-source-picker";
import {
  type FormsPlaceholderField,
} from "../forms-placeholder-data";

type UseFormBuilderLookupSourcePickerInput = {
  availableLookupSourceModels: ReadonlyArray<LookupSourceModelOption>;
  loadErrorMessage: string;
  loadLookupSourceModel: (modelId: string) => Promise<LookupSourceModelOption | null>;
  lookupSourceModelsById: Record<string, LookupSourceModelOption>;
  selectedField: FormsPlaceholderField | null;
  selectedFieldIsPresetLookup: boolean;
};

export function useFormBuilderLookupSourcePicker({
  availableLookupSourceModels,
  loadErrorMessage,
  loadLookupSourceModel,
  lookupSourceModelsById,
  selectedField,
  selectedFieldIsPresetLookup,
}: UseFormBuilderLookupSourcePickerInput) {
  const [lookupSourcePicker, setLookupSourcePicker] = useState<FormBuilderLookupSourcePickerState | null>(null);
  const [isLookupSourcePickerLoading, setIsLookupSourcePickerLoading] = useState(false);
  const [lookupSourcePickerError, setLookupSourcePickerError] = useState<string | null>(null);

  const lookupSourcePickerModel = useMemo(
    () => getLookupSourceModelById(availableLookupSourceModels, lookupSourcePicker?.modelId),
    [availableLookupSourceModels, lookupSourcePicker?.modelId],
  );

  const closeLookupSourcePicker = useCallback(() => {
    setLookupSourcePicker(null);
    setLookupSourcePickerError(null);
    setIsLookupSourcePickerLoading(false);
  }, []);

  const openLookupSourcePicker = useCallback(() => {
    if (!selectedField || selectedField.kind !== "db_lookup" || selectedFieldIsPresetLookup) {
      return;
    }

    const requestedModelId = selectedField.lookupConfig?.sourceModel?.trim();
    const initialModelId = requestedModelId && availableLookupSourceModels.some((entry) => entry.id === requestedModelId)
      ? requestedModelId
      : availableLookupSourceModels[0]?.id ?? "";
    const initialSourceModel = getLookupSourceModelById(availableLookupSourceModels, initialModelId);

    setLookupSourcePickerError(null);
    setLookupSourcePicker({
      activeFilterEnabled: hasActiveLookupFilter(selectedField.lookupConfig)
        || (!requestedModelId && Boolean(initialSourceModel?.activeFilterField)),
      fieldId: selectedField.id,
      modelId: initialModelId,
      selectedFieldKeys: selectedField.displayFields?.length
        ? [...selectedField.displayFields]
        : [],
      sortFieldKey: selectedField.lookupConfig?.sortField ?? "",
    });
  }, [availableLookupSourceModels, selectedField, selectedFieldIsPresetLookup]);

  const setLookupSourcePickerModel = useCallback((
    modelId: string,
    selectedFieldKeys: ReadonlyArray<string>,
    sortFieldKey: string,
    activeFilterEnabled: boolean,
  ) => {
    setLookupSourcePicker((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            activeFilterEnabled,
            modelId,
            selectedFieldKeys: [...selectedFieldKeys],
            sortFieldKey,
          }
        : currentValue
    );
  }, []);

  const setLookupSourcePickerActiveFilter = useCallback((activeFilterEnabled: boolean) => {
    setLookupSourcePicker((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            activeFilterEnabled,
          }
        : currentValue
    );
  }, []);

  const setLookupSourcePickerFieldChecked = useCallback((fieldKey: string, checked: boolean) => {
    setLookupSourcePicker((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            selectedFieldKeys: checked
              ? Array.from(new Set([...currentValue.selectedFieldKeys, fieldKey]))
              : currentValue.selectedFieldKeys.filter((entry) => entry !== fieldKey),
          }
        : currentValue
    );
  }, []);

  const setLookupSourcePickerSortField = useCallback((sortFieldKey: string) => {
    setLookupSourcePicker((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            sortFieldKey: sortFieldKey || (lookupSourcePickerModel?.defaultSortField ?? ""),
          }
        : currentValue
    );
  }, [lookupSourcePickerModel?.defaultSortField]);

  const onLookupSourcePickerOpenChange = useCallback((open: boolean) => {
    if (!open) {
      closeLookupSourcePicker();
    }
  }, [closeLookupSourcePicker]);

  useEffect(() => {
    const targetModelId = lookupSourcePicker?.modelId?.trim();
    if (!targetModelId) {
      setIsLookupSourcePickerLoading(false);
      setLookupSourcePickerError(null);
      return;
    }

    if (lookupSourceModelsById[targetModelId]) {
      setIsLookupSourcePickerLoading(false);
      setLookupSourcePickerError(null);
      return;
    }

    let isActive = true;
    setIsLookupSourcePickerLoading(true);
    setLookupSourcePickerError(null);

    void loadLookupSourceModel(targetModelId)
      .then(() => {
        if (!isActive) {
          return;
        }

        setIsLookupSourcePickerLoading(false);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setLookupSourcePickerError(error instanceof Error ? error.message : loadErrorMessage);
        setIsLookupSourcePickerLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [
    loadErrorMessage,
    loadLookupSourceModel,
    lookupSourceModelsById,
    lookupSourcePicker?.modelId,
  ]);

  useEffect(() => {
    if (!lookupSourcePicker || !lookupSourcePickerModel) {
      return;
    }

    if (lookupSourcePicker.selectedFieldKeys.length > 0 && lookupSourcePicker.sortFieldKey.trim()) {
      return;
    }

    setLookupSourcePicker((currentValue) => {
      if (!currentValue || currentValue.modelId !== lookupSourcePickerModel.id) {
        return currentValue;
      }

      return {
        ...currentValue,
        selectedFieldKeys: currentValue.selectedFieldKeys.length > 0
          ? currentValue.selectedFieldKeys
          : [...lookupSourcePickerModel.defaultDisplayFields],
        sortFieldKey: currentValue.sortFieldKey.trim() || lookupSourcePickerModel.defaultSortField,
      };
    });
  }, [lookupSourcePicker, lookupSourcePickerModel]);

  return {
    closeLookupSourcePicker,
    isLookupSourcePickerLoading,
    lookupSourcePicker,
    lookupSourcePickerError,
    lookupSourcePickerModel,
    onLookupSourcePickerOpenChange,
    openLookupSourcePicker,
    setLookupSourcePickerFieldChecked,
    setLookupSourcePickerModel,
    setLookupSourcePickerSortField,
    setLookupSourcePickerActiveFilter,
  } as const;
}
