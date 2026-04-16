package tenantlist

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

type fakeRepository struct {
	tenants []TenantRecord
}

func (f *fakeRepository) GetTenantByID(_ context.Context, tenantID int64) (*TenantRecord, error) {
	for _, tenant := range f.tenants {
		if tenant.ID == tenantID {
			record := tenant
			return &record, nil
		}
	}

	return nil, fmt.Errorf("tenant not found")
}

func (f *fakeRepository) ListTenants(context.Context) ([]TenantRecord, error) {
	return append([]TenantRecord(nil), f.tenants...), nil
}

type fakePreferences struct {
	state         *collectionprefs.State
	toggleValue   bool
	lastSurfaceID string
}

func (f *fakePreferences) LoadState(context.Context, uuid.UUID, string) (*collectionprefs.State, error) {
	if f.state == nil {
		return &collectionprefs.State{}, nil
	}
	return f.state, nil
}

func (f *fakePreferences) ToggleFavorite(_ context.Context, _ uuid.UUID, surfaceID string) (bool, error) {
	f.lastSurfaceID = surfaceID
	return f.toggleValue, nil
}

func (f *fakePreferences) CreateSavedFilter(_ context.Context, _ uuid.UUID, surfaceID string, req collectiontable.CreateSavedFilterInput) (*collectiontable.SavedFilterSet, error) {
	f.lastSurfaceID = surfaceID
	return &collectiontable.SavedFilterSet{
		ID:           uuid.NewString(),
		Label:        req.Label,
		QuickFilters: req.QuickFilters,
	}, nil
}

type fakeLauncher struct {
	lastInput authsvc.DelegatedTenantRootLaunchInput
	url       string
}

func (f *fakeLauncher) BuildLaunchURL(input authsvc.DelegatedTenantRootLaunchInput) (string, error) {
	f.lastInput = input
	if f.url != "" {
		return f.url, nil
	}
	return "https://demo.platform.local/auth/v1/auth/delegated-root/code", nil
}

func rootContext() context.Context {
	return requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: uuid.NewString(),
		Role:   "root",
		Level:  100,
		Scope:  "admin.api",
	})
}

func TestLoadMetaUsesTenantSurface(t *testing.T) {
	prefs := &fakePreferences{
		state: &collectionprefs.State{
			IsFavorite: true,
		},
	}
	svc := NewService(&fakeRepository{}, prefs, nil)

	meta, err := svc.LoadMeta(rootContext())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if meta.SurfaceID != SurfaceID || meta.Title != "List of tenants" {
		t.Fatalf("unexpected meta %+v", meta)
	}
	if !meta.Actions.Favorite.Visible || !meta.Actions.Favorite.IsFavorite {
		t.Fatalf("unexpected favorite meta %+v", meta.Actions.Favorite)
	}
	if meta.Actions.Create.Visible {
		t.Fatalf("expected create action to stay hidden because onboarding owns tenant creation")
	}
	if meta.Selection.Enabled {
		t.Fatalf("expected tenant list selection to stay disabled")
	}
	if len(meta.RowActions) != 1 || meta.RowActions[0].ID != "open_as_root" {
		t.Fatalf("expected delegated root row action, got %+v", meta.RowActions)
	}
	if meta.RowActions[0].Label != "Enter Tenant" {
		t.Fatalf("expected delegated root row action label, got %+v", meta.RowActions[0])
	}
}

func TestQueryReturnsFilteredRows(t *testing.T) {
	repo := &fakeRepository{
		tenants: []TenantRecord{
			{
				ID:           101,
				Name:         "Demo Tenant",
				Host:         "demo.platform.local",
				Plan:         "enterprise",
				Isolation:    "dedicated_db",
				Status:       "active",
				DBName:       "108-demo",
				InstanceCode: "main",
				UpdatedAt:    time.Date(2026, 4, 16, 10, 0, 0, 0, time.UTC),
			},
			{
				ID:           102,
				Name:         "Sandbox Tenant",
				Host:         "sandbox.platform.local",
				Plan:         "trial",
				Isolation:    "sandbox",
				Status:       "disabled",
				DBName:       "108-sandbox",
				InstanceCode: "shadow",
				UpdatedAt:    time.Date(2026, 4, 15, 10, 0, 0, 0, time.UTC),
			},
		},
	}
	svc := NewService(repo, &fakePreferences{}, nil)

	out, err := svc.Query(rootContext(), QueryRequest{
		Page:     1,
		PageSize: 25,
		QuickFilters: []QuickFilter{
			{FieldID: "all", Operator: "contains", Value: "demo"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out.TotalItems != 1 || len(out.Rows) != 1 {
		t.Fatalf("unexpected query result %+v", out)
	}
	if out.Rows[0].ID != "101" {
		t.Fatalf("unexpected row id %+v", out.Rows[0])
	}
	if out.Rows[0].Cells["tenant_id"].DisplayValue != "101" {
		t.Fatalf("expected tenant id cell, got %+v", out.Rows[0].Cells["tenant_id"])
	}
	if out.Rows[0].Selectable {
		t.Fatalf("expected tenant rows to stay non-selectable")
	}
	if out.Rows[0].Cells["status"].Label != "Active" {
		t.Fatalf("unexpected projected status %+v", out.Rows[0].Cells["status"])
	}
}

func TestLoadSearchSuggestionsBuildsTenantGroups(t *testing.T) {
	repo := &fakeRepository{
		tenants: []TenantRecord{
			{
				ID:           101,
				Name:         "Demo Tenant",
				Host:         "demo.platform.local",
				Plan:         "enterprise",
				Isolation:    "dedicated_db",
				Status:       "active",
				DBName:       "108-demo",
				InstanceCode: "main",
				UpdatedAt:    time.Now(),
			},
		},
	}
	svc := NewService(repo, &fakePreferences{}, nil)

	out, err := svc.LoadSearchSuggestions(rootContext())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(out.Groups) < 4 {
		t.Fatalf("expected tenant suggestion groups, got %+v", out)
	}
}

func TestCreateSavedFilterUsesTenantSurface(t *testing.T) {
	prefs := &fakePreferences{}
	svc := NewService(&fakeRepository{}, prefs, nil)

	_, err := svc.CreateSavedFilter(rootContext(), CreateSavedFilterInput{
		Label: "Production",
		QuickFilters: []QuickFilter{
			{FieldID: "plan", Operator: "contains", Value: "Enterprise"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if prefs.lastSurfaceID != SurfaceID {
		t.Fatalf("expected surface %q, got %q", SurfaceID, prefs.lastSurfaceID)
	}
}

func TestRunRowActionBuildsDelegatedTenantLaunchURL(t *testing.T) {
	launcher := &fakeLauncher{}
	svc := NewService(&fakeRepository{
		tenants: []TenantRecord{
			{ID: 101, Host: "demo.platform.local"},
		},
	}, &fakePreferences{}, launcher)

	out, err := svc.RunRowAction(rootContext(), "open_as_root", RowActionInput{RowID: "101"}, "https")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !out.OK || out.OpenIn != "new_tab" {
		t.Fatalf("unexpected row action result %+v", out)
	}
	if launcher.lastInput.TenantID != "101" || launcher.lastInput.TenantHost != "demo.platform.local" {
		t.Fatalf("unexpected launch input %+v", launcher.lastInput)
	}
	if launcher.lastInput.ReturnTo != "/" || launcher.lastInput.Scheme != "https" {
		t.Fatalf("unexpected launch routing %+v", launcher.lastInput)
	}
}
