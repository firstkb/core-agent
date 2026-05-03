package platformstudioformruntime

import "fmt"

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
