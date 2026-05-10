package platformstudioformruntime

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
)

const (
	rootSchemaScopeID             = "root"
	runtimeParentForeignKey       = "_parent_id"
	runtimeIdentifierMaxLength    = 63
	runtimeModelAliasMaxLength    = 29
	runtimeViewAliasHashLength    = 4
	runtimeSourceTypeManaged      = "managed"
	runtimeSourceTypeExternal     = "external"
	runtimeSourceTypeStatic       = "static"
	defaultManagedIDColumn        = "_id"
	defaultManagedTenantColumn    = "tenant_id"
	defaultManagedGUIDColumn      = "_guid"
	defaultManagedUpdatedAtColumn = "_updated_at"
)

func buildRuntimeRootScopePlan(model *ModelRecord, view *ViewRecord) (runtimeRootScopePlan, error) {
	modelPayload := cloneJSONToMap(model.DefinitionJSON)
	viewPayload := cloneJSONToMap(view.DefinitionJSON)
	if len(modelPayload) == 0 || len(viewPayload) == 0 {
		return runtimeRootScopePlan{}, ErrInvalidRequest
	}

	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := dataSchemaScope(dataSchema, rootSchemaScopeID)
	rootRuntime := readRuntimeDataScopeMetadata(rootScope)
	sourceType := chooseString(model.SourceType, normalizeString(modelPayload["sourceType"]))
	sourceType = chooseString(sourceType, runtimeSourceTypeManaged)

	modelAlias := chooseString(
		rootRuntime.RtAlias,
		buildGeneratedRuntimeModelAlias(chooseString(model.StorageKey, chooseString(normalizeString(modelPayload["storageKey"]), model.ModelID))),
	)
	tableName := chooseString(rootRuntime.TableName, buildGeneratedRuntimeTableName(modelAlias))
	dataViewName := chooseString(rootRuntime.DataViewName, buildGeneratedRuntimeDataViewName(modelAlias, ""))
	idColumn, tenantColumn, guidColumn, updatedColumn, tenantScoped := runtimeScopeSourceColumns(sourceType, rootRuntime)

	scope := runtimeRootScopePlan{
		ModelID:                   model.ModelID,
		ViewID:                    view.ViewID,
		SourceType:                sourceType,
		TableName:                 tableName,
		DataViewName:              dataViewName,
		MultiValueOwnerForeignKey: modelAlias + "_id",
		MultiValueTableName:       runtimeScopeMultiValueTableName(sourceType, rootRuntime.MVTableName, modelAlias, ""),
		SourceIDColumn:            idColumn,
		SourceTenantColumn:        tenantColumn,
		SourceGUIDColumn:          guidColumn,
		SourceUpdatedColumn:       updatedColumn,
		TenantScoped:              tenantScoped,
		SystemFields:              readSystemFieldBindings(asMap(asMap(viewPayload["uiSchema"])["rootScope"])),
	}

	for _, rawField := range asSlice(rootScope["fields"]) {
		field := buildRuntimeFieldPlan(asMap(rawField), sourceType)
		if field.FieldID == "" {
			continue
		}
		scope.Fields = append(scope.Fields, field)
	}
	for _, rawSubformScope := range asSlice(dataSchema["subformScopes"]) {
		subformScope := asMap(rawSubformScope)
		scopeID := normalizeString(subformScope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		subformRuntime := readRuntimeDataScopeMetadata(subformScope)
		scopeAlias := chooseString(
			subformRuntime.RtAlias,
			buildGeneratedRuntimeScopeAlias(chooseString(normalizeString(subformScope["tableKey"]), scopeID)),
		)
		subformTableName := chooseString(subformRuntime.TableName, buildGeneratedRuntimeTableName(modelAlias, scopeAlias))
		if strings.TrimSpace(subformRuntime.TableName) == "" {
			subformRuntime.TableName = subformTableName
		}
		subformDataViewName := chooseString(subformRuntime.DataViewName, buildGeneratedRuntimeDataViewName(modelAlias, scopeAlias))
		subformIDColumn, subformTenantColumn, subformGUIDColumn, subformUpdatedColumn, subformTenantScoped := runtimeScopeSourceColumns(sourceType, subformRuntime)
		fields := make([]runtimeFieldPlan, 0)
		for _, rawField := range asSlice(subformScope["fields"]) {
			field := buildRuntimeFieldPlan(asMap(rawField), sourceType)
			if field.FieldID == "" {
				continue
			}
			fields = append(fields, field)
		}
		scope.SubformScopes = append(scope.SubformScopes, runtimeSubformScopePlan{
			DataViewName:              subformDataViewName,
			Fields:                    fields,
			MultiValueOwnerForeignKey: scopeAlias + "_id",
			MultiValueTableName:       runtimeScopeMultiValueTableName(sourceType, subformRuntime.MVTableName, modelAlias, scopeAlias),
			ParentForeignKey:          runtimeParentForeignKey,
			ScopeID:                   scopeID,
			SourceGUIDColumn:          subformGUIDColumn,
			SourceIDColumn:            subformIDColumn,
			SourceTenantColumn:        subformTenantColumn,
			SourceUpdatedColumn:       subformUpdatedColumn,
			SubformType:               chooseString(normalizeString(subformScope["subformType"]), "DEFAULT"),
			TableKey:                  chooseString(normalizeString(subformScope["tableKey"]), scopeID),
			TableName:                 subformRuntime.TableName,
			TenantScoped:              subformTenantScoped,
		})
	}

	if scope.TableName == "" {
		return runtimeRootScopePlan{}, fmt.Errorf("%w: runtime table name is empty", ErrRuntimeUnsupported)
	}
	return scope, nil
}

type runtimeDataScopeMetadata struct {
	RtAlias               string
	TableName             string
	DataViewName          string
	MVTableName           string
	SourceIDColumn        string
	SourceTenantIDColumn  string
	SourceGUIDColumn      string
	SourceUpdatedAtColumn string
	TenantScoped          *bool
}

func readRuntimeDataScopeMetadata(scope map[string]any) runtimeDataScopeMetadata {
	runtime := asMap(scope["runtime"])
	var tenantScoped *bool
	if value, ok := runtime["tenantScoped"].(bool); ok {
		tenantScoped = &value
	}
	return runtimeDataScopeMetadata{
		RtAlias:               normalizeString(runtime["rtAlias"]),
		TableName:             normalizeString(runtime["tableName"]),
		DataViewName:          normalizeString(runtime["dataViewName"]),
		MVTableName:           normalizeString(runtime["mvTableName"]),
		SourceIDColumn:        normalizeString(runtime["sourceIdColumn"]),
		SourceTenantIDColumn:  normalizeString(runtime["sourceTenantIdColumn"]),
		SourceGUIDColumn:      normalizeString(runtime["sourceGuidColumn"]),
		SourceUpdatedAtColumn: normalizeString(runtime["sourceUpdatedAtColumn"]),
		TenantScoped:          tenantScoped,
	}
}

func runtimeScopeSourceColumns(sourceType string, runtime runtimeDataScopeMetadata) (string, string, string, string, bool) {
	if !isExternalRuntimeSourceType(sourceType) {
		return defaultManagedIDColumn, defaultManagedTenantColumn, defaultManagedGUIDColumn, defaultManagedUpdatedAtColumn, true
	}

	tenantScoped := true
	if runtime.TenantScoped != nil {
		tenantScoped = *runtime.TenantScoped
	}

	idColumn := chooseString(runtime.SourceIDColumn, "id")
	tenantColumn := strings.TrimSpace(runtime.SourceTenantIDColumn)
	guidColumn := strings.TrimSpace(runtime.SourceGUIDColumn)
	updatedColumn := strings.TrimSpace(runtime.SourceUpdatedAtColumn)
	if tenantScoped {
		tenantColumn = chooseString(tenantColumn, "tenant_id")
		guidColumn = chooseString(guidColumn, "guid")
		updatedColumn = chooseString(updatedColumn, "updated_at")
	}
	return idColumn, tenantColumn, guidColumn, updatedColumn, tenantScoped
}

func buildRuntimeFieldPlan(field map[string]any, sourceType string) runtimeFieldPlan {
	fieldID := chooseString(normalizeString(field["fieldId"]), chooseString(normalizeString(field["id"]), normalizeString(field["key"])))
	storageKey := normalizeString(field["storageKey"])
	if storageKey == "" {
		storageKey = fieldID
	}
	kind := chooseString(normalizeString(field["kind"]), chooseString(normalizeString(field["dataType"]), normalizeString(field["baseType"])))
	preset := normalizeString(field["preset"])
	selectionMode := normalizeString(field["selectionMode"])
	if preset == "db_lookup_multi" {
		selectionMode = "multiple"
	}
	validation := normalizeString(field["validation"])
	fieldRuntime := asMap(field["runtime"])
	lookupConfig := asMap(field["lookupConfig"])
	sourceColumn := normalizeString(fieldRuntime["sourceColumnName"])

	plan := runtimeFieldPlan{
		FieldID:                fieldID,
		Label:                  chooseString(normalizeString(field["label"]), chooseString(normalizeString(field["displayName"]), fieldID)),
		Kind:                   kind,
		StorageKey:             storageKey,
		Preset:                 preset,
		SelectionMode:          selectionMode,
		Validation:             validation,
		LookupDictionary:       chooseString(normalizeString(lookupConfig["dictionary"]), normalizeString(field["dictionary"])),
		LookupDisplayMode:      readRuntimeLookupDisplayMode(lookupConfig),
		LookupDisplayFields:    readStringList(lookupConfig["displayFields"], field["displayFields"]),
		LookupFilters:          readRuntimeLookupFilters(asSlice(lookupConfig["filters"])),
		LookupSearchFields:     readStringList(lookupConfig["searchFields"]),
		LookupSortField:        normalizeString(lookupConfig["sortField"]),
		LookupSourceModel:      normalizeString(lookupConfig["sourceModel"]),
		LookupStoredTextFields: readStringList(lookupConfig["storedTextFields"]),
		LookupStoredValueField: normalizeString(lookupConfig["storedValueField"]),
		Required:               getBoolValue(field, "required", false),
		UniqueValue:            getBoolValue(field, "uniqueValue", false) && supportsRuntimeUniqueValue(kind, preset, validation),
		OptionLabel:            readOptionLabels(asSlice(field["options"])),
		OptionValue:            readOptionValues(asSlice(field["options"])),
	}

	switch {
	case kind == "short_text",
		kind == "long_text",
		kind == "rich_text",
		kind == "single_select",
		kind == "integer",
		kind == "decimal",
		kind == "currency",
		kind == "boolean",
		kind == "date",
		kind == "date_time":
		plan.ColumnName = runtimeFieldColumnIdentifier(storageKey)
		plan.Supported = true
	case kind == "db_lookup" && selectionMode == "multiple" && isManagedRuntimeSourceType(sourceType):
		plan.MultiValue = true
		plan.Supported = true
	case kind == "db_lookup" && selectionMode == "multiple":
		plan.Supported = false
	case (kind == "multi_select" || kind == "tags") && isManagedRuntimeSourceType(sourceType):
		plan.MultiValue = true
		plan.Supported = true
	case kind == "db_lookup" && plan.Preset == "db_lookup_value":
		plan.ColumnName = runtimeFieldColumnIdentifier(storageKey)
		plan.Supported = true
	case kind == "db_lookup":
		plan.ColumnName = runtimeFieldColumnIdentifier(storageKey + "_id")
		plan.Supported = true
	}

	if !plan.Supported {
		return plan
	}
	if plan.MultiValue {
		return plan
	}
	if sourceColumn != "" {
		plan.ColumnName = sourceColumn
	} else if isExternalRuntimeSourceType(sourceType) {
		plan.ColumnName = chooseString(plan.ColumnName, storageKey)
	}
	return plan
}

func readRuntimeLookupDisplayMode(lookupConfig map[string]any) string {
	if normalizeString(lookupConfig["displayMode"]) == "catalog_modal" {
		return "catalog_modal"
	}
	return "search_select"
}

func supportsRuntimeUniqueValue(kind string, preset string, validation string) bool {
	if kind != "short_text" {
		return false
	}
	if preset == "" && validation == "" {
		return true
	}
	return preset == "email" ||
		preset == "phone" ||
		validation == "email" ||
		validation == "phone"
}

func readSystemFieldBindings(rootScope map[string]any) runtimeSystemFieldBindings {
	systemFields := asMap(rootScope["systemFields"])
	workflow := asMap(systemFields["workflowStatus"])
	return runtimeSystemFieldBindings{
		ReportedBy:   normalizeString(asMap(systemFields["reportedBy"])["fieldId"]),
		ReportedDate: normalizeString(asMap(systemFields["reportedDate"])["fieldId"]),
		WorkflowStatus: runtimeWorkflowStatusBinding{
			FieldID:      normalizeString(workflow["fieldId"]),
			InitialValue: normalizeString(workflow["initialValue"]),
			FinalValue:   normalizeString(workflow["finalValue"]),
		},
	}
}

func readStringList(values ...any) []string {
	out := []string{}
	seen := map[string]struct{}{}
	for _, value := range values {
		for _, rawItem := range asSlice(value) {
			item := normalizeString(rawItem)
			if item == "" {
				continue
			}
			if _, ok := seen[item]; ok {
				continue
			}
			seen[item] = struct{}{}
			out = append(out, item)
		}
	}
	return out
}

func readRuntimeLookupFilters(filters []any) []runtimeLookupFilterPlan {
	out := make([]runtimeLookupFilterPlan, 0, len(filters))
	for _, rawFilter := range filters {
		filter := asMap(rawFilter)
		field := normalizeString(filter["field"])
		if field == "" {
			continue
		}
		out = append(out, runtimeLookupFilterPlan{
			Field:    field,
			Operator: normalizeString(filter["operator"]),
			Value:    filter["value"],
		})
	}
	return out
}

func readOptionValues(options []any) []string {
	values := make([]string, 0, len(options))
	seen := make(map[string]struct{}, len(options))
	for _, rawOption := range options {
		value := normalizeOptionValue(rawOption)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		values = append(values, value)
	}
	return values
}

func readOptionLabels(options []any) map[string]string {
	labels := make(map[string]string, len(options))
	for _, rawOption := range options {
		value := normalizeOptionValue(rawOption)
		if value == "" {
			continue
		}
		label := value
		option := asMap(rawOption)
		if candidate := normalizeString(option["label"]); candidate != "" {
			label = candidate
		}
		labels[value] = label
	}
	return labels
}

func normalizeOptionValue(rawOption any) string {
	if value := normalizeString(rawOption); value != "" {
		return value
	}
	option := asMap(rawOption)
	for _, key := range []string{"value", "id", "key", "option", "label"} {
		if value := normalizeString(option[key]); value != "" {
			return value
		}
	}
	return ""
}

func dataSchemaScope(dataSchema map[string]any, scopeID string) map[string]any {
	if scopeID == rootSchemaScopeID {
		return asMap(dataSchema["rootScope"])
	}
	for _, rawScope := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(rawScope)
		if normalizeString(scope["schemaScopeId"]) == scopeID {
			return scope
		}
	}
	return map[string]any{}
}

