package tenantlist

import (
	"context"
	"errors"
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
	ErrUnauthorized = errors.New("tenant list unauthorized")
	ErrForbidden    = errors.New("tenant list forbidden")
	ErrInvalidQuery = errors.New("tenant list invalid query")
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
		Title:     "List of tenants",
		Search: SearchMeta{
			DefaultFieldID: "all",
			Placeholder:    "Search tenants...",
		},
		Fields:  tenantFields(),
		Columns: tenantColumns(),
		Actions: PageActions{
			Create: VisibilityAction{Visible: false},
			Reload: VisibilityAction{Visible: true},
			Favorite: FavoriteAction{
				Visible:    true,
				IsFavorite: prefs.IsFavorite,
			},
		},
		PageSizeOptions: append([]int(nil), allowedPageSizes...),
		SavedFilterSets: prefs.SavedFilterSets,
	}, nil
}

func (s *Service) Query(ctx context.Context, req QueryRequest) (*QueryResponse, error) {
	if _, err := s.requireRoot(ctx); err != nil {
		return nil, err
	}
	if err := collectiontable.ValidateQueryRequest(req, tenantFields()); err != nil {
		return nil, ErrInvalidQuery
	}

	records, err := s.repo.ListTenants(ctx)
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
		nameValue := row.Name
		nameDisplay := nameValue
		if nameDisplay == "" {
			nameDisplay = row.Host
		}

		resultRows = append(resultRows, TableRow{
			ID:         strconv.FormatInt(row.ID, 10),
			Selectable: false,
			Cells: map[string]RowCell{
				"tenant_id": {
					Value:        row.ID,
					DisplayValue: strconv.FormatInt(row.ID, 10),
				},
				"name": {
					Value:        nameValue,
					DisplayValue: nameDisplay,
				},
				"host": {Value: row.Host},
				"plan": {
					Value: row.Plan,
					Label: tenantPlanLabel(row.Plan),
					Tone:  tenantPlanTone(row.Plan),
				},
				"isolation": {
					Value: row.Isolation,
					Label: tenantIsolationLabel(row.Isolation),
					Tone:  tenantIsolationTone(row.Isolation),
				},
				"status": {
					Value: row.Status,
					Label: tenantStatusLabel(row.Status),
					Tone:  tenantStatusTone(row.Status),
				},
				"db_name": {Value: row.DBName},
				"instance_code": {
					Value:        row.InstanceCode,
					DisplayValue: strings.ToUpper(row.InstanceCode),
				},
				"updated_at": {
					Value:        row.UpdatedAt.Format("2006-01-02"),
					DisplayValue: row.UpdatedAt.Format("1/2/2006"),
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

	records, err := s.repo.ListTenants(ctx)
	if err != nil {
		return nil, err
	}

	rows := projectRows(records)
	groups := []SearchSuggestionGroup{
		collectiontable.BuildSuggestionGroup("tenant_id", "Tenant ID", rows, func(row tenantRow) []string {
			return []string{strconv.FormatInt(row.ID, 10)}
		}),
		collectiontable.BuildSuggestionGroup("name", "Name", rows, func(row tenantRow) []string { return []string{row.Name} }),
		collectiontable.BuildSuggestionGroup("host", "Host", rows, func(row tenantRow) []string { return []string{row.Host} }),
		collectiontable.BuildSuggestionGroup("plan", "Plan", rows, func(row tenantRow) []string { return []string{tenantPlanLabel(row.Plan)} }),
		collectiontable.BuildSuggestionGroup("isolation", "Isolation", rows, func(row tenantRow) []string { return []string{tenantIsolationLabel(row.Isolation)} }),
		collectiontable.BuildSuggestionGroup("status", "Status", rows, func(row tenantRow) []string { return []string{tenantStatusLabel(row.Status)} }),
		collectiontable.BuildSuggestionGroup("db_name", "Database", rows, func(row tenantRow) []string { return []string{row.DBName} }),
		collectiontable.BuildSuggestionGroup("instance_code", "Instance", rows, func(row tenantRow) []string { return []string{strings.ToUpper(row.InstanceCode)} }),
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

type tenantRow struct {
	ID           int64
	Name         string
	Host         string
	Plan         string
	Isolation    string
	Status       string
	DBName       string
	InstanceCode string
	UpdatedAt    time.Time
}

func projectRows(records []TenantRecord) []tenantRow {
	rows := make([]tenantRow, 0, len(records))
	for _, record := range records {
		rows = append(rows, tenantRow{
			ID:           record.ID,
			Name:         strings.TrimSpace(record.Name),
			Host:         strings.TrimSpace(record.Host),
			Plan:         strings.TrimSpace(strings.ToLower(record.Plan)),
			Isolation:    strings.TrimSpace(strings.ToLower(record.Isolation)),
			Status:       strings.TrimSpace(strings.ToLower(record.Status)),
			DBName:       strings.TrimSpace(record.DBName),
			InstanceCode: strings.TrimSpace(record.InstanceCode),
			UpdatedAt:    record.UpdatedAt,
		})
	}

	return rows
}

func applyQuickFilters(rows []tenantRow, filters []QuickFilter) ([]tenantRow, error) {
	if len(filters) == 0 {
		return rows, nil
	}

	filtered := make([]tenantRow, 0, len(rows))
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

func matchesQuickFilter(row tenantRow, filter QuickFilter) (bool, error) {
	fieldID := strings.TrimSpace(filter.FieldID)
	operator := strings.TrimSpace(filter.Operator)
	value := strings.TrimSpace(filter.Value)

	switch fieldID {
	case "all":
		joined := strings.TrimSpace(strings.Join([]string{
			strconv.FormatInt(row.ID, 10),
			row.Name,
			row.Host,
			tenantPlanLabel(row.Plan),
			tenantIsolationLabel(row.Isolation),
			tenantStatusLabel(row.Status),
			row.DBName,
			strings.ToUpper(row.InstanceCode),
		}, " "))
		return collectiontable.MatchString(joined, operator, value)
	case "tenant_id":
		return collectiontable.MatchString(strconv.FormatInt(row.ID, 10), operator, value)
	case "name":
		return collectiontable.MatchString(row.Name, operator, value)
	case "host":
		return collectiontable.MatchString(row.Host, operator, value)
	case "plan":
		return collectiontable.MatchString(tenantPlanLabel(row.Plan), operator, value)
	case "isolation":
		return collectiontable.MatchString(tenantIsolationLabel(row.Isolation), operator, value)
	case "status":
		return collectiontable.MatchString(tenantStatusLabel(row.Status), operator, value)
	case "db_name":
		return collectiontable.MatchString(row.DBName, operator, value)
	case "instance_code":
		return collectiontable.MatchString(strings.ToUpper(row.InstanceCode), operator, value)
	case "updated_at":
		return collectiontable.MatchDate(row.UpdatedAt, operator, value)
	default:
		return false, collectiontable.ErrInvalidQuery
	}
}

func sortRows(rows []tenantRow, sortReq SortRequest) {
	columnID := strings.TrimSpace(sortReq.ColumnID)
	direction := collectiontable.NormalizeSortDirection(sortReq.Direction)
	if columnID == "" {
		columnID = "name"
	}

	less := func(left, right tenantRow) bool {
		switch columnID {
		case "tenant_id":
			return collectiontable.CompareStrings(strconv.FormatInt(left.ID, 10), strconv.FormatInt(right.ID, 10), direction)
		case "name":
			leftValue := left.Name
			if leftValue == "" {
				leftValue = left.Host
			}
			rightValue := right.Name
			if rightValue == "" {
				rightValue = right.Host
			}
			return collectiontable.CompareStrings(leftValue, rightValue, direction)
		case "host":
			return collectiontable.CompareStrings(left.Host, right.Host, direction)
		case "plan":
			return collectiontable.CompareStrings(tenantPlanLabel(left.Plan), tenantPlanLabel(right.Plan), direction)
		case "isolation":
			return collectiontable.CompareStrings(tenantIsolationLabel(left.Isolation), tenantIsolationLabel(right.Isolation), direction)
		case "status":
			return collectiontable.CompareStrings(tenantStatusLabel(left.Status), tenantStatusLabel(right.Status), direction)
		case "db_name":
			return collectiontable.CompareStrings(left.DBName, right.DBName, direction)
		case "instance_code":
			return collectiontable.CompareStrings(left.InstanceCode, right.InstanceCode, direction)
		case "updated_at":
			return collectiontable.CompareTimes(left.UpdatedAt, right.UpdatedAt, direction)
		default:
			return collectiontable.CompareStrings(left.Host, right.Host, direction)
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

func tenantFields() []FieldDefinition {
	return []FieldDefinition{
		{ID: "tenant_id", Label: "Tenant ID", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "name", Label: "Name", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "host", Label: "Host", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "plan", Label: "Plan", Type: "badge", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "isolation", Label: "Isolation", Type: "badge", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "status", Label: "Status", Type: "badge", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "db_name", Label: "Database", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "instance_code", Label: "Instance", Type: "text", Searchable: true, Sortable: true, Suggestable: true},
		{ID: "updated_at", Label: "Updated", Type: "date", Searchable: true, Sortable: true, Suggestable: false},
	}
}

func tenantColumns() []ColumnDefinition {
	return []ColumnDefinition{
		{ID: "tenant_id", Label: "Tenant ID", Type: "text", FieldID: "tenant_id", DefaultVisible: true},
		{ID: "name", Label: "Name", Type: "text", FieldID: "name", DefaultVisible: true},
		{ID: "host", Label: "Host", Type: "text", FieldID: "host", DefaultVisible: true},
		{ID: "plan", Label: "Plan", Type: "badge", FieldID: "plan", DefaultVisible: true},
		{ID: "isolation", Label: "Isolation", Type: "badge", FieldID: "isolation", DefaultVisible: true},
		{ID: "status", Label: "Status", Type: "badge", FieldID: "status", DefaultVisible: true},
		{ID: "db_name", Label: "Database", Type: "text", FieldID: "db_name", DefaultVisible: true},
		{ID: "instance_code", Label: "Instance", Type: "text", FieldID: "instance_code", DefaultVisible: true},
		{ID: "updated_at", Label: "Updated", Type: "date", FieldID: "updated_at", DefaultVisible: true},
	}
}

func tenantPlanLabel(plan string) string {
	switch strings.TrimSpace(strings.ToLower(plan)) {
	case "enterprise":
		return "Enterprise"
	case "pro":
		return "Pro"
	case "light":
		return "Light"
	case "trial":
		return "Trial"
	default:
		return humanizeToken(plan)
	}
}

func tenantPlanTone(plan string) string {
	switch strings.TrimSpace(strings.ToLower(plan)) {
	case "enterprise":
		return "brand"
	case "pro":
		return "info"
	case "trial":
		return "warning"
	default:
		return "neutral"
	}
}

func tenantIsolationLabel(isolation string) string {
	switch strings.TrimSpace(strings.ToLower(isolation)) {
	case "sandbox":
		return "Sandbox"
	case "dedicated_db":
		return "Dedicated DB"
	default:
		return humanizeToken(isolation)
	}
}

func tenantIsolationTone(isolation string) string {
	switch strings.TrimSpace(strings.ToLower(isolation)) {
	case "dedicated_db":
		return "brand"
	case "sandbox":
		return "info"
	default:
		return "neutral"
	}
}

func tenantStatusLabel(status string) string {
	switch strings.TrimSpace(strings.ToLower(status)) {
	case "active":
		return "Active"
	case "disabled":
		return "Disabled"
	case "archived":
		return "Archived"
	default:
		return humanizeToken(status)
	}
}

func tenantStatusTone(status string) string {
	switch strings.TrimSpace(strings.ToLower(status)) {
	case "active":
		return "success"
	case "disabled":
		return "warning"
	default:
		return "neutral"
	}
}

func humanizeToken(value string) string {
	normalized := strings.TrimSpace(strings.ToLower(value))
	if normalized == "" {
		return "Unknown"
	}

	parts := strings.Fields(strings.ReplaceAll(normalized, "_", " "))
	for index, part := range parts {
		if part == "db" {
			parts[index] = "DB"
			continue
		}
		parts[index] = strings.ToUpper(part[:1]) + part[1:]
	}

	return strings.Join(parts, " ")
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
