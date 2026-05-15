package platformstudioformruntime

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	dictionary "dtriton.com/platform/backend/modules/tenant/dictionary"
)

func TestReadOptionValuesSupportsStringAndObjectOptions(t *testing.T) {
	values := readOptionValues([]any{
		"New",
		map[string]any{"label": "Open label", "value": "Open"},
		map[string]any{"label": "Closed"},
		"New",
	})

	if len(values) != 3 || values[0] != "New" || values[1] != "Open" || values[2] != "Closed" {
		t.Fatalf("option values = %#v, want New/Open/Closed", values)
	}
}

func TestSupportsRuntimeUniqueValueMatchesAuthoringScope(t *testing.T) {
	tests := []struct {
		kind       string
		preset     string
		validation string
		want       bool
	}{
		{kind: "short_text", want: true},
		{kind: "short_text", preset: "email", want: true},
		{kind: "short_text", validation: "email", want: true},
		{kind: "short_text", preset: "phone", want: true},
		{kind: "short_text", validation: "phone", want: true},
		{kind: "short_text", preset: "url", want: false},
		{kind: "short_text", preset: "suggest_text", want: false},
		{kind: "long_text", want: false},
	}

	for _, tt := range tests {
		got := supportsRuntimeUniqueValue(tt.kind, tt.preset, tt.validation)
		if got != tt.want {
			t.Fatalf("supportsRuntimeUniqueValue(%q, %q, %q) = %v, want %v", tt.kind, tt.preset, tt.validation, got, tt.want)
		}
	}
}

func TestGeoPointPlanNormalizeAndValidate(t *testing.T) {
	field := buildRuntimeFieldPlan(map[string]any{
		"id":         "gps",
		"kind":       "geo_point",
		"label":      "GPS coordinates",
		"storageKey": "gps",
	}, "managed")

	if !field.Supported {
		t.Fatal("geo_point field should be supported")
	}
	if field.ColumnName != "gps" {
		t.Fatalf("geo_point column = %q, want gps", field.ColumnName)
	}

	normalized := normalizeMutationValue(field, "40.7128,-74.006")
	if normalized != "Latitude: 40.712800, Longitude: -74.006000" {
		t.Fatalf("normalized geo point = %#v", normalized)
	}

	validErrors := validateFieldValues(runtimeRootScopePlan{Fields: []runtimeFieldPlan{field}}, map[string]any{
		"gps": normalized,
	})
	if len(validErrors) != 0 {
		t.Fatalf("valid geo point errors = %#v", validErrors)
	}

	invalidErrors := validateFieldValues(runtimeRootScopePlan{Fields: []runtimeFieldPlan{field}}, map[string]any{
		"gps": "Latitude: 91.000000, Longitude: -74.006000",
	})
	if len(invalidErrors) != 1 || invalidErrors[0].FieldID != "gps" {
		t.Fatalf("invalid geo point errors = %#v, want one gps error", invalidErrors)
	}
}

func TestCreateRecordWaitsForRequiredFields(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	svc := NewService(repo)
	svc.now = func() time.Time {
		return time.Date(2026, 5, 2, 12, 0, 0, 0, time.UTC)
	}

	out, err := svc.CreateRecord(testRuntimeContext(), "sor", "default", RuntimeViewRecordMutationRequest{
		Values: map[string]any{},
	})
	if err != nil {
		t.Fatalf("CreateRecord returned error: %v", err)
	}
	if len(out.ValidationErrors) != 1 {
		t.Fatalf("validation errors = %d, want 1", len(out.ValidationErrors))
	}
	if out.ValidationErrors[0].FieldID != "location" {
		t.Fatalf("validation field = %q, want location", out.ValidationErrors[0].FieldID)
	}
	if repo.created {
		t.Fatal("CreateRootRecord was called before required fields were complete")
	}
	if got := out.Values["reported_date"]; got != "2026-05-02" {
		t.Fatalf("reported_date default = %#v, want 2026-05-02", got)
	}
	if got := out.Values["reported_by"]; got != int64(77) {
		t.Fatalf("reported_by default = %#v, want business id 77", got)
	}
	if got := out.Values["status"]; got != "new" {
		t.Fatalf("status default = %#v, want new", got)
	}
}

func TestCreateRecordAppliesSystemDefaults(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	svc := NewService(repo)
	svc.now = func() time.Time {
		return time.Date(2026, 5, 2, 12, 0, 0, 0, time.UTC)
	}

	out, err := svc.CreateRecord(testRuntimeContext(), "sor", "default", RuntimeViewRecordMutationRequest{
		Values: map[string]any{
			"location": "HQ",
		},
	})
	if err != nil {
		t.Fatalf("CreateRecord returned error: %v", err)
	}
	if !out.Created {
		t.Fatal("response Created = false, want true")
	}
	if out.DocGuid != "created-guid" {
		t.Fatalf("DocGuid = %q, want created-guid", out.DocGuid)
	}
	if out.RecordID != "101" {
		t.Fatalf("RecordID = %q, want 101", out.RecordID)
	}
	assertValue(t, repo.lastCreateValues, "location", "HQ")
	assertValue(t, repo.lastCreateValues, "reported_date", "2026-05-02")
	assertValue(t, repo.lastCreateValues, "reported_by", int64(77))
	assertValue(t, repo.lastCreateValues, "status", "new")
	if out.Status != "new" {
		t.Fatalf("response status = %q, want new", out.Status)
	}
}

func TestCreateRecordPassesManagedMultiSelectValues(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	svc := NewService(repo)

	out, err := svc.CreateRecord(testRuntimeContext(), "sor", "default", RuntimeViewRecordMutationRequest{
		Values: map[string]any{
			"location":   "HQ",
			"categories": []any{"aerial_lifts", "ppe", "ppe", ""},
		},
	})
	if err != nil {
		t.Fatalf("CreateRecord returned error: %v", err)
	}
	expected := []string{"aerial_lifts", "ppe"}
	if got, ok := repo.lastCreateValues["categories"].([]string); !ok || !stringSlicesEqual(got, expected) {
		t.Fatalf("stored categories = %#v, want %#v", repo.lastCreateValues["categories"], expected)
	}
	if got, ok := out.Values["categories"].([]string); !ok || !stringSlicesEqual(got, expected) {
		t.Fatalf("response categories = %#v, want %#v", out.Values["categories"], expected)
	}
}

func TestCreateRecordPassesManagedLookupMultiValues(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	addRuntimeRootField(repo, map[string]any{
		"fieldId":       "related_contacts",
		"kind":          "db_lookup",
		"label":         "Related Contacts",
		"selectionMode": "multiple",
		"storageKey":    "related_contacts",
	})
	svc := NewService(repo)

	out, err := svc.CreateRecord(testRuntimeContext(), "sor", "default", RuntimeViewRecordMutationRequest{
		LookupLabels: map[string]map[string]string{
			"related_contacts": {
				"1": "Andrew Owner",
				"2": "Jane Owner",
			},
		},
		Values: map[string]any{
			"location":         "HQ",
			"related_contacts": []any{"1", "2", "2", ""},
		},
	})
	if err != nil {
		t.Fatalf("CreateRecord returned error: %v", err)
	}
	expected := []string{"1", "2"}
	if got, ok := repo.lastCreateValues["related_contacts"].([]string); !ok || !stringSlicesEqual(got, expected) {
		t.Fatalf("stored related_contacts = %#v, want %#v", repo.lastCreateValues["related_contacts"], expected)
	}
	if got, ok := out.Values["related_contacts"].([]string); !ok || !stringSlicesEqual(got, expected) {
		t.Fatalf("response related_contacts = %#v, want %#v", out.Values["related_contacts"], expected)
	}
}

