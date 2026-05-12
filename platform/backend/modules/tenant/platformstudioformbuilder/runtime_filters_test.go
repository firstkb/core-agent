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
		runtimeViewListFilterContext{},
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
	if clause, args, clauseErr := buildRuntimeViewListDefaultFiltersClause(runtimeContext.DefaultFilters, runtimeContext.FilterFields, 1, runtimeViewListFilterContext{}); clauseErr != nil {
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
	if clause, args, clauseErr := buildRuntimeViewListDefaultFiltersClause(runtimeContext.DefaultFilters, runtimeContext.FilterFields, 1, runtimeViewListFilterContext{}); clauseErr != nil {
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

func TestQueryRuntimeViewListIgnoresContactLookupDefaultFiltersForRoot(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	configureContactLookupDefaultFilters(t, model, view)

	svc := NewService(repo)
	_, err := svc.QueryRuntimeViewList(rootTestContext(), model.ModelID, view.ViewID, RuntimeViewListQueryRequest{})
	if err != nil {
		t.Fatalf("QueryRuntimeViewList returned error: %v", err)
	}
	if repo.lastRuntimeWhereClause != "" {
		t.Fatalf("root where clause = %q, want empty", repo.lastRuntimeWhereClause)
	}
	if len(repo.lastRuntimeWhereArgs) != 0 {
		t.Fatalf("root where args = %#v, want empty", repo.lastRuntimeWhereArgs)
	}
}

func TestQueryRuntimeViewListGroupsContactLookupDefaultFiltersBySemanticOR(t *testing.T) {
	repo := newMemoryRepository()
	repo.runtimeActorUserID = 77
	repo.runtimeActorCompanyID = 9
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	configureContactLookupDefaultFilters(t, model, view)

	svc := NewService(repo)
	_, err := svc.QueryRuntimeViewList(testContext(), model.ModelID, view.ViewID, RuntimeViewListQueryRequest{})
	if err != nil {
		t.Fatalf("QueryRuntimeViewList returned error: %v", err)
	}

	activeGroup := `(dv."reported_by_id" = $1::bigint OR dv."contact_id" = $1::bigint)`
	if !strings.Contains(repo.lastRuntimeWhereClause, activeGroup) {
		t.Fatalf("where clause should OR active_account across contact fields, got %q", repo.lastRuntimeWhereClause)
	}
	companyGroup := `(dv."reported_by__company_id" = $2::bigint OR dv."contact__company_id" = $2::bigint)`
	if !strings.Contains(repo.lastRuntimeWhereClause, companyGroup) {
		t.Fatalf("where clause should OR by_user_company across contact fields, got %q", repo.lastRuntimeWhereClause)
	}
	if !strings.Contains(repo.lastRuntimeWhereClause, " AND ") {
		t.Fatalf("where clause should AND different semantic groups, got %q", repo.lastRuntimeWhereClause)
	}
	if len(repo.lastRuntimeWhereArgs) != 2 || repo.lastRuntimeWhereArgs[0] != int64(77) || repo.lastRuntimeWhereArgs[1] != int64(9) {
		t.Fatalf("where args = %#v, want [77 9]", repo.lastRuntimeWhereArgs)
	}
}

func configureContactLookupDefaultFilters(t *testing.T, model *ModelRecord, view *ViewRecord) {
	t.Helper()

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootDataScope := asMap(dataSchema["rootScope"])
	rootDataScope["fields"] = append(asSlice(rootDataScope["fields"]),
		map[string]any{
			"displayName":   "Reported By",
			"id":            "reported-by",
			"key":           "reported-by",
			"kind":          "db_lookup",
			"label":         "Reported By",
			"preset":        "contact_lookup",
			"schemaScopeId": "root",
			"selectionMode": "single",
			"storageKey":    "reported_by",
		},
		map[string]any{
			"displayName":   "Contact",
			"id":            "contact",
			"key":           "contact",
			"kind":          "db_lookup",
			"label":         "Contact",
			"preset":        "contact_lookup",
			"schemaScopeId": "root",
			"selectionMode": "single",
			"storageKey":    "contact",
		},
	)
	dataSchema["rootScope"] = rootDataScope
	modelPayload["dataSchema"] = dataSchema
	model.DefinitionJSON = mustJSON(t, modelPayload)

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
					"editorType":   "lookup",
					"fieldId":      "reported-by",
					"lookupPreset": "contact_lookup",
					"clauses": []any{
						map[string]any{"clauseKey": "active_account", "value": true, "valueMode": "boolean_flag"},
						map[string]any{"clauseKey": "by_user_company", "value": true, "valueMode": "boolean_flag"},
					},
				},
				map[string]any{
					"editorType":   "lookup",
					"fieldId":      "contact",
					"lookupPreset": "contact_lookup",
					"clauses": []any{
						map[string]any{"clauseKey": "active_account", "value": true, "valueMode": "boolean_flag"},
						map[string]any{"clauseKey": "by_user_company", "value": true, "valueMode": "boolean_flag"},
					},
				},
			},
		},
	}
	uiSchema["rootScope"] = rootScope
	viewPayload["uiSchema"] = uiSchema
	view.DefinitionJSON = mustJSON(t, viewPayload)
}
