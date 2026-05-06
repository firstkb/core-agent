package platformstudionavigationbuilder

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type memoryRepository struct {
	record *ConfigRecord
}

func (r *memoryRepository) GetConfig(_ context.Context, _ requestctx.TenantInfo, configKey string) (*ConfigRecord, error) {
	if r.record == nil || r.record.ConfigKey != configKey {
		return nil, nil
	}
	copy := *r.record
	copy.DefinitionJSON = append([]byte(nil), r.record.DefinitionJSON...)
	return &copy, nil
}

func (r *memoryRepository) SaveConfig(_ context.Context, _ requestctx.TenantInfo, record ConfigRecord, expectedVersion *int64) (*ConfigRecord, error) {
	if r.record == nil {
		if expectedVersion != nil && *expectedVersion != 0 {
			return nil, ErrConflict
		}
		record.Version = 1
		record.ConfigKey = ConfigKeyDefault
		if record.UpdatedAt.IsZero() {
			record.UpdatedAt = time.Date(2026, 5, 6, 12, 0, 0, 0, time.UTC)
		}
		r.record = &record
		copy := *r.record
		copy.DefinitionJSON = append([]byte(nil), r.record.DefinitionJSON...)
		return &copy, nil
	}

	if expectedVersion != nil && *expectedVersion != r.record.Version {
		return nil, ErrConflict
	}
	record.Version = r.record.Version + 1
	record.ConfigKey = ConfigKeyDefault
	if record.UpdatedAt.IsZero() {
		record.UpdatedAt = time.Date(2026, 5, 6, 12, 0, 0, 0, time.UTC)
	}
	r.record = &record
	copy := *r.record
	copy.DefinitionJSON = append([]byte(nil), r.record.DefinitionJSON...)
	return &copy, nil
}

func navigationBuilderTestContext() context.Context {
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		TenantID: "101",
		UserID:   "11111111-1111-1111-1111-111111111111",
	})
	return requestctx.WithTenant(ctx, requestctx.TenantInfo{
		DBName:         "tenant_101",
		DBInstanceCode: "local",
		ID:             "101",
		Name:           "Demo Tenant",
	})
}

func sampleDefinition() NavigationDefinition {
	return NavigationDefinition{
		SchemaVersion: SchemaVersionV1,
		AppMenu: []NavigationNode{
			{
				ID:    "nav.title.operations",
				Type:  NodeTypeMenuTitle,
				Label: "Operations",
			},
			{
				ID:     "nav.group.safety",
				Type:   NodeTypeMenuGroup,
				Label:  "Safety",
				Icon:   "shield",
				Active: boolPtr(true),
				Children: []NavigationNode{
					{
						ID:     "nav.entry.inspections",
						Type:   NodeTypeFormView,
						Label:  "Inspections",
						Active: boolPtr(true),
						Target: &NavigationTarget{
							Type:    TargetTypeFormView,
							ModelID: "sor",
							ViewID:  "view-default",
						},
					},
					{
						ID:     "nav.entry.business-tree",
						Type:   NodeTypeAppPage,
						Label:  "Business Tree",
						Active: boolPtr(true),
						Target: &NavigationTarget{
							Type:   TargetTypeAppPage,
							PageID: "business-tree",
							Route:  "/app/pages/business-tree",
						},
					},
				},
			},
		},
		UtilityRail: []NavigationRailItem{
			{ID: "rail.platform-studio", Key: "platform-studio", Label: "Platform Studio", Active: boolPtr(true)},
		},
	}
}

func TestLoadConfigReturnsDefaultWhenMissing(t *testing.T) {
	service := NewService(&memoryRepository{})

	out, err := service.LoadConfig(navigationBuilderTestContext())
	if err != nil {
		t.Fatalf("LoadConfig returned error: %v", err)
	}

	if out.Version != 0 {
		t.Fatalf("version = %d, want 0", out.Version)
	}
	if out.Definition.SchemaVersion != SchemaVersionV1 {
		t.Fatalf("schema version = %d, want %d", out.Definition.SchemaVersion, SchemaVersionV1)
	}
	if len(out.Definition.AppMenu) != 0 {
		t.Fatalf("default app menu count = %d, want 0", len(out.Definition.AppMenu))
	}
	if !out.ValidationSummary.CanSave {
		t.Fatalf("default definition should be saveable: %#v", out.ValidationSummary)
	}
}

func TestSaveConfigPersistsDefinitionAndIncrementsVersion(t *testing.T) {
	repo := &memoryRepository{}
	service := NewService(repo)
	service.now = func() time.Time {
		return time.Date(2026, 5, 6, 12, 30, 0, 0, time.UTC)
	}

	first, err := service.SaveConfig(navigationBuilderTestContext(), SaveConfigRequest{Definition: sampleDefinition()})
	if err != nil {
		t.Fatalf("first SaveConfig returned error: %v", err)
	}
	if first.Version != 1 {
		t.Fatalf("first version = %d, want 1", first.Version)
	}
	if first.UpdatedBy != "11111111-1111-1111-1111-111111111111" {
		t.Fatalf("updatedBy = %q", first.UpdatedBy)
	}

	expected := int64(1)
	nextDefinition := sampleDefinition()
	nextDefinition.AppMenu[1].Label = "Safety program"
	second, err := service.SaveConfig(navigationBuilderTestContext(), SaveConfigRequest{
		Definition:      nextDefinition,
		ExpectedVersion: &expected,
	})
	if err != nil {
		t.Fatalf("second SaveConfig returned error: %v", err)
	}
	if second.Version != 2 {
		t.Fatalf("second version = %d, want 2", second.Version)
	}
	if second.Definition.AppMenu[1].Label != "Safety program" {
		t.Fatalf("saved label = %q", second.Definition.AppMenu[1].Label)
	}
}

