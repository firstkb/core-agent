package moduleregistrymanage

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrUnauthorized       = errors.New("module registry manage unauthorized")
	ErrForbidden          = errors.New("module registry manage forbidden")
	ErrInvalidInput       = errors.New("module registry manage invalid input")
	ErrModuleKeyRequired  = errors.New("module registry manage module key required")
	ErrSectionKeyRequired = errors.New("module registry manage section key required")
	ErrTitleRequired      = errors.New("module registry manage title required")
	ErrInvalidStatus      = errors.New("module registry manage invalid status")
	ErrInvalidRoutePath   = errors.New("module registry manage invalid route path")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetModule(ctx context.Context, moduleID string) (*ModuleDetailOutput, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	moduleGUID, err := parseGUID(moduleID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	module, err := s.repo.GetModuleByGUID(ctx, moduleGUID)
	if err != nil {
		if errors.Is(err, ErrModuleNotFound) {
			return nil, ErrModuleNotFound
		}
		return nil, err
	}

	return toModuleDetailOutput(module), nil
}

func (s *Service) CreateModule(ctx context.Context, req CreateModuleInput) (*ModuleDetailOutput, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}

	params, err := normalizeCreateModuleInput(req)
	if err != nil {
		return nil, err
	}

	module, err := s.repo.CreateModule(ctx, params)
	if err != nil {
		if errors.Is(err, ErrRegistryConflict) {
			return nil, ErrRegistryConflict
		}
		return nil, err
	}

	return toModuleDetailOutput(module), nil
}

