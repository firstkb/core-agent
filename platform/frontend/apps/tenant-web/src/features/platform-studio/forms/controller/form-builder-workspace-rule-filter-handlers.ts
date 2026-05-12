import {
  sanitizeLookupFilterCondition,
} from "../components/lookup-filter-editor-helpers";
import {
  type FormBuilderDocument,
  type FormBuilderFilterCondition,
  type FormBuilderNode,
  type FormBuilderQuickFilter,
  type FormBuilderRequirementRule,
  type FormBuilderScope,
  type FormBuilderVisibilityRule,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";
import {
  applyDefaultFilterConditionsUpdate,
  applyQuickFiltersUpdate,
  applySelectedNodeRulesUpdate,
} from "./form-builder-workspace-document-updates";
import {
  removeDefaultFilterCondition,
  upsertDefaultFilterCondition,
  upsertQuickFilter,
} from "./form-builder-workspace-filter-helpers";
import {
  getSingleConditionRequirementRule,
  getSingleConditionVisibilityRule,
  removeRequirementRule,
  removeVisibilityRule,
  upsertRequirementRule,
  upsertVisibilityRule,
} from "./form-builder-workspace-rule-helpers";

type EditorState<TDraft> = {
  draft: TDraft;
  index: number | null;
} | null;

type CreateRuleFilterHandlersInput = {
  activeScope: Pick<FormBuilderScope, "scopeId" | "scopeType">;
  closeDefaultFilterEditor: () => void;
  closeQuickFilterEditor: () => void;
  closeRequirementRuleEditor: () => void;
  closeVisibilityRuleEditor: () => void;
  defaultFilterEditor: EditorState<FormBuilderFilterCondition>;
  quickFilterEditor: EditorState<FormBuilderQuickFilter>;
  requirementRuleEditor: EditorState<FormBuilderRequirementRule>;
  selectedNode: FormBuilderNode | null;
  selectedNodeRuleFields: ReadonlyArray<FormsPlaceholderField>;
  updateDocument: (
    updater: (currentDocument: FormBuilderDocument) => FormBuilderDocument,
  ) => void;
  visibilityRuleEditor: EditorState<FormBuilderVisibilityRule>;
};

export function createFormBuilderRuleFilterHandlers({
  activeScope,
  closeDefaultFilterEditor,
  closeQuickFilterEditor,
  closeRequirementRuleEditor,
  closeVisibilityRuleEditor,
  defaultFilterEditor,
  quickFilterEditor,
  requirementRuleEditor,
  selectedNode,
  selectedNodeRuleFields,
  updateDocument,
  visibilityRuleEditor,
}: CreateRuleFilterHandlersInput) {
  function updateDefaultFilters(
    updater: (conditions: ReadonlyArray<FormBuilderFilterCondition>) => ReadonlyArray<FormBuilderFilterCondition>,
  ) {
    updateDocument((currentDocument) => applyDefaultFilterConditionsUpdate(currentDocument, activeScope, updater));
  }

  function updateQuickFilters(
    updater: (quickFilters: ReadonlyArray<FormBuilderQuickFilter>) => ReadonlyArray<FormBuilderQuickFilter>,
  ) {
    updateDocument((currentDocument) => applyQuickFiltersUpdate(currentDocument, updater));
  }

  function updateSelectedNodeRules(
    updater: (
      rules: NonNullable<FormBuilderNode["rules"]>,
    ) => NonNullable<FormBuilderNode["rules"]>,
  ) {
    if (!selectedNode) {
      return;
    }

    updateDocument((currentDocument) => applySelectedNodeRulesUpdate(currentDocument, selectedNode.id, updater));
  }

  function sanitizeFilterCondition(condition: FormBuilderFilterCondition): FormBuilderFilterCondition {
    return "editorType" in condition && condition.editorType === "lookup"
      ? sanitizeLookupFilterCondition(condition)
      : condition;
  }

  function updateVisibilityRules(
    updater: (
      rules: NonNullable<FormBuilderNode["rules"]>["visibilityRules"],
    ) => NonNullable<FormBuilderNode["rules"]>["visibilityRules"],
  ) {
    updateSelectedNodeRules((rules) => ({
      ...rules,
      visibilityRules: updater(rules.visibilityRules),
    }));
  }

  function updateRequirementRules(
    updater: (
      rules: NonNullable<FormBuilderNode["rules"]>["requirementRules"],
    ) => NonNullable<FormBuilderNode["rules"]>["requirementRules"],
  ) {
    updateSelectedNodeRules((rules) => ({
      ...rules,
      requirementRules: updater(rules.requirementRules),
    }));
  }

  function saveVisibilityRuleEditor() {
    if (!visibilityRuleEditor) {
      return;
    }

    const normalizedDraft = getSingleConditionVisibilityRule(visibilityRuleEditor.draft, selectedNodeRuleFields);
    if (!normalizedDraft) {
      return;
    }

    updateVisibilityRules((rules) => upsertVisibilityRule(rules, visibilityRuleEditor.index, normalizedDraft));
    closeVisibilityRuleEditor();
  }

  function saveRequirementRuleEditor() {
    if (!requirementRuleEditor) {
      return;
    }

    const normalizedDraft = getSingleConditionRequirementRule(requirementRuleEditor.draft, selectedNodeRuleFields);
    if (!normalizedDraft) {
      return;
    }

    updateRequirementRules((rules) => upsertRequirementRule(rules, requirementRuleEditor.index, normalizedDraft));
    closeRequirementRuleEditor();
  }

  function deleteVisibilityRuleEditor() {
    if (!visibilityRuleEditor || visibilityRuleEditor.index === null) {
      return;
    }

    const { index } = visibilityRuleEditor;
    updateVisibilityRules((rules) => removeVisibilityRule(rules, index));
    closeVisibilityRuleEditor();
  }

  function deleteRequirementRuleEditor() {
    if (!requirementRuleEditor || requirementRuleEditor.index === null) {
      return;
    }

    const { index } = requirementRuleEditor;
    updateRequirementRules((rules) => removeRequirementRule(rules, index));
    closeRequirementRuleEditor();
  }

  function deleteVisibilityRuleAtIndex(ruleIndex: number) {
    updateVisibilityRules((rules) => removeVisibilityRule(rules, ruleIndex));
  }

  function deleteRequirementRuleAtIndex(ruleIndex: number) {
    updateRequirementRules((rules) => removeRequirementRule(rules, ruleIndex));
  }

  function saveDefaultFilterEditor() {
    if (!defaultFilterEditor) {
      return;
    }

    updateDefaultFilters((conditions) =>
      upsertDefaultFilterCondition(conditions, defaultFilterEditor.index, sanitizeFilterCondition(defaultFilterEditor.draft))
    );
    closeDefaultFilterEditor();
  }

  function saveQuickFilterEditor() {
    if (!quickFilterEditor) {
      return;
    }

    updateQuickFilters((quickFilters) =>
      upsertQuickFilter(quickFilters, quickFilterEditor.index, {
        ...quickFilterEditor.draft,
        conditions: quickFilterEditor.draft.conditions.map(sanitizeFilterCondition),
      })
    );
    closeQuickFilterEditor();
  }

  function deleteDefaultFilter(index: number) {
    updateDefaultFilters((conditions) => removeDefaultFilterCondition(conditions, index));
  }

  return {
    deleteDefaultFilter,
    deleteRequirementRuleAtIndex,
    deleteRequirementRuleEditor,
    deleteVisibilityRuleAtIndex,
    deleteVisibilityRuleEditor,
    saveDefaultFilterEditor,
    saveQuickFilterEditor,
    saveRequirementRuleEditor,
    saveVisibilityRuleEditor,
    updateDefaultFilters,
    updateQuickFilters,
    updateRequirementRules,
    updateSelectedNodeRules,
    updateVisibilityRules,
  } as const;
}
