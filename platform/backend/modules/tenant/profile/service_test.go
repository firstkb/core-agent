package profilesvc

import (
	"context"
	"errors"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func TestGetProfileSuccess(t *testing.T) {
	service := NewService()

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		TenantID: "101",
		UserID:   "user-1",
		Email:    "user@example.com",
		Level:    50,
		Role:     "manager",
	})
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{
		ID:     "101",
		Host:   "demo.dtriton.local",
		Plan:   "sandbox",
		Status: "active",
	})

	profile, err := service.GetProfile(ctx)
	if err != nil {
		t.Fatalf("GetProfile returned error: %v", err)
	}

	if profile.User.ID != "user-1" {
		t.Fatalf("user id = %q, want %q", profile.User.ID, "user-1")
	}
	if profile.User.Email != "user@example.com" {
		t.Fatalf("user email = %q, want %q", profile.User.Email, "user@example.com")
	}
	if profile.Tenant.ID != "101" {
		t.Fatalf("tenant id = %q, want %q", profile.Tenant.ID, "101")
	}
}

func TestGetProfileMissingClaims(t *testing.T) {
	service := NewService()

	ctx := requestctx.WithTenant(context.Background(), requestctx.TenantInfo{
		ID:     "101",
		Host:   "demo.dtriton.local",
		Plan:   "sandbox",
		Status: "active",
	})

	_, err := service.GetProfile(ctx)
	if !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("GetProfile error = %v, want %v", err, ErrUnauthorized)
	}
}

func TestGetProfileMissingTenant(t *testing.T) {
	service := NewService()

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		TenantID: "101",
		UserID:   "user-1",
		Email:    "user@example.com",
		Level:    50,
		Role:     "manager",
	})

	_, err := service.GetProfile(ctx)
	if !errors.Is(err, ErrTenantMissing) {
		t.Fatalf("GetProfile error = %v, want %v", err, ErrTenantMissing)
	}
}
