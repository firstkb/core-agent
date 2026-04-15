package platformstudioformbuilder

import (
	"strings"
	"testing"
)

func TestBuildSetUpdatedAtTriggerStatementUsesSharedFunction(t *testing.T) {
	triggerName, statement := buildSetUpdatedAtTriggerStatement("ps_test_inspection__sf_891cfd")

	if triggerName == "" {
		t.Fatal("expected trigger name")
	}
	if len(triggerName) > 63 {
		t.Fatalf("trigger name length = %d, want <= 63", len(triggerName))
	}
	if !strings.Contains(statement, `EXECUTE FUNCTION "public"."set_updated_at"()`) {
		t.Fatalf("expected shared set_updated_at function in statement, got %s", statement)
	}
	if !strings.Contains(statement, `"public"."ps_test_inspection__sf_891cfd"`) {
		t.Fatalf("expected qualified table name in statement, got %s", statement)
	}
}
