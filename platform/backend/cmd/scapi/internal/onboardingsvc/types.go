package onboardingsvc

// Plan описывает тарифное предложение.
type Plan string

const (
	PlanTrial      Plan = "trial"
	PlanLight      Plan = "light"
	PlanPro        Plan = "pro"
	PlanEnterprise Plan = "enterprise"
)

// IsolationMode определяет режим изоляции данных.
type IsolationMode string

const (
	IsolationSandbox     IsolationMode = "sandbox"
	IsolationDedicatedDB IsolationMode = "dedicated_db"
)

// OnboardTenantInput содержит входные данные для онбординга тенанта.
type OnboardTenantInput struct {
	Name              string
	Subdomain         string
	Host              string
	Plan              string
	SandboxPoolCode   string
	DedicatedPoolCode string
}

// OnboardTenantOutput описывает результат онбординга.
type OnboardTenantOutput struct {
	TenantID          int64
	Name              string
	DBName            string
	Plan              Plan
	Isolation         IsolationMode
	Domains           []string
	InstanceCode      string
	IsSandbox         bool
	AppliedMigrations []string
}

// Config обёртка для секции onboarding в общем конфиге.
type Config struct {
	Onboarding OnboardingConfig `json:"onboarding"`
}

// OnboardingConfig описывает конфигурацию сервисного слоя онбординга.
type OnboardingConfig struct {
	BundlePath     string   `json:"bundlepath"`
	MigrationsDir  string   `json:"migrationsdir"`
	SeedPublicCode bool     `json:"seedpubliccode"`
	DataCopyTables []string `json:"copytables"`
}

var (
	defaultProDBPrefix = "sc-"
	defaultCopyTables  = []string{"users", "contacts", "public_code", "idempotency_keys"}
)
