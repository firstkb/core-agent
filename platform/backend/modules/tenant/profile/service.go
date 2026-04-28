package profilesvc

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
)

var (
	ErrUnauthorized  = errors.New("profile unauthorized")
	ErrTenantMissing = errors.New("profile tenant missing")
)

type TenantUserReader interface {
	GetByID(ctx context.Context, tenant requestctx.TenantInfo, userID uuid.UUID) (*authsvc.TenantUser, error)
}

type Service struct {
	users TenantUserReader
}

func NewService(users TenantUserReader) *Service {
	return &Service{users: users}
}

func (s *Service) GetProfile(ctx context.Context) (*Profile, error) {
	claims, ok := requestctx.Claims(ctx)
	if !ok || claims.UserID == "" {
		return nil, ErrUnauthorized
	}

	tenant, ok := requestctx.Tenant(ctx)
	if !ok || tenant.ID == "" {
		return nil, ErrTenantMissing
	}

	userProfile := UserProfile{
		ID:        claims.UserID,
		Email:     claims.Email,
		FirstName: strings.TrimSpace(claims.FirstName),
		LastName:  strings.TrimSpace(claims.LastName),
		Level:     claims.Level,
		Role:      claims.Role,
	}

	if s.users != nil && (userProfile.FirstName == "" || userProfile.LastName == "" || userProfile.Email == "") {
		if userID, err := uuid.Parse(strings.TrimSpace(claims.UserID)); err == nil {
			if user, err := s.users.GetByID(ctx, tenant, userID); err == nil && user != nil {
				if strings.TrimSpace(user.Email) != "" {
					userProfile.Email = user.Email
				}
				userProfile.FirstName = strings.TrimSpace(user.FirstName)
				userProfile.LastName = strings.TrimSpace(user.LastName)
				if user.Level > 0 {
					userProfile.Level = user.Level
				}
				if role := strings.TrimSpace(user.Role); role != "" {
					userProfile.Role = role
				}
			}
		}
	}

	return &Profile{
		User: userProfile,
		Tenant: TenantProfile{
			ID:     tenant.ID,
			Name:   tenant.Name,
			Host:   tenant.Host,
			Plan:   tenant.Plan,
			Status: tenant.Status,
		},
	}, nil
}
