package collectiontable

import "testing"

func TestBuildSuggestionGroup(t *testing.T) {
	rows := []struct {
		Values []string
	}{
		{Values: []string{"Tenant", "Users"}},
		{Values: []string{"Tenant"}},
	}

	group := BuildSuggestionGroup("module_title", "Module", rows, func(row struct{ Values []string }) []string {
		return row.Values
	})

	if group.FieldID != "module_title" {
		t.Fatalf("unexpected field id %q", group.FieldID)
	}
	if len(group.Items) != 2 {
		t.Fatalf("expected 2 suggestion items, got %d", len(group.Items))
	}
	if group.Items[0].Value != "Tenant" || group.Items[0].Count != 2 {
		t.Fatalf("expected Tenant to be first with count 2, got %+v", group.Items[0])
	}
}

func TestBuildSuggestionGroupLimitsToTopTenByCount(t *testing.T) {
	rows := make([]struct {
		Values []string
	}, 0)

	for idx := 0; idx < 12; idx++ {
		value := string(rune('A' + idx))
		for repeat := 0; repeat < 12-idx; repeat++ {
			rows = append(rows, struct{ Values []string }{
				Values: []string{value},
			})
		}
	}

	group := BuildSuggestionGroup("module_title", "Module", rows, func(row struct{ Values []string }) []string {
		return row.Values
	})

	if len(group.Items) != SuggestionGroupLimit {
		t.Fatalf("expected %d suggestion items, got %d", SuggestionGroupLimit, len(group.Items))
	}
	if group.Items[0].Value != "A" || group.Items[0].Count != 12 {
		t.Fatalf("expected highest-count item first, got %+v", group.Items[0])
	}
	if group.Items[len(group.Items)-1].Value != "J" || group.Items[len(group.Items)-1].Count != 3 {
		t.Fatalf("expected tenth item to be J with count 3, got %+v", group.Items[len(group.Items)-1])
	}
}
