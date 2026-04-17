package platformstudioformbuilder

import (
	"fmt"
	"sort"
	"strings"
)

func validateAuthoringSchemas(dataSchema map[string]any, layoutBlueprint map[string]any, uiSchema map[string]any) error {
	scopeMeta := dataSchemaScopeMeta(dataSchema)
	scopeFieldIDs := dataSchemaFieldIDs(dataSchema)

	for scopeID, fieldIDs := range scopeFieldIDs {
		for fieldID := range fieldIDs {
			if fieldID == "" {
				return ErrInvalidDraft
			}
		}
		if scopeID != rootSchemaScopeID {
			if _, ok := scopeMeta[scopeID]; !ok {
				return ErrInvalidDraft
			}
		}
	}

	blueprintByScope := blueprintScopesByID(layoutBlueprint)
	for scopeID, scope := range blueprintByScope {
		containerTypes := make(map[string]string)
		for _, rawContainer := range asSlice(scope["containers"]) {
			container := asMap(rawContainer)
			containerKey := normalizeString(container["containerKey"])
			containerType := normalizeString(container["type"])
			if containerKey == "" || containerKey == scopeRootPlacementKey || containerType == "" {
				return ErrInvalidDraft
			}
			if _, ok := acceptedBlueprintContainerTypes[containerType]; !ok {
				return ErrInvalidDraft
			}
			if _, exists := containerTypes[containerKey]; exists {
				return ErrInvalidDraft
			}
			containerTypes[containerKey] = containerType
		}
		for _, rawContainer := range asSlice(scope["containers"]) {
			container := asMap(rawContainer)
			containerType := normalizeString(container["type"])
			parentKey := normalizeString(container["parentContainerKey"])
			if parentKey == "" {
				if containerType == "subform" && scopeID != rootSchemaScopeID {
					return ErrInvalidDraft
				}
				continue
			}
			parentType := containerTypes[parentKey]
			if parentType == "" {
				return ErrInvalidDraft
			}
			if containerType == "tab_item" && parentType != "tabs" {
				return ErrInvalidDraft
			}
			if containerType == "accordion_item" && parentType != "accordion" {
				return ErrInvalidDraft
			}
		}
		for _, rawPlacement := range asSlice(scope["fieldPlacements"]) {
			placement := asMap(rawPlacement)
			fieldID := normalizeString(placement["fieldId"])
			containerKey := normalizeString(placement["containerKey"])
			if fieldID == "" {
				return ErrInvalidDraft
			}
			if _, ok := scopeFieldIDs[scopeID][fieldID]; !ok {
				return ErrInvalidDraft
			}
			if containerKey == scopeRootPlacementKey {
				continue
			}
			if containerKey == "" {
				return ErrInvalidDraft
			}
			if _, ok := containerTypes[containerKey]; !ok {
				return ErrInvalidDraft
			}
		}
		for _, rawContainer := range asSlice(scope["containers"]) {
			container := asMap(rawContainer)
			if normalizeString(container["type"]) != "subform" {
				continue
			}
			scopeRef := chooseString(normalizeString(container["schemaScopeId"]), normalizeString(container["tableKey"]))
			if scopeRef == "" || scopeRef == rootSchemaScopeID {
				return ErrInvalidDraft
			}
			if _, ok := scopeMeta[scopeRef]; !ok {
				return ErrInvalidDraft
			}
			if scopeID != rootSchemaScopeID {
				return ErrInvalidDraft
			}
		}
	}

	if uiSchema == nil {
		return nil
	}

	for scopeID, scope := range uiScopesByID(uiSchema) {
		if scopeID != rootSchemaScopeID {
			if _, ok := scopeMeta[scopeID]; !ok {
				return ErrInvalidDraft
			}
		}
		blueprintContainers := blueprintContainerTypesForScope(layoutBlueprint, scopeID)
		for _, rawNode := range asSlice(scope["nodes"]) {
			node := asMap(rawNode)
			nodeType := normalizeString(node["type"])
			if nodeType == "field" {
				fieldID := normalizeString(node["fieldId"])
				if fieldID == "" {
					return ErrInvalidDraft
				}
				if _, ok := scopeFieldIDs[scopeID][fieldID]; !ok {
					return ErrInvalidDraft
				}
				continue
			}
			containerKey := normalizeString(node["containerKey"])
			if containerKey == "" {
				continue
			}
			if _, ok := blueprintContainers[containerKey]; !ok {
				return ErrInvalidDraft
			}
			if nodeType == "subform" {
				scopeRef := chooseString(normalizeString(node["schemaScopeId"]), normalizeString(node["tableKey"]))
				if _, ok := scopeMeta[scopeRef]; !ok {
					return ErrInvalidDraft
				}
			}
		}
	}

	return nil
}

