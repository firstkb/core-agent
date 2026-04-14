package platformstudioformbuilder

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

const (
	rootSchemaScopeID     = "root"
	scopeRootPlacementKey = "__scope_root__"
)

var acceptedBlueprintContainerTypes = map[string]struct{}{
	"accordion":      {},
	"accordion_item": {},
	"column":         {},
	"grid":           {},
	"group":          {},
	"section":        {},
	"subform":        {},
	"tab_item":       {},
	"tabs":           {},
}

type subformScopeMeta struct {
	DisplayName string
	ID          string
	SubformType string
	TableKey    string
}

type legacyViewScope struct {
	FilterDefinitions   any
	Nodes               []map[string]any
	ParentSubformNodeID string
	SchemaScopeID       string
	SubformType         string
	TableKey            string
	ViewSettings        any
}

type legacyViewDocument struct {
	FilterDefinitions any
	Nodes             []map[string]any
	SelectedNodeID    string
	SystemFields      any
	SubformScopes     []legacyViewScope
	ViewDescription   string
	ViewKind          string
	ViewSettings      any
	ViewTitle         string
}

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
	out["canEditViewsOnly"] = out["isStructureLocked"].(bool)

	dataSchema, err := normalizeDataSchemaPayload(source, existing, defaultView)
	if err != nil {
		return nil, err
	}
	layoutBlueprint, err := normalizeLayoutBlueprintPayload(source, dataSchema, defaultView)
	if err != nil {
		return nil, err
	}

	delete(out, "fields")
	delete(out, "guid")
	delete(out, "modelStructureVersion")
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
	out["isActive"] = getBoolValue(out, "isActive", existing.IsActive)
	out["isDefault"] = getBoolValue(out, "isDefault", existing.IsDefault)
	out["isViewLocked"] = getBoolFallback(out, "isViewLocked", "viewLocked", existing.IsViewLocked)
	out["viewLocked"] = out["isViewLocked"]
	out["lastAlignedModelStructureVersion"] = model.StructureVersion

	uiSchema, err := normalizeUISchemaPayload(source, dataSchema, layoutBlueprint)
	if err != nil {
		return nil, err
	}

	delete(out, "currentParentId")
	delete(out, "guid")
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
		return normalizeExplicitDataSchema(explicit, modelID, modelTitle), nil
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

	return map[string]any{
		"modelId":    modelID,
		"modelTitle": modelTitle,
		"rootScope": map[string]any{
			"fields":        rootFields,
			"schemaScopeId": rootSchemaScopeID,
			"scopeType":     "ROOT",
		},
		"subformScopes": subformScopes,
	}, nil
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

