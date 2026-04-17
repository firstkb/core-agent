package platformstudioformbuilder

func injectCompatibilityFields(payload map[string]any) map[string]any {
	out := cloneJSONToMap(mustCanonicalJSON(payload))
	dataSchema := asMap(out["dataSchema"])
	out["fields"] = flattenCompatibilityDataSchemaFields(dataSchema)
	out["schemaScopes"] = dataSchemaSchemaScopes(dataSchema)
	return out
}

func injectCompatibilityViewDocument(viewPayload map[string]any, dataSchema map[string]any) map[string]any {
	out := cloneJSONToMap(mustCanonicalJSON(viewPayload))
	uiSchema := asMap(out["uiSchema"])
	rootScope := uiScope(uiSchema, rootSchemaScopeID)
	rootFieldIDs := sortedFieldIDs(scopeFieldIDSet(dataSchema, rootSchemaScopeID))

	subformScopes := make([]any, 0)
	for _, rawScope := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		subformScopes = append(subformScopes, map[string]any{
			"dataSchema": map[string]any{
				"fieldIds": sortedFieldIDs(scopeFieldIDSet(dataSchema, scopeID)),
			},
			"filterDefinitions":   scope["filterDefinitions"],
			"parentSubformNodeId": normalizeString(scope["parentSubformNodeId"]),
			"scopeId":             scopeID,
			"scopeType":           "SUBFORM",
			"subformType":         chooseString(normalizeString(scope["subformType"]), "DEFAULT"),
			"tableKey":            chooseString(normalizeString(scope["tableKey"]), scopeID),
			"uiSchema": map[string]any{
				"currentParentId": nil,
				"nodes":           cloneJSONArray(asSlice(scope["nodes"])),
				"selectedNodeId":  nil,
			},
			"viewSettings": scope["viewSettings"],
		})
	}

	out["rootScope"] = map[string]any{
		"dataSchema": map[string]any{
			"fieldIds": rootFieldIDs,
		},
		"scopeId":   rootSchemaScopeID,
		"scopeType": "ROOT",
		"uiSchema": map[string]any{
			"currentParentId": nil,
			"nodes":           cloneJSONArray(asSlice(rootScope["nodes"])),
			"selectedNodeId":  nil,
		},
	}
	out["rootView"] = map[string]any{
		"filterDefinitions": rootScope["filterDefinitions"],
		"systemFields":      rootScope["systemFields"],
		"viewDescription":   chooseString(normalizeString(out["viewDescription"]), normalizeString(out["description"])),
		"viewKind":          chooseString(normalizeString(out["viewKind"]), normalizeString(out["kind"])),
		"viewSettings":      rootScope["viewSettings"],
		"viewTitle":         chooseString(normalizeString(out["viewTitle"]), normalizeString(out["title"])),
	}
	out["selectedScopeId"] = rootSchemaScopeID
	out["subformScopes"] = subformScopes
	out["version"] = int64(3)
	return out
}

