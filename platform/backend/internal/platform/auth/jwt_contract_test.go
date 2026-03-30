package auth

import (
	"testing"

	"github.com/google/uuid"
)

func TestJWTClaimsToMapIncludesScope(t *testing.T) {
	claims := NewJWTClaims("issuer", "aud", uuid.New(), 42, "user@example.com", "", 30, "member", AccessScopeTenantAPI)
	values := claims.ToMap()

	if got := values["scope"]; got != AccessScopeTenantAPI {
		t.Fatalf("unexpected scope %v", got)
	}
	if _, ok := values["nbf"]; !ok {
		t.Fatalf("expected nbf claim")
	}
}

func TestComputeKeyIDIsDeterministic(t *testing.T) {
	privateKey, err := GenerateKeyPair(2048)
	if err != nil {
		t.Fatalf("GenerateKeyPair: %v", err)
	}

	first, err := computeKeyID(&privateKey.PublicKey)
	if err != nil {
		t.Fatalf("computeKeyID first: %v", err)
	}
	second, err := computeKeyID(&privateKey.PublicKey)
	if err != nil {
		t.Fatalf("computeKeyID second: %v", err)
	}

	if first == "" {
		t.Fatalf("expected non-empty key id")
	}
	if first != second {
		t.Fatalf("expected deterministic key id, got %q and %q", first, second)
	}
}
