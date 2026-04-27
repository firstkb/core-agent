import {
  useCallback,
  useState,
} from "react";

import {
  createDefaultFilterCondition,
} from "../components/filter-condition-editor-helpers";
import {
  type FormBuilderFilterCondition,
  type FormBuilderQuickFilter,
  type FormBuilderRequirementRule,
  type FormBuilderRuleCondition,
  type FormBuilderVisibilityRule,
} from "../forms-builder-state";
import {
  type FormsPlaceholderField,
} from "../forms-placeholder-data";
import {
  normalizeHexColor,
} from "./form-builder-workspace-filter-helpers";
import {
  cloneRequirementRule,
  cloneVisibilityRule,
  createDefaultRequirementRule,
  createDefaultVisibilityRule,
  getSingleConditionRequirementRule,
  getSingleConditionVisibilityRule,
} from "./form-builder-workspace-rule-helpers";

type RuleEditorState<TDraft> = {
  draft: TDraft;
  index: number | null;
} | null;

type UseFormBuilderRuleFilterEditorsInput = {
  currentDefaultFilterConditions: ReadonlyArray<FormBuilderFilterCondition>;
  currentViewFilterTargets: ReadonlyArray<FormsPlaceholderField>;
  defaultQuickFilterLabel: string;
  pendingDefaultFilterFieldId: string;
  quickFilters: ReadonlyArray<FormBuilderQuickFilter>;
  rootViewFilterTargets: ReadonlyArray<FormsPlaceholderField>;
  selectedNodeRuleFields: ReadonlyArray<FormsPlaceholderField>;
  selectedRequirementRules: ReadonlyArray<FormBuilderRequirementRule>;
  selectedVisibilityRules: ReadonlyArray<FormBuilderVisibilityRule>;
};

