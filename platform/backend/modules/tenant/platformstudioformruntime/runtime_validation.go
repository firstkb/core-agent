package platformstudioformruntime

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

type runtimeGeoPoint struct {
	Latitude  float64
	Longitude float64
}

var (
	legacyRuntimeGeoPointPattern  = regexp.MustCompile(`(?i)^\s*latitude:\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*longitude:\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*$`)
	compactRuntimeGeoPointPattern = regexp.MustCompile(`^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*$`)
)

func parseRuntimeGeoPointValue(value string) (runtimeGeoPoint, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return runtimeGeoPoint{}, false
	}

	match := legacyRuntimeGeoPointPattern.FindStringSubmatch(value)
	if match == nil {
		match = compactRuntimeGeoPointPattern.FindStringSubmatch(value)
	}
	if len(match) != 3 {
		return runtimeGeoPoint{}, false
	}

	latitude, err := strconv.ParseFloat(match[1], 64)
	if err != nil {
		return runtimeGeoPoint{}, false
	}
	longitude, err := strconv.ParseFloat(match[2], 64)
	if err != nil {
		return runtimeGeoPoint{}, false
	}
	if latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 {
		return runtimeGeoPoint{}, false
	}
	return runtimeGeoPoint{Latitude: latitude, Longitude: longitude}, true
}

func formatRuntimeGeoPointValue(point runtimeGeoPoint) string {
	return fmt.Sprintf("Latitude: %.6f, Longitude: %.6f", point.Latitude, point.Longitude)
}

func validateRequiredValues(scope runtimeRootScopePlan, values map[string]any) []RuntimeViewRecordValidationError {
	out := []RuntimeViewRecordValidationError{}
	for _, field := range scope.Fields {
		if !field.Required || !field.Supported {
			continue
		}
		if isEmptyRuntimeValue(values[field.FieldID]) {
			out = append(out, requiredFieldValidationError(field))
		}
	}
	return out
}

func runtimeMutationConstraintValidationErrors(scope runtimeRootScopePlan, err error) []RuntimeViewRecordValidationError {
	var constraintErr *runtimeMutationConstraintError
	if !errors.As(err, &constraintErr) {
		return nil
	}
	if constraintErr.code != postgresNotNullViolationCode {
		return nil
	}
	field, ok := runtimeFieldByColumnName(scope, constraintErr.columnName)
	if !ok {
		return nil
	}
	return []RuntimeViewRecordValidationError{requiredFieldValidationError(field)}
}

func runtimeMutationConstraintValidationResponse(
	scope runtimeRootScopePlan,
	values map[string]any,
	err error,
) (*RuntimeViewRecordMutationResponse, bool) {
	validationErrors := runtimeMutationConstraintValidationErrors(scope, err)
	if len(validationErrors) == 0 {
		return nil, false
	}
	return &RuntimeViewRecordMutationResponse{
		ValidationErrors: validationErrors,
		Values:           values,
	}, true
}

func runtimeFieldByColumnName(scope runtimeRootScopePlan, columnName string) (runtimeFieldPlan, bool) {
	columnName = strings.TrimSpace(columnName)
	if columnName == "" {
		return runtimeFieldPlan{}, false
	}
	for _, field := range scope.Fields {
		if !field.Supported || field.MultiValue || strings.TrimSpace(field.ColumnName) == "" {
			continue
		}
		if strings.EqualFold(field.ColumnName, columnName) {
			return field, true
		}
	}
	return runtimeFieldPlan{}, false
}

func validateFieldValues(scope runtimeRootScopePlan, values map[string]any) []RuntimeViewRecordValidationError {
	out := []RuntimeViewRecordValidationError{}
	for _, field := range scope.Fields {
		if !field.Supported || field.Kind != "geo_point" {
			continue
		}
		value, ok := values[field.FieldID]
		if !ok || isEmptyRuntimeValue(value) {
			continue
		}
		text, ok := value.(string)
		if !ok {
			out = append(out, invalidRuntimeGeoPointValidationError(field))
			continue
		}
		if _, ok := parseRuntimeGeoPointValue(text); !ok {
			out = append(out, invalidRuntimeGeoPointValidationError(field))
		}
	}
	return out
}

func runtimeUniqueValueCandidate(field runtimeFieldPlan, values map[string]any) (string, bool) {
	if !field.UniqueValue || !field.Supported || field.MultiValue || strings.TrimSpace(field.ColumnName) == "" {
		return "", false
	}
	value, ok := values[field.FieldID]
	if !ok || isEmptyRuntimeValue(value) {
		return "", false
	}
	text, ok := value.(string)
	if !ok {
		return "", false
	}
	text = strings.TrimSpace(text)
	if text == "" {
		return "", false
	}
	if field.Preset == "phone" || field.Validation == "phone" {
		var digits strings.Builder
		for _, r := range text {
			if r >= '0' && r <= '9' {
				digits.WriteRune(r)
			}
		}
		text = digits.String()
	}
	if text == "" {
		return "", false
	}
	return text, true
}

func requiredFieldValidationError(field runtimeFieldPlan) RuntimeViewRecordValidationError {
	return RuntimeViewRecordValidationError{
		FieldID: field.FieldID,
		Message: fmt.Sprintf("Please fill field: %q", chooseString(field.Label, field.FieldID)),
	}
}

func uniqueValueValidationError(field runtimeFieldPlan) RuntimeViewRecordValidationError {
	return RuntimeViewRecordValidationError{
		FieldID: field.FieldID,
		Message: fmt.Sprintf("Please enter a unique value for %q", chooseString(field.Label, field.FieldID)),
	}
}

func invalidRuntimeGeoPointValidationError(field runtimeFieldPlan) RuntimeViewRecordValidationError {
	return RuntimeViewRecordValidationError{
		FieldID: field.FieldID,
		Message: fmt.Sprintf("Please enter a valid geographic point for %q", chooseString(field.Label, field.FieldID)),
	}
}