func isExternalRuntimeSourceType(sourceType string) bool {
	sourceType = normalizeString(sourceType)
	return sourceType == runtimeSourceTypeExternal || sourceType == runtimeSourceTypeStatic
}

func isManagedRuntimeSourceType(sourceType string) bool {
	sourceType = normalizeString(sourceType)
	return sourceType == "" || sourceType == runtimeSourceTypeManaged
}

func buildGeneratedRuntimeModelAlias(seed string) string {
	base := runtimeAliasBase(seed)
	if base == "" {
		base = "model"
	}
	return runtimeReadableAlias(base, runtimeModelAliasMaxLength, runtimeViewAliasHashLength)
}

func buildGeneratedRuntimeScopeAlias(seed string) string {
	base := runtimeAliasBase(seed)
	if base == "" {
		base = "scope"
	}
	return "sf_" + runtimeShortHash(base, 6)
}

func buildGeneratedRuntimeTableName(modelRtAlias string, scopeRtAlias ...string) string {
	raw := "ps_" + modelRtAlias
	if len(scopeRtAlias) > 0 && strings.TrimSpace(scopeRtAlias[0]) != "" {
		raw += "__" + scopeRtAlias[0]
	}
	return runtimeIdentifier(raw)
}

func buildGeneratedRuntimeMVTableName(modelRtAlias string, scopeRtAlias string) string {
	return runtimeIdentifier(buildGeneratedRuntimeTableName(modelRtAlias, scopeRtAlias) + "__mv")
}

