import { useMemo } from "react";

import { type useTranslation } from "@platform/i18n";

import {
  type FormsPlaceholderField,
} from "../forms-placeholder-data";
import {
  getLookupSortFieldSummary,
  getLookupSourceModelById,
  getLookupStoredValueSummary,
  type LookupSourceModelOption,
} from "./form-builder-workspace-lookup-options";

type Translate = ReturnType<typeof useTranslation>["t"];

export function useFormBuilderSelectedLookupSummaries({
  availableLookupSourceModels,
  selectedField,
  t,
}: {
  availableLookupSourceModels: ReadonlyArray<LookupSourceModelOption>;
  selectedField: FormsPlaceholderField | null;
  t: Translate;
}) {
  const selectedGenericLookupSourceModel = useMemo(
    () => selectedField && selectedField.kind === "db_lookup"
      ? getLookupSourceModelById(availableLookupSourceModels, selectedField.lookupConfig?.sourceModel)
      : null,
    [availableLookupSourceModels, selectedField],
  );
  const selectedLookupStoredValueSummary = useMemo(
    () => selectedField && selectedField.kind === "db_lookup"
      ? getLookupStoredValueSummary(selectedField, selectedGenericLookupSourceModel, t)
      : null,
    [selectedField, selectedGenericLookupSourceModel, t],
  );
  const selectedLookupSortFieldSummary = useMemo(
    () => selectedField && selectedField.kind === "db_lookup"
      ? getLookupSortFieldSummary(selectedField, selectedGenericLookupSourceModel, t)
      : null,
    [selectedField, selectedGenericLookupSourceModel, t],
  );

  return {
    selectedGenericLookupSourceModel,
    selectedLookupSortFieldSummary,
    selectedLookupStoredValueSummary,
  } as const;
}
