package authsvc

import (
	"testing"

	"dtriton.com/platform/backend/internal/platform/appenv"
)

func TestResolveDevOTPCode_Default(t *testing.T) {
	got, err := resolveDevOTPCode(6, "")
	if err != nil {
		t.Fatalf("resolveDevOTPCode returned error: %v", err)
	}
	if got != "999999" {
		t.Fatalf("resolveDevOTPCode default = %q, want %q", got, "999999")
	}
}

func TestResolveDevOTPCode_RejectsInvalid(t *testing.T) {
	if _, err := resolveDevOTPCode(6, "12ab56"); err == nil {
		t.Fatal("expected non-digit fixed otp to fail")
	}
	if _, err := resolveDevOTPCode(6, "9999"); err == nil {
		t.Fatal("expected wrong-length fixed otp to fail")
	}
}

func TestNextOTPCode_UsesFixedOTPOnlyForDevelopmentLikeEnvironments(t *testing.T) {
	svc := AuthService{
		otpLength:   6,
		runtimeEnv:  appenv.EnvironmentDevelopment,
		devFixedOTP: "123456",
	}

	got, err := svc.nextOTPCode(6)
	if err != nil {
		t.Fatalf("nextOTPCode returned error: %v", err)
	}
	if got != "123456" {
		t.Fatalf("nextOTPCode = %q, want %q", got, "123456")
	}

	svc.runtimeEnv = appenv.EnvironmentProduction
	got, err = svc.nextOTPCode(6)
	if err != nil {
		t.Fatalf("nextOTPCode(prod) returned error: %v", err)
	}
	if got == "123456" {
		t.Fatal("production otp must not reuse dev fixed otp")
	}
	if len(got) != 6 {
		t.Fatalf("production otp length = %d, want 6", len(got))
	}
}

func TestTenantUserBlockReason(t *testing.T) {
	policy := TenantAuthPolicy{
		LoginRequiresUsersAccess: true,
		LoginRequiresUsersAct:    true,
	}

	if reason := tenantUserBlockReason(&TenantUser{Access: false, Active: true}, policy); reason != "user_access_disabled" {
		t.Fatalf("tenantUserBlockReason(access) = %q, want %q", reason, "user_access_disabled")
	}
	if reason := tenantUserBlockReason(&TenantUser{Access: true, Active: false}, policy); reason != "user_inactive" {
		t.Fatalf("tenantUserBlockReason(active) = %q, want %q", reason, "user_inactive")
	}
	if reason := tenantUserBlockReason(&TenantUser{Access: true, Active: true}, policy); reason != "" {
		t.Fatalf("tenantUserBlockReason(active user) = %q, want empty", reason)
	}
}

func TestNormalizeTenantUserDefaults(t *testing.T) {
	user := &TenantUser{Admin: true}
	normalizeTenantUser(user)

	if user.Role != "admin" {
		t.Fatalf("normalizeTenantUser role = %q, want %q", user.Role, "admin")
	}
	if user.Level != 80 {
		t.Fatalf("normalizeTenantUser level = %d, want %d", user.Level, 80)
	}
}
