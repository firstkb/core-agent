package platformstudioformruntime

import "encoding/json"

type RuntimeViewRecordMutationRequest struct {
	ClientCreateToken string         `json:"clientCreateToken,omitempty"`
	ExpectedRevision  string         `json:"expectedRevision,omitempty"`
	Values            map[string]any `json:"values"`
}

type RuntimeViewRecordFinishRequest struct {
	ExpectedRevision string `json:"expectedRevision,omitempty"`
}

type RuntimeViewRecordValidationError struct {
	FieldID string `json:"fieldId,omitempty"`
	Message string `json:"message"`
}

type RuntimeViewRecordMutationResponse struct {
	Created          bool                               `json:"created,omitempty"`
	DocGuid          string                             `json:"docGuid,omitempty"`
	Revision         string                             `json:"revision,omitempty"`
	Status           string                             `json:"status,omitempty"`
	ValidationErrors []RuntimeViewRecordValidationError `json:"validationErrors,omitempty"`
	Values           map[string]any                     `json:"values"`
}

type RuntimeViewFormResponse struct {
	DataSchema  map[string]any `json:"dataSchema"`
	Description string         `json:"description,omitempty"`
	DocGuid     string         `json:"docGuid,omitempty"`
	ModelID     string         `json:"modelId"`
	Revision    string         `json:"revision,omitempty"`
	SourceType  string         `json:"sourceType,omitempty"`
	SurfaceID   string         `json:"surfaceId"`
	Title       string         `json:"title"`
	UISchema    map[string]any `json:"uiSchema"`
	Values      map[string]any `json:"values"`
	ViewID      string         `json:"viewId"`
}

type ModelRecord struct {
	ModelID        string
	ModelKey       string
	StorageKey     string
	DisplayName    string
	SourceType     string
	DefinitionJSON json.RawMessage
}

type ViewRecord struct {
	ModelID        string
	ViewID         string
	ViewKey        string
	DisplayName    string
	DefinitionJSON json.RawMessage
}

type runtimeRecordMutationRow struct {
	DocGuid  string
	Revision string
	Values   map[string]any
}

type runtimeRootScopePlan struct {
	ModelID             string
	ViewID              string
	SourceType          string
	TableName           string
	DataViewName        string
	SourceIDColumn      string
	SourceTenantColumn  string
	SourceGUIDColumn    string
	SourceUpdatedColumn string
	TenantScoped        bool
	Fields              []runtimeFieldPlan
	SystemFields        runtimeSystemFieldBindings
}

type runtimeFieldPlan struct {
	FieldID     string
	Label       string
	Kind        string
	Preset      string
	ColumnName  string
	Required    bool
	Supported   bool
	OptionValue []string
}

type runtimeSystemFieldBindings struct {
	ReportedBy     string
	ReportedDate   string
	WorkflowStatus runtimeWorkflowStatusBinding
}

type runtimeWorkflowStatusBinding struct {
	FieldID      string
	InitialValue string
	FinalValue   string
}
