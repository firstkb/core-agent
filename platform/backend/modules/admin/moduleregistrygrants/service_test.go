package moduleregistrygrants

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type fakeRepository struct {
	modules []ModuleRecord

	adminUsers map[uuid.UUID]AdminUserRecord
	grantLists map[uuid.UUID]*SectionGrantListRecord

	upsertGrantSectionGUID uuid.UUID
	upsertGrantAdminUserID uuid.UUID
	upsertGrantAccess      string
	upsertGrantResult      *SectionGrantRecord
	upsertGrantErr         error

	revokeGrantSectionGUID uuid.UUID
	revokeGrantAdminUserID uuid.UUID
	revokeGrantErr         error
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

func (f *fakeRepository) GetAdminUserByID(_ context.Context, adminUserID uuid.UUID) (*AdminUserRecord, error) {
	if user, ok := f.adminUsers[adminUserID]; ok {
		copyUser := user
		return &copyUser, nil
	}
	return nil, ErrAdminUserNotFound
}

func (f *fakeRepository) ListSectionGrants(_ context.Context, sectionGUID uuid.UUID) (*SectionGrantListRecord, error) {
	if record, ok := f.grantLists[sectionGUID]; ok {
		return record, nil
	}
	return nil, ErrSectionNotFound
}

func (f *fakeRepository) UpsertSectionGrant(_ context.Context, sectionGUID, adminUserID uuid.UUID, access string) (*SectionGrantRecord, error) {
	f.upsertGrantSectionGUID = sectionGUID
	f.upsertGrantAdminUserID = adminUserID
	f.upsertGrantAccess = access
	if f.upsertGrantErr != nil {
		return nil, f.upsertGrantErr
	}
	return f.upsertGrantResult, nil
}

func (f *fakeRepository) RevokeSectionGrant(_ context.Context, sectionGUID, adminUserID uuid.UUID) error {
	f.revokeGrantSectionGUID = sectionGUID
	f.revokeGrantAdminUserID = adminUserID
	return f.revokeGrantErr
}

func rootContext() context.Context {
	return requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		UserID: uuid.NewString(),
		Role:   "root",
		Level:  100,
		Scope:  "admin.api",
	})
}

func TestUpsertSectionGrantRejectsRootTarget(t *testing.T) {
	adminUserID := uuid.MustParse("b5db3812-77c2-4db2-b3f0-50bfa4e7c852")
	repo := &fakeRepository{
		adminUsers: map[uuid.UUID]AdminUserRecord{
			adminUserID: {
				ID:     adminUserID,
				Email:  "root@platform.local",
				Level:  100,
				Status: "active",
			},
		},
	}
	svc := NewService(repo)

	if _, err := svc.UpsertSectionGrant(rootContext(), uuid.NewString(), adminUserID.String(), UpsertSectionGrantInput{Access: "read"}); err != ErrGrantTargetRoot {
		t.Fatalf("expected ErrGrantTargetRoot, got %v", err)
	}
}

