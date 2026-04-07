package server

import (
	"context"
	"crypto/rsa"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	jwtlegacy "github.com/golang-jwt/jwt"
	"github.com/google/uuid"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	adminaccesspolicy "dtriton.com/platform/backend/modules/admin/accesspolicy"
)

type fakeAccessRepo struct {
	user    *adminaccesspolicy.AdminUser
	allowed bool
}

type fakeTokenValidator struct{}

func (r *fakeAccessRepo) GetAdminUserByID(_ context.Context, _ uuid.UUID) (*adminaccesspolicy.AdminUser, error) {
	return r.user, nil
}

func (r *fakeAccessRepo) HasSectionAccess(_ context.Context, _ uuid.UUID, _, _, _ string) (bool, error) {
	return r.allowed, nil
}

func (fakeTokenValidator) ValidateToken(token string) (*authpkg.JWTClaims, error) {
	return &authpkg.JWTClaims{}, nil
}

func (fakeTokenValidator) IssueToken(_ *authpkg.JWTClaims) (string, error) {
	return "", nil
}

func (fakeTokenValidator) GetPublicKey() (*rsa.PublicKey, error) {
	return nil, nil
}

func (fakeTokenValidator) GetKeyID() string {
	return "test"
}

func TestRoutePolicyForAdminAPI(t *testing.T) {
	profile := routePolicyForAdminAPI("ADMIN_PROFILE_GET")
	if profile == nil || profile.requirement == nil || profile.requirement.Kind != adminaccesspolicy.RequirementSelf {
		t.Fatalf("expected self policy for profile route")
	}

	tenantCreate := routePolicyForAdminAPI("ADMIN_TENANT_CREATE")
	if tenantCreate == nil || tenantCreate.requirement == nil {
		t.Fatalf("expected policy for tenant create route")
	}
	if tenantCreate.requirement.ModuleKey != "tenant" || tenantCreate.requirement.SectionKey != "onboarding" || tenantCreate.requirement.Access != "write" {
		t.Fatalf("unexpected tenant route policy %+v", tenantCreate.requirement)
	}

	moduleRegistry := routePolicyForAdminAPI("ADMIN_MODULE_REGISTRY_META_GET")
	if moduleRegistry == nil || moduleRegistry.requirement == nil || moduleRegistry.requirement.Kind != adminaccesspolicy.RequirementRootOnly {
		t.Fatalf("expected root-only policy for module registry route")
	}

	employeesList := routePolicyForAdminAPI("ADMIN_EMPLOYEES_LIST_META_GET")
	if employeesList == nil || employeesList.requirement == nil || employeesList.requirement.Kind != adminaccesspolicy.RequirementRootOnly {
		t.Fatalf("expected root-only policy for employees list route")
	}

	employeesUpdate := routePolicyForAdminAPI("ADMIN_EMPLOYEES_UPDATE")
	if employeesUpdate == nil || employeesUpdate.requirement == nil || employeesUpdate.requirement.Kind != adminaccesspolicy.RequirementRootOnly {
		t.Fatalf("expected root-only policy for employees update route")
	}

	if policy := routePolicyForAdminAPI("UNKNOWN_SECURE_ROUTE"); policy != nil {
		t.Fatalf("expected nil policy for unknown route, got %+v", policy)
	}
}

func TestAdminAccessPolicyMiddlewareAllowsSelfRoute(t *testing.T) {
	userID := uuid.New()
	srv := &Server{
		logger:            slog.New(slog.NewTextHandler(io.Discard, nil)),
		adminAccessPolicy: adminaccesspolicy.NewService(&fakeAccessRepo{user: &adminaccesspolicy.AdminUser{ID: userID, Level: 60, Status: "active"}}),
	}

	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodGet, "/app/profile", nil)
	req = req.WithContext(requestctx.WithRoute(req.Context(), requestctx.RouteInfo{
		Tier: router.TierSecure,
		ID:   "ADMIN_PROFILE_GET",
	}))
	req = req.WithContext(requestctx.WithClaims(req.Context(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	}))

	rr := httptest.NewRecorder()
	srv.adminAccessPolicyMiddleware(next).ServeHTTP(rr, req)

	if !nextCalled {
		t.Fatalf("expected next handler to be called")
	}
	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rr.Code)
	}
}

