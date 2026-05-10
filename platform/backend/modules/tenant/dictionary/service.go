package dictionary

import (
	"context"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

const (
	defaultPage     = 1
	defaultPageSize = 10
	maxFieldCount   = 20
	maxFilterCount  = 20
	maxFilterValues = 100
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
	sourceModel := strings.TrimSpace(req.SourceModel)
	dictionary := strings.TrimSpace(req.Dictionary)
	if sourceModel == "" {
		normalizedDictionary, err := normalizeDictionaryKey(dictionary)
		if err != nil {
			return OptionsRequest{}, err
		}
		dictionary = normalizedDictionary
	} else if dictionary == "" {
		dictionary = sourceModel
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

	displayFields := normalizeFieldList(req.DisplayFields, maxFieldCount)
	searchFields := normalizeFieldList(req.SearchFields, maxFieldCount)
	filters := normalizeLookupFilters(req.Filters)

	return OptionsRequest{
		Dictionary:       dictionary,
		DisplayFields:    displayFields,
		Filters:          filters,
		IDs:              ids,
		Page:             page,
		PageSize:         pageSize,
		Search:           search,
		SearchFields:     searchFields,
		SortField:        strings.TrimSpace(req.SortField),
		SourceModel:      sourceModel,
		StoredValueField: strings.TrimSpace(req.StoredValueField),
	}, nil
}

func normalizeFieldList(values []string, max int) []string {
	out := make([]string, 0, len(values))
	seen := map[string]struct{}{}
	for _, value := range values {
		for _, part := range strings.Split(value, ",") {
			field := strings.TrimSpace(part)
			if field == "" {
				continue
			}
			if _, ok := seen[field]; ok {
				continue
			}
			seen[field] = struct{}{}
			out = append(out, field)
			if len(out) >= max {
				return out
			}
		}
	}
	return out
}

func normalizeLookupFilters(filters []LookupFilter) []LookupFilter {
	out := make([]LookupFilter, 0, len(filters))
	for _, filter := range filters {
		field := strings.TrimSpace(filter.Field)
		if field == "" {
			continue
		}

		operator := strings.ToLower(strings.TrimSpace(filter.Operator))
		if operator == "" {
			operator = "eq"
		}
		if !isSupportedLookupFilterOperator(operator) {
			continue
		}

		normalized := LookupFilter{
			Field:    field,
			Operator: operator,
		}

		if operator != "is_empty" && operator != "is_not_empty" {
			value, ok := normalizeLookupFilterValue(operator, filter.Value)
			if !ok {
				continue
			}
			normalized.Value = value
		}

		out = append(out, normalized)
		if len(out) >= maxFilterCount {
			return out
		}
	}
	return out
}

func isSupportedLookupFilterOperator(operator string) bool {
	switch operator {
	case "contains", "eq", "in", "is_empty", "is_not_empty", "not_eq", "starts_with":
		return true
	default:
		return false
	}
}

func normalizeLookupFilterValue(operator string, value any) (any, bool) {
	if value == nil {
		return nil, false
	}

	if operator == "in" {
		values := normalizeLookupFilterValueList(value)
		if len(values) == 0 {
			return nil, false
		}
		return values, true
	}

	switch typed := value.(type) {
	case bool:
		return typed, true
	case float64:
		return typed, true
	case int:
		return typed, true
	case int64:
		return typed, true
	case string:
		trimmed := strings.TrimSpace(typed)
		if trimmed == "" {
			return nil, false
		}
		if len(trimmed) > maxSearchLength {
			trimmed = trimmed[:maxSearchLength]
		}
		return trimmed, true
	default:
		return nil, false
	}
}

func normalizeLookupFilterValueList(value any) []string {
	values := []string{}
	appendValue := func(raw any) {
		if len(values) >= maxFilterValues {
			return
		}
		text := strings.TrimSpace(fmt.Sprint(raw))
		if text == "" {
			return
		}
		if len(text) > maxSearchLength {
			text = text[:maxSearchLength]
		}
		values = append(values, text)
	}

	switch typed := value.(type) {
	case []any:
		for _, entry := range typed {
			appendValue(entry)
		}
	case []string:
		for _, entry := range typed {
			appendValue(entry)
		}
	default:
		appendValue(typed)
	}
	return values
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
