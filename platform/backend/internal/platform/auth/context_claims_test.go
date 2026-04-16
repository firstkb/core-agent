package auth

import (
	"net/http/httptest"
	"testing"

	jwtlegacy "github.com/golang-jwt/jwt"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func TestCreateContextWithClaimAcceptsPhoneOnlyToken(t *testing.T) {
	token := jwtlegacy.NewWithClaims(jwtlegacy.SigningMethodHS256, jwtlegacy.MapClaims{
		"tenant_id": "42",
		"sub":       "user-123",
		"level":     30,
		"phone":     "+15551234567",
		"scope":     AccessScopeTenantAPI,
	})
	tokenString, err := token.SignedString([]byte("secret"))
	if err != nil {
		t.Fatalf("SignedString: %v", err)
	}

	req := httptest.NewRequest("GET", "/profile", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	ctx, err := CreateContextWithClaim(req)
	if err != nil {
		t.Fatalf("CreateContextWithClaim: %v", err)
	}

	claims, ok := requestctx.Claims(ctx)
	if !ok {
		t.Fatalf("claims not found in context")
	}
	if claims.TenantID != "42" {
		t.Fatalf("unexpected tenant_id %q", claims.TenantID)
	}
	if claims.UserID != "user-123" {
		t.Fatalf("unexpected user_id %q", claims.UserID)
	}
	if claims.Email != "" {
		t.Fatalf("unexpected email %q", claims.Email)
	}
	if claims.Phone != "+15551234567" {
		t.Fatalf("unexpected phone %q", claims.Phone)
	}
	if claims.Level != 30 {
		t.Fatalf("unexpected level %d", claims.Level)
	}
	if claims.Scope != AccessScopeTenantAPI {
		t.Fatalf("unexpected scope %q", claims.Scope)
	}
}

func TestCreateContextWithClaimReadsOptionalNames(t *testing.T) {
	token := jwtlegacy.NewWithClaims(jwtlegacy.SigningMethodHS256, jwtlegacy.MapClaims{
		"tenant_id":  "42",
		"sub":        "user-123",
		"level":      100,
		"email":      "admin@platform.local",
		"first_name": "Local",
		"last_name":  "Platform Admin",
		"role":       "root",
		"scope":      AccessScopeTenantAPI,
	})
	tokenString, err := token.SignedString([]byte("secret"))
	if err != nil {
		t.Fatalf("SignedString: %v", err)
	}

	req := httptest.NewRequest("GET", "/profile", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	ctx, err := CreateContextWithClaim(req)
	if err != nil {
		t.Fatalf("CreateContextWithClaim: %v", err)
	}

	claims, ok := requestctx.Claims(ctx)
	if !ok {
		t.Fatalf("claims not found in context")
	}
	if claims.FirstName != "Local" {
		t.Fatalf("unexpected first_name %q", claims.FirstName)
	}
	if claims.LastName != "Platform Admin" {
		t.Fatalf("unexpected last_name %q", claims.LastName)
	}
}

func TestCreateContextWithClaimRejectsTokenWithoutContact(t *testing.T) {
	token := jwtlegacy.NewWithClaims(jwtlegacy.SigningMethodHS256, jwtlegacy.MapClaims{
		"tenant_id": "42",
		"sub":       "user-123",
		"level":     30,
	})
	tokenString, err := token.SignedString([]byte("secret"))
	if err != nil {
		t.Fatalf("SignedString: %v", err)
	}

	req := httptest.NewRequest("GET", "/profile", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	if _, err := CreateContextWithClaim(req); err == nil {
		t.Fatalf("expected error for token without email or phone")
	}
}

func TestCreateContextWithTrustedHeaders(t *testing.T) {
	req := httptest.NewRequest("GET", "/profile", nil)
	req.Header.Set(HeaderAuthTenantID, "42")
	req.Header.Set(HeaderAuthUserID, "user-123")
	req.Header.Set(HeaderAuthPhone, "+15551234567")
	req.Header.Set(HeaderAuthLevel, "30")
	req.Header.Set(HeaderAuthRole, "member")
	req.Header.Set(HeaderAuthScope, AccessScopeTenantAPI)

	ctx, err := CreateContextWithTrustedHeaders(req)
	if err != nil {
		t.Fatalf("CreateContextWithTrustedHeaders: %v", err)
	}

	claims, ok := requestctx.Claims(ctx)
	if !ok {
		t.Fatalf("claims not found in context")
	}
	if claims.TenantID != "42" {
		t.Fatalf("unexpected tenant_id %q", claims.TenantID)
	}
	if claims.Phone != "+15551234567" {
		t.Fatalf("unexpected phone %q", claims.Phone)
	}
	if claims.Scope != AccessScopeTenantAPI {
		t.Fatalf("unexpected scope %q", claims.Scope)
	}
}
