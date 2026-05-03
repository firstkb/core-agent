import { type useTranslation } from "@platform/i18n";

import {
  getFieldTypeKey,
} from "../controller/form-builder-workspace-display-helpers";
import {
  getLookupModelFieldLabel,
  type LookupSourceModelOption,
} from "../controller/form-builder-workspace-lookup-options";
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
  const canEditFieldSettings = canEditSettings && canEditModelDefinition;
  const fieldTypeLabel = t(getFieldTypeKey(selectedField));

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
          }}
          onChooseSource={onChooseLookupSource}
          onDisplayModeChange={onLookupDisplayModeChange}
          presetLookupSummary={selectedFieldIsPresetLookup && selectedLookupSourceSummary
            ? selectedLookupSourceSummary
            : null}
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
