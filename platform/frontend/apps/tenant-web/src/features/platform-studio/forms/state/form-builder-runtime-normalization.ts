import type {
  FormBuilderDataScopeRuntime,
  FormBuilderRuntimePreset,
  FormBuilderViewScopeRuntime,
} from "../forms-builder-state";

const formBuilderRuntimePresetValues = new Set<FormBuilderRuntimePreset>([
  "badge",
  "geo_capture",
  "radio_chips",
  "readonly_card",
  "relation_summary_card",
  "select",
  "signature_pad",
]);

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isRuntimePreset(value: unknown): value is FormBuilderRuntimePreset {
  return typeof value === "string" && formBuilderRuntimePresetValues.has(value as FormBuilderRuntimePreset);
}

export function normalizeDataScopeRuntime(value: unknown): FormBuilderDataScopeRuntime | undefined {
  if (!isObjectRecord(value)) {
    return undefined;
  }

  const rtAlias = typeof value.rtAlias === "string" && value.rtAlias.trim().length > 0
    ? value.rtAlias.trim()
    : "";
  const tableName = typeof value.tableName === "string" && value.tableName.trim().length > 0
    ? value.tableName.trim()
    : "";
  const dataViewName = typeof value.dataViewName === "string" && value.dataViewName.trim().length > 0
    ? value.dataViewName.trim()
    : "";
  const mvTableName = typeof value.mvTableName === "string" && value.mvTableName.trim().length > 0
    ? value.mvTableName.trim()
    : undefined;
  const sourceIdColumn = typeof value.sourceIdColumn === "string" && value.sourceIdColumn.trim().length > 0
    ? value.sourceIdColumn.trim()
    : undefined;
  const sourceTenantIdColumn = typeof value.sourceTenantIdColumn === "string" && value.sourceTenantIdColumn.trim().length > 0
    ? value.sourceTenantIdColumn.trim()
    : undefined;
  const sourceGuidColumn = typeof value.sourceGuidColumn === "string" && value.sourceGuidColumn.trim().length > 0
    ? value.sourceGuidColumn.trim()
    : undefined;
  const sourceCreatedAtColumn = typeof value.sourceCreatedAtColumn === "string" && value.sourceCreatedAtColumn.trim().length > 0
    ? value.sourceCreatedAtColumn.trim()
    : undefined;
  const sourceUpdatedAtColumn = typeof value.sourceUpdatedAtColumn === "string" && value.sourceUpdatedAtColumn.trim().length > 0
    ? value.sourceUpdatedAtColumn.trim()
    : undefined;
  const tenantScoped = typeof value.tenantScoped === "boolean"
    ? value.tenantScoped
    : undefined;

  if (!rtAlias || !tableName || !dataViewName) {
    return undefined;
  }

  const runtime: FormBuilderDataScopeRuntime = {
    dataViewName,
    rtAlias,
    tableName,
  };

  if (mvTableName) {
    runtime.mvTableName = mvTableName;
  }
  if (sourceIdColumn) {
    runtime.sourceIdColumn = sourceIdColumn;
  }
  if (sourceTenantIdColumn) {
    runtime.sourceTenantIdColumn = sourceTenantIdColumn;
  }
  if (sourceGuidColumn) {
    runtime.sourceGuidColumn = sourceGuidColumn;
  }
  if (sourceCreatedAtColumn) {
    runtime.sourceCreatedAtColumn = sourceCreatedAtColumn;
  }
  if (sourceUpdatedAtColumn) {
    runtime.sourceUpdatedAtColumn = sourceUpdatedAtColumn;
  }
  if (tenantScoped !== undefined) {
    runtime.tenantScoped = tenantScoped;
  }

  return runtime;
}

export function normalizeViewScopeRuntime(value: unknown): FormBuilderViewScopeRuntime | undefined {
  if (!isObjectRecord(value)) {
    return undefined;
  }

  const viewRtAlias = typeof value.viewRtAlias === "string" && value.viewRtAlias.trim().length > 0
    ? value.viewRtAlias.trim()
    : "";
  const dataViewName = typeof value.dataViewName === "string" && value.dataViewName.trim().length > 0
    ? value.dataViewName.trim()
    : "";
  const gridViewName = typeof value.gridViewName === "string" && value.gridViewName.trim().length > 0
    ? value.gridViewName.trim()
    : "";

  if (!viewRtAlias || !dataViewName || !gridViewName) {
    return undefined;
  }

  return {
    dataViewName,
    gridViewName,
    viewRtAlias,
  };
}
