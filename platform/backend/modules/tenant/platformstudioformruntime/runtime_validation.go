package platformstudioformruntime

import (
	"fmt"
	"strings"
)

func validateRequiredValues(scope runtimeRootScopePlan, values map[string]any) []RuntimeViewRecordValidationError {
	out := []RuntimeViewRecordValidationError{}
	for _, field := range scope.Fields {
		if !field.Required || !field.Supported {
			continue
		}
		if isEmptyRuntimeValue(values[field.FieldID]) {
			out = append(out, RuntimeViewRecordValidationError{
				FieldID: field.FieldID,
				Message: fmt.Sprintf("Please fill field: %q", chooseString(field.Label, field.FieldID)),
			})
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

func uniqueValueValidationError(field runtimeFieldPlan) RuntimeViewRecordValidationError {
	return RuntimeViewRecordValidationError{
		FieldID: field.FieldID,
		Message: fmt.Sprintf("Please enter a unique value for %q", chooseString(field.Label, field.FieldID)),
	}
}
