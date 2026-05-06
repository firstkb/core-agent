package platformstudionavigationbuilder

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrConflict          = errors.New("navigation builder version conflict")
	ErrInvalidDefinition = errors.New("navigation builder invalid definition")
	ErrTenantMissing     = errors.New("navigation builder tenant missing")
	ErrUnauthorized      = errors.New("navigation builder unauthorized")
)

type Repository interface {
	GetConfig(ctx context.Context, tenant requestctx.TenantInfo, configKey string) (*ConfigRecord, error)
	SaveConfig(ctx context.Context, tenant requestctx.TenantInfo, record ConfigRecord, expectedVersion *int64) (*ConfigRecord, error)
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
	}, req.ExpectedVersion)
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
