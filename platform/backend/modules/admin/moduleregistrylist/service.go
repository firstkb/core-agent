package moduleregistrylist

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

var (
	ErrUnauthorized  = errors.New("module registry unauthorized")
	ErrForbidden     = errors.New("module registry forbidden")
	ErrInvalidQuery  = errors.New("module registry invalid query")
	ErrInvalidAction = errors.New("module registry invalid action")
)

var allowedPageSizes = []int{25, 50, 100}

type Service struct {
	repo    Repository
	prefs   Preferences
	manager Manager
	logger  *slog.Logger
}

type Preferences interface {
	LoadState(ctx context.Context, principalID uuid.UUID, surfaceID string) (*collectionprefs.State, error)
	ToggleFavorite(ctx context.Context, principalID uuid.UUID, surfaceID string) (bool, error)
	CreateSavedFilter(ctx context.Context, principalID uuid.UUID, surfaceID string, req collectiontable.CreateSavedFilterInput) (*collectiontable.SavedFilterSet, error)
}

type Manager interface {
	ArchiveModule(ctx context.Context, moduleID string) (*MutationResult, error)
	SetModuleStatus(ctx context.Context, moduleIDs []string, status string) (*MutationResult, error)
}

func NewService(repo Repository, prefs Preferences, manager Manager, logger *slog.Logger) *Service {
	return &Service{repo: repo, prefs: prefs, manager: manager, logger: logger}
}

func (s *Service) LoadMeta(ctx context.Context) (*MetaResponse, error) {
	adminUserID, err := s.requireRoot(ctx)
	if err != nil {
		return nil, err
	}

	prefs, err := s.prefs.LoadState(ctx, adminUserID, SurfaceID)
	if err != nil {
		return nil, err
	}

	return &MetaResponse{
		SurfaceID: SurfaceID,
		Title:     "Module registry",
		Search: SearchMeta{
			DefaultFieldID: "all",
			Placeholder:    "Search modules or sections...",
		},
		Fields:  moduleRegistryFields(),
		Columns: moduleRegistryColumns(),
		RowLayout: RowLayout{
			SecondaryRowFieldID: "description",
		},
		Actions: PageActions{
			Create: VisibilityAction{Visible: true},
			Reload: VisibilityAction{Visible: true},
			//ExportXLS: VisibilityAction{Visible: true},
			Favorite: FavoriteAction{
				Visible:    true,
				IsFavorite: prefs.IsFavorite,
			},
		},
		RowActions: []RowActionDefinition{
			{ID: "edit", Kind: "button", Execution: "frontend"},
			//{ID: "pdf", Kind: "button", Execution: "backend"},
		},
		Selection: SelectionMeta{
			Enabled:        true,
			Mode:           "multi",
			ColumnPosition: "leading",
		},
		BulkActions: []BulkActionDefinition{
			{ID: "activate", Kind: "state-change", Label: "Active", Tone: "success"},
			{ID: "planned", Kind: "custom", Label: "Planned", Tone: "info"},
			{ID: "archive", Kind: "custom", Label: "Archive", Tone: "neutral"},
		},
		PageSizeOptions: append([]int(nil), allowedPageSizes...),
		SavedFilterSets: prefs.SavedFilterSets,
	}, nil
}

func (s *Service) Query(ctx context.Context, req QueryRequest) (*QueryResponse, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	if err := collectiontable.ValidateQueryRequest(req, moduleRegistryFields()); err != nil {
		return nil, ErrInvalidQuery
	}

	records, err := s.repo.ListModules(ctx)
	if err != nil {
		return nil, err
	}

	rows := projectRows(records)
	rows = applyRequestFilters(rows, req.Filters)
	rows, err = applyQuickFilters(rows, req.QuickFilters)
	if err != nil {
		return nil, err
	}
	sortRows(rows, req.Sort)

	pageSize := collectiontable.NormalizePageSize(req.PageSize, allowedPageSizes, 25)
	totalItems := len(rows)
	totalPages := collectiontable.TotalPageCount(totalItems, pageSize)
	page := req.Page
	if page <= 0 {
		page = 1
	}
	if page > totalPages {
		page = totalPages
	}

	start := (page - 1) * pageSize
	end := start + pageSize
	if start > len(rows) {
		start = len(rows)
	}
	if end > len(rows) {
		end = len(rows)
	}

	resultRows := make([]TableRow, 0, end-start)
	for _, row := range rows[start:end] {
		resultRows = append(resultRows, TableRow{
			ID:         row.ID,
			Selectable: true,
			Cells: map[string]RowCell{
				"module_title":   {Value: row.ModuleTitle},
				"module_key":     {Value: row.ModuleKey},
				"description":    {Value: row.Description},
				"section_titles": {Value: strings.Join(row.SectionTitles, ", ")},
				"section_count":  {Value: row.SectionCount},
				"updated_at": {
					Value:        row.UpdatedAt.Format("2006-01-02"),
					DisplayValue: row.UpdatedAt.Format("1/2/2006"),
				},
				"status": {
					Value: row.Status,
					Label: statusLabel(row.Status),
					Tone:  statusTone(row.Status),
				},
			},
		})
	}

	return &QueryResponse{
		Page:       page,
		PageSize:   pageSize,
		TotalItems: totalItems,
		TotalPages: totalPages,
		Rows:       resultRows,
	}, nil
}

