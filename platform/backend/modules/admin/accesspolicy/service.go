package adminaccesspolicy

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type RequirementKind string

const (
	RequirementSelf     RequirementKind = "self"
	RequirementRootOnly RequirementKind = "root_only"
	RequirementSection  RequirementKind = "section"
)

type Requirement struct {
	Kind       RequirementKind
	ModuleKey  string
	SectionKey string
	Access     string
}

type AdminUser struct {
	ID     uuid.UUID
	Level  int
	Status string
}

type Repository interface {
	GetAdminUserByID(ctx context.Context, userID uuid.UUID) (*AdminUser, error)
	HasSectionAccess(ctx context.Context, userID uuid.UUID, moduleKey, sectionKey, access string) (bool, error)
}

type Service struct {
	repo Repository
}

var (
	ErrUnauthorized  = errors.New("admin access policy unauthorized")
	ErrInvalidScope  = errors.New("admin access policy invalid scope")
	ErrUserNotFound  = errors.New("admin access policy user not found")
	ErrUserInactive  = errors.New("admin access policy user inactive")
	ErrForbidden     = errors.New("admin access policy forbidden")
	ErrUnmappedRoute = errors.New("admin access policy unmapped route")
)

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Authorize(ctx context.Context, claims requestctx.ClaimsInfo, req *Requirement) error {
	if strings.TrimSpace(claims.UserID) == "" {
		return ErrUnauthorized
	}
	if !strings.Contains(" "+claims.Scope+" ", " "+authpkg.AccessScopeAdminAPI+" ") {
		return ErrInvalidScope
	}

	userID, err := uuid.Parse(strings.TrimSpace(claims.UserID))
	if err != nil {
		return ErrUnauthorized
	}

	user, err := s.repo.GetAdminUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return ErrUserNotFound
		}
		return err
	}
	if !strings.EqualFold(strings.TrimSpace(user.Status), "active") {
		return ErrUserInactive
	}

	if isRootClaims(claims, user) {
		return nil
	}

	if req == nil {
		return ErrUnmappedRoute
	}

	switch req.Kind {
	case RequirementSelf:
		return nil
	case RequirementRootOnly:
		return ErrForbidden
	case RequirementSection:
		allowed, err := s.repo.HasSectionAccess(ctx, userID, req.ModuleKey, req.SectionKey, req.Access)
		if err != nil {
			return err
		}
		if !allowed {
			return ErrForbidden
		}
		return nil
	default:
		return ErrForbidden
	}
}

func isRootClaims(claims requestctx.ClaimsInfo, user *AdminUser) bool {
	if claims.Level >= 100 || strings.EqualFold(strings.TrimSpace(claims.Role), "root") {
		return true
	}
	return user != nil && user.Level >= 100
}
