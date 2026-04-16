package employeeslist

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
	employees          []EmployeeRecord
	getErr             error
	statusErr          error
	updateErr          error
	lastStatus         string
	lastStatusIDs      []uuid.UUID
	lastUpdateEmployee UpdateEmployeeRecordInput
}

func (f *fakeRepository) ListEmployees(context.Context) ([]EmployeeRecord, error) {
	return append([]EmployeeRecord(nil), f.employees...), nil
}

func (f *fakeRepository) GetEmployee(_ context.Context, employeeID uuid.UUID) (*EmployeeRecord, error) {
	if f.getErr != nil {
		return nil, f.getErr
	}

	for _, employee := range f.employees {
		if employee.ID == employeeID {
			copyValue := employee
			return &copyValue, nil
		}
	}

	return nil, ErrEmployeeNotFound
}

func (f *fakeRepository) SetEmployeeStatus(_ context.Context, employeeIDs []uuid.UUID, status string) error {
	if f.statusErr != nil {
		return f.statusErr
	}

	f.lastStatus = status
	f.lastStatusIDs = append([]uuid.UUID(nil), employeeIDs...)
	return nil
}

func (f *fakeRepository) UpdateEmployee(_ context.Context, input UpdateEmployeeRecordInput) (*EmployeeRecord, error) {
	if f.updateErr != nil {
		return nil, f.updateErr
	}

	f.lastUpdateEmployee = input
	for _, employee := range f.employees {
		if employee.ID != input.ID {
			continue
		}

		updated := employee
		updated.Name = input.Name
		updated.Phone = input.Phone
		updated.Status = input.Status
		return &updated, nil
	}

	return nil, ErrEmployeeNotFound
}

type fakePreferences struct {
	state         *collectionprefs.State
	createErr     error
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
	if f.createErr != nil {
		return nil, f.createErr
	}
	f.lastSurfaceID = surfaceID
	return &collectiontable.SavedFilterSet{
		ID:           uuid.NewString(),
		Label:        req.Label,
		QuickFilters: req.QuickFilters,
	}, nil
}

func rootContext() context.Context {
	return rootContextWithUserID(uuid.New())
}

func rootContextWithUserID(userID uuid.UUID) context.Context {
	return requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: userID.String(),
		Role:   "root",
		Level:  100,
		Scope:  "admin.api",
	})
}

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestLoadMetaRequiresRoot(t *testing.T) {
	svc := NewService(&fakeRepository{}, &fakePreferences{})

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: uuid.NewString(),
		Role:   "admin",
		Level:  80,
		Scope:  "admin.api",
	})

	if _, err := svc.LoadMeta(ctx); err != ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestLoadMetaUsesEmployeesSurface(t *testing.T) {
	prefs := &fakePreferences{
		state: &collectionprefs.State{
			IsFavorite: true,
		},
	}
	svc := NewService(&fakeRepository{}, prefs)

	meta, err := svc.LoadMeta(rootContext())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if meta.SurfaceID != SurfaceID || meta.Title != "Employees" {
		t.Fatalf("unexpected meta %+v", meta)
	}
	if !meta.Actions.Favorite.Visible || !meta.Actions.Favorite.IsFavorite {
		t.Fatalf("unexpected favorite meta %+v", meta.Actions.Favorite)
	}
	if meta.Actions.Create.Visible {
		t.Fatalf("expected create action to stay hidden until employees create flow exists")
	}
	if meta.Actions.Reload.Visible != true {
		t.Fatalf("expected reload visible")
	}
	if !meta.Selection.Enabled || meta.Selection.Mode != "multi" || meta.Selection.ColumnPosition != "leading" {
		t.Fatalf("unexpected selection meta %+v", meta.Selection)
	}
	if len(meta.RowActions) != 1 || meta.RowActions[0].ID != "edit" || meta.RowActions[0].Execution != "frontend" {
		t.Fatalf("unexpected row actions %+v", meta.RowActions)
	}
	if len(meta.BulkActions) != 2 {
		t.Fatalf("unexpected bulk actions %+v", meta.BulkActions)
	}
}