func (s *Service) LoadSearchSuggestions(ctx context.Context) (*SearchSuggestionsResponse, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}

	records, err := s.repo.ListModules(ctx)
	if err != nil {
		return nil, err
	}

	rows := projectRows(records)
	groups := []SearchSuggestionGroup{
		collectiontable.BuildSuggestionGroup("module_title", "Module", rows, func(row registryRow) []string { return []string{row.ModuleTitle} }),
		collectiontable.BuildSuggestionGroup("module_key", "Module key", rows, func(row registryRow) []string { return []string{row.ModuleKey} }),
		collectiontable.BuildSuggestionGroup("section_titles", "Sections", rows, func(row registryRow) []string { return row.SectionTitles }),
		collectiontable.BuildSuggestionGroup("status", "Status", rows, func(row registryRow) []string { return []string{statusLabel(row.Status)} }),
	}

	filtered := make([]SearchSuggestionGroup, 0, len(groups))
	for _, group := range groups {
		if len(group.Items) == 0 {
			continue
		}
		filtered = append(filtered, group)
	}

	return &SearchSuggestionsResponse{Groups: filtered}, nil
}

func (s *Service) ToggleFavorite(ctx context.Context) (*FavoriteToggleResponse, error) {
	adminUserID, err := s.requireRoot(ctx)
	if err != nil {
		return nil, err
	}

	isFavorite, err := s.prefs.ToggleFavorite(ctx, adminUserID, SurfaceID)
	if err != nil {
		return nil, err
	}

	return &FavoriteToggleResponse{IsFavorite: isFavorite}, nil
}

func (s *Service) CreateSavedFilter(ctx context.Context, req CreateSavedFilterInput) (*SavedFilterSet, error) {
	adminUserID, err := s.requireRoot(ctx)
	if err != nil {
		return nil, err
	}
	return s.prefs.CreateSavedFilter(ctx, adminUserID, SurfaceID, req)
}

func (s *Service) RunBulkAction(ctx context.Context, actionID string, input BulkActionInput) (*MutationResult, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	if strings.TrimSpace(actionID) == "" || s.manager == nil {
		return nil, ErrInvalidAction
	}
	switch strings.TrimSpace(actionID) {
	case "activate":
		return s.manager.SetModuleStatus(ctx, input.RowIDs, "active")
	case "planned":
		return s.manager.SetModuleStatus(ctx, input.RowIDs, "planned")
	case "archive":
		if len(input.RowIDs) == 0 {
			return nil, ErrInvalidAction
		}
		for _, rowID := range input.RowIDs {
			if strings.TrimSpace(rowID) == "" {
				return nil, ErrInvalidAction
			}
			if _, err := s.manager.ArchiveModule(ctx, rowID); err != nil {
				return nil, err
			}
		}
		return &MutationResult{OK: true}, nil
	default:
		return nil, ErrInvalidAction
	}
}

func (s *Service) RunRowAction(ctx context.Context, actionID string, input RowActionInput) (*MutationResult, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	switch strings.TrimSpace(actionID) {
	case "archive":
		if s.manager == nil {
			return nil, fmt.Errorf("module registry manager is not configured")
		}
		return s.manager.ArchiveModule(ctx, input.RowID)
	default:
		return nil, ErrInvalidAction
	}
}