function createDefaultQuickFilterDraft(
  fields: ReadonlyArray<FormsPlaceholderField>,
  label: string,
): FormBuilderQuickFilter | null {
  const nextCondition = createDefaultFilterCondition(fields);
  if (!nextCondition) {
    return null;
  }

  return {
    color: undefined,
    conditions: [nextCondition],
    id: `quick-filter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    logic: "and",
  };
}

export function useFormBuilderRuleFilterEditors({
  currentDefaultFilterConditions,
  currentViewFilterTargets,
  defaultQuickFilterLabel,
  pendingDefaultFilterFieldId,
  quickFilters,
  rootViewFilterTargets,
  selectedNodeRuleFields,
  selectedRequirementRules,
  selectedVisibilityRules,
}: UseFormBuilderRuleFilterEditorsInput) {
  const [defaultFilterEditor, setDefaultFilterEditor] =
    useState<RuleEditorState<FormBuilderFilterCondition>>(null);
  const [quickFilterEditor, setQuickFilterEditor] =
    useState<RuleEditorState<FormBuilderQuickFilter>>(null);
  const [visibilityRuleEditor, setVisibilityRuleEditor] =
    useState<RuleEditorState<FormBuilderVisibilityRule>>(null);
  const [requirementRuleEditor, setRequirementRuleEditor] =
    useState<RuleEditorState<FormBuilderRequirementRule>>(null);

  const closeDefaultFilterEditor = useCallback(() => setDefaultFilterEditor(null), []);
  const closeQuickFilterEditor = useCallback(() => setQuickFilterEditor(null), []);
  const closeVisibilityRuleEditor = useCallback(() => setVisibilityRuleEditor(null), []);
  const closeRequirementRuleEditor = useCallback(() => setRequirementRuleEditor(null), []);

  const openVisibilityRuleEditor = useCallback((index: number | null) => {
    const draft = index === null
      ? createDefaultVisibilityRule(selectedNodeRuleFields)
      : (() => {
          const existingRule = selectedVisibilityRules[index] ?? null;
          return existingRule
            ? getSingleConditionVisibilityRule(cloneVisibilityRule(existingRule), selectedNodeRuleFields)
            : null;
        })();

    if (!draft) {
      return;
    }

    setVisibilityRuleEditor({
      draft,
      index,
    });
  }, [selectedNodeRuleFields, selectedVisibilityRules]);

  const setVisibilityRuleEffect = useCallback((effect: FormBuilderVisibilityRule["effect"]) => {
    setVisibilityRuleEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: {
              ...currentValue.draft,
              effect,
            },
          }
        : currentValue
    );
  }, []);

  const setVisibilityRuleCondition = useCallback((nextCondition: FormBuilderRuleCondition) => {
    setVisibilityRuleEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: {
              ...currentValue.draft,
              when: {
                all: [nextCondition],
              },
            },
          }
        : currentValue
    );
  }, []);

  const openRequirementRuleEditor = useCallback((index: number | null) => {
    const draft = index === null
      ? createDefaultRequirementRule(selectedNodeRuleFields)
      : (() => {
          const existingRule = selectedRequirementRules[index] ?? null;
          return existingRule
            ? getSingleConditionRequirementRule(cloneRequirementRule(existingRule), selectedNodeRuleFields)
            : null;
        })();

    if (!draft) {
      return;
    }

    setRequirementRuleEditor({
      draft,
      index,
    });
  }, [selectedNodeRuleFields, selectedRequirementRules]);

  const setRequirementRuleEffect = useCallback((effect: FormBuilderRequirementRule["effect"]) => {
    setRequirementRuleEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: {
              ...currentValue.draft,
              effect,
            },
          }
        : currentValue
    );
  }, []);

  const setRequirementRuleCondition = useCallback((nextCondition: FormBuilderRuleCondition) => {
    setRequirementRuleEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: {
              ...currentValue.draft,
              when: {
                all: [nextCondition],
              },
            },
          }
        : currentValue
    );
  }, []);

  const openDefaultFilterEditor = useCallback((index: number | null, fieldId?: string) => {
    const draft = index === null
      ? createDefaultFilterCondition(currentViewFilterTargets, fieldId ?? pendingDefaultFilterFieldId)
      : (currentDefaultFilterConditions[index] ?? null);

    if (!draft) {
      return;
    }

    setDefaultFilterEditor({
      draft,
      index,
    });
  }, [currentDefaultFilterConditions, currentViewFilterTargets, pendingDefaultFilterFieldId]);

  const setDefaultFilterCondition = useCallback((nextCondition: FormBuilderFilterCondition) => {
    setDefaultFilterEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: nextCondition,
          }
        : currentValue
    );
  }, []);

  const openQuickFilterEditor = useCallback((index: number | null) => {
    const draft = index === null
      ? createDefaultQuickFilterDraft(rootViewFilterTargets, defaultQuickFilterLabel)
      : (quickFilters[index] ?? null);

    if (!draft) {
      return;
    }

    setQuickFilterEditor({
      draft: {
        ...draft,
        conditions: [...draft.conditions],
      },
      index,
    });
  }, [defaultQuickFilterLabel, quickFilters, rootViewFilterTargets]);

  const addQuickFilterCondition = useCallback(() => {
    const nextCondition = createDefaultFilterCondition(rootViewFilterTargets);
    if (!nextCondition) {
      return;
    }

    setQuickFilterEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: {
              ...currentValue.draft,
              conditions: [...currentValue.draft.conditions, nextCondition],
            },
          }
        : currentValue
    );
  }, [rootViewFilterTargets]);

  const setQuickFilterColor = useCallback((color: string) => {
    setQuickFilterEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: {
              ...currentValue.draft,
              color: normalizeHexColor(color) || undefined,
            },
          }
        : currentValue
    );
  }, []);

  const setQuickFilterLabel = useCallback((label: string) => {
    setQuickFilterEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: {
              ...currentValue.draft,
              label,
            },
          }
        : currentValue
    );
  }, []);

  const setQuickFilterCondition = useCallback((
    conditionIndex: number,
    nextCondition: FormBuilderFilterCondition,
  ) => {
    setQuickFilterEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: {
              ...currentValue.draft,
              conditions: currentValue.draft.conditions.map((entry, entryIndex) =>
                entryIndex === conditionIndex ? nextCondition : entry
              ),
            },
          }
        : currentValue
    );
  }, []);

  const removeQuickFilterCondition = useCallback((conditionIndex: number) => {
    setQuickFilterEditor((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            draft: {
              ...currentValue.draft,
              conditions: currentValue.draft.conditions.filter((_, entryIndex) =>
                entryIndex !== conditionIndex
              ),
            },
          }
        : currentValue
    );
  }, []);

  return {
    addQuickFilterCondition,
    closeDefaultFilterEditor,
    closeQuickFilterEditor,
    closeRequirementRuleEditor,
    closeVisibilityRuleEditor,
    defaultFilterEditor,
    openDefaultFilterEditor,
    openQuickFilterEditor,
    openRequirementRuleEditor,
    openVisibilityRuleEditor,
    quickFilterEditor,
    removeQuickFilterCondition,
    requirementRuleEditor,
    setDefaultFilterCondition,
    setQuickFilterColor,
    setQuickFilterCondition,
    setQuickFilterLabel,
    setRequirementRuleCondition,
    setRequirementRuleEffect,
    setVisibilityRuleCondition,
    setVisibilityRuleEffect,
    visibilityRuleEditor,
  } as const;
}
