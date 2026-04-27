import { type useTranslation } from "@platform/i18n";
import { type RefObject } from "react";

import { getFieldTypeKey, getNodeTypeKey } from "../controller/form-builder-workspace-display-helpers";
import { getModelFieldLabel } from "../controller/form-builder-workspace-field-scope-grid";
import { type LookupSourceModelOption } from "../controller/form-builder-workspace-lookup-options";
import { isPersistedModelField } from "../controller/form-builder-workspace-normalization-helpers";
import {
  getFormBuilderDisplayLabel,
  type FormBuilderNode,
} from "../forms-builder-state";
import {
  getFormsPlaceholderFieldIconKey,
  type FormsPlaceholderChoiceDisplay,
  type FormsPlaceholderField,
  type FormsPlaceholderFieldOptionStyle,
  type FormsPlaceholderFieldValidation,
  type FormsPlaceholderLookupDisplayMode,
  type FormsPlaceholderModel,
  type FormsPlaceholderTagMode,
} from "../forms-placeholder-data";
import { type RulesPanelRuleItem } from "./rules-panel";
import { SelectedFieldSettingsSection } from "./selected-field-settings-section";
import { SelectedNodeRulesDeleteSection } from "./selected-node-rules-delete-section";
import { SelectionInspectorBasicSection } from "./selection-inspector-basic-section";
import { SelectionInspectorEmptyState } from "./selection-inspector-empty-state";

type Translate = ReturnType<typeof useTranslation>["t"];

type LookupSummary = { label: string; summary: string };
type ViewOnlyBindingOption = { bindingId: string; label: string };

type SelectionInspectorTabBodyProps = {
  canEditModelDefinition: boolean;
  canEditSettings: boolean;
  canRemoveItems: boolean;
  currentModel: FormsPlaceholderModel;
  dragOverOptionIndex: number | null;
  draggedOptionIndex: number | null;
  isDefaultView: boolean;
  isStaticModel: boolean;
  lockedStructureHint: string | null;
  onAddFieldOption: () => void;
  onAutocompleteChange: (checked: boolean) => void;
  onChoiceDisplayChange: (
    updater: (choiceDisplay: FormsPlaceholderChoiceDisplay | undefined) => FormsPlaceholderChoiceDisplay | undefined,
  ) => void;
  onChooseLookupSource: () => void;
  onDateDisplayFormatChange: (displayFormat: string) => void;
  onDateReadonlyChange: (checked: boolean) => void;
  onDeleteNode: () => void;
  onDeleteRequirementRule: (index: number) => void;
  onDeleteVisibilityRule: (index: number) => void;
  onDragEnd: () => void;
  onDragOverOption: (index: number) => void;
  onDragStartOption: (index: number) => void;
  onDropOption: (index: number) => void;
  onLookupDisplayModeChange: (displayMode: FormsPlaceholderLookupDisplayMode) => void;
  onMaskChange: (mask: string) => void;
  onOpenRequirementRuleEditor: (index: number | null) => void;
  onOpenVisibilityRuleEditor: (index: number | null) => void;
  onOptionChange: (index: number, value: string) => void;
  onOptionRemove: (index: number) => void;
  onOptionStyleChange: (
    option: string,
    updater: (currentStyle: FormsPlaceholderFieldOptionStyle | undefined) => FormsPlaceholderFieldOptionStyle | undefined,
  ) => void;
  onPlaceholderChange: (placeholder: string) => void;
  onRequiredChange: (checked: boolean) => void;
  onRichTextChange: (value: string) => void;
  onTagModeChange: (tagMode: FormsPlaceholderTagMode) => void;
  onTagsMaxChange: (maxTags: string) => void;
  onTextChange: (value: string) => void;
  onTitleChange: (title: string) => void;
  onValidationChange: (validation: FormsPlaceholderFieldValidation | undefined) => void;
  onViewOnlyBindingChange: (bindingId: string) => void;
  onVisibilityChange: (visibility: FormBuilderNode["visibility"]) => void;
  readonlyText: string;
  requirementRules: ReadonlyArray<RulesPanelRuleItem>;
  ruleFieldsAvailable: boolean;
  selectedField: FormsPlaceholderField | null;
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
  selectedGenericLookupSourceModel: LookupSourceModelOption | null;
  selectedLookupSortFieldSummary: LookupSummary | null;
  selectedLookupSourceSummary: LookupSummary | null;
  selectedLookupStoredValueSummary: LookupSummary | null;
  selectedNode: FormBuilderNode | null;
  selectedNodeSupportsRules: boolean;
  selectedViewOnlyBindingId: string;
  selectionPanelTopRef: RefObject<HTMLDivElement | null>;
  t: Translate;
  viewOnlyBindingOptions: ReadonlyArray<ViewOnlyBindingOption>;
  visibilityRules: ReadonlyArray<RulesPanelRuleItem>;
};

