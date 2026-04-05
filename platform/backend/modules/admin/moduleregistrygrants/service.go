package moduleregistrygrants

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrUnauthorized        = errors.New("module registry grants unauthorized")
	ErrForbidden           = errors.New("module registry grants forbidden")
	ErrInvalidInput        = errors.New("module registry grants invalid input")
	ErrInvalidGrantAccess  = errors.New("module registry grants invalid grant access")
	ErrGrantTargetRoot     = errors.New("module registry grants grant target root")
	ErrGrantTargetInactive = errors.New("module registry grants grant target inactive")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListSectionGrants(ctx context.Context, sectionID string) (*SectionGrantListOutput, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	sectionGUID, err := parseGUID(sectionID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	record, err := s.repo.ListSectionGrants(ctx, sectionGUID)
	if err != nil {
		if errors.Is(err, ErrSectionNotFound) {
			return nil, err
		}
		return nil, err
	}

	grants := make([]SectionGrantOutput, 0, len(record.Grants))
	for _, grant := range record.Grants {
		grants = append(grants, *toSectionGrantOutput(&grant))
	}

	return &SectionGrantListOutput{
		Section: *toSectionDetailOutput(&record.Section),
		Grants:  grants,
	}, nil
}

func (s *Service) UpsertSectionGrant(ctx context.Context, sectionID, adminUserID string, req UpsertSectionGrantInput) (*SectionGrantOutput, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	sectionGUID, adminGUID, access, _, err := s.normalizeGrantUpsert(ctx, sectionID, adminUserID, req)
	if err != nil {
		return nil, err
	}

	grant, err := s.repo.UpsertSectionGrant(ctx, sectionGUID, adminGUID, access)
	if err != nil {
		if errors.Is(err, ErrSectionNotFound) || errors.Is(err, ErrRegistryConflict) {
			return nil, err
		}
		return nil, err
	}

	return toSectionGrantOutput(grant), nil
}

func (s *Service) RevokeSectionGrant(ctx context.Context, sectionID, adminUserID string) (*MutationResult, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	sectionGUID, err := parseGUID(sectionID)
	if err != nil {
		return nil, ErrInvalidInput
	}
	adminGUID, err := parseGUID(adminUserID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	if err := s.repo.RevokeSectionGrant(ctx, sectionGUID, adminGUID); err != nil {
		return nil, err
	}
	return &MutationResult{OK: true}, nil
}

func (s *Service) UpsertModuleGrants(ctx context.Context, moduleID, adminUserID string, req UpsertSectionGrantInput) (*GrantMutationOutput, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	moduleGUID, adminGUID, access, _, err := s.normalizeGrantUpsert(ctx, moduleID, adminUserID, req)
	if err != nil {
		return nil, err
	}

	module, err := s.repo.GetModuleByGUID(ctx, moduleGUID)
	if err != nil {
		if errors.Is(err, ErrModuleNotFound) {
			return nil, err
		}
		return nil, err
	}

	applied := 0
	for _, section := range module.Sections {
		if strings.EqualFold(strings.TrimSpace(section.Status), "archived") {
			continue
		}
		if _, err := s.repo.UpsertSectionGrant(ctx, section.GUID, adminGUID, access); err != nil {
			return nil, err
		}
		applied++
	}

	return &GrantMutationOutput{OK: true, AppliedCount: applied}, nil
}

func (s *Service) RevokeModuleGrants(ctx context.Context, moduleID, adminUserID string) (*GrantMutationOutput, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	moduleGUID, err := parseGUID(moduleID)
	if err != nil {
		return nil, ErrInvalidInput
	}
	adminGUID, err := parseGUID(adminUserID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	module, err := s.repo.GetModuleByGUID(ctx, moduleGUID)
	if err != nil {
		if errors.Is(err, ErrModuleNotFound) {
			return nil, err
		}
		return nil, err
	}

	applied := 0
	for _, section := range module.Sections {
		if err := s.repo.RevokeSectionGrant(ctx, section.GUID, adminGUID); err != nil {
			return nil, err
		}
		applied++
	}

	return &GrantMutationOutput{OK: true, AppliedCount: applied}, nil
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

func normalizeGrantAccess(value string) (string, error) {
	access := strings.TrimSpace(strings.ToLower(value))
	switch access {
	case "read", "write":
		return access, nil
	default:
		return "", ErrInvalidGrantAccess
	}
}

func (s *Service) normalizeGrantUpsert(ctx context.Context, resourceID, adminUserID string, req UpsertSectionGrantInput) (uuid.UUID, uuid.UUID, string, *AdminUserRecord, error) {
	resourceGUID, err := parseGUID(resourceID)
	if err != nil {
		return uuid.Nil, uuid.Nil, "", nil, ErrInvalidInput
	}
	adminGUID, err := parseGUID(adminUserID)
	if err != nil {
		return uuid.Nil, uuid.Nil, "", nil, ErrInvalidInput
	}
	access, err := normalizeGrantAccess(req.Access)
	if err != nil {
		return uuid.Nil, uuid.Nil, "", nil, err
	}

	user, err := s.repo.GetAdminUserByID(ctx, adminGUID)
	if err != nil {
		if errors.Is(err, ErrAdminUserNotFound) {
			return uuid.Nil, uuid.Nil, "", nil, err
		}
		return uuid.Nil, uuid.Nil, "", nil, err
	}
	if !strings.EqualFold(strings.TrimSpace(user.Status), "active") {
		return uuid.Nil, uuid.Nil, "", nil, ErrGrantTargetInactive
	}
	if user.Level >= 100 {
		return uuid.Nil, uuid.Nil, "", nil, ErrGrantTargetRoot
	}

	return resourceGUID, adminGUID, access, user, nil
}

func adminRoleFromLevel(level int) string {
	switch {
	case level >= 100:
		return "root"
	case level >= 80:
		return "admin"
	case level >= 60:
		return "support"
	default:
		return "readonly"
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

func toSectionGrantOutput(record *SectionGrantRecord) *SectionGrantOutput {
	if record == nil {
		return nil
	}
	return &SectionGrantOutput{
		ID:        record.ID.String(),
		SectionID: record.Section.GUID.String(),
		AdminUser: AdminUserGrant{
			ID:     record.AdminUser.ID.String(),
			Email:  record.AdminUser.Email,
			Name:   record.AdminUser.Name,
			Level:  record.AdminUser.Level,
			Role:   adminRoleFromLevel(record.AdminUser.Level),
			Status: record.AdminUser.Status,
		},
		Access:    record.Access,
		CreatedAt: record.CreatedAt.Format(time.RFC3339),
		UpdatedAt: record.UpdatedAt.Format(time.RFC3339),
	}
}
