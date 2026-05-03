import {
  getFormBuilderNode,
  updateFormBuilderNode,
  type FormBuilderDocument,
  type FormBuilderFilterCondition,
  type FormBuilderGridColumnDefinition,
  type FormBuilderNodeRules,
  type FormBuilderQuickFilter,
  type FormBuilderScope,
  type FormBuilderSubformViewSettings,
  type FormBuilderViewSettings,
} from "../forms-builder-state";
import {
  isVisibleGridColumnFieldId,
  sortGridColumns,
} from "./form-builder-workspace-field-scope-grid";

export type FormBuilderRootViewActionKey = keyof FormBuilderViewSettings["actions"];
export type FormBuilderSubformViewActionKey = keyof FormBuilderSubformViewSettings["actions"];

export function applyDefaultFilterConditionsUpdate(
  document: FormBuilderDocument,
  activeScope: Pick<FormBuilderScope, "scopeId" | "scopeType">,
  updater: (conditions: ReadonlyArray<FormBuilderFilterCondition>) => ReadonlyArray<FormBuilderFilterCondition>,
) {
  if (activeScope.scopeType === "SUBFORM") {
    return {
      ...document,
      subformScopes: document.subformScopes.map((scope) =>
        scope.scopeId === activeScope.scopeId
          ? {
              ...scope,
              filterDefinitions: {
                ...scope.filterDefinitions,
                defaultFilters: {
                  ...scope.filterDefinitions.defaultFilters,
                  conditions: updater(scope.filterDefinitions.defaultFilters.conditions),
                },
              },
            }
          : scope,
      ),
    };
  }

  return {
    ...document,
    filterDefinitions: {
      ...document.filterDefinitions,
      defaultFilters: {
        ...document.filterDefinitions.defaultFilters,
        conditions: updater(document.filterDefinitions.defaultFilters.conditions),
      },
    },
  };
}

export function applyQuickFiltersUpdate(
  document: FormBuilderDocument,
  updater: (quickFilters: ReadonlyArray<FormBuilderQuickFilter>) => ReadonlyArray<FormBuilderQuickFilter>,
) {
  return {
    ...document,
    filterDefinitions: {
      ...document.filterDefinitions,
      quickFilters: updater(document.filterDefinitions.quickFilters),
    },
  };
}

export function applyRootViewSettingsUpdate(
  document: FormBuilderDocument,
  updater: (viewSettings: FormBuilderViewSettings) => FormBuilderViewSettings,
) {
  return {
    ...document,
    viewSettings: updater(document.viewSettings),
  };
}

export function applyRootViewActionUpdate(
  viewSettings: FormBuilderViewSettings,
  actionKey: FormBuilderRootViewActionKey,
  checked: boolean,
) {
  return {
    ...viewSettings,
    actions: {
      ...viewSettings.actions,
      [actionKey]: checked,
    },
  };
}

export function applySubformViewActionUpdate(
  viewSettings: FormBuilderSubformViewSettings,
  actionKey: FormBuilderSubformViewActionKey,
  checked: boolean,
) {
  return {
    ...viewSettings,
    actions: {
      ...viewSettings.actions,
      [actionKey]: checked,
    },
  };
}

export function applyRootCorrectiveActionEnabledUpdate(
  viewSettings: FormBuilderViewSettings,
  enabled: boolean,
) {
  return {
    ...viewSettings,
    correctiveAction: {
      ...viewSettings.correctiveAction,
      enabled,
    },
  };
}

export function applyRootViewSortingDirectionUpdate(
  viewSettings: FormBuilderViewSettings,
  direction: FormBuilderViewSettings["list"]["sorting"]["direction"],
) {
  return {
    ...viewSettings,
    list: {
      ...viewSettings.list,
      sorting: {
        ...viewSettings.list.sorting,
        direction,
      },
    },
  };
}

