import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { TenantDictionaryOption } from "@platform/api-client";
import { type useTranslation } from "@platform/i18n";
import type { ComboboxOption } from "@platform/ui-kit";

import {
  getFieldTypeKey,
} from "../controller/form-builder-workspace-display-helpers";
import {
  getLookupModelFieldLabel,
  type LookupSourceModelOption,
} from "../controller/form-builder-workspace-lookup-options";
import {
  getPresetLookupFilterDefinitions,
  getPresetLookupFilterValueIds,
  getPresetLookupTemplateOptions,
  resolvePresetLookupTemplateKey,
} from "../forms-preset-lookup-settings";
import { useFormBuilderAuthoring } from "../forms-authoring-context";
import {
  type FormsPlaceholderChoiceDisplay,
  type FormsPlaceholderField,
  type FormsPlaceholderFieldOptionStyle,
  type FormsPlaceholderFieldValidation,
  type FormsPlaceholderLookupDisplayMode,
  type FormsPlaceholderTagMode,
} from "../forms-placeholder-data";
import { ChoiceFieldSettings } from "./choice-field-settings";
import { DateTodayFieldSettings } from "./date-today-field-settings";
import { LookupFieldSettings } from "./lookup-field-settings";
import { TagsFieldSettings } from "./tags-field-settings";
import { TextFieldSettings } from "./text-field-settings";

type Translate = ReturnType<typeof useTranslation>["t"];

type LookupSummary = {
  label: string;
  summary: string;
};

const presetLookupFilterPageSize = 10;

