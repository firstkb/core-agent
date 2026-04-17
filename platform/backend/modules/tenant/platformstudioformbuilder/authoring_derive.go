package platformstudioformbuilder

import "sort"

func deriveLayoutBlueprintFromLegacyView(defaultView *ViewRecord, dataSchema map[string]any) map[string]any {
	scopeMeta := dataSchemaScopeMeta(dataSchema)
	legacy := legacyViewDocument{}
	if defaultView != nil {
		legacy = parseLegacyViewDocument(cloneJSONToMap(defaultView.DefinitionJSON))
	}
	parentScopeByNodeID := make(map[string]string)
	for _, scope := range legacy.SubformScopes {
		if scope.ParentSubformNodeID != "" && scope.SchemaScopeID != "" {
			parentScopeByNodeID[scope.ParentSubformNodeID] = scope.SchemaScopeID
		}
	}

	rootScope := deriveBlueprintScopeFromNodes(rootSchemaScopeID, legacy.Nodes, parentScopeByNodeID, scopeFieldIDs(dataSchema, rootSchemaScopeID))

	subformScopes := make([]any, 0)
	scopeMap := make(map[string]legacyViewScope)
	for _, scope := range legacy.SubformScopes {
		scopeMap[scope.SchemaScopeID] = scope
	}
	for _, scopeID := range sortedScopeIDs(scopeMeta) {
		scope := scopeMap[scopeID]
		subformScopes = append(subformScopes, deriveBlueprintScopeFromNodes(scopeID, scope.Nodes, nil, scopeFieldIDs(dataSchema, scopeID)))
	}

	out := map[string]any{
		"rootScope":     rootScope,
		"subformScopes": subformScopes,
	}
	ensureBlueprintCoverage(out, dataSchema)
	return out
}

func deriveBlueprintScopeFromNodes(
	scopeID string,
	nodes []map[string]any,
	parentScopeByNodeID map[string]string,
	knownFieldIDs map[string]struct{},
) map[string]any {
	if nodes == nil {
		nodes = []map[string]any{}
	}

	orderedNodes := append([]map[string]any(nil), nodes...)
	sort.SliceStable(orderedNodes, func(i, j int) bool {
		return getInt64Value(orderedNodes[i], "order", int64(i)) < getInt64Value(orderedNodes[j], "order", int64(j))
	})

	nodeContainerKeys := make(map[string]string)
	containerTypes := make(map[string]string)
	usedKeys := make(map[string]int)
	containers := make([]any, 0)
	unplacedFieldIDs := make([]string, 0)

	for index, node := range orderedNodes {
		nodeType := normalizeString(node["type"])
		if _, ok := acceptedBlueprintContainerTypes[nodeType]; !ok {
			continue
		}
		nodeID := normalizeString(node["id"])
		parentContainerKey := ""
		parentID := normalizeString(node["parentId"])
		if parentID != "" {
			parentContainerKey = nodeContainerKeys[parentID]
		}
		containerKey := normalizeString(node["containerKey"])
		if containerKey == "" {
			containerKey = deriveGeneratedContainerKey(scopeID, nodeType, parentContainerKey, node, usedKeys)
		}
		nodeContainerKeys[nodeID] = containerKey
		containerTypes[containerKey] = nodeType
		container := map[string]any{
			"containerKey":       containerKey,
			"order":              getInt64Value(node, "order", int64(index)),
			"parentContainerKey": parentContainerKey,
			"settings":           normalizeAnyMap(node["settings"]),
			"title":              normalizeString(node["title"]),
			"type":               nodeType,
		}
		if nodeType == "subform" {
			scopeRef := ""
			if parentScopeByNodeID != nil {
				scopeRef = chooseString(parentScopeByNodeID[nodeID], scopeRef)
			}
			scopeRef = chooseString(scopeRef, normalizeString(node["schemaScopeId"]))
			scopeRef = chooseString(scopeRef, normalizeString(node["tableKey"]))
			container["schemaScopeId"] = scopeRef
			container["subformType"] = chooseString(normalizeString(node["subformType"]), "DEFAULT")
			container["tableKey"] = chooseString(normalizeString(node["tableKey"]), scopeRef)
		}
		containers = append(containers, container)
	}

	fieldPlacements := make([]any, 0)
	placedFieldIDs := make(map[string]struct{})
	for index, node := range orderedNodes {
		if normalizeString(node["type"]) != "field" {
			continue
		}
		fieldID := normalizeString(node["fieldId"])
		if fieldID == "" {
			continue
		}
		if len(knownFieldIDs) > 0 {
			if _, ok := knownFieldIDs[fieldID]; !ok {
				continue
			}
		}
		parentContainerKey := ""
		parentID := normalizeString(node["parentId"])
		if parentID != "" {
			parentContainerKey = nodeContainerKeys[parentID]
		}
		if parentID != "" && parentContainerKey == "" {
			unplacedFieldIDs = append(unplacedFieldIDs, fieldID)
			continue
		}
		placementContainerKey := parentContainerKey
		if parentID == "" {
			placementContainerKey = scopeRootPlacementKey
		}
		placedFieldIDs[fieldID] = struct{}{}
		fieldPlacements = append(fieldPlacements, map[string]any{
			"containerKey": placementContainerKey,
			"fieldId":      fieldID,
			"order":        getInt64Value(node, "order", int64(index)),
		})
	}

	for fieldID := range knownFieldIDs {
		if _, ok := placedFieldIDs[fieldID]; ok {
			continue
		}
		if containsString(unplacedFieldIDs, fieldID) {
			continue
		}
		unplacedFieldIDs = append(unplacedFieldIDs, fieldID)
	}

	sort.Strings(unplacedFieldIDs)
	return map[string]any{
		"containers":       containers,
		"fieldPlacements":  fieldPlacements,
		"schemaScopeId":    scopeID,
		"unplacedFieldIds": unplacedFieldIDs,
	}
}