func (s *Service) UpdateModule(ctx context.Context, moduleID string, req UpdateModuleInput) (*ModuleDetailOutput, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	moduleGUID, err := parseGUID(moduleID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	params, err := normalizeUpdateModuleInput(req)
	if err != nil {
		return nil, err
	}

	module, err := s.repo.UpdateModule(ctx, moduleGUID, params)
	if err != nil {
		if errors.Is(err, ErrModuleNotFound) || errors.Is(err, ErrRegistryConflict) {
			return nil, err
		}
		return nil, err
	}

	return toModuleDetailOutput(module), nil
}

func (s *Service) ArchiveModule(ctx context.Context, moduleID string) (*MutationResult, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	moduleGUID, err := parseGUID(moduleID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	if err := s.repo.ArchiveModule(ctx, moduleGUID); err != nil {
		if errors.Is(err, ErrModuleNotFound) {
			return nil, err
		}
		return nil, err
	}
	return &MutationResult{OK: true}, nil
}

func (s *Service) SetModuleStatus(ctx context.Context, moduleIDs []string, status string) (*MutationResult, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	normalizedStatus, err := normalizeRegistryStatus(status)
	if err != nil {
		return nil, err
	}
	if len(moduleIDs) == 0 {
		return nil, ErrInvalidInput
	}

	moduleGUIDs := make([]uuid.UUID, 0, len(moduleIDs))
	for _, moduleID := range moduleIDs {
		moduleGUID, err := parseGUID(moduleID)
		if err != nil {
			return nil, ErrInvalidInput
		}
		moduleGUIDs = append(moduleGUIDs, moduleGUID)
	}

	if err := s.repo.UpdateModuleStatusBatch(ctx, moduleGUIDs, normalizedStatus); err != nil {
		return nil, err
	}

	return &MutationResult{OK: true}, nil
}

func (s *Service) CreateSection(ctx context.Context, moduleID string, req CreateSectionInput) (*SectionDetailOutput, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	moduleGUID, err := parseGUID(moduleID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	params, err := normalizeCreateSectionInput(req)
	if err != nil {
		return nil, err
	}

	section, err := s.repo.CreateSection(ctx, moduleGUID, params)
	if err != nil {
		if errors.Is(err, ErrModuleNotFound) || errors.Is(err, ErrRegistryConflict) {
			return nil, err
		}
		return nil, err
	}

	return toSectionDetailOutput(section), nil
}

func (s *Service) UpdateSection(ctx context.Context, sectionID string, req UpdateSectionInput) (*SectionDetailOutput, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	sectionGUID, err := parseGUID(sectionID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	params, err := normalizeUpdateSectionInput(req)
	if err != nil {
		return nil, err
	}

	section, err := s.repo.UpdateSection(ctx, sectionGUID, params)
	if err != nil {
		if errors.Is(err, ErrSectionNotFound) || errors.Is(err, ErrRegistryConflict) {
			return nil, err
		}
		return nil, err
	}

	return toSectionDetailOutput(section), nil
}

func (s *Service) ArchiveSection(ctx context.Context, sectionID string) (*MutationResult, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	sectionGUID, err := parseGUID(sectionID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	if err := s.repo.ArchiveSection(ctx, sectionGUID); err != nil {
		if errors.Is(err, ErrSectionNotFound) {
			return nil, err
		}
		return nil, err
	}
	return &MutationResult{OK: true}, nil
}

func (s *Service) requireRoot(ctx context.Context) (uuid.UUID, error) {
	claims, ok := requestctx.Claims(ctx)
	if !ok || strings.TrimSpace(claims.UserID) == "" {
		return uuid.Nil, ErrUnauthorized
	}
	if !scopeContains(claims.Scope, authpkg.AccessScopeAdminAPI) {
		return uuid.Nil, ErrForbidden
	}

	adminUserID, err := uuid.Parse(strings.TrimSpace(claims.UserID))
	if err != nil {
		return uuid.Nil, ErrUnauthorized
	}
	if !isRootClaims(claims) {
		return uuid.Nil, ErrForbidden
	}

	return adminUserID, nil
}

func isRootClaims(claims requestctx.ClaimsInfo) bool {
	if claims.Level >= 100 {
		return true
	}
	return strings.EqualFold(strings.TrimSpace(claims.Role), "root")
}

func scopeContains(raw, expected string) bool {
	for _, value := range strings.Fields(strings.TrimSpace(raw)) {
		if value == expected {
			return true
		}
	}
	return false
}

func parseGUID(value string) (uuid.UUID, error) {
	return uuid.Parse(strings.TrimSpace(value))
}

func normalizeCreateModuleInput(req CreateModuleInput) (createModuleParams, error) {
	moduleKey, err := normalizeRegistryKey(req.ModuleKey)
	if err != nil {
		return createModuleParams{}, ErrModuleKeyRequired
	}
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return createModuleParams{}, ErrTitleRequired
	}
	status, err := normalizeRegistryStatus(req.Status)
	if err != nil {
		return createModuleParams{}, err
	}

	return createModuleParams{
		ModuleKey:   moduleKey,
		Title:       title,
		Description: strings.TrimSpace(req.Description),
		Icon:        strings.TrimSpace(req.Icon),
		SortOrder:   normalizeSortOrder(req.SortOrder),
		Status:      status,
	}, nil
}

func normalizeUpdateModuleInput(req UpdateModuleInput) (updateModuleParams, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return updateModuleParams{}, ErrTitleRequired
	}
	status, err := normalizeRegistryStatus(req.Status)
	if err != nil {
		return updateModuleParams{}, err
	}

	return updateModuleParams{
		Title:       title,
		Description: strings.TrimSpace(req.Description),
		Icon:        strings.TrimSpace(req.Icon),
		SortOrder:   normalizeSortOrder(req.SortOrder),
		Status:      status,
	}, nil
}

func normalizeCreateSectionInput(req CreateSectionInput) (createSectionParams, error) {
	sectionKey, err := normalizeRegistryKey(req.SectionKey)
	if err != nil {
		return createSectionParams{}, ErrSectionKeyRequired
	}
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return createSectionParams{}, ErrTitleRequired
	}
	status, err := normalizeRegistryStatus(req.Status)
	if err != nil {
		return createSectionParams{}, err
	}
	routePath, err := normalizeRoutePath(req.RoutePath)
	if err != nil {
		return createSectionParams{}, err
	}

	return createSectionParams{
		SectionKey:  sectionKey,
		Title:       title,
		Description: strings.TrimSpace(req.Description),
		RoutePath:   routePath,
		SortOrder:   normalizeSortOrder(req.SortOrder),
		Status:      status,
	}, nil
}

func normalizeUpdateSectionInput(req UpdateSectionInput) (updateSectionParams, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return updateSectionParams{}, ErrTitleRequired
	}
	status, err := normalizeRegistryStatus(req.Status)
	if err != nil {
		return updateSectionParams{}, err
	}
	routePath, err := normalizeRoutePath(req.RoutePath)
	if err != nil {
		return updateSectionParams{}, err
	}

	return updateSectionParams{
		Title:       title,
		Description: strings.TrimSpace(req.Description),
		RoutePath:   routePath,
		SortOrder:   normalizeSortOrder(req.SortOrder),
		Status:      status,
	}, nil
}

func normalizeRegistryKey(value string) (string, error) {
	key := strings.TrimSpace(strings.ToLower(value))
	key = strings.ReplaceAll(key, "-", "_")
	key = strings.ReplaceAll(key, " ", "_")
	if key == "" {
		return "", fmt.Errorf("empty key")
	}
	for _, ch := range key {
		if (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_' {
			continue
		}
		return "", fmt.Errorf("invalid key")
	}
	return key, nil
}

func normalizeRegistryStatus(value string) (string, error) {
	status := strings.TrimSpace(strings.ToLower(value))
	if status == "" {
		return "active", nil
	}
	switch status {
	case "active", "planned", "archived":
		return status, nil
	default:
		return "", ErrInvalidStatus
	}
}

func normalizeSortOrder(value int) int {
	if value <= 0 {
		return 100
	}
	return value
}

func normalizeRoutePath(value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", nil
	}
	if !strings.HasPrefix(trimmed, "/") {
		return "", ErrInvalidRoutePath
	}
	return trimmed, nil
}

func toModuleDetailOutput(record *ModuleRecord) *ModuleDetailOutput {
	if record == nil {
		return nil
	}

	sections := make([]SectionDetailOutput, 0, len(record.Sections))
	for _, section := range record.Sections {
		sections = append(sections, *toSectionDetailOutput(&section))
	}

	return &ModuleDetailOutput{
		ID:          record.GUID.String(),
		ModuleKey:   record.ModuleKey,
		Title:       record.Title,
		Description: record.Description,
		Icon:        record.Icon,
		SortOrder:   record.SortOrder,
		Status:      record.Status,
		CreatedAt:   record.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   record.UpdatedAt.Format(time.RFC3339),
		Sections:    sections,
	}
}

func toSectionDetailOutput(record *SectionRecord) *SectionDetailOutput {
	if record == nil {
		return nil
	}
	return &SectionDetailOutput{
		ID:          record.GUID.String(),
		ModuleID:    record.ModuleGUID.String(),
		SectionKey:  record.SectionKey,
		Title:       record.Title,
		Description: record.Description,
		RoutePath:   record.RoutePath,
		SortOrder:   record.SortOrder,
		Status:      record.Status,
		CreatedAt:   record.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   record.UpdatedAt.Format(time.RFC3339),
	}
}
