package collectiontable

import "testing"

func TestValidateQuickFilters(t *testing.T) {
	t.Run("accepts valid filters", func(t *testing.T) {
		err := ValidateQuickFilters([]QuickFilter{
			{FieldID: "status", Operator: "is_equal_to", Value: "Active"},
			{FieldID: "updated_at", Operator: "is_not_empty"},
		})
		if err != nil {
			t.Fatalf("expected valid filters, got %v", err)
		}
	})

	t.Run("rejects missing field", func(t *testing.T) {
		err := ValidateQuickFilters([]QuickFilter{{Operator: "contains", Value: "abc"}})
		if err != ErrInvalidQuery {
			t.Fatalf("expected ErrInvalidQuery, got %v", err)
		}
	})

	t.Run("rejects missing value when required", func(t *testing.T) {
		err := ValidateQuickFilters([]QuickFilter{{FieldID: "status", Operator: "contains"}})
		if err != ErrInvalidQuery {
			t.Fatalf("expected ErrInvalidQuery, got %v", err)
		}
	})
}

func TestNormalizePageSize(t *testing.T) {
	allowed := []int{25, 50, 100}

	if got := NormalizePageSize(50, allowed, 25); got != 50 {
		t.Fatalf("expected 50, got %d", got)
	}
	if got := NormalizePageSize(10, allowed, 25); got != 25 {
		t.Fatalf("expected fallback 25, got %d", got)
	}
}

func TestTotalPageCount(t *testing.T) {
	if got := TotalPageCount(0, 25); got != 1 {
		t.Fatalf("expected 1 page for empty result, got %d", got)
	}
	if got := TotalPageCount(51, 25); got != 3 {
		t.Fatalf("expected 3 pages, got %d", got)
	}
}