func buildGeneratedRuntimeDataViewName(modelRtAlias string, scopeRtAlias string) string {
	raw := "vw_" + modelRtAlias
	if strings.TrimSpace(scopeRtAlias) != "" {
		raw += "__" + scopeRtAlias
	}
	return runtimeIdentifier(raw)
}

func runtimeScopeMultiValueTableName(sourceType string, configured string, modelRuntimeAlias string, scopeRuntimeAlias string) string {
	if configured = normalizeString(configured); configured != "" {
		return configured
	}
	if !isManagedRuntimeSourceType(sourceType) {
		return ""
	}
	return buildGeneratedRuntimeMVTableName(modelRuntimeAlias, scopeRuntimeAlias)
}

func runtimeFieldColumnIdentifier(raw string) string {
	return runtimeIdentifier(raw)
}

func runtimeAliasBase(value string) string {
	value = strings.Trim(value, "_")
	value = toStorageKey(value)
	value = strings.Trim(value, "_")
	if value == "" {
		return ""
	}
	return collapseUnderscores(value)
}

func runtimeReadableAlias(base string, maxLength int, hashLength int) string {
	base = runtimeAliasBase(base)
	if base == "" {
		base = "runtime"
	}
	if len(base) <= maxLength {
		return base
	}

	suffix := runtimeShortHash(base, hashLength)
	stemLimit := maxLength - len(suffix) - 1
	if stemLimit < 1 {
		return suffix
	}
	stem := strings.Trim(base[:stemLimit], "_")
	if stem == "" {
		stem = "r"
	}
	return stem + "_" + suffix
}

