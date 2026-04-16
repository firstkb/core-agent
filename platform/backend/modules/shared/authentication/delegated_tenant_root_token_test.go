package authsvc

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/auth"
)

func TestDelegatedTenantRootTokenServiceBuildLaunchURL(t *testing.T) {
	codec, err := auth.NewTokenCodec([]byte("super-secret"))
	if err != nil {
		t.Fatalf("NewTokenCodec: %v", err)
	}

	service := &DelegatedTenantRootTokenService{
		codec: codec,
		schema: DelegatedTenantRootTokenSchema{
			Clock:  func() time.Time { return time.Unix(1_800_000_000, 0).UTC() },
			MaxAge: time.Minute,
		},
	}

	launchURL, err := service.BuildLaunchURL(DelegatedTenantRootLaunchInput{
		AdminUserID: uuid.MustParse("11111111-1111-1111-1111-111111111111"),
		ReturnTo:    "/",
		Scheme:      "https",
		TenantHost:  "demo.platform.local",
		TenantID:    "101",
	})
	if err != nil {
		t.Fatalf("BuildLaunchURL: %v", err)
	}
	if launchURL == "" {
		t.Fatal("expected delegated tenant root launch url")
	}
}

func TestDelegatedTenantRootTokenSchemaRejectsExpiredPayload(t *testing.T) {
	codec, err := auth.NewTokenCodec([]byte("super-secret"))
	if err != nil {
		t.Fatalf("NewTokenCodec: %v", err)
	}

	issuedAt := time.Unix(1_800_000_000, 0).UTC()
	schema := DelegatedTenantRootTokenSchema{
		Clock:  func() time.Time { return issuedAt },
		MaxAge: time.Minute,
	}

	token, err := auth.EncodeToken(codec, schema, DelegatedTenantRootTokenPayload{
		AdminUserID: uuid.MustParse("11111111-1111-1111-1111-111111111111").String(),
		ReturnTo:    "/",
		TenantHost:  "demo.platform.local",
		TenantID:    "101",
	})
	if err != nil {
		t.Fatalf("EncodeToken: %v", err)
	}

	expiredSchema := DelegatedTenantRootTokenSchema{
		Clock:  func() time.Time { return issuedAt.Add(2 * time.Minute) },
		MaxAge: time.Minute,
	}

	if _, err := auth.DecodeToken(codec, expiredSchema, token); err == nil {
		t.Fatal("expected delegated tenant root token decode to fail after expiry")
	}
}
