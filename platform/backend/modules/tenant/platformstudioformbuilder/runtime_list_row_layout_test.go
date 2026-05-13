package platformstudioformbuilder

import (
	"strings"
	"testing"
)

func TestBuildRuntimeViewListSecondaryRowFieldIDUsesLookupLabelAlias(t *testing.T) {
	uiSchema := map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"viewSettings": map[string]any{
				"list": map[string]any{
					"rowLayout": map[string]any{
						"secondaryRowFieldId": "contact",
					},
				},
			},
		},
	}
	fields := []runtimeApplyFieldPlan{
		{
			FieldID:       "contact",
			StorageKey:    "contact",
			Kind:          "db_lookup",
			ColumnName:    "contact_id",
			Supported:     true,
			SelectionMode: "single",
			LookupDerivedOutputs: []runtimeApplyLookupOutputPlan{
				{ColumnName: "contact__label", OutputKey: "label", DataType: "text"},
			},
		},
	}
	gridPlan := &runtimeApplyGridViewPlan{
		Projections: []runtimeApplyGridColumnProjection{
			{AliasColumnName: "contact", SourceColumnName: "contact__label"},
		},
	}

	got := buildRuntimeViewListSecondaryRowFieldID(uiSchema, fields, gridPlan)
	if got != "contact" {
		t.Fatalf("secondary row field = %q, want lookup label alias %q", got, "contact")
	}
}

func TestBuildRuntimeViewListFieldsMarksLookupLabelsWithLeadingCommaFormat(t *testing.T) {
	dataSchema := map[string]any{
		"rootScope": map[string]any{
			"fields": []any{
				map[string]any{
					"id":         "project",
					"kind":       "db_lookup",
					"label":      "Project",
					"storageKey": "project",
				},
			},
		},
	}
	fields := []runtimeApplyFieldPlan{
		{
			FieldID:       "project",
			StorageKey:    "project",
			Kind:          "db_lookup",
			ColumnName:    "project_id",
			Supported:     true,
			SelectionMode: "single",
			LookupDerivedOutputs: []runtimeApplyLookupOutputPlan{
				{ColumnName: "project__label", OutputKey: "label", DataType: "text"},
			},
		},
	}
	gridPlan := &runtimeApplyGridViewPlan{
		Projections: []runtimeApplyGridColumnProjection{
			{AliasColumnName: "project", SourceColumnName: "project__label"},
		},
	}

	got := buildRuntimeViewListFields(dataSchema, map[string]any{}, fields, gridPlan)
	if len(got) != 1 {
		t.Fatalf("field count = %d, want 1", len(got))
	}
	if got[0].DisplayFormat != runtimeViewListDisplayFormatLeadingCommaBold {
		t.Fatalf("display format = %q, want %q", got[0].DisplayFormat, runtimeViewListDisplayFormatLeadingCommaBold)
	}
}

func TestRuntimeLookupExpressionForManagedModelUsesCommaSeparator(t *testing.T) {
	got := runtimeLookupExpressionForManagedModel("lk_lookup_option", "label", []string{"catalog", "hazard"})
	if !strings.Contains(got, "concat_ws(', ',") {
		t.Fatalf("managed lookup label expression = %s, want comma separator", got)
	}
}

func TestLoadRuntimeViewListMetaMovesSecondaryRowFieldOutOfColumns(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedRootOnlyExternalModelAndDefaultView(t, repo, "events")
	repo.runtimeRelations[model.StorageKey] = "table"

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = []any{
		map[string]any{
			"id":         "title",
			"kind":       "short_text",
			"label":      "Title",
			"storageKey": "title",
		},
		map[string]any{
			"id":         "description",
			"kind":       "long_text",
			"label":      "Description",
			"storageKey": "description",
		},
	}
	dataSchema["rootScope"] = rootScope
	modelPayload["dataSchema"] = dataSchema
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootLayoutScope := asMap(layoutBlueprint["rootScope"])
	rootLayoutScope["fieldPlacements"] = []any{
		map[string]any{"containerKey": "__scope_root__", "fieldId": "title", "order": 0},
		map[string]any{"containerKey": "__scope_root__", "fieldId": "description", "order": 1},
	}
	layoutBlueprint["rootScope"] = rootLayoutScope
	modelPayload["layoutBlueprint"] = layoutBlueprint
	model.DefinitionJSON = mustJSON(t, modelPayload)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["nodes"] = []any{
		map[string]any{"id": "field-title", "type": "field", "fieldId": "title", "order": 0},
		map[string]any{"id": "field-description", "type": "field", "fieldId": "description", "order": 1},
	}
	rootUIScope["viewSettings"] = map[string]any{
		"list": map[string]any{
			"columns": []any{
				map[string]any{"fieldId": "title", "id": "grid-column-title", "order": 0},
				map[string]any{"fieldId": "description", "id": "grid-column-description", "order": 1},
			},
			"rowLayout": map[string]any{
				"secondaryRowFieldId": "description",
			},
		},
	}
	uiSchema["rootScope"] = rootUIScope
	viewPayload["uiSchema"] = uiSchema
	view.DefinitionJSON = mustJSON(t, viewPayload)

	svc := NewService(repo)
	out, err := svc.LoadRuntimeViewListMeta(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}
	if out.RowLayout.SecondaryRowFieldID != "description" {
		t.Fatalf("secondary row field = %q, want description", out.RowLayout.SecondaryRowFieldID)
	}
	if len(out.Fields) != 2 {
		t.Fatalf("field count = %d, want 2", len(out.Fields))
	}
	if len(out.Columns) != 1 {
		t.Fatalf("column count = %d, want only header column", len(out.Columns))
	}
	if out.Columns[0].ID != "title" {
		t.Fatalf("column id = %q, want title", out.Columns[0].ID)
	}
}
