package platformstudioformbuilder

import (
	"encoding/json"

	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

type ExpectedVersions struct {
	Model *int64 `json:"model,omitempty"`
	View  *int64 `json:"view,omitempty"`
}

type DraftPayload struct {
	Model json.RawMessage `json:"model"`
	View  json.RawMessage `json:"view"`
}

type SaveDraftRequest struct {
	Draft            DraftPayload     `json:"draft"`
	ExpectedVersions ExpectedVersions `json:"expectedVersions"`
}

type PublishState struct {
	HasUnpublishedChanges bool   `json:"hasUnpublishedChanges"`
	ModelPublishedVersion int64  `json:"modelPublishedVersion"`
	ModelVersion          int64  `json:"modelVersion"`
	ViewPublishedVersion  int64  `json:"viewPublishedVersion"`
	ViewVersion           int64  `json:"viewVersion"`
	LastPublishedAt       string `json:"lastPublishedAt,omitempty"`
	LastPublishedBy       string `json:"lastPublishedBy,omitempty"`
}

type ValidationMessage struct {
	Code    string `json:"code,omitempty"`
	Message string `json:"message"`
	Target  string `json:"target,omitempty"`
}

type ValidationSummary struct {
	CanPublish bool                `json:"canPublish"`
	CanSave    bool                `json:"canSave"`
	Errors     []ValidationMessage `json:"errors"`
	Warnings   []ValidationMessage `json:"warnings"`
}

type RuntimeApplyArtifactResult struct {
	Name   string `json:"name"`
	Action string `json:"action"`
}

type RuntimeApplyLookupOutputResult struct {
	ColumnName string `json:"columnName"`
	Action     string `json:"action"`
}

type RuntimeApplyScopeResult struct {
	ScopeID         string                           `json:"scopeId,omitempty"`
	Table           *RuntimeApplyArtifactResult      `json:"table,omitempty"`
	MultiValueTable *RuntimeApplyArtifactResult      `json:"multiValueTable,omitempty"`
	DataView        *RuntimeApplyArtifactResult      `json:"dataView,omitempty"`
	GridViews       []RuntimeApplyArtifactResult     `json:"gridViews,omitempty"`
	LookupOutputs   []RuntimeApplyLookupOutputResult `json:"lookupOutputs,omitempty"`
	Warnings        []ValidationMessage              `json:"warnings,omitempty"`
}

type RuntimeApplyStorageResults struct {
	RootScope     RuntimeApplyScopeResult   `json:"rootScope"`
	SubformScopes []RuntimeApplyScopeResult `json:"subformScopes,omitempty"`
}

type RuntimeApplyContext struct {
	TenantID string `json:"tenantId,omitempty"`
	ModelID  string `json:"modelId,omitempty"`
	ViewID   string `json:"viewId,omitempty"`
}

type RuntimeApplySummary struct {
	Status         string                      `json:"status"`
	Message        string                      `json:"message,omitempty"`
	Context        *RuntimeApplyContext        `json:"context,omitempty"`
	StorageResults *RuntimeApplyStorageResults `json:"storageResults,omitempty"`
}

type LoadDraftResponse struct {
	Draft             DraftPayload         `json:"draft"`
	PublishState      PublishState         `json:"publishState"`
	ValidationSummary ValidationSummary    `json:"validationSummary"`
	RuntimeApply      *RuntimeApplySummary `json:"runtimeApply,omitempty"`
}

type SaveDraftResponse = LoadDraftResponse

type ListModelsResponse struct {
	Items []ModelSummary `json:"items"`
}

type ListViewsResponse struct {
	Items []ViewSummary `json:"items"`
}

type ModelDetailResponse struct {
	ModelSummary
	Fields         []ModelFieldSummary  `json:"fields"`
	Views          []ViewSummary        `json:"views"`
	SelectedViewID string               `json:"selectedViewId,omitempty"`
	RuntimeApply   *RuntimeApplySummary `json:"runtimeApply,omitempty"`
}

type ViewDetailResponse struct {
	Model ModelSummary    `json:"model"`
	View  ViewSummary     `json:"view"`
	Draft json.RawMessage `json:"draft,omitempty"`
}

type CreateModelRequest struct {
	Title       string `json:"title"`
	Key         string `json:"key,omitempty"`
	Description string `json:"description,omitempty"`
}

type CreateViewRequest struct {
	Title       string `json:"title"`
	Key         string `json:"key,omitempty"`
	Description string `json:"description,omitempty"`
	Kind        string `json:"kind,omitempty"`
	IsActive    *bool  `json:"isActive,omitempty"`
}

type CopyViewRequest struct {
	Title       string `json:"title,omitempty"`
	Key         string `json:"key,omitempty"`
	Description string `json:"description,omitempty"`
	Kind        string `json:"kind,omitempty"`
	IsActive    *bool  `json:"isActive,omitempty"`
}

type DeleteViewResponse = ModelDetailResponse

type DeleteModelResponse struct {
	DeletedModelID string `json:"deletedModelId"`
}

type ExportFile struct {
	FileName    string
	ContentType string
	Content     []byte
}

type RuntimeViewListMetaResponse = collectiontable.MetaResponse
type RuntimeViewListQueryRequest = collectiontable.QueryRequest
type RuntimeViewListQueryResponse = collectiontable.QueryResponse
type RuntimeViewListSearchSuggestionsResponse = collectiontable.SearchSuggestionsResponse
type RuntimeViewListFavoriteToggleResponse = collectiontable.FavoriteToggleResponse
type RuntimeViewListSavedFilterSet = collectiontable.SavedFilterSet
type RuntimeViewListCreateSavedFilterInput = collectiontable.CreateSavedFilterInput
type RuntimeViewListDeleteSavedFilterResponse = collectiontable.MutationResult

type RuntimeFavoriteShortcut struct {
	ID         string `json:"id"`
	ModelID    string `json:"modelId"`
	ModelTitle string `json:"modelTitle"`
	RoutePath  string `json:"routePath"`
	TargetType string `json:"targetType"`
	Title      string `json:"title"`
	ViewID     string `json:"viewId"`
}

type RuntimeFavoritesResponse struct {
	Items []RuntimeFavoriteShortcut `json:"items"`
}

type RuntimeViewRecordField struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Type  string `json:"type"`
	Value string `json:"value"`
}

