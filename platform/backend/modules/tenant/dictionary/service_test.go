package dictionary

import (
	"context"
	"errors"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type fakeRepository struct {
	req OptionsRequest
}

func (repo *fakeRepository) ListOptions(
	_ context.Context,
	_ requestctx.TenantInfo,
	req OptionsRequest,
) (*OptionsResponse, error) {
	repo.req = req
	return &OptionsResponse{
		Dictionary: req.Dictionary,
		Items:      []Option{},
		Page:       req.Page,
		PageSize:   req.PageSize,
	}, nil
}

func TestServiceListOptionsNormalizesRequest(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{UserID: "user-1"})
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{ID: "101", DBName: "tenant", DBInstanceCode: "demo"})

	out, err := service.ListOptions(ctx, OptionsRequest{
		Dictionary: "mainCompany",
		IDs:        []string{" 2, 3 ", "2", " "},
		Page:       -10,
		PageSize:   500,
		Search:     "  GDC  ",
	})
	if err != nil {
		t.Fatalf("ListOptions returned error: %v", err)
	}

	if out.Dictionary != "companies" || repo.req.Dictionary != "companies" {
		t.Fatalf("dictionary = %q, want companies", repo.req.Dictionary)
	}
	if repo.req.Page != 1 {
		t.Fatalf("page = %d, want 1", repo.req.Page)
	}
	if repo.req.PageSize != 100 {
		t.Fatalf("page size = %d, want 100", repo.req.PageSize)
	}
	if repo.req.Search != "GDC" {
		t.Fatalf("search = %q, want GDC", repo.req.Search)
	}
	if got := repo.req.IDs; len(got) != 2 || got[0] != "2" || got[1] != "3" {
		t.Fatalf("ids = %#v, want [2 3]", got)
	}
}

func TestServiceListOptionsRejectsInvalidDictionary(t *testing.T) {
	service := NewService(&fakeRepository{})
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{UserID: "user-1"})
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{ID: "101", DBName: "tenant", DBInstanceCode: "demo"})

	_, err := service.ListOptions(ctx, OptionsRequest{Dictionary: "missing"})
	if !errors.Is(err, ErrInvalidDictionary) {
		t.Fatalf("error = %v, want ErrInvalidDictionary", err)
	}
}

func TestServiceListOptionsNormalizesGenericLookupRequest(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)
	ctx := requestctx.WithClaims(context.Background(), requestctx.ClaimsInfo{UserID: "user-1"})
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{ID: "101", DBName: "tenant", DBInstanceCode: "demo"})

	_, err := service.ListOptions(ctx, OptionsRequest{
		DisplayFields:    []string{" name ", "name", " city,state "},
		Filters:          []LookupFilter{{Field: " active ", Operator: "", Value: true}},
		PageSize:         0,
		SearchFields:     []string{" name ", " email "},
		SortField:        " name ",
		SourceModel:      " company ",
		StoredValueField: " doc_id ",
	})
	if err != nil {
		t.Fatalf("ListOptions returned error: %v", err)
	}

	if repo.req.Dictionary != "company" {
		t.Fatalf("dictionary = %q, want company", repo.req.Dictionary)
	}
	if repo.req.SourceModel != "company" {
		t.Fatalf("source model = %q, want company", repo.req.SourceModel)
	}
	if repo.req.PageSize != 10 {
		t.Fatalf("page size = %d, want 10", repo.req.PageSize)
	}
	if got := repo.req.DisplayFields; len(got) != 3 || got[0] != "name" || got[1] != "city" || got[2] != "state" {
		t.Fatalf("display fields = %#v, want [name city state]", got)
	}
	if got := repo.req.SearchFields; len(got) != 2 || got[0] != "name" || got[1] != "email" {
		t.Fatalf("search fields = %#v, want [name email]", got)
	}
	if repo.req.SortField != "name" || repo.req.StoredValueField != "doc_id" {
		t.Fatalf("sort/stored = %q/%q, want name/doc_id", repo.req.SortField, repo.req.StoredValueField)
	}
	if got := repo.req.Filters; len(got) != 1 || got[0].Field != "active" || got[0].Operator != "eq" || got[0].Value != true {
		t.Fatalf("filters = %#v, want active eq true", got)
	}
}
