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
	optionPage        *AccessOptionsPageResponse
	record            *ConfigRecord
	options           *AccessOptionsResponse
	runtimeRootAccess bool
	runtimeUser       runtimeNavigationUserContext
	runtimeUserID     string
}

func (r *memoryRepository) GetConfig(_ context.Context, _ requestctx.TenantInfo, configKey string) (*ConfigRecord, error) {
	if r.record == nil || r.record.ConfigKey != configKey {
		return nil, nil
	}
	copy := *r.record
	copy.DefinitionJSON = append([]byte(nil), r.record.DefinitionJSON...)
	return &copy, nil
}

func (r *memoryRepository) SaveConfig(_ context.Context, _ requestctx.TenantInfo, record ConfigRecord, _ NavigationDefinition, expectedVersion *int64) (*ConfigRecord, error) {
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

func (r *memoryRepository) ListAccessOptions(_ context.Context, _ requestctx.TenantInfo) (*AccessOptionsResponse, error) {
	if r.options == nil {
		return &AccessOptionsResponse{}, nil
	}
	copy := *r.options
	copy.Users = append([]AccessRecipientOption(nil), r.options.Users...)
	copy.Companies = append([]AccessRecipientOption(nil), r.options.Companies...)
	copy.CompanyTypes = append([]AccessRecipientOption(nil), r.options.CompanyTypes...)
	copy.JobTypes = append([]AccessRecipientOption(nil), r.options.JobTypes...)
	return &copy, nil
}

func (r *memoryRepository) ListAccessOptionPage(_ context.Context, _ requestctx.TenantInfo, req AccessOptionsPageRequest) (*AccessOptionsPageResponse, error) {
	if r.optionPage == nil {
		return &AccessOptionsPageResponse{
			Category: req.Category,
			Items:    []AccessRecipientOption{},
			Page:     req.Page,
			PageSize: req.PageSize,
		}, nil
	}
	copy := *r.optionPage
	copy.Items = append([]AccessRecipientOption(nil), r.optionPage.Items...)
	copy.Category = req.Category
	copy.Page = req.Page
	copy.PageSize = req.PageSize
	return &copy, nil
}

func (r *memoryRepository) LoadRuntimeNavigationState(_ context.Context, _ requestctx.TenantInfo, configKey string, userID string, rootAccess bool) (*runtimeNavigationState, error) {
	r.runtimeRootAccess = rootAccess
	r.runtimeUserID = userID

	user := r.runtimeUser
	if !user.Authenticated {
		user = runtimeNavigationUserContext{
			Authenticated: true,
			UserID:        "1",
			CompanyID:     "10",
			CompanyTypeID: "100",
			JobTypeID:     "20",
		}
	}
	if rootAccess {
		user = runtimeNavigationUserContext{
			Authenticated: true,
			IsRoot:        true,
			UserID:        userID,
		}
	}

	if r.record == nil || r.record.ConfigKey != configKey {
		return &runtimeNavigationState{User: user}, nil
	}

	definition, err := decodeDefinition(r.record.DefinitionJSON)
	if err != nil {
		return nil, err
	}
	rows := buildDerivedNavigationRows(definition)
	return &runtimeNavigationState{
		User:     user,
		Items:    rows.Items,
		Policies: rows.Policies,
		Subjects: rows.Subjects,
	}, nil
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

func navigationBuilderRootTestContext() context.Context {
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		Level:    100,
		Role:     "root",
		TenantID: "101",
		UserID:   "99999999-9999-9999-9999-999999999999",
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

func TestSaveConfigRootOnlyAccessRequiresRoot(t *testing.T) {
	definition := sampleDefinition()
	definition.UtilityRail = []NavigationRailItem{
		{ID: "rail.platform-studio", Key: "platform-studio", Label: "Platform Studio", Active: boolPtr(true), Access: json.RawMessage(`{"mode":"root_only"}`)},
	}
	service := NewService(&memoryRepository{})

	_, err := service.SaveConfig(navigationBuilderTestContext(), SaveConfigRequest{Definition: definition})
	if !errors.Is(err, ErrRootAccessRequired) {
		t.Fatalf("SaveConfig error = %v, want ErrRootAccessRequired", err)
	}

	out, err := service.SaveConfig(navigationBuilderRootTestContext(), SaveConfigRequest{Definition: definition})
	if err != nil {
		t.Fatalf("root SaveConfig returned error: %v", err)
	}
	if out.ValidationSummary.CanSave != true {
		t.Fatalf("root SaveConfig validation summary = %#v", out.ValidationSummary)
	}
}

func TestSaveConfigCannotRemoveExistingRootOnlyAccessWithoutRoot(t *testing.T) {
	rootDefinition := sampleDefinition()
	rootDefinition.UtilityRail = []NavigationRailItem{
		{ID: "rail.platform-studio", Key: "platform-studio", Label: "Platform Studio", Active: boolPtr(true), Access: json.RawMessage(`{"mode":"root_only"}`)},
	}
	raw, err := json.Marshal(rootDefinition)
	if err != nil {
		t.Fatalf("marshal root definition: %v", err)
	}
	service := NewService(&memoryRepository{
		record: &ConfigRecord{
			ConfigKey:      ConfigKeyDefault,
			DefinitionJSON: raw,
			Version:        1,
		},
	})

	nextDefinition := sampleDefinition()
	nextDefinition.UtilityRail = []NavigationRailItem{
		{ID: "rail.platform-studio", Key: "platform-studio", Label: "Platform Studio", Active: boolPtr(true), Access: json.RawMessage(`{"mode":"inherit"}`)},
	}
	expectedVersion := int64(1)
	_, err = service.SaveConfig(navigationBuilderTestContext(), SaveConfigRequest{
		Definition:      nextDefinition,
		ExpectedVersion: &expectedVersion,
	})
	if !errors.Is(err, ErrRootAccessRequired) {
		t.Fatalf("SaveConfig error = %v, want ErrRootAccessRequired", err)
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

func TestLoadRuntimeNavigationUsesRootAccessFromClaims(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Access = json.RawMessage(`{"mode":"selected_only","companies":["404"]}`)
	raw, err := json.Marshal(definition)
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

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		Level:    100,
		Role:     "root",
		TenantID: "101",
		UserID:   "root-user",
	})
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{
		DBName:         "tenant_101",
		DBInstanceCode: "local",
		ID:             "101",
		Name:           "Demo Tenant",
	})

	out, err := service.LoadRuntimeNavigation(ctx)
	if err != nil {
		t.Fatalf("LoadRuntimeNavigation returned error: %v", err)
	}
	if !repo.runtimeRootAccess {
		t.Fatalf("runtime root access flag = false, want true")
	}
	if repo.runtimeUserID != "root-user" {
		t.Fatalf("runtime user id = %q, want root-user", repo.runtimeUserID)
	}
	if !hasRuntimeItem(out.Items, "nav.group.safety") {
		t.Fatalf("root did not receive access-restricted branch: %#v", out.Items)
	}
}

func TestAuthorizeRuntimeTargetAllowsConfiguredFormView(t *testing.T) {
	raw, err := json.Marshal(sampleDefinition())
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

	err = service.AuthorizeRuntimeTarget(navigationBuilderTestContext(), RuntimeTargetAccessRequest{
		TargetType: TargetTypeFormView,
		ModelID:    "sor",
		ViewID:     "view-default",
	})
	if err != nil {
		t.Fatalf("AuthorizeRuntimeTarget returned error: %v", err)
	}
}

func TestAuthorizeRuntimeTargetDeniesFormViewWhenParentDenied(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Access = json.RawMessage(`{"mode":"selected_only","companies":["999"]}`)
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

	err = service.AuthorizeRuntimeTarget(navigationBuilderTestContext(), RuntimeTargetAccessRequest{
		TargetType: TargetTypeFormView,
		ModelID:    "sor",
		ViewID:     "view-default",
	})
	if !errors.Is(err, ErrAccessDenied) {
		t.Fatalf("AuthorizeRuntimeTarget error = %v, want ErrAccessDenied", err)
	}
}

func TestAuthorizeRuntimeTargetAllowsPlatformStudioWhenRailUnconfigured(t *testing.T) {
	definition := sampleDefinition()
	definition.UtilityRail = []NavigationRailItem{}
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

	err = service.AuthorizeRuntimeTarget(navigationBuilderTestContext(), RuntimeTargetAccessRequest{
		TargetType: RuntimeTargetTypeUtilityRail,
		UtilityKey: "platform-studio",
	})
	if err != nil {
		t.Fatalf("AuthorizeRuntimeTarget returned error: %v", err)
	}
}

func TestAuthorizeRuntimeTargetDeniesPlatformStudioWhenRailRestricted(t *testing.T) {
	definition := sampleDefinition()
	definition.UtilityRail[0].Access = json.RawMessage(`{"mode":"selected_only","users":["999"]}`)
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

	err = service.AuthorizeRuntimeTarget(navigationBuilderTestContext(), RuntimeTargetAccessRequest{
		TargetType: RuntimeTargetTypeUtilityRail,
		UtilityKey: "platform-studio",
	})
	if !errors.Is(err, ErrAccessDenied) {
		t.Fatalf("AuthorizeRuntimeTarget error = %v, want ErrAccessDenied", err)
	}
}

func TestAuthorizeRuntimeTargetRootBypassesTargetRestrictions(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Access = json.RawMessage(`{"mode":"selected_only","companies":["999"]}`)
	definition.UtilityRail[0].Access = json.RawMessage(`{"mode":"selected_only","users":["999"]}`)
	raw, err := json.Marshal(definition)
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

	err = service.AuthorizeRuntimeTarget(navigationBuilderRootTestContext(), RuntimeTargetAccessRequest{
		TargetType: TargetTypeFormView,
		ModelID:    "missing",
		ViewID:     "missing",
	})
	if err != nil {
		t.Fatalf("AuthorizeRuntimeTarget root returned error: %v", err)
	}
	if repo.runtimeRootAccess {
		t.Fatalf("root target authorization should bypass without loading runtime state")
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

func TestLoadAccessOptionsRequiresTenantAndClaims(t *testing.T) {
	service := NewService(&memoryRepository{})

	_, err := service.LoadAccessOptions(context.Background())
	if !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("LoadAccessOptions without claims = %v, want ErrUnauthorized", err)
	}

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{UserID: "user-1"})
	_, err = service.LoadAccessOptions(ctx)
	if !errors.Is(err, ErrTenantMissing) {
		t.Fatalf("LoadAccessOptions without tenant = %v, want ErrTenantMissing", err)
	}
}

func TestLoadAccessOptionsNormalizesNilCollections(t *testing.T) {
	service := NewService(&memoryRepository{options: &AccessOptionsResponse{}})

	out, err := service.LoadAccessOptions(navigationBuilderTestContext())
	if err != nil {
		t.Fatalf("LoadAccessOptions returned error: %v", err)
	}
	if out.Users == nil || out.Companies == nil || out.CompanyTypes == nil || out.JobTypes == nil {
		t.Fatalf("access option collections should be normalized: %#v", out)
	}
}

func TestLoadAccessOptionPageNormalizesRequest(t *testing.T) {
	service := NewService(&memoryRepository{optionPage: &AccessOptionsPageResponse{
		Items: []AccessRecipientOption{{ID: "42", Label: "Anna"}},
		Total: 1,
	}})

	out, err := service.LoadAccessOptionPage(navigationBuilderTestContext(), AccessOptionsPageRequest{
		Category: "company_type",
		IDs:      []string{" gc ", "gc", ""},
		Page:     -1,
		PageSize: 1000,
		Search:   "  General Contractor  ",
	})
	if err != nil {
		t.Fatalf("LoadAccessOptionPage returned error: %v", err)
	}
	if out.Category != "companyTypes" {
		t.Fatalf("category = %q, want companyTypes", out.Category)
	}
	if out.Page != 1 || out.PageSize != 100 {
		t.Fatalf("page = %d pageSize = %d, want normalized 1/100", out.Page, out.PageSize)
	}
}

func TestLoadAccessOptionPageRejectsUnknownCategory(t *testing.T) {
	service := NewService(&memoryRepository{})

	_, err := service.LoadAccessOptionPage(navigationBuilderTestContext(), AccessOptionsPageRequest{Category: "teams"})
	if !errors.Is(err, ErrInvalidAccessOptions) {
		t.Fatalf("LoadAccessOptionPage error = %v, want ErrInvalidAccessOptions", err)
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
