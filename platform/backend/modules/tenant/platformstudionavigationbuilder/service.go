package platformstudionavigationbuilder

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrInvalidAccessOptions = errors.New("navigation builder invalid access options request")
	ErrConflict             = errors.New("navigation builder version conflict")
	ErrInvalidDefinition    = errors.New("navigation builder invalid definition")
	ErrTenantMissing        = errors.New("navigation builder tenant missing")
	ErrUnauthorized         = errors.New("navigation builder unauthorized")
)

type Repository interface {
	GetConfig(ctx context.Context, tenant requestctx.TenantInfo, configKey string) (*ConfigRecord, error)
	ListAccessOptionPage(ctx context.Context, tenant requestctx.TenantInfo, req AccessOptionsPageRequest) (*AccessOptionsPageResponse, error)
	ListAccessOptions(ctx context.Context, tenant requestctx.TenantInfo) (*AccessOptionsResponse, error)
	SaveConfig(ctx context.Context, tenant requestctx.TenantInfo, record ConfigRecord, definition NavigationDefinition, expectedVersion *int64) (*ConfigRecord, error)
}

type Service struct {
	repo Repository
	now  func() time.Time
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
		now:  func() time.Time { return time.Now().UTC() },
	}
}

func (s *Service) LoadConfig(ctx context.Context) (*LoadConfigResponse, error) {
	tenant, _, err := requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	record, err := s.repo.GetConfig(ctx, tenant, ConfigKeyDefault)
	if err != nil {
		return nil, err
	}
	if record == nil {
		definition := defaultDefinition()
		return &LoadConfigResponse{
			ConfigKey:         ConfigKeyDefault,
			Definition:        definition,
			Version:           0,
			ValidationSummary: ValidateDefinition(definition),
		}, nil
	}

	definition, err := decodeDefinition(record.DefinitionJSON)
	if err != nil {
		return nil, err
	}

	return buildResponse(record, definition), nil
}

func (s *Service) LoadRuntimeNavigation(ctx context.Context) (*RuntimeNavigationResponse, error) {
	tenant, _, err := requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	record, err := s.repo.GetConfig(ctx, tenant, ConfigKeyDefault)
	if err != nil {
		return nil, err
	}
	if record == nil {
		return &RuntimeNavigationResponse{Items: []RuntimeNavigationItem{}}, nil
	}

	definition, err := decodeDefinition(record.DefinitionJSON)
	if err != nil {
		return nil, err
	}

	return &RuntimeNavigationResponse{
		Items: projectRuntimeNavigationItems(definition.AppMenu, nil),
	}, nil
}

func (s *Service) LoadAccessOptions(ctx context.Context) (*AccessOptionsResponse, error) {
	tenant, _, err := requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	options, err := s.repo.ListAccessOptions(ctx, tenant)
	if err != nil {
		return nil, err
	}
	if options == nil {
		return &AccessOptionsResponse{
			Users:        []AccessRecipientOption{},
			Companies:    []AccessRecipientOption{},
			CompanyTypes: []AccessRecipientOption{},
			JobTypes:     []AccessRecipientOption{},
		}, nil
	}
	if options.Users == nil {
		options.Users = []AccessRecipientOption{}
	}
	if options.Companies == nil {
		options.Companies = []AccessRecipientOption{}
	}
	if options.CompanyTypes == nil {
		options.CompanyTypes = []AccessRecipientOption{}
	}
	if options.JobTypes == nil {
		options.JobTypes = []AccessRecipientOption{}
	}
	return options, nil
}

func (s *Service) LoadAccessOptionPage(ctx context.Context, req AccessOptionsPageRequest) (*AccessOptionsPageResponse, error) {
	tenant, _, err := requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	normalized, err := normalizeAccessOptionsPageRequest(req)
	if err != nil {
		return nil, err
	}

	page, err := s.repo.ListAccessOptionPage(ctx, tenant, normalized)
	if err != nil {
		return nil, err
	}
	if page == nil {
		return &AccessOptionsPageResponse{
			Category: normalized.Category,
			Items:    []AccessRecipientOption{},
			Page:     normalized.Page,
			PageSize: normalized.PageSize,
		}, nil
	}
	if page.Items == nil {
		page.Items = []AccessRecipientOption{}
	}
	return page, nil
}

