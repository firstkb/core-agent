import type {
  FormBuilderGridColumnDefinition,
  FormBuilderListRowLayout,
  FormBuilderSubformViewSettings,
  FormBuilderViewSettings,
  FormBuilderViewOnlyBinding,
} from "../forms-builder-state";

const rootRecordIdGridFieldId = "root::record_id";

export function createDefaultViewSettings(): FormBuilderViewSettings {
  return {
    actions: {
      canAdd: true,
      canDelete: true,
      canEdit: true,
      canView: true,
    },
    correctiveAction: {
      enabled: false,
      modelKey: "corrective_action",
      sourceType: "platform_static",
    },
    list: {
      columns: [],
      sorting: {
        direction: "asc",
      },
    },
  };
}

export function createDefaultSubformViewSettings(): FormBuilderSubformViewSettings {
  return {
    actions: {
      canAdd: true,
      canDelete: true,
      canEdit: true,
    },
    list: {
      columns: [],
      sorting: {
        direction: "asc",
      },
    },
  };
}

function isSupportedGridColumnFieldId(
  fieldId: string,
  fieldIds: ReadonlySet<string>,
) {
  if (fieldId === rootRecordIdGridFieldId) {
    return true;
  }

  if (fieldIds.has(fieldId)) {
    return true;
  }

  const parts = fieldId.split("::lookup_output::");
  return parts.length === 2
    && parts[0].trim().length > 0
    && parts[1].trim().length > 0
    && fieldIds.has(parts[0]);
}

function isVisibleGridColumnFieldId(
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
  fieldId: string,
) {
  return columns.some((column) => column.visible && column.fieldId === fieldId);
}

function normalizeListRowLayout(
  value: unknown,
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
  fieldIds: ReadonlySet<string>,
): FormBuilderListRowLayout | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<FormBuilderListRowLayout>;
  const secondaryRowFieldId = typeof candidate.secondaryRowFieldId === "string"
    && isSupportedGridColumnFieldId(candidate.secondaryRowFieldId, fieldIds)
    && isVisibleGridColumnFieldId(columns, candidate.secondaryRowFieldId)
    ? candidate.secondaryRowFieldId
    : undefined;

  return secondaryRowFieldId
    ? { secondaryRowFieldId }
    : undefined;
}

function normalizeGridColumn(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderGridColumnDefinition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FormBuilderGridColumnDefinition>;
  const fieldId = typeof candidate.fieldId === "string" ? candidate.fieldId : "";
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    !isSupportedGridColumnFieldId(fieldId, fieldIds) ||
    typeof candidate.order !== "number" ||
    Number.isNaN(candidate.order)
  ) {
    return null;
  }

  return {
    fieldId,
    id: candidate.id,
    order: candidate.order,
    visible: typeof candidate.visible === "boolean" ? candidate.visible : true,
  };
}

export function normalizeGridColumns(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): ReadonlyArray<FormBuilderGridColumnDefinition> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeGridColumn(entry, fieldIds))
    .filter((entry): entry is FormBuilderGridColumnDefinition => Boolean(entry))
    .sort((left, right) => left.order - right.order);
}

export function normalizeViewOnlyBinding(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderViewOnlyBinding | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<FormBuilderViewOnlyBinding>;
  if (candidate.kind === "root_record_id") {
    return {
      kind: "root_record_id",
    };
  }

  if (
    candidate.kind !== "lookup_derived_output" ||
    typeof candidate.sourceFieldId !== "string" ||
    !fieldIds.has(candidate.sourceFieldId) ||
    typeof candidate.outputKey !== "string" ||
    candidate.outputKey.trim().length === 0
  ) {
    return undefined;
  }

  return {
    kind: "lookup_derived_output",
    outputKey: candidate.outputKey.trim(),
    sourceFieldId: candidate.sourceFieldId,
  };
}

export function normalizeViewSettings(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderViewSettings {
  const defaults = createDefaultViewSettings();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const candidate = value as Partial<FormBuilderViewSettings>;
  const actions = candidate.actions && typeof candidate.actions === "object" ? candidate.actions : undefined;
  const correctiveAction = candidate.correctiveAction && typeof candidate.correctiveAction === "object" ? candidate.correctiveAction : undefined;
  const list = candidate.list && typeof candidate.list === "object" ? candidate.list : undefined;
  const sorting = list?.sorting && typeof list.sorting === "object" ? list.sorting : undefined;
  const columns = normalizeGridColumns(list?.columns, fieldIds);
  const rowLayout = normalizeListRowLayout(list?.rowLayout, columns, fieldIds);
  const sortingFieldId = typeof sorting?.fieldId === "string"
    && isSupportedGridColumnFieldId(sorting.fieldId, fieldIds)
    && isVisibleGridColumnFieldId(columns, sorting.fieldId)
    ? sorting.fieldId
    : undefined;

  return {
    actions: {
      canAdd: typeof actions?.canAdd === "boolean" ? actions.canAdd : defaults.actions.canAdd,
      canDelete: typeof actions?.canDelete === "boolean" ? actions.canDelete : defaults.actions.canDelete,
      canEdit: typeof actions?.canEdit === "boolean" ? actions.canEdit : defaults.actions.canEdit,
      canView: typeof actions?.canView === "boolean" ? actions.canView : defaults.actions.canView,
    },
    correctiveAction: {
      enabled: typeof correctiveAction?.enabled === "boolean" ? correctiveAction.enabled : defaults.correctiveAction.enabled,
      modelKey: "corrective_action",
      sourceType: "platform_static",
    },
    iconDataUrl: typeof candidate.iconDataUrl === "string" && candidate.iconDataUrl.trim().length > 0
      ? candidate.iconDataUrl
      : undefined,
    list: {
      columns,
      rowLayout,
      sorting: {
        direction: sorting?.direction === "desc" ? "desc" : "asc",
        fieldId: sortingFieldId,
      },
    },
  };
}

export function normalizeSubformViewSettings(
  value: unknown,
  fieldIds: ReadonlySet<string>,
): FormBuilderSubformViewSettings {
  const defaults = createDefaultSubformViewSettings();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const candidate = value as Partial<FormBuilderSubformViewSettings>;
  const actions = candidate.actions && typeof candidate.actions === "object" ? candidate.actions : undefined;
  const list = candidate.list && typeof candidate.list === "object" ? candidate.list : undefined;
  const sorting = list?.sorting && typeof list.sorting === "object" ? list.sorting : undefined;
  const columns = normalizeGridColumns(list?.columns, fieldIds);
  const rowLayout = normalizeListRowLayout(list?.rowLayout, columns, fieldIds);
  const sortingFieldId = typeof sorting?.fieldId === "string"
    && isSupportedGridColumnFieldId(sorting.fieldId, fieldIds)
    && isVisibleGridColumnFieldId(columns, sorting.fieldId)
    ? sorting.fieldId
    : undefined;

  return {
    actions: {
      canAdd: typeof actions?.canAdd === "boolean" ? actions.canAdd : defaults.actions.canAdd,
      canDelete: typeof actions?.canDelete === "boolean" ? actions.canDelete : defaults.actions.canDelete,
      canEdit: typeof actions?.canEdit === "boolean" ? actions.canEdit : defaults.actions.canEdit,
    },
    list: {
      columns,
      rowLayout,
      sorting: {
        direction: sorting?.direction === "desc" ? "desc" : "asc",
        fieldId: sortingFieldId,
      },
    },
  };
}
