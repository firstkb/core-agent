package platformstudioformbuilder

import "fmt"

func normalizeModelPayloadForStorage(payload map[string]any, existing *ModelRecord, defaultView *ViewRecord) (map[string]any, error) {
	source := cloneJSONToMap(mustCanonicalJSON(payload))
	if source == nil {
		source = map[string]any{}
	}
	out := cloneJSONToMap(mustCanonicalJSON(source))

	out["id"] = chooseString(normalizeString(out["id"]), existing.ModelID)
	out["key"] = chooseString(normalizeString(out["key"]), existing.ModelKey)
	out["displayName"] = chooseString(normalizeString(out["displayName"]), existing.DisplayName)
	out["name"] = chooseString(normalizeString(out["name"]), out["displayName"].(string))
	out["title"] = chooseString(normalizeString(out["title"]), out["displayName"].(string))
	out["description"] = normalizeString(out["description"])
	out["storageKey"] = chooseString(normalizeString(out["storageKey"]), existing.StorageKey)
	out["sourceType"] = chooseString(normalizeString(out["sourceType"]), existing.SourceType)
	out["isStructureLocked"] = getBoolFallback(out, "isStructureLocked", "modelLocked", existing.IsStructureLocked)
	out["modelLocked"] = out["isStructureLocked"]
	out["canEditViewsOnly"] = effectiveCanEditViewsOnlyForSourceType(
		normalizeString(out["sourceType"]),
		out["isStructureLocked"].(bool),
	)

	dataSchema, err := normalizeDataSchemaPayload(source, existing, defaultView)
	if err != nil {
		return nil, err
	}
	layoutBlueprint, err := normalizeLayoutBlueprintPayload(source, dataSchema, defaultView)
	if err != nil {
		return nil, err
	}

	delete(out, "fields")
	delete(out, "dataCount")
	delete(out, "guid")
	delete(out, "modelStructureVersion")
	delete(out, "owner")
	delete(out, "publishedVersion")
	delete(out, "schemaScopes")
	delete(out, "screens")
	delete(out, "status")
	delete(out, "version")

	out["dataSchema"] = dataSchema
	out["layoutBlueprint"] = layoutBlueprint

	if err := validateAuthoringSchemas(dataSchema, layoutBlueprint, nil); err != nil {
		return nil, err
	}

	return out, nil
}

func normalizeViewPayloadForStorage(
	payload map[string]any,
	model *ModelRecord,
	existing *ViewRecord,
	dataSchema map[string]any,
	layoutBlueprint map[string]any,
) (map[string]any, error) {
	source := cloneJSONToMap(mustCanonicalJSON(payload))
	if source == nil {
		source = map[string]any{}
	}
	out := cloneJSONToMap(mustCanonicalJSON(source))

	out["id"] = chooseString(normalizeString(out["id"]), existing.ViewID)
	out["key"] = chooseString(normalizeString(out["key"]), existing.ViewKey)
	out["modelId"] = model.ModelID
	out["displayName"] = chooseString(normalizeString(out["displayName"]), existing.DisplayName)
	out["name"] = chooseString(normalizeString(out["name"]), out["displayName"].(string))
	out["title"] = chooseString(normalizeString(out["title"]), out["displayName"].(string))
	out["description"] = normalizeString(out["description"])
	out["kind"] = chooseString(normalizeString(out["kind"]), existing.ViewType)
	out["isDefault"] = getBoolValue(out, "isDefault", existing.IsDefault)
	out["isViewLocked"] = getBoolFallback(out, "isViewLocked", "viewLocked", existing.IsViewLocked)
	out["viewLocked"] = out["isViewLocked"]
	out["lastAlignedModelStructureVersion"] = model.StructureVersion

	uiSchema, err := normalizeUISchemaPayload(source, dataSchema, layoutBlueprint)
	if err != nil {
		return nil, err
	}
	uiSchema = compactUISchemaForStorage(
		ensureUISchemaRuntimeMetadata(uiSchema, dataSchema, out, model, existing),
		dataSchema,
	)

	delete(out, "currentParentId")
	delete(out, "guid")
	delete(out, "isActive")
	delete(out, "lastAlignedModelStructureVersion")
	delete(out, "nodes")
	delete(out, "filterDefinitions")
	delete(out, "publishedVersion")
	delete(out, "rootScope")
	delete(out, "rootView")
	delete(out, "screens")
	delete(out, "selectedNodeId")
	delete(out, "selectedScopeId")
	delete(out, "status")
	delete(out, "subformScopes")
	delete(out, "systemFields")
	delete(out, "version")
	delete(out, "viewDescription")
	delete(out, "viewKind")
	delete(out, "viewSettings")
	delete(out, "viewTitle")
	delete(out, "viewVersion")
	out["uiSchema"] = uiSchema

	if err := validateAuthoringSchemas(dataSchema, layoutBlueprint, uiSchema); err != nil {
		return nil, err
	}

	return out, nil
}

