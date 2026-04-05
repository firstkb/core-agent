package adminnavigationsvc

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrUnauthorized = errors.New("admin navigation unauthorized")
	ErrInvalidScope = errors.New("admin navigation invalid scope")
	ErrUserNotFound = errors.New("admin navigation user not found")
	ErrUserInactive = errors.New("admin navigation user inactive")
)

type Service struct {
	repo            Repository
	sectionCoverage SectionCoverageFunc
}

type SectionCoverageFunc func(moduleKey, sectionKey, grantedAccess string, isRoot bool) bool

func NewService(repo Repository, sectionCoverage SectionCoverageFunc) *Service {
	return &Service{repo: repo, sectionCoverage: sectionCoverage}
}

func (s *Service) GetNavigation(ctx context.Context) (*Navigation, error) {
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

	isRoot := isRootClaims(claims)
	var modules []ModuleRecord
	if isRoot {
		modules, err = s.repo.ListRootNavigation(ctx)
	} else {
		modules, err = s.repo.ListUserNavigation(ctx, userID)
	}
	if err != nil {
		return nil, err
	}

	modules = s.filterModulesByCoverage(modules, isRoot)
	favoriteSurfaceIDs, err := s.repo.ListFavoriteSurfaceIDs(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &Navigation{
		IsRoot:    isRoot,
		Favorites: buildFavoritesFromModules(modules, favoriteSurfaceIDs),
		Modules:   toNavigationModules(modules),
	}, nil
}

func (s *Service) filterModulesByCoverage(records []ModuleRecord, isRoot bool) []ModuleRecord {
	if s.sectionCoverage == nil {
		return records
	}

	filtered := make([]ModuleRecord, 0, len(records))
	for _, record := range records {
		next := ModuleRecord{
			ID:          record.ID,
			ModuleKey:   record.ModuleKey,
			Title:       record.Title,
			Description: record.Description,
			Icon:        record.Icon,
			Sections:    make([]SectionRecord, 0, len(record.Sections)),
		}

		for _, section := range record.Sections {
			if !s.sectionCoverage(record.ModuleKey, section.SectionKey, section.Access, isRoot) {
				continue
			}
			next.Sections = append(next.Sections, section)
		}

		if len(next.Sections) == 0 {
			continue
		}
		filtered = append(filtered, next)
	}

	return filtered
}

func isRootClaims(claims requestctx.ClaimsInfo) bool {
	if claims.Level >= 100 {
		return true
	}
	return strings.EqualFold(strings.TrimSpace(claims.Role), "root")
}

func toNavigationModules(records []ModuleRecord) []NavigationModule {
	modules := make([]NavigationModule, 0, len(records))
	for _, record := range records {
		sections := make([]NavigationSection, 0, len(record.Sections))
		for _, section := range record.Sections {
			sections = append(sections, NavigationSection{
				ID:          section.ID.String(),
				SectionKey:  section.SectionKey,
				Title:       section.Title,
				Description: section.Description,
				RoutePath:   section.RoutePath,
				Access:      section.Access,
			})
		}

		modules = append(modules, NavigationModule{
			ID:          record.ID.String(),
			ModuleKey:   record.ModuleKey,
			Title:       record.Title,
			Description: record.Description,
			Icon:        record.Icon,
			Sections:    sections,
		})
	}
	return modules
}

type collectionFavoriteBinding struct {
	SurfaceID  string
	ModuleKey  string
	SectionKey string
}

var collectionFavoriteBindings = []collectionFavoriteBinding{
	{
		SurfaceID:  "module-registry.list",
		ModuleKey:  "module_registry",
		SectionKey: "modules_list",
	},
}

func buildFavoritesFromModules(modules []ModuleRecord, surfaceIDs []string) []NavigationFavorite {
	if len(modules) == 0 || len(surfaceIDs) == 0 {
		return []NavigationFavorite{}
	}

	type favoriteCandidate struct {
		module  ModuleRecord
		section SectionRecord
	}

	candidates := make(map[string]favoriteCandidate)
	for _, module := range modules {
		for _, section := range module.Sections {
			key := favoriteBindingKey(module.ModuleKey, section.SectionKey)
			candidates[key] = favoriteCandidate{module: module, section: section}
		}
	}

	favorites := make([]NavigationFavorite, 0, len(surfaceIDs))
	for _, surfaceID := range surfaceIDs {
		binding, ok := favoriteBindingForSurface(surfaceID)
		if !ok {
			continue
		}
		candidate, ok := candidates[favoriteBindingKey(binding.ModuleKey, binding.SectionKey)]
		if !ok {
			continue
		}
		favorites = append(favorites, NavigationFavorite{
			ID:          candidate.section.ID.String(),
			ModuleID:    candidate.module.ID.String(),
			ModuleKey:   candidate.module.ModuleKey,
			ModuleTitle: candidate.module.Title,
			ModuleIcon:  candidate.module.Icon,
			SectionKey:  candidate.section.SectionKey,
			Title:       candidate.section.Title,
			Description: candidate.section.Description,
			RoutePath:   candidate.section.RoutePath,
			Access:      candidate.section.Access,
		})
	}

	return favorites
}

func favoriteBindingForSurface(surfaceID string) (collectionFavoriteBinding, bool) {
	trimmed := strings.TrimSpace(strings.ToLower(surfaceID))
	for _, binding := range collectionFavoriteBindings {
		if strings.EqualFold(strings.TrimSpace(binding.SurfaceID), trimmed) {
			return binding, true
		}
	}
	return collectionFavoriteBinding{}, false
}

func favoriteBindingKey(moduleKey, sectionKey string) string {
	return strings.TrimSpace(strings.ToLower(moduleKey)) + "::" + strings.TrimSpace(strings.ToLower(sectionKey))
}
