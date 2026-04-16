package adminnavigationsvc

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type fakeRepo struct {
	user               *AdminUser
	userErr            error
	rootModules        []ModuleRecord
	rootModulesErr     error
	userModules        []ModuleRecord
	userModulesErr     error
	favoriteSurfaceIDs []string
	favoriteSurfaceErr error
	lastUserID         uuid.UUID
}

func (r *fakeRepo) GetByID(_ context.Context, userID uuid.UUID) (*AdminUser, error) {
	r.lastUserID = userID
	if r.userErr != nil {
		return nil, r.userErr
	}
	return r.user, nil
}

func (r *fakeRepo) ListRootNavigation(_ context.Context) ([]ModuleRecord, error) {
	if r.rootModulesErr != nil {
		return nil, r.rootModulesErr
	}
	return r.rootModules, nil
}

func (r *fakeRepo) ListUserNavigation(_ context.Context, userID uuid.UUID) ([]ModuleRecord, error) {
	r.lastUserID = userID
	if r.userModulesErr != nil {
		return nil, r.userModulesErr
	}
	return r.userModules, nil
}

func (r *fakeRepo) ListFavoriteSurfaceIDs(_ context.Context, userID uuid.UUID) ([]string, error) {
	r.lastUserID = userID
	if r.favoriteSurfaceErr != nil {
		return nil, r.favoriteSurfaceErr
	}
	return r.favoriteSurfaceIDs, nil
}

func TestGetNavigationReturnsRootNavigation(t *testing.T) {
	userID := uuid.New()
	moduleID := uuid.New()
	sectionID := uuid.New()
	repo := &fakeRepo{
		user: &AdminUser{
			ID:     userID,
			Email:  "admin@platform.local",
			Level:  100,
			Status: "active",
		},
		rootModules: []ModuleRecord{
			{
				ID:        moduleID,
				ModuleKey: "module_registry",
				Title:     "Module registry",
				Sections: []SectionRecord{
					{
						ID:         sectionID,
						SectionKey: "modules_list",
						Title:      "List of modules",
						RoutePath:  "/modules/list",
						Access:     "write",
					},
				},
			},
		},
		favoriteSurfaceIDs: []string{"module-registry.list"},
	}

	service := NewService(repo, func(moduleKey, sectionKey, _ string, isRoot bool) bool {
		return isRoot && moduleKey == "module_registry" && sectionKey == "modules_list"
	})
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "root",
		Level:  100,
		Scope:  "admin.api",
	})

	out, err := service.GetNavigation(ctx)
	if err != nil {
		t.Fatalf("GetNavigation returned error: %v", err)
	}
	if !out.IsRoot {
		t.Fatalf("expected root navigation")
	}
	if len(out.Modules) != 1 || len(out.Modules[0].Sections) != 1 {
		t.Fatalf("unexpected navigation shape: %+v", out)
	}
	if len(out.Favorites) != 1 || out.Favorites[0].SectionKey != "modules_list" {
		t.Fatalf("unexpected favorites shape: %+v", out.Favorites)
	}
	if out.Modules[0].Sections[0].Access != "write" {
		t.Fatalf("expected write access for root section, got %q", out.Modules[0].Sections[0].Access)
	}
}

func TestGetNavigationMapsEmployeesCollectionFavorite(t *testing.T) {
	userID := uuid.New()
	moduleID := uuid.New()
	sectionID := uuid.New()
	repo := &fakeRepo{
		user: &AdminUser{
			ID:     userID,
			Email:  "admin@platform.local",
			Level:  100,
			Status: "active",
		},
		rootModules: []ModuleRecord{
			{
				ID:        moduleID,
				ModuleKey: "users",
				Title:     "Employees",
				Icon:      "users",
				Sections: []SectionRecord{
					{
						ID:          sectionID,
						SectionKey:  "list_of_users",
						Title:       "List of Employees",
						Description: "Platform admin employee directory.",
						RoutePath:   "/admin/employees",
						Access:      "write",
					},
				},
			},
		},
		favoriteSurfaceIDs: []string{"employees.list"},
	}

	service := NewService(repo, func(moduleKey, sectionKey, _ string, isRoot bool) bool {
		return isRoot && moduleKey == "users" && sectionKey == "list_of_users"
	})
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "root",
		Level:  100,
		Scope:  "admin.api",
	})

	out, err := service.GetNavigation(ctx)
	if err != nil {
		t.Fatalf("GetNavigation returned error: %v", err)
	}
	if len(out.Favorites) != 1 {
		t.Fatalf("expected one employees favorite, got %+v", out.Favorites)
	}
	if out.Favorites[0].ModuleKey != "users" || out.Favorites[0].SectionKey != "list_of_users" {
		t.Fatalf("unexpected employees favorite %+v", out.Favorites[0])
	}
	if out.Favorites[0].RoutePath != "/admin/employees" {
		t.Fatalf("expected employees route path, got %+v", out.Favorites[0])
	}
}

