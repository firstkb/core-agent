package platformstudioformbuilder

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (s *Service) ExportModelData(ctx context.Context, modelID string) (*ExportFile, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	modelID = strings.TrimSpace(modelID)
	if modelID == "" {
		return nil, ErrInvalidDraft
	}

	model, err := s.repo.GetModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}
	if model == nil {
		return nil, ErrModelNotFound
	}
	if isStaticModelRestrictedForActor(claims, model) {
		return nil, ErrModelNotFound
	}
	if !isManagedRuntimeSourceType(model.SourceType) {
		return nil, ErrExportUnsupported
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	lookupModels, err := s.resolveRuntimeLookupModels(ctx, tenant, modelPayload)
	if err != nil {
		return nil, err
	}

	runtimePlan := buildRuntimeApplyPlan(model, views, modelPayload, lookupModels)
	columns := buildModelDataExportColumns(
		asMap(modelPayload["dataSchema"]),
		runtimePlan.RootScope.SourceIDColumn,
		runtimePlan.RootScope.Fields,
	)
	columnNames := make([]string, 0, len(columns))
	for _, column := range columns {
		columnNames = append(columnNames, column.ColumnName)
	}

	rows, err := s.repo.ExportDataRows(
		ctx,
		tenant,
		runtimePlan.RootScope.TableName,
		columnNames,
		runtimePlan.RootScope.SourceIDColumn,
	)
	if err != nil {
		return nil, err
	}
	content, err := encodeModelDataCSV(columns, rows)
	if err != nil {
		return nil, err
	}

	return &ExportFile{
		FileName:    buildModelExportFileName(model, "data.csv"),
		ContentType: "text/csv; charset=utf-8",
		Content:     content,
	}, nil
}

func (s *Service) ExportModelBundle(ctx context.Context, modelID string) (*ExportFile, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	modelID = strings.TrimSpace(modelID)
	if modelID == "" {
		return nil, ErrInvalidDraft
	}

	model, err := s.repo.GetModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}
	if model == nil {
		return nil, ErrModelNotFound
	}
	if isStaticModelRestrictedForActor(claims, model) {
		return nil, ErrModelNotFound
	}
	if !isManagedRuntimeSourceType(model.SourceType) {
		return nil, ErrExportUnsupported
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}
	if !isRootActor(claims) {
		for index := range views {
			if !canAccessViewAuthoring(claims, &views[index]) {
				return nil, ErrViewLocked
			}
		}
	}

	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	exportedAt := time.Now().UTC().Format(time.RFC3339)
	sourceType := chooseString(model.SourceType, normalizeString(modelPayload["sourceType"]))

	viewPayloads := make([]any, 0, len(views))
	for index := range views {
		viewPayload, err := buildCanonicalViewPayload(model, &views[index], views, modelPayload)
		if err != nil {
			return nil, err
		}
		viewPayloads = append(viewPayloads, viewPayload)
	}

	bundle := map[string]any{
		"dependencies":  buildExportModelDependencies(asMap(modelPayload["dataSchema"])),
		"exportKind":    "form_builder_model",
		"exportMeta":    buildExportMeta(tenant, claims, exportedAt),
		"exportedAt":    exportedAt,
		"formatVersion": "v1",
		"importPolicy": map[string]any{
			"conflictMode": "reject",
		},
		"model":         modelPayload,
		"runtimePolicy": buildExportRuntimePolicy(sourceType),
		"views":         viewPayloads,
	}
	content, err := json.MarshalIndent(bundle, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("form builder: marshal model export bundle: %w", err)
	}

	return &ExportFile{
		FileName:    buildModelExportFileName(model, "model.json"),
		ContentType: "application/json; charset=utf-8",
		Content:     content,
	}, nil
}

func buildExportMeta(
	tenant requestctx.TenantInfo,
	claims requestctx.ClaimsInfo,
	exportedAt string,
) map[string]any {
	meta := map[string]any{
		"exportedAt": exportedAt,
	}
	if tenantID := strings.TrimSpace(tenant.ID); tenantID != "" {
		meta["sourceTenantId"] = tenantID
	}
	if tenantName := strings.TrimSpace(tenant.Name); tenantName != "" {
		meta["sourceTenantName"] = tenantName
	}

	exportedBy := map[string]any{}
	if userID := strings.TrimSpace(claims.UserID); userID != "" {
		exportedBy["userId"] = userID
	}
	if email := strings.TrimSpace(claims.Email); email != "" {
		exportedBy["email"] = email
	}
	if len(exportedBy) > 0 {
		meta["exportedBy"] = exportedBy
	}

	return meta
}

func buildExportRuntimePolicy(sourceType string) map[string]any {
	sourceType = chooseString(strings.TrimSpace(sourceType), runtimeSourceTypeManaged)
	if isManagedRuntimeSourceType(sourceType) {
		return map[string]any{
			"onImport":   "reapply_runtime",
			"sourceType": sourceType,
		}
	}
	return map[string]any{
		"onImport":   "validate_runtime_metadata",
		"sourceType": sourceType,
	}
}

