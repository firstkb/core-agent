package moduleregistrygrants

import collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"

type MutationResult = collectiontable.MutationResult

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

type UpsertSectionGrantInput struct {
	Access string `json:"access"`
}

type GrantMutationOutput struct {
	OK           bool `json:"ok"`
	AppliedCount int  `json:"applied_count"`
}

type SectionGrantListOutput struct {
	Section SectionDetailOutput  `json:"section"`
	Grants  []SectionGrantOutput `json:"grants"`
}

type SectionGrantOutput struct {
	ID        string         `json:"id"`
	SectionID string         `json:"section_id"`
	AdminUser AdminUserGrant `json:"admin_user"`
	Access    string         `json:"access"`
	CreatedAt string         `json:"created_at"`
	UpdatedAt string         `json:"updated_at"`
}

type AdminUserGrant struct {
	ID     string `json:"id"`
	Email  string `json:"email"`
	Name   string `json:"name,omitempty"`
	Level  int    `json:"level"`
	Role   string `json:"role"`
	Status string `json:"status"`
}