func normalizeDataSchemaPayload(payload map[string]any, existing *ModelRecord, defaultView *ViewRecord) (map[string]any, error) {
	modelID := chooseString(normalizeString(payload["id"]), existing.ModelID)
	modelTitle := chooseString(
		normalizeString(payload["displayName"]),
		chooseString(normalizeString(payload["title"]), existing.DisplayName),
	)

	if explicit := asMap(payload["dataSchema"]); len(explicit) > 0 {
		return compactDataSchemaForStorage(
			ensureDataSchemaRuntimeMetadata(normalizeExplicitDataSchema(explicit, modelID, modelTitle), payload, existing),
		), nil
	}

	scopeMeta := orderedSubformScopeMeta(payload, defaultView)
	fields := normalizeLegacyFlatFields(asSlice(payload["fields"]))

	rootFields := make([]any, 0)
	fieldsByScope := make(map[string][]any)
	for _, field := range fields {
		scopeID := chooseString(
			normalizeString(field["schemaScopeId"]),
			normalizeString(field["schemaScopeKey"]),
		)
		if scopeID == "" {
			scopeID = rootSchemaScopeID
		}
		field["schemaScopeId"] = scopeID
		delete(field, "schemaScopeKey")
		if scopeID == rootSchemaScopeID {
			rootFields = append(rootFields, field)
			continue
		}
		if _, ok := scopeMeta[scopeID]; !ok {
			scopeMeta[scopeID] = subformScopeMeta{
				DisplayName: humanizeIdentifier(scopeID),
				ID:          scopeID,
				SubformType: "DEFAULT",
				TableKey:    scopeID,
			}
		}
		fieldsByScope[scopeID] = append(fieldsByScope[scopeID], field)
	}

	subformIDs := sortedScopeIDs(scopeMeta)
	subformScopes := make([]any, 0, len(subformIDs))
	for _, scopeID := range subformIDs {
		meta := scopeMeta[scopeID]
		subformScopes = append(subformScopes, map[string]any{
			"displayName":   chooseString(meta.DisplayName, humanizeIdentifier(scopeID)),
			"fields":        fieldsByScope[scopeID],
			"schemaScopeId": scopeID,
			"scopeType":     "SUBFORM",
			"subformType":   chooseString(meta.SubformType, "DEFAULT"),
			"tableKey":      chooseString(meta.TableKey, scopeID),
		})
	}

	return compactDataSchemaForStorage(ensureDataSchemaRuntimeMetadata(map[string]any{
		"modelId":    modelID,
		"modelTitle": modelTitle,
		"rootScope": map[string]any{
			"fields":        rootFields,
			"schemaScopeId": rootSchemaScopeID,
			"scopeType":     "ROOT",
		},
		"subformScopes": subformScopes,
	}, payload, existing)), nil
}

