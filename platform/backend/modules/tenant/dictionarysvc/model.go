package dictionarysvc

import "errors"

var (
	ErrInvalidDictionary = errors.New("dictionary invalid request")
	ErrTenantMissing     = errors.New("dictionary tenant missing")
	ErrUnauthorized      = errors.New("dictionary unauthorized")
)

type OptionsRequest struct {
	Dictionary string
	IDs        []string
	Page       int
	PageSize   int
	Search     string
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
