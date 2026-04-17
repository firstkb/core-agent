package platformstudioformbuilder

import (
	"strings"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

func TestBuildRuntimeViewListWhereClauseSupportsAllQuickFilter(t *testing.T) {
	clause, args, err := buildRuntimeViewListWhereClause(
		[]collectiontable.QuickFilter{
			{FieldID: "all", Operator: "contains", Value: "demo"},
		},
		nil,
		[]collectiontable.FieldDefinition{
			{ID: "first_name", Searchable: true, Type: "text"},
			{ID: "last_name", Searchable: true, Type: "text"},
		},
		nil,
	)
	if err != nil {
		t.Fatalf("buildRuntimeViewListWhereClause returned error: %v", err)
	}
	wantClause := `(LOWER(COALESCE(t."first_name"::text, '')) LIKE $1 OR LOWER(COALESCE(t."last_name"::text, '')) LIKE $1)`
	if clause != wantClause {
		t.Fatalf("where clause = %q, want %q", clause, wantClause)
	}
	if len(args) != 1 || args[0] != "%demo%" {
		t.Fatalf("where args = %#v, want [%%demo%%]", args)
	}
}

func TestQueryRuntimeViewListAppliesDefaultFiltersUsingAuthoringFieldID(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootScope["viewSettings"] = map[string]any{
		"list": map[string]any{
			"columns": []any{
				map[string]any{
					"fieldId": "site-name",
					"id":      "grid-column-site-name",
					"order":   0,
				},
			},
		},
	}
	rootScope["filterDefinitions"] = map[string]any{
		"defaultFilters": map[string]any{
			"logic": "and",
			"conditions": []any{
				map[string]any{
					"fieldId":  "site-name",
					"operator": "eq",
					"valueSource": map[string]any{
						"kind":  "literal",
						"value": "HQ",
					},
				},
			},
		},
	}
	uiSchema["rootScope"] = rootScope
	viewPayload["uiSchema"] = uiSchema
	view.DefinitionJSON = mustJSON(t, viewPayload)

	svc := NewService(repo)
	runtimeContext, err := svc.loadRuntimeViewListContext(rootTestContext(), requestctx.TenantInfo{ID: "101"}, model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("loadRuntimeViewListContext returned error: %v", err)
	}
	if clause, args, clauseErr := buildRuntimeViewListDefaultFiltersClause(runtimeContext.DefaultFilters, runtimeContext.Fields, 1); clauseErr != nil {
		t.Fatalf("buildRuntimeViewListDefaultFiltersClause returned error: %v (filters=%#v fields=%#v)", clauseErr, runtimeContext.DefaultFilters, runtimeContext.Fields)
	} else if clause == "" {
		t.Fatalf("expected non-empty default filter clause, got empty (args=%#v filters=%#v fields=%#v)", args, runtimeContext.DefaultFilters, runtimeContext.Fields)
	}
	_, err = svc.QueryRuntimeViewList(rootTestContext(), model.ModelID, view.ViewID, RuntimeViewListQueryRequest{})
	if err != nil {
		t.Fatalf("QueryRuntimeViewList returned error: %v", err)
	}

	wantClause := `LOWER(COALESCE(t."site_name"::text, '')) = $1`
	if repo.lastRuntimeWhereClause != wantClause {
		t.Fatalf("where clause = %q, want %q", repo.lastRuntimeWhereClause, wantClause)
	}
	if len(repo.lastRuntimeWhereArgs) != 1 || repo.lastRuntimeWhereArgs[0] != "hq" {
		t.Fatalf("where args = %#v, want [hq]", repo.lastRuntimeWhereArgs)
	}
}

func TestQueryRuntimeViewListCombinesDefaultAndInteractiveFilters(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootScope["viewSettings"] = map[string]any{
		"list": map[string]any{
			"columns": []any{
				map[string]any{
					"fieldId": "site-name",
					"id":      "grid-column-site-name",
					"order":   0,
				},
			},
		},
	}
	rootScope["filterDefinitions"] = map[string]any{
		"defaultFilters": map[string]any{
			"logic": "and",
			"conditions": []any{
				map[string]any{
					"fieldId":  "site-name",
					"operator": "eq",
					"valueSource": map[string]any{
						"kind":  "literal",
						"value": "HQ",
					},
				},
			},
		},
	}
	uiSchema["rootScope"] = rootScope
	viewPayload["uiSchema"] = uiSchema
	view.DefinitionJSON = mustJSON(t, viewPayload)

	svc := NewService(repo)
	runtimeContext, err := svc.loadRuntimeViewListContext(rootTestContext(), requestctx.TenantInfo{ID: "101"}, model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("loadRuntimeViewListContext returned error: %v", err)
	}
	if clause, args, clauseErr := buildRuntimeViewListDefaultFiltersClause(runtimeContext.DefaultFilters, runtimeContext.Fields, 1); clauseErr != nil {
		t.Fatalf("buildRuntimeViewListDefaultFiltersClause returned error: %v (filters=%#v fields=%#v)", clauseErr, runtimeContext.DefaultFilters, runtimeContext.Fields)
	} else if clause == "" {
		t.Fatalf("expected non-empty default filter clause, got empty (args=%#v filters=%#v fields=%#v)", args, runtimeContext.DefaultFilters, runtimeContext.Fields)
	}
	_, err = svc.QueryRuntimeViewList(rootTestContext(), model.ModelID, view.ViewID, RuntimeViewListQueryRequest{
		QuickFilters: []collectiontable.QuickFilter{
			{FieldID: "site_name", Operator: "contains", Value: "east"},
		},
	})
	if err != nil {
		t.Fatalf("QueryRuntimeViewList returned error: %v", err)
	}

	if !strings.Contains(repo.lastRuntimeWhereClause, `LOWER(COALESCE(t."site_name"::text, '')) = $1`) {
		t.Fatalf("where clause should include default filter, got %q", repo.lastRuntimeWhereClause)
	}
	if !strings.Contains(repo.lastRuntimeWhereClause, `LOWER(COALESCE(t."site_name"::text, '')) LIKE $2`) {
		t.Fatalf("where clause should include quick filter, got %q", repo.lastRuntimeWhereClause)
	}
	if len(repo.lastRuntimeWhereArgs) != 2 {
		t.Fatalf("where args len = %d, want 2 (%#v)", len(repo.lastRuntimeWhereArgs), repo.lastRuntimeWhereArgs)
	}
}

func TestLoadRuntimeViewListSearchSuggestionsAppliesDefaultFilters(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootScope["viewSettings"] = map[string]any{
		"list": map[string]any{
			"columns": []any{
				map[string]any{
					"fieldId": "site-name",
					"id":      "grid-column-site-name",
					"order":   0,
				},
			},
		},
	}
	rootScope["filterDefinitions"] = map[string]any{
		"defaultFilters": map[string]any{
			"logic": "and",
			"conditions": []any{
				map[string]any{
					"fieldId":  "site-name",
					"operator": "eq",
					"valueSource": map[string]any{
						"kind":  "literal",
						"value": "HQ",
					},
				},
			},
		},
	}
	uiSchema["rootScope"] = rootScope
	viewPayload["uiSchema"] = uiSchema
	view.DefinitionJSON = mustJSON(t, viewPayload)

	svc := NewService(repo)
	runtimeContext, err := svc.loadRuntimeViewListContext(rootTestContext(), requestctx.TenantInfo{ID: "101"}, model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("loadRuntimeViewListContext returned error: %v", err)
	}
	repo.runtimeSuggestions[runtimeContext.GridViewName] = map[string][]runtimeRelationSuggestion{
		"site_name": {
			{Value: "HQ", Count: 1},
		},
	}

	out, err := svc.LoadRuntimeViewListSearchSuggestions(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListSearchSuggestions returned error: %v", err)
	}

	wantClause := `LOWER(COALESCE(t."site_name"::text, '')) = $1`
	if repo.lastRuntimeSuggestionWhere != wantClause {
		t.Fatalf("search suggestion where clause = %q, want %q", repo.lastRuntimeSuggestionWhere, wantClause)
	}
	if len(repo.lastRuntimeSuggestionArgs) != 1 || repo.lastRuntimeSuggestionArgs[0] != "hq" {
		t.Fatalf("search suggestion where args = %#v, want [hq]", repo.lastRuntimeSuggestionArgs)
	}
	if len(out.Groups) != 1 || out.Groups[0].FieldID != "site_name" {
		t.Fatalf("search suggestion groups = %#v, want site_name group", out.Groups)
	}
}
