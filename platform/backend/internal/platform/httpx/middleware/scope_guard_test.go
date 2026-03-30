package middleware

import "testing"

func TestHasAnyScope(t *testing.T) {
	if !hasAnyScope("tenant.api admin.api", []string{"admin.api"}) {
		t.Fatalf("expected admin scope match")
	}
	if hasAnyScope("tenant.api", []string{"admin.api"}) {
		t.Fatalf("did not expect admin scope match")
	}
}

func TestNormalizeScopes(t *testing.T) {
	got := normalizeScopes([]string{" tenant.api admin.api ", "admin.api"})
	if len(got) != 2 {
		t.Fatalf("expected 2 scopes, got %d", len(got))
	}
	if got[0] != "tenant.api" || got[1] != "admin.api" {
		t.Fatalf("unexpected scopes %#v", got)
	}
}