func (s *Service) ExportXLS(ctx context.Context, req ExportRequest) (*MutationResult, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	if err := collectiontable.ValidateExportRequest(req, moduleRegistryFields()); err != nil {
		return nil, ErrInvalidQuery
	}

	records, err := s.repo.ListModulesForExport(ctx, collectiontable.ExportProbeLimit())
	if err != nil {
		return nil, err
	}

	rows := projectRows(records)
	rows = applyRequestFilters(rows, req.Query.Filters)
	rows, err = applyQuickFilters(rows, req.Query.QuickFilters)
	if err != nil {
		return nil, err
	}
	sortRows(rows, req.Query.Sort)

	limitedRows, truncated := collectiontable.ApplyExportLimit(rows)
	if truncated && s.logger != nil {
		s.logger.Warn("module registry export truncated by hard limit",
			"surface_id", SurfaceID,
			"matched_rows", len(rows),
			"export_limit", collectiontable.ExportRowLimit,
		)
	}
	_ = limitedRows

	return &MutationResult{OK: true}, nil
}

type registryRow struct {
	ID            string
	ModuleKey     string
	ModuleTitle   string
	Description   string
	SectionTitles []string
	SectionCount  int
	UpdatedAt     time.Time
	Status        string
	SortOrder     int
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

func projectRows(records []ModuleRecord) []registryRow {
	rows := make([]registryRow, 0, len(records))
	for _, record := range records {
		sectionTitles := make([]string, 0, len(record.Sections))
		for _, section := range record.Sections {
			if strings.TrimSpace(section.Title) == "" {
				continue
			}
			sectionTitles = append(sectionTitles, section.Title)
		}
		rows = append(rows, registryRow{
			ID:            record.GUID.String(),
			ModuleKey:     record.ModuleKey,
			ModuleTitle:   record.Title,
			Description:   record.Description,
			SectionTitles: sectionTitles,
			SectionCount:  len(record.Sections),
			UpdatedAt:     record.UpdatedAt,
			Status:        record.Status,
			SortOrder:     record.SortOrder,
		})
	}
	return rows
}

func applyRequestFilters(rows []registryRow, filters map[string]string) []registryRow {
	if len(filters) == 0 {
		return rows
	}

	filtered := make([]registryRow, 0, len(rows))
	for _, row := range rows {
		matches := true
		for key, value := range filters {
			if strings.EqualFold(strings.TrimSpace(value), "all") || strings.TrimSpace(value) == "" {
				continue
			}
			if !strings.EqualFold(fieldValue(row, key), strings.TrimSpace(value)) {
				matches = false
				break
			}
		}
		if matches {
			filtered = append(filtered, row)
		}
	}
	return filtered
}

func applyQuickFilters(rows []registryRow, filters []QuickFilter) ([]registryRow, error) {
	if len(filters) == 0 {
		return rows, nil
	}

	filtered := make([]registryRow, 0, len(rows))
	for _, row := range rows {
		matches := true
		for _, filter := range filters {
			ok, err := rowMatchesQuickFilter(row, filter)
			if err != nil {
				return nil, err
			}
			if !ok {
				matches = false
				break
			}
		}
		if matches {
			filtered = append(filtered, row)
		}
	}
	return filtered, nil
}

func rowMatchesQuickFilter(row registryRow, filter QuickFilter) (bool, error) {
	fieldID := strings.TrimSpace(filter.FieldID)
	operator := strings.TrimSpace(filter.Operator)
	value := strings.TrimSpace(filter.Value)

	if fieldID == "all" {
		return matchAllField(row, operator, value)
	}

	switch fieldID {
	case "module_title", "module_key", "description", "section_titles", "section_count", "status":
		matched, err := collectiontable.MatchString(fieldValue(row, fieldID), operator, value)
		if err != nil {
			return false, ErrInvalidQuery
		}
		return matched, nil
	case "updated_at":
		matched, err := collectiontable.MatchDate(row.UpdatedAt, operator, value)
		if err != nil {
			return false, ErrInvalidQuery
		}
		return matched, nil
	default:
		return false, ErrInvalidQuery
	}
}

func matchAllField(row registryRow, operator, value string) (bool, error) {
	joined := strings.Join([]string{
		row.ModuleTitle,
		row.ModuleKey,
		row.Description,
		strings.Join(row.SectionTitles, " "),
		statusLabel(row.Status),
	}, " ")

	matched, err := collectiontable.MatchString(joined, operator, value)
	if err != nil {
		return false, ErrInvalidQuery
	}
	return matched, nil
}

func sortRows(rows []registryRow, sortReq SortRequest) {
	columnID := strings.TrimSpace(sortReq.ColumnID)
	direction := strings.ToLower(strings.TrimSpace(sortReq.Direction))
	if direction != "desc" {
		direction = "asc"
	}

	sort.SliceStable(rows, func(i, j int) bool {
		left := rows[i]
		right := rows[j]

		if columnID == "" {
			return compareDefault(left, right, direction)
		}

		return compareByColumn(left, right, columnID, direction)
	})
}

func compareDefault(left, right registryRow, direction string) bool {
	if left.SortOrder != right.SortOrder {
		return collectiontable.CompareInts(left.SortOrder, right.SortOrder, direction)
	}
	return collectiontable.CompareStrings(left.ModuleTitle, right.ModuleTitle, direction)
}

func compareByColumn(left, right registryRow, columnID, direction string) bool {
	switch columnID {
	case "module_title":
		return collectiontable.CompareStrings(left.ModuleTitle, right.ModuleTitle, direction)
	case "module_key":
		return collectiontable.CompareStrings(left.ModuleKey, right.ModuleKey, direction)
	case "section_count":
		if left.SectionCount != right.SectionCount {
			return collectiontable.CompareInts(left.SectionCount, right.SectionCount, direction)
		}
		return collectiontable.CompareStrings(left.ModuleTitle, right.ModuleTitle, direction)
	case "updated_at":
		if !left.UpdatedAt.Equal(right.UpdatedAt) {
			return collectiontable.CompareTimes(left.UpdatedAt, right.UpdatedAt, direction)
		}
		return collectiontable.CompareStrings(left.ModuleTitle, right.ModuleTitle, direction)
	case "status":
		if left.Status != right.Status {
			return collectiontable.CompareStrings(left.Status, right.Status, direction)
		}
		return collectiontable.CompareStrings(left.ModuleTitle, right.ModuleTitle, direction)
	default:
		return compareDefault(left, right, direction)
	}
}

func fieldValue(row registryRow, fieldID string) string {
	switch fieldID {
	case "module_title":
		return row.ModuleTitle
	case "module_key":
		return row.ModuleKey
	case "description":
		return row.Description
	case "section_titles":
		return strings.Join(row.SectionTitles, ", ")
	case "section_count":
		return strconv.Itoa(row.SectionCount)
	case "status":
		return statusLabel(row.Status)
	default:
		return ""
	}
}

func statusLabel(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "active":
		return "Active"
	case "planned":
		return "Planned"
	case "archived":
		return "Archived"
	default:
		return strings.TrimSpace(value)
	}
}

