package platformstudioformruntime

import (
	"encoding/json"

	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

type RuntimeViewRecordMutationRequest struct {
	ClientCreateToken string                       `json:"clientCreateToken,omitempty"`
	ExpectedRevision  string                       `json:"expectedRevision,omitempty"`
	LookupLabels      map[string]map[string]string `json:"lookupLabels,omitempty"`
	Values            map[string]any               `json:"values"`
}

type RuntimeViewChecklistItemMutationRequest struct {
	Notes  string         `json:"notes,omitempty"`
	Value  string         `json:"value,omitempty"`
	Values map[string]any `json:"values,omitempty"`
}

type RuntimeViewRecordFinishRequest struct {
	ExpectedRevision string `json:"expectedRevision,omitempty"`
}

type RuntimeViewBulkActionRequest = collectiontable.BulkActionInput
type RuntimeViewBulkActionResponse = collectiontable.MutationResult
type RuntimeViewDeleteResponse = collectiontable.MutationResult

type RuntimeViewRecordValidationError struct {
	FieldID string `json:"fieldId,omitempty"`
	Message string `json:"message"`
}

type RuntimeViewRecordMutationResponse struct {
	Created          bool                               `json:"created,omitempty"`
	DocGuid          string                             `json:"docGuid,omitempty"`
	RecordID         string                             `json:"recordId,omitempty"`
	Revision         string                             `json:"revision,omitempty"`
	Status           string                             `json:"status,omitempty"`
	ValidationErrors []RuntimeViewRecordValidationError `json:"validationErrors,omitempty"`
	Values           map[string]any                     `json:"values"`
}

type RuntimeViewChecklistOption struct {
	Label        string `json:"label"`
	StyleVariant string `json:"styleVariant,omitempty"`
	Value        string `json:"value"`
}

type RuntimeViewChecklistItem struct {
	Active          bool                         `json:"active"`
	AnswerOptions   []RuntimeViewChecklistOption `json:"answerOptions,omitempty"`
	Description     string                       `json:"description,omitempty"`
	GroupID         string                       `json:"groupId,omitempty"`
	GroupTitle      string                       `json:"groupTitle,omitempty"`
	InactiveSaved   bool                         `json:"inactiveSaved,omitempty"`
	Label           string                       `json:"label"`
	Notes           string                       `json:"notes,omitempty"`
	Required        bool                         `json:"required,omitempty"`
	SavedRowDocGuid string                       `json:"savedRowDocGuid,omitempty"`
	SourceValue     string                       `json:"sourceValue"`
	Value           string                       `json:"value,omitempty"`
	Values          map[string]any               `json:"values,omitempty"`
	VisibleWhen     string                       `json:"visibleWhen,omitempty"`
}

type RuntimeViewChecklistGroup struct {
	ID    string                     `json:"id"`
	Items []RuntimeViewChecklistItem `json:"items"`
	Title string                     `json:"title,omitempty"`
}

type RuntimeViewSubformResponse struct {
	Checklist *RuntimeViewChecklistData `json:"checklist,omitempty"`
	Kind      string                    `json:"kind"`
}

type RuntimeViewChecklistData struct {
	Groups []RuntimeViewChecklistGroup `json:"groups"`
}

type RuntimeViewChecklistItemMutationResponse struct {
	Item      RuntimeViewChecklistItem `json:"item"`
	SubformID string                   `json:"subformId"`
}

type RuntimeViewFormResponse struct {
	DataSchema  map[string]any                        `json:"dataSchema"`
	Description string                                `json:"description,omitempty"`
	DocGuid     string                                `json:"docGuid,omitempty"`
	ModelID     string                                `json:"modelId"`
	RecordID    string                                `json:"recordId,omitempty"`
	Revision    string                                `json:"revision,omitempty"`
	SourceType  string                                `json:"sourceType,omitempty"`
	Subforms    map[string]RuntimeViewSubformResponse `json:"subforms,omitempty"`
	SurfaceID   string                                `json:"surfaceId"`
	Title       string                                `json:"title"`
	UISchema    map[string]any                        `json:"uiSchema"`
	Values      map[string]any                        `json:"values"`
	ViewID      string                                `json:"viewId"`
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
	DocGuid      string
	LookupLabels map[string]map[string]string
	Revision     string
	SourceID     int64
	Values       map[string]any
}

type runtimeRootScopePlan struct {
	ModelID                   string
	ViewID                    string
	SourceType                string
	TableName                 string
	DataViewName              string
	MultiValueOwnerForeignKey string
	MultiValueTableName       string
	SourceIDColumn            string
	SourceTenantColumn        string
	SourceGUIDColumn          string
	SourceUpdatedColumn       string
	TenantScoped              bool
	Fields                    []runtimeFieldPlan
	SubformScopes             []runtimeSubformScopePlan
	SystemFields              runtimeSystemFieldBindings
}

type runtimeSubformScopePlan struct {
	ChecklistConfig           runtimeChecklistConfig
	DataViewName              string
	Fields                    []runtimeFieldPlan
	MultiValueOwnerForeignKey string
	MultiValueTableName       string
	ParentForeignKey          string
	ScopeID                   string
	SourceGUIDColumn          string
	SourceIDColumn            string
	SourceTenantColumn        string
	SourceUpdatedColumn       string
	SubformType               string
	TableKey                  string
	TableName                 string
	TenantScoped              bool
}

type runtimeChecklistConfig struct {
	Grouping      string
	LookupFieldID string
	NotesFieldID  string
	ResultFieldID string
}

type runtimeFieldPlan struct {
	FieldID                string
	Label                  string
	Kind                   string
	StorageKey             string
	Preset                 string
	SelectionMode          string
	Validation             string
	ColumnName             string
	LookupDictionary       string
	LookupDisplayMode      string
	LookupDisplayFields    []string
	LookupFilters          []runtimeLookupFilterPlan
	LookupSearchFields     []string
	LookupSortField        string
	LookupSourceModel      string
	LookupStoredTextFields []string
	LookupStoredValueField string
	MultiValue             bool
	Required               bool
	Supported              bool
	UniqueValue            bool
	OptionLabel            map[string]string
	OptionValue            []string
}

type runtimeLookupFilterPlan struct {
	Field    string
	Operator string
	Value    any
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
