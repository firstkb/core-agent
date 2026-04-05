package server

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	adminaccesspolicy "dtriton.com/platform/backend/modules/admin/accesspolicy"
	adminnavigationsvc "dtriton.com/platform/backend/modules/admin/navigation"
)

type fakeNavigationRepo struct {
	user               *adminnavigationsvc.AdminUser
	userErr            error
	favoriteSurfaceIDs []string
	favoriteSurfaceErr error
	userModules        []adminnavigationsvc.ModuleRecord
}

func (r *fakeNavigationRepo) GetByID(_ context.Context, _ uuid.UUID) (*adminnavigationsvc.AdminUser, error) {
	if r.userErr != nil {
		return nil, r.userErr
	}
	return r.user, nil
}

func (r *fakeNavigationRepo) ListRootNavigation(_ context.Context) ([]adminnavigationsvc.ModuleRecord, error) {
	return nil, nil
}

func (r *fakeNavigationRepo) ListUserNavigation(_ context.Context, _ uuid.UUID) ([]adminnavigationsvc.ModuleRecord, error) {
	return r.userModules, nil
}

func (r *fakeNavigationRepo) ListFavoriteSurfaceIDs(_ context.Context, _ uuid.UUID) ([]string, error) {
	return r.favoriteSurfaceIDs, r.favoriteSurfaceErr
}

func TestPhase5GrantedNonRootRolloutSlice(t *testing.T) {
	userID := uuid.New()

	navRepo := &fakeNavigationRepo{
		user: &adminnavigationsvc.AdminUser{
			ID:     userID,
			Email:  "ops@platform.local",
			Level:  60,
			Status: "active",
		},
		userModules: []adminnavigationsvc.ModuleRecord{
			{
				ID:        uuid.New(),
				ModuleKey: "tenant",
				Title:     "Tenant",
				Sections: []adminnavigationsvc.SectionRecord{
					{
						ID:         uuid.New(),
						SectionKey: "list_of_tenants",
						Title:      "List of tenants",
						RoutePath:  "/admin/tenants",
						Access:     "write",
					},
					{
						ID:         uuid.New(),
						SectionKey: "onboarding",
						Title:      "Onboarding",
						RoutePath:  "/admin/tenants/onboarding",
						Access:     "write",
					},
				},
			},
			{
				ID:        uuid.New(),
				ModuleKey: "module_registry",
				Title:     "Module registry",
				Sections: []adminnavigationsvc.SectionRecord{
					{
						ID:         uuid.New(),
						SectionKey: "modules_list",
						Title:      "List of modules",
						RoutePath:  "/modules/list",
						Access:     "write",
					},
				},
			},
		},
	}

	navigationService := adminnavigationsvc.NewService(navRepo, adminaccesspolicy.AllowsSectionNavigation)
	claims := requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	}
	ctx := requestctx.WithClaims(context.Background(), claims)

	nav, err := navigationService.GetNavigation(ctx)
	if err != nil {
		t.Fatalf("GetNavigation returned error: %v", err)
	}
	if len(nav.Modules) != 1 || nav.Modules[0].ModuleKey != "tenant" {
		t.Fatalf("expected only tenant module in navigation, got %+v", nav.Modules)
	}
	if len(nav.Modules[0].Sections) != 1 || nav.Modules[0].Sections[0].SectionKey != "onboarding" {
		t.Fatalf("expected only onboarding section, got %+v", nav.Modules[0].Sections)
	}

	srv := &Server{
		logger:            slog.New(slog.NewTextHandler(io.Discard, nil)),
		adminAccessPolicy: adminaccesspolicy.NewService(&fakeAccessRepo{user: &adminaccesspolicy.AdminUser{ID: userID, Level: 60, Status: "active"}, allowed: true}),
	}

	allowedReq := httptest.NewRequest(http.MethodPost, "/app/admin/tenants", nil)
	allowedReq = allowedReq.WithContext(requestctx.WithRoute(allowedReq.Context(), requestctx.RouteInfo{
		Tier: router.TierSecure,
		ID:   "ADMIN_TENANT_CREATE",
	}))
	allowedReq = allowedReq.WithContext(requestctx.WithClaims(allowedReq.Context(), claims))

	allowedRR := httptest.NewRecorder()
	srv.adminAccessPolicyMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})).ServeHTTP(allowedRR, allowedReq)

	if allowedRR.Code != http.StatusNoContent {
		t.Fatalf("expected allowed onboarding route, got %d body=%q", allowedRR.Code, allowedRR.Body.String())
	}

	deniedReq := httptest.NewRequest(http.MethodGet, "/app/admin/module-registry/list/meta", nil)
	deniedReq = deniedReq.WithContext(requestctx.WithRoute(deniedReq.Context(), requestctx.RouteInfo{
		Tier: router.TierSecure,
		ID:   "ADMIN_MODULE_REGISTRY_META_GET",
	}))
	deniedReq = deniedReq.WithContext(requestctx.WithClaims(deniedReq.Context(), claims))

	deniedRR := httptest.NewRecorder()
	srv.adminAccessPolicyMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})).ServeHTTP(deniedRR, deniedReq)

	if deniedRR.Code != http.StatusForbidden {
		t.Fatalf("expected module registry route to be forbidden, got %d body=%q", deniedRR.Code, deniedRR.Body.String())
	}
}