func statusTone(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "active":
		return "success"
	case "planned":
		return "info"
	case "archived":
		return "neutral"
	default:
		return "neutral"
	}
}

func moduleRegistryFields() []FieldDefinition {
	return []FieldDefinition{
		{ID: "module_title", Label: "Module", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "module_key", Label: "Module key", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "description", Label: "Description", Type: "text", Searchable: true, Sortable: false, Suggestable: false},
		{ID: "section_titles", Label: "Sections", Type: "text", Searchable: true, Sortable: false, Suggestable: true},
		{ID: "section_count", Label: "Section count", Type: "text", Searchable: false, Sortable: true, Suggestable: false},
		{ID: "updated_at", Label: "Updated", Type: "date", Searchable: true, Sortable: true, Suggestable: false},
		{ID: "status", Label: "Status", Type: "badge", Searchable: true, Sortable: true, Suggestable: true},
	}
}

func moduleRegistryColumns() []ColumnDefinition {
	return []ColumnDefinition{
		{ID: "module_title", Label: "Module", Type: "text", FieldID: "module_title", DefaultVisible: true},
		{ID: "module_key", Label: "Module key", Type: "text", FieldID: "module_key", DefaultVisible: true},
		{ID: "section_count", Label: "Sections", Type: "text", FieldID: "section_count", DefaultVisible: true},
		{ID: "updated_at", Label: "Updated", Type: "date", FieldID: "updated_at", DefaultVisible: true},
		{ID: "status", Label: "Status", Type: "badge", FieldID: "status", DefaultVisible: true},
	}
}
