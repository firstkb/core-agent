package dictionary

import "errors"

var (
	ErrInvalidDictionary = errors.New("dictionary invalid request")
	ErrTenantMissing     = errors.New("dictionary tenant missing")
	ErrUnauthorized      = errors.New("dictionary unauthorized")
)

type OptionsRequest struct {
	Dictionary       string         `json:"dictionary,omitempty"`
	DisplayFields    []string       `json:"displayFields,omitempty"`
	Filters          []LookupFilter `json:"filters,omitempty"`
	IDs              []string       `json:"ids,omitempty"`
	Page             int            `json:"page,omitempty"`
	PageSize         int            `json:"pageSize,omitempty"`
	Search           string         `json:"search,omitempty"`
	SearchFields     []string       `json:"searchFields,omitempty"`
	SortField        string         `json:"sortField,omitempty"`
	SourceModel      string         `json:"sourceModel,omitempty"`
	StoredValueField string         `json:"storedValueField,omitempty"`
}

type LookupFilter struct {
	Field    string `json:"field"`
	Operator string `json:"operator,omitempty"`
	Value    any    `json:"value,omitempty"`
}

type Option struct {
	Description string            `json:"description,omitempty"`
	Fields      map[string]string `json:"fields,omitempty"`
	ID          string            `json:"id"`
	Label       string            `json:"label"`
	Value       string            `json:"value"`
}

type OptionsResponse struct {
	Dictionary string   `json:"dictionary"`
	HasMore    bool     `json:"hasMore"`
	Items      []Option `json:"items"`
	Page       int      `json:"page"`
	PageSize   int      `json:"pageSize"`
	Total      int      `json:"total"`
}
