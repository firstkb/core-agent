package profilesvc

import (
	"context"
	"errors"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrUnauthorized  = errors.New("profile unauthorized")
	ErrTenantMissing = errors.New("profile tenant missing")
)

type Service struct{}

func NewService() *Service {
	return &Service{}
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

	return &Profile{
		User: UserProfile{
			ID:    claims.UserID,
			Email: claims.Email,
			Level: claims.Level,
			Role:  claims.Role,
		},
		Tenant: TenantProfile{
			ID:     tenant.ID,
			Host:   tenant.Host,
			Plan:   tenant.Plan,
			Status: tenant.Status,
		},
	}, nil
}