func TestSaveConfigRejectsVersionConflict(t *testing.T) {
	repo := &memoryRepository{}
	service := NewService(repo)

	if _, err := service.SaveConfig(navigationBuilderTestContext(), SaveConfigRequest{Definition: sampleDefinition()}); err != nil {
		t.Fatalf("seed SaveConfig returned error: %v", err)
	}

	expected := int64(7)
	_, err := service.SaveConfig(navigationBuilderTestContext(), SaveConfigRequest{
		Definition:      sampleDefinition(),
		ExpectedVersion: &expected,
	})
	if !errors.Is(err, ErrConflict) {
		t.Fatalf("SaveConfig error = %v, want ErrConflict", err)
	}
}

func TestSaveConfigRejectsDuplicateTargets(t *testing.T) {
	service := NewService(&memoryRepository{})
	definition := sampleDefinition()
	definition.AppMenu[1].Children = append(definition.AppMenu[1].Children, NavigationNode{
		ID:     "nav.entry.inspections-copy",
		Type:   NodeTypeFormView,
		Label:  "Inspections copy",
		Active: boolPtr(true),
		Target: &NavigationTarget{
			Type:    TargetTypeFormView,
			ModelID: "sor",
			ViewID:  "view-default",
		},
	})

	_, err := service.SaveConfig(navigationBuilderTestContext(), SaveConfigRequest{Definition: definition})
	if !errors.Is(err, ErrInvalidDefinition) {
		t.Fatalf("SaveConfig error = %v, want ErrInvalidDefinition", err)
	}
}

func TestLoadRuntimeNavigationProjectsActiveItems(t *testing.T) {
	raw, err := json.Marshal(sampleDefinition())
	if err != nil {
		t.Fatalf("marshal sample definition: %v", err)
	}
	repo := &memoryRepository{
		record: &ConfigRecord{
			ConfigKey:      ConfigKeyDefault,
			DefinitionJSON: raw,
			Version:        1,
		},
	}
	service := NewService(repo)

	out, err := service.LoadRuntimeNavigation(navigationBuilderTestContext())
	if err != nil {
		t.Fatalf("LoadRuntimeNavigation returned error: %v", err)
	}

	if len(out.Items) != 2 {
		t.Fatalf("runtime item count = %d, want 2", len(out.Items))
	}
	safety := out.Items[1]
	if safety.ID != "nav.group.safety" {
		t.Fatalf("second item id = %q, want nav.group.safety", safety.ID)
	}
	if len(safety.Children) != 2 {
		t.Fatalf("safety child count = %d, want 2", len(safety.Children))
	}
	if safety.Children[0].Path != "/app/forms/sor/views/view-default" {
		t.Fatalf("form view path = %q", safety.Children[0].Path)
	}
	if got, want := safety.Children[0].Breadcrumb, []string{"Safety", "Inspections"}; len(got) != len(want) || got[0] != want[0] || got[1] != want[1] {
		t.Fatalf("form view breadcrumb = %#v, want %#v", got, want)
	}
	if safety.Children[1].Path != "/app/pages/business-tree" {
		t.Fatalf("app page path = %q", safety.Children[1].Path)
	}
}

func TestLoadRuntimeNavigationExcludesInactiveItems(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Children[0].Active = boolPtr(false)
	raw, err := json.Marshal(definition)
	if err != nil {
		t.Fatalf("marshal sample definition: %v", err)
	}
	service := NewService(&memoryRepository{
		record: &ConfigRecord{
			ConfigKey:      ConfigKeyDefault,
			DefinitionJSON: raw,
			Version:        1,
		},
	})

	out, err := service.LoadRuntimeNavigation(navigationBuilderTestContext())
	if err != nil {
		t.Fatalf("LoadRuntimeNavigation returned error: %v", err)
	}

	safety := out.Items[1]
	if len(safety.Children) != 1 {
		t.Fatalf("safety child count = %d, want 1", len(safety.Children))
	}
	if safety.Children[0].ID != "nav.entry.business-tree" {
		t.Fatalf("remaining child id = %q", safety.Children[0].ID)
	}
}

func TestSaveConfigRequiresTenantAndClaims(t *testing.T) {
	service := NewService(&memoryRepository{})

	_, err := service.SaveConfig(context.Background(), SaveConfigRequest{Definition: sampleDefinition()})
	if !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("SaveConfig without claims = %v, want ErrUnauthorized", err)
	}

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{UserID: "user-1"})
	_, err = service.SaveConfig(ctx, SaveConfigRequest{Definition: sampleDefinition()})
	if !errors.Is(err, ErrTenantMissing) {
		t.Fatalf("SaveConfig without tenant = %v, want ErrTenantMissing", err)
	}
}

func TestDecodeDefinitionNormalizesEmptyCollections(t *testing.T) {
	raw := json.RawMessage(`{"schemaVersion":1}`)
	definition, err := decodeDefinition(raw)
	if err != nil {
		t.Fatalf("decodeDefinition returned error: %v", err)
	}
	if definition.AppMenu == nil {
		t.Fatalf("app menu should be normalized to an empty slice")
	}
	if definition.UtilityRail == nil {
		t.Fatalf("utility rail should be normalized to an empty slice")
	}
}

func boolPtr(value bool) *bool {
	return &value
}