func ensureBlueprintCoverage(layoutBlueprint map[string]any, dataSchema map[string]any) {
	scopeMeta := dataSchemaScopeMeta(dataSchema)
	rootScope := asMap(layoutBlueprint["rootScope"])
	if rootScope == nil {
		rootScope = map[string]any{}
	}
	rootScope["schemaScopeId"] = rootSchemaScopeID

	existingAnchors := make(map[string]struct{})
	rootContainers := make([]any, 0)
	for _, raw := range asSlice(rootScope["containers"]) {
		container := asMap(raw)
		if normalizeString(container["type"]) == "subform" {
			scopeRef := chooseString(normalizeString(container["schemaScopeId"]), normalizeString(container["tableKey"]))
			if scopeRef != "" {
				existingAnchors[scopeRef] = struct{}{}
			}
		}
		rootContainers = append(rootContainers, container)
	}
	orderBase := len(rootContainers)
	for _, scopeID := range sortedScopeIDs(scopeMeta) {
		if _, ok := existingAnchors[scopeID]; ok {
			continue
		}
		meta := scopeMeta[scopeID]
		rootContainers = append(rootContainers, map[string]any{
			"containerKey":       fmt.Sprintf("%s.subform.%s", rootSchemaScopeID, scopeID),
			"displayName":        chooseString(meta.DisplayName, humanizeIdentifier(scopeID)),
			"order":              int64(orderBase),
			"parentContainerKey": "",
			"schemaScopeId":      scopeID,
			"settings":           map[string]any{"schemaScopeId": scopeID},
			"subformType":        chooseString(meta.SubformType, "DEFAULT"),
			"tableKey":           chooseString(meta.TableKey, scopeID),
			"title":              chooseString(meta.DisplayName, humanizeIdentifier(scopeID)),
			"type":               "subform",
		})
		orderBase++
	}
	rootScope["containers"] = rootContainers
	rootScope["fieldPlacements"] = asSlice(rootScope["fieldPlacements"])
	rootScope["unplacedFieldIds"] = mergeMissingFieldIDs(rootScope["unplacedFieldIds"], rootScope["fieldPlacements"], scopeFieldIDSet(dataSchema, rootSchemaScopeID))
	layoutBlueprint["rootScope"] = rootScope

	subScopes := make([]any, 0)
	existingScopes := blueprintScopesByID(layoutBlueprint)
	for _, scopeID := range sortedScopeIDs(scopeMeta) {
		scope := existingScopes[scopeID]
		if scope == nil {
			scope = map[string]any{}
		}
		scope["schemaScopeId"] = scopeID
		scope["containers"] = asSlice(scope["containers"])
		scope["fieldPlacements"] = asSlice(scope["fieldPlacements"])
		scope["unplacedFieldIds"] = mergeMissingFieldIDs(scope["unplacedFieldIds"], scope["fieldPlacements"], scopeFieldIDSet(dataSchema, scopeID))
		subScopes = append(subScopes, scope)
	}
	layoutBlueprint["subformScopes"] = subScopes
}

