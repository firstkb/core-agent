package platformstudioformruntime

import (
	"context"
	"errors"
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

func TestMutationColumnsAndArgsForColumnsReportsSchemaDrift(t *testing.T) {
	scope := runtimeRootScopePlan{
		Fields: []runtimeFieldPlan{
			{
				ColumnName: "geo_point",
				FieldID:    "geo-point",
				Kind:       "geo_point",
				Supported:  true,
			},
		},
		TableName: "ps_lookup",
	}

	columns, args, missingFields := mutationColumnsAndArgsForColumns(scope, map[string]any{
		"geo-point": "Latitude: 40.589034, Longitude: -73.944936",
	}, map[string]struct{}{
		"_id": {},
	})

	if len(columns) != 0 || len(args) != 0 {
		t.Fatalf("mutation columns = %#v args = %#v, want none for missing column", columns, args)
	}
	if len(missingFields) != 1 || missingFields[0].FieldID != "geo-point" {
		t.Fatalf("missing fields = %#v, want geo-point", missingFields)
	}
	if err := runtimeSchemaDriftError(scope.TableName, missingFields); !errors.Is(err, ErrRuntimeSchemaDrift) {
		t.Fatalf("schema drift error = %v, want ErrRuntimeSchemaDrift", err)
	}
}