func normalizeAccessOptionsPageRequest(req AccessOptionsPageRequest) (AccessOptionsPageRequest, error) {
	category := normalizeAccessOptionsCategory(req.Category)
	if category == "" {
		return AccessOptionsPageRequest{}, ErrInvalidAccessOptions
	}

	page := req.Page
	if page < 1 {
		page = 1
	}

	pageSize := req.PageSize
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 100 {
		pageSize = 100
	}

	search := strings.TrimSpace(req.Search)
	if len(search) > 120 {
		search = search[:120]
	}

	ids := make([]string, 0, len(req.IDs))
	seenIDs := map[string]struct{}{}
	for _, id := range req.IDs {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		if _, ok := seenIDs[id]; ok {
			continue
		}
		seenIDs[id] = struct{}{}
		ids = append(ids, id)
		if len(ids) >= 100 {
			break
		}
	}

	return AccessOptionsPageRequest{
		Category: category,
		IDs:      ids,
		Page:     page,
		PageSize: pageSize,
		Search:   search,
	}, nil
}

func normalizeAccessOptionsCategory(category string) string {
	switch strings.TrimSpace(category) {
	case "users", "user":
		return "users"
	case "companies", "company":
		return "companies"
	case "companyTypes", "company_types", "company-types", "companyType", "company_type", "company-type":
		return "companyTypes"
	case "jobtypes", "jobTypes", "job_types", "job-types", "jobtype", "jobType", "job_type", "job-type":
		return "jobtypes"
	default:
		return ""
	}
}

func (s *Service) SaveConfig(ctx context.Context, req SaveConfigRequest) (*SaveConfigResponse, error) {
	tenant, claims, err := requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	definition := normalizeDefinition(req.Definition)
	validation := ValidateDefinition(definition)
	if !validation.CanSave {
		return nil, ErrInvalidDefinition
	}

	payload, err := json.Marshal(definition)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: encode definition: %w", err)
	}

	record, err := s.repo.SaveConfig(ctx, tenant, ConfigRecord{
		ConfigKey:      ConfigKeyDefault,
		DefinitionJSON: payload,
		UpdatedAt:      s.now(),
		UpdatedBy:      strings.TrimSpace(claims.UserID),
	}, definition, req.ExpectedVersion)
	if err != nil {
		return nil, err
	}
	if record == nil {
		return nil, fmt.Errorf("navigation builder: save returned no record")
	}

	return buildResponse(record, definition), nil
}

