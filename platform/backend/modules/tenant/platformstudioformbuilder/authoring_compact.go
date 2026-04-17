package platformstudioformbuilder

func compactDataSchemaForStorage(dataSchema map[string]any) map[string]any {
	rootScope := compactDataSchemaScopeForStorage(asMap(dataSchema["rootScope"]), rootSchemaScopeID)
	subformScopes := make([]any, 0)
	for _, raw := range asSlice(dataSchema["subformScopes"]) {
		scope := compactDataSchemaScopeForStorage(asMap(raw), normalizeString(asMap(raw)["schemaScopeId"]))
		if len(scope) == 0 {
			continue
		}
		subformScopes = append(subformScopes, scope)
	}

	return map[string]any{
		"modelId":       normalizeString(dataSchema["modelId"]),
		"modelTitle":    normalizeString(dataSchema["modelTitle"]),
		"rootScope":     rootScope,
		"subformScopes": subformScopes,
	}
}

func compactDataSchemaScopeForStorage(scope map[string]any, scopeID string) map[string]any {
	fields := make([]any, 0)
	for _, raw := range asSlice(scope["fields"]) {
		field := pruneEmptyMapsAndStrings(cloneJSONToMap(mustCanonicalJSON(asMap(raw))))
		if len(field) == 0 {
			continue
		}
		fields = append(fields, field)
	}

	out := map[string]any{
		"fields":        fields,
		"schemaScopeId": chooseString(scopeID, normalizeString(scope["schemaScopeId"])),
	}
	if runtime := pruneEmptyMapsAndStrings(normalizeAnyMap(scope["runtime"])); len(runtime) > 0 {
		out["runtime"] = runtime
	}
	if scopeID != rootSchemaScopeID {
		out["displayName"] = chooseString(normalizeString(scope["displayName"]), humanizeIdentifier(scopeID))
		out["subformType"] = chooseString(normalizeString(scope["subformType"]), "DEFAULT")
		out["tableKey"] = chooseString(normalizeString(scope["tableKey"]), scopeID)
	}
	return pruneEmptyMapsAndStrings(out)
}

func compactUISchemaForStorage(uiSchema map[string]any, dataSchema map[string]any) map[string]any {
	rootScope := compactUIScopeForStorage(asMap(uiSchema["rootScope"]), dataSchema, rootSchemaScopeID)
	subformScopes := make([]any, 0)
	for _, raw := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(raw)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		subform := compactUIScopeForStorage(scope, dataSchema, scopeID)
		if len(subform) == 0 {
			continue
		}
		subformScopes = append(subformScopes, subform)
	}
	return map[string]any{
		"rootScope":     rootScope,
		"subformScopes": subformScopes,
	}
}

func compactUIScopeForStorage(scope map[string]any, dataSchema map[string]any, scopeID string) map[string]any {
	fieldLabelByID := fieldLabelsByID(dataSchema, scopeID)
	nodes := make([]any, 0)
	for _, raw := range asSlice(scope["nodes"]) {
		node := compactUIScopeNodeForStorage(asMap(raw), fieldLabelByID)
		if len(node) == 0 {
			continue
		}
		nodes = append(nodes, node)
	}

	out := map[string]any{
		"nodes":         nodes,
		"schemaScopeId": scopeID,
	}
	if filterDefinitions := compactFilterDefinitionsForStorage(normalizeAnyMap(scope["filterDefinitions"])); len(filterDefinitions) > 0 {
		out["filterDefinitions"] = filterDefinitions
	}
	if runtime := pruneEmptyMapsAndStrings(normalizeAnyMap(scope["runtime"])); len(runtime) > 0 {
		out["runtime"] = runtime
	}
	if systemFields := pruneEmptyMapsAndStrings(normalizeAnyMap(scope["systemFields"])); len(systemFields) > 0 {
		out["systemFields"] = systemFields
	}
	if unplaced := normalizeStringList(scope["unplacedFieldIds"]); len(unplaced) > 0 {
		out["unplacedFieldIds"] = unplaced
	}
	if viewSettings := compactViewSettingsForStorage(normalizeAnyMap(scope["viewSettings"])); len(viewSettings) > 0 {
		out["viewSettings"] = viewSettings
	}
	if scopeID != rootSchemaScopeID {
		out["parentSubformNodeId"] = normalizeString(scope["parentSubformNodeId"])
		out["subformType"] = chooseString(normalizeString(scope["subformType"]), "DEFAULT")
		out["tableKey"] = chooseString(normalizeString(scope["tableKey"]), scopeID)
	}
	return pruneEmptyMapsAndStrings(out)
}