func TestQueryReturnsFilteredRows(t *testing.T) {
	currentAdminID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	repo := &fakeRepository{
		employees: []EmployeeRecord{
			{
				ID:        currentAdminID,
				Email:     "alice@example.com",
				Phone:     "5551001",
				Name:      "Alice Admin",
				Level:     80,
				Status:    "active",
				CreatedAt: time.Date(2026, 4, 1, 10, 0, 0, 0, time.UTC),
			},
			{
				ID:        uuid.MustParse("22222222-2222-2222-2222-222222222222"),
				Email:     "bob@example.com",
				Phone:     "5551002",
				Name:      "Bob Root",
				Level:     100,
				Status:    "disabled",
				CreatedAt: time.Date(2026, 4, 2, 10, 0, 0, 0, time.UTC),
			},
		},
	}
	svc := NewService(repo, &fakePreferences{})

	out, err := svc.Query(rootContextWithUserID(currentAdminID), QueryRequest{
		Page:     1,
		PageSize: 25,
		QuickFilters: []QuickFilter{
			{FieldID: "all", Operator: "contains", Value: "alice"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out.TotalItems != 1 || len(out.Rows) != 1 {
		t.Fatalf("unexpected query result %+v", out)
	}
	if out.Rows[0].Cells["email"].Value != "alice@example.com" {
		t.Fatalf("unexpected row %+v", out.Rows[0])
	}
	if out.Rows[0].Selectable {
		t.Fatalf("expected current admin row to stay non-selectable")
	}
}

func TestLoadSearchSuggestionsBuildsRoleAndStatusGroups(t *testing.T) {
	repo := &fakeRepository{
		employees: []EmployeeRecord{
			{
				ID:        uuid.New(),
				Email:     "alice@example.com",
				Name:      "Alice Admin",
				Level:     80,
				Status:    "active",
				CreatedAt: time.Now(),
			},
		},
	}
	svc := NewService(repo, &fakePreferences{})

	out, err := svc.LoadSearchSuggestions(rootContext())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(out.Groups) < 2 {
		t.Fatalf("expected suggestion groups, got %+v", out)
	}
}

func TestCreateSavedFilterUsesEmployeesSurface(t *testing.T) {
	prefs := &fakePreferences{}
	svc := NewService(&fakeRepository{}, prefs)

	_, err := svc.CreateSavedFilter(rootContext(), CreateSavedFilterInput{
		Label: "My view",
		QuickFilters: []QuickFilter{
			{FieldID: "status", Operator: "contains", Value: "Active"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if prefs.lastSurfaceID != SurfaceID {
		t.Fatalf("expected surface %q, got %q", SurfaceID, prefs.lastSurfaceID)
	}
}

func TestQueryGroupsRepeatedContainsFiltersOnSameFieldAsOr(t *testing.T) {
	currentAdminID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	repo := &fakeRepository{
		employees: []EmployeeRecord{
			{
				ID:        currentAdminID,
				Email:     "alice@example.com",
				Name:      "Alice Admin",
				Level:     80,
				Status:    "active",
				CreatedAt: time.Date(2026, 4, 1, 10, 0, 0, 0, time.UTC),
			},
			{
				ID:        uuid.MustParse("22222222-2222-2222-2222-222222222222"),
				Email:     "bob@example.com",
				Name:      "Bob Root",
				Level:     100,
				Status:    "disabled",
				CreatedAt: time.Date(2026, 4, 2, 10, 0, 0, 0, time.UTC),
			},
		},
	}
	svc := NewService(repo, &fakePreferences{})

	out, err := svc.Query(rootContextWithUserID(currentAdminID), QueryRequest{
		Page:     1,
		PageSize: 25,
		QuickFilters: []QuickFilter{
			{FieldID: "status", Operator: "contains", Value: "Active"},
			{FieldID: "status", Operator: "contains", Value: "Disabled"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out.TotalItems != 2 || len(out.Rows) != 2 {
		t.Fatalf("expected both rows to match grouped OR filters, got %+v", out)
	}
}

func TestRunBulkActionDisablesEmployees(t *testing.T) {
	first := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	second := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	repo := &fakeRepository{}
	svc := NewService(repo, &fakePreferences{})

	out, err := svc.RunBulkAction(rootContext(), "disable", BulkActionInput{
		RowIDs: []string{first.String(), second.String()},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out == nil || !out.OK {
		t.Fatalf("expected ok mutation result, got %+v", out)
	}
	if repo.lastStatus != "disabled" {
		t.Fatalf("expected disabled status, got %q", repo.lastStatus)
	}
	if len(repo.lastStatusIDs) != 2 {
		t.Fatalf("expected 2 employee ids, got %+v", repo.lastStatusIDs)
	}
}

func TestUpdateEmployeeRejectsDisablingCurrentUser(t *testing.T) {
	currentAdminID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	svc := NewService(&fakeRepository{}, &fakePreferences{})

	_, err := svc.UpdateEmployee(rootContextWithUserID(currentAdminID), currentAdminID.String(), UpdateEmployeeInput{
		Name:   "Root User",
		Phone:  "5551001",
		Status: "disabled",
	})
	if err != ErrSelfDeactivate {
		t.Fatalf("expected ErrSelfDeactivate, got %v", err)
	}
}

func TestGetEmployeeProjectsEditableFields(t *testing.T) {
	employeeID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	repo := &fakeRepository{
		employees: []EmployeeRecord{
			{
				ID:        employeeID,
				Email:     "alice@example.com",
				Phone:     "5551001",
				Name:      "Alice Admin",
				Level:     80,
				Status:    "active",
				CreatedAt: time.Date(2026, 4, 1, 10, 0, 0, 0, time.UTC),
			},
		},
	}
	svc := NewService(repo, &fakePreferences{})

	out, err := svc.GetEmployee(rootContext(), employeeID.String())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out.User.ID != employeeID.String() || out.User.Role != "admin" || out.User.Status != "active" {
		t.Fatalf("unexpected employee detail %+v", out.User)
	}
}
