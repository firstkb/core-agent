package authsvc

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	eventsvc "dtriton.com/platform/backend/modules/shared/audit"
	"dtriton.com/platform/backend/modules/shared/sessions"
)

type DelegatedTenantRootLoginResult struct {
	RedirectTo string
	Tokens     *IssuedTokens
}

func (s *AuthService) CompleteDelegatedTenantRootLogin(ctx context.Context, r *http.Request, rawToken string) (*DelegatedTenantRootLoginResult, error) {
	if s == nil || s.delegatedTenantRootTokens == nil {
		return nil, ErrUnauthorized
	}

	payload, err := s.delegatedTenantRootTokens.Decode(rawToken)
	if err != nil {
		return nil, ErrUnauthorized
	}

	return s.issueDelegatedTenantRootSession(ctx, r, payload)
}

func (s *AuthService) issueDelegatedTenantRootSession(ctx context.Context, r *http.Request, payload DelegatedTenantRootTokenPayload) (*DelegatedTenantRootLoginResult, error) {
	tenantCtx, tenantID, err := tenantFromContext(ctx)
	if err != nil {
		return nil, err
	}
	if !strings.EqualFold(strings.TrimSpace(payload.TenantID), tenantCtx.ID) ||
		!strings.EqualFold(strings.TrimSpace(payload.TenantHost), tenantCtx.Host) {
		return nil, ErrUnauthorized
	}

	user, err := s.resolveRootAdminUserByID(ctx, payload.AdminUserID)
	if err != nil {
		return nil, err
	}

	sessionCtx := delegatedTenantRootUserContext(ctx, user)
	firstName, lastName := splitAuthDisplayName(user.Name)
	claims := auth.NewJWTClaims(
		s.issuer,
		s.audience,
		user.ID,
		tenantID,
		user.Email,
		user.Phone,
		delegatedTenantRootLevel(user),
		"root",
		auth.AccessScopeTenantAPI,
	)
	claims.FirstName = firstName
	claims.LastName = lastName
	claims.ExpiresAt = time.Now().Add(s.accessTTL).Unix()

	accessToken, err := s.jwtIssuer.IssueToken(claims)
	if err != nil {
		return nil, err
	}

	refreshToken := generateRefreshToken()
	issuedAt := time.Now()
	refreshRecord := &sessions.RefreshToken{
		SessionID:     uuid.New(),
		TenantID:      tenantID,
		UserID:        user.ID,
		Surface:       sessions.RefreshSurfaceTenantRootDelegation,
		TokenHash:     sessions.HashToken(refreshToken),
		TokenFamilyID: uuid.New(),
		IPAddress:     optionalString(extractIP(r)),
		UserAgent:     optionalString(r.Header.Get("User-Agent")),
		CreatedAt:     issuedAt,
		UpdatedAt:     issuedAt,
		ExpiresAt:     issuedAt.Add(s.refreshTTL),
	}
	if err := s.refreshRepo.CreateToken(ctx, refreshRecord); err != nil {
		return nil, err
	}

	s.logAuthEvent(sessionCtx, r, eventsvc.EventTypeDelegatedRootLogin, delegatedTenantRootLoginEventData(user, tenantID, payload))

	return &DelegatedTenantRootLoginResult{
		RedirectTo: NormalizeDelegatedTenantRootReturnTo(payload.ReturnTo),
		Tokens: &IssuedTokens{
			AccessToken:      accessToken,
			RefreshToken:     refreshToken,
			RefreshExpiresAt: refreshRecord.ExpiresAt,
			ExpiresIn:        int(s.accessTTL.Seconds()),
		},
	}, nil
}

