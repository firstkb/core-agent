package moduleregistrymanage

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type fakeRepository struct {
	modules []ModuleRecord

	createModuleInput  createModuleParams
	createModuleResult *ModuleRecord
	createModuleErr    error

	updateModuleGUID   uuid.UUID
	updateModuleInput  updateModuleParams
	updateModuleResult *ModuleRecord
	updateModuleErr    error

	updateStatusGUIDs []uuid.UUID
	updateStatusValue string
	updateStatusErr   error

	archiveModuleGUID uuid.UUID
	archiveModuleErr  error

	createSectionModuleGUID uuid.UUID
	createSectionInput      createSectionParams
	createSectionResult     *SectionRecord
	createSectionErr        error

	updateSectionGUID   uuid.UUID
	updateSectionInput  updateSectionParams
	updateSectionResult *SectionRecord
	updateSectionErr    error

	archiveSectionGUID uuid.UUID
	archiveSectionErr  error
}

func (f *fakeRepository) GetModuleByGUID(_ context.Context, moduleGUID uuid.UUID) (*ModuleRecord, error) {
	for _, module := range f.modules {
		if module.GUID == moduleGUID {
			copyModule := module
			return &copyModule, nil
		}
	}
	return nil, ErrModuleNotFound
}

func (f *fakeRepository) CreateModule(_ context.Context, input createModuleParams) (*ModuleRecord, error) {
	f.createModuleInput = input
	if f.createModuleErr != nil {
		return nil, f.createModuleErr
	}
	return f.createModuleResult, nil
}

func (f *fakeRepository) UpdateModule(_ context.Context, moduleGUID uuid.UUID, input updateModuleParams) (*ModuleRecord, error) {
	f.updateModuleGUID = moduleGUID
	f.updateModuleInput = input
	if f.updateModuleErr != nil {
		return nil, f.updateModuleErr
	}
	return f.updateModuleResult, nil
}

func (f *fakeRepository) UpdateModuleStatusBatch(_ context.Context, moduleGUIDs []uuid.UUID, status string) error {
	f.updateStatusGUIDs = append([]uuid.UUID(nil), moduleGUIDs...)
	f.updateStatusValue = status
	return f.updateStatusErr
}

func (f *fakeRepository) ArchiveModule(_ context.Context, moduleGUID uuid.UUID) error {
	f.archiveModuleGUID = moduleGUID
	return f.archiveModuleErr
}

func (f *fakeRepository) CreateSection(_ context.Context, moduleGUID uuid.UUID, input createSectionParams) (*SectionRecord, error) {
	f.createSectionModuleGUID = moduleGUID
	f.createSectionInput = input
	if f.createSectionErr != nil {
		return nil, f.createSectionErr
	}
	return f.createSectionResult, nil
}

func (f *fakeRepository) UpdateSection(_ context.Context, sectionGUID uuid.UUID, input updateSectionParams) (*SectionRecord, error) {
	f.updateSectionGUID = sectionGUID
	f.updateSectionInput = input
	if f.updateSectionErr != nil {
		return nil, f.updateSectionErr
	}
	return f.updateSectionResult, nil
}

func (f *fakeRepository) ArchiveSection(_ context.Context, sectionGUID uuid.UUID) error {
	f.archiveSectionGUID = sectionGUID
	return f.archiveSectionErr
}

func rootContext() context.Context {
	return requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: uuid.NewString(),
		Role:   "root",
		Level:  100,
		Scope:  "admin.api",
	})
}

