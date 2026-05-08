package platformstudionavigationbuilder

import (
	"encoding/json"
	"time"
)

const (
	ConfigKeyDefault = "default"
	SchemaVersionV1  = 1

	NodeTypeMenuTitle   = "menu_title"
	NodeTypeMenuGroup   = "menu_group"
	NodeTypeFormView    = "form_view"
	NodeTypeAppPage     = "app_page"
	NodeTypeExternalURL = "external_link"
	NodeTypeAppModule   = "app_module"

	TargetTypeFormView    = "form_view"
	TargetTypeAppPage     = "app_page"
	TargetTypeExternalURL = "external_link"
	TargetTypeAppModule   = "app_module"
)

type NavigationDefinition struct {
	SchemaVersion int                  `json:"schemaVersion"`
	AppMenu       []NavigationNode     `json:"appMenu"`
	UtilityRail   []NavigationRailItem `json:"utilityRail,omitempty"`
}

type NavigationNode struct {
	ID       string            `json:"id"`
	Type     string            `json:"type"`
	Label    string            `json:"label"`
	Active   *bool             `json:"active,omitempty"`
	Icon     string            `json:"icon,omitempty"`
	Channel  string            `json:"channel,omitempty"`
	Target   *NavigationTarget `json:"target,omitempty"`
	Children []NavigationNode  `json:"children,omitempty"`
	Meta     json.RawMessage   `json:"meta,omitempty"`
	Access   json.RawMessage   `json:"access,omitempty"`
}

type NavigationTarget struct {
	Type     string `json:"type"`
	ModelID  string `json:"modelId,omitempty"`
	ViewID   string `json:"viewId,omitempty"`
	PageID   string `json:"pageId,omitempty"`
	ModuleID string `json:"moduleId,omitempty"`
	URL      string `json:"url,omitempty"`
	Route    string `json:"route,omitempty"`
}

type NavigationRailItem struct {
	ID     string          `json:"id"`
	Key    string          `json:"key"`
	Label  string          `json:"label"`
	Active *bool           `json:"active,omitempty"`
	Access json.RawMessage `json:"access,omitempty"`
}

type AccessRecipientOption struct {
	ID       string            `json:"id"`
	Label    string            `json:"label"`
	Fields   map[string]string `json:"fields,omitempty"`
	Subtitle string            `json:"subtitle,omitempty"`
}

type AccessOptionsResponse struct {
	Users        []AccessRecipientOption `json:"users"`
	Companies    []AccessRecipientOption `json:"companies"`
	CompanyTypes []AccessRecipientOption `json:"companyTypes"`
	JobTypes     []AccessRecipientOption `json:"jobtypes"`
}

type AccessOptionsPageRequest struct {
	Category string
	IDs      []string
	Page     int
	PageSize int
	Search   string
}

type AccessOptionsPageResponse struct {
	Category string                  `json:"category"`
	HasMore  bool                    `json:"hasMore"`
	Items    []AccessRecipientOption `json:"items"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"pageSize"`
	Total    int                     `json:"total"`
}

type ValidationMessage struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Target  string `json:"target,omitempty"`
}

type ValidationSummary struct {
	CanSave  bool                `json:"canSave"`
	Errors   []ValidationMessage `json:"errors"`
	Warnings []ValidationMessage `json:"warnings"`
}

type ConfigRecord struct {
	ConfigKey      string
	Version        int64
	DefinitionJSON json.RawMessage
	UpdatedAt      time.Time
	UpdatedBy      string
}

type LoadConfigResponse struct {
	ConfigKey         string               `json:"configKey"`
	Definition        NavigationDefinition `json:"definition"`
	Version           int64                `json:"version"`
	UpdatedAt         string               `json:"updatedAt,omitempty"`
	UpdatedBy         string               `json:"updatedBy,omitempty"`
	ValidationSummary ValidationSummary    `json:"validationSummary"`
}

type SaveConfigRequest struct {
	Definition      NavigationDefinition `json:"definition"`
	ExpectedVersion *int64               `json:"expectedVersion,omitempty"`
}

type SaveConfigResponse = LoadConfigResponse

type RuntimeNavigationResponse struct {
	Items                 []RuntimeNavigationItem `json:"items"`
	UtilityRail           []RuntimeNavigationItem `json:"utilityRail"`
	UtilityRailConfigured bool                    `json:"utilityRailConfigured"`
}

type RuntimeNavigationItem struct {
	ID          string                  `json:"id"`
	Key         string                  `json:"key,omitempty"`
	Label       string                  `json:"label"`
	Type        string                  `json:"type"`
	Icon        string                  `json:"icon,omitempty"`
	Path        string                  `json:"path,omitempty"`
	ExternalURL string                  `json:"externalUrl,omitempty"`
	TargetType  string                  `json:"targetType,omitempty"`
	Breadcrumb  []string                `json:"breadcrumb,omitempty"`
	Children    []RuntimeNavigationItem `json:"children,omitempty"`
}
