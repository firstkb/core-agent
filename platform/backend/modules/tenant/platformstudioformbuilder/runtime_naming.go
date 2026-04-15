package platformstudioformbuilder

import (
	"crypto/sha1"
	"encoding/hex"
	"strings"
)

const (
	runtimeIdentifierMaxLength  = 63
	runtimeModelAliasMaxLength  = 29
	runtimeViewAliasMaxLength   = 12
	runtimeViewAliasHashLength  = 4
	runtimeScopeAliasHashLength = 6
)

type runtimeDataScopeMetadata struct {
	RtAlias      string
	TableName    string
	MVTableName  string
	DataViewName string
}

type runtimeViewScopeMetadata struct {
	ViewRtAlias  string
	DataViewName string
	GridViewName string
}

func ensureDataSchemaRuntimeMetadata(dataSchema map[string]any, modelPayload map[string]any, existing *ModelRecord) map[string]any {
	rootScope := dataSchemaScope(dataSchema, rootSchemaScopeID)
	rootRuntime := readRuntimeDataScopeMetadata(rootScope)
	existingRootRuntime, existingScopeRuntime := existingDataSchemaRuntimeMetadata(existing)

	modelSeed := chooseString(
		normalizeString(modelPayload["storageKey"]),
		chooseString(existingStorageKey(existing), toStorageKey(chooseString(normalizeString(modelPayload["id"]), normalizeString(modelPayload["key"])))),
	)
	modelRtAlias := chooseFirstNonEmpty(rootRuntime.RtAlias, existingRootRuntime.RtAlias, buildGeneratedRuntimeModelAlias(modelSeed))
	rootScope["runtime"] = map[string]any{
		"rtAlias":      modelRtAlias,
		"tableName":    chooseFirstNonEmpty(rootRuntime.TableName, existingRootRuntime.TableName, buildGeneratedRuntimeTableName(modelRtAlias)),
		"mvTableName":  chooseFirstNonEmpty(rootRuntime.MVTableName, existingRootRuntime.MVTableName, buildGeneratedRuntimeMVTableName(modelRtAlias, "")),
		"dataViewName": chooseFirstNonEmpty(rootRuntime.DataViewName, existingRootRuntime.DataViewName, buildGeneratedRuntimeDataViewName(modelRtAlias, "")),
	}

	for _, rawScope := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		scopeRuntime := readRuntimeDataScopeMetadata(scope)
		existingRuntime := existingScopeRuntime[scopeID]
		scopeSeed := chooseString(normalizeString(scope["tableKey"]), scopeID)
		scopeRtAlias := chooseFirstNonEmpty(scopeRuntime.RtAlias, existingRuntime.RtAlias, buildGeneratedRuntimeScopeAlias(scopeSeed))
		scope["runtime"] = map[string]any{
			"rtAlias":      scopeRtAlias,
			"tableName":    chooseFirstNonEmpty(scopeRuntime.TableName, existingRuntime.TableName, buildGeneratedRuntimeTableName(modelRtAlias, scopeRtAlias)),
			"mvTableName":  chooseFirstNonEmpty(scopeRuntime.MVTableName, existingRuntime.MVTableName, buildGeneratedRuntimeMVTableName(modelRtAlias, scopeRtAlias)),
			"dataViewName": chooseFirstNonEmpty(scopeRuntime.DataViewName, existingRuntime.DataViewName, buildGeneratedRuntimeDataViewName(modelRtAlias, scopeRtAlias)),
		}
	}

	return dataSchema
}

