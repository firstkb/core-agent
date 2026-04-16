package employeeslist

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

var (
	ErrUnauthorized     = errors.New("employees list unauthorized")
	ErrForbidden        = errors.New("employees list forbidden")
	ErrInvalidQuery     = errors.New("employees list invalid query")
	ErrInvalidAction    = errors.New("employees list invalid action")
	ErrInvalidInput     = errors.New("employees list invalid input")
	ErrEmployeeNotFound = errors.New("employees list employee not found")
	ErrEmployeeConflict = errors.New("employees list employee conflict")
	ErrSelfDeactivate   = errors.New("employees list cannot disable current admin user")
)

var allowedPageSizes = []int{25, 50, 100}

type Service struct {
	repo  Repository
	prefs Preferences
}

type Preferences interface {
	LoadState(ctx context.Context, principalID uuid.UUID, surfaceID string) (*collectionprefs.State, error)
	ToggleFavorite(ctx context.Context, principalID uuid.UUID, surfaceID string) (bool, error)
	CreateSavedFilter(ctx context.Context, principalID uuid.UUID, surfaceID string, req collectiontable.CreateSavedFilterInput) (*collectiontable.SavedFilterSet, error)
}

func NewService(repo Repository, prefs Preferences) *Service {
	return &Service{repo: repo, prefs: prefs}
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
		Title:     "Employees",
		Search: SearchMeta{
			DefaultFieldID: "all",
			Placeholder:    "Search employees...",
		},
		Fields:  employeeFields(),
		Columns: employeeColumns(),
		Actions: PageActions{
			// Employees does not have a safe host-managed create flow yet.
			Create: VisibilityAction{Visible: false},
			Reload: VisibilityAction{Visible: true},
			Favorite: FavoriteAction{
				Visible:    true,
				IsFavorite: prefs.IsFavorite,
			},
		},
		RowActions: []RowActionDefinition{
			{ID: "edit", Kind: "button", Execution: "frontend"},
		},
		Selection: SelectionMeta{
			Enabled:        true,
			Mode:           "multi",
			ColumnPosition: "leading",
		},
		BulkActions: []BulkActionDefinition{
			{ID: "activate", Kind: "state-change", Label: "Active", Tone: "success"},
			{ID: "disable", Kind: "state-change", Label: "Disabled", Tone: "warning"},
		},
		PageSizeOptions: append([]int(nil), allowedPageSizes...),
		SavedFilterSets: prefs.SavedFilterSets,
	}, nil
}

