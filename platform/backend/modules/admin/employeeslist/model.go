package employeeslist

import (
	"time"

	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

const SurfaceID = "employees.list"

type MetaResponse = collectiontable.MetaResponse
type SearchMeta = collectiontable.SearchMeta
type FieldDefinition = collectiontable.FieldDefinition
type ColumnDefinition = collectiontable.ColumnDefinition
type RowLayout = collectiontable.RowLayout
type PageActions = collectiontable.PageActions
type VisibilityAction = collectiontable.VisibilityAction
type FavoriteAction = collectiontable.FavoriteAction
type RowActionDefinition = collectiontable.RowActionDefinition
type SelectionMeta = collectiontable.SelectionMeta
type BulkActionDefinition = collectiontable.BulkActionDefinition
type SavedFilterSet = collectiontable.SavedFilterSet
type QueryRequest = collectiontable.QueryRequest
type QuickFilter = collectiontable.QuickFilter
type SortRequest = collectiontable.SortRequest
type QueryResponse = collectiontable.QueryResponse
type TableRow = collectiontable.TableRow
type RowCell = collectiontable.RowCell
type SearchSuggestionsResponse = collectiontable.SearchSuggestionsResponse
type SearchSuggestionGroup = collectiontable.SearchSuggestionGroup
type SearchSuggestionItem = collectiontable.SearchSuggestionItem
type FavoriteToggleResponse = collectiontable.FavoriteToggleResponse
type CreateSavedFilterInput = collectiontable.CreateSavedFilterInput
type DeleteSavedFilterResponse = collectiontable.MutationResult
type MutationResult = collectiontable.MutationResult
type BulkActionInput = collectiontable.BulkActionInput

type EmployeeDetailResponse struct {
	User EmployeeDetail `json:"user"`
}

type EmployeeDetail struct {
	ID            string    `json:"id"`
	Email         string    `json:"email,omitempty"`
	Phone         string    `json:"phone,omitempty"`
	Name          string    `json:"name,omitempty"`
	Level         int       `json:"level"`
	Role          string    `json:"role,omitempty"`
	Status        string    `json:"status,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	IsCurrentUser bool      `json:"isCurrentUser"`
}

type UpdateEmployeeInput struct {
	Name   string `json:"name"`
	Phone  string `json:"phone"`
	Status string `json:"status"`
}