func compactUIScopeNodeForStorage(node map[string]any, fieldLabelByID map[string]string) map[string]any {
	out := cloneJSONToMap(mustCanonicalJSON(node))
	if normalizeString(out["helperText"]) == "" {
		delete(out, "helperText")
	}
	if getBoolValue(out, "required", false) {
		out["required"] = true
	} else {
		delete(out, "required")
	}
	if normalizeString(out["visibility"]) == "visible" {
		delete(out, "visibility")
	}
	if normalizeString(out["parentId"]) == "" {
		delete(out, "parentId")
	}
	if rules := compactNodeRulesForStorage(normalizeAnyMap(out["rules"])); len(rules) > 0 {
		out["rules"] = rules
	} else {
		delete(out, "rules")
	}
	if normalizeString(out["type"]) == "field" {
		fieldID := normalizeString(out["fieldId"])
		if fieldID != "" && normalizeString(out["title"]) == fieldLabelByID[fieldID] {
			delete(out, "title")
		}
	}
	if normalizeString(out["title"]) == "" {
		delete(out, "title")
	}
	return pruneEmptyMapsAndStrings(out)
}

func compactNodeRulesForStorage(rules map[string]any) map[string]any {
	out := map[string]any{}
	if requirements := asSlice(rules["requirementRules"]); len(requirements) > 0 {
		out["requirementRules"] = requirements
	}
	if visibility := asSlice(rules["visibilityRules"]); len(visibility) > 0 {
		out["visibilityRules"] = visibility
	}
	return out
}

func compactFilterDefinitionsForStorage(filterDefinitions map[string]any) map[string]any {
	defaultFilters := asMap(filterDefinitions["defaultFilters"])
	quickFilters := asSlice(filterDefinitions["quickFilters"])
	if len(asSlice(defaultFilters["conditions"])) == 0 && len(quickFilters) == 0 {
		return map[string]any{}
	}
	out := map[string]any{}
	if len(defaultFilters) > 0 {
		out["defaultFilters"] = pruneEmptyMapsAndStrings(defaultFilters)
	}
	if len(quickFilters) > 0 {
		out["quickFilters"] = quickFilters
	}
	if version := getInt64Value(filterDefinitions, "version", 0); version > 0 {
		out["version"] = version
	}
	return pruneEmptyMapsAndStrings(out)
}

func compactViewSettingsForStorage(viewSettings map[string]any) map[string]any {
	out := cloneJSONToMap(mustCanonicalJSON(viewSettings))
	if actions := asMap(out["actions"]); actionsAllTrue(actions) {
		delete(out, "actions")
	}
	if correctiveAction := asMap(out["correctiveAction"]); !getBoolValue(correctiveAction, "enabled", false) {
		delete(out, "correctiveAction")
	}
	list := asMap(out["list"])
	if len(list) > 0 {
		columns := make([]any, 0)
		for _, raw := range asSlice(list["columns"]) {
			column := cloneJSONToMap(mustCanonicalJSON(asMap(raw)))
			if getBoolValue(column, "visible", true) {
				delete(column, "visible")
			}
			columns = append(columns, pruneEmptyMapsAndStrings(column))
		}
		if len(columns) > 0 {
			list["columns"] = columns
		} else {
			delete(list, "columns")
		}
		sorting := asMap(list["sorting"])
		if len(sorting) > 0 {
			if normalizeString(sorting["direction"]) == "asc" {
				delete(sorting, "direction")
			}
			sorting = pruneEmptyMapsAndStrings(sorting)
			if len(sorting) > 0 {
				list["sorting"] = sorting
			} else {
				delete(list, "sorting")
			}
		}
		list = pruneEmptyMapsAndStrings(list)
		if len(list) > 0 {
			out["list"] = list
		} else {
			delete(out, "list")
		}
	}
	return pruneEmptyMapsAndStrings(out)
}

func actionsAllTrue(actions map[string]any) bool {
	if len(actions) == 0 {
		return true
	}
	for _, value := range actions {
		boolValue, ok := value.(bool)
		if !ok || !boolValue {
			return false
		}
	}
	return true
}

func fieldLabelsByID(dataSchema map[string]any, scopeID string) map[string]string {
	labels := make(map[string]string)
	for _, raw := range asSlice(dataSchemaScope(dataSchema, scopeID)["fields"]) {
		field := asMap(raw)
		fieldID := normalizeString(field["id"])
		if fieldID == "" {
			continue
		}
		labels[fieldID] = chooseString(normalizeString(field["label"]), fieldID)
	}
	return labels
}

func pruneEmptyMapsAndStrings(value map[string]any) map[string]any {
	out := make(map[string]any, len(value))
	for key, entry := range value {
		switch typed := entry.(type) {
		case map[string]any:
			pruned := pruneEmptyMapsAndStrings(typed)
			if len(pruned) > 0 {
				out[key] = pruned
			}
		case []any:
			prunedItems := make([]any, 0, len(typed))
			for _, item := range typed {
				switch nested := item.(type) {
				case map[string]any:
					pruned := pruneEmptyMapsAndStrings(nested)
					if len(pruned) > 0 {
						prunedItems = append(prunedItems, pruned)
					}
				case string:
					if normalizeString(nested) != "" {
						prunedItems = append(prunedItems, nested)
					}
				default:
					if item != nil {
						prunedItems = append(prunedItems, item)
					}
				}
			}
			if len(prunedItems) > 0 {
				out[key] = prunedItems
			}
		case string:
			if normalizeString(typed) != "" {
				out[key] = normalizeString(typed)
			}
		default:
			if entry != nil {
				out[key] = entry
			}
		}
	}
	return out
}
