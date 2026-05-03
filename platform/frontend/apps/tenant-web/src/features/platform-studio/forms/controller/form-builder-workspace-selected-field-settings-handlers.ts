import {
  applyChoiceFieldOptionsUpdate,
  applyChoiceOptionStyleUpdate,
  renameChoiceFieldOption,
  reorderChoiceFieldOptions,
} from "./form-builder-workspace-choice-field";
import {
  getViewOnlyBindingNodeUpdate,
} from "./form-builder-workspace-view-only-bindings";
import {
  type FormBuilderDocument,
  type FormBuilderNode,
  updateFormBuilderNode,
} from "../forms-builder-state";
import {
  type FormsPlaceholderChoiceDisplay,
  type FormsPlaceholderField,
  type FormsPlaceholderFieldOptionStyle,
  type FormsPlaceholderFieldValidation,
  type FormsPlaceholderLookupConfig,
  type FormsPlaceholderLookupDisplayMode,
  type FormsPlaceholderTagMode,
} from "../forms-placeholder-data";

type UpdateDocument = (
  updater: (currentDocument: FormBuilderDocument) => FormBuilderDocument,
) => void;

type UpdateSelectedField = (
  updater: (field: FormsPlaceholderField) => FormsPlaceholderField,
) => void;

type ViewOnlyBindingOption = {
  binding: FormBuilderNode["viewOnlyBinding"];
  bindingId: string;
  label: string;
};

export function supportsUniqueValue(
  field: Pick<FormsPlaceholderField, "kind" | "preset" | "validation"> | null | undefined,
) {
  return field?.kind === "short_text" && (
    field.preset === "email"
    || field.preset === "phone"
    || field.validation === "email"
    || field.validation === "phone"
  );
}

type SelectedFieldSettingsHandlersOptions = {
  defaultViewOnlyFieldTitle: string;
  newChoiceOptionLabel: string;
  selectedFieldDefaultAutocompleteValue: string;
  selectedNode: FormBuilderNode | null;
  selectedViewOnlyBindingOption: { label: string } | null;
  selectedViewOnlyBindingOptions: ReadonlyArray<ViewOnlyBindingOption>;
  updateDocument: UpdateDocument;
  updateSelectedField: UpdateSelectedField;
};