func deriveUISchemaFromLegacyPayload(payload map[string]any, dataSchema map[string]any, layoutBlueprint map[string]any) map[string]any {
	legacy := parseLegacyViewDocument(payload)
	rootScope := map[string]any{
		"filterDefinitions": normalizeAnyMap(legacy.FilterDefinitions),
		"nodes":             normalizeScopeNodes(rootSchemaScopeID, legacy.Nodes, layoutBlueprint),
		"runtime":           map[string]any{},
		"schemaScopeId":     rootSchemaScopeID,
		"systemFields":      normalizeAnyMap(legacy.SystemFields),
		"unplacedFieldIds":  []string{},
		"viewSettings":      normalizeAnyMap(legacy.ViewSettings),
	}

	rootAnchorIDs := rootSubformAnchorNodeIDs(rootScope["nodes"])
	subformMeta := dataSchemaScopeMeta(dataSchema)
	legacyScopes := make(map[string]legacyViewScope)
	for _, scope := range legacy.SubformScopes {
		legacyScopes[scope.SchemaScopeID] = scope
	}

	subformScopes := make([]any, 0)
	for _, scopeID := range sortedScopeIDs(subformMeta) {
		scope := legacyScopes[scopeID]
		parentSubformNodeID := chooseString(scope.ParentSubformNodeID, rootAnchorIDs[scopeID])
		subformScopes = append(subformScopes, map[string]any{
			"filterDefinitions":   normalizeAnyMap(scope.FilterDefinitions),
			"nodes":               normalizeScopeNodes(scopeID, scope.Nodes, layoutBlueprint),
			"parentSubformNodeId": parentSubformNodeID,
			"runtime":             map[string]any{},
			"schemaScopeId":       scopeID,
			"subformType":         chooseString(scope.SubformType, chooseString(subformMeta[scopeID].SubformType, "DEFAULT")),
			"tableKey":            chooseString(scope.TableKey, chooseString(subformMeta[scopeID].TableKey, scopeID)),
			"unplacedFieldIds":    []string{},
			"viewSettings":        normalizeAnyMap(scope.ViewSettings),
		})
	}

	return map[string]any{
		"rootScope":     rootScope,
		"subformScopes": subformScopes,
	}
}