func deriveUISchemaFromLegacyPayload(payload map[string]any, dataSchema map[string]any, layoutBlueprint map[string]any) map[string]any {
	legacy := parseLegacyViewDocument(payload)
	rootScope := map[string]any{
		"filterDefinitions": normalizeAnyMap(legacy.FilterDefinitions),
		"nodes":             normalizeScopeNodes(rootSchemaScopeID, legacy.Nodes, layoutBlueprint),
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
		scope["schemaScopeId"] = scopeID
		scope["subformType"] = chooseString(subformMeta[scopeID].SubformType, "DEFAULT")
		scope["tableKey"] = chooseString(subformMeta[scopeID].TableKey, scopeID)
		scope["viewSettings"] = map[string]any{}
		subformScopes = append(subformScopes, scope)
	}

	return map[string]any{
		"rootScope": map[string]any{
			"filterDefinitions": map[string]any{},
			"nodes":             rootNodes,
			"schemaScopeId":     rootSchemaScopeID,
			"systemFields":      map[string]any{},
			"unplacedFieldIds":  normalizeStringList(rootScope["unplacedFieldIds"]),
			"viewSettings":      map[string]any{},
		},
		"subformScopes": subformScopes,
	}
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

func injectCompatibilityFields(payload map[string]any) map[string]any {
	out := cloneJSONToMap(mustCanonicalJSON(payload))
	dataSchema := asMap(out["dataSchema"])
	out["fields"] = flattenDataSchemaFields(dataSchema)
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

func normalizeLegacyFlatFields(entries []any) []map[string]any {
	out := make([]map[string]any, 0)
	for _, raw := range entries {
		field := asMap(raw)
		normalized := normalizeDataSchemaFields([]any{field}, chooseString(
			normalizeString(field["schemaScopeId"]),
			chooseString(normalizeString(field["schemaScopeKey"]), rootSchemaScopeID),
		))
		if len(normalized) == 0 {
			continue
		}
		out = append(out, asMap(normalized[0]))
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
		normalized["displayName"] = chooseString(normalizeString(normalized["displayName"]), chooseString(normalizeString(normalized["label"]), fieldID))
		normalized["id"] = fieldID
		normalized["isLocked"] = getBoolValue(normalized, "isLocked", false)
		normalized["isPersisted"] = getBoolValue(normalized, "isPersisted", true)
		normalized["key"] = chooseString(normalizeString(normalized["key"]), fieldID)
		normalized["label"] = chooseString(normalizeString(normalized["label"]), normalized["displayName"].(string))
		normalized["schemaScopeId"] = scopeID
		normalized["status"] = normalizeString(normalized["status"])
		normalized["storageKey"] = uniqueFieldStorageKey(
			chooseString(
				normalizeString(normalized["storageKey"]),
				chooseString(
					normalizeString(normalized["label"]),
					chooseString(
						normalized["displayName"].(string),
						fieldID,
					),
				),
			),
			seenStorageKeys,
		)
		delete(normalized, "schemaScopeKey")
		out = append(out, normalized)
	}
	return out
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

func flattenDataSchemaFields(dataSchema map[string]any) []any {
	out := make([]any, 0)
	for _, raw := range asSlice(asMap(dataSchema["rootScope"])["fields"]) {
		out = append(out, raw)
	}
	for _, rawScope := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(rawScope)
		for _, rawField := range asSlice(scope["fields"]) {
			out = append(out, rawField)
		}
	}
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

func asMap(value any) map[string]any {
	if typed, ok := value.(map[string]any); ok {
		return typed
	}
	if typed, ok := value.(map[string]interface{}); ok {
		out := make(map[string]any, len(typed))
		for key, entry := range typed {
			out[key] = entry
		}
		return out
	}
	if raw, ok := value.(json.RawMessage); ok && len(raw) > 0 {
		var out map[string]any
		if err := json.Unmarshal(raw, &out); err == nil {
			return out
		}
	}
	return map[string]any{}
}

func asSlice(value any) []any {
	switch typed := value.(type) {
	case []any:
		return typed
	case []map[string]any:
		out := make([]any, 0, len(typed))
		for _, entry := range typed {
			out = append(out, entry)
		}
		return out
	case json.RawMessage:
		if len(typed) == 0 {
			return []any{}
		}
		var out []any
		if err := json.Unmarshal(typed, &out); err == nil {
			return out
		}
	}
	return []any{}
}

func normalizeAnyMap(value any) map[string]any {
	return asMap(value)
}

func normalizeNodeList(value any) []map[string]any {
	out := make([]map[string]any, 0)
	for _, raw := range asSlice(value) {
		entry := asMap(raw)
		if len(entry) == 0 {
			continue
		}
		out = append(out, cloneJSONToMap(mustCanonicalJSON(entry)))
	}
	return out
}

func normalizeStringList(value any) []string {
	items := make([]string, 0)
	seen := make(map[string]struct{})
	for _, raw := range asSlice(value) {
		item := normalizeString(raw)
		if item == "" {
			continue
		}
		if _, ok := seen[item]; ok {
			continue
		}
		seen[item] = struct{}{}
		items = append(items, item)
	}
	return items
}

func sortedScopeIDs(scopeMeta map[string]subformScopeMeta) []string {
	ids := make([]string, 0, len(scopeMeta))
	for scopeID := range scopeMeta {
		ids = append(ids, scopeID)
	}
	sort.Strings(ids)
	return ids
}

func sortedFieldIDs(fieldIDs map[string]struct{}) []string {
	out := make([]string, 0, len(fieldIDs))
	for fieldID := range fieldIDs {
		out = append(out, fieldID)
	}
	sort.Strings(out)
	return out
}

func humanizeIdentifier(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "Subform"
	}
	value = strings.TrimPrefix(value, "pb_")
	value = strings.ReplaceAll(value, "-", " ")
	value = strings.ReplaceAll(value, "_", " ")
	parts := strings.Fields(value)
	for index, part := range parts {
		if part == "" {
			continue
		}
		parts[index] = strings.ToUpper(part[:1]) + part[1:]
	}
	if len(parts) == 0 {
		return "Subform"
	}
	return strings.Join(parts, " ")
}

func deriveGeneratedContainerKey(scopeID string, containerType string, parentContainerKey string, raw map[string]any, usedKeys map[string]int) string {
	base := normalizeStableKey(normalizeString(raw["containerKey"]))
	if base == "" {
		base = normalizeStableKey(normalizeString(raw["title"]))
	}
	if base == "" && containerType == "subform" {
		base = chooseString(
			normalizeStableKey(normalizeString(raw["schemaScopeId"])),
			normalizeStableKey(normalizeString(raw["tableKey"])),
		)
	}
	if base == "" {
		base = normalizeStableKey(normalizeString(raw["id"]))
	}
	if base == "" {
		base = containerType
	}
	segment := fmt.Sprintf("%s.%s", containerType, base)
	keyBase := scopeID + "." + segment
	if parentContainerKey != "" {
		keyBase = parentContainerKey + "." + segment
	}
	usedKeys[keyBase]++
	if usedKeys[keyBase] == 1 {
		return keyBase
	}
	return fmt.Sprintf("%s-%d", keyBase, usedKeys[keyBase])
}

func generatedNodeID(scopeID string, seed string) string {
	seed = strings.TrimSpace(seed)
	if seed == "" {
		seed = "node"
	}
	return normalizeStableKey(fmt.Sprintf("%s-%s", scopeID, seed))
}

func generatedFieldNodeID(scopeID string, fieldID string) string {
	return normalizeStableKey(fmt.Sprintf("%s-field-%s", scopeID, fieldID))
}

func anyOrNull(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return strings.TrimSpace(value)
}

func chooseAny(primary any, fallback any) any {
	if primary == nil {
		return fallback
	}
	switch typed := primary.(type) {
	case string:
		if strings.TrimSpace(typed) == "" {
			return fallback
		}
	}
	return primary
}

func containsString(items []string, target string) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}

func cloneJSONArray(items []any) []any {
	out := make([]any, 0, len(items))
	for _, item := range items {
		out = append(out, cloneJSONToMap(mustCanonicalJSON(asMap(item))))
	}
	return out
}