type RuntimeViewRecordSubtable struct {
	ID      string                             `json:"id"`
	Title   string                             `json:"title"`
	Columns []collectiontable.ColumnDefinition `json:"columns"`
	Rows    []collectiontable.TableRow         `json:"rows"`
}

type RuntimeViewRecordResponse struct {
	Fields    []RuntimeViewRecordField    `json:"fields"`
	Subtables []RuntimeViewRecordSubtable `json:"subtables,omitempty"`
	SurfaceID string                      `json:"surfaceId"`
	Title     string                      `json:"title"`
}

type ModelSummary struct {
	ID                    string `json:"id"`
	GUID                  string `json:"guid,omitempty"`
	Key                   string `json:"key"`
	Name                  string `json:"name"`
	Title                 string `json:"title"`
	DisplayName           string `json:"displayName"`
	Description           string `json:"description,omitempty"`
	DataCount             *int64 `json:"dataCount,omitempty"`
	SourceType            string `json:"sourceType,omitempty"`
	StorageKey            string `json:"storageKey,omitempty"`
	IsStructureLocked     bool   `json:"isStructureLocked"`
	CanEditViewsOnly      bool   `json:"canEditViewsOnly"`
	ModelStructureVersion int64  `json:"modelStructureVersion"`
	Version               int64  `json:"version,omitempty"`
}

type ModelFieldSummary struct {
	ID          string `json:"id"`
	Key         string `json:"key"`
	Label       string `json:"label"`
	DisplayName string `json:"displayName"`
	StorageKey  string `json:"storageKey,omitempty"`
	IsLocked    bool   `json:"isLocked"`
	IsPersisted bool   `json:"isPersisted"`
	Status      string `json:"status,omitempty"`
}

type ViewSummary struct {
	ID                               string `json:"id"`
	GUID                             string `json:"guid,omitempty"`
	ModelID                          string `json:"modelId"`
	Key                              string `json:"key"`
	Name                             string `json:"name"`
	Title                            string `json:"title"`
	DisplayName                      string `json:"displayName"`
	Description                      string `json:"description,omitempty"`
	Kind                             string `json:"kind"`
	IsActive                         bool   `json:"isActive"`
	IsDefault                        bool   `json:"isDefault"`
	IsViewLocked                     bool   `json:"isViewLocked"`
	Version                          int64  `json:"version,omitempty"`
	LastAlignedModelStructureVersion int64  `json:"lastAlignedModelStructureVersion"`
}

type ModelRecord struct {
	GUID              string
	ModelID           string
	ModelKey          string
	StorageKey        string
	DisplayName       string
	Description       string
	DataCount         *int64
	SourceType        string
	Status            string
	Version           int64
	PublishedVersion  int64
	StructureVersion  int64
	IsStructureLocked bool
	CanEditViewsOnly  bool
	DefinitionJSON    json.RawMessage
}

type ViewRecord struct {
	GUID                             string
	ModelID                          string
	ViewID                           string
	ViewKey                          string
	DisplayName                      string
	Description                      string
	ViewType                         string
	IsDefault                        bool
	IsActive                         bool
	IsViewLocked                     bool
	Status                           string
	Version                          int64
	PublishedVersion                 int64
	LastAlignedModelStructureVersion int64
	DefinitionJSON                   json.RawMessage
	PublishedArtifactsJSON           json.RawMessage
}

type RuntimeFavoriteRecord struct {
	ID         string
	ModelID    string
	ModelTitle string
	SurfaceID  string
	ViewID     string
	ViewTitle  string
}