func buildExportModelDependencies(dataSchema map[string]any) map[string]any {
	type dependencyAccumulator struct {
		ModelID string
		Reasons map[string]struct{}
	}

	dependencies := make(map[string]*dependencyAccumulator)
	for _, rawField := range flattenDataSchemaFields(dataSchema) {
		field := asMap(rawField)
		modelID, reason := resolveExportDependency(field)
		if modelID == "" {
			continue
		}

		entry, ok := dependencies[modelID]
		if !ok {
			entry = &dependencyAccumulator{
				ModelID: modelID,
				Reasons: map[string]struct{}{},
			}
			dependencies[modelID] = entry
		}
		if reason != "" {
			entry.Reasons[reason] = struct{}{}
		}
	}

	models := make([]string, 0, len(dependencies))
	for modelID := range dependencies {
		models = append(models, modelID)
	}
	sort.Strings(models)

	items := make([]any, 0, len(models))
	for _, modelID := range models {
		entry := dependencies[modelID]
		reasons := make([]string, 0, len(entry.Reasons))
		for reason := range entry.Reasons {
			reasons = append(reasons, reason)
		}
		sort.Strings(reasons)
		items = append(items, map[string]any{
			"modelId":  entry.ModelID,
			"reasons":  reasons,
			"required": true,
		})
	}

	return map[string]any{
		"models": items,
	}
}

func resolveExportDependency(field map[string]any) (string, string) {
	if normalizeString(field["kind"]) != "db_lookup" {
		return "", ""
	}

	switch normalizeString(field["preset"]) {
	case "contact_lookup":
		return "users", "contact_lookup"
	case "company_lookup":
		return "company", "company_lookup"
	case "project_lookup":
		return "projects", "project_lookup"
	}

	sourceModel := normalizeString(asMap(field["lookupConfig"])["sourceModel"])
	if sourceModel == "" {
		return "", ""
	}
	return sourceModel, chooseString(normalizeString(field["preset"]), "lookup_source_model")
}

type modelDataExportColumn struct {
	ColumnName string
	Header     string
}

func buildModelDataExportColumns(dataSchema map[string]any, sourceIDColumn string, fields []runtimeApplyFieldPlan) []modelDataExportColumn {
	rootScope := asMap(dataSchema["rootScope"])
	rootFields := asSlice(rootScope["fields"])
	fieldsByID := make(map[string]runtimeApplyFieldPlan, len(fields))
	for _, field := range fields {
		fieldsByID[field.FieldID] = field
	}

	columns := make([]modelDataExportColumn, 0, len(rootFields)+1)
	if strings.TrimSpace(sourceIDColumn) != "" {
		columns = append(columns, modelDataExportColumn{
			ColumnName: sourceIDColumn,
			Header:     "Doc.id",
		})
	}
	for _, rawField := range rootFields {
		field := asMap(rawField)
		fieldID := chooseString(
			normalizeString(field["fieldId"]),
			chooseString(normalizeString(field["id"]), normalizeString(field["key"])),
		)
		if fieldID == "" {
			continue
		}
		fieldPlan, ok := fieldsByID[fieldID]
		if !ok || !fieldPlan.Supported {
			continue
		}
		columnName := runtimeDataExportColumnForField(fieldPlan)
		if strings.TrimSpace(columnName) == "" {
			continue
		}
		header := chooseString(
			normalizeString(field["label"]),
			chooseString(normalizeString(field["displayName"]), humanizeIdentifier(fieldPlan.StorageKey)),
		)
		columns = append(columns, modelDataExportColumn{
			ColumnName: columnName,
			Header:     header,
		})
	}

	return columns
}

func runtimeDataExportColumnForField(field runtimeApplyFieldPlan) string {
	if strings.TrimSpace(field.SourceColumnName) != "" {
		return field.SourceColumnName
	}
	return strings.TrimSpace(field.ColumnName)
}

func encodeModelDataCSV(columns []modelDataExportColumn, rows [][]string) ([]byte, error) {
	buffer := &bytes.Buffer{}
	writer := csv.NewWriter(buffer)

	headers := make([]string, 0, len(columns))
	for _, column := range columns {
		headers = append(headers, column.Header)
	}
	if err := writer.Write(headers); err != nil {
		return nil, fmt.Errorf("form builder: write export csv header: %w", err)
	}

	for _, row := range rows {
		record := make([]string, len(columns))
		copy(record, row)
		if err := writer.Write(record); err != nil {
			return nil, fmt.Errorf("form builder: write export csv row: %w", err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, fmt.Errorf("form builder: finalize export csv: %w", err)
	}
	return buffer.Bytes(), nil
}

func buildModelExportFileName(model *ModelRecord, suffix string) string {
	base := normalizeStableKey(chooseString(model.ModelKey, model.ModelID))
	if base == "" {
		base = "model"
	}
	return fmt.Sprintf("%s-%s", base, suffix)
}
