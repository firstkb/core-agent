package platformstudioformruntime

import (
	"strconv"
	"strings"
)

func (s *Service) prepareMutationValues(scope runtimeRootScopePlan, incoming map[string]any) map[string]any {
	out := map[string]any{}
	if incoming == nil {
		return out
	}

	for _, field := range scope.Fields {
		if !field.Supported || (!field.MultiValue && field.ColumnName == "") {
			continue
		}
		raw, ok := incoming[field.FieldID]
		if !ok {
			continue
		}
		out[field.FieldID] = normalizeMutationValue(field, raw)
	}
	return out
}

func normalizeClientCreateToken(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if len(value) != 36 {
		return ""
	}
	for index, r := range value {
		switch index {
		case 8, 13, 18, 23:
			if r != '-' {
				return ""
			}
		default:
			if !(r >= '0' && r <= '9') && !(r >= 'a' && r <= 'f') {
				return ""
			}
		}
	}
	return value
}

func normalizeMutationValue(field runtimeFieldPlan, value any) any {
	if value == nil {
		return nil
	}

	if field.MultiValue {
		return normalizeRuntimeStringArray(value)
	}
	if field.Kind == "db_lookup" && field.Preset == "db_lookup_value" {
		if typed, ok := value.(string); ok {
			if strings.TrimSpace(typed) == "" {
				return nil
			}
			return strings.TrimSpace(typed)
		}
	}

	switch field.Kind {
	case "boolean":
		switch typed := value.(type) {
		case bool:
			return typed
		case string:
			parsed, err := strconv.ParseBool(strings.TrimSpace(typed))
			if err == nil {
				return parsed
			}
		}
	case "integer", "db_lookup":
		switch typed := value.(type) {
		case int:
			return int64(typed)
		case int64:
			return typed
		case float64:
			return int64(typed)
		case jsonNumber:
			if parsed, err := strconv.ParseInt(typed.String(), 10, 64); err == nil {
				return parsed
			}
		case string:
			if strings.TrimSpace(typed) == "" {
				return nil
			}
			if parsed, err := strconv.ParseInt(strings.TrimSpace(typed), 10, 64); err == nil {
				return parsed
			}
		}
	case "decimal", "currency":
		switch typed := value.(type) {
		case string:
			if strings.TrimSpace(typed) == "" {
				return nil
			}
			return strings.TrimSpace(typed)
		default:
			return typed
		}
	case "date", "date_time", "geo_point", "short_text", "long_text", "rich_text", "single_select":
		if typed, ok := value.(string); ok {
			if strings.TrimSpace(typed) == "" {
				return nil
			}
			if field.Kind == "geo_point" {
				if point, ok := parseRuntimeGeoPointValue(typed); ok {
					return formatRuntimeGeoPointValue(point)
				}
			}
			return strings.TrimSpace(typed)
		}
	case "multi_select", "tags":
		return normalizeRuntimeStringArray(value)
	}

	return value
}

func normalizeRuntimeStringArray(value any) []string {
	seen := map[string]struct{}{}
	out := []string{}
	appendValue := func(candidate string) {
		candidate = strings.TrimSpace(candidate)
		if candidate == "" {
			return
		}
		if _, ok := seen[candidate]; ok {
			return
		}
		seen[candidate] = struct{}{}
		out = append(out, candidate)
	}

	switch typed := value.(type) {
	case []string:
		for _, entry := range typed {
			appendValue(entry)
		}
	case []any:
		for _, entry := range typed {
			switch item := entry.(type) {
			case string:
				appendValue(item)
			case jsonNumber:
				appendValue(item.String())
			}
		}
	case string:
		appendValue(typed)
	case jsonNumber:
		appendValue(typed.String())
	}

	return out
}

func normalizeRuntimeInt64(value any) (int64, bool) {
	switch typed := value.(type) {
	case int:
		return int64(typed), true
	case int64:
		return typed, true
	case float64:
		return int64(typed), true
	case jsonNumber:
		parsed, err := strconv.ParseInt(typed.String(), 10, 64)
		return parsed, err == nil
	case string:
		if strings.TrimSpace(typed) == "" {
			return 0, false
		}
		parsed, err := strconv.ParseInt(strings.TrimSpace(typed), 10, 64)
		return parsed, err == nil
	default:
		return 0, false
	}
}

type jsonNumber interface {
	String() string
}

func isEmptyRuntimeValue(value any) bool {
	if value == nil {
		return true
	}
	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed) == ""
	case []string:
		return len(typed) == 0
	case []any:
		return len(typed) == 0
	default:
		return false
	}
}
