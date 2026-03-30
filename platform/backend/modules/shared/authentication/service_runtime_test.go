package authsvc

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/appenv"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	eventsvc "dtriton.com/platform/backend/modules/shared/audit"
	"dtriton.com/platform/backend/modules/shared/sessions"
)

type logoutRefreshRepoStub struct {
	token             *sessions.RefreshToken
	getErr            error
	revokedFamilyID   uuid.UUID
	revokedTenantID   int64
	revokedUserID     uuid.UUID
	revokedExceptHash *string
}

func (s *logoutRefreshRepoStub) CreateToken(context.Context, *sessions.RefreshToken) error {
	return nil
}
func (s *logoutRefreshRepoStub) GetToken(context.Context, string) (*sessions.RefreshToken, error) {
	return s.token, s.getErr
}
func (s *logoutRefreshRepoStub) GetTokenRecord(context.Context, string) (*sessions.RefreshToken, error) {
	return s.token, s.getErr
}
func (s *logoutRefreshRepoStub) RotateToken(context.Context, string, *sessions.RefreshToken) error {
	return nil
}
func (s *logoutRefreshRepoStub) RevokeToken(context.Context, string) error { return nil }
func (s *logoutRefreshRepoStub) RevokeTokenFamily(_ context.Context, tokenFamilyID uuid.UUID) error {
	s.revokedFamilyID = tokenFamilyID
	return nil
}
func (s *logoutRefreshRepoStub) RevokeUserTokens(_ context.Context, tenantID int64, userID uuid.UUID, exceptTokenHash *string) error {
	s.revokedTenantID = tenantID
	s.revokedUserID = userID
	s.revokedExceptHash = exceptTokenHash
	return nil
}
func (s *logoutRefreshRepoStub) DeleteExpiredTokens(context.Context, int64) error { return nil }

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
}

