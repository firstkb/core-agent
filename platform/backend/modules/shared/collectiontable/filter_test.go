package collectiontable

import (
	"testing"
	"time"
)

func TestMatchString(t *testing.T) {
	ok, err := MatchString("Module Registry", "contains", "registry")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected contains match")
	}

	ok, err = MatchString("", "is_empty", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected empty match")
	}
}

func TestMatchDate(t *testing.T) {
	field := time.Date(2026, 4, 2, 15, 30, 0, 0, time.UTC)

	ok, err := MatchDate(field, "is_equal_to", "2026-04-02")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected equal date match")
	}

	ok, err = MatchDate(field, "is_less_than", "2026-04-03")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected less-than date match")
	}
}

func TestMatchQuickFiltersGroupsRepeatedContainsByField(t *testing.T) {
	filters := []QuickFilter{
		{FieldID: "module_title", Operator: "contains", Value: "Emp"},
		{FieldID: "module_title", Operator: "contains", Value: "Tenant"},
		{FieldID: "status", Operator: "contains", Value: "Active"},
	}

	ok, err := MatchQuickFilters(filters, func(filter QuickFilter) (bool, error) {
		switch filter.FieldID {
		case "module_title":
			return filter.Value == "Tenant", nil
		case "status":
			return filter.Value == "Active", nil
		default:
			return false, nil
		}
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected repeated contains filters on the same field to match as an OR-group")
	}
}

func TestMatchQuickFiltersKeepsNonGroupedFiltersAsAnd(t *testing.T) {
	filters := []QuickFilter{
		{FieldID: "status", Operator: "is_equal_to", Value: "Active"},
		{FieldID: "status", Operator: "is_equal_to", Value: "Disabled"},
	}

	ok, err := MatchQuickFilters(filters, func(filter QuickFilter) (bool, error) {
		return filter.Value == "Active", nil
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatalf("expected non-grouped filters to preserve AND semantics")
	}
}
