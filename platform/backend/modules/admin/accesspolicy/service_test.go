package adminaccesspolicy

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type fakeRepo struct {
	user      *AdminUser
	userErr   error
	allowed   bool
	accessErr error
	last      struct {
		userID     uuid.UUID
		moduleKey  string
		sectionKey string
		access     string
	}
}

func (r *fakeRepo) GetAdminUserByID(_ context.Context, userID uuid.UUID) (*AdminUser, error) {
	r.last.userID = userID
	if r.userErr != nil {
		return nil, r.userErr
	}
	return r.user, nil
}

func (r *fakeRepo) HasSectionAccess(_ context.Context, userID uuid.UUID, moduleKey, sectionKey, access string) (bool, error) {
	r.last.userID = userID
	r.last.moduleKey = moduleKey
	r.last.sectionKey = sectionKey
	r.last.access = access
	if r.accessErr != nil {
		return false, r.accessErr
	}
	return r.allowed, nil
}

func TestAuthorizeAllowsRootBypass(t *testing.T) {
	repo := &fakeRepo{
		user: &AdminUser{ID: uuid.New(), Level: 100, Status: "active"},
	}
	service := NewService(repo)
	claims := requestctx.ClaimsInfo{
		UserID: repo.user.ID.String(),
		Role:   "root",
		Level:  100,
		Scope:  "admin.api",
	}

	err := service.Authorize(context.Background(), claims, &Requirement{
		Kind:       RequirementSection,
		ModuleKey:  "tenant",
		SectionKey: "list_of_tenants",
		Access:     "write",
	})
	if err != nil {
		t.Fatalf("Authorize returned error: %v", err)
	}
	if repo.last.moduleKey != "" {
		t.Fatalf("root should bypass section access lookup")
	}
}

func TestAuthorizeAllowsGrantedRead(t *testing.T) {
	userID := uuid.New()
	repo := &fakeRepo{
		user:    &AdminUser{ID: userID, Level: 60, Status: "active"},
		allowed: true,
	}
	service := NewService(repo)

	err := service.Authorize(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	}, &Requirement{
		Kind:       RequirementSection,
		ModuleKey:  "tenant",
		SectionKey: "list_of_tenants",
		Access:     "read",
	})
	if err != nil {
		t.Fatalf("Authorize returned error: %v", err)
	}
	if repo.last.moduleKey != "tenant" || repo.last.sectionKey != "list_of_tenants" || repo.last.access != "read" {
		t.Fatalf("unexpected access lookup %+v", repo.last)
	}
}

func TestAuthorizeRejectsWriteWithoutGrant(t *testing.T) {
	userID := uuid.New()
	repo := &fakeRepo{
		user:    &AdminUser{ID: userID, Level: 60, Status: "active"},
		allowed: false,
	}
	service := NewService(repo)

	err := service.Authorize(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	}, &Requirement{
		Kind:       RequirementSection,
		ModuleKey:  "tenant",
		SectionKey: "list_of_tenants",
		Access:     "write",
	})
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestAuthorizeRejectsInactiveUser(t *testing.T) {
	userID := uuid.New()
	repo := &fakeRepo{
		user: &AdminUser{ID: userID, Level: 60, Status: "disabled"},
	}
	service := NewService(repo)

	err := service.Authorize(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	}, &Requirement{Kind: RequirementSelf})
	if !errors.Is(err, ErrUserInactive) {
		t.Fatalf("expected ErrUserInactive, got %v", err)
	}
}

func TestAuthorizeRejectsUnmappedRouteForNonRoot(t *testing.T) {
	userID := uuid.New()
	repo := &fakeRepo{
		user: &AdminUser{ID: userID, Level: 60, Status: "active"},
	}
	service := NewService(repo)

	err := service.Authorize(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "support",
		Level:  60,
		Scope:  "admin.api",
	}, nil)
	if !errors.Is(err, ErrUnmappedRoute) {
		t.Fatalf("expected ErrUnmappedRoute, got %v", err)
	}
}
