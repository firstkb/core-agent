package adminnavigationsvc

type Navigation struct {
	IsRoot    bool                 `json:"is_root"`
	Favorites []NavigationFavorite `json:"favorites"`
	Modules   []NavigationModule   `json:"modules"`
}

type NavigationModule struct {
	ID          string              `json:"id"`
	ModuleKey   string              `json:"module_key"`
	Title       string              `json:"title"`
	Description string              `json:"description,omitempty"`
	Icon        string              `json:"icon,omitempty"`
	Sections    []NavigationSection `json:"sections"`
}

type NavigationSection struct {
	ID          string `json:"id"`
	SectionKey  string `json:"section_key"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	RoutePath   string `json:"route_path"`
	Access      string `json:"access"`
}

type NavigationFavorite struct {
	ID          string `json:"id"`
	ModuleID    string `json:"module_id"`
	ModuleKey   string `json:"module_key"`
	ModuleTitle string `json:"module_title"`
	ModuleIcon  string `json:"module_icon,omitempty"`
	SectionKey  string `json:"section_key"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	RoutePath   string `json:"route_path"`
	Access      string `json:"access"`
}
