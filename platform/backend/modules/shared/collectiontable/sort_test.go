package collectiontable

import (
	"testing"
	"time"
)

func TestNormalizeSortDirection(t *testing.T) {
	if got := NormalizeSortDirection("desc"); got != SortDirectionDesc {
		t.Fatalf("expected desc, got %q", got)
	}
	if got := NormalizeSortDirection("weird"); got != SortDirectionAsc {
		t.Fatalf("expected fallback asc, got %q", got)
	}
}

func TestValidateSortField(t *testing.T) {
	fields := []FieldDefinition{
		{ID: "module_title", Sortable: true},
		{ID: "description", Sortable: false},
	}

	if err := ValidateSortField("", fields); err != nil {
		t.Fatalf("expected empty sort field to pass, got %v", err)
	}
	if err := ValidateSortField("module_title", fields); err != nil {
		t.Fatalf("expected sortable field to pass, got %v", err)
	}
	if err := ValidateSortField("description", fields); err != ErrInvalidQuery {
		t.Fatalf("expected ErrInvalidQuery for unsortable field, got %v", err)
	}
	if err := ValidateSortField("missing", fields); err != ErrInvalidQuery {
		t.Fatalf("expected ErrInvalidQuery for unknown field, got %v", err)
	}
}

func TestCompareHelpers(t *testing.T) {
	if !CompareStrings("b", "a", SortDirectionDesc) {
		t.Fatalf("expected desc string compare to pass")
	}
	if !CompareInts(2, 1, SortDirectionDesc) {
		t.Fatalf("expected desc int compare to pass")
	}

	left := time.Date(2026, 4, 2, 0, 0, 0, 0, time.UTC)
	right := time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC)
	if !CompareTimes(left, right, SortDirectionDesc) {
		t.Fatalf("expected desc time compare to pass")
	}
}