func runtimeShortHash(value string, hexLength int) string {
	sum := sha1.Sum([]byte(value))
	return hex.EncodeToString(sum[:])[:hexLength]
}

func runtimeIdentifier(raw string) string {
	raw = strings.ReplaceAll(raw, "-", "_")
	raw = strings.ToLower(raw)
	raw = strings.Trim(raw, "_")
	if len(raw) <= runtimeIdentifierMaxLength {
		return raw
	}
	suffix := runtimeShortHash(raw, 8)
	trimmed := strings.Trim(raw[:runtimeIdentifierMaxLength-len(suffix)-1], "_")
	if trimmed == "" {
		trimmed = "r"
	}
	return trimmed + "_" + suffix
}

func toStorageKey(value string) string {
	value = normalizeStableKey(value)
	if value == "" {
		return ""
	}
	value = strings.ReplaceAll(value, "-", "_")
	return strings.Trim(value, "_")
}

func normalizeStableKey(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return ""
	}

	var b strings.Builder
	lastDash := false
	for _, r := range value {
		switch {
		case r >= 'a' && r <= 'z':
			b.WriteRune(r)
			lastDash = false
		case r >= '0' && r <= '9':
			b.WriteRune(r)
			lastDash = false
		default:
			if !lastDash {
				b.WriteByte('-')
				lastDash = true
			}
		}
	}

	return strings.Trim(b.String(), "-")
}