func requireAuthoringContext(ctx context.Context) (requestctx.TenantInfo, requestctx.ClaimsInfo, error) {
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

func buildResponse(record *ConfigRecord, definition NavigationDefinition) *LoadConfigResponse {
	updatedAt := ""
	if !record.UpdatedAt.IsZero() {
		updatedAt = record.UpdatedAt.UTC().Format(time.RFC3339)
	}

	return &LoadConfigResponse{
		ConfigKey:         strings.TrimSpace(record.ConfigKey),
		Definition:        definition,
		Version:           record.Version,
		UpdatedAt:         updatedAt,
		UpdatedBy:         strings.TrimSpace(record.UpdatedBy),
		ValidationSummary: ValidateDefinition(definition),
	}
}

func projectRuntimeNavigationItems(nodes []NavigationNode, parentBreadcrumb []string) []RuntimeNavigationItem {
	items := make([]RuntimeNavigationItem, 0, len(nodes))
	for _, node := range nodes {
		if !navigationNodeIsActive(node) {
			continue
		}

		breadcrumb := append(append([]string{}, parentBreadcrumb...), node.Label)
		children := projectRuntimeNavigationItems(node.Children, breadcrumb)
		item := RuntimeNavigationItem{
			ID:         node.ID,
			Label:      node.Label,
			Type:       node.Type,
			Icon:       node.Icon,
			TargetType: runtimeTargetType(node.Target),
			Breadcrumb: breadcrumb,
			Children:   children,
		}

		if node.Target != nil {
			item.Path = runtimeTargetPath(*node.Target)
			item.ExternalURL = runtimeTargetExternalURL(*node.Target)
		}

		if shouldExposeRuntimeNavigationItem(item, node.Type) {
			items = append(items, item)
		}
	}
	return items
}

func navigationNodeIsActive(node NavigationNode) bool {
	return node.Active == nil || *node.Active
}

func runtimeTargetType(target *NavigationTarget) string {
	if target == nil {
		return ""
	}
	return target.Type
}

func runtimeTargetPath(target NavigationTarget) string {
	switch target.Type {
	case TargetTypeFormView:
		if target.ModelID == "" || target.ViewID == "" {
			return ""
		}
		return "/app/forms/" + url.PathEscape(target.ModelID) + "/views/" + url.PathEscape(target.ViewID)
	case TargetTypeAppPage:
		if target.Route != "" {
			return target.Route
		}
		if target.PageID == "" {
			return ""
		}
		return "/app/pages/" + url.PathEscape(target.PageID)
	case TargetTypeAppModule:
		return target.Route
	default:
		return ""
	}
}

func runtimeTargetExternalURL(target NavigationTarget) string {
	if target.Type != TargetTypeExternalURL {
		return ""
	}
	return target.URL
}

func shouldExposeRuntimeNavigationItem(item RuntimeNavigationItem, nodeType string) bool {
	if nodeType == NodeTypeMenuTitle {
		return true
	}
	if item.Path != "" || item.ExternalURL != "" {
		return true
	}
	return len(item.Children) > 0
}

func decodeDefinition(raw json.RawMessage) (NavigationDefinition, error) {
	if len(raw) == 0 {
		return defaultDefinition(), nil
	}

	var definition NavigationDefinition
	if err := json.Unmarshal(raw, &definition); err != nil {
		return NavigationDefinition{}, fmt.Errorf("%w: cannot decode definition", ErrInvalidDefinition)
	}

	return normalizeDefinition(definition), nil
}

func defaultDefinition() NavigationDefinition {
	return NavigationDefinition{
		SchemaVersion: SchemaVersionV1,
		AppMenu:       []NavigationNode{},
		UtilityRail:   []NavigationRailItem{},
	}
}

func normalizeDefinition(definition NavigationDefinition) NavigationDefinition {
	if definition.SchemaVersion == 0 {
		definition.SchemaVersion = SchemaVersionV1
	}
	if definition.AppMenu == nil {
		definition.AppMenu = []NavigationNode{}
	}
	if definition.UtilityRail == nil {
		definition.UtilityRail = []NavigationRailItem{}
	}
	for i := range definition.AppMenu {
		normalizeNode(&definition.AppMenu[i])
	}
	for i := range definition.UtilityRail {
		definition.UtilityRail[i].ID = strings.TrimSpace(definition.UtilityRail[i].ID)
		definition.UtilityRail[i].Key = strings.TrimSpace(definition.UtilityRail[i].Key)
		definition.UtilityRail[i].Label = strings.TrimSpace(definition.UtilityRail[i].Label)
	}
	return definition
}

func normalizeNode(node *NavigationNode) {
	if node == nil {
		return
	}
	node.ID = strings.TrimSpace(node.ID)
	node.Type = strings.TrimSpace(node.Type)
	node.Label = strings.TrimSpace(node.Label)
	node.Icon = strings.TrimSpace(node.Icon)
	node.Channel = strings.TrimSpace(node.Channel)
	if node.Target != nil {
		node.Target.Type = strings.TrimSpace(node.Target.Type)
		node.Target.ModelID = strings.TrimSpace(node.Target.ModelID)
		node.Target.ViewID = strings.TrimSpace(node.Target.ViewID)
		node.Target.PageID = strings.TrimSpace(node.Target.PageID)
		node.Target.ModuleID = strings.TrimSpace(node.Target.ModuleID)
		node.Target.URL = strings.TrimSpace(node.Target.URL)
		node.Target.Route = strings.TrimSpace(node.Target.Route)
	}
	if node.Children == nil {
		node.Children = []NavigationNode{}
	}
	for i := range node.Children {
		normalizeNode(&node.Children[i])
	}
}