func normalizeScopeNodes(scopeID string, rawNodes any, layoutBlueprint map[string]any) []any {
	nodes := normalizeNodeList(rawNodes)
	blueprintScopeValue := blueprintScope(layoutBlueprint, scopeID)
	blueprintContainers := make(map[string]map[string]any)
	for _, rawContainer := range asSlice(blueprintScopeValue["containers"]) {
		container := asMap(rawContainer)
		containerKey := normalizeString(container["containerKey"])
		if containerKey == "" {
			continue
		}
		blueprintContainers[containerKey] = container
	}

	nodeContainerKeys := make(map[string]string)
	usedKeys := make(map[string]int)
	out := make([]any, 0, len(nodes))
	for index, node := range nodes {
		normalized := cloneJSONToMap(mustCanonicalJSON(node))
		nodeType := normalizeString(normalized["type"])
		normalized["id"] = chooseString(normalizeString(normalized["id"]), generatedNodeID(scopeID, fmt.Sprintf("node-%d", index)))
		normalized["order"] = getInt64Value(normalized, "order", int64(index))
		normalized["parentId"] = anyOrNull(normalizeString(normalized["parentId"]))
		normalized["visibility"] = chooseString(normalizeString(normalized["visibility"]), "visible")
		if _, ok := acceptedBlueprintContainerTypes[nodeType]; ok {
			parentContainerKey := ""
			parentID := normalizeString(normalized["parentId"])
			if parentID != "" {
				parentContainerKey = nodeContainerKeys[parentID]
			}
			containerKey := normalizeString(normalized["containerKey"])
			if containerKey == "" {
				containerKey = deriveGeneratedContainerKey(scopeID, nodeType, parentContainerKey, normalized, usedKeys)
			}
			if container, ok := blueprintContainers[containerKey]; ok {
				normalized["containerKey"] = containerKey
				if nodeType == "subform" {
					normalized["schemaScopeId"] = chooseString(normalizeString(normalized["schemaScopeId"]), normalizeString(container["schemaScopeId"]))
					normalized["subformType"] = chooseString(normalizeString(normalized["subformType"]), chooseString(normalizeString(container["subformType"]), "DEFAULT"))
					normalized["tableKey"] = chooseString(normalizeString(normalized["tableKey"]), chooseString(normalizeString(container["tableKey"]), normalizeString(container["schemaScopeId"])))
				}
				nodeContainerKeys[normalizeString(normalized["id"])] = containerKey
			} else {
				delete(normalized, "containerKey")
			}
		}
		out = append(out, normalized)
	}
	return out
}

func blueprintContainerTypesForScope(layoutBlueprint map[string]any, scopeID string) map[string]string {
	out := make(map[string]string)
	for _, raw := range asSlice(blueprintScope(layoutBlueprint, scopeID)["containers"]) {
		container := asMap(raw)
		containerKey := normalizeString(container["containerKey"])
		containerType := normalizeString(container["type"])
		if containerKey == "" || containerType == "" {
			continue
		}
		out[containerKey] = containerType
	}
	return out
}

func rootSubformAnchorNodeIDs(rawNodes any) map[string]string {
	nodes := normalizeNodeList(rawNodes)
	out := make(map[string]string)
	for _, node := range nodes {
		if normalizeString(node["type"]) != "subform" {
			continue
		}
		scopeID := chooseString(normalizeString(node["schemaScopeId"]), normalizeString(node["tableKey"]))
		if scopeID == "" {
			containerKey := normalizeString(node["containerKey"])
			if strings.HasPrefix(containerKey, rootSchemaScopeID+".subform.") {
				scopeID = strings.TrimPrefix(containerKey, rootSchemaScopeID+".subform.")
			}
		}
		if scopeID == "" {
			continue
		}
		out[scopeID] = normalizeString(node["id"])
	}
	return out
}

func mergeMissingFieldIDs(rawUnplaced any, rawPlacements any, known map[string]struct{}) []string {
	unplaced := normalizeStringList(rawUnplaced)
	placed := make(map[string]struct{})
	for _, rawPlacement := range asSlice(rawPlacements) {
		fieldID := normalizeString(asMap(rawPlacement)["fieldId"])
		if fieldID == "" {
			continue
		}
		placed[fieldID] = struct{}{}
	}
	for fieldID := range known {
		if _, ok := placed[fieldID]; ok {
			continue
		}
		if containsString(unplaced, fieldID) {
			continue
		}
		unplaced = append(unplaced, fieldID)
	}
	sort.Strings(unplaced)
	return unplaced
}
