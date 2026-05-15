package platformstudioformbuilder

import "testing"

func TestRuntimeApplyWarningsIncludesPartialSummary(t *testing.T) {
	summary := &RuntimeApplySummary{
		Status:  "partial",
		Message: "runtime storage was applied, but runtime views were not fully refreshed",
		StorageResults: &RuntimeApplyStorageResults{
			RootScope: RuntimeApplyScopeResult{},
		},
	}

	warnings := runtimeApplyWarnings(summary)
	if len(warnings) != 1 {
		t.Fatalf("warnings = %#v, want one partial warning", warnings)
	}
	if warnings[0].Code != "runtime_apply_partial" {
		t.Fatalf("warning code = %q, want runtime_apply_partial", warnings[0].Code)
	}
	if warnings[0].Target != "runtime" {
		t.Fatalf("warning target = %q, want runtime", warnings[0].Target)
	}
}
