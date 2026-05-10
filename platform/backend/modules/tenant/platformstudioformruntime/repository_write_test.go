package platformstudioformruntime

import (
	"context"
	"testing"
)

func TestDeleteMultiValueCleanupSkipsScopesWithoutMultiValueFields(t *testing.T) {
	ctx := context.Background()
	rootScope := runtimeRootScopePlan{
		Fields: []runtimeFieldPlan{
			{FieldID: "catalog", Supported: true},
		},
		MultiValueOwnerForeignKey: "lookup_option_id",
		MultiValueTableName:       "missing_lookup_option_mv",
		SourceGUIDColumn:          "_guid",
		SourceIDColumn:            "_id",
		TableName:                 "ps_lookup_option",
	}

	if err := deleteRootMultiValueRowsForDocGuidsTx(ctx, nil, rootScope, []string{"doc-a"}); err != nil {
		t.Fatalf("deleteRootMultiValueRowsForDocGuidsTx returned error: %v", err)
	}

	if err := deleteMultiValueRowsForOwnerTx(ctx, nil, rootScope, 10); err != nil {
		t.Fatalf("deleteMultiValueRowsForOwnerTx returned error: %v", err)
	}

	subformScope := runtimeSubformScopePlan{
		Fields: []runtimeFieldPlan{
			{FieldID: "note", Supported: true},
		},
		MultiValueOwnerForeignKey: "lookup_option_child_id",
		MultiValueTableName:       "missing_lookup_option_child_mv",
		ParentForeignKey:          "lookup_option_id",
		SourceIDColumn:            "_id",
		TableName:                 "ps_lookup_option_child",
	}

	if err := deleteSubformMultiValueRowsForRootDocGuidsTx(ctx, nil, rootScope, subformScope, []string{"doc-a"}, "true"); err != nil {
		t.Fatalf("deleteSubformMultiValueRowsForRootDocGuidsTx returned error: %v", err)
	}
}