func normalizeExplicitDataSchema(explicit map[string]any, modelID string, modelTitle string) map[string]any {
	rootScope := asMap(explicit["rootScope"])
	rootFields := normalizeDataSchemaFields(asSlice(rootScope["fields"]), rootSchemaScopeID)

	subformScopes := make([]any, 0)
	seen := make(map[string]struct{})
	for _, rawScope := range asSlice(explicit["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := chooseString(
			normalizeString(scope["schemaScopeId"]),
			normalizeString(scope["tableKey"]),
		)
		if scopeID == "" || scopeID == rootSchemaScopeID {
			continue
		}
		if _, ok := seen[scopeID]; ok {
			continue
		}
		seen[scopeID] = struct{}{}
		subformScopes = append(subformScopes, map[string]any{
			"displayName":   chooseString(normalizeString(scope["displayName"]), humanizeIdentifier(scopeID)),
			"fields":        normalizeDataSchemaFields(asSlice(scope["fields"]), scopeID),
			"runtime":       normalizeAnyMap(scope["runtime"]),
			"schemaScopeId": scopeID,
			"scopeType":     "SUBFORM",
			"subformType":   chooseString(normalizeString(scope["subformType"]), "DEFAULT"),
			"tableKey":      chooseString(normalizeString(scope["tableKey"]), scopeID),
		})
	}

	return map[string]any{
		"modelId":    modelID,
		"modelTitle": modelTitle,
		"rootScope": map[string]any{
			"fields":        rootFields,
			"runtime":       normalizeAnyMap(rootScope["runtime"]),
			"schemaScopeId": rootSchemaScopeID,
			"scopeType":     "ROOT",
		},
		"subformScopes": subformScopes,
	}
}

func normalizeLayoutBlueprintPayload(payload map[string]any, dataSchema map[string]any, defaultView *ViewRecord) (map[string]any, error) {
	if explicit := asMap(payload["layoutBlueprint"]); len(explicit) > 0 {
		return normalizeExplicitLayoutBlueprint(explicit, dataSchema), nil
	}
	return deriveLayoutBlueprintFromLegacyView(defaultView, dataSchema), nil
}

func normalizeExplicitLayoutBlueprint(explicit map[string]any, dataSchema map[string]any) map[string]any {
	scopeMeta := dataSchemaScopeMeta(dataSchema)
	rootScope := normalizeExplicitBlueprintScope(rootSchemaScopeID, asMap(explicit["rootScope"]), scopeMeta)

	subformScopes := make([]any, 0)
	rawSubformScopes := make(map[string]map[string]any)
	for _, raw := range asSlice(explicit["subformScopes"]) {
		scope := asMap(raw)
		scopeID := chooseString(normalizeString(scope["schemaScopeId"]), normalizeString(scope["tableKey"]))
		if scopeID == "" || scopeID == rootSchemaScopeID {
			continue
		}
		rawSubformScopes[scopeID] = scope
	}

	for _, scopeID := range sortedScopeIDs(scopeMeta) {
		subformScopes = append(subformScopes, normalizeExplicitBlueprintScope(scopeID, rawSubformScopes[scopeID], scopeMeta))
	}

	out := map[string]any{
		"rootScope":     rootScope,
		"subformScopes": subformScopes,
	}

	ensureBlueprintCoverage(out, dataSchema)
	return out
}

func normalizeExplicitBlueprintScope(scopeID string, raw map[string]any, scopeMeta map[string]subformScopeMeta) map[string]any {
	containers := make([]any, 0)
	usedKeys := make(map[string]int)
	for index, rawContainer := range asSlice(raw["containers"]) {
		container := asMap(rawContainer)
		containerType := normalizeString(container["type"])
		if containerType == "" {
			continue
		}
		parentContainerKey := normalizeString(container["parentContainerKey"])
		containerKey := normalizeString(container["containerKey"])
		if containerKey == "" {
			containerKey = deriveGeneratedContainerKey(scopeID, containerType, parentContainerKey, container, usedKeys)
		}
		out := cloneJSONToMap(mustCanonicalJSON(container))
		out["containerKey"] = containerKey
		out["order"] = getInt64Value(out, "order", int64(index))
		out["parentContainerKey"] = parentContainerKey
		out["settings"] = normalizeAnyMap(out["settings"])
		out["title"] = normalizeString(out["title"])
		out["type"] = containerType
		if containerType == "subform" {
			scopeRef := chooseString(
				normalizeString(out["schemaScopeId"]),
				normalizeString(out["tableKey"]),
			)
			if scopeRef == "" {
				scopeRef = chooseString(normalizeString(asMap(out["settings"])["schemaScopeId"]), "")
			}
			if scopeRef != "" {
				meta := scopeMeta[scopeRef]
				out["displayName"] = chooseString(normalizeString(out["displayName"]), chooseString(meta.DisplayName, humanizeIdentifier(scopeRef)))
				out["schemaScopeId"] = scopeRef
				out["subformType"] = chooseString(normalizeString(out["subformType"]), chooseString(meta.SubformType, "DEFAULT"))
				out["tableKey"] = chooseString(normalizeString(out["tableKey"]), chooseString(meta.TableKey, scopeRef))
			}
		}
		containers = append(containers, out)
	}

	fieldPlacements := make([]any, 0)
	for index, rawPlacement := range asSlice(raw["fieldPlacements"]) {
		placement := asMap(rawPlacement)
		fieldID := normalizeString(placement["fieldId"])
		if fieldID == "" {
			continue
		}
		fieldPlacements = append(fieldPlacements, map[string]any{
			"containerKey": normalizeString(placement["containerKey"]),
			"fieldId":      fieldID,
			"order":        getInt64Value(placement, "order", int64(index)),
		})
	}

	return map[string]any{
		"containers":       containers,
		"fieldPlacements":  fieldPlacements,
		"schemaScopeId":    scopeID,
		"unplacedFieldIds": normalizeStringList(raw["unplacedFieldIds"]),
	}
}

