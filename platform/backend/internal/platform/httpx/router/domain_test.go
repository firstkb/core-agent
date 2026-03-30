package router

import (
	"net/http/httptest"
	"testing"
)

func TestExtractDomainPrefersHost(t *testing.T) {
	req := httptest.NewRequest("POST", "http://127.0.0.1/auth/refresh", nil)
	req.Host = "demo.platform.local"

	if got := ExtractDomain(req); got != "demo.platform.local" {
		t.Fatalf("expected host domain, got %q", got)
	}
}

func TestExtractDomainFallsBackToOrigin(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1/profile", nil)
	req.Host = ""
	req.Header.Set("Origin", "https://admin.platform.local")

	if got := ExtractDomain(req); got != "admin.platform.local" {
		t.Fatalf("expected origin domain, got %q", got)
	}
}
