package businesstree

import (
	"context"
	"errors"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type repositoryStub struct {
	companies      map[int64]CompanyRecord
	childCompanies []CompanyRecord
	contacts       []ContactRecord
	projects       []ProjectRecord
	rootCompanies  []CompanyRecord
}

func (r repositoryStub) GetCompany(_ context.Context, _ requestctx.TenantInfo, companyID int64) (*CompanyRecord, error) {
	record, ok := r.companies[companyID]
	if !ok {
		return nil, nil
	}
	return &record, nil
}

func (r repositoryStub) ListChildCompanies(_ context.Context, _ requestctx.TenantInfo, _ int64) ([]CompanyRecord, error) {
	return r.childCompanies, nil
}

func (r repositoryStub) ListContacts(_ context.Context, _ requestctx.TenantInfo, _ int64) ([]ContactRecord, error) {
	return r.contacts, nil
}

func (r repositoryStub) ListProjects(_ context.Context, _ requestctx.TenantInfo, _ int64) ([]ProjectRecord, error) {
	return r.projects, nil
}

func (r repositoryStub) ListRootCompanies(_ context.Context, _ requestctx.TenantInfo) ([]CompanyRecord, error) {
	return r.rootCompanies, nil
}

func businessTreeTestContext() context.Context {
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{
		TenantID: "101",
		UserID:   "user-1",
	})
	return requestctx.WithTenant(ctx, requestctx.TenantInfo{
		DBName:         "tenant_101",
		DBInstanceCode: "local",
		ID:             "101",
		Name:           "Demo Tenant",
	})
}

func TestListNodesRootUsesTopLevelCompanies(t *testing.T) {
	service := NewService(repositoryStub{
		rootCompanies: []CompanyRecord{
			{
				ChildCompanyCount: 2,
				ContactCount:      3,
				ID:                7,
				Name:              "GDC",
				ProjectCount:      1,
				TypeName:          "General Company",
			},
		},
	})

	out, err := service.ListNodes(businessTreeTestContext(), "")
	if err != nil {
		t.Fatalf("ListNodes returned error: %v", err)
	}
	if out.ParentID != parentRoot {
		t.Fatalf("parent id = %q, want %q", out.ParentID, parentRoot)
	}
	if len(out.Nodes) != 1 {
		t.Fatalf("node count = %d, want 1", len(out.Nodes))
	}
	node := out.Nodes[0]
	if node.ID != "company:7" {
		t.Fatalf("node id = %q, want company:7", node.ID)
	}
	if node.Label != "General Company @ GDC" {
		t.Fatalf("node label = %q, want General Company @ GDC", node.Label)
	}
	if !node.Expandable || node.ChildCount != 4 {
		t.Fatalf("node expandable/count = %v/%d, want true/4", node.Expandable, node.ChildCount)
	}
}

func TestListNodesCompanyAppendsModernGroupLabels(t *testing.T) {
	service := NewService(repositoryStub{
		companies: map[int64]CompanyRecord{
			7: {
				ContactCount: 3,
				ID:           7,
				ProjectCount: 2,
			},
		},
		childCompanies: []CompanyRecord{
			{ID: 8, Name: "Child", TypeName: "Subcontractor"},
		},
	})

	out, err := service.ListNodes(businessTreeTestContext(), "company:7")
	if err != nil {
		t.Fatalf("ListNodes returned error: %v", err)
	}
	if len(out.Nodes) != 3 {
		t.Fatalf("node count = %d, want 3", len(out.Nodes))
	}
	if out.Nodes[1].ID != "contacts:7" || out.Nodes[1].Label != "Contacts (3)" {
		t.Fatalf("contacts node = %#v, want modern contacts group", out.Nodes[1])
	}
	if out.Nodes[2].ID != "projects:7" || out.Nodes[2].Label != "Projects (2)" {
		t.Fatalf("projects node = %#v, want modern projects group", out.Nodes[2])
	}
}

func TestListNodesContactLabelsFallBackToNameOnly(t *testing.T) {
	service := NewService(repositoryStub{
		contacts: []ContactRecord{
			{DisplayName: "Bruce Peddy", ID: 10, JobTypeName: "Administrator"},
			{DisplayName: "Mike Vrakela", ID: 11},
		},
	})

	out, err := service.ListNodes(businessTreeTestContext(), "contacts:7")
	if err != nil {
		t.Fatalf("ListNodes returned error: %v", err)
	}
	if out.Nodes[0].Label != "Administrator @ Bruce Peddy" {
		t.Fatalf("node label = %q, want jobtype label", out.Nodes[0].Label)
	}
	if out.Nodes[1].Label != "Mike Vrakela" {
		t.Fatalf("node label = %q, want name-only fallback", out.Nodes[1].Label)
	}
}

func TestListNodesRequiresAuthenticatedTenantContext(t *testing.T) {
	service := NewService(repositoryStub{})

	_, err := service.ListNodes(context.Background(), parentRoot)
	if !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("ListNodes error = %v, want %v", err, ErrUnauthorized)
	}

	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{UserID: "user-1"})
	_, err = service.ListNodes(ctx, parentRoot)
	if !errors.Is(err, ErrTenantMissing) {
		t.Fatalf("ListNodes error = %v, want %v", err, ErrTenantMissing)
	}
}
