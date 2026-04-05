package adminaccesspolicy

import "testing"

func TestRequirementForRouteMatchesExactAndPrefixBindings(t *testing.T) {
	requirement := RequirementForRoute("ADMIN_TENANT_CREATE")
	if requirement == nil {
		t.Fatalf("expected tenant create requirement")
	}
	if requirement.Kind != RequirementSection || requirement.ModuleKey != "tenant" || requirement.SectionKey != "onboarding" || requirement.Access != "write" {
		t.Fatalf("unexpected tenant create requirement: %+v", requirement)
	}

	requirement = RequirementForRoute("ADMIN_MODULE_REGISTRY_META_GET")
	if requirement == nil {
		t.Fatalf("expected module registry requirement")
	}
	if requirement.Kind != RequirementRootOnly || requirement.ModuleKey != "module_registry" || requirement.SectionKey != "modules_list" {
		t.Fatalf("unexpected module registry requirement: %+v", requirement)
	}

	if requirement := RequirementForRoute("ADMIN_UNKNOWN_GET"); requirement != nil {
		t.Fatalf("expected nil requirement, got %+v", requirement)
	}
}

func TestAllowsSectionNavigationHonorsCoverageAndAccess(t *testing.T) {
	if !AllowsSectionNavigation("module_registry", "modules_list", "write", true) {
		t.Fatalf("expected root module registry section to be visible for root")
	}
	if AllowsSectionNavigation("module_registry", "modules_list", "write", false) {
		t.Fatalf("expected root-only module registry section to stay hidden for non-root")
	}
	if !AllowsSectionNavigation("tenant", "onboarding", "write", false) {
		t.Fatalf("expected onboarding to be visible for non-root write grant")
	}
	if AllowsSectionNavigation("tenant", "onboarding", "read", false) {
		t.Fatalf("expected onboarding to stay hidden for non-root read grant")
	}
	if AllowsSectionNavigation("tenant", "list_of_tenants", "write", false) {
		t.Fatalf("expected uncovered tenant list section to stay hidden")
	}
}
