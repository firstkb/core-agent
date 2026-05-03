package platformstudioformruntime

import (
	"context"
	"strconv"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (s *Service) attachCurrentLookupOptions(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	scope runtimeRootScopePlan,
	dataSchema map[string]any,
	values map[string]any,
) error {
	fieldIDByLookupID := map[int64][]string{}
	lookupIDs := []int64{}
	for _, field := range scope.Fields {
		if field.Kind != "db_lookup" || field.Preset != "contact_lookup" {
			continue
		}
		lookupID, ok := normalizeRuntimeInt64(values[field.FieldID])
		if !ok || lookupID == 0 {
			continue
		}
		if len(fieldIDByLookupID[lookupID]) == 0 {
			lookupIDs = append(lookupIDs, lookupID)
		}
		fieldIDByLookupID[lookupID] = append(fieldIDByLookupID[lookupID], field.FieldID)
	}
	if len(lookupIDs) == 0 {
		return nil
	}

	labels, err := s.repo.ResolveContactLookupLabels(ctx, tenant, lookupIDs)
	if err != nil {
		return err
	}
	for lookupID, fieldIDs := range fieldIDByLookupID {
		value := strconv.FormatInt(lookupID, 10)
		label := chooseString(strings.TrimSpace(labels[lookupID]), value)
		for _, fieldID := range fieldIDs {
			addCurrentOptionToDataSchemaField(dataSchema, fieldID, value, label)
		}
	}
	return nil
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