func normalizeUISchemaPayload(payload map[string]any, dataSchema map[string]any, layoutBlueprint map[string]any) (map[string]any, error) {
	if explicit := asMap(payload["uiSchema"]); len(explicit) > 0 {
		return normalizeExplicitUISchema(explicit, payload, dataSchema, layoutBlueprint), nil
	}
	return deriveUISchemaFromLegacyPayload(payload, dataSchema, layoutBlueprint), nil
}

func normalizeExplicitUISchema(explicit map[string]any, payload map[string]any, dataSchema map[string]any, layoutBlueprint map[string]any) map[string]any {
	rootRaw := asMap(explicit["rootScope"])
	rootScope := map[string]any{
		"filterDefinitions": normalizeAnyMap(chooseAny(rootRaw["filterDefinitions"], payload["filterDefinitions"])),
		"nodes":             normalizeScopeNodes(rootSchemaScopeID, asSlice(rootRaw["nodes"]), layoutBlueprint),
		"runtime":           normalizeAnyMap(rootRaw["runtime"]),
		"schemaScopeId":     rootSchemaScopeID,
		"systemFields":      normalizeAnyMap(chooseAny(rootRaw["systemFields"], payload["systemFields"])),
		"unplacedFieldIds":  normalizeStringList(rootRaw["unplacedFieldIds"]),
		"viewSettings":      normalizeAnyMap(chooseAny(rootRaw["viewSettings"], payload["viewSettings"])),
	}

	subformMeta := dataSchemaScopeMeta(dataSchema)
	rawScopes := make(map[string]map[string]any)
	for _, rawScope := range asSlice(explicit["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := chooseString(
			normalizeString(scope["schemaScopeId"]),
			normalizeString(scope["tableKey"]),
		)
		if scopeID == "" || scopeID == rootSchemaScopeID {
			continue
		}
		rawScopes[scopeID] = scope
	}

	rootAnchorIDs := rootSubformAnchorNodeIDs(rootScope["nodes"])
	subformScopes := make([]any, 0)
	for _, scopeID := range sortedScopeIDs(subformMeta) {
		scope := rawScopes[scopeID]
		parentSubformNodeID := chooseString(
			normalizeString(scope["parentSubformNodeId"]),
			rootAnchorIDs[scopeID],
		)
		subformScopes = append(subformScopes, map[string]any{
			"filterDefinitions":   normalizeAnyMap(scope["filterDefinitions"]),
			"nodes":               normalizeScopeNodes(scopeID, asSlice(scope["nodes"]), layoutBlueprint),
			"parentSubformNodeId": parentSubformNodeID,
			"runtime":             normalizeAnyMap(scope["runtime"]),
			"schemaScopeId":       scopeID,
			"subformType":         chooseString(normalizeString(scope["subformType"]), chooseString(subformMeta[scopeID].SubformType, "DEFAULT")),
			"tableKey":            chooseString(normalizeString(scope["tableKey"]), chooseString(subformMeta[scopeID].TableKey, scopeID)),
			"unplacedFieldIds":    normalizeStringList(scope["unplacedFieldIds"]),
			"viewSettings":        normalizeAnyMap(scope["viewSettings"]),
		})
	}

	return map[string]any{
		"rootScope":     rootScope,
		"subformScopes": subformScopes,
	}
}