func (s *Service) Query(ctx context.Context, req QueryRequest) (*QueryResponse, error) {
	adminUserID, err := s.requireRoot(ctx)
	if err != nil {
		return nil, err
	}
	if err := collectiontable.ValidateQueryRequest(req, employeeFields()); err != nil {
		return nil, ErrInvalidQuery
	}

	records, err := s.repo.ListEmployees(ctx)
	if err != nil {
		return nil, err
	}

	rows := projectRows(records)
	rows, err = applyQuickFilters(rows, req.QuickFilters)
	if err != nil {
		return nil, ErrInvalidQuery
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
		nameValue := strings.TrimSpace(row.Name)
		nameDisplay := nameValue
		if nameDisplay == "" {
			nameDisplay = row.Email
		}

		resultRows = append(resultRows, TableRow{
			ID:         row.ID.String(),
			Selectable: row.ID != adminUserID,
			Cells: map[string]RowCell{
				"name": {
					Value:        nameValue,
					DisplayValue: nameDisplay,
				},
				"email": {Value: row.Email},
				"phone": {Value: row.Phone},
				"role": {
					Value: row.Role,
					Label: employeeRoleLabel(row.Role),
					Tone:  employeeRoleTone(row.Role),
				},
				"status": {
					Value: row.Status,
					Label: employeeStatusLabel(row.Status),
					Tone:  employeeStatusTone(row.Status),
				},
				"created_at": {
					Value:        row.CreatedAt.Format("2006-01-02"),
					DisplayValue: row.CreatedAt.Format("1/2/2006"),
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

	records, err := s.repo.ListEmployees(ctx)
	if err != nil {
		return nil, err
	}

	rows := projectRows(records)
	groups := []SearchSuggestionGroup{
		collectiontable.BuildSuggestionGroup("name", "Name", rows, func(row employeeRow) []string { return []string{row.Name} }),
		collectiontable.BuildSuggestionGroup("email", "Email", rows, func(row employeeRow) []string { return []string{row.Email} }),
		collectiontable.BuildSuggestionGroup("phone", "Phone", rows, func(row employeeRow) []string { return []string{row.Phone} }),
		collectiontable.BuildSuggestionGroup("role", "Role", rows, func(row employeeRow) []string { return []string{employeeRoleLabel(row.Role)} }),
		collectiontable.BuildSuggestionGroup("status", "Status", rows, func(row employeeRow) []string { return []string{employeeStatusLabel(row.Status)} }),
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
	adminUserID, err := s.requireRoot(ctx)
	if err != nil {
		return nil, err
	}

	actionID = strings.TrimSpace(strings.ToLower(actionID))
	if actionID == "" {
		return nil, ErrInvalidAction
	}

	employeeIDs, err := parseEmployeeIDs(input.RowIDs)
	if err != nil {
		return nil, err
	}

	switch actionID {
	case "activate":
		if err := s.repo.SetEmployeeStatus(ctx, employeeIDs, "active"); err != nil {
			return nil, err
		}
	case "disable":
		for _, employeeID := range employeeIDs {
			if employeeID == adminUserID {
				return nil, ErrSelfDeactivate
			}
		}
		if err := s.repo.SetEmployeeStatus(ctx, employeeIDs, "disabled"); err != nil {
			return nil, err
		}
	default:
		return nil, ErrInvalidAction
	}

	return &MutationResult{OK: true}, nil
}

func (s *Service) GetEmployee(ctx context.Context, employeeID string) (*EmployeeDetailResponse, error) {
	adminUserID, err := s.requireRoot(ctx)
	if err != nil {
		return nil, err
	}

	resolvedEmployeeID, err := parseEmployeeID(employeeID)
	if err != nil {
		return nil, err
	}

	record, err := s.repo.GetEmployee(ctx, resolvedEmployeeID)
	if err != nil {
		return nil, err
	}

	return &EmployeeDetailResponse{
		User: projectEmployeeDetail(*record, adminUserID),
	}, nil
}

func (s *Service) UpdateEmployee(ctx context.Context, employeeID string, input UpdateEmployeeInput) (*EmployeeDetailResponse, error) {
	adminUserID, err := s.requireRoot(ctx)
	if err != nil {
		return nil, err
	}

	resolvedEmployeeID, err := parseEmployeeID(employeeID)
	if err != nil {
		return nil, err
	}

	status, err := normalizeEditableEmployeeStatus(input.Status)
	if err != nil {
		return nil, err
	}
	if resolvedEmployeeID == adminUserID && status == "disabled" {
		return nil, ErrSelfDeactivate
	}

	record, err := s.repo.UpdateEmployee(ctx, UpdateEmployeeRecordInput{
		ID:     resolvedEmployeeID,
		Name:   strings.TrimSpace(input.Name),
		Phone:  strings.TrimSpace(input.Phone),
		Status: status,
	})
	if err != nil {
		return nil, err
	}

	return &EmployeeDetailResponse{
		User: projectEmployeeDetail(*record, adminUserID),
	}, nil
}

type employeeRow struct {
	ID        uuid.UUID
	Name      string
	Email     string
	Phone     string
	Role      string
	Status    string
	CreatedAt time.Time
}

func projectRows(records []EmployeeRecord) []employeeRow {
	rows := make([]employeeRow, 0, len(records))
	for _, record := range records {
		rows = append(rows, employeeRow{
			ID:        record.ID,
			Name:      strings.TrimSpace(record.Name),
			Email:     strings.TrimSpace(record.Email),
			Phone:     strings.TrimSpace(record.Phone),
			Role:      adminRoleFromLevel(record.Level),
			Status:    strings.TrimSpace(strings.ToLower(record.Status)),
			CreatedAt: record.CreatedAt,
		})
	}
	return rows
}

func projectEmployeeDetail(record EmployeeRecord, currentAdminUserID uuid.UUID) EmployeeDetail {
	return EmployeeDetail{
		ID:            record.ID.String(),
		Email:         strings.TrimSpace(record.Email),
		Phone:         strings.TrimSpace(record.Phone),
		Name:          strings.TrimSpace(record.Name),
		Level:         record.Level,
		Role:          adminRoleFromLevel(record.Level),
		Status:        strings.TrimSpace(strings.ToLower(record.Status)),
		CreatedAt:     record.CreatedAt,
		IsCurrentUser: record.ID == currentAdminUserID,
	}
}

func parseEmployeeIDs(rowIDs []string) ([]uuid.UUID, error) {
	if len(rowIDs) == 0 {
		return nil, ErrInvalidAction
	}

	employeeIDs := make([]uuid.UUID, 0, len(rowIDs))
	seen := make(map[uuid.UUID]struct{}, len(rowIDs))
	for _, rowID := range rowIDs {
		employeeID, err := parseEmployeeID(rowID)
		if err != nil {
			return nil, err
		}
		if _, exists := seen[employeeID]; exists {
			continue
		}
		seen[employeeID] = struct{}{}
		employeeIDs = append(employeeIDs, employeeID)
	}

	if len(employeeIDs) == 0 {
		return nil, ErrInvalidAction
	}

	return employeeIDs, nil
}

func parseEmployeeID(employeeID string) (uuid.UUID, error) {
	resolvedEmployeeID, err := uuid.Parse(strings.TrimSpace(employeeID))
	if err != nil || resolvedEmployeeID == uuid.Nil {
		return uuid.Nil, ErrInvalidInput
	}

	return resolvedEmployeeID, nil
}

func normalizeEditableEmployeeStatus(status string) (string, error) {
	switch strings.TrimSpace(strings.ToLower(status)) {
	case "active":
		return "active", nil
	case "disabled":
		return "disabled", nil
	default:
		return "", ErrInvalidInput
	}
}

func applyQuickFilters(rows []employeeRow, filters []QuickFilter) ([]employeeRow, error) {
	if len(filters) == 0 {
		return rows, nil
	}

	filtered := make([]employeeRow, 0, len(rows))
	for _, row := range rows {
		matched, err := collectiontable.MatchQuickFilters(filters, func(filter QuickFilter) (bool, error) {
			return matchesQuickFilter(row, filter)
		})
		if err != nil {
			return nil, err
		}
		if matched {
			filtered = append(filtered, row)
		}
	}

	return filtered, nil
}

func matchesQuickFilter(row employeeRow, filter QuickFilter) (bool, error) {
	fieldID := strings.TrimSpace(filter.FieldID)
	operator := strings.TrimSpace(filter.Operator)
	value := strings.TrimSpace(filter.Value)

	switch fieldID {
	case "all":
		joined := strings.TrimSpace(strings.Join([]string{
			row.Name,
			row.Email,
			row.Phone,
			employeeRoleLabel(row.Role),
			employeeStatusLabel(row.Status),
		}, " "))
		return collectiontable.MatchString(joined, operator, value)
	case "name":
		return collectiontable.MatchString(row.Name, operator, value)
	case "email":
		return collectiontable.MatchString(row.Email, operator, value)
	case "phone":
		return collectiontable.MatchString(row.Phone, operator, value)
	case "role":
		return collectiontable.MatchString(employeeRoleLabel(row.Role), operator, value)
	case "status":
		return collectiontable.MatchString(employeeStatusLabel(row.Status), operator, value)
	case "created_at":
		return collectiontable.MatchDate(row.CreatedAt, operator, value)
	default:
		return false, collectiontable.ErrInvalidQuery
	}
}

func sortRows(rows []employeeRow, sortReq SortRequest) {
	columnID := strings.TrimSpace(sortReq.ColumnID)
	direction := collectiontable.NormalizeSortDirection(sortReq.Direction)
	if columnID == "" {
		columnID = "name"
	}

	less := func(left, right employeeRow) bool {
		switch columnID {
		case "name":
			leftValue := left.Name
			if leftValue == "" {
				leftValue = left.Email
			}
			rightValue := right.Name
			if rightValue == "" {
				rightValue = right.Email
			}
			return collectiontable.CompareStrings(leftValue, rightValue, direction)
		case "email":
			return collectiontable.CompareStrings(left.Email, right.Email, direction)
		case "phone":
			return collectiontable.CompareStrings(left.Phone, right.Phone, direction)
		case "role":
			return collectiontable.CompareStrings(employeeRoleLabel(left.Role), employeeRoleLabel(right.Role), direction)
		case "status":
			return collectiontable.CompareStrings(employeeStatusLabel(left.Status), employeeStatusLabel(right.Status), direction)
		case "created_at":
			return collectiontable.CompareTimes(left.CreatedAt, right.CreatedAt, direction)
		default:
			return collectiontable.CompareStrings(left.Email, right.Email, direction)
		}
	}

	for idx := range rows {
		for inner := idx + 1; inner < len(rows); inner++ {
			if less(rows[inner], rows[idx]) {
				rows[idx], rows[inner] = rows[inner], rows[idx]
			}
		}
	}
}

func employeeFields() []FieldDefinition {
	return []FieldDefinition{
		{ID: "name", Label: "Name", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "email", Label: "Email", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "phone", Label: "Phone", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "role", Label: "Role", Type: "badge", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "status", Label: "Status", Type: "badge", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "created_at", Label: "Created", Type: "date", Searchable: true, Sortable: true, Suggestable: false},
	}
}

func employeeColumns() []ColumnDefinition {
	return []ColumnDefinition{
		{ID: "name", Label: "Name", Type: "text", FieldID: "name", DefaultVisible: true},
		{ID: "email", Label: "Email", Type: "text", FieldID: "email", DefaultVisible: true},
		{ID: "phone", Label: "Phone", Type: "text", FieldID: "phone", DefaultVisible: true},
		{ID: "role", Label: "Role", Type: "badge", FieldID: "role", DefaultVisible: true},
		{ID: "status", Label: "Status", Type: "badge", FieldID: "status", DefaultVisible: true},
		{ID: "created_at", Label: "Created", Type: "date", FieldID: "created_at", DefaultVisible: true},
	}
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

func employeeRoleLabel(role string) string {
	switch strings.TrimSpace(strings.ToLower(role)) {
	case "root":
		return "Root"
	case "admin":
		return "Admin"
	case "support":
		return "Support"
	default:
		return "Readonly"
	}
}

func employeeRoleTone(role string) string {
	switch strings.TrimSpace(strings.ToLower(role)) {
	case "root":
		return "brand"
	case "admin":
		return "info"
	case "support":
		return "warning"
	default:
		return "neutral"
	}
}

func employeeStatusLabel(status string) string {
	switch strings.TrimSpace(strings.ToLower(status)) {
	case "active":
		return "Active"
	case "disabled":
		return "Disabled"
	default:
		if status == "" {
			return "Unknown"
		}
		return strings.ToUpper(status[:1]) + status[1:]
	}
}

func employeeStatusTone(status string) string {
	switch strings.TrimSpace(strings.ToLower(status)) {
	case "active":
		return "success"
	case "disabled":
		return "warning"
	default:
		return "neutral"
	}
}

func (s *Service) requireRoot(ctx context.Context) (uuid.UUID, error) {
	claims, ok := requestctx.Claims(ctx)
	if !ok || strings.TrimSpace(claims.UserID) == "" {
		return uuid.Nil, ErrUnauthorized
	}
	if !strings.Contains(" "+claims.Scope+" ", " "+authpkg.AccessScopeAdminAPI+" ") {
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