func buildFreshUISchema(dataSchema map[string]any, layoutBlueprint map[string]any) map[string]any {
	rootScope := materializeUIScope(rootSchemaScopeID, blueprintScope(layoutBlueprint, rootSchemaScopeID))
	rootNodes := asSlice(rootScope["nodes"])
	rootAnchorIDs := rootSubformAnchorNodeIDs(rootNodes)

	subformMeta := dataSchemaScopeMeta(dataSchema)
	subformScopes := make([]any, 0)
	for _, scopeID := range sortedScopeIDs(subformMeta) {
		scope := materializeUIScope(scopeID, blueprintScope(layoutBlueprint, scopeID))
		scope["filterDefinitions"] = map[string]any{}
		scope["parentSubformNodeId"] = rootAnchorIDs[scopeID]
		scope["runtime"] = map[string]any{}
		scope["schemaScopeId"] = scopeID
		scope["subformType"] = chooseString(subformMeta[scopeID].SubformType, "DEFAULT")
		scope["tableKey"] = chooseString(subformMeta[scopeID].TableKey, scopeID)
		scope["viewSettings"] = map[string]any{}
		subformScopes = append(subformScopes, scope)
	}

	return compactUISchemaForStorage(map[string]any{
		"rootScope": map[string]any{
			"filterDefinitions": map[string]any{},
			"nodes":             rootNodes,
			"runtime":           map[string]any{},
			"schemaScopeId":     rootSchemaScopeID,
			"systemFields":      map[string]any{},
			"unplacedFieldIds":  normalizeStringList(rootScope["unplacedFieldIds"]),
			"viewSettings":      map[string]any{},
		},
		"subformScopes": subformScopes,
	}, dataSchema)
}

func materializeUIScope(scopeID string, blueprint map[string]any) map[string]any {
	containersByParent := make(map[string][]map[string]any)
	containerNodeIDs := make(map[string]string)
	for _, raw := range asSlice(blueprint["containers"]) {
		container := asMap(raw)
		parent := normalizeString(container["parentContainerKey"])
		containersByParent[parent] = append(containersByParent[parent], container)
	}

	for parent := range containersByParent {
		sort.SliceStable(containersByParent[parent], func(i, j int) bool {
			return getInt64Value(containersByParent[parent][i], "order", int64(i)) < getInt64Value(containersByParent[parent][j], "order", int64(j))
		})
	}

	nodes := make([]any, 0)
	var walkContainers func(parentContainerKey string, parentNodeID string)
	walkContainers = func(parentContainerKey string, parentNodeID string) {
		for _, container := range containersByParent[parentContainerKey] {
			containerKey := normalizeString(container["containerKey"])
			nodeID := generatedNodeID(scopeID, containerKey)
			containerNodeIDs[containerKey] = nodeID
			node := map[string]any{
				"containerKey": containerKey,
				"id":           nodeID,
				"order":        getInt64Value(container, "order", 0),
				"parentId":     anyOrNull(parentNodeID),
				"title":        normalizeString(container["title"]),
				"type":         normalizeString(container["type"]),
				"visibility":   "visible",
			}
			if normalizeString(container["type"]) == "subform" {
				node["schemaScopeId"] = normalizeString(container["schemaScopeId"])
				node["subformType"] = chooseString(normalizeString(container["subformType"]), "DEFAULT")
				node["tableKey"] = chooseString(normalizeString(container["tableKey"]), normalizeString(container["schemaScopeId"]))
			}
			nodes = append(nodes, node)
			walkContainers(containerKey, nodeID)
		}
	}
	walkContainers("", "")

	placementsByContainer := make(map[string][]map[string]any)
	for _, raw := range asSlice(blueprint["fieldPlacements"]) {
		placement := asMap(raw)
		placementsByContainer[normalizeString(placement["containerKey"])] = append(placementsByContainer[normalizeString(placement["containerKey"])], placement)
	}
	for containerKey := range placementsByContainer {
		sort.SliceStable(placementsByContainer[containerKey], func(i, j int) bool {
			return getInt64Value(placementsByContainer[containerKey][i], "order", int64(i)) < getInt64Value(placementsByContainer[containerKey][j], "order", int64(j))
		})
	}
	for containerKey, placements := range placementsByContainer {
		parentNodeID := containerNodeIDs[containerKey]
		scopeRootPlacement := containerKey == scopeRootPlacementKey
		for _, placement := range placements {
			fieldID := normalizeString(placement["fieldId"])
			if fieldID == "" || (!scopeRootPlacement && parentNodeID == "") {
				continue
			}
			nodes = append(nodes, map[string]any{
				"fieldId":    fieldID,
				"id":         generatedFieldNodeID(scopeID, fieldID),
				"order":      getInt64Value(placement, "order", 0),
				"parentId":   anyOrNull(parentNodeID),
				"type":       "field",
				"visibility": "visible",
			})
		}
	}

	return map[string]any{
		"nodes":            nodes,
		"schemaScopeId":    scopeID,
		"unplacedFieldIds": normalizeStringList(blueprint["unplacedFieldIds"]),
	}
}
