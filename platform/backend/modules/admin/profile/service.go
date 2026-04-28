package adminprofilesvc

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrUnauthorized = errors.New("admin profile unauthorized")
	ErrUserNotFound = errors.New("admin profile user not found")
	ErrUserInactive = errors.New("admin profile user inactive")
	ErrInvalidScope = errors.New("admin profile invalid scope")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetProfile(ctx context.Context) (*Profile, error) {
	claims, ok := requestctx.Claims(ctx)
	if !ok || strings.TrimSpace(claims.UserID) == "" {
		return nil, ErrUnauthorized
	}
	if !strings.Contains(" "+claims.Scope+" ", " "+authpkg.AccessScopeAdminAPI+" ") {
		return nil, ErrInvalidScope
	}

	userID, err := uuid.Parse(strings.TrimSpace(claims.UserID))
	if err != nil {
		return nil, ErrUnauthorized
	}

	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, ErrAdminUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	if !strings.EqualFold(strings.TrimSpace(user.Status), "active") {
		return nil, ErrUserInactive
	}

	return &Profile{
		User: UserProfile{
			ID:     user.ID.String(),
			Email:  user.Email,
			Phone:  user.Phone,
			Name:   user.Name,
			Level:  user.Level,
			Role:   claims.Role,
			Status: user.Status,
			Scope:  claims.Scope,
		},
	}, nil
}