func ensureUISchemaRuntimeMetadata(
	uiSchema map[string]any,
	dataSchema map[string]any,
	viewPayload map[string]any,
	model *ModelRecord,
	existing *ViewRecord,
) map[string]any {
	rootDataRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(dataSchema, rootSchemaScopeID))
	modelRtAlias := chooseString(rootDataRuntime.RtAlias, buildGeneratedRuntimeModelAlias(chooseString(modelStorageKey(model), normalizeString(viewPayload["modelId"]))))
	viewRtAlias := buildGeneratedRuntimeViewAlias(viewPayload, model)
	existingRootRuntime, existingScopeRuntime := existingUISchemaRuntimeMetadata(existing)

	rootScope := uiScope(uiSchema, rootSchemaScopeID)
	rootRuntime := readRuntimeViewScopeMetadata(rootScope)
	rootScope["runtime"] = map[string]any{
		"viewRtAlias":  chooseFirstNonEmpty(rootRuntime.ViewRtAlias, existingRootRuntime.ViewRtAlias, viewRtAlias),
		"dataViewName": chooseFirstNonEmpty(rootRuntime.DataViewName, existingRootRuntime.DataViewName, rootDataRuntime.DataViewName, buildGeneratedRuntimeDataViewName(modelRtAlias, "")),
		"gridViewName": chooseFirstNonEmpty(rootRuntime.GridViewName, existingRootRuntime.GridViewName, buildGeneratedRuntimeGridViewName(modelRtAlias, "", chooseFirstNonEmpty(rootRuntime.ViewRtAlias, existingRootRuntime.ViewRtAlias, viewRtAlias))),
	}

	for _, rawScope := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		dataScopeRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(dataSchema, scopeID))
		scopeRtAlias := chooseString(dataScopeRuntime.RtAlias, buildGeneratedRuntimeScopeAlias(chooseString(normalizeString(scope["tableKey"]), scopeID)))
		scopeRuntime := readRuntimeViewScopeMetadata(scope)
		existingRuntime := existingScopeRuntime[scopeID]
		scopeViewRtAlias := chooseFirstNonEmpty(scopeRuntime.ViewRtAlias, existingRuntime.ViewRtAlias, viewRtAlias)
		scope["runtime"] = map[string]any{
			"viewRtAlias":  scopeViewRtAlias,
			"dataViewName": chooseFirstNonEmpty(scopeRuntime.DataViewName, existingRuntime.DataViewName, dataScopeRuntime.DataViewName, buildGeneratedRuntimeDataViewName(modelRtAlias, scopeRtAlias)),
			"gridViewName": chooseFirstNonEmpty(scopeRuntime.GridViewName, existingRuntime.GridViewName, buildGeneratedRuntimeGridViewName(modelRtAlias, scopeRtAlias, scopeViewRtAlias)),
		}
	}

	return uiSchema
}

func stripUISchemaRuntimeMetadata(uiSchema map[string]any) {
	rootScope := uiScope(uiSchema, rootSchemaScopeID)
	delete(rootScope, "runtime")
	for _, rawScope := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(rawScope)
		delete(scope, "runtime")
	}
}

func readRuntimeDataScopeMetadata(scope map[string]any) runtimeDataScopeMetadata {
	runtime := asMap(scope["runtime"])
	return runtimeDataScopeMetadata{
		RtAlias:      normalizeString(runtime["rtAlias"]),
		TableName:    normalizeString(runtime["tableName"]),
		MVTableName:  normalizeString(runtime["mvTableName"]),
		DataViewName: normalizeString(runtime["dataViewName"]),
	}
}

func readRuntimeViewScopeMetadata(scope map[string]any) runtimeViewScopeMetadata {
	runtime := asMap(scope["runtime"])
	return runtimeViewScopeMetadata{
		ViewRtAlias:  normalizeString(runtime["viewRtAlias"]),
		DataViewName: normalizeString(runtime["dataViewName"]),
		GridViewName: normalizeString(runtime["gridViewName"]),
	}
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
	return "sf_" + runtimeShortHash(base, runtimeScopeAliasHashLength)
}

func buildGeneratedRuntimeViewAlias(viewPayload map[string]any, model *ModelRecord) string {
	viewKey := chooseString(
		normalizeString(viewPayload["key"]),
		normalizeString(viewPayload["id"]),
	)
	if getBoolValue(viewPayload, "isDefault", false) || normalizeStableKey(viewKey) == "default" {
		return "default"
	}

	base := runtimeAliasBase(viewKey)
	modelPrefixes := []string{
		runtimeAliasBase(chooseString(modelKey(model), normalizeString(viewPayload["modelId"]))),
		runtimeAliasBase(modelStorageKey(model)),
	}
	for _, prefix := range modelPrefixes {
		if prefix == "" {
			continue
		}
		if strings.HasPrefix(base, prefix+"_") {
			base = strings.TrimPrefix(base, prefix+"_")
			break
		}
	}
	if base == "" || base == "default" {
		base = "view"
	}
	return runtimeReadableAlias(base, runtimeViewAliasMaxLength, runtimeViewAliasHashLength)
}