func TestAdminAccessPolicyMiddlewareRejectsUnmappedNonRoot(t *testing.T) {
	userID := uuid.New()
	srv := &Server{
		logger:            slog.New(slog.NewTextHandler(io.Discard, nil)),
		adminAccessPolicy: adminaccesspolicy.NewService(&fakeAccessRepo{user: &adminaccesspolicy.AdminUser{ID: userID, Level: 60, Status: "active"}}),
	}

	req := httptest.NewRequest(http.MethodGet, "/app/unknown", nil)
	req = req.WithContext(requestctx.WithRoute(req.Context(), requestctx.RouteInfo{
		Tier: router.TierSecure,
		ID:   "ADMIN_UNKNOWN_GET",
	}))
	req = req.WithContext(requestctx.WithClaims(req.Context(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	}))

	rr := httptest.NewRecorder()
	srv.adminAccessPolicyMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})).ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "ADMIN_ACCESS_UNMAPPED_ROUTE") {
		t.Fatalf("expected unmapped route code, got %q", rr.Body.String())
	}
}

func TestAdminAccessPolicyMiddlewareRejectsSectionWithoutGrant(t *testing.T) {
	userID := uuid.New()
	srv := &Server{
		logger:            slog.New(slog.NewTextHandler(io.Discard, nil)),
		adminAccessPolicy: adminaccesspolicy.NewService(&fakeAccessRepo{user: &adminaccesspolicy.AdminUser{ID: userID, Level: 60, Status: "active"}, allowed: false}),
	}

	req := httptest.NewRequest(http.MethodPost, "/app/admin/tenants", nil)
	req = req.WithContext(requestctx.WithRoute(req.Context(), requestctx.RouteInfo{
		Tier: router.TierSecure,
		ID:   "ADMIN_TENANT_CREATE",
	}))
	req = req.WithContext(requestctx.WithClaims(req.Context(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	}))

	rr := httptest.NewRecorder()
	srv.adminAccessPolicyMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})).ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "ADMIN_ACCESS_FORBIDDEN") {
		t.Fatalf("expected forbidden code, got %q", rr.Body.String())
	}
}

func TestBuildHTTPHandlerPopulatesClaimsBeforeAccessPolicy(t *testing.T) {
	userID := uuid.New()
	srv := &Server{
		logger: slog.New(slog.NewTextHandler(io.Discard, nil)),
		config: &Config{
			Timeout: 30,
			Token: TokenConfig{
				Source:   "bearer",
				Validate: "internal",
			},
		},
		classifier: router.NewClassifier([]router.Route{{
			ID:     "ADMIN_PROFILE_GET",
			Method: http.MethodGet,
			Path:   "GET /app/profile",
			URI:    "/app/profile",
			Tier:   router.TierSecure,
		}}),
		tokenValidator:    fakeTokenValidator{},
		adminAccessPolicy: adminaccesspolicy.NewService(&fakeAccessRepo{user: &adminaccesspolicy.AdminUser{ID: userID, Level: 60, Status: "active"}}),
	}

	nextCalled := false
	handler := srv.buildHTTPHandler(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusNoContent)
	}))

	token := jwtlegacy.NewWithClaims(jwtlegacy.SigningMethodHS256, jwtlegacy.MapClaims{
		"sub":   userID.String(),
		"email": "admin@platform.local",
		"level": 60,
		"role":  "root",
		"scope": authpkg.AccessScopeAdminAPI,
	})
	tokenString, err := token.SignedString([]byte("secret"))
	if err != nil {
		t.Fatalf("SignedString: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/app/profile", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if !nextCalled {
		t.Fatalf("expected next handler to be called")
	}
	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d body=%q", rr.Code, rr.Body.String())
	}
}
