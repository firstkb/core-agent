package router

import (
	"net/http/httptest"
	"testing"
)

func TestExtractDomainPrefersHost(t *testing.T) {
	req := httptest.NewRequest("POST", "http://127.0.0.1/auth/refresh", nil)
	req.Host = "demo.platform.localhost"

	if got := ExtractDomain(req); got != "demo.platform.localhost" {
		t.Fatalf("expected host domain, got %q", got)
	}
}

func TestExtractDomainFallsBackToOrigin(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1/profile", nil)
	req.Host = ""
	req.Header.Set("Origin", "https://admin.platform.localhost")

	if got := ExtractDomain(req); got != "admin.platform.localhost" {
		t.Fatalf("expected origin domain, got %q", got)
	}
}