func TestCreateRecordNormalizesLookupValueAsText(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	addRuntimeRootField(repo, map[string]any{
		"fieldId":    "vendor_name",
		"kind":       "db_lookup",
		"label":      "Vendor Name",
		"preset":     "db_lookup_value",
		"storageKey": "vendor_name",
	})
	svc := NewService(repo)

	_, err := svc.CreateRecord(testRuntimeContext(), "sor", "default", RuntimeViewRecordMutationRequest{
		Values: map[string]any{
			"location":    "HQ",
			"vendor_name": "Acme Electrical",
		},
	})
	if err != nil {
		t.Fatalf("CreateRecord returned error: %v", err)
	}
	assertValue(t, repo.lastCreateValues, "vendor_name", "Acme Electrical")
}

func TestLoadFormReturnsSchemasAndCreateDefaults(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	svc := NewService(repo)
	svc.now = func() time.Time {
		return time.Date(2026, 5, 2, 12, 0, 0, 0, time.UTC)
	}

	out, err := svc.LoadForm(testRuntimeContext(), "sor", "default", "")
	if err != nil {
		t.Fatalf("LoadForm returned error: %v", err)
	}
	if out.ModelID != "sor" || out.ViewID != "default" {
		t.Fatalf("form route ids = %q/%q, want sor/default", out.ModelID, out.ViewID)
	}
	if len(out.DataSchema) == 0 {
		t.Fatal("DataSchema is empty")
	}
	if len(out.UISchema) == 0 {
		t.Fatal("UISchema is empty")
	}
	assertValue(t, out.Values, "reported_date", "2026-05-02")
	assertValue(t, out.Values, "reported_by", int64(77))
	assertValue(t, out.Values, "status", "new")
	reportedByField := findDataSchemaField(out.DataSchema, "reported_by")
	options := reportedByField["options"].([]any)
	if len(options) != 1 {
		t.Fatalf("reported_by options = %d, want 1", len(options))
	}
	option := options[0].(map[string]any)
	if option["value"] != "77" || option["label"] != "Andrew Owner" {
		t.Fatalf("reported_by current option = %#v, want Andrew Owner/77", option)
	}
}

func TestLoadFormReturnsSourceRecordID(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	svc := NewService(repo)

	out, err := svc.LoadForm(testRuntimeContext(), "sor", "default", "record-guid")
	if err != nil {
		t.Fatalf("LoadForm returned error: %v", err)
	}
	if out.DocGuid != "record-guid" {
		t.Fatalf("DocGuid = %q, want record-guid", out.DocGuid)
	}
	if out.RecordID != "202" {
		t.Fatalf("RecordID = %q, want 202", out.RecordID)
	}
}

