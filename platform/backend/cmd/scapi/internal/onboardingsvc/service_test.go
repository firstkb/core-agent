package onboardingsvc

import "testing"

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
