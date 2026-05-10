package dictionarysvc

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
