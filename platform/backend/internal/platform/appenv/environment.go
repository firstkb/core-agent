package appenv

import "strings"

type Environment string

const (
	EnvironmentProduction  Environment = "prod"
	EnvironmentDevelopment Environment = "dev"
	EnvironmentTesting     Environment = "test"
	EnvironmentStaging     Environment = "stage"
)

type Config struct {
	Environment string `json:"environment"`
}

func Normalize(raw string) Environment {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "prod", "production":
		return EnvironmentProduction
	case "dev", "development", "local":
		return EnvironmentDevelopment
	case "test", "testing":
		return EnvironmentTesting
	case "stage", "staging", "preprod":
		return EnvironmentStaging
	default:
		return Environment(strings.ToLower(strings.TrimSpace(raw)))
	}
}

func (e Environment) String() string {
	return string(e)
}

func (e Environment) IsProduction() bool {
	return Normalize(e.String()) == EnvironmentProduction
}

func (e Environment) IsDevelopmentLike() bool {
	switch Normalize(e.String()) {
	case EnvironmentDevelopment, EnvironmentTesting, EnvironmentStaging:
		return true
	default:
		return false
	}
}
