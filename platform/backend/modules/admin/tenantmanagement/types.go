package tenantmanagement

import "errors"

type Plan string

const (
	PlanTrial      Plan = "trial"
	PlanLight      Plan = "light"
	PlanPro        Plan = "pro"
	PlanEnterprise Plan = "enterprise"
)

type IsolationMode string

const (
	IsolationSandbox     IsolationMode = "sandbox"
	IsolationDedicatedDB IsolationMode = "dedicated_db"
)

type OnboardTenantInput struct {
	Name              string `json:"name"`
	Subdomain         string `json:"subdomain"`
	Host              string `json:"host"`
	Plan              string `json:"plan"`
	SandboxPoolCode   string `json:"sandbox_pool_code"`
	DedicatedPoolCode string `json:"dedicated_pool_code"`
}

type OnboardTenantOutput struct {
	TenantID          int64         `json:"tenant_id"`
	Name              string        `json:"name"`
	DBName            string        `json:"db_name"`
	Plan              Plan          `json:"plan"`
	Isolation         IsolationMode `json:"isolation"`
	Domains           []string      `json:"domains"`
	InstanceCode      string        `json:"instance_code"`
	IsSandbox         bool          `json:"is_sandbox"`
	AppliedMigrations []string      `json:"applied_migrations,omitempty"`
}

type Config struct {
	Onboarding OnboardingConfig `json:"onboarding"`
}

type OnboardingConfig struct {
	BundlePath     string   `json:"bundlepath"`
	MigrationsDir  string   `json:"migrationsdir"`
	SeedPublicCode bool     `json:"seedpubliccode"`
	DataCopyTables []string `json:"copytables"`
}

var (
	defaultProDBPrefix = "sc-"
	defaultCopyTables  = []string{
		"users",
		"companytype",
		"company",
		"projects",
		"projectsaccess",
		"events",
		"mails",
		"public_code",
		"notification_template",
	}

	ErrTenantNameRequired = errors.New("tenant name required")
	ErrTenantHostRequired = errors.New("tenant host required")
	ErrTenantConflict     = errors.New("tenant conflict")
)
