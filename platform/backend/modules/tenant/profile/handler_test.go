package profilesvc

import (
	"context"
	"net/http"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func TestHandlerGetProfileSuccess(t *testing.T) {
	handler := NewHandler(NewService(nil))
	req, err := http.NewRequest(http.MethodGet, "/profile", nil)
	if err != nil {
		t.Fatalf("NewRequest returned error: %v", err)
	}

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		TenantID: "101",
		UserID:   "user-1",
		Email:    "user@example.com",
		Level:    50,
		Role:     "manager",
	})
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{
		ID:     "101",
		Name:   "Demo Tenant",
		Host:   "demo.dtriton.local",
		Plan:   "sandbox",
		Status: "active",
	})

	profile, err := handler.GetProfile(ctx, req, struct{}{})
	if err != nil {
		t.Fatalf("GetProfile returned error: %v", err)
	}

	if profile.Tenant.Host != "demo.dtriton.local" {
		t.Fatalf("tenant host = %q, want %q", profile.Tenant.Host, "demo.dtriton.local")
	}
	if profile.Tenant.Name != "Demo Tenant" {
		t.Fatalf("tenant name = %q, want %q", profile.Tenant.Name, "Demo Tenant")
	}
}

func TestHandlerGetProfileUnauthorized(t *testing.T) {
	handler := NewHandler(NewService(nil))
	req, err := http.NewRequest(http.MethodGet, "/profile", nil)
	if err != nil {
		t.Fatalf("NewRequest returned error: %v", err)
	}

	ctx := requestctx.WithTenant(context.Background(), requestctx.TenantInfo{
		ID:     "101",
		Name:   "Demo Tenant",
		Host:   "demo.dtriton.local",
		Plan:   "sandbox",
		Status: "active",
	})

	_, gotErr := handler.GetProfile(ctx, req, struct{}{})
	appErr := apperr.ToHTTP(gotErr)
	if appErr.Code != "PROFILE_UNAUTHORIZED" {
		t.Fatalf("error code = %q, want %q", appErr.Code, "PROFILE_UNAUTHORIZED")
	}
	if appErr.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", appErr.StatusCode, http.StatusUnauthorized)
	}
}