func TestGetNavigationReturnsGrantedSectionsForNonRoot(t *testing.T) {
	userID := uuid.New()
	moduleID := uuid.New()
	sectionID := uuid.New()
	repo := &fakeRepo{
		user: &AdminUser{
			ID:     userID,
			Email:  "ops@platform.local",
			Level:  60,
			Status: "active",
		},
		userModules: []ModuleRecord{
			{
				ID:        moduleID,
				ModuleKey: "tenant",
				Title:     "Tenant",
				Sections: []SectionRecord{
					{
						ID:         sectionID,
						SectionKey: "list_of_tenants",
						Title:      "List of tenants",
						RoutePath:  "/admin/tenants",
						Access:     "read",
					},
				},
			},
		},
		favoriteSurfaceIDs: []string{"tenant.list"},
	}

	service := NewService(repo, func(moduleKey, sectionKey, access string, isRoot bool) bool {
		return !isRoot && moduleKey == "tenant" && sectionKey == "list_of_tenants" && access == "read"
	})
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	})

	out, err := service.GetNavigation(ctx)
	if err != nil {
		t.Fatalf("GetNavigation returned error: %v", err)
	}
	if out.IsRoot {
		t.Fatalf("expected non-root navigation")
	}
	if len(out.Modules) != 1 || out.Modules[0].ModuleKey != "tenant" {
		t.Fatalf("unexpected modules: %+v", out.Modules)
	}
	if len(out.Favorites) != 1 {
		t.Fatalf("expected one tenant favorite, got %+v", out.Favorites)
	}
	if out.Favorites[0].ModuleKey != "tenant" || out.Favorites[0].SectionKey != "list_of_tenants" {
		t.Fatalf("unexpected tenant favorite %+v", out.Favorites[0])
	}
	if out.Modules[0].Sections[0].Access != "read" {
		t.Fatalf("expected read grant, got %q", out.Modules[0].Sections[0].Access)
	}
}

func TestGetNavigationRejectsInactiveUser(t *testing.T) {
	userID := uuid.New()
	repo := &fakeRepo{
		user: &AdminUser{
			ID:     userID,
			Email:  "ops@platform.local",
			Level:  60,
			Status: "disabled",
		},
	}

	service := NewService(repo, nil)
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	})

	_, err := service.GetNavigation(ctx)
	if !errors.Is(err, ErrUserInactive) {
		t.Fatalf("expected ErrUserInactive, got %v", err)
	}
}

func TestGetNavigationRequiresAdminScope(t *testing.T) {
	service := NewService(&fakeRepo{}, nil)
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: uuid.New().String(),
		Role:   "support",
		Level:  60,
		Scope:  "tenant.api",
	})

	_, err := service.GetNavigation(ctx)
	if !errors.Is(err, ErrInvalidScope) {
		t.Fatalf("expected ErrInvalidScope, got %v", err)
	}
}

func TestGetNavigationFiltersOutUncoveredSections(t *testing.T) {
	userID := uuid.New()
	repo := &fakeRepo{
		user: &AdminUser{
			ID:     userID,
			Email:  "admin@platform.local",
			Level:  100,
			Status: "active",
		},
		rootModules: []ModuleRecord{
			{
				ID:        uuid.New(),
				ModuleKey: "tenant",
				Title:     "Tenant",
				Sections: []SectionRecord{
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
		},
		favoriteSurfaceIDs: []string{"tenant.list", "tenant.onboarding"},
	}

	service := NewService(repo, func(moduleKey, sectionKey, access string, isRoot bool) bool {
		return isRoot && moduleKey == "tenant" && sectionKey == "onboarding" && access == "write"
	})
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "root",
		Level:  100,
		Scope:  "admin.api",
	})

	out, err := service.GetNavigation(ctx)
	if err != nil {
		t.Fatalf("GetNavigation returned error: %v", err)
	}
	if len(out.Modules) != 1 || len(out.Modules[0].Sections) != 1 {
		t.Fatalf("expected exactly one covered section, got %+v", out)
	}
	if len(out.Favorites) != 0 {
		t.Fatalf("expected no favorites for unmapped tenant collection surfaces, got %+v", out.Favorites)
	}
	if out.Modules[0].Sections[0].SectionKey != "onboarding" {
		t.Fatalf("expected onboarding section, got %+v", out.Modules[0].Sections)
	}
}

func TestGetNavigationHidesWriteOnlySectionFromReadGrant(t *testing.T) {
	userID := uuid.New()
	repo := &fakeRepo{
		user: &AdminUser{
			ID:     userID,
			Email:  "ops@platform.local",
			Level:  60,
			Status: "active",
		},
		userModules: []ModuleRecord{
			{
				ID:        uuid.New(),
				ModuleKey: "tenant",
				Title:     "Tenant",
				Sections: []SectionRecord{
					{
						ID:         uuid.New(),
						SectionKey: "onboarding",
						Title:      "Onboarding",
						RoutePath:  "/admin/tenants/onboarding",
						Access:     "read",
					},
				},
			},
		},
		favoriteSurfaceIDs: []string{"tenant.onboarding"},
	}

	service := NewService(repo, func(moduleKey, sectionKey, access string, isRoot bool) bool {
		return !isRoot && moduleKey == "tenant" && sectionKey == "onboarding" && access == "write"
	})
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	})

	out, err := service.GetNavigation(ctx)
	if err != nil {
		t.Fatalf("GetNavigation returned error: %v", err)
	}
	if len(out.Modules) != 0 {
		t.Fatalf("expected no visible modules for read-only onboarding grant, got %+v", out.Modules)
	}
	if len(out.Favorites) != 0 {
		t.Fatalf("expected no visible favorites for read-only onboarding grant, got %+v", out.Favorites)
	}
}
