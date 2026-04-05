package moduleregistrymanage

import collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"

type MutationResult = collectiontable.MutationResult

type CreateModuleInput struct {
	ModuleKey   string `json:"module_key"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	SortOrder   int    `json:"sort_order"`
	Status      string `json:"status"`
}

type UpdateModuleInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	SortOrder   int    `json:"sort_order"`
	Status      string `json:"status"`
}

type CreateSectionInput struct {
	SectionKey  string `json:"section_key"`
	Title       string `json:"title"`
	Description string `json:"description"`
	RoutePath   string `json:"route_path"`
	SortOrder   int    `json:"sort_order"`
	Status      string `json:"status"`
}

type UpdateSectionInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	RoutePath   string `json:"route_path"`
	SortOrder   int    `json:"sort_order"`
	Status      string `json:"status"`
}

type ModuleDetailOutput struct {
	ID          string                `json:"id"`
	ModuleKey   string                `json:"module_key"`
	Title       string                `json:"title"`
	Description string                `json:"description,omitempty"`
	Icon        string                `json:"icon,omitempty"`
	SortOrder   int                   `json:"sort_order"`
	Status      string                `json:"status"`
	CreatedAt   string                `json:"created_at"`
	UpdatedAt   string                `json:"updated_at"`
	Sections    []SectionDetailOutput `json:"sections"`
}

type SectionDetailOutput struct {
	ID          string `json:"id"`
	ModuleID    string `json:"module_id"`
	SectionKey  string `json:"section_key"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	RoutePath   string `json:"route_path,omitempty"`
	SortOrder   int    `json:"sort_order"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}