func buildGeneratedRuntimeTableName(modelRtAlias string, scopeRtAlias ...string) string {
	raw := "ps_" + modelRtAlias
	if len(scopeRtAlias) > 0 && strings.TrimSpace(scopeRtAlias[0]) != "" {
		raw += "__" + scopeRtAlias[0]
	}
	return runtimeIdentifier(raw)
}

func buildGeneratedRuntimeMVTableName(modelRtAlias string, scopeRtAlias string) string {
	raw := buildGeneratedRuntimeTableName(modelRtAlias, scopeRtAlias)
	return runtimeIdentifier(raw + "__mv")
}

func buildGeneratedRuntimeDataViewName(modelRtAlias string, scopeRtAlias string) string {
	raw := "vw_" + modelRtAlias
	if strings.TrimSpace(scopeRtAlias) != "" {
		raw += "__" + scopeRtAlias
	}
	return runtimeIdentifier(raw)
}

func buildGeneratedRuntimeGridViewName(modelRtAlias string, scopeRtAlias string, viewRtAlias string) string {
	raw := "vg_" + modelRtAlias
	if strings.TrimSpace(scopeRtAlias) != "" {
		raw += "__" + scopeRtAlias
	}
	raw += "__" + viewRtAlias
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

func collapseUnderscores(value string) string {
	var b strings.Builder
	lastUnderscore := false
	for _, r := range value {
		if r == '_' {
			if lastUnderscore {
				continue
			}
			lastUnderscore = true
			b.WriteRune(r)
			continue
		}
		lastUnderscore = false
		b.WriteRune(r)
	}
	return strings.Trim(b.String(), "_")
}

func existingStorageKey(existing *ModelRecord) string {
	if existing == nil {
		return ""
	}
	return strings.TrimSpace(existing.StorageKey)
}

func chooseFirstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) == "" {
			continue
		}
		return value
	}
	return ""
}

func existingDataSchemaRuntimeMetadata(existing *ModelRecord) (runtimeDataScopeMetadata, map[string]runtimeDataScopeMetadata) {
	if existing == nil || len(existing.DefinitionJSON) == 0 {
		return runtimeDataScopeMetadata{}, map[string]runtimeDataScopeMetadata{}
	}
	payload := cloneJSONToMap(existing.DefinitionJSON)
	dataSchema := asMap(payload["dataSchema"])
	if len(dataSchema) == 0 {
		return runtimeDataScopeMetadata{}, map[string]runtimeDataScopeMetadata{}
	}

	rootRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(dataSchema, rootSchemaScopeID))
	scopeRuntime := make(map[string]runtimeDataScopeMetadata)
	for _, rawScope := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		scopeRuntime[scopeID] = readRuntimeDataScopeMetadata(scope)
	}
	return rootRuntime, scopeRuntime
}

func existingUISchemaRuntimeMetadata(existing *ViewRecord) (runtimeViewScopeMetadata, map[string]runtimeViewScopeMetadata) {
	if existing == nil || len(existing.DefinitionJSON) == 0 {
		return runtimeViewScopeMetadata{}, map[string]runtimeViewScopeMetadata{}
	}
	payload := cloneJSONToMap(existing.DefinitionJSON)
	uiSchema := asMap(payload["uiSchema"])
	if len(uiSchema) == 0 {
		return runtimeViewScopeMetadata{}, map[string]runtimeViewScopeMetadata{}
	}

	rootRuntime := readRuntimeViewScopeMetadata(uiScope(uiSchema, rootSchemaScopeID))
	scopeRuntime := make(map[string]runtimeViewScopeMetadata)
	for _, rawScope := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		scopeRuntime[scopeID] = readRuntimeViewScopeMetadata(scope)
	}
	return rootRuntime, scopeRuntime
}

func modelStorageKey(model *ModelRecord) string {
	if model == nil {
		return ""
	}
	return strings.TrimSpace(model.StorageKey)
}

func modelKey(model *ModelRecord) string {
	if model == nil {
		return ""
	}
	return chooseString(strings.TrimSpace(model.ModelKey), strings.TrimSpace(model.ModelID))
}