func parseLegacyViewDocument(payload map[string]any) legacyViewDocument {
	rootScope := asMap(payload["rootScope"])
	rootUISchema := asMap(rootScope["uiSchema"])
	rootView := asMap(payload["rootView"])

	rootNodes := normalizeNodeList(rootUISchema["nodes"])
	if len(rootNodes) == 0 {
		rootNodes = normalizeNodeList(payload["nodes"])
	}

	doc := legacyViewDocument{
		FilterDefinitions: chooseAny(rootView["filterDefinitions"], payload["filterDefinitions"]),
		Nodes:             rootNodes,
		SelectedNodeID:    normalizeString(rootUISchema["selectedNodeId"]),
		SystemFields:      chooseAny(rootView["systemFields"], payload["systemFields"]),
		ViewDescription: chooseString(
			normalizeString(rootView["viewDescription"]),
			chooseString(normalizeString(payload["viewDescription"]), normalizeString(payload["description"])),
		),
		ViewKind: chooseString(
			normalizeString(rootView["viewKind"]),
			chooseString(normalizeString(payload["viewKind"]), normalizeString(payload["kind"])),
		),
		ViewSettings: chooseAny(rootView["viewSettings"], payload["viewSettings"]),
		ViewTitle: chooseString(
			normalizeString(rootView["viewTitle"]),
			chooseString(normalizeString(payload["viewTitle"]), normalizeString(payload["title"])),
		),
	}

	for _, rawScope := range asSlice(payload["subformScopes"]) {
		scope := asMap(rawScope)
		scopeUISchema := asMap(scope["uiSchema"])
		scopeID := chooseString(
			normalizeString(scope["tableKey"]),
			normalizeString(scope["scopeId"]),
		)
		if scopeID == "" {
			scopeID = normalizeString(scope["schemaScopeId"])
		}
		if scopeID == "" {
			continue
		}
		doc.SubformScopes = append(doc.SubformScopes, legacyViewScope{
			FilterDefinitions:   scope["filterDefinitions"],
			Nodes:               normalizeNodeList(scopeUISchema["nodes"]),
			ParentSubformNodeID: normalizeString(scope["parentSubformNodeId"]),
			SchemaScopeID:       scopeID,
			SubformType:         chooseString(normalizeString(scope["subformType"]), "DEFAULT"),
			TableKey:            chooseString(normalizeString(scope["tableKey"]), scopeID),
			ViewSettings:        chooseAny(scopeUISchema["viewSettings"], scope["viewSettings"]),
		})
	}

	return doc
}

func flattenCompatibilityDataSchemaFields(dataSchema map[string]any) []any {
	out := make([]any, 0)
	for _, raw := range flattenDataSchemaFields(dataSchema) {
		field := asMap(raw)
		scopeID := chooseString(
			normalizeString(field["schemaScopeId"]),
			rootSchemaScopeID,
		)
		out = append(out, compatibilityDataSchemaField(field, scopeID))
	}
	return out
}

func flattenDataSchemaFields(dataSchema map[string]any) []any {
	out := make([]any, 0)
	for _, raw := range asSlice(asMap(dataSchema["rootScope"])["fields"]) {
		field := cloneJSONToMap(mustCanonicalJSON(asMap(raw)))
		field["schemaScopeId"] = rootSchemaScopeID
		out = append(out, field)
	}
	for _, rawScope := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		for _, rawField := range asSlice(scope["fields"]) {
			field := cloneJSONToMap(mustCanonicalJSON(asMap(rawField)))
			field["schemaScopeId"] = scopeID
			out = append(out, field)
		}
	}
	return out
}

func compatibilityDataSchemaField(field map[string]any, scopeID string) map[string]any {
	out := cloneJSONToMap(mustCanonicalJSON(field))
	fieldID := normalizeString(out["id"])
	label := chooseString(normalizeString(out["label"]), fieldID)
	status := chooseString(normalizeString(out["status"]), "persisted")
	out["displayName"] = label
	out["fieldId"] = fieldID
	out["isLocked"] = getBoolValue(out, "isLocked", false)
	out["isPersisted"] = status != "draft"
	out["key"] = fieldID
	out["label"] = label
	out["schemaScopeId"] = scopeID
	out["schemaScopeKey"] = scopeID
	out["status"] = status
	return out
}

func dataSchemaSchemaScopes(dataSchema map[string]any) []any {
	out := make([]any, 0)
	for _, raw := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(raw)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		out = append(out, map[string]any{
			"displayName": chooseString(normalizeString(scope["displayName"]), humanizeIdentifier(scopeID)),
			"key":         scopeID,
			"scopeType":   "SUBFORM",
			"subformType": chooseString(normalizeString(scope["subformType"]), "DEFAULT"),
			"tableKey":    chooseString(normalizeString(scope["tableKey"]), scopeID),
		})
	}
	return out
}

func dataSchemaScope(dataSchema map[string]any, scopeID string) map[string]any {
	if scopeID == rootSchemaScopeID {
		return asMap(dataSchema["rootScope"])
	}
	for _, raw := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(raw)
		if normalizeString(scope["schemaScopeId"]) == scopeID {
			return scope
		}
	}
	return map[string]any{
		"fields":        []any{},
		"schemaScopeId": scopeID,
		"scopeType":     "SUBFORM",
	}
}