func TestCreateModuleNormalizesInput(t *testing.T) {
	moduleGUID := uuid.MustParse("7c790613-cd00-4109-ad1f-ae4fb8273185")
	now := time.Date(2026, 4, 2, 14, 0, 0, 0, time.UTC)
	repo := &fakeRepository{
		createModuleResult: &ModuleRecord{
			GUID:      moduleGUID,
			ModuleKey: "tenant_management",
			Title:     "Tenant Management",
			Status:    "active",
			SortOrder: 100,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}
	svc := NewService(repo)

	out, err := svc.CreateModule(rootContext(), CreateModuleInput{
		ModuleKey: "Tenant Management",
		Title:     "Tenant Management",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.createModuleInput.ModuleKey != "tenant_management" {
		t.Fatalf("expected normalized module key, got %q", repo.createModuleInput.ModuleKey)
	}
	if repo.createModuleInput.Status != "active" {
		t.Fatalf("expected default active status, got %q", repo.createModuleInput.Status)
	}
	if repo.createModuleInput.SortOrder != 100 {
		t.Fatalf("expected default sort order 100, got %d", repo.createModuleInput.SortOrder)
	}
	if out.ID != moduleGUID.String() {
		t.Fatalf("expected output guid %s, got %s", moduleGUID, out.ID)
	}
}

func TestGetModuleReturnsSectionModuleGUID(t *testing.T) {
	moduleGUID := uuid.MustParse("6f491362-c047-4106-99d0-5155ded53d71")
	sectionGUID := uuid.MustParse("ee1f0ca0-a19a-454b-95d0-cf68d4d4f538")
	now := time.Date(2026, 4, 2, 14, 0, 0, 0, time.UTC)
	svc := NewService(&fakeRepository{
		modules: []ModuleRecord{
			{
				GUID:      moduleGUID,
				ModuleKey: "tenant",
				Title:     "Tenant",
				Status:    "active",
				CreatedAt: now,
				UpdatedAt: now,
				Sections: []SectionRecord{
					{
						GUID:       sectionGUID,
						ModuleGUID: moduleGUID,
						SectionKey: "list_of_tenants",
						Title:      "List of tenants",
						Status:     "active",
						CreatedAt:  now,
						UpdatedAt:  now,
					},
				},
			},
		},
	})

	out, err := svc.GetModule(rootContext(), moduleGUID.String())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(out.Sections) != 1 {
		t.Fatalf("expected one section, got %d", len(out.Sections))
	}
	if out.Sections[0].ModuleID != moduleGUID.String() {
		t.Fatalf("expected section module_id to use module guid %s, got %s", moduleGUID, out.Sections[0].ModuleID)
	}
}

func TestCreateSectionRejectsInvalidRoutePath(t *testing.T) {
	svc := NewService(&fakeRepository{})

	if _, err := svc.CreateSection(rootContext(), uuid.NewString(), CreateSectionInput{
		SectionKey: "list_of_users",
		Title:      "List of users",
		RoutePath:  "admin/users",
	}); err != ErrInvalidRoutePath {
		t.Fatalf("expected ErrInvalidRoutePath, got %v", err)
	}
}

func TestUpdateModulePropagatesConflict(t *testing.T) {
	repo := &fakeRepository{updateModuleErr: ErrRegistryConflict}
	svc := NewService(repo)

	if _, err := svc.UpdateModule(rootContext(), uuid.NewString(), UpdateModuleInput{
		Title:  "Tenant",
		Status: "active",
	}); err != ErrRegistryConflict {
		t.Fatalf("expected ErrRegistryConflict, got %v", err)
	}
}

func TestArchiveModuleCallsRepository(t *testing.T) {
	moduleGUID := uuid.MustParse("af1215a3-d95d-482b-b475-8d91316f5d3e")
	repo := &fakeRepository{}
	svc := NewService(repo)

	out, err := svc.ArchiveModule(rootContext(), moduleGUID.String())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !out.OK {
		t.Fatalf("expected ok mutation result")
	}
	if repo.archiveModuleGUID != moduleGUID {
		t.Fatalf("expected archive module guid %s, got %s", moduleGUID, repo.archiveModuleGUID)
	}
}

func TestSetModuleStatusCallsRepository(t *testing.T) {
	first := uuid.MustParse("af1215a3-d95d-482b-b475-8d91316f5d3e")
	second := uuid.MustParse("0ee674e5-3200-42fd-bb8d-e5966a4ba2cc")
	repo := &fakeRepository{}
	svc := NewService(repo)

	out, err := svc.SetModuleStatus(rootContext(), []string{first.String(), second.String()}, "active")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !out.OK {
		t.Fatalf("expected ok mutation result")
	}
	if repo.updateStatusValue != "active" {
		t.Fatalf("expected active status, got %q", repo.updateStatusValue)
	}
	if len(repo.updateStatusGUIDs) != 2 || repo.updateStatusGUIDs[0] != first || repo.updateStatusGUIDs[1] != second {
		t.Fatalf("unexpected updated status guids: %+v", repo.updateStatusGUIDs)
	}
}