export function createSelectedFieldSettingsHandlers({
  defaultViewOnlyFieldTitle,
  newChoiceOptionLabel,
  selectedFieldDefaultAutocompleteValue,
  selectedNode,
  selectedViewOnlyBindingOption,
  selectedViewOnlyBindingOptions,
  updateDocument,
  updateSelectedField,
}: SelectedFieldSettingsHandlersOptions) {
  function updateSelectedFieldOptions(
    updater: (options: ReadonlyArray<string>) => ReadonlyArray<string>,
  ) {
    updateSelectedField((field) => applyChoiceFieldOptionsUpdate(field, updater));
  }

  function addSelectedFieldOption() {
    updateSelectedFieldOptions((options) => [
      ...options,
      `${newChoiceOptionLabel} ${options.length + 1}`,
    ]);
  }

  function renameSelectedFieldOption(optionIndex: number, nextValue: string) {
    updateSelectedField((field) => renameChoiceFieldOption(field, optionIndex, nextValue));
  }

  function removeSelectedFieldOption(optionIndex: number) {
    updateSelectedFieldOptions((options) => options.filter((_, currentIndex) => currentIndex !== optionIndex));
  }

  function reorderSelectedFieldOption(fromIndex: number, toIndex: number) {
    updateSelectedFieldOptions((options) => reorderChoiceFieldOptions(options, fromIndex, toIndex));
  }

  function updateSelectedFieldChoiceDisplay(
    updater: (choiceDisplay: FormsPlaceholderChoiceDisplay | undefined) => FormsPlaceholderChoiceDisplay | undefined,
  ) {
    updateSelectedField((field) => ({
      ...field,
      choiceDisplay: updater(field.choiceDisplay),
    }));
  }

  function updateSelectedFieldChoiceStyle(
    option: string,
    updater: (style: FormsPlaceholderFieldOptionStyle | undefined) => FormsPlaceholderFieldOptionStyle | undefined,
  ) {
    updateSelectedFieldChoiceDisplay((choiceDisplay) =>
      applyChoiceOptionStyleUpdate(choiceDisplay, option, updater)
    );
  }

  function updateSelectedFieldLookupConfig(
    updater: (lookupConfig: FormsPlaceholderLookupConfig | undefined) => FormsPlaceholderLookupConfig | undefined,
  ) {
    updateSelectedField((field) => ({
      ...field,
      lookupConfig: updater(field.lookupConfig),
    }));
  }

  function updateSelectedLookupDisplayMode(displayMode: FormsPlaceholderLookupDisplayMode) {
    updateSelectedFieldLookupConfig((lookupConfig) => ({
      ...lookupConfig,
      displayMode,
    }));
  }

  function updateSelectedFieldAutocomplete(checked: boolean) {
    updateSelectedField((field) => ({
      ...field,
      autocomplete: checked ? selectedFieldDefaultAutocompleteValue : "off",
    }));
  }

  function updateSelectedFieldUniqueValue(checked: boolean) {
    updateSelectedField((field) => ({
      ...field,
      uniqueValue: checked ? true : undefined,
    }));
  }

  function updateSelectedFieldMask(mask: string) {
    updateSelectedField((field) => ({
      ...field,
      mask: mask || undefined,
    }));
  }

  function updateSelectedFieldPlaceholder(placeholder: string) {
    updateSelectedField((field) => ({
      ...field,
      placeholder: placeholder || undefined,
    }));
  }

  function updateSelectedFieldValidation(validation: FormsPlaceholderFieldValidation | undefined) {
    updateSelectedField((field) => {
      const nextField = {
        ...field,
        validation,
      };

      return {
        ...nextField,
        uniqueValue: supportsUniqueValue(nextField) ? field.uniqueValue : undefined,
      };
    });
  }

  function updateSelectedDateDisplayFormat(displayFormat: string) {
    updateSelectedField((field) => ({
      ...field,
      displayFormat: displayFormat || undefined,
    }));
  }

  function updateSelectedDateReadonly(checked: boolean) {
    updateSelectedField((field) => ({
      ...field,
      readonly: checked,
    }));
  }

  function updateSelectedTagsMax(maxTags: string) {
    updateSelectedField((field) => ({
      ...field,
      maxTags: maxTags.trim()
        ? Math.max(0, Number(maxTags) || 0)
        : undefined,
    }));
  }

  function updateSelectedTagsMode(tagMode: FormsPlaceholderTagMode) {
    updateSelectedField((field) => ({
      ...field,
      tagMode,
    }));
  }

  function updateSelectedViewOnlyBinding(bindingId: string) {
    if (!selectedNode) {
      return;
    }

    const nextOption = selectedViewOnlyBindingOptions.find((option) => option.bindingId === bindingId) ?? null;

    updateDocument((currentDocument) =>
      updateFormBuilderNode(
        currentDocument,
        selectedNode.id,
        getViewOnlyBindingNodeUpdate({
          currentBindingLabel: selectedViewOnlyBindingOption?.label,
          defaultTitle: defaultViewOnlyFieldTitle,
          nextOption,
          nodeTitle: selectedNode.title,
        }),
      )
    );
  }

  return {
    addSelectedFieldOption,
    removeSelectedFieldOption,
    renameSelectedFieldOption,
    reorderSelectedFieldOption,
    updateSelectedDateDisplayFormat,
    updateSelectedDateReadonly,
    updateSelectedFieldAutocomplete,
    updateSelectedFieldChoiceDisplay,
    updateSelectedFieldChoiceStyle,
    updateSelectedFieldMask,
    updateSelectedFieldPlaceholder,
    updateSelectedFieldUniqueValue,
    updateSelectedFieldValidation,
    updateSelectedLookupDisplayMode,
    updateSelectedTagsMax,
    updateSelectedTagsMode,
    updateSelectedViewOnlyBinding,
  };
}