export function SelectionInspectorTabBody({
  canEditModelDefinition,
  canEditSettings,
  canRemoveItems,
  currentModel,
  dragOverOptionIndex,
  draggedOptionIndex,
  isDefaultView,
  isStaticModel,
  lockedStructureHint,
  onAddFieldOption,
  onAutocompleteChange,
  onChoiceDisplayChange,
  onChooseLookupSource,
  onDateDisplayFormatChange,
  onDateReadonlyChange,
  onDeleteNode,
  onDeleteRequirementRule,
  onDeleteVisibilityRule,
  onDragEnd,
  onDragOverOption,
  onDragStartOption,
  onDropOption,
  onLookupDisplayModeChange,
  onMaskChange,
  onOpenRequirementRuleEditor,
  onOpenVisibilityRuleEditor,
  onOptionChange,
  onOptionRemove,
  onOptionStyleChange,
  onPlaceholderChange,
  onRequiredChange,
  onRichTextChange,
  onTagModeChange,
  onTagsMaxChange,
  onTextChange,
  onTitleChange,
  onValidationChange,
  onViewOnlyBindingChange,
  onVisibilityChange,
  readonlyText,
  requirementRules,
  ruleFieldsAvailable,
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
  selectedGenericLookupSourceModel,
  selectedLookupSortFieldSummary,
  selectedLookupSourceSummary,
  selectedLookupStoredValueSummary,
  selectedNode,
  selectedNodeSupportsRules,
  selectedViewOnlyBindingId,
  selectionPanelTopRef,
  t,
  viewOnlyBindingOptions,
  visibilityRules,
}: SelectionInspectorTabBodyProps) {
  return (
    <>
      <div ref={selectionPanelTopRef} />
      {selectedNode ? (
        <div className="tenant-web__platform-studio-builder-stack">
          <SelectionInspectorBasicSection
            canEdit={canEditSettings}
            iconKey={selectedField ? getFormsPlaceholderFieldIconKey(selectedField) : selectedNode.type}
            labels={{
              hiddenVisibility: t("tenant.platformStudio.forms.builder.visibility.hidden"),
              lockedHint: lockedStructureHint,
              noAdvancedSettings: t("tenant.platformStudio.forms.builder.noAdvancedSettings"),
              nodeText: t("tenant.platformStudio.forms.builder.nodeTextLabel"),
              nodeTitle: t("tenant.platformStudio.forms.builder.nodeTitleLabel"),
              nodeVisibility: t("tenant.platformStudio.forms.builder.nodeVisibilityLabel"),
              readonlyText,
              readonlyVisibility: t("tenant.platformStudio.forms.builder.visibility.readonly"),
              required: t("tenant.platformStudio.forms.builder.rule.effect.required"),
              viewOnlyBinding: t("tenant.platformStudio.forms.builder.fieldSettings.viewOnlyBinding"),
              viewOnlyBindingEmpty: t("tenant.platformStudio.forms.builder.fieldSettings.viewOnlyBindingEmpty"),
              viewOnlyBindingPending: t("tenant.platformStudio.forms.builder.fieldSettings.viewOnlyBindingPending"),
              viewOnlyFieldSection: t("tenant.platformStudio.forms.builder.nodeType.view_only_field"),
              visibleVisibility: t("tenant.platformStudio.forms.builder.visibility.visible"),
            }}
            meta={selectedField ? t(getFieldTypeKey(selectedField)) : t(getNodeTypeKey(selectedNode.type))}
            nodeRequired={selectedNode.required ?? false}
            nodeText={selectedNode.text ?? ""}
            nodeTitle={selectedNode.title ?? ""}
            nodeType={selectedNode.type}
            nodeVisibility={selectedNode.visibility}
            onRequiredChange={onRequiredChange}
            onRichTextChange={onRichTextChange}
            onTextChange={onTextChange}
            onTitleChange={onTitleChange}
            onViewOnlyBindingChange={onViewOnlyBindingChange}
            onVisibilityChange={onVisibilityChange}
            persistedField={selectedField && isPersistedModelField(selectedField)
              ? {
                  label: getModelFieldLabel(selectedField),
                  storageKey: selectedField.storageKey ?? "",
                }
              : null}
            selectedViewOnlyBindingId={selectedViewOnlyBindingId}
            title={getFormBuilderDisplayLabel(selectedNode, currentModel)}
            titleDisabled={Boolean(
              selectedField
              && isDefaultView
              && !canEditModelDefinition
              && !isStaticModel,
            )}
            viewOnlyBindingOptions={viewOnlyBindingOptions}
          >
            {selectedNode.type === "field" && selectedField ? (
              <SelectedFieldSettingsSection
                canEditModelDefinition={canEditModelDefinition}
                canEditSettings={canEditSettings}
                dragOverOptionIndex={dragOverOptionIndex}
                draggedOptionIndex={draggedOptionIndex}
                onAddOption={onAddFieldOption}
                onAutocompleteChange={onAutocompleteChange}
                onChoiceDisplayChange={onChoiceDisplayChange}
                onChooseLookupSource={onChooseLookupSource}
                onDateDisplayFormatChange={onDateDisplayFormatChange}
                onDateReadonlyChange={onDateReadonlyChange}
                onDragEnd={onDragEnd}
                onDragOverOption={onDragOverOption}
                onDragStartOption={onDragStartOption}
                onDropOption={onDropOption}
                onLookupDisplayModeChange={onLookupDisplayModeChange}
                onMaskChange={onMaskChange}
                onOptionChange={onOptionChange}
                onOptionRemove={onOptionRemove}
                onOptionStyleChange={onOptionStyleChange}
                onPlaceholderChange={onPlaceholderChange}
                onTagModeChange={onTagModeChange}
                onTagsMaxChange={onTagsMaxChange}
                onValidationChange={onValidationChange}
                selectedField={selectedField}
                selectedFieldAutocompleteChecked={selectedFieldAutocompleteChecked}
                selectedFieldIsChoice={selectedFieldIsChoice}
                selectedFieldIsDateToday={selectedFieldIsDateToday}
                selectedFieldIsLookup={selectedFieldIsLookup}
                selectedFieldIsLookupValue={selectedFieldIsLookupValue}
                selectedFieldIsPresetLookup={selectedFieldIsPresetLookup}
                selectedFieldIsTags={selectedFieldIsTags}
                selectedFieldShowsLookupDisplayMode={selectedFieldShowsLookupDisplayMode}
                selectedFieldSupportsTextInputSettings={selectedFieldSupportsTextInputSettings}
                selectedFieldSupportsTextPreset={selectedFieldSupportsTextPreset}
                selectedGenericLookupSourceModel={selectedGenericLookupSourceModel}
                selectedLookupSortFieldSummary={selectedLookupSortFieldSummary}
                selectedLookupSourceSummary={selectedLookupSourceSummary}
                selectedLookupStoredValueSummary={selectedLookupStoredValueSummary}
                t={t}
              />
            ) : null}
          </SelectionInspectorBasicSection>

          <SelectedNodeRulesDeleteSection
            canEditSettings={canEditSettings}
            canRemoveItems={canRemoveItems}
            onAddRequirementRule={() => onOpenRequirementRuleEditor(null)}
            onAddVisibilityRule={() => onOpenVisibilityRuleEditor(null)}
            onDeleteNode={onDeleteNode}
            onDeleteRequirementRule={onDeleteRequirementRule}
            onDeleteVisibilityRule={onDeleteVisibilityRule}
            onEditRequirementRule={onOpenRequirementRuleEditor}
            onEditVisibilityRule={onOpenVisibilityRuleEditor}
            readonlyText={readonlyText}
            requirementRules={requirementRules}
            ruleFieldsAvailable={ruleFieldsAvailable}
            selectedNodeSupportsRules={selectedNodeSupportsRules}
            showRequirementRules={selectedNode.type === "field"}
            t={t}
            visibilityRules={visibilityRules}
          />
        </div>
      ) : (
        <SelectionInspectorEmptyState
          description={t("tenant.platformStudio.forms.builder.selectionEmptyDescription")}
          title={t("tenant.platformStudio.forms.builder.selectionEmptyTitle")}
        />
      )}
    </>
  );
}