type SelectedFieldSettingsSectionProps = {
  canEditModelDefinition: boolean;
  canEditSettings: boolean;
  dragOverOptionIndex: number | null;
  draggedOptionIndex: number | null;
  onAddOption: () => void;
  onAutocompleteChange: (checked: boolean) => void;
  onChoiceDisplayChange: (
    updater: (choiceDisplay: FormsPlaceholderChoiceDisplay | undefined) => FormsPlaceholderChoiceDisplay | undefined,
  ) => void;
  onChooseLookupSource: () => void;
  onDateDisplayFormatChange: (displayFormat: string) => void;
  onDateReadonlyChange: (checked: boolean) => void;
  onDragEnd: () => void;
  onDragOverOption: (index: number) => void;
  onDragStartOption: (index: number) => void;
  onDropOption: (index: number) => void;
  onLookupDisplayModeChange: (displayMode: FormsPlaceholderLookupDisplayMode) => void;
  onMaskChange: (mask: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onOptionRemove: (index: number) => void;
  onOptionStyleChange: (
    option: string,
    updater: (currentStyle: FormsPlaceholderFieldOptionStyle | undefined) => FormsPlaceholderFieldOptionStyle | undefined,
  ) => void;
  onPlaceholderChange: (placeholder: string) => void;
  onPresetLookupFilterValueChange: (field: string, values: ReadonlyArray<string>) => void;
  onPresetLookupTemplateChange: (templateKey: string) => void;
  onTagModeChange: (tagMode: FormsPlaceholderTagMode) => void;
  onTagsMaxChange: (maxTags: string) => void;
  onUniqueValueChange: (checked: boolean) => void;
  onValidationChange: (validation: FormsPlaceholderFieldValidation | undefined) => void;
  selectedField: FormsPlaceholderField;
  selectedFieldAutocompleteChecked: boolean;
  selectedFieldIsChoice: boolean;
  selectedFieldIsDateToday: boolean;
  selectedFieldIsLookup: boolean;
  selectedFieldIsLookupValue: boolean;
  selectedFieldIsPresetLookup: boolean;
  selectedFieldIsTags: boolean;
  selectedFieldShowsLookupDisplayMode: boolean;
  selectedFieldSupportsTextInputSettings: boolean;
  selectedFieldSupportsTextPreset: boolean;
  selectedFieldSupportsUniqueValue: boolean;
  selectedGenericLookupSourceModel: LookupSourceModelOption | null;
  selectedLookupSortFieldSummary: LookupSummary | null;
  selectedLookupSourceSummary: LookupSummary | null;
  selectedLookupStoredValueSummary: LookupSummary | null;
  t: Translate;
};

export function SelectedFieldSettingsSection({
  canEditModelDefinition,
  canEditSettings,
  dragOverOptionIndex,
  draggedOptionIndex,
  onAddOption,
  onAutocompleteChange,
  onChoiceDisplayChange,
  onChooseLookupSource,
  onDateDisplayFormatChange,
  onDateReadonlyChange,
  onDragEnd,
  onDragOverOption,
  onDragStartOption,
  onDropOption,
  onLookupDisplayModeChange,
  onMaskChange,
  onOptionChange,
  onOptionRemove,
  onOptionStyleChange,
  onPlaceholderChange,
  onPresetLookupFilterValueChange,
  onPresetLookupTemplateChange,
  onTagModeChange,
  onTagsMaxChange,
  onUniqueValueChange,
  onValidationChange,
  selectedField,
  selectedFieldAutocompleteChecked,
  selectedFieldIsChoice,
  selectedFieldIsDateToday,
  selectedFieldIsLookup,
  selectedFieldIsLookupValue,
  selectedFieldIsPresetLookup,
  selectedFieldIsTags,
  selectedFieldShowsLookupDisplayMode,
  selectedFieldSupportsTextInputSettings,
  selectedFieldSupportsTextPreset,
  selectedFieldSupportsUniqueValue,
  selectedGenericLookupSourceModel,
  selectedLookupSortFieldSummary,
  selectedLookupSourceSummary,
  selectedLookupStoredValueSummary,
  t,
}: SelectedFieldSettingsSectionProps) {
  const { loadDictionaryOptions } = useFormBuilderAuthoring();
  const canEditFieldSettings = canEditSettings && canEditModelDefinition;
  const fieldTypeLabel = t(getFieldTypeKey(selectedField));
  const [filterSearchByField, setFilterSearchByField] = useState<Record<string, string>>({});
  const [filterOptionsByField, setFilterOptionsByField] = useState<Record<string, readonly ComboboxOption[]>>({});
  const [filterHasMoreByField, setFilterHasMoreByField] = useState<Record<string, boolean>>({});
  const [filterLoadingByField, setFilterLoadingByField] = useState<Record<string, boolean>>({});
  const [filterLoadingMoreByField, setFilterLoadingMoreByField] = useState<Record<string, boolean>>({});
  const [filterPageByField, setFilterPageByField] = useState<Record<string, number>>({});
  const presetLookupFilterDefinitions = useMemo(
    () => selectedFieldIsPresetLookup ? getPresetLookupFilterDefinitions(selectedField) : [],
    [selectedField, selectedFieldIsPresetLookup],
  );
  const presetLookupTemplateOptions = selectedFieldIsPresetLookup
    ? getPresetLookupTemplateOptions(selectedField).map((option) => ({
        key: option.key,
        label: option.label,
      }))
    : [];
  const presetLookupFilterRows = selectedFieldIsPresetLookup
    ? presetLookupFilterDefinitions.map((definition) => ({
        field: definition.field,
        hasMoreOptions: Boolean(filterHasMoreByField[definition.field]),
        label: t(definition.labelKey),
        loading: Boolean(filterLoadingByField[definition.field]),
        loadingMore: Boolean(filterLoadingMoreByField[definition.field]),
        options: filterOptionsByField[definition.field] ?? [],
        placeholder: t(definition.placeholderKey),
        searchValue: filterSearchByField[definition.field] ?? "",
        selectedValues: getPresetLookupFilterValueIds(selectedField, definition.field),
      }))
    : [];

  useEffect(() => {
    setFilterSearchByField({});
    setFilterOptionsByField({});
    setFilterHasMoreByField({});
    setFilterLoadingByField({});
    setFilterLoadingMoreByField({});
    setFilterPageByField({});
  }, [selectedField.id, selectedField.preset]);

  useEffect(() => {
    if (!selectedFieldIsPresetLookup || presetLookupFilterDefinitions.length === 0) {
      return;
    }

    let cancelled = false;

    for (const definition of presetLookupFilterDefinitions) {
      const selectedValues = getPresetLookupFilterValueIds(selectedField, definition.field);
      const search = filterSearchByField[definition.field] ?? "";

      setFilterLoadingByField((current) => ({
        ...current,
        [definition.field]: true,
      }));

      const searchRequest = loadDictionaryOptions({
        dictionary: definition.dictionaryKey,
        page: 1,
        pageSize: presetLookupFilterPageSize,
        search,
      });
      const selectedRequest = selectedValues.length > 0
        ? loadDictionaryOptions({
            dictionary: definition.dictionaryKey,
            ids: [...selectedValues],
            pageSize: selectedValues.length,
          })
        : Promise.resolve(null);

      void Promise.all([searchRequest, selectedRequest])
        .then(([searchResponse, selectedResponse]) => {
          if (cancelled) {
            return;
          }

          setFilterOptionsByField((current) => ({
            ...current,
            [definition.field]: mergeDictionaryOptions([
              ...(selectedResponse?.items ?? []),
              ...searchResponse.items,
            ]),
          }));
          setFilterHasMoreByField((current) => ({
            ...current,
            [definition.field]: searchResponse.hasMore,
          }));
          setFilterPageByField((current) => ({
            ...current,
            [definition.field]: searchResponse.page,
          }));
        })
        .catch(() => {
          if (cancelled) {
            return;
          }

          setFilterOptionsByField((current) => ({
            ...current,
            [definition.field]: [],
          }));
          setFilterHasMoreByField((current) => ({
            ...current,
            [definition.field]: false,
          }));
          setFilterPageByField((current) => ({
            ...current,
            [definition.field]: 1,
          }));
        })
        .finally(() => {
          if (cancelled) {
            return;
          }

          setFilterLoadingByField((current) => ({
            ...current,
            [definition.field]: false,
          }));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [
    filterSearchByField,
    loadDictionaryOptions,
    presetLookupFilterDefinitions,
    selectedField,
    selectedFieldIsPresetLookup,
  ]);

  function handlePresetLookupFilterSearchChange(field: string, searchValue: string) {
    setFilterSearchByField((current) =>
      current[field] === searchValue ? current : {
        ...current,
        [field]: searchValue,
      }
    );
  }

  function handlePresetLookupFilterLoadMore(field: string) {
    const definition = presetLookupFilterDefinitions.find((entry) => entry.field === field);
    if (
      !definition
      || filterLoadingByField[field]
      || filterLoadingMoreByField[field]
      || !filterHasMoreByField[field]
    ) {
      return;
    }

    const nextPage = (filterPageByField[field] ?? 1) + 1;
    setFilterLoadingMoreByField((current) => ({
      ...current,
      [field]: true,
    }));

    void loadDictionaryOptions({
      dictionary: definition.dictionaryKey,
      page: nextPage,
      pageSize: presetLookupFilterPageSize,
      search: filterSearchByField[field] ?? "",
    })
      .then((response) => {
        setFilterOptionsByField((current) => ({
          ...current,
          [field]: mergeComboboxOptions(current[field] ?? [], mergeDictionaryOptions(response.items)),
        }));
        setFilterHasMoreByField((current) => ({
          ...current,
          [field]: response.hasMore,
        }));
        setFilterPageByField((current) => ({
          ...current,
          [field]: response.page,
        }));
      })
      .catch(() => {
        setFilterHasMoreByField((current) => ({
          ...current,
          [field]: false,
        }));
      })
      .finally(() => {
        setFilterLoadingMoreByField((current) => ({
          ...current,
          [field]: false,
        }));
      });
  }

  return (
    <>
      {selectedFieldIsChoice ? (
        <ChoiceFieldSettings
          canEdit={canEditFieldSettings}
          canMoveOptions={canEditFieldSettings && (selectedField.options?.length ?? 0) > 1}
          choiceDisplay={selectedField.choiceDisplay}
          dragOverOptionIndex={dragOverOptionIndex}
          draggedOptionIndex={draggedOptionIndex}
          fieldKind={selectedField.kind === "multi_select" ? "multi_select" : "single_select"}
          fieldTypeLabel={fieldTypeLabel}
          labels={{
            actionsMenu: t("tenant.platformStudio.forms.builder.rule.actionsMenu"),
            addOption: t("tenant.platformStudio.forms.builder.fieldSettings.addOption"),
            allowEmpty: t("tenant.platformStudio.forms.builder.fieldSettings.allowEmpty"),
            buttonStyles: t("tenant.platformStudio.forms.builder.fieldSettings.buttonStyles"),
            display: t("tenant.platformStudio.forms.builder.fieldSettings.display"),
            dragToReorder: t("tenant.platformStudio.forms.builder.dragToReorder"),
            emptyOptions: t("tenant.platformStudio.forms.builder.fieldSettings.emptyOptions"),
            maxSelections: t("tenant.platformStudio.forms.builder.fieldSettings.maxSelections"),
            minSelections: t("tenant.platformStudio.forms.builder.fieldSettings.minSelections"),
            options: t("tenant.platformStudio.forms.builder.fieldSettings.options"),
            orientation: t("tenant.platformStudio.forms.builder.fieldSettings.orientation"),
            orientationHorizontal: t("tenant.platformStudio.forms.builder.fieldSettings.orientationHorizontal"),
            orientationVertical: t("tenant.platformStudio.forms.builder.fieldSettings.orientationVertical"),
            removeOption: t("tenant.platformStudio.forms.builder.removeNode"),
            renderStyle: t("tenant.platformStudio.forms.builder.fieldSettings.renderStyle"),
            renderStyleButtons: t("tenant.platformStudio.forms.builder.fieldSettings.renderStyleButtons"),
            renderStyleNative: t("tenant.platformStudio.forms.builder.fieldSettings.renderStyleNative"),
            selection: t("tenant.platformStudio.forms.builder.fieldSettings.selection"),
            styleVariantDanger: t("tenant.platformStudio.forms.builder.fieldSettings.styleVariantDanger"),
            styleVariantDefault: t("tenant.platformStudio.forms.builder.fieldSettings.styleVariantDefault"),
            styleVariantInfo: t("tenant.platformStudio.forms.builder.fieldSettings.styleVariantInfo"),
            styleVariantPrimary: t("tenant.platformStudio.forms.builder.fieldSettings.styleVariantPrimary"),
            styleVariantSecondary: t("tenant.platformStudio.forms.builder.fieldSettings.styleVariantSecondary"),
            styleVariantSuccess: t("tenant.platformStudio.forms.builder.fieldSettings.styleVariantSuccess"),
            styleVariantWarning: t("tenant.platformStudio.forms.builder.fieldSettings.styleVariantWarning"),
          }}
          onAddOption={onAddOption}
          onChoiceDisplayChange={onChoiceDisplayChange}
          onDragEnd={onDragEnd}
          onDragOverOption={onDragOverOption}
          onDragStartOption={onDragStartOption}
          onDropOption={onDropOption}
          onOptionChange={onOptionChange}
          onOptionRemove={onOptionRemove}
          onOptionStyleChange={onOptionStyleChange}
          options={selectedField.options ?? []}
        />
      ) : null}

      {selectedFieldIsLookup ? (
        <LookupFieldSettings
          canChooseSource={canEditFieldSettings}
          displayMode={selectedField.lookupConfig?.displayMode ?? "search_select"}
          fieldTypeLabel={fieldTypeLabel}
          labels={{
            chooseSource: t("tenant.platformStudio.forms.builder.fieldSettings.chooseSource"),
            display: t("tenant.platformStudio.forms.builder.fieldSettings.display"),
            displayMode: t("tenant.platformStudio.forms.builder.fieldSettings.displayMode"),
            displayModeCatalogModal: t("tenant.platformStudio.forms.builder.fieldSettings.displayModeCatalogModal"),
            displayModeSearchSelect: t("tenant.platformStudio.forms.builder.fieldSettings.displayModeSearchSelect"),
            displayTemplate: t("tenant.platformStudio.forms.builder.fieldSettings.displayTemplate"),
            filters: t("tenant.platformStudio.forms.builder.fieldSettings.filters"),
            loadingFilterOptions: t("tenant.platformStudio.forms.builder.fieldSettings.loadingFilterOptions"),
            noFilterOptions: t("tenant.platformStudio.forms.builder.fieldSettings.noFilterOptions"),
            searchFilterOptions: t("tenant.platformStudio.forms.builder.fieldSettings.searchFilterOptions"),
          }}
          onChooseSource={onChooseLookupSource}
          onDisplayModeChange={onLookupDisplayModeChange}
          onPresetFilterLoadMore={handlePresetLookupFilterLoadMore}
          onPresetFilterSearchChange={handlePresetLookupFilterSearchChange}
          onPresetFilterValueChange={onPresetLookupFilterValueChange}
          onPresetTemplateChange={onPresetLookupTemplateChange}
          presetFilterRows={presetLookupFilterRows}
          presetLookupSummary={selectedFieldIsPresetLookup && selectedLookupSourceSummary
            ? selectedLookupSourceSummary
            : null}
          presetTemplateKey={selectedFieldIsPresetLookup ? resolvePresetLookupTemplateKey(selectedField) : ""}
          presetTemplateOptions={presetLookupTemplateOptions}
          showDisplayMode={selectedFieldShowsLookupDisplayMode}
          sourceRows={[
            {
              label: t("tenant.platformStudio.forms.builder.fieldSettings.sourceModel"),
              summary: selectedGenericLookupSourceModel?.label
                ?? selectedField.sourceLabel
                ?? t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
            },
            ...(!selectedFieldIsLookupValue
              ? [{
                  label: t("tenant.platformStudio.forms.builder.fieldSettings.storedValueField"),
                  summary: getLookupModelFieldLabel(
                    selectedGenericLookupSourceModel,
                    selectedField.lookupConfig?.storedValueField,
                  ) || t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
                }]
              : []),
            {
              label: selectedLookupStoredValueSummary?.label
                ?? t("tenant.platformStudio.forms.builder.fieldSettings.displayFields"),
              summary: selectedLookupStoredValueSummary?.summary
                ?? t("tenant.platformStudio.forms.builder.fieldSettings.emptyDisplayFields"),
            },
            {
              label: selectedLookupSortFieldSummary?.label
                ?? t("tenant.platformStudio.forms.builder.fieldSettings.sortBy"),
              summary: selectedLookupSortFieldSummary?.summary
                ?? t("tenant.platformStudio.forms.builder.fieldSettings.sourcePending"),
            },
          ]}
        />
      ) : null}

      {selectedFieldSupportsTextInputSettings ? (
        <TextFieldSettings
          autocompleteChecked={selectedFieldAutocompleteChecked}
          fieldTypeLabel={fieldTypeLabel}
          labels={{
            autocomplete: t("tenant.platformStudio.forms.builder.fieldSettings.autocomplete"),
            mask: t("tenant.platformStudio.forms.builder.fieldSettings.mask"),
            placeholder: t("tenant.platformStudio.forms.builder.fieldSettings.placeholder"),
            uniqueValue: t("tenant.platformStudio.forms.builder.fieldSettings.uniqueValue"),
            unbound: t("tenant.platformStudio.forms.builder.systemField.unbound"),
            validation: t("tenant.platformStudio.forms.builder.fieldSettings.validation"),
            validationEmail: t("tenant.platformStudio.forms.builder.fieldSettings.validationEmail"),
            validationPhone: t("tenant.platformStudio.forms.builder.fieldSettings.validationPhone"),
            validationUrl: t("tenant.platformStudio.forms.builder.fieldSettings.validationUrl"),
          }}
          mask={selectedField.mask ?? ""}
          onAutocompleteChange={onAutocompleteChange}
          onMaskChange={onMaskChange}
          onPlaceholderChange={onPlaceholderChange}
          onUniqueValueChange={onUniqueValueChange}
          onValidationChange={onValidationChange}
          placeholder={selectedField.placeholder ?? ""}
          showValidation={selectedFieldSupportsTextPreset}
          showUniqueValue={selectedFieldSupportsUniqueValue}
          uniqueValueChecked={selectedField.uniqueValue === true}
          validation={selectedField.validation}
        />
      ) : null}

      {selectedFieldIsDateToday ? (
        <DateTodayFieldSettings
          displayFormat={selectedField.displayFormat ?? ""}
          labels={{
            dateToday: t("tenant.platformStudio.forms.builder.fieldSettings.dateToday"),
            defaultValueMode: t("tenant.platformStudio.forms.builder.fieldSettings.defaultValueMode"),
            defaultValueToday: t("tenant.platformStudio.forms.builder.fieldSettings.defaultValueToday"),
            displayFormat: t("tenant.platformStudio.forms.builder.fieldSettings.displayFormat"),
            readonly: t("tenant.platformStudio.forms.builder.visibility.readonly"),
          }}
          onDisplayFormatChange={onDateDisplayFormatChange}
          onReadonlyChange={onDateReadonlyChange}
          readonly={selectedField.readonly ?? false}
        />
      ) : null}

      {selectedFieldIsTags ? (
        <TagsFieldSettings
          labels={{
            maxTags: t("tenant.platformStudio.forms.builder.fieldSettings.maxTags"),
            tagMode: t("tenant.platformStudio.forms.builder.fieldSettings.tagMode"),
            tagModeCreateOnly: t("tenant.platformStudio.forms.builder.fieldSettings.tagModeCreateOnly"),
            tagModeSelectExisting: t("tenant.platformStudio.forms.builder.fieldSettings.tagModeSelectExisting"),
            tagModeSelectOrCreate: t("tenant.platformStudio.forms.builder.fieldSettings.tagModeSelectOrCreate"),
            tags: t("tenant.platformStudio.forms.builder.fieldSettings.tags"),
          }}
          maxTags={selectedField.maxTags ?? ""}
          onMaxTagsChange={onTagsMaxChange}
          onTagModeChange={onTagModeChange}
          tagMode={selectedField.tagMode ?? "select_or_create"}
        />
      ) : null}
    </>
  );
}

function mergeDictionaryOptions(options: ReadonlyArray<TenantDictionaryOption>): ComboboxOption[] {
  const merged = new Map<string, ComboboxOption>();

  for (const option of options) {
    const value = (option.value || option.id).trim();
    const label = option.label.trim();
    if (!value || !label || merged.has(value)) {
      continue;
    }

    const description = option.description?.trim();
    merged.set(value, {
      description: description || undefined,
      label,
      searchText: [
        label,
        description,
        ...Object.values(option.fields ?? {}),
      ].filter(Boolean).join(" "),
      value,
    });
  }

  return [...merged.values()];
}

function mergeComboboxOptions(
  currentOptions: ReadonlyArray<ComboboxOption>,
  nextOptions: ReadonlyArray<ComboboxOption>,
): ComboboxOption[] {
  const merged = new Map<string, ComboboxOption>();
  for (const option of [...currentOptions, ...nextOptions]) {
    if (!option.value || merged.has(option.value)) {
      continue;
    }
    merged.set(option.value, option);
  }
  return [...merged.values()];
}