export function applySubformViewSortingDirectionUpdate(
  viewSettings: FormBuilderSubformViewSettings,
  direction: FormBuilderSubformViewSettings["list"]["sorting"]["direction"],
) {
  return {
    ...viewSettings,
    list: {
      ...viewSettings.list,
      sorting: {
        ...viewSettings.list.sorting,
        direction,
      },
    },
  };
}

export function applyRootViewSortingFieldUpdate(
  viewSettings: FormBuilderViewSettings,
  fieldId: string,
) {
  return {
    ...viewSettings,
    list: {
      ...viewSettings.list,
      sorting: {
        ...viewSettings.list.sorting,
        fieldId: fieldId || undefined,
      },
    },
  };
}

export function applySubformViewSortingFieldUpdate(
  viewSettings: FormBuilderSubformViewSettings,
  fieldId: string,
) {
  return {
    ...viewSettings,
    list: {
      ...viewSettings.list,
      sorting: {
        ...viewSettings.list.sorting,
        fieldId: fieldId || undefined,
      },
    },
  };
}

export function applyRootViewGridColumnsUpdate(
  viewSettings: FormBuilderViewSettings,
  updater: (
    columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
  ) => ReadonlyArray<FormBuilderGridColumnDefinition>,
) {
  const columns = sortGridColumns(updater(viewSettings.list.columns));

  return {
    ...viewSettings,
    list: {
      ...viewSettings.list,
      columns,
      sorting: isVisibleGridColumnFieldId(columns, viewSettings.list.sorting.fieldId)
        ? viewSettings.list.sorting
        : {
            ...viewSettings.list.sorting,
            fieldId: undefined,
          },
    },
  };
}

export function applySubformViewGridColumnsUpdate(
  viewSettings: FormBuilderSubformViewSettings,
  updater: (
    columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
  ) => ReadonlyArray<FormBuilderGridColumnDefinition>,
) {
  const columns = sortGridColumns(updater(viewSettings.list.columns));

  return {
    ...viewSettings,
    list: {
      ...viewSettings.list,
      columns,
      sorting: isVisibleGridColumnFieldId(columns, viewSettings.list.sorting.fieldId)
        ? viewSettings.list.sorting
        : {
            ...viewSettings.list.sorting,
            fieldId: undefined,
          },
    },
  };
}

export function applyCurrentScopeSubformViewSettingsUpdate(
  document: FormBuilderDocument,
  activeScope: Pick<FormBuilderScope, "scopeId" | "scopeType">,
  updater: (viewSettings: FormBuilderSubformViewSettings) => FormBuilderSubformViewSettings,
) {
  if (activeScope.scopeType !== "SUBFORM") {
    return document;
  }

  return {
    ...document,
    subformScopes: document.subformScopes.map((scope) =>
      scope.scopeId === activeScope.scopeId
        ? {
            ...scope,
            viewSettings: updater(scope.viewSettings),
          }
        : scope,
    ),
  };
}

export function applyCurrentScopeSubformTitleUpdate(
  document: FormBuilderDocument,
  activeScope: Pick<FormBuilderScope, "scopeId" | "scopeType">,
  title: string,
) {
  if (activeScope.scopeType !== "SUBFORM") {
    return document;
  }

  const subformScope = document.subformScopes.find((scope) => scope.scopeId === activeScope.scopeId);
  if (!subformScope) {
    return document;
  }

  return updateFormBuilderNode(document, subformScope.parentSubformNodeId, { title });
}

export function applySelectedNodeRulesUpdate(
  document: FormBuilderDocument,
  nodeId: string | null | undefined,
  updater: (rules: FormBuilderNodeRules) => FormBuilderNodeRules,
) {
  const currentNode = getFormBuilderNode(document, nodeId);
  if (!currentNode) {
    return document;
  }

  return updateFormBuilderNode(document, currentNode.id, {
    rules: updater(currentNode.rules ?? {
      requirementRules: [],
      visibilityRules: [],
    }),
  });
}
