package platformstudioformruntime

import "strings"

func withRuntimeMutationLookupLabels(
	scope runtimeRootScopePlan,
	lookupLabels map[string]map[string]string,
) runtimeRootScopePlan {
	if len(lookupLabels) == 0 {
		return scope
	}

	fields := make([]runtimeFieldPlan, len(scope.Fields))
	copy(fields, scope.Fields)
	changed := false
	for index, field := range fields {
		if !field.Supported || !field.MultiValue || field.Kind != "db_lookup" {
			continue
		}
		labels := normalizeRuntimeLookupLabelMap(lookupLabels[field.FieldID])
		if len(labels) == 0 {
			continue
		}
		nextLabels := make(map[string]string, len(field.OptionLabel)+len(labels))
		for key, value := range field.OptionLabel {
			nextLabels[key] = value
		}
		for key, value := range labels {
			nextLabels[key] = value
		}
		fields[index].OptionLabel = nextLabels
		changed = true
	}
	if !changed {
		return scope
	}
	scope.Fields = fields
	return scope
}

func normalizeRuntimeLookupLabelMap(values map[string]string) map[string]string {
	if len(values) == 0 {
		return nil
	}
	out := make(map[string]string, len(values))
	for key, value := range values {
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if key == "" || value == "" {
			continue
		}
		out[key] = value
	}
	return out
}
