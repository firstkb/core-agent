import {
  getFormBuilderNodeScopeId,
  getFormBuilderScopeFieldIds,
  type FormBuilderDocument,
  type FormBuilderGridColumnDefinition,
} from "../forms-builder-state";
import {
  getFormsPlaceholderFieldDisplayName,
  type FormsPlaceholderField,
} from "../forms-placeholder-data";

export function getFieldById(
  fields: ReadonlyArray<FormsPlaceholderField>,
  fieldId: string | null | undefined,
) {
  if (!fieldId) {
    return null;
  }

  return fields.find((field) => field.id === fieldId) ?? null;
}

export function getModelFieldLabel(field: FormsPlaceholderField) {
  return getFormsPlaceholderFieldDisplayName(field);
}

export function findFormBuilderNodeByFieldId(
  document: FormBuilderDocument,
  fieldId: string,
) {
  return document.rootScope.uiSchema.nodes.find((node) => node.type === "field" && node.fieldId === fieldId)
    ?? document.subformScopes
      .flatMap((scope) => scope.uiSchema.nodes)
      .find((node) => node.type === "field" && node.fieldId === fieldId)
    ?? null;
}

export function getAuthoringFieldLabel(
  field: FormsPlaceholderField,
  document: FormBuilderDocument,
) {
  const node = findFormBuilderNodeByFieldId(document, field.id);
  return node?.title?.trim() || getModelFieldLabel(field);
}

export function getFieldLabelAndBoundField(
  field: FormsPlaceholderField,
  document: FormBuilderDocument,
) {
  const labelField = getAuthoringFieldLabel(field, document);

  return {
    boundField: getModelFieldLabel(field),
    labelField,
  };
}

export function getFieldLabelWithBoundField(
  field: FormsPlaceholderField,
  document: FormBuilderDocument,
) {
  const binding = getFieldLabelAndBoundField(field, document);
  return `${binding.labelField} / ${binding.boundField}`;
}

export function getRuleScopeFields(
  document: FormBuilderDocument,
  fields: ReadonlyArray<FormsPlaceholderField>,
  nodeId: string,
) {
  const scopeSubformId = getFormBuilderNodeScopeId(document, nodeId);
  const scopeFieldIds = getFormBuilderScopeFieldIds(
    document,
    scopeSubformId === "root" ? null : scopeSubformId,
  );

  return fields
    .filter((field) => scopeFieldIds.has(field.id))
    .map((field) => ({
      ...field,
      label: getAuthoringFieldLabel(field, document),
    }));
}

export function getScopeFields(
  document: FormBuilderDocument,
  fields: ReadonlyArray<FormsPlaceholderField>,
  scopeSubformId: string | null,
) {
  const scopeFieldIds = getFormBuilderScopeFieldIds(document, scopeSubformId);

  return fields
    .filter((field) => scopeFieldIds.has(field.id))
    .map((field) => ({
      ...field,
      label: getAuthoringFieldLabel(field, document),
    }));
}

export function getGridColumnByFieldId(
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
  fieldId: string,
) {
  return columns.find((column) => column.fieldId === fieldId) ?? null;
}

export function isVisibleGridColumnFieldId(
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
  fieldId: string | null | undefined,
) {
  return Boolean(fieldId) && columns.some((column) => column.visible && column.fieldId === fieldId);
}

export function getNextGridColumnOrder(columns: ReadonlyArray<FormBuilderGridColumnDefinition>) {
  return columns.length === 0
    ? 0
    : Math.max(...columns.map((column) => column.order)) + 1;
}

export function updateGridColumnVisibility(
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
  fieldId: string,
  visible: boolean,
  createColumnId: (fieldId: string) => string,
) {
  const existingColumn = getGridColumnByFieldId(columns, fieldId);
  if (!existingColumn && !visible) {
    return columns;
  }

  if (!existingColumn && visible) {
    return [
      ...columns,
      {
        fieldId,
        id: createColumnId(fieldId),
        order: getNextGridColumnOrder(columns),
        visible: true,
      },
    ];
  }

  return columns.map((column) =>
    column.fieldId === fieldId
      ? {
          ...column,
          visible,
        }
      : column,
  );
}

export function sortGridColumns(
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
) {
  return [...columns].sort((left, right) => {
    if (left.order === right.order) {
      return left.fieldId.localeCompare(right.fieldId);
    }

    return left.order - right.order;
  });
}

export function sortGridScopeFields(
  fields: ReadonlyArray<FormsPlaceholderField>,
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
) {
  const fallbackIndexByFieldId = new Map(fields.map((field, index) => [field.id, index]));

  return [...fields].sort((left, right) => {
    const leftColumn = getGridColumnByFieldId(columns, left.id);
    const rightColumn = getGridColumnByFieldId(columns, right.id);

    if (leftColumn && rightColumn && leftColumn.order !== rightColumn.order) {
      return leftColumn.order - rightColumn.order;
    }

    return (fallbackIndexByFieldId.get(left.id) ?? 0) - (fallbackIndexByFieldId.get(right.id) ?? 0);
  });
}

export function getVisibleGridScopeFields(
  fields: ReadonlyArray<FormsPlaceholderField>,
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
) {
  return sortGridScopeFields(fields, columns)
    .filter((field) => isVisibleGridColumnFieldId(columns, field.id));
}

export function reorderGridColumnsByFieldId(
  columns: ReadonlyArray<FormBuilderGridColumnDefinition>,
  fields: ReadonlyArray<FormsPlaceholderField>,
  sourceFieldId: string,
  targetFieldId: string,
) {
  if (sourceFieldId === targetFieldId) {
    return columns;
  }

  const orderedFieldIds = sortGridScopeFields(fields, columns).map((field) => field.id);
  const sourceIndex = orderedFieldIds.indexOf(sourceFieldId);
  const targetIndex = orderedFieldIds.indexOf(targetFieldId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return columns;
  }

  const nextFieldIds = [...orderedFieldIds];
  const [movedFieldId] = nextFieldIds.splice(sourceIndex, 1);
  if (typeof movedFieldId === "undefined") {
    return columns;
  }

  nextFieldIds.splice(targetIndex, 0, movedFieldId);

  const columnsByFieldId = new Map(columns.map((column) => [column.fieldId, column]));

  return nextFieldIds.map((fieldId, index) => {
    const existingColumn = columnsByFieldId.get(fieldId);

    return {
      fieldId,
      id: existingColumn?.id ?? `grid-column-${fieldId}`,
      order: index,
      visible: existingColumn?.visible ?? false,
    };
  });
}