func normalizeLegacyFlatFields(entries []any) []map[string]any {
	out := make([]map[string]any, 0)
	for _, raw := range entries {
		field := asMap(raw)
		scopeID := chooseString(
			normalizeString(field["schemaScopeId"]),
			chooseString(normalizeString(field["schemaScopeKey"]), rootSchemaScopeID),
		)
		normalized := normalizeDataSchemaFields([]any{field}, scopeID)
		if len(normalized) == 0 {
			continue
		}
		nextField := asMap(normalized[0])
		nextField["schemaScopeId"] = scopeID
		out = append(out, nextField)
	}
	return out
}

func uniqueFieldStorageKey(base string, used map[string]struct{}) string {
	base = toStorageKey(base)
	if base == "" {
		base = "field"
	}
	if _, ok := used[base]; !ok {
		used[base] = struct{}{}
		return base
	}

	for suffix := 2; ; suffix++ {
		candidate := fmt.Sprintf("%s_%d", base, suffix)
		if _, ok := used[candidate]; ok {
			continue
		}
		used[candidate] = struct{}{}
		return candidate
	}
}

func normalizeDataSchemaFields(entries []any, scopeID string) []any {
	out := make([]any, 0)
	seen := make(map[string]struct{})
	seenStorageKeys := make(map[string]struct{})
	for _, raw := range entries {
		field := asMap(raw)
		fieldID := normalizeString(field["id"])
		if fieldID == "" {
			continue
		}
		if _, ok := seen[fieldID]; ok {
			continue
		}
		seen[fieldID] = struct{}{}
		normalized := cloneJSONToMap(mustCanonicalJSON(field))
		normalized["id"] = fieldID
		normalized["label"] = chooseString(
			normalizeString(normalized["label"]),
			chooseString(normalizeString(normalized["displayName"]), fieldID),
		)
		normalized["storageKey"] = uniqueFieldStorageKey(
			chooseString(
				normalizeString(normalized["storageKey"]),
				chooseString(
					normalizeString(normalized["label"]),
					fieldID,
				),
			),
			seenStorageKeys,
		)
		status := chooseString(
			normalizeString(normalized["status"]),
			chooseString(statusFromPersistedFlag(normalized["isPersisted"]), "persisted"),
		)
		if status != "persisted" {
			normalized["status"] = status
		} else {
			delete(normalized, "status")
		}
		if getBoolValue(normalized, "isLocked", false) {
			normalized["isLocked"] = true
		} else {
			delete(normalized, "isLocked")
		}
		if normalizeString(normalized["autocomplete"]) == "on" {
			delete(normalized, "autocomplete")
		}
		if getBoolValue(normalized, "uniqueValue", false) {
			normalized["uniqueValue"] = true
		} else {
			delete(normalized, "uniqueValue")
		}
		delete(normalized, "displayName")
		delete(normalized, "fieldId")
		delete(normalized, "isPersisted")
		delete(normalized, "key")
		delete(normalized, "schemaScopeId")
		delete(normalized, "schemaScopeKey")
		out = append(out, pruneEmptyMapsAndStrings(normalized))
	}
	return out
}

func statusFromPersistedFlag(value any) string {
	if persisted, ok := value.(bool); ok && !persisted {
		return "draft"
	}
	return ""
}