func collapseUnderscores(value string) string {
	var b strings.Builder
	lastUnderscore := false
	for _, r := range value {
		if r == '_' {
			if !lastUnderscore {
				b.WriteRune(r)
			}
			lastUnderscore = true
			continue
		}
		b.WriteRune(r)
		lastUnderscore = false
	}
	return strings.Trim(b.String(), "_")
}

func cloneJSONToMap(raw json.RawMessage) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return map[string]any{}
	}
	if out == nil {
		return map[string]any{}
	}
	return out
}

func asMap(value any) map[string]any {
	if typed, ok := value.(map[string]any); ok && typed != nil {
		return typed
	}
	return map[string]any{}
}

func asSlice(value any) []any {
	switch typed := value.(type) {
	case []any:
		return typed
	default:
		return []any{}
	}
}

func normalizeString(value any) string {
	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed)
	case json.RawMessage:
		return strings.TrimSpace(string(typed))
	default:
		return ""
	}
}

func chooseString(primary string, fallback string) string {
	if strings.TrimSpace(primary) != "" {
		return strings.TrimSpace(primary)
	}
	return strings.TrimSpace(fallback)
}

func getBoolValue(payload map[string]any, key string, fallback bool) bool {
	value, ok := payload[key]
	if !ok {
		return fallback
	}
	if typed, ok := value.(bool); ok {
		return typed
	}
	return fallback
}