func TestUpsertSectionGrantNormalizesAccessAndReturnsOutput(t *testing.T) {
	sectionGUID := uuid.MustParse("c5009ef8-57a7-4683-bdb8-c12cb2df8f82")
	adminUserID := uuid.MustParse("1dbf67d8-cd67-4292-9165-6b41aad11d22")
	grantGUID := uuid.MustParse("a8d7baf9-23cf-4c90-aefe-e138f787be14")
	now := time.Date(2026, 4, 2, 16, 0, 0, 0, time.UTC)
	repo := &fakeRepository{
		adminUsers: map[uuid.UUID]AdminUserRecord{
			adminUserID: {
				ID:     adminUserID,
				Email:  "admin@platform.local",
				Name:   "Admin User",
				Level:  80,
				Status: "active",
			},
		},
		upsertGrantResult: &SectionGrantRecord{
			ID: grantGUID,
			Section: SectionRecord{
				GUID:       sectionGUID,
				ModuleGUID: uuid.MustParse("fc3e20d8-338e-43e8-a38e-0346b92be5bc"),
			},
			AdminUser: AdminUserRecord{
				ID:     adminUserID,
				Email:  "admin@platform.local",
				Name:   "Admin User",
				Level:  80,
				Status: "active",
			},
			Access:    "write",
			CreatedAt: now,
			UpdatedAt: now,
		},
	}
	svc := NewService(repo)

	out, err := svc.UpsertSectionGrant(rootContext(), sectionGUID.String(), adminUserID.String(), UpsertSectionGrantInput{Access: "write"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.upsertGrantAccess != "write" {
		t.Fatalf("expected write access, got %q", repo.upsertGrantAccess)
	}
	if out.AdminUser.Role != "admin" {
		t.Fatalf("expected admin role, got %q", out.AdminUser.Role)
	}
	if out.SectionID != sectionGUID.String() {
		t.Fatalf("expected section id %s, got %s", sectionGUID, out.SectionID)
	}
}

func TestUpsertModuleGrantsExpandsToAllNonArchivedSections(t *testing.T) {
	moduleGUID := uuid.MustParse("0e9298fa-cd52-45ca-afd0-c45f48f0f1c1")
	activeSection := uuid.MustParse("dbc01b2f-e9a4-4532-b6e0-bf153cd6e77f")
	archivedSection := uuid.MustParse("b42581d2-d1c8-4883-bcb2-aa972a93d1d1")
	adminUserID := uuid.MustParse("109947e8-c7c1-441a-a19f-a8cc9d57d43e")
	repo := &fakeRepository{
		adminUsers: map[uuid.UUID]AdminUserRecord{
			adminUserID: {
				ID:     adminUserID,
				Email:  "support@platform.local",
				Level:  60,
				Status: "active",
			},
		},
		modules: []ModuleRecord{
			{
				GUID: moduleGUID,
				Sections: []SectionRecord{
					{GUID: activeSection, Status: "active"},
					{GUID: archivedSection, Status: "archived"},
				},
			},
		},
		upsertGrantResult: &SectionGrantRecord{},
	}
	svc := NewService(repo)

	out, err := svc.UpsertModuleGrants(rootContext(), moduleGUID.String(), adminUserID.String(), UpsertSectionGrantInput{Access: "read"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out.AppliedCount != 1 {
		t.Fatalf("expected applied count 1, got %d", out.AppliedCount)
	}
	if repo.upsertGrantSectionGUID != activeSection {
		t.Fatalf("expected upserted section %s, got %s", activeSection, repo.upsertGrantSectionGUID)
	}
}

func TestListSectionGrantsReturnsGrantProjection(t *testing.T) {
	sectionGUID := uuid.MustParse("1607022c-bca9-4758-8e9e-5d18aaf8eeb7")
	adminUserID := uuid.MustParse("9c86cf53-2e7f-4e37-8e9d-d0228d0f9b0b")
	now := time.Date(2026, 4, 2, 17, 0, 0, 0, time.UTC)
	repo := &fakeRepository{
		grantLists: map[uuid.UUID]*SectionGrantListRecord{
			sectionGUID: {
				Section: SectionRecord{
					GUID:       sectionGUID,
					ModuleGUID: uuid.MustParse("52f1afef-43f7-4642-9f16-81d92a361ed7"),
					SectionKey: "list_of_users",
					Title:      "List of users",
					Status:     "active",
					CreatedAt:  now,
					UpdatedAt:  now,
				},
				Grants: []SectionGrantRecord{
					{
						ID: uuid.MustParse("6d867722-f462-4cfa-b18d-ac0a4c4e2860"),
						Section: SectionRecord{
							GUID: sectionGUID,
						},
						AdminUser: AdminUserRecord{
							ID:     adminUserID,
							Email:  "readonly@platform.local",
							Level:  20,
							Status: "active",
						},
						Access:    "read",
						CreatedAt: now,
						UpdatedAt: now,
					},
				},
			},
		},
	}
	svc := NewService(repo)

	out, err := svc.ListSectionGrants(rootContext(), sectionGUID.String())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(out.Grants) != 1 {
		t.Fatalf("expected one grant, got %d", len(out.Grants))
	}
	if out.Grants[0].AdminUser.Role != "readonly" {
		t.Fatalf("expected readonly role, got %q", out.Grants[0].AdminUser.Role)
	}
}
