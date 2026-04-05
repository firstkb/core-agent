package collectiontable

const ExportRowLimit = 5000

func ExportProbeLimit() int {
	return ExportRowLimit + 1
}

func ApplyExportLimit[T any](rows []T) ([]T, bool) {
	if len(rows) > ExportRowLimit {
		return rows[:ExportRowLimit], true
	}
	return rows, false
}

func ValidateExportRequest(req ExportRequest, fields []FieldDefinition) error {
	return ValidateQueryRequest(req.Query, fields)
}
