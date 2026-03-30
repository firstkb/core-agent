package tenantmanagement

import (
	"errors"
	"testing"
)

func TestSanitizeDBName(t *testing.T) {
	cases := map[string]string{
		"Acme Inc":         "acme-inc",
		"  $$Weird__Name ": "weird-name",
		"":                 "",
	}
	for in, expected := range cases {
		if got := sanitizeDBName(in); got != expected {
			t.Fatalf("sanitizeDBName(%q)=%q, expected %q", in, got, expected)
		}
	}
}

func TestNormalizePlan(t *testing.T) {
	if normalizePlan("PRO", PlanLight) != PlanPro {
		t.Fatalf("expected plan=pro")
	}
	if normalizePlan("enterprise", PlanPro) != PlanEnterprise {
		t.Fatalf("expected plan=enterprise")
	}
	if normalizePlan("unknown", PlanLight) != PlanLight {
		t.Fatalf("unexpected fallback plan")
	}
}

func TestNormalizeHost(t *testing.T) {
	if normalizeHost(" Example.COM ") != "example.com" {
		t.Fatalf("host normalization failed")
	}
}

func TestPlanTypeChecks(t *testing.T) {
	if !isSandboxPlan(PlanLight) || isSandboxPlan(PlanEnterprise) {
		t.Fatalf("sandbox plan detection failed")
	}
	if !isDedicatedPlan(PlanPro) || !isDedicatedPlan(PlanEnterprise) {
		t.Fatalf("dedicated plan detection failed")
	}
}

func TestValidateOnboardTenantInput(t *testing.T) {
	if err := validateOnboardTenantInput(OnboardTenantInput{Name: "Acme", Host: "acme.local"}); err != nil {
		t.Fatalf("unexpected validation error: %v", err)
	}
	if err := validateOnboardTenantInput(OnboardTenantInput{Host: "acme.local"}); !errors.Is(err, ErrTenantNameRequired) {
		t.Fatalf("expected tenant name error, got %v", err)
	}
	if err := validateOnboardTenantInput(OnboardTenantInput{Name: "Acme"}); !errors.Is(err, ErrTenantHostRequired) {
		t.Fatalf("expected tenant host error, got %v", err)
	}
}