func TestResolveDevOTPCode_NormalizesLength(t *testing.T) {
	got, err := resolveDevOTPCode(4, "999999")
	if err != nil {
		t.Fatalf("resolveDevOTPCode trim returned error: %v", err)
	}
	if got != "9999" {
		t.Fatalf("resolveDevOTPCode trim = %q, want %q", got, "9999")
	}

	got, err = resolveDevOTPCode(6, "9999")
	if err != nil {
		t.Fatalf("resolveDevOTPCode pad returned error: %v", err)
	}
	if got != "999999" {
		t.Fatalf("resolveDevOTPCode pad = %q, want %q", got, "999999")
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

func TestRefreshFailureReason(t *testing.T) {
	if reason := refreshFailureReason(nil, sessions.ErrRefreshTokenNotFound); reason != "token_not_found" {
		t.Fatalf("refreshFailureReason(not found) = %q, want %q", reason, "token_not_found")
	}
	if reason := refreshFailureReason(nil, sessions.ErrRefreshTokenRotated); reason != "reuse_detected" {
		t.Fatalf("refreshFailureReason(rotated err) = %q, want %q", reason, "reuse_detected")
	}

	revokedAt := time.Now().Add(-time.Minute)
	if reason := refreshFailureReason(&sessions.RefreshToken{RevokedAt: &revokedAt}, nil); reason != "token_revoked" {
		t.Fatalf("refreshFailureReason(revoked token) = %q, want %q", reason, "token_revoked")
	}

	rotatedAt := time.Now().Add(-time.Second)
	if reason := refreshFailureReason(&sessions.RefreshToken{RotatedAt: &rotatedAt}, nil); reason != "reuse_detected" {
		t.Fatalf("refreshFailureReason(rotated token) = %q, want %q", reason, "reuse_detected")
	}
}

func TestRefreshFailureEventData(t *testing.T) {
	sessionID := uuid.New()
	familyID := uuid.New()
	userID := uuid.New()
	token := &sessions.RefreshToken{
		SessionID:     sessionID,
		TokenFamilyID: familyID,
		UserID:        userID,
		TenantID:      101,
		Surface:       sessions.RefreshSurfaceTenant,
	}

	data := refreshFailureEventData("reuse_detected", token)

	if got := data["status"]; got != "failed" {
		t.Fatalf("status = %#v, want %q", got, "failed")
	}
	if got := data["reason"]; got != "reuse_detected" {
		t.Fatalf("reason = %#v, want %q", got, "reuse_detected")
	}
	if got := data["session_id"]; got != sessionID.String() {
		t.Fatalf("session_id = %#v, want %q", got, sessionID.String())
	}
	if got := data["token_family_id"]; got != familyID.String() {
		t.Fatalf("token_family_id = %#v, want %q", got, familyID.String())
	}
	if got := data["user_id"]; got != userID.String() {
		t.Fatalf("user_id = %#v, want %q", got, userID.String())
	}
	if got := data["tenant_id"]; got != int64(101) {
		t.Fatalf("tenant_id = %#v, want %d", got, 101)
	}
	if got := data["surface"]; got != sessions.RefreshSurfaceTenant {
		t.Fatalf("surface = %#v, want %q", got, sessions.RefreshSurfaceTenant)
	}
}

func TestIssuedTokensPublicResponse(t *testing.T) {
	issued := &IssuedTokens{
		AccessToken:  "access-token",
		RefreshToken: "refresh-token",
		ExpiresIn:    900,
	}

	resp := issued.PublicResponse()
	if resp == nil {
		t.Fatal("PublicResponse returned nil")
	}
	if resp.AccessToken != "access-token" {
		t.Fatalf("AccessToken = %q, want %q", resp.AccessToken, "access-token")
	}
	if resp.ExpiresIn != 900 {
		t.Fatalf("ExpiresIn = %d, want %d", resp.ExpiresIn, 900)
	}
}

func TestIssuedTokensPublicResponseNil(t *testing.T) {
	var issued *IssuedTokens
	if resp := issued.PublicResponse(); resp != nil {
		t.Fatalf("PublicResponse(nil) = %#v, want nil", resp)
	}
}

func TestRefreshRouteDomain(t *testing.T) {
	ctx := requestctx.WithRoute(t.Context(), requestctx.RouteInfo{
		ID:     router.RouteID("REFRESH"),
		Domain: "demo.platform.local",
	})

	if got := refreshRouteDomain(ctx); got != "demo.platform.local" {
		t.Fatalf("refreshRouteDomain = %q, want %q", got, "demo.platform.local")
	}
}

func TestRouteDomainMatchesTenantHost(t *testing.T) {
	if !routeDomainMatchesTenantHost("demo.platform.local", "demo.platform.local") {
		t.Fatal("expected exact host match")
	}
	if routeDomainMatchesTenantHost("demo.platform.local", "acme.platform.local") {
		t.Fatal("unexpected host match")
	}
	if routeDomainMatchesTenantHost("undefined", "demo.platform.local") {
		t.Fatal("undefined route domain should not match")
	}
	if routeDomainMatchesTenantHost("", "demo.platform.local") {
		t.Fatal("empty route domain should not match")
	}
}

func TestShouldLogAuthEventIncludesSessionLifecycle(t *testing.T) {
	if !shouldLogAuthEvent(eventsvc.EventTypeSessionCreated) {
		t.Fatal("session_created should be logged")
	}
	if !shouldLogAuthEvent(eventsvc.EventTypeSessionRotated) {
		t.Fatal("session_rotated should be logged")
	}
	if !shouldLogAuthEvent(eventsvc.EventTypeSessionRevoked) {
		t.Fatal("session_revoked should be logged")
	}
	if !shouldLogAuthEvent(eventsvc.EventTypeSessionReuse) {
		t.Fatal("session_reuse_detected should be logged")
	}
}

func TestSessionEventData(t *testing.T) {
	expiresAt := time.Date(2026, 3, 30, 12, 0, 0, 0, time.UTC)
	token := &sessions.RefreshToken{
		SessionID:     uuid.MustParse("11111111-1111-1111-1111-111111111111"),
		TokenFamilyID: uuid.MustParse("22222222-2222-2222-2222-222222222222"),
		UserID:        uuid.MustParse("33333333-3333-3333-3333-333333333333"),
		TenantID:      101,
		Surface:       sessions.RefreshSurfaceTenant,
		TokenHash:     "secret-hash-value",
		ExpiresAt:     expiresAt,
	}

	data := sessionEventData(token, eventsvc.EventData{
		"status": "success",
		"action": "refresh",
	})

	if got := data["status"]; got != "success" {
		t.Fatalf("status = %#v, want %q", got, "success")
	}
	if got := data["action"]; got != "refresh" {
		t.Fatalf("action = %#v, want %q", got, "refresh")
	}
	if got := data["session_id"]; got != token.SessionID.String() {
		t.Fatalf("session_id = %#v, want %q", got, token.SessionID.String())
	}
	if got := data["token_family_id"]; got != token.TokenFamilyID.String() {
		t.Fatalf("token_family_id = %#v, want %q", got, token.TokenFamilyID.String())
	}
	if got := data["user_id"]; got != token.UserID.String() {
		t.Fatalf("user_id = %#v, want %q", got, token.UserID.String())
	}
	if got := data["tenant_id"]; got != int64(101) {
		t.Fatalf("tenant_id = %#v, want %d", got, 101)
	}
	if got := data["surface"]; got != sessions.RefreshSurfaceTenant {
		t.Fatalf("surface = %#v, want %q", got, sessions.RefreshSurfaceTenant)
	}
	if got := data["expires_at"]; got != expiresAt.Format(time.RFC3339) {
		t.Fatalf("expires_at = %#v, want %q", got, expiresAt.Format(time.RFC3339))
	}
	if _, ok := data["token_hash"]; ok {
		t.Fatal("session event data must not expose token_hash")
	}
}

func TestLogoutWithoutRefreshTokenIsBenign(t *testing.T) {
	repo := &logoutRefreshRepoStub{}
	svc := AuthService{refreshRepo: repo}

	if err := svc.Logout(t.Context(), nil, LogoutRequest{}); err != nil {
		t.Fatalf("Logout returned error: %v", err)
	}
	if repo.revokedFamilyID != uuid.Nil || repo.revokedUserID != uuid.Nil {
		t.Fatal("logout without refresh token should not revoke any session")
	}
}

func TestLogoutRevokesTokenFamilyByDefault(t *testing.T) {
	userID := uuid.New()
	familyID := uuid.New()
	repo := &logoutRefreshRepoStub{
		token: &sessions.RefreshToken{
			TenantID:      platformAuthTenantID,
			UserID:        userID,
			TokenFamilyID: familyID,
			Surface:       sessions.RefreshSurfaceAdmin,
		},
	}
	svc := AuthService{refreshRepo: repo}

	if err := svc.Logout(t.Context(), nil, LogoutRequest{
		RefreshToken: "refresh-token",
		AllDevices:   false,
	}); err != nil {
		t.Fatalf("Logout returned error: %v", err)
	}
	if repo.revokedFamilyID != familyID {
		t.Fatalf("revoked family = %s, want %s", repo.revokedFamilyID, familyID)
	}
	if repo.revokedUserID != uuid.Nil {
		t.Fatal("default logout should not revoke all user sessions")
	}
}

func TestLogoutRevokesAllUserTokensWhenRequested(t *testing.T) {
	userID := uuid.New()
	familyID := uuid.New()
	repo := &logoutRefreshRepoStub{
		token: &sessions.RefreshToken{
			TenantID:      platformAuthTenantID,
			UserID:        userID,
			TokenFamilyID: familyID,
			Surface:       sessions.RefreshSurfaceAdmin,
		},
	}
	svc := AuthService{refreshRepo: repo}

	if err := svc.Logout(t.Context(), nil, LogoutRequest{
		RefreshToken: "refresh-token",
		AllDevices:   true,
	}); err != nil {
		t.Fatalf("Logout returned error: %v", err)
	}
	if repo.revokedTenantID != platformAuthTenantID {
		t.Fatalf("revoked tenant = %d, want %d", repo.revokedTenantID, platformAuthTenantID)
	}
	if repo.revokedUserID != userID {
		t.Fatalf("revoked user = %s, want %s", repo.revokedUserID, userID)
	}
}
