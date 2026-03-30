package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	jwtlegacy "github.com/golang-jwt/jwt"

	"dtriton.com/platform/backend/internal/platform/httpx/claims"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type Claim struct {
	TenantID string
	UserID   string
	Email    string
	Phone    string
	Level    int
	Role     string
	Scope    string
	Claims   jwtlegacy.MapClaims
}

const (
	HeaderAuthTenantID = "X-Auth-Tenant-Id"
	HeaderAuthUserID   = "X-Auth-User-Id"
	HeaderAuthEmail    = "X-Auth-Email"
	HeaderAuthPhone    = "X-Auth-Phone"
	HeaderAuthLevel    = "X-Auth-Level"
	HeaderAuthRole     = "X-Auth-Role"
	HeaderAuthScope    = "X-Auth-Scope"
)

func GetClaim(ctx context.Context) (*Claim, error) {
	if ctx == nil {
		return nil, errors.New("no claim in context")
	}

	if rc, ok := requestctx.Claims(ctx); ok {
		return &Claim{
			TenantID: rc.TenantID,
			UserID:   rc.UserID,
			Email:    rc.Email,
			Phone:    rc.Phone,
			Level:    int(rc.Level),
			Role:     string(rc.Role),
			Scope:    rc.Scope,
		}, nil
	}

	if raw := claims.FromContext(ctx); raw != nil {
		if c, ok := raw.(*Claim); ok && c != nil {
			return c, nil
		}
	}

	return nil, errors.New("no claim in context")
}

func CreateContextWithClaim(r *http.Request) (context.Context, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, errors.New("authorization header missing")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 {
		return nil, errors.New("authorization header must be formatted as 'Bearer token'")
	}
	if parts[0] != "Bearer" {
		return nil, errors.New("authorization header must start with Bearer")
	}

	tokenString := parts[1]
	if tokenString == "" {
		return nil, errors.New("token cannot be empty")
	}

	token, _, err := new(jwtlegacy.Parser).ParseUnverified(tokenString, jwtlegacy.MapClaims{})
	if err != nil {
		return nil, errors.New("invalid token")
	}

	jwtClaims, ok := token.Claims.(jwtlegacy.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	claim, err := buildClaim(jwtClaims)
	if err != nil {
		return nil, err
	}

	ctx := requestctx.WithClaims(r.Context(), requestctx.ClaimsInfo{
		TenantID: claim.TenantID,
		UserID:   claim.UserID,
		Email:    claim.Email,
		Phone:    claim.Phone,
		Level:    claim.Level,
		Role:     claim.Role,
		Scope:    claim.Scope,
	})

	return ctx, nil
}

func CreateContextWithTrustedHeaders(r *http.Request) (context.Context, error) {
	userID := strings.TrimSpace(r.Header.Get(HeaderAuthUserID))
	if userID == "" {
		return nil, fmt.Errorf("trusted header %s missing", HeaderAuthUserID)
	}

	level, err := parseRequiredIntHeader(r, HeaderAuthLevel)
	if err != nil {
		return nil, err
	}

	email := strings.TrimSpace(r.Header.Get(HeaderAuthEmail))
	phone := strings.TrimSpace(r.Header.Get(HeaderAuthPhone))
	if email == "" && phone == "" {
		return nil, errors.New("trusted headers must include email or phone")
	}

	scope := strings.TrimSpace(r.Header.Get(HeaderAuthScope))
	tenantID := strings.TrimSpace(r.Header.Get(HeaderAuthTenantID))
	if tenantID == "" && !strings.Contains(" "+scope+" ", " "+AccessScopeAdminAPI+" ") {
		return nil, fmt.Errorf("trusted header %s missing", HeaderAuthTenantID)
	}

	ctx := requestctx.WithClaims(r.Context(), requestctx.ClaimsInfo{
		TenantID: tenantID,
		UserID:   userID,
		Email:    email,
		Phone:    phone,
		Level:    level,
		Role:     strings.TrimSpace(r.Header.Get(HeaderAuthRole)),
		Scope:    scope,
	})

	return ctx, nil
}

func buildClaim(jwtClaims jwtlegacy.MapClaims) (*Claim, error) {
	tenantID, email, phone, userID, level, role, scope, err := parseSelfClaims(jwtClaims)
	if err != nil {
		return nil, err
	}

	return &Claim{
		TenantID: tenantID,
		UserID:   userID,
		Email:    email,
		Phone:    phone,
		Level:    level,
		Role:     role,
		Scope:    scope,
		Claims:   jwtClaims,
	}, nil
}

func parseSelfClaims(jwtClaims jwtlegacy.MapClaims) (string, string, string, string, int, string, string, error) {
	userID, err := mustStringClaim(jwtClaims, "sub")
	if err != nil {
		return "", "", "", "", 0, "", "", err
	}
	level, err := mustIntClaim(jwtClaims, "level")
	if err != nil {
		return "", "", "", "", 0, "", "", err
	}

	email := stringClaim(jwtClaims, "email")
	phone := stringClaim(jwtClaims, "phone")
	if email == "" && phone == "" {
		return "", "", "", "", 0, "", "", errors.New("claim email or phone not found in token")
	}

	role := stringClaim(jwtClaims, "role")
	scope := stringClaim(jwtClaims, "scope")
	tenantID := stringClaim(jwtClaims, "tenant_id")
	if tenantID == "" && !strings.Contains(" "+scope+" ", " "+AccessScopeAdminAPI+" ") {
		return "", "", "", "", 0, "", "", errors.New("claim tenant_id not found in token")
	}
	return tenantID, email, phone, userID, level, role, scope, nil
}

func mustStringClaim(m jwtlegacy.MapClaims, key string) (string, error) {
	value := stringClaim(m, key)
	if value == "" {
		return "", fmt.Errorf("claim %s not found in token", key)
	}
	return value, nil
}

func mustIntClaim(m jwtlegacy.MapClaims, key string) (int, error) {
	value := intClaim(m, key)
	if value == 0 {
		return 0, fmt.Errorf("claim %s not found in token", key)
	}
	return value, nil
}

func stringClaim(m jwtlegacy.MapClaims, key string) string {
	if v, ok := m[key].(string); ok {
		return strings.TrimSpace(v)
	}
	return ""
}

func intClaim(m jwtlegacy.MapClaims, key string) int {
	switch v := m[key].(type) {
	case int:
		return v
	case float64:
		return int(v)
	default:
		return 0
	}
}

func parseRequiredIntHeader(r *http.Request, header string) (int, error) {
	value := strings.TrimSpace(r.Header.Get(header))
	if value == "" {
		return 0, fmt.Errorf("trusted header %s missing", header)
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("trusted header %s invalid", header)
	}
	return parsed, nil
}
