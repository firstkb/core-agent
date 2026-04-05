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
