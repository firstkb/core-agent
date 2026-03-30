package sessions

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestNormalizeRefreshTokenRecordFillsDefaults(t *testing.T) {
	token := &RefreshToken{}

	normalizeRefreshTokenRecord(token)

	if token.ID == uuid.Nil {
		t.Fatal("expected ID to be set")
	}
	if token.SessionID == uuid.Nil {
		t.Fatal("expected SessionID to be set")
	}
	if token.TokenFamilyID == uuid.Nil {
		t.Fatal("expected TokenFamilyID to be set")
	}
	if token.Surface != RefreshSurfaceUnknown {
		t.Fatalf("expected default surface %q, got %q", RefreshSurfaceUnknown, token.Surface)
	}
	if token.CreatedAt.IsZero() {
		t.Fatal("expected CreatedAt to be set")
	}
	if token.UpdatedAt.IsZero() {
		t.Fatal("expected UpdatedAt to be set")
	}
	if !token.UpdatedAt.Equal(token.CreatedAt) {
		t.Fatalf("expected UpdatedAt to equal CreatedAt, got created=%s updated=%s", token.CreatedAt, token.UpdatedAt)
	}
}

func TestNormalizeRefreshTokenRecordPreservesExplicitValues(t *testing.T) {
	id := uuid.New()
	sessionID := uuid.New()
	familyID := uuid.New()
	createdAt := time.Date(2026, 3, 30, 12, 0, 0, 0, time.UTC)
	updatedAt := createdAt.Add(10 * time.Minute)
	token := &RefreshToken{
		ID:            id,
		SessionID:     sessionID,
		TokenFamilyID: familyID,
		Surface:       RefreshSurfaceTenant,
		CreatedAt:     createdAt,
		UpdatedAt:     updatedAt,
	}

	normalizeRefreshTokenRecord(token)

	if token.ID != id {
		t.Fatalf("expected ID %s, got %s", id, token.ID)
	}
	if token.SessionID != sessionID {
		t.Fatalf("expected SessionID %s, got %s", sessionID, token.SessionID)
	}
	if token.TokenFamilyID != familyID {
		t.Fatalf("expected TokenFamilyID %s, got %s", familyID, token.TokenFamilyID)
	}
	if token.Surface != RefreshSurfaceTenant {
		t.Fatalf("expected surface %q, got %q", RefreshSurfaceTenant, token.Surface)
	}
	if !token.CreatedAt.Equal(createdAt) {
		t.Fatalf("expected CreatedAt %s, got %s", createdAt, token.CreatedAt)
	}
	if !token.UpdatedAt.Equal(updatedAt) {
		t.Fatalf("expected UpdatedAt %s, got %s", updatedAt, token.UpdatedAt)
	}
}

func TestRefreshTokenStateAt(t *testing.T) {
	now := time.Date(2026, 3, 30, 12, 0, 0, 0, time.UTC)

	active := (&RefreshToken{ExpiresAt: now.Add(time.Hour)}).StateAt(now)
	if active != RefreshTokenStateActive {
		t.Fatalf("active state = %q, want %q", active, RefreshTokenStateActive)
	}

	expired := (&RefreshToken{ExpiresAt: now.Add(-time.Second)}).StateAt(now)
	if expired != RefreshTokenStateExpired {
		t.Fatalf("expired state = %q, want %q", expired, RefreshTokenStateExpired)
	}

	revokedAt := now.Add(-time.Minute)
	revoked := (&RefreshToken{ExpiresAt: now.Add(time.Hour), RevokedAt: &revokedAt}).StateAt(now)
	if revoked != RefreshTokenStateRevoked {
		t.Fatalf("revoked state = %q, want %q", revoked, RefreshTokenStateRevoked)
	}

	rotatedAt := now.Add(-time.Second)
	rotated := (&RefreshToken{
		ExpiresAt: now.Add(-time.Hour),
		RevokedAt: &revokedAt,
		RotatedAt: &rotatedAt,
	}).StateAt(now)
	if rotated != RefreshTokenStateRotated {
		t.Fatalf("rotated state = %q, want %q", rotated, RefreshTokenStateRotated)
	}
}
