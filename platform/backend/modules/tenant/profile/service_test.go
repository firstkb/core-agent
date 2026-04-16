package profilesvc

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
)

type tenantUserReaderStub struct {
	user *authsvc.TenantUser
	err  error
}

func (s tenantUserReaderStub) GetByID(_ context.Context, _ requestctx.TenantInfo, _ uuid.UUID) (*authsvc.TenantUser, error) {
	return s.user, s.err
}

func TestGetProfileSuccess(t *testing.T) {
	service := NewService(tenantUserReaderStub{
		user: &authsvc.TenantUser{
			Email:     "user@example.com",
			FirstName: "Demo",
			LastName:  "User",
			Level:     90,
			Role:      "admin",
		},
	})

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		TenantID: "101",
		UserID:   "11111111-1111-1111-1111-111111111111",
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

	profile, err := service.GetProfile(ctx)
	if err != nil {
		t.Fatalf("GetProfile returned error: %v", err)
	}

	if profile.User.ID != "11111111-1111-1111-1111-111111111111" {
		t.Fatalf("user id = %q, want expected uuid", profile.User.ID)
	}
	if profile.User.Email != "user@example.com" {
		t.Fatalf("user email = %q, want %q", profile.User.Email, "user@example.com")
	}
	if profile.User.FirstName != "Demo" {
		t.Fatalf("user first_name = %q, want %q", profile.User.FirstName, "Demo")
	}
	if profile.User.LastName != "User" {
		t.Fatalf("user last_name = %q, want %q", profile.User.LastName, "User")
	}
	if profile.User.Level != 90 {
		t.Fatalf("user level = %d, want %d", profile.User.Level, 90)
	}
	if profile.User.Role != "admin" {
		t.Fatalf("user role = %q, want %q", profile.User.Role, "admin")
	}
	if profile.Tenant.ID != "101" {
		t.Fatalf("tenant id = %q, want %q", profile.Tenant.ID, "101")
	}
	if profile.Tenant.Name != "Demo Tenant" {
		t.Fatalf("tenant name = %q, want %q", profile.Tenant.Name, "Demo Tenant")
	}
}

func TestGetProfileUsesClaimNamesWithoutLookup(t *testing.T) {
	service := NewService(tenantUserReaderStub{
		err: errors.New("should not lookup tenant user"),
	})

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		TenantID:  "101",
		UserID:    "5cba301e-df78-4691-9d7a-818e1d68ad20",
		Email:     "admin@platform.local",
		FirstName: "Local",
		LastName:  "Platform Admin",
		Level:     100,
		Role:      "root",
	})
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{
		ID:     "101",
		Name:   "Demo Tenant",
		Host:   "demo.dtriton.local",
		Plan:   "sandbox",
		Status: "active",
	})

	profile, err := service.GetProfile(ctx)
	if err != nil {
		t.Fatalf("GetProfile returned error: %v", err)
	}
	if profile.User.FirstName != "Local" {
		t.Fatalf("user first_name = %q, want %q", profile.User.FirstName, "Local")
	}
	if profile.User.LastName != "Platform Admin" {
		t.Fatalf("user last_name = %q, want %q", profile.User.LastName, "Platform Admin")
	}
	if profile.User.Role != "root" {
		t.Fatalf("user role = %q, want %q", profile.User.Role, "root")
	}
}

func TestGetProfileMissingClaims(t *testing.T) {
	service := NewService(nil)

	ctx := requestctx.WithTenant(context.Background(), requestctx.TenantInfo{
		ID:     "101",
		Name:   "Demo Tenant",
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
	service := NewService(nil)

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