func TestLoadFormReturnsChecklistMatrixWithSavedInactiveUnion(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	modelPayload := cloneJSONToMap(repo.model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	subformScopes := asSlice(dataSchema["subformScopes"])
	dataSchema["subformScopes"] = append(subformScopes, map[string]any{
		"displayName":   "Checklist",
		"schemaScopeId": "checklist",
		"subformType":   "CHECKLIST",
		"tableKey":      "checklist",
		"runtime": map[string]any{
			"rtAlias":      "checklist",
			"tableName":    "ps_sor__checklist",
			"dataViewName": "vw_sor__checklist",
		},
		"fields": []any{
			map[string]any{
				"fieldId":       "item",
				"kind":          "db_lookup",
				"label":         "Item",
				"selectionMode": "single",
				"storageKey":    "item",
				"lookupConfig": map[string]any{
					"displayFields":    []any{"catalog", "hazard"},
					"filters":          []any{map[string]any{"field": "active", "operator": "eq", "value": true}},
					"searchFields":     []any{"catalog", "hazard"},
					"sourceModel":      "lookup-option",
					"storedValueField": "doc_id",
				},
			},
			map[string]any{
				"fieldId":    "result",
				"kind":       "single_select",
				"label":      "Result",
				"storageKey": "result",
				"options":    []any{"Yes", "No"},
			},
			map[string]any{
				"fieldId":    "notes",
				"kind":       "long_text",
				"label":      "Notes",
				"storageKey": "notes",
			},
		},
	})
	repo.model.DefinitionJSON = mustJSON(modelPayload)

	viewPayload := cloneJSONToMap(repo.view.DefinitionJSON)
	rootScope := asMap(asMap(viewPayload["uiSchema"])["rootScope"])
	rootScope["nodes"] = append(asSlice(rootScope["nodes"]), map[string]any{
		"checklistConfig": map[string]any{
			"grouping":      "by_first_display_field",
			"lookupFieldId": "item",
			"notesFieldId":  "notes",
			"resultFieldId": "result",
		},
		"id":            "subform-checklist",
		"schemaScopeId": "checklist",
		"subformType":   "CHECKLIST",
		"tableKey":      "checklist",
		"title":         "Checklist",
		"type":          "subform",
	})
	repo.view.DefinitionJSON = mustJSON(viewPayload)
	repo.checklistRows = []runtimeChecklistSavedRow{{
		DocGuid:     "saved-row-guid",
		Notes:       "existing note",
		SourceID:    501,
		SourceValue: "inactive-item",
		Value:       "No",
	}}

	provider := &recordingLookupOptionsProvider{
		list: func(req dictionary.OptionsRequest) (*dictionary.OptionsResponse, error) {
			if req.Dictionary == "contacts" {
				return &dictionary.OptionsResponse{Items: []dictionary.Option{{
					Label: "Andrew Owner",
					Value: "77",
				}}}, nil
			}
			if len(req.IDs) > 0 {
				return &dictionary.OptionsResponse{Items: []dictionary.Option{{
					Fields: map[string]string{
						"_guid":           "inactive-item-guid",
						"answer_required": "true",
						"catalog":         "Environmental",
						"hazard":          "Old inactive question",
					},
					Label: "Environmental, Old inactive question",
					Value: "inactive-item",
				}}}, nil
			}
			return &dictionary.OptionsResponse{Items: []dictionary.Option{{
				Fields: map[string]string{
					"_guid":           "active-item-guid",
					"answer_options":  "Yes|No|N/A",
					"answer_required": "true",
					"catalog":         "Environmental",
					"hazard":          "Active question",
				},
				Label: "Environmental, Active question",
				Value: "active-item",
			}}}, nil
		},
	}
	svc := NewService(repo, provider)

	out, err := svc.LoadForm(testRuntimeContext(), "sor", "default", "record-guid")
	if err != nil {
		t.Fatalf("LoadForm returned error: %v", err)
	}
	checklist := out.Subforms["checklist"].Checklist
	if checklist == nil || len(checklist.Groups) != 1 {
		t.Fatalf("checklist groups = %#v, want one group", checklist)
	}
	if checklist.Groups[0].Title != "Environmental" {
		t.Fatalf("checklist group title = %q, want Environmental", checklist.Groups[0].Title)
	}
	items := checklist.Groups[0].Items
	if len(items) != 2 {
		t.Fatalf("checklist item count = %d, want active + saved inactive", len(items))
	}
	var savedInactive *RuntimeViewChecklistItem
	for index := range items {
		if strings.Contains(items[index].Label, "Environmental") {
			t.Fatalf("checklist item label = %q, want question text without category prefix", items[index].Label)
		}
		if items[index].SourceValue == "inactive-item" {
			savedInactive = &items[index]
		}
	}
	if savedInactive == nil {
		t.Fatalf("saved inactive item missing: %#v", items)
	}
	if !savedInactive.InactiveSaved || savedInactive.Value != "No" || savedInactive.Notes != "existing note" {
		t.Fatalf("saved inactive item = %#v, want inactive saved No with note", savedInactive)
	}
	if savedInactive.SourceGuid != "inactive-item-guid" {
		t.Fatalf("saved inactive source guid = %q, want inactive-item-guid", savedInactive.SourceGuid)
	}
}

func TestUpdateChecklistItemResolvesSourceGuid(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	modelPayload := cloneJSONToMap(repo.model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	dataSchema["subformScopes"] = append(asSlice(dataSchema["subformScopes"]), map[string]any{
		"displayName":   "Checklist",
		"schemaScopeId": "checklist",
		"subformType":   "CHECKLIST",
		"tableKey":      "checklist",
		"runtime": map[string]any{
			"rtAlias":      "checklist",
			"tableName":    "ps_sor__checklist",
			"dataViewName": "vw_sor__checklist",
		},
		"fields": []any{
			map[string]any{
				"fieldId":       "item",
				"kind":          "db_lookup",
				"label":         "Item",
				"selectionMode": "single",
				"storageKey":    "item",
				"lookupConfig": map[string]any{
					"displayFields":    []any{"catalog", "hazard"},
					"searchFields":     []any{"catalog", "hazard"},
					"sourceModel":      "lookup-option",
					"storedValueField": "doc_id",
				},
			},
			map[string]any{
				"fieldId":    "result",
				"kind":       "single_select",
				"label":      "Result",
				"storageKey": "result",
				"options":    []any{"Yes", "No"},
			},
			map[string]any{
				"fieldId":    "notes",
				"kind":       "long_text",
				"label":      "Notes",
				"storageKey": "notes",
			},
		},
	})
	repo.model.DefinitionJSON = mustJSON(modelPayload)

	viewPayload := cloneJSONToMap(repo.view.DefinitionJSON)
	rootScope := asMap(asMap(viewPayload["uiSchema"])["rootScope"])
	rootScope["nodes"] = append(asSlice(rootScope["nodes"]), map[string]any{
		"checklistConfig": map[string]any{
			"lookupFieldId": "item",
			"notesFieldId":  "notes",
			"resultFieldId": "result",
		},
		"id":            "subform-checklist",
		"schemaScopeId": "checklist",
		"subformType":   "CHECKLIST",
		"tableKey":      "checklist",
		"title":         "Checklist",
		"type":          "subform",
	})
	repo.view.DefinitionJSON = mustJSON(viewPayload)

	sourceGuid := "11111111-1111-1111-1111-111111111111"
	provider := &recordingLookupOptionsProvider{
		list: func(req dictionary.OptionsRequest) (*dictionary.OptionsResponse, error) {
			if req.SourceModel != "lookup-option" || req.StoredValueField != "doc_guid" {
				t.Fatalf("lookup request = %#v, want lookup-option by doc_guid", req)
			}
			if len(req.IDs) != 1 || req.IDs[0] != sourceGuid {
				t.Fatalf("lookup ids = %#v, want source guid", req.IDs)
			}
			if len(req.Filters) != 0 {
				t.Fatalf("lookup filters = %#v, want none for source guid resolve", req.Filters)
			}
			return &dictionary.OptionsResponse{Items: []dictionary.Option{{
				Fields: map[string]string{
					"_guid": sourceGuid,
					"_id":   "42",
				},
				ID:    sourceGuid,
				Label: "Environmental Active question",
				Value: sourceGuid,
			}}}, nil
		},
	}
	svc := NewService(repo, provider)

	out, err := svc.UpdateChecklistItem(testRuntimeContext(), "sor", "default", "parent-guid", "checklist", sourceGuid, RuntimeViewChecklistItemMutationRequest{
		Notes: "note",
		Value: "Yes",
	})
	if err != nil {
		t.Fatalf("UpdateChecklistItem returned error: %v", err)
	}
	if repo.lastChecklistUpsert == nil || repo.lastChecklistUpsert.SourceValue != "42" {
		t.Fatalf("checklist upsert = %#v, want source value 42", repo.lastChecklistUpsert)
	}
	if repo.lastChecklistUpsert.Values["item"] != "42" {
		t.Fatalf("checklist item value = %#v, want 42", repo.lastChecklistUpsert.Values["item"])
	}
	if out.Item.SourceGuid != sourceGuid || out.Item.SourceValue != "42" {
		t.Fatalf("response item source = guid %q value %q, want %q / 42", out.Item.SourceGuid, out.Item.SourceValue, sourceGuid)
	}
}

func TestLoadFormChecklistMatrixFallsBackWhenOptionalMetadataColumnsAreMissing(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	modelPayload := cloneJSONToMap(repo.model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	dataSchema["subformScopes"] = append(asSlice(dataSchema["subformScopes"]), map[string]any{
		"displayName":   "Checklist",
		"schemaScopeId": "checklist",
		"subformType":   "CHECKLIST",
		"tableKey":      "checklist",
		"runtime": map[string]any{
			"rtAlias":      "checklist",
			"tableName":    "ps_sor__checklist",
			"dataViewName": "vw_sor__checklist",
		},
		"fields": []any{
			map[string]any{
				"fieldId":       "item",
				"kind":          "db_lookup",
				"label":         "Item",
				"selectionMode": "single",
				"storageKey":    "item",
				"lookupConfig": map[string]any{
					"displayFields":    []any{"catalog", "hazard"},
					"filters":          []any{map[string]any{"field": "active", "operator": "eq", "value": true}},
					"searchFields":     []any{"catalog", "hazard"},
					"sourceModel":      "lookup-option",
					"storedValueField": "doc_id",
				},
			},
			map[string]any{
				"fieldId":    "result",
				"kind":       "single_select",
				"label":      "Result",
				"storageKey": "result",
				"options":    []any{"Yes", "No"},
			},
		},
	})
	repo.model.DefinitionJSON = mustJSON(modelPayload)

	viewPayload := cloneJSONToMap(repo.view.DefinitionJSON)
	rootScope := asMap(asMap(viewPayload["uiSchema"])["rootScope"])
	rootScope["nodes"] = append(asSlice(rootScope["nodes"]), map[string]any{
		"checklistConfig": map[string]any{
			"grouping":      "by_first_display_field",
			"lookupFieldId": "item",
			"resultFieldId": "result",
		},
		"id":            "subform-checklist",
		"schemaScopeId": "checklist",
		"subformType":   "CHECKLIST",
		"tableKey":      "checklist",
		"title":         "Checklist",
		"type":          "subform",
	})
	repo.view.DefinitionJSON = mustJSON(viewPayload)

	provider := &recordingLookupOptionsProvider{
		list: func(req dictionary.OptionsRequest) (*dictionary.OptionsResponse, error) {
			if req.Dictionary == "contacts" {
				return &dictionary.OptionsResponse{Items: []dictionary.Option{{
					Label: "Andrew Owner",
					Value: "77",
				}}}, nil
			}
			hasOptionalMetadata := false
			for _, field := range req.DisplayFields {
				if field == "answer_options" || field == "answer_required" || field == "visible_when" {
					hasOptionalMetadata = true
				}
			}
			if hasOptionalMetadata {
				return nil, dictionary.ErrInvalidDictionary
			}
			return &dictionary.OptionsResponse{Items: []dictionary.Option{{
				Fields: map[string]string{
					"catalog": "Environmental",
					"hazard":  "Active question",
				},
				Label: "Environmental, Active question",
				Value: "42",
			}}}, nil
		},
	}
	svc := NewService(repo, provider)

	out, err := svc.LoadForm(testRuntimeContext(), "sor", "default", "record-guid")
	if err != nil {
		t.Fatalf("LoadForm returned error: %v", err)
	}
	checklist := out.Subforms["checklist"].Checklist
	if checklist == nil || len(checklist.Groups) != 1 || len(checklist.Groups[0].Items) != 1 {
		t.Fatalf("checklist = %#v, want one fallback item", checklist)
	}
	if checklist.Groups[0].Title != "Environmental" || checklist.Groups[0].Items[0].Label != "Active question" {
		t.Fatalf("checklist group/item = %q/%q, want Environmental/Active question", checklist.Groups[0].Title, checklist.Groups[0].Items[0].Label)
	}
	if checklist.Groups[0].Items[0].SourceValue != "42" {
		t.Fatalf("checklist source value = %q, want doc_id/_id value 42", checklist.Groups[0].Items[0].SourceValue)
	}
	if provider.calls < 2 {
		t.Fatalf("lookup calls = %d, want enriched request plus fallback", provider.calls)
	}
}

func TestBuildReturningClauseSkipsMissingRuntimeFieldColumns(t *testing.T) {
	scope := runtimeRootScopePlan{
		Fields: []runtimeFieldPlan{
			{FieldID: "existing", ColumnName: "existing_col", Kind: "short_text", Supported: true},
			{FieldID: "missing", ColumnName: "missing_col", Kind: "short_text", Supported: true},
		},
		SourceGUIDColumn:    "_guid",
		SourceIDColumn:      "_id",
		SourceUpdatedColumn: "_updated_at",
	}
	clause, fields := buildReturningClauseForColumns(scope, map[string]struct{}{
		"_guid":        {},
		"_id":          {},
		"_updated_at":  {},
		"existing_col": {},
	})

	if strings.Contains(clause, "missing_col") {
		t.Fatalf("returning clause includes missing column: %s", clause)
	}
	if !strings.Contains(clause, "existing_col") {
		t.Fatalf("returning clause does not include existing column: %s", clause)
	}
	if len(fields) != 1 || fields[0].FieldID != "existing" {
		t.Fatalf("returning fields = %#v, want only existing", fields)
	}
}

func TestAttachCurrentLookupOptionsHydratesCatalogModalCurrentLabel(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	addRuntimeRootField(repo, map[string]any{
		"fieldId":       "catalog_pick",
		"kind":          "db_lookup",
		"label":         "Catalog Pick",
		"selectionMode": "single",
		"storageKey":    "catalog_pick",
		"lookupConfig": map[string]any{
			"displayMode":      "catalog_modal",
			"displayFields":    []any{"catalog", "hazard"},
			"searchFields":     []any{"catalog", "hazard"},
			"sourceModel":      "lookup-option",
			"storedValueField": "doc_id",
		},
	})
	modelPayload := cloneJSONToMap(repo.model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	scope, err := buildRuntimeRootScopePlan(repo.model, repo.view)
	if err != nil {
		t.Fatalf("buildRuntimeRootScopePlan returned error: %v", err)
	}

	lookupOptions := &recordingLookupOptionsProvider{
		items: []dictionary.Option{{
			Fields: map[string]string{
				"catalog": "TEST",
				"hazard":  "Catalog Label",
			},
			Label: "Catalog Label",
			Value: "lookup-guid",
		}},
	}
	svc := NewService(repo, lookupOptions)
	tenant, _ := requestctx.Tenant(testRuntimeContext())
	if err := svc.attachCurrentLookupOptions(testRuntimeContext(), tenant, scope, dataSchema, map[string]any{
		"catalog_pick": "lookup-guid",
	}, nil); err != nil {
		t.Fatalf("attachCurrentLookupOptions returned error: %v", err)
	}

	if lookupOptions.calls != 1 {
		t.Fatalf("lookup provider calls = %d, want 1", lookupOptions.calls)
	}
	field := findDataSchemaField(dataSchema, "catalog_pick")
	options := asSlice(field["options"])
	if len(options) != 1 {
		t.Fatalf("catalog_pick options = %d, want 1 fallback option", len(options))
	}
	option := asMap(options[0])
	if option["value"] != "lookup-guid" || option["label"] != "Catalog Label" {
		t.Fatalf("catalog_pick hydrated option = %#v, want Catalog Label", option)
	}
	fields := asMap(option["fields"])
	if fields["catalog"] != "TEST" || fields["hazard"] != "Catalog Label" {
		t.Fatalf("catalog_pick fields = %#v, want dictionary fields", fields)
	}
}

func TestAttachCurrentLookupOptionsKeepsStoredLabelAndHydratesFields(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	addRuntimeRootField(repo, map[string]any{
		"fieldId":       "stored_contact",
		"kind":          "db_lookup",
		"label":         "Reported By",
		"preset":        "contact_lookup",
		"selectionMode": "single",
		"storageKey":    "stored_contact",
	})
	modelPayload := cloneJSONToMap(repo.model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	scope, err := buildRuntimeRootScopePlan(repo.model, repo.view)
	if err != nil {
		t.Fatalf("buildRuntimeRootScopePlan returned error: %v", err)
	}

	lookupOptions := &recordingLookupOptionsProvider{
		items: []dictionary.Option{{
			Fields: map[string]string{
				"company_name": "Acme Safety",
			},
			Label: "Dictionary Label",
			Value: "7",
		}},
	}
	svc := NewService(repo, lookupOptions)
	tenant, _ := requestctx.Tenant(testRuntimeContext())
	if err := svc.attachCurrentLookupOptions(testRuntimeContext(), tenant, scope, dataSchema, map[string]any{
		"stored_contact": "7",
	}, map[string]map[string]string{
		"stored_contact": {"7": "Stored Label"},
	}); err != nil {
		t.Fatalf("attachCurrentLookupOptions returned error: %v", err)
	}

	if lookupOptions.calls != 1 {
		t.Fatalf("lookup provider calls = %d, want 1", lookupOptions.calls)
	}
	field := findDataSchemaField(dataSchema, "stored_contact")
	options := asSlice(field["options"])
	if len(options) != 1 {
		t.Fatalf("stored_contact options = %d, want 1", len(options))
	}
	option := asMap(options[0])
	if option["value"] != "7" || option["label"] != "Stored Label" {
		t.Fatalf("stored_contact option = %#v, want stored label", option)
	}
	fields := asMap(option["fields"])
	if fields["company_name"] != "Acme Safety" {
		t.Fatalf("stored_contact fields = %#v, want hydrated company_name", fields)
	}
}

func TestAttachCurrentLookupOptionsFallsBackOnInvalidDictionary(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	addRuntimeRootField(repo, map[string]any{
		"fieldId":       "catalog_pick",
		"kind":          "db_lookup",
		"label":         "Catalog Pick",
		"selectionMode": "single",
		"storageKey":    "catalog_pick",
		"lookupConfig": map[string]any{
			"displayMode":      "search_select",
			"displayFields":    []any{"catalog", "hazard"},
			"searchFields":     []any{"catalog", "hazard"},
			"sourceModel":      "lookup-option",
			"storedValueField": "doc_id",
		},
	})
	modelPayload := cloneJSONToMap(repo.model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	scope, err := buildRuntimeRootScopePlan(repo.model, repo.view)
	if err != nil {
		t.Fatalf("buildRuntimeRootScopePlan returned error: %v", err)
	}

	lookupOptions := &recordingLookupOptionsProvider{err: dictionary.ErrInvalidDictionary}
	svc := NewService(repo, lookupOptions)
	tenant, _ := requestctx.Tenant(testRuntimeContext())
	if err := svc.attachCurrentLookupOptions(testRuntimeContext(), tenant, scope, dataSchema, map[string]any{
		"catalog_pick": "lookup-guid",
	}, nil); err != nil {
		t.Fatalf("attachCurrentLookupOptions returned error: %v", err)
	}

	if lookupOptions.calls != 1 {
		t.Fatalf("lookup provider calls = %d, want 1", lookupOptions.calls)
	}
	field := findDataSchemaField(dataSchema, "catalog_pick")
	options := asSlice(field["options"])
	if len(options) != 1 {
		t.Fatalf("catalog_pick options = %d, want 1 fallback option", len(options))
	}
	option := asMap(options[0])
	if option["value"] != "lookup-guid" || option["label"] != "lookup-guid" {
		t.Fatalf("catalog_pick fallback option = %#v, want raw lookup-guid", option)
	}
}

func TestLookupOptionsRequestForPresetIncludesLookupFilters(t *testing.T) {
	req, ok := lookupOptionsRequestForField(runtimeFieldPlan{
		Preset: "contact_lookup",
		LookupFilters: []runtimeLookupFilterPlan{
			{Field: "job_type_id", Operator: "in", Value: []string{"2", "3"}},
		},
	}, []string{"7"})
	if !ok {
		t.Fatal("lookupOptionsRequestForField returned ok=false")
	}
	if req.Dictionary != "contacts" {
		t.Fatalf("dictionary = %q, want contacts", req.Dictionary)
	}
	if got := req.Filters; len(got) != 1 || got[0].Field != "job_type_id" || got[0].Operator != "in" {
		t.Fatalf("filters = %#v, want job_type_id in", got)
	}
	if got := req.IDs; len(got) != 1 || got[0] != "7" {
		t.Fatalf("ids = %#v, want [7]", got)
	}
}

func TestCreateRecordIsIdempotentForDuplicateClientToken(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	repo.createErr = ErrCreateTokenConflict
	svc := NewService(repo)
	token := "11111111-1111-1111-1111-111111111111"

	out, err := svc.CreateRecord(testRuntimeContext(), "sor", "default", RuntimeViewRecordMutationRequest{
		ClientCreateToken: token,
		Values: map[string]any{
			"location": "HQ",
		},
	})
	if err != nil {
		t.Fatalf("CreateRecord returned error: %v", err)
	}
	if out.Created {
		t.Fatal("response Created = true, want false for duplicate token")
	}
	if repo.lastCreateDocGuid != token {
		t.Fatalf("create docGuid = %q, want token", repo.lastCreateDocGuid)
	}
	if repo.lastLoadDocGuid != token {
		t.Fatalf("load docGuid = %q, want token", repo.lastLoadDocGuid)
	}
	if out.DocGuid != token {
		t.Fatalf("DocGuid = %q, want token", out.DocGuid)
	}
}

func TestCreateRecordRejectsDuplicateUniqueValue(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	enableRuntimeUniqueField(repo, rootSchemaScopeID, "location", nil)
	repo.rootUniqueConflicts = map[string]bool{
		recordingUniqueKey("location", "HQ"): true,
	}
	svc := NewService(repo)
	token := "11111111-1111-1111-1111-111111111111"

	out, err := svc.CreateRecord(testRuntimeContext(), "sor", "default", RuntimeViewRecordMutationRequest{
		ClientCreateToken: token,
		Values: map[string]any{
			"location": "HQ",
		},
	})
	if err != nil {
		t.Fatalf("CreateRecord returned error: %v", err)
	}
	if len(out.ValidationErrors) != 1 {
		t.Fatalf("validation errors = %d, want 1", len(out.ValidationErrors))
	}
	if out.ValidationErrors[0].FieldID != "location" {
		t.Fatalf("validation field = %q, want location", out.ValidationErrors[0].FieldID)
	}
	if repo.created {
		t.Fatal("CreateRootRecord should not be called for duplicate unique value")
	}
	if repo.lastRootUniqueCheck == nil || repo.lastRootUniqueCheck.ExcludeDocGuid != token {
		t.Fatalf("root unique exclude = %#v, want token", repo.lastRootUniqueCheck)
	}
}

func TestUpdateRecordRejectsDuplicateUniqueValue(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	enableRuntimeUniqueField(repo, rootSchemaScopeID, "location", nil)
	repo.rootUniqueConflicts = map[string]bool{
		recordingUniqueKey("location", "HQ"): true,
	}
	svc := NewService(repo)

	out, err := svc.UpdateRecord(testRuntimeContext(), "sor", "default", "current-guid", RuntimeViewRecordMutationRequest{
		Values: map[string]any{
			"location": "HQ",
		},
	})
	if err != nil {
		t.Fatalf("UpdateRecord returned error: %v", err)
	}
	if len(out.ValidationErrors) != 1 {
		t.Fatalf("validation errors = %d, want 1", len(out.ValidationErrors))
	}
	if out.ValidationErrors[0].FieldID != "location" {
		t.Fatalf("validation field = %q, want location", out.ValidationErrors[0].FieldID)
	}
	if repo.lastUpdateValues != nil {
		t.Fatal("UpdateRootRecord should not be called for duplicate unique value")
	}
	if repo.lastRootUniqueCheck == nil || repo.lastRootUniqueCheck.ExcludeDocGuid != "current-guid" {
		t.Fatalf("root unique exclude = %#v, want current-guid", repo.lastRootUniqueCheck)
	}
}

func TestLoadSubformReturnsRootShapedSchemaWithoutSystemFields(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	svc := NewService(repo)

	out, err := svc.LoadSubform(testRuntimeContext(), "sor", "default", "parent-guid", "contacts", "child-guid")
	if err != nil {
		t.Fatalf("LoadSubform returned error: %v", err)
	}
	if out.DocGuid != "child-guid" {
		t.Fatalf("DocGuid = %q, want child-guid", out.DocGuid)
	}
	if out.RecordID != "303" {
		t.Fatalf("RecordID = %q, want 303", out.RecordID)
	}
	if out.Title != "Contacts" {
		t.Fatalf("Title = %q, want Contacts", out.Title)
	}
	rootDataScope := out.DataSchema["rootScope"].(map[string]any)
	if got := rootDataScope["schemaScopeId"]; got != rootSchemaScopeID {
		t.Fatalf("root data schemaScopeId = %#v, want root", got)
	}
	rootUIScope := out.UISchema["rootScope"].(map[string]any)
	if _, ok := rootUIScope["systemFields"]; ok {
		t.Fatal("subform ui schema should not include systemFields")
	}
	assertValue(t, out.Values, "email", "person@example.com")
	if repo.lastSubformLoad == nil {
		t.Fatal("LoadSubformRecord was not called")
	}
	if repo.lastSubformLoad.ParentDocGuid != "parent-guid" || repo.lastSubformLoad.ScopeID != "contacts" {
		t.Fatalf("subform load = %#v, want parent-guid/contacts", repo.lastSubformLoad)
	}
}

func TestCreateSubformRecordWaitsForRequiredFields(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	svc := NewService(repo)

	out, err := svc.CreateSubformRecord(testRuntimeContext(), "sor", "default", "parent-guid", "contacts", RuntimeViewRecordMutationRequest{
		Values: map[string]any{},
	})
	if err != nil {
		t.Fatalf("CreateSubformRecord returned error: %v", err)
	}
	if len(out.ValidationErrors) != 1 {
		t.Fatalf("validation errors = %d, want 1", len(out.ValidationErrors))
	}
	if out.ValidationErrors[0].FieldID != "email" {
		t.Fatalf("validation field = %q, want email", out.ValidationErrors[0].FieldID)
	}
	if repo.lastSubformCreate != nil {
		t.Fatal("CreateSubformRecord should wait until required fields are complete")
	}
}

func TestCreateSubformRecordUsesParentAndScope(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	svc := NewService(repo)

	out, err := svc.CreateSubformRecord(testRuntimeContext(), "sor", "default", "parent-guid", "contacts", RuntimeViewRecordMutationRequest{
		ClientCreateToken: "11111111-1111-4111-8111-111111111111",
		Values: map[string]any{
			"email": "person@example.com",
			"phone": "(555) 555-5555",
		},
	})
	if err != nil {
		t.Fatalf("CreateSubformRecord returned error: %v", err)
	}
	if !out.Created {
		t.Fatal("response Created = false, want true")
	}
	if out.DocGuid != "11111111-1111-4111-8111-111111111111" {
		t.Fatalf("DocGuid = %q, want client create token", out.DocGuid)
	}
	if repo.lastSubformCreate == nil {
		t.Fatal("CreateSubformRecord was not called")
	}
	if repo.lastSubformCreate.ParentDocGuid != "parent-guid" || repo.lastSubformCreate.ScopeID != "contacts" {
		t.Fatalf("subform create = %#v, want parent-guid/contacts", repo.lastSubformCreate)
	}
	assertValue(t, repo.lastSubformCreate.Values, "email", "person@example.com")
}

func TestCreateSubformRecordRejectsDuplicateUniqueValue(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	enableRuntimeUniqueField(repo, "contacts", "email", map[string]any{"validation": "email"})
	repo.subformUniqueConflicts = map[string]bool{
		recordingUniqueKey("contacts", "parent-guid", "email", "person@example.com"): true,
	}
	svc := NewService(repo)

	out, err := svc.CreateSubformRecord(testRuntimeContext(), "sor", "default", "parent-guid", "contacts", RuntimeViewRecordMutationRequest{
		Values: map[string]any{
			"email": "person@example.com",
		},
	})
	if err != nil {
		t.Fatalf("CreateSubformRecord returned error: %v", err)
	}
	if len(out.ValidationErrors) != 1 {
		t.Fatalf("validation errors = %d, want 1", len(out.ValidationErrors))
	}
	if out.ValidationErrors[0].FieldID != "email" {
		t.Fatalf("validation field = %q, want email", out.ValidationErrors[0].FieldID)
	}
	if repo.lastSubformCreate != nil {
		t.Fatal("CreateSubformRecord should not be called for duplicate unique value")
	}
}

func TestUpdateSubformRecordRejectsDuplicateUniqueValue(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	enableRuntimeUniqueField(repo, "contacts", "email", map[string]any{"validation": "email"})
	repo.subformUniqueConflicts = map[string]bool{
		recordingUniqueKey("contacts", "parent-guid", "email", "person@example.com"): true,
	}
	svc := NewService(repo)

	out, err := svc.UpdateSubformRecord(testRuntimeContext(), "sor", "default", "parent-guid", "contacts", "child-guid", RuntimeViewRecordMutationRequest{
		Values: map[string]any{
			"email": "person@example.com",
		},
	})
	if err != nil {
		t.Fatalf("UpdateSubformRecord returned error: %v", err)
	}
	if len(out.ValidationErrors) != 1 {
		t.Fatalf("validation errors = %d, want 1", len(out.ValidationErrors))
	}
	if out.ValidationErrors[0].FieldID != "email" {
		t.Fatalf("validation field = %q, want email", out.ValidationErrors[0].FieldID)
	}
	if repo.lastSubformUpdate != nil {
		t.Fatal("UpdateSubformRecord should not be called for duplicate unique value")
	}
	if repo.lastSubformUniqueCheck == nil || repo.lastSubformUniqueCheck.ExcludeDocGuid != "child-guid" {
		t.Fatalf("subform unique exclude = %#v, want child-guid", repo.lastSubformUniqueCheck)
	}
}

func TestFinishRecordUsesFinalStatusWhenConfigured(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	svc := NewService(repo)

	out, err := svc.FinishRecord(testRuntimeContext(), "sor", "default", "created-guid", RuntimeViewRecordFinishRequest{})
	if err != nil {
		t.Fatalf("FinishRecord returned error: %v", err)
	}
	assertValue(t, repo.lastUpdateValues, "status", "finish")
	if out.Status != "finish" {
		t.Fatalf("response status = %q, want finish", out.Status)
	}
}

func TestRunBulkActionSetsVisibleActiveField(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	enableRuntimeActiveField(repo, true, true)
	svc := NewService(repo)

	out, err := svc.RunBulkAction(testRuntimeContext(), "sor", "default", "inactive", RuntimeViewBulkActionRequest{
		RowIDs: []string{"doc-a", "doc-b", "doc-a", ""},
	})
	if err != nil {
		t.Fatalf("RunBulkAction returned error: %v", err)
	}
	if out == nil || !out.OK {
		t.Fatalf("bulk response = %#v, want ok", out)
	}
	if repo.lastActiveBulk == nil {
		t.Fatal("SetRootRecordsActive was not called")
	}
	if repo.lastActiveBulk.Active {
		t.Fatal("active bulk flag = true, want false")
	}
	if repo.lastActiveBulk.ActiveColumn != "active" {
		t.Fatalf("active column = %q, want active", repo.lastActiveBulk.ActiveColumn)
	}
	if got := repo.lastActiveBulk.DocGuids; len(got) != 2 || got[0] != "doc-a" || got[1] != "doc-b" {
		t.Fatalf("doc guids = %#v, want doc-a/doc-b", got)
	}
}

func TestRunBulkActionRejectsActiveWhenFieldNotVisible(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	enableRuntimeActiveField(repo, false, true)
	svc := NewService(repo)

	_, err := svc.RunBulkAction(testRuntimeContext(), "sor", "default", "active", RuntimeViewBulkActionRequest{
		RowIDs: []string{"doc-a"},
	})
	if err != ErrRuntimeUnsupported {
		t.Fatalf("RunBulkAction error = %v, want ErrRuntimeUnsupported", err)
	}
	if repo.lastActiveBulk != nil {
		t.Fatal("SetRootRecordsActive should not be called")
	}
}

func TestRunBulkActionDeletesWhenViewAllowsDelete(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	enableRuntimeActiveField(repo, false, true)
	svc := NewService(repo)

	out, err := svc.RunBulkAction(testRuntimeContext(), "sor", "default", "delete", RuntimeViewBulkActionRequest{
		RowIDs: []string{"doc-a", "doc-b"},
	})
	if err != nil {
		t.Fatalf("RunBulkAction returned error: %v", err)
	}
	if out == nil || !out.OK {
		t.Fatalf("bulk response = %#v, want ok", out)
	}
	if got := repo.lastDeleteBulk; len(got) != 2 || got[0] != "doc-a" || got[1] != "doc-b" {
		t.Fatalf("delete doc guids = %#v, want doc-a/doc-b", got)
	}
}

func TestRunBulkActionRejectsDeleteWhenViewDisallowsDelete(t *testing.T) {
	repo := newRecordingRuntimeRepo()
	enableRuntimeActiveField(repo, true, false)
	svc := NewService(repo)

	_, err := svc.RunBulkAction(testRuntimeContext(), "sor", "default", "delete", RuntimeViewBulkActionRequest{
		RowIDs: []string{"doc-a"},
	})
	if err != ErrRuntimeUnsupported {
		t.Fatalf("RunBulkAction error = %v, want ErrRuntimeUnsupported", err)
	}
	if repo.lastDeleteBulk != nil {
		t.Fatal("DeleteRootRecords should not be called")
	}
}

func assertValue(t *testing.T, values map[string]any, key string, want any) {
	t.Helper()
	if got := values[key]; got != want {
		t.Fatalf("%s = %#v, want %#v", key, got, want)
	}
}

func enableRuntimeActiveField(repo *recordingRuntimeRepo, visible bool, canDelete bool) {
	modelPayload := cloneJSONToMap(repo.model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"fieldId":    "active",
		"kind":       "boolean",
		"label":      "Active",
		"storageKey": "active",
	})
	dataSchema["rootScope"] = rootScope
	modelPayload["dataSchema"] = dataSchema
	repo.model.DefinitionJSON = mustJSON(modelPayload)

	viewPayload := cloneJSONToMap(repo.view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["viewSettings"] = map[string]any{
		"actions": map[string]any{
			"canAdd":    true,
			"canDelete": canDelete,
			"canEdit":   true,
			"canView":   true,
		},
		"list": map[string]any{
			"columns": []any{
				map[string]any{
					"fieldId": "active",
					"id":      "grid-column-active",
					"order":   0,
					"visible": visible,
				},
			},
		},
	}
	uiSchema["rootScope"] = rootUIScope
	viewPayload["uiSchema"] = uiSchema
	repo.view.DefinitionJSON = mustJSON(viewPayload)
}

func addRuntimeRootField(repo *recordingRuntimeRepo, field map[string]any) {
	modelPayload := cloneJSONToMap(repo.model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), field)
	dataSchema["rootScope"] = rootScope
	modelPayload["dataSchema"] = dataSchema
	repo.model.DefinitionJSON = mustJSON(modelPayload)
}

func enableRuntimeUniqueField(repo *recordingRuntimeRepo, scopeID string, fieldID string, attributes map[string]any) {
	modelPayload := cloneJSONToMap(repo.model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	changed := false
	applyField := func(rawField any) {
		field := asMap(rawField)
		if field["fieldId"] != fieldID {
			return
		}
		field["uniqueValue"] = true
		for key, value := range attributes {
			field[key] = value
		}
		changed = true
	}

	if scopeID == rootSchemaScopeID {
		rootScope := asMap(dataSchema["rootScope"])
		for _, rawField := range asSlice(rootScope["fields"]) {
			applyField(rawField)
		}
	} else {
		for _, rawScope := range asSlice(dataSchema["subformScopes"]) {
			scope := asMap(rawScope)
			if scope["schemaScopeId"] != scopeID {
				continue
			}
			for _, rawField := range asSlice(scope["fields"]) {
				applyField(rawField)
			}
		}
	}
	if !changed {
		panic("test runtime field not found")
	}
	repo.model.DefinitionJSON = mustJSON(modelPayload)
}

func recordingUniqueKey(parts ...string) string {
	key := ""
	for _, part := range parts {
		key += "\x00" + part
	}
	return key
}

type recordingRuntimeRepo struct {
	created                bool
	createErr              error
	lastActiveBulk         *recordingActiveBulk
	lastCreateDocGuid      string
	lastCreateValues       map[string]any
	lastDeleteBulk         []string
	lastLoadDocGuid        string
	lastRootUniqueCheck    *recordingUniqueCheck
	lastSubformCreate      *recordingSubformMutation
	lastSubformDelete      *recordingSubformDelete
	lastSubformLoad        *recordingSubformLoad
	lastSubformUniqueCheck *recordingUniqueCheck
	lastSubformUpdate      *recordingSubformMutation
	lastUpdateValues       map[string]any
	checklistRows          []runtimeChecklistSavedRow
	lastChecklistUpsert    *recordingChecklistUpsert
	model                  *ModelRecord
	rootUniqueConflicts    map[string]bool
	subformUniqueConflicts map[string]bool
	view                   *ViewRecord
}

type recordingSubformMutation struct {
	DocGuid       string
	ParentDocGuid string
	ScopeID       string
	Values        map[string]any
}

type recordingSubformDelete struct {
	DocGuid       string
	ParentDocGuid string
	ScopeID       string
}

type recordingSubformLoad struct {
	DocGuid       string
	ParentDocGuid string
	ScopeID       string
}

type recordingChecklistUpsert struct {
	ParentDocGuid string
	ScopeID       string
	SourceValue   string
	Values        map[string]any
}

type recordingActiveBulk struct {
	Active       bool
	ActiveColumn string
	DocGuids     []string
}

type recordingUniqueCheck struct {
	ExcludeDocGuid string
	FieldID        string
	ParentDocGuid  string
	ScopeID        string
	Value          string
}

type recordingLookupOptionsProvider struct {
	calls    int
	err      error
	items    []dictionary.Option
	list     func(dictionary.OptionsRequest) (*dictionary.OptionsResponse, error)
	requests []dictionary.OptionsRequest
}

func (p *recordingLookupOptionsProvider) ListOptions(_ context.Context, req dictionary.OptionsRequest) (*dictionary.OptionsResponse, error) {
	p.calls++
	p.requests = append(p.requests, req)
	if p.list != nil {
		return p.list(req)
	}
	if p.err != nil {
		return nil, p.err
	}
	return &dictionary.OptionsResponse{Items: p.items}, nil
}

func newRecordingRuntimeRepo() *recordingRuntimeRepo {
	return &recordingRuntimeRepo{
		model: &ModelRecord{
			ModelID:        "sor",
			ModelKey:       "sor",
			StorageKey:     "sor",
			DisplayName:    "SOR",
			SourceType:     "managed",
			DefinitionJSON: mustJSON(testModelPayload()),
		},
		view: &ViewRecord{
			ModelID:        "sor",
			ViewID:         "default",
			ViewKey:        "default",
			DisplayName:    "Default",
			DefinitionJSON: mustJSON(testViewPayload()),
		},
	}
}

func (r *recordingRuntimeRepo) GetModel(_ context.Context, _ requestctx.TenantInfo, modelID string) (*ModelRecord, error) {
	if modelID != r.model.ModelID {
		return nil, nil
	}
	return r.model, nil
}

func (r *recordingRuntimeRepo) GetView(_ context.Context, _ requestctx.TenantInfo, modelID string, viewID string) (*ViewRecord, error) {
	if modelID != r.view.ModelID || viewID != r.view.ViewID {
		return nil, nil
	}
	return r.view, nil
}

func (r *recordingRuntimeRepo) CreateRootRecord(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, values map[string]any, docGuid string) (*runtimeRecordMutationRow, error) {
	r.created = true
	r.lastCreateDocGuid = docGuid
	r.lastCreateValues = cloneValues(values)
	if r.createErr != nil {
		return nil, r.createErr
	}
	if docGuid == "" {
		docGuid = "created-guid"
	}
	return &runtimeRecordMutationRow{
		DocGuid:  docGuid,
		Revision: "rev-1",
		SourceID: 101,
		Values:   cloneValues(values),
	}, nil
}

func (r *recordingRuntimeRepo) CreateSubformRecord(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, values map[string]any, docGuid string) (*runtimeRecordMutationRow, error) {
	r.lastSubformCreate = &recordingSubformMutation{
		DocGuid:       docGuid,
		ParentDocGuid: parentDocGuid,
		ScopeID:       subformScope.ScopeID,
		Values:        cloneValues(values),
	}
	if docGuid == "" {
		docGuid = "subform-created-guid"
	}
	return &runtimeRecordMutationRow{
		DocGuid:  docGuid,
		Revision: "subform-rev-1",
		SourceID: 303,
		Values:   cloneValues(values),
	}, nil
}

func (r *recordingRuntimeRepo) RootUniqueValueExists(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, field runtimeFieldPlan, value string, excludeDocGuid string) (bool, error) {
	r.lastRootUniqueCheck = &recordingUniqueCheck{
		ExcludeDocGuid: excludeDocGuid,
		FieldID:        field.FieldID,
		Value:          value,
	}
	return r.rootUniqueConflicts[recordingUniqueKey(field.FieldID, value)], nil
}

func (r *recordingRuntimeRepo) SubformUniqueValueExists(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, field runtimeFieldPlan, value string, excludeDocGuid string) (bool, error) {
	r.lastSubformUniqueCheck = &recordingUniqueCheck{
		ExcludeDocGuid: excludeDocGuid,
		FieldID:        field.FieldID,
		ParentDocGuid:  parentDocGuid,
		ScopeID:        subformScope.ScopeID,
		Value:          value,
	}
	return r.subformUniqueConflicts[recordingUniqueKey(subformScope.ScopeID, parentDocGuid, field.FieldID, value)], nil
}

func (r *recordingRuntimeRepo) UpdateRootRecord(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, docGuid string, values map[string]any, _ string) (*runtimeRecordMutationRow, error) {
	r.lastUpdateValues = cloneValues(values)
	rowValues := map[string]any{
		"location":      "HQ",
		"reported_by":   "77",
		"reported_date": "2026-05-02",
		"status":        values["status"],
	}
	return &runtimeRecordMutationRow{
		DocGuid:  docGuid,
		Revision: "rev-2",
		SourceID: 202,
		Values:   rowValues,
	}, nil
}

func (r *recordingRuntimeRepo) UpdateSubformRecord(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, docGuid string, values map[string]any, _ string) (*runtimeRecordMutationRow, error) {
	r.lastSubformUpdate = &recordingSubformMutation{
		DocGuid:       docGuid,
		ParentDocGuid: parentDocGuid,
		ScopeID:       subformScope.ScopeID,
		Values:        cloneValues(values),
	}
	return &runtimeRecordMutationRow{
		DocGuid:  docGuid,
		Revision: "subform-rev-2",
		SourceID: 303,
		Values:   cloneValues(values),
	}, nil
}

func (r *recordingRuntimeRepo) SetRootRecordsActive(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, docGuids []string, activeColumn string, active bool) error {
	r.lastActiveBulk = &recordingActiveBulk{
		Active:       active,
		ActiveColumn: activeColumn,
		DocGuids:     append([]string(nil), docGuids...),
	}
	return nil
}

func (r *recordingRuntimeRepo) DeleteRootRecords(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, docGuids []string) error {
	r.lastDeleteBulk = append([]string(nil), docGuids...)
	return nil
}

func (r *recordingRuntimeRepo) DeleteSubformRecord(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, docGuid string) error {
	r.lastSubformDelete = &recordingSubformDelete{
		DocGuid:       docGuid,
		ParentDocGuid: parentDocGuid,
		ScopeID:       subformScope.ScopeID,
	}
	return nil
}

func (r *recordingRuntimeRepo) LoadChecklistRows(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, _ runtimeSubformScopePlan, _ string) ([]runtimeChecklistSavedRow, error) {
	return append([]runtimeChecklistSavedRow(nil), r.checklistRows...), nil
}

func (r *recordingRuntimeRepo) UpsertChecklistItem(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, sourceValue string, values map[string]any) (*runtimeChecklistSavedRow, error) {
	r.lastChecklistUpsert = &recordingChecklistUpsert{
		ParentDocGuid: parentDocGuid,
		ScopeID:       subformScope.ScopeID,
		SourceValue:   sourceValue,
		Values:        cloneValues(values),
	}
	return &runtimeChecklistSavedRow{
		DocGuid:     "checklist-row-guid",
		Notes:       normalizeString(values[subformScope.ChecklistConfig.NotesFieldID]),
		SourceID:    404,
		SourceValue: sourceValue,
		Value:       normalizeString(values[subformScope.ChecklistConfig.ResultFieldID]),
		Values:      cloneValues(values),
	}, nil
}

func (r *recordingRuntimeRepo) LoadRootRecord(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, docGuid string) (*runtimeRecordMutationRow, error) {
	r.lastLoadDocGuid = docGuid
	return &runtimeRecordMutationRow{
		DocGuid:  docGuid,
		Revision: "rev-1",
		SourceID: 202,
		Values: map[string]any{
			"location":    "HQ",
			"reported_by": "77",
			"status":      "new",
		},
	}, nil
}

func (r *recordingRuntimeRepo) LoadSubformRecord(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, docGuid string) (*runtimeRecordMutationRow, error) {
	r.lastSubformLoad = &recordingSubformLoad{
		DocGuid:       docGuid,
		ParentDocGuid: parentDocGuid,
		ScopeID:       subformScope.ScopeID,
	}
	return &runtimeRecordMutationRow{
		DocGuid:  docGuid,
		Revision: "subform-rev-1",
		SourceID: 303,
		Values: map[string]any{
			"email": "person@example.com",
			"phone": "(555) 555-5555",
		},
	}, nil
}

func (r *recordingRuntimeRepo) ResolveContactLookupLabels(_ context.Context, _ requestctx.TenantInfo, ids []int64) (map[int64]string, error) {
	out := map[int64]string{}
	for _, id := range ids {
		if id == 77 {
			out[id] = "Andrew Owner"
		}
	}
	return out, nil
}

func (r *recordingRuntimeRepo) ResolveCurrentUserBusinessID(_ context.Context, _ requestctx.TenantInfo, userGUID string) (int64, error) {
	if userGUID == "user-guid" {
		return 77, nil
	}
	return 0, nil
}

func testRuntimeContext() context.Context {
	ctx := context.Background()
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{ID: "108", DBName: "108-demo"})
	ctx = requestctx.WithClaims(ctx, requestctx.ClaimsInfo{
		UserID:    "user-guid",
		Email:     "andrew@example.com",
		FirstName: "Andrew",
		LastName:  "Owner",
	})
	return ctx
}

func testModelPayload() map[string]any {
	return map[string]any{
		"id":         "sor",
		"key":        "sor",
		"sourceType": "managed",
		"storageKey": "sor",
		"dataSchema": map[string]any{
			"rootScope": map[string]any{
				"schemaScopeId": "root",
				"runtime": map[string]any{
					"rtAlias":      "sor",
					"tableName":    "ps_sor",
					"dataViewName": "vw_sor",
				},
				"fields": []any{
					map[string]any{
						"fieldId":    "location",
						"kind":       "short_text",
						"label":      "Location",
						"required":   true,
						"storageKey": "location",
					},
					map[string]any{
						"fieldId":    "reported_by",
						"kind":       "db_lookup",
						"label":      "Reported By",
						"preset":     "contact_lookup",
						"storageKey": "reported_by",
					},
					map[string]any{
						"fieldId":    "reported_date",
						"kind":       "date",
						"label":      "Reported Date",
						"storageKey": "reported_date",
					},
					map[string]any{
						"fieldId":    "status",
						"kind":       "single_select",
						"label":      "Status",
						"storageKey": "status",
						"options": []any{
							map[string]any{"label": "New", "value": "new"},
							map[string]any{"label": "Finish", "value": "finish"},
						},
					},
					map[string]any{
						"fieldId":    "categories",
						"kind":       "multi_select",
						"label":      "Categories",
						"storageKey": "categories",
						"options": []any{
							map[string]any{"label": "Aerial lifts", "value": "aerial_lifts"},
							map[string]any{"label": "PPE", "value": "ppe"},
						},
					},
				},
			},
			"subformScopes": []any{
				map[string]any{
					"displayName":   "Contacts",
					"schemaScopeId": "contacts",
					"subformType":   "DEFAULT",
					"tableKey":      "contacts",
					"runtime": map[string]any{
						"rtAlias":      "contacts",
						"tableName":    "ps_sor__contacts",
						"dataViewName": "vw_sor__contacts",
					},
					"fields": []any{
						map[string]any{
							"fieldId":    "email",
							"kind":       "short_text",
							"label":      "Email",
							"required":   true,
							"storageKey": "email",
						},
						map[string]any{
							"fieldId":    "phone",
							"kind":       "short_text",
							"label":      "Phone",
							"storageKey": "phone",
						},
					},
				},
			},
		},
	}
}

func testViewPayload() map[string]any {
	return map[string]any{
		"id":      "default",
		"modelId": "sor",
		"uiSchema": map[string]any{
			"rootScope": map[string]any{
				"schemaScopeId": "root",
				"nodes": []any{
					map[string]any{
						"id":      "field-location",
						"fieldId": "location",
						"order":   0,
						"type":    "field",
					},
					map[string]any{
						"id":            "subform-contacts",
						"schemaScopeId": "contacts",
						"subformType":   "DEFAULT",
						"tableKey":      "contacts",
						"title":         "Contacts",
						"type":          "subform",
					},
				},
				"systemFields": map[string]any{
					"reportedBy":   map[string]any{"fieldId": "reported_by"},
					"reportedDate": map[string]any{"fieldId": "reported_date"},
					"workflowStatus": map[string]any{
						"fieldId":      "status",
						"initialValue": "new",
						"finalValue":   "finish",
					},
				},
			},
			"subformScopes": []any{
				map[string]any{
					"schemaScopeId": "contacts",
					"nodes": []any{
						map[string]any{
							"id":      "field-email",
							"fieldId": "email",
							"order":   0,
							"type":    "field",
						},
						map[string]any{
							"id":      "field-phone",
							"fieldId": "phone",
							"order":   1,
							"type":    "field",
						},
					},
					"viewSettings": map[string]any{
						"actions": map[string]any{
							"canAdd":    true,
							"canDelete": true,
							"canEdit":   true,
						},
						"list": map[string]any{
							"columns": []any{
								map[string]any{
									"fieldId": "email",
									"id":      "grid-email",
									"order":   0,
								},
							},
							"sorting": map[string]any{
								"fieldId":   "email",
								"direction": "asc",
							},
						},
					},
				},
			},
		},
	}
}

func mustJSON(value map[string]any) json.RawMessage {
	raw, err := json.Marshal(value)
	if err != nil {
		panic(err)
	}
	return raw
}

func cloneValues(values map[string]any) map[string]any {
	out := make(map[string]any, len(values))
	for key, value := range values {
		out[key] = value
	}
	return out
}

func stringSlicesEqual(left []string, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}

func findDataSchemaField(dataSchema map[string]any, fieldID string) map[string]any {
	rootScope := dataSchema["rootScope"].(map[string]any)
	fields := rootScope["fields"].([]any)
	for _, rawField := range fields {
		field := rawField.(map[string]any)
		if field["fieldId"] == fieldID {
			return field
		}
	}
	return nil
}
