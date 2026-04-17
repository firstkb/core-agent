package moduleregistrylist

import (
	"context"
	"io"
	"log/slog"
	"testing"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

type fakeRepository struct {
	modules       []ModuleRecord
	exportModules []ModuleRecord
}

type fakePreferences struct {
	state             *collectionprefs.State
	toggleFavoriteOut bool
	createdFilter     *collectiontable.SavedFilterSet
	createErr         error
	deleteErr         error
	lastDeletedID     string
}

type fakeManager struct {
	archiveModuleID  string
	archiveModuleIDs []string
	archiveResult    *MutationResult
	archiveErr       error
	statusModuleIDs  []string
	statusValue      string
	statusResult     *MutationResult
	statusErr        error
}

func (f *fakeRepository) ListModules(context.Context) ([]ModuleRecord, error) {
	return f.modules, nil
}

func (f *fakeRepository) ListModulesForExport(context.Context, int) ([]ModuleRecord, error) {
	if f.exportModules != nil {
		return f.exportModules, nil
	}
	return f.modules, nil
}

func (f *fakePreferences) LoadState(context.Context, uuid.UUID, string) (*collectionprefs.State, error) {
	if f.state == nil {
		return &collectionprefs.State{}, nil
	}
	return f.state, nil
}

func (f *fakePreferences) ToggleFavorite(context.Context, uuid.UUID, string) (bool, error) {
	return f.toggleFavoriteOut, nil
}

func (f *fakePreferences) CreateSavedFilter(context.Context, uuid.UUID, string, collectiontable.CreateSavedFilterInput) (*collectiontable.SavedFilterSet, error) {
	if f.createErr != nil {
		return nil, f.createErr
	}
	return f.createdFilter, nil
}

func (f *fakePreferences) DeleteSavedFilter(_ context.Context, _ uuid.UUID, _ string, savedFilterID string) error {
	f.lastDeletedID = savedFilterID
	return f.deleteErr
}

func (f *fakeManager) ArchiveModule(_ context.Context, moduleID string) (*MutationResult, error) {
	f.archiveModuleID = moduleID
	f.archiveModuleIDs = append(f.archiveModuleIDs, moduleID)
	if f.archiveErr != nil {
		return nil, f.archiveErr
	}
	if f.archiveResult != nil {
		return f.archiveResult, nil
	}
	return &MutationResult{OK: true}, nil
}

func (f *fakeManager) SetModuleStatus(_ context.Context, moduleIDs []string, status string) (*MutationResult, error) {
	f.statusModuleIDs = append([]string(nil), moduleIDs...)
	f.statusValue = status
	if f.statusErr != nil {
		return nil, f.statusErr
	}
	if f.statusResult != nil {
		return f.statusResult, nil
	}
	return &MutationResult{OK: true}, nil
}

func rootContext() context.Context {
	return requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: uuid.NewString(),
		Role:   "root",
		Level:  100,
		Scope:  "admin.api",
	})
}

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestLoadMetaRequiresRoot(t *testing.T) {
	svc := NewService(&fakeRepository{}, &fakePreferences{}, &fakeManager{}, testLogger())

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: "3f65d4f8-112e-4d36-b9d9-bb2b472f4f11",
		Role:   "admin",
		Level:  80,
		Scope:  "admin.api",
	})

	if _, err := svc.LoadMeta(ctx); err != ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestQueryReturnsFilteredRows(t *testing.T) {
	repo := &fakeRepository{
		modules: []ModuleRecord{
			{
				ID:          1,
				GUID:        uuid.MustParse("2c3c4255-c4d1-472d-b911-d26776f1f952"),
				ModuleKey:   "tenant",
				Title:       "Tenant",
				Description: "Tenant control-plane management",
				Status:      "active",
				SortOrder:   200,
				UpdatedAt:   time.Date(2026, 4, 1, 10, 0, 0, 0, time.UTC),
				Sections: []SectionRecord{
					{SectionKey: "list_of_tenants", Title: "List of tenants", Status: "active"},
					{SectionKey: "onboarding", Title: "Onboarding", Status: "active"},
				},
			},
			{
				ID:          2,
				GUID:        uuid.MustParse("4cbba650-ecb9-46d0-a4e2-f04459090211"),
				ModuleKey:   "users",
				Title:       "Users",
				Description: "Admin user directory",
				Status:      "planned",
				SortOrder:   300,
				UpdatedAt:   time.Date(2026, 4, 2, 10, 0, 0, 0, time.UTC),
				Sections: []SectionRecord{
					{SectionKey: "list_of_users", Title: "List of users", Status: "planned"},
				},
			},
		},
	}
	svc := NewService(repo, &fakePreferences{}, &fakeManager{}, testLogger())

	out, err := svc.Query(rootContext(), QueryRequest{
		Page:     1,
		PageSize: 25,
		QuickFilters: []QuickFilter{
			{FieldID: "all", Operator: "contains", Value: "tenant"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out.TotalItems != 1 {
		t.Fatalf("expected one filtered row, got %d", out.TotalItems)
	}
	if len(out.Rows) != 1 || out.Rows[0].Cells["module_key"].Value != "tenant" {
		t.Fatalf("unexpected rows: %+v", out.Rows)
	}
}

func TestQueryKeepsArchivedRowsSelectable(t *testing.T) {
	repo := &fakeRepository{
		modules: []ModuleRecord{
			{
				ID:          1,
				GUID:        uuid.MustParse("2c3c4255-c4d1-472d-b911-d26776f1f952"),
				ModuleKey:   "tenant",
				Title:       "Tenant",
				Description: "Tenant control-plane management",
				Status:      "archived",
				SortOrder:   200,
				UpdatedAt:   time.Date(2026, 4, 1, 10, 0, 0, 0, time.UTC),
			},
		},
	}
	svc := NewService(repo, &fakePreferences{}, &fakeManager{}, testLogger())

	out, err := svc.Query(rootContext(), QueryRequest{
		Page:     1,
		PageSize: 25,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(out.Rows) != 1 {
		t.Fatalf("expected one row, got %d", len(out.Rows))
	}
	if !out.Rows[0].Selectable {
		t.Fatalf("expected archived row to remain selectable")
	}
}

func TestCreateSavedFilterRequiresLabel(t *testing.T) {
	svc := NewService(&fakeRepository{}, &fakePreferences{createErr: collectionprefs.ErrLabelRequired}, &fakeManager{}, testLogger())

	if _, err := svc.CreateSavedFilter(rootContext(), CreateSavedFilterInput{}); err != collectionprefs.ErrLabelRequired {
		t.Fatalf("expected collectionprefs.ErrLabelRequired, got %v", err)
	}
}

func TestDeleteSavedFilterUsesModuleRegistrySurface(t *testing.T) {
	prefs := &fakePreferences{}
	svc := NewService(&fakeRepository{}, prefs, &fakeManager{}, testLogger())

	out, err := svc.DeleteSavedFilter(rootContext(), "saved-filter-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out == nil || !out.OK {
		t.Fatalf("unexpected delete response %+v", out)
	}
	if prefs.lastDeletedID != "saved-filter-1" {
		t.Fatalf("expected delete id saved-filter-1, got %q", prefs.lastDeletedID)
	}
}

func TestQueryGroupsRepeatedContainsFiltersOnSameFieldAsOr(t *testing.T) {
	repo := &fakeRepository{
		modules: []ModuleRecord{
			{
				ID:          1,
				GUID:        uuid.MustParse("2c3c4255-c4d1-472d-b911-d26776f1f952"),
				ModuleKey:   "tenant",
				Title:       "Tenant",
				Description: "Tenant control-plane management",
				Status:      "active",
				SortOrder:   200,
				UpdatedAt:   time.Date(2026, 4, 1, 10, 0, 0, 0, time.UTC),
			},
			{
				ID:          2,
				GUID:        uuid.MustParse("4cbba650-ecb9-46d0-a4e2-f04459090211"),
				ModuleKey:   "employees",
				Title:       "Employees",
				Description: "Admin user directory",
				Status:      "planned",
				SortOrder:   300,
				UpdatedAt:   time.Date(2026, 4, 2, 10, 0, 0, 0, time.UTC),
			},
		},
	}
	svc := NewService(repo, &fakePreferences{}, &fakeManager{}, testLogger())

	out, err := svc.Query(rootContext(), QueryRequest{
		Page:     1,
		PageSize: 25,
		QuickFilters: []QuickFilter{
			{FieldID: "module_title", Operator: "contains", Value: "Tenant"},
			{FieldID: "module_title", Operator: "contains", Value: "Employees"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out.TotalItems != 2 || len(out.Rows) != 2 {
		t.Fatalf("expected both rows to match grouped OR filters, got %+v", out)
	}
}

func TestLoadMetaExposesFrontendEditAndBulkStateActions(t *testing.T) {
	svc := NewService(&fakeRepository{}, &fakePreferences{}, &fakeManager{}, testLogger())

	meta, err := svc.LoadMeta(rootContext())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(meta.RowActions) != 1 || meta.RowActions[0].ID != "edit" || meta.RowActions[0].Execution != "frontend" {
		t.Fatalf("unexpected row actions: %+v", meta.RowActions)
	}
	if !meta.Selection.Enabled || meta.Selection.Mode != "multi" || meta.Selection.ColumnPosition != "leading" {
		t.Fatalf("unexpected selection meta: %+v", meta.Selection)
	}
	if len(meta.BulkActions) != 3 || meta.BulkActions[0].ID != "activate" || meta.BulkActions[1].ID != "planned" || meta.BulkActions[2].ID != "archive" {
		t.Fatalf("unexpected bulk actions: %+v", meta.BulkActions)
	}
	if meta.BulkActions[0].Label != "Active" {
		t.Fatalf("expected active label, got %+v", meta.BulkActions[0])
	}
	if meta.BulkActions[0].Tone != "success" {
		t.Fatalf("expected active tone success, got %+v", meta.BulkActions[0])
	}
	if meta.BulkActions[1].Label != "Planned" {
		t.Fatalf("expected planned label, got %+v", meta.BulkActions[1])
	}
	if meta.BulkActions[1].Tone != "info" {
		t.Fatalf("expected planned tone info, got %+v", meta.BulkActions[1])
	}
	if meta.BulkActions[2].Label != "Archive" {
		t.Fatalf("expected archive label, got %+v", meta.BulkActions[2])
	}
	if meta.BulkActions[2].Tone != "neutral" {
		t.Fatalf("expected archive tone neutral, got %+v", meta.BulkActions[2])
	}
}

func TestRunRowActionArchivesModule(t *testing.T) {
	moduleGUID := uuid.MustParse("af1215a3-d95d-482b-b475-8d91316f5d3e")
	manager := &fakeManager{}
	svc := NewService(&fakeRepository{}, &fakePreferences{}, manager, testLogger())

	out, err := svc.RunRowAction(rootContext(), "archive", RowActionInput{RowID: moduleGUID.String()})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !out.OK {
		t.Fatalf("expected ok mutation result")
	}
	if manager.archiveModuleID != moduleGUID.String() {
		t.Fatalf("expected archive module id %s, got %s", moduleGUID.String(), manager.archiveModuleID)
	}
}

func TestRunBulkActionActivatesModules(t *testing.T) {
	manager := &fakeManager{}
	svc := NewService(&fakeRepository{}, &fakePreferences{}, manager, testLogger())
	first := uuid.NewString()
	second := uuid.NewString()

	out, err := svc.RunBulkAction(rootContext(), "activate", BulkActionInput{RowIDs: []string{first, second}})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !out.OK {
		t.Fatalf("expected ok mutation result")
	}
	if manager.statusValue != "active" {
		t.Fatalf("expected active status, got %q", manager.statusValue)
	}
	if len(manager.statusModuleIDs) != 2 || manager.statusModuleIDs[0] != first || manager.statusModuleIDs[1] != second {
		t.Fatalf("unexpected module ids: %+v", manager.statusModuleIDs)
	}
}

func TestExportXLSTruncatesWhenExportLimitExceeded(t *testing.T) {
	exportModules := make([]ModuleRecord, 0, collectiontable.ExportProbeLimit())
	for idx := 0; idx < collectiontable.ExportProbeLimit(); idx++ {
		exportModules = append(exportModules, ModuleRecord{
			ID:          int64(idx + 1),
			GUID:        uuid.New(),
			ModuleKey:   "module_" + uuid.NewString(),
			Title:       "Module",
			Description: "Export",
			Status:      "active",
			SortOrder:   idx + 1,
			UpdatedAt:   time.Date(2026, 4, 2, 10, 0, 0, 0, time.UTC),
		})
	}

	svc := NewService(&fakeRepository{exportModules: exportModules}, &fakePreferences{}, &fakeManager{}, testLogger())

	out, err := svc.ExportXLS(rootContext(), ExportRequest{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !out.OK {
		t.Fatalf("expected ok mutation result")
	}
}

func TestExportXLSAllowsUpToHardLimit(t *testing.T) {
	exportModules := make([]ModuleRecord, 0, collectiontable.ExportRowLimit)
	for idx := 0; idx < collectiontable.ExportRowLimit; idx++ {
		exportModules = append(exportModules, ModuleRecord{
			ID:          int64(idx + 1),
			GUID:        uuid.New(),
			ModuleKey:   "module_" + uuid.NewString(),
			Title:       "Module",
			Description: "Export",
			Status:      "active",
			SortOrder:   idx + 1,
			UpdatedAt:   time.Date(2026, 4, 2, 10, 0, 0, 0, time.UTC),
		})
	}

	svc := NewService(&fakeRepository{exportModules: exportModules}, &fakePreferences{}, &fakeManager{}, testLogger())

	out, err := svc.ExportXLS(rootContext(), ExportRequest{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !out.OK {
		t.Fatalf("expected ok mutation result")
	}
}

func TestRunBulkActionSetsModulesToPlanned(t *testing.T) {
	manager := &fakeManager{}
	svc := NewService(&fakeRepository{}, &fakePreferences{}, manager, testLogger())
	moduleID := uuid.NewString()

	out, err := svc.RunBulkAction(rootContext(), "planned", BulkActionInput{RowIDs: []string{moduleID}})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !out.OK {
		t.Fatalf("expected ok mutation result")
	}
	if manager.statusValue != "planned" {
		t.Fatalf("expected planned status, got %q", manager.statusValue)
	}
	if len(manager.statusModuleIDs) != 1 || manager.statusModuleIDs[0] != moduleID {
		t.Fatalf("unexpected module ids: %+v", manager.statusModuleIDs)
	}
}

func TestRunBulkActionArchivesModules(t *testing.T) {
	manager := &fakeManager{}
	svc := NewService(&fakeRepository{}, &fakePreferences{}, manager, testLogger())
	first := uuid.NewString()
	second := uuid.NewString()

	out, err := svc.RunBulkAction(rootContext(), "archive", BulkActionInput{RowIDs: []string{first, second}})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !out.OK {
		t.Fatalf("expected ok mutation result")
	}
	if manager.archiveModuleID != second {
		t.Fatalf("expected last archived module id %s, got %s", second, manager.archiveModuleID)
	}
	if len(manager.archiveModuleIDs) != 2 || manager.archiveModuleIDs[0] != first || manager.archiveModuleIDs[1] != second {
		t.Fatalf("unexpected archived module ids: %+v", manager.archiveModuleIDs)
	}
	if manager.statusValue != "" {
		t.Fatalf("did not expect status batch call, got %q", manager.statusValue)
	}
}
