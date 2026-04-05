package collectiontable

import "testing"

func TestApplyExportLimit(t *testing.T) {
	rows := make([]int, 0, ExportProbeLimit())
	for idx := 0; idx < ExportProbeLimit(); idx++ {
		rows = append(rows, idx)
	}

	limited, truncated := ApplyExportLimit(rows)
	if !truncated {
		t.Fatalf("expected export rows to be truncated")
	}
	if len(limited) != ExportRowLimit {
		t.Fatalf("expected %d limited rows, got %d", ExportRowLimit, len(limited))
	}
}

func TestValidateExportRequest(t *testing.T) {
	fields := []FieldDefinition{
		{ID: "module_title", Sortable: true},
		{ID: "status", Sortable: true},
	}

	err := ValidateExportRequest(ExportRequest{
		Query: QueryRequest{
			QuickFilters: []QuickFilter{
				{FieldID: "status", Operator: "is_equal_to", Value: "Active"},
			},
			Sort: SortRequest{ColumnID: "module_title", Direction: "asc"},
		},
	}, fields)
	if err != nil {
		t.Fatalf("expected valid export request, got %v", err)
	}

	err = ValidateExportRequest(ExportRequest{
		Query: QueryRequest{
			QuickFilters: []QuickFilter{
				{FieldID: "", Operator: "contains", Value: "x"},
			},
		},
	}, fields)
	if err != ErrInvalidQuery {
		t.Fatalf("expected ErrInvalidQuery, got %v", err)
	}
}
