package appenv

import "testing"

func TestNormalize(t *testing.T) {
	tests := map[string]Environment{
		"dev":         EnvironmentDevelopment,
		"development": EnvironmentDevelopment,
		"local":       EnvironmentDevelopment,
		"prod":        EnvironmentProduction,
		"production":  EnvironmentProduction,
		"stage":       EnvironmentStaging,
		"staging":     EnvironmentStaging,
		"test":        EnvironmentTesting,
		"testing":     EnvironmentTesting,
		"":            "",
	}

	for input, want := range tests {
		if got := Normalize(input); got != want {
			t.Fatalf("Normalize(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestEnvironmentModes(t *testing.T) {
	if !EnvironmentDevelopment.IsDevelopmentLike() {
		t.Fatal("dev should be development-like")
	}
	if !EnvironmentTesting.IsDevelopmentLike() {
		t.Fatal("test should be development-like")
	}
	if EnvironmentProduction.IsDevelopmentLike() {
		t.Fatal("prod must not be development-like")
	}
	if !EnvironmentProduction.IsProduction() {
		t.Fatal("prod should be production")
	}
}
