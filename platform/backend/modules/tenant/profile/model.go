package profilesvc

type Profile struct {
	User   UserProfile   `json:"user"`
	Tenant TenantProfile `json:"tenant"`
}

type UserProfile struct {
	ID    string `json:"id"`
	Email string `json:"email,omitempty"`
	Level int    `json:"level"`
	Role  string `json:"role,omitempty"`
}

type TenantProfile struct {
	ID     string `json:"id"`
	Host   string `json:"host,omitempty"`
	Plan   string `json:"plan,omitempty"`
	Status string `json:"status,omitempty"`
}
