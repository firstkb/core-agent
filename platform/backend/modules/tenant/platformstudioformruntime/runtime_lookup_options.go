package platformstudioformruntime

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	dictionary "dtriton.com/platform/backend/modules/tenant/dictionary"
)

func (s *Service) attachCurrentLookupOptions(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	scope runtimeRootScopePlan,
	dataSchema map[string]any,
	values map[string]any,
	lookupLabels map[string]map[string]string,
) error {
	for _, field := range scope.Fields {
		if field.Kind != "db_lookup" {
			continue
		}
		selectedValues := selectedLookupValues(values[field.FieldID])
		if len(selectedValues) == 0 {
			continue
		}

		currentLabels := normalizeRuntimeLookupLabelMap(lookupLabels[field.FieldID])
		if field.Preset == "db_lookup_value" {
			for _, selectedValue := range selectedValues {
				addCurrentOptionToDataSchemaField(dataSchema, field.FieldID, selectedValue, selectedValue)
			}
			continue
		}

		missingValues := []string{}
		for _, selectedValue := range selectedValues {
			if label := strings.TrimSpace(currentLabels[selectedValue]); label != "" {
				addCurrentOptionToDataSchemaField(dataSchema, field.FieldID, selectedValue, label)
			} else {
				missingValues = append(missingValues, selectedValue)
			}
		}
		if len(missingValues) == 0 {
			continue
		}
		if field.LookupDisplayMode == "catalog_modal" {
			addFallbackCurrentLookupOptions(dataSchema, field.FieldID, missingValues)
			continue
		}

		resolvedLabels, err := s.resolveCurrentLookupLabels(ctx, tenant, field, missingValues)
		if err != nil {
			if errors.Is(err, dictionary.ErrInvalidDictionary) {
				addFallbackCurrentLookupOptions(dataSchema, field.FieldID, missingValues)
				continue
			}
			return err
		}
		for _, selectedValue := range missingValues {
			label := chooseString(strings.TrimSpace(resolvedLabels[selectedValue]), selectedValue)
			addCurrentOptionToDataSchemaField(dataSchema, field.FieldID, selectedValue, label)
		}
	}
	return nil
}

func addFallbackCurrentLookupOptions(dataSchema map[string]any, fieldID string, values []string) {
	for _, selectedValue := range values {
		addCurrentOptionToDataSchemaField(dataSchema, fieldID, selectedValue, selectedValue)
	}
}

func (s *Service) resolveCurrentLookupLabels(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	field runtimeFieldPlan,
	values []string,
) (map[string]string, error) {
	out := map[string]string{}
	values = normalizeRuntimeStringArray(values)
	if len(values) == 0 {
		return out, nil
	}

	if s.lookupOptions != nil {
		req, ok := lookupOptionsRequestForField(field, values)
		if ok {
			response, err := s.lookupOptions.ListOptions(ctx, req)
			if err != nil {
				return nil, err
			}
			for _, item := range response.Items {
				value := strings.TrimSpace(item.Value)
				label := strings.TrimSpace(item.Label)
				if value != "" && label != "" {
					out[value] = label
				}
			}
			return out, nil
		}
	}

	if field.Preset == "contact_lookup" {
		ids := []int64{}
		for _, value := range values {
			if id, ok := normalizeRuntimeInt64(value); ok && id != 0 {
				ids = append(ids, id)
			}
		}
		labels, err := s.repo.ResolveContactLookupLabels(ctx, tenant, ids)
		if err != nil {
			return nil, err
		}
		for id, label := range labels {
			out[strconv.FormatInt(id, 10)] = label
		}
	}
	return out, nil
}

func lookupOptionsRequestForField(field runtimeFieldPlan, values []string) (dictionary.OptionsRequest, bool) {
	if dictionaryKey := dictionaryKeyForLookupPreset(field.Preset); dictionaryKey != "" {
		return dictionary.OptionsRequest{
			Dictionary: dictionaryKey,
			IDs:        values,
			Page:       1,
			PageSize:   len(values),
		}, true
	}

	if field.LookupSourceModel != "" {
		return dictionary.OptionsRequest{
			DisplayFields:    append([]string(nil), field.LookupDisplayFields...),
			Filters:          dictionaryLookupFilters(field.LookupFilters),
			IDs:              values,
			Page:             1,
			PageSize:         len(values),
			SearchFields:     append([]string(nil), field.LookupSearchFields...),
			SortField:        field.LookupSortField,
			SourceModel:      field.LookupSourceModel,
			StoredValueField: field.LookupStoredValueField,
		}, true
	}

	if field.LookupDictionary != "" {
		return dictionary.OptionsRequest{
			Dictionary: field.LookupDictionary,
			IDs:        values,
			Page:       1,
			PageSize:   len(values),
		}, true
	}
	return dictionary.OptionsRequest{}, false
}

func dictionaryKeyForLookupPreset(preset string) string {
	switch strings.TrimSpace(preset) {
	case "contact_lookup":
		return "contacts"
	case "company_lookup":
		return "companies"
	case "project_lookup":
		return "projects"
	default:
		return ""
	}
}

func dictionaryLookupFilters(filters []runtimeLookupFilterPlan) []dictionary.LookupFilter {
	out := make([]dictionary.LookupFilter, 0, len(filters))
	for _, filter := range filters {
		if strings.TrimSpace(filter.Field) == "" {
			continue
		}
		out = append(out, dictionary.LookupFilter{
			Field:    filter.Field,
			Operator: filter.Operator,
			Value:    filter.Value,
		})
	}
	return out
}

func selectedLookupValues(value any) []string {
	switch typed := value.(type) {
	case int:
		return []string{strconv.Itoa(typed)}
	case int64:
		return []string{strconv.FormatInt(typed, 10)}
	case float64:
		return []string{strconv.FormatInt(int64(typed), 10)}
	case jsonNumber:
		return []string{typed.String()}
	}
	return normalizeRuntimeStringArray(value)
}

func addCurrentOptionToDataSchemaField(dataSchema map[string]any, fieldID string, value string, label string) {
	rootScope := asMap(dataSchema["rootScope"])
	fields := asSlice(rootScope["fields"])
	for _, rawField := range fields {
		field := asMap(rawField)
		currentFieldID := chooseString(normalizeString(field["fieldId"]), chooseString(normalizeString(field["id"]), normalizeString(field["key"])))
		if currentFieldID != fieldID {
			continue
		}
		options := asSlice(field["options"])
		for _, rawOption := range options {
			option := asMap(rawOption)
			if normalizeString(option["value"]) == value {
				if strings.TrimSpace(normalizeString(option["label"])) == "" {
					option["label"] = label
				}
				return
			}
		}
		field["options"] = append(options, map[string]any{
			"label": label,
			"value": value,
		})
		return
	}
}
