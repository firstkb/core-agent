package dictionarysvc

import (
	"context"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

const (
	defaultPage     = 1
	defaultPageSize = 25
	maxIDs          = 100
	maxPageSize     = 100
	maxSearchLength = 120
)

type Repository interface {
	ListOptions(ctx context.Context, tenant requestctx.TenantInfo, req OptionsRequest) (*OptionsResponse, error)
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListOptions(ctx context.Context, req OptionsRequest) (*OptionsResponse, error) {
	tenant, _, err := requireContext(ctx)
	if err != nil {
		return nil, err
	}

	normalized, err := normalizeOptionsRequest(req)
	if err != nil {
		return nil, err
	}

	return s.repo.ListOptions(ctx, tenant, normalized)
}

func requireContext(ctx context.Context) (requestctx.TenantInfo, requestctx.ClaimsInfo, error) {
	claims, ok := requestctx.Claims(ctx)
	if !ok || strings.TrimSpace(claims.UserID) == "" {
		return requestctx.TenantInfo{}, requestctx.ClaimsInfo{}, ErrUnauthorized
	}

	tenant, ok := requestctx.Tenant(ctx)
	if !ok || strings.TrimSpace(tenant.ID) == "" {
		return requestctx.TenantInfo{}, requestctx.ClaimsInfo{}, ErrTenantMissing
	}

	return tenant, claims, nil
}

func normalizeOptionsRequest(req OptionsRequest) (OptionsRequest, error) {
	dictionary, err := normalizeDictionaryKey(req.Dictionary)
	if err != nil {
		return OptionsRequest{}, err
	}

	page := req.Page
	if page < 1 {
		page = defaultPage
	}
	pageSize := req.PageSize
	if pageSize < 1 {
		pageSize = defaultPageSize
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}

	ids := make([]string, 0, len(req.IDs))
	seen := map[string]struct{}{}
	for _, value := range req.IDs {
		for _, part := range strings.Split(value, ",") {
			id := strings.TrimSpace(part)
			if id == "" {
				continue
			}
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			ids = append(ids, id)
			if len(ids) >= maxIDs {
				break
			}
		}
		if len(ids) >= maxIDs {
			break
		}
	}

	search := strings.TrimSpace(req.Search)
	if len(search) > maxSearchLength {
		search = search[:maxSearchLength]
	}

	return OptionsRequest{
		Dictionary: dictionary,
		IDs:        ids,
		Page:       page,
		PageSize:   pageSize,
		Search:     search,
	}, nil
}

func normalizeDictionaryKey(value string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "businessunit", "businessunits", "companies", "company", "maincompanies", "maincompany":
		return "companies", nil
	case "businessunittype", "businessunittypes", "companytype", "companytypes":
		return "companyTypes", nil
	case "contact", "contacts", "users":
		return "contacts", nil
	case "contactjobtype", "contactjobtypes", "jobtype", "jobtypes":
		return "jobtypes", nil
	case "project", "projects":
		return "projects", nil
	default:
		return "", ErrInvalidDictionary
	}
}
