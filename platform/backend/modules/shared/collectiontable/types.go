package collectiontable

type MetaResponse struct {
	SurfaceID       string                 `json:"surfaceId"`
	Title           string                 `json:"title"`
	Search          SearchMeta             `json:"search"`
	DefaultSort     SortRequest            `json:"defaultSort,omitempty"`
	Fields          []FieldDefinition      `json:"fields"`
	Columns         []ColumnDefinition     `json:"columns"`
	RowLayout       RowLayout              `json:"rowLayout"`
	Actions         PageActions            `json:"actions"`
	RowActions      []RowActionDefinition  `json:"rowActions"`
	Selection       SelectionMeta          `json:"selection"`
	BulkActions     []BulkActionDefinition `json:"bulkActions"`
	PageSizeOptions []int                  `json:"pageSizeOptions"`
	SavedFilterSets []SavedFilterSet       `json:"savedFilterSets"`
}

type SearchMeta struct {
	DefaultFieldID string `json:"defaultFieldId"`
	Placeholder    string `json:"placeholder"`
}

type FieldDefinition struct {
	ID          string `json:"id"`
	Label       string `json:"label"`
	Type        string `json:"type"`
	Searchable  bool   `json:"searchable"`
	Sortable    bool   `json:"sortable"`
	Suggestable bool   `json:"suggestable"`
}

type ColumnDefinition struct {
	ID             string `json:"id"`
	Label          string `json:"label"`
	Type           string `json:"type"`
	FieldID        string `json:"fieldId,omitempty"`
	Width          string `json:"width,omitempty"`
	DefaultVisible bool   `json:"defaultVisible"`
}

type RowLayout struct {
	SecondaryRowFieldID string `json:"secondaryRowFieldId,omitempty"`
}

type PageActions struct {
	Create    VisibilityAction `json:"create"`
	Reload    VisibilityAction `json:"reload"`
	ExportXLS VisibilityAction `json:"exportXls"`
	Favorite  FavoriteAction   `json:"favorite"`
}

type VisibilityAction struct {
	Visible bool `json:"visible"`
}

type FavoriteAction struct {
	Visible    bool `json:"visible"`
	IsFavorite bool `json:"isFavorite"`
}

type RowActionDefinition struct {
	ID        string `json:"id"`
	Kind      string `json:"kind"`
	Execution string `json:"execution"`
	Label     string `json:"label,omitempty"`
}

type SelectionMeta struct {
	Enabled        bool   `json:"enabled"`
	Mode           string `json:"mode,omitempty"`
	ColumnPosition string `json:"columnPosition,omitempty"`
}

type BulkActionDefinition struct {
	Confirmation *BulkActionConfirmation `json:"confirmation,omitempty"`
	ID           string                  `json:"id"`
	Kind         string                  `json:"kind"`
	Label        string                  `json:"label,omitempty"`
	Tone         string                  `json:"tone,omitempty"`
}

type BulkActionConfirmation struct {
	CancelLabel  string `json:"cancelLabel,omitempty"`
	ConfirmLabel string `json:"confirmLabel,omitempty"`
	Description  string `json:"description,omitempty"`
	Title        string `json:"title"`
}

type SavedFilterSet struct {
	ID           string        `json:"id"`
	Label        string        `json:"label"`
	QuickFilters []QuickFilter `json:"quickFilters"`
}

type QueryRequest struct {
	Filters      map[string]string `json:"filters"`
	Page         int               `json:"page"`
	PageSize     int               `json:"pageSize"`
	PresetID     string            `json:"presetId"`
	QuickFilters []QuickFilter     `json:"quickFilters"`
	Sort         SortRequest       `json:"sort"`
}

type QuickFilter struct {
	FieldID  string `json:"fieldId"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
}

type SortRequest struct {
	ColumnID  string `json:"columnId"`
	Direction string `json:"direction"`
}

type QueryResponse struct {
	Page       int        `json:"page"`
	PageSize   int        `json:"pageSize"`
	TotalItems int        `json:"totalItems"`
	TotalPages int        `json:"totalPages"`
	Rows       []TableRow `json:"rows"`
}

type TableRow struct {
	ID         string             `json:"id"`
	Selectable bool               `json:"selectable"`
	Cells      map[string]RowCell `json:"cells"`
}

type RowCell struct {
	Value         any    `json:"value,omitempty"`
	DisplayValue  string `json:"displayValue,omitempty"`
	DisplayFormat string `json:"displayFormat,omitempty"`
	Label         string `json:"label,omitempty"`
	Tone          string `json:"tone,omitempty"`
	HTML          string `json:"html,omitempty"`
}

type SearchSuggestionsResponse struct {
	Groups []SearchSuggestionGroup `json:"groups"`
}

type SearchSuggestionGroup struct {
	FieldID string                 `json:"fieldId"`
	Label   string                 `json:"label"`
	Items   []SearchSuggestionItem `json:"items"`
}

type SearchSuggestionItem struct {
	Value string `json:"value"`
	Count int    `json:"count,omitempty"`
}

type FavoriteToggleResponse struct {
	IsFavorite bool `json:"isFavorite"`
}

type CreateSavedFilterInput struct {
	Label        string        `json:"label"`
	QuickFilters []QuickFilter `json:"quickFilters"`
}

type MutationResult struct {
	DownloadURL string `json:"downloadUrl,omitempty"`
	LaunchURL   string `json:"launchUrl,omitempty"`
	OK          bool   `json:"ok"`
	OpenIn      string `json:"openIn,omitempty"`
}

type BulkActionInput struct {
	Query  QueryRequest `json:"query"`
	RowIDs []string     `json:"rowIds"`
}

type RowActionInput struct {
	RowID string `json:"rowId"`
}

type ExportRequest struct {
	Query QueryRequest `json:"query"`
}
