package internal

import "testing"

func TestParseTenantDatabaseRefs(t *testing.T) {
	got := parseTenantDatabaseRefs("108-sandbox, 108-demo@LOCAL,108-demo@LOCAL, analytics@S2")

	if len(got) != 3 {
		t.Fatalf("expected 3 refs, got %d", len(got))
	}

	if got[0].Name != "108-sandbox" || got[0].InstanceCode != "" {
		t.Fatalf("unexpected first ref: %#v", got[0])
	}
	if got[1].Name != "108-demo" || got[1].InstanceCode != "LOCAL" {
		t.Fatalf("unexpected second ref: %#v", got[1])
	}
	if got[2].Name != "analytics" || got[2].InstanceCode != "S2" {
		t.Fatalf("unexpected third ref: %#v", got[2])
	}
}

func TestFirstNonEmpty(t *testing.T) {
	got := firstNonEmpty("", "  ", "value", "other")
	if got != "value" {
		t.Fatalf("unexpected first non-empty value %q", got)
	}
}
