package platformstudioformruntime

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
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

type recordingRuntimeRepo struct {
	created           bool
	createErr         error
	lastActiveBulk    *recordingActiveBulk
	lastCreateDocGuid string
	lastCreateValues  map[string]any
	lastDeleteBulk    []string
	lastLoadDocGuid   string
	lastUpdateValues  map[string]any
	model             *ModelRecord
	view              *ViewRecord
}

type recordingActiveBulk struct {
	Active       bool
	ActiveColumn string
	DocGuids     []string
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
		Values:   cloneValues(values),
	}, nil
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
		Values:   rowValues,
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

func (r *recordingRuntimeRepo) LoadRootRecord(_ context.Context, _ requestctx.TenantInfo, _ runtimeRootScopePlan, docGuid string) (*runtimeRecordMutationRow, error) {
	r.lastLoadDocGuid = docGuid
	return &runtimeRecordMutationRow{
		DocGuid:  docGuid,
		Revision: "rev-1",
		Values: map[string]any{
			"location":    "HQ",
			"reported_by": "77",
			"status":      "new",
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
