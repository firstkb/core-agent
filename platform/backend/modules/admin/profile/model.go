package adminprofilesvc

type Profile struct {
	User UserProfile `json:"user"`
}

type UserProfile struct {
	ID     string `json:"id"`
	Email  string `json:"email,omitempty"`
	Phone  string `json:"phone,omitempty"`
	Name   string `json:"name,omitempty"`
	Level  int    `json:"level"`
	Role   string `json:"role,omitempty"`
	Status string `json:"status,omitempty"`
	Scope  string `json:"scope,omitempty"`
}