func orderedSubformScopeMeta(payload map[string]any, defaultView *ViewRecord) map[string]subformScopeMeta {
	out := make(map[string]subformScopeMeta)
	for _, raw := range asSlice(payload["schemaScopes"]) {
		scope := asMap(raw)
		scopeID := chooseString(normalizeString(scope["key"]), normalizeString(scope["schemaScopeId"]))
		if scopeID == "" || scopeID == rootSchemaScopeID {
			continue
		}
		out[scopeID] = subformScopeMeta{
			DisplayName: chooseString(normalizeString(scope["displayName"]), humanizeIdentifier(scopeID)),
			ID:          scopeID,
			SubformType: chooseString(normalizeString(scope["subformType"]), "DEFAULT"),
			TableKey:    chooseString(normalizeString(scope["tableKey"]), scopeID),
		}
	}
	if defaultView != nil {
		legacy := parseLegacyViewDocument(cloneJSONToMap(defaultView.DefinitionJSON))
		for _, scope := range legacy.SubformScopes {
			scopeID := chooseString(scope.TableKey, scope.SchemaScopeID)
			if scopeID == "" || scopeID == rootSchemaScopeID {
				continue
			}
			if _, ok := out[scopeID]; ok {
				continue
			}
			out[scopeID] = subformScopeMeta{
				DisplayName: humanizeIdentifier(scopeID),
				ID:          scopeID,
				SubformType: chooseString(scope.SubformType, "DEFAULT"),
				TableKey:    chooseString(scope.TableKey, scopeID),
			}
		}
	}
	return out
}

func dataSchemaScopeMeta(dataSchema map[string]any) map[string]subformScopeMeta {
	out := make(map[string]subformScopeMeta)
	for _, raw := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(raw)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		out[scopeID] = subformScopeMeta{
			DisplayName: chooseString(normalizeString(scope["displayName"]), humanizeIdentifier(scopeID)),
			ID:          scopeID,
			SubformType: chooseString(normalizeString(scope["subformType"]), "DEFAULT"),
			TableKey:    chooseString(normalizeString(scope["tableKey"]), scopeID),
		}
	}
	return out
}

func dataSchemaFieldIDs(dataSchema map[string]any) map[string]map[string]struct{} {
	out := map[string]map[string]struct{}{
		rootSchemaScopeID: scopeFieldIDSet(dataSchema, rootSchemaScopeID),
	}
	for _, raw := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(raw)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		out[scopeID] = scopeFieldIDSet(dataSchema, scopeID)
	}
	return out
}

func scopeFieldIDSet(dataSchema map[string]any, scopeID string) map[string]struct{} {
	scope := dataSchemaScope(dataSchema, scopeID)
	out := make(map[string]struct{})
	for _, raw := range asSlice(scope["fields"]) {
		field := asMap(raw)
		fieldID := normalizeString(field["id"])
		if fieldID == "" {
			continue
		}
		out[fieldID] = struct{}{}
	}
	return out
}

func scopeFieldIDs(dataSchema map[string]any, scopeID string) map[string]struct{} {
	return scopeFieldIDSet(dataSchema, scopeID)
}

func blueprintScopesByID(layoutBlueprint map[string]any) map[string]map[string]any {
	out := map[string]map[string]any{
		rootSchemaScopeID: asMap(layoutBlueprint["rootScope"]),
	}
	for _, raw := range asSlice(layoutBlueprint["subformScopes"]) {
		scope := asMap(raw)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		out[scopeID] = scope
	}
	return out
}

func uiScopesByID(uiSchema map[string]any) map[string]map[string]any {
	out := map[string]map[string]any{
		rootSchemaScopeID: uiScope(uiSchema, rootSchemaScopeID),
	}
	for _, raw := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(raw)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		out[scopeID] = scope
	}
	return out
}

func blueprintScope(layoutBlueprint map[string]any, scopeID string) map[string]any {
	if scopeID == rootSchemaScopeID {
		return asMap(layoutBlueprint["rootScope"])
	}
	for _, raw := range asSlice(layoutBlueprint["subformScopes"]) {
		scope := asMap(raw)
		if normalizeString(scope["schemaScopeId"]) == scopeID {
			return scope
		}
	}
	return map[string]any{
		"containers":       []any{},
		"fieldPlacements":  []any{},
		"schemaScopeId":    scopeID,
		"unplacedFieldIds": []string{},
	}
}

func uiScope(uiSchema map[string]any, scopeID string) map[string]any {
	if scopeID == rootSchemaScopeID {
		return asMap(uiSchema["rootScope"])
	}
	for _, raw := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(raw)
		if normalizeString(scope["schemaScopeId"]) == scopeID {
			return scope
		}
	}
	return map[string]any{
		"filterDefinitions":   map[string]any{},
		"nodes":               []any{},
		"parentSubformNodeId": "",
		"schemaScopeId":       scopeID,
		"unplacedFieldIds":    []string{},
		"viewSettings":        map[string]any{},
	}
}