func (s *AuthService) refreshDelegatedTenantRootToken(ctx context.Context, r *http.Request, token *sessions.RefreshToken, currentTokenHash string, req RefreshRequest) (*IssuedTokens, error) {
	tenantCtx, tenantInfo, terr := s.ensureTenantContext(ctx, token.TenantID)
	if terr != nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeTokenRefreshFail, eventsvc.EventData{
			"reason": "tenant_missing",
			"status": "failed",
		})
		return nil, ErrTenantMissing
	}
	if !routeDomainMatchesTenantHost(refreshRouteDomain(ctx), tenantInfo.Host) {
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeTokenRefreshFail, eventsvc.EventData{
			"reason":    "tenant_host_mismatch",
			"status":    "failed",
			"surface":   sessions.RefreshSurfaceTenantRootDelegation,
			"tenant_id": token.TenantID,
		})
		return nil, ErrUnauthorized
	}

	user, err := s.resolveRootAdminUserByID(ctx, token.UserID.String())
	if err != nil {
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeTokenRefreshFail, eventsvc.EventData{
			"reason":  authFailureReason(err),
			"status":  "failed",
			"user_id": token.UserID.String(),
		})
		return nil, err
	}

	refreshCtx := delegatedTenantRootUserContext(tenantCtx, user)
	firstName, lastName := splitAuthDisplayName(user.Name)
	claims := auth.NewJWTClaims(
		s.issuer,
		s.audience,
		user.ID,
		token.TenantID,
		user.Email,
		user.Phone,
		delegatedTenantRootLevel(user),
		"root",
		auth.AccessScopeTenantAPI,
	)
	claims.FirstName = firstName
	claims.LastName = lastName
	claims.ExpiresAt = time.Now().Add(s.accessTTL).Unix()

	accessToken, err := s.jwtIssuer.IssueToken(claims)
	if err != nil {
		return nil, err
	}

	newRefresh := generateRefreshToken()
	issuedAt := time.Now()
	refreshRecord := &sessions.RefreshToken{
		SessionID:     token.SessionID,
		TenantID:      token.TenantID,
		UserID:        token.UserID,
		Surface:       sessions.RefreshSurfaceTenantRootDelegation,
		TokenHash:     sessions.HashToken(newRefresh),
		TokenFamilyID: token.TokenFamilyID,
		IPAddress:     optionalString(req.IP),
		UserAgent:     optionalString(req.UserAgent),
		CreatedAt:     issuedAt,
		UpdatedAt:     issuedAt,
		ExpiresAt:     issuedAt.Add(s.refreshTTL),
	}
	if err := s.refreshRepo.RotateToken(ctx, currentTokenHash, refreshRecord); err != nil {
		if err == sessions.ErrRefreshTokenRotated {
			s.revokeTokenFamilyQuietly(refreshCtx, token)
			s.logAuthEvent(refreshCtx, r, eventsvc.EventTypeSessionReuse, sessionEventData(token, eventsvc.EventData{
				"reason": "reuse_detected",
				"status": "failed",
			}))
			s.logAuthEvent(refreshCtx, r, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData("reuse_detected", token))
			return nil, ErrUnauthorized
		}
		if err == sessions.ErrRefreshTokenRevoked || err == sessions.ErrRefreshTokenExpired || err == sessions.ErrRefreshTokenNotFound {
			s.logAuthEvent(refreshCtx, r, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData(refreshFailureReason(token, err), token))
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	return &IssuedTokens{
		AccessToken:      accessToken,
		RefreshToken:     newRefresh,
		RefreshExpiresAt: refreshRecord.ExpiresAt,
		ExpiresIn:        int(s.accessTTL.Seconds()),
	}, nil
}

func (s *AuthService) resolveRootAdminUserByID(ctx context.Context, rawAdminUserID string) (*AdminUser, error) {
	if s == nil || s.adminUsers == nil {
		return nil, ErrUnauthorized
	}

	adminUserID, err := uuid.Parse(strings.TrimSpace(rawAdminUserID))
	if err != nil {
		return nil, ErrUnauthorized
	}

	user, err := s.adminUsers.GetByID(ctx, adminUserID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	normalizeAdminUser(user)
	if reason := adminUserBlockReason(user); reason != "" {
		return nil, ErrUserInactive
	}
	if delegatedTenantRootLevel(user) < 100 {
		return nil, ErrUnauthorized
	}

	return user, nil
}

func delegatedTenantRootLevel(user *AdminUser) int {
	if user == nil || user.Level >= 100 {
		if user == nil {
			return 100
		}
		return user.Level
	}

	return 100
}

func delegatedTenantRootUserContext(ctx context.Context, user *AdminUser) context.Context {
	if user == nil {
		return ctx
	}

	return requestctx.WithUser(ctx, requestctx.UserInfo{
		Email: user.Email,
		ID:    user.ID.String(),
		Level: delegatedTenantRootLevel(user),
		Role:  "root",
	})
}

func delegatedTenantRootLoginEventData(user *AdminUser, tenantID int64, payload DelegatedTenantRootTokenPayload) eventsvc.EventData {
	data := eventsvc.EventData{
		"delegated":      true,
		"entry_surface":  "admin_console",
		"method":         "delegated_root",
		"role":           "root",
		"status":         "success",
		"tenant_host":    strings.TrimSpace(payload.TenantHost),
		"tenant_id":      tenantID,
		"text":           delegatedTenantRootLoginText(user, payload.TenantHost),
	}

	if user != nil {
		if user.ID != uuid.Nil {
			data["admin_user_id"] = user.ID.String()
			data["user_id"] = user.ID.String()
		}
		if email := strings.TrimSpace(user.Email); email != "" {
			data["address"] = email
			data["admin_email"] = email
		}
	}

	if returnTo := NormalizeDelegatedTenantRootReturnTo(payload.ReturnTo); returnTo != "/" {
		data["return_to"] = returnTo
	}

	return data
}

func delegatedTenantRootLoginText(user *AdminUser, tenantHost string) string {
	tenantHost = strings.TrimSpace(tenantHost)
	actor := "platform root admin"
	if user != nil {
		if email := strings.TrimSpace(user.Email); email != "" {
			actor = email
		} else if user.ID != uuid.Nil {
			actor = user.ID.String()
		}
	}
	if tenantHost == "" {
		return fmt.Sprintf("Admin %s entered tenant workspace as root from admin console", actor)
	}
	return fmt.Sprintf("Admin %s entered tenant %s as root from admin console", actor, tenantHost)
}
