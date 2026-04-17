package platformstudioformbuilder

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

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
