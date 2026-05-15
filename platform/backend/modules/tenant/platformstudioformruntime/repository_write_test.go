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

func TestManagedRuntimeFieldPhysicalTypeMatchesRuntimeApplyTypes(t *testing.T) {
	tests := []struct {
		name  string
		field runtimeFieldPlan
		want  string
	}{
		{
			name:  "short text",
			field: runtimeFieldPlan{ColumnName: "answer_options", Kind: "short_text", Supported: true},
			want:  "text",
		},
		{
			name:  "boolean",
			field: runtimeFieldPlan{ColumnName: "answer_required", Kind: "boolean", Supported: true},
			want:  "boolean",
		},
		{
			name:  "long text",
			field: runtimeFieldPlan{ColumnName: "visible_when", Kind: "long_text", Supported: true},
			want:  "text",
		},
		{
			name:  "integer",
			field: runtimeFieldPlan{ColumnName: "order", Kind: "integer", Supported: true},
			want:  "bigint",
		},
		{
			name:  "db lookup value",
			field: runtimeFieldPlan{ColumnName: "lookup_value", Kind: "db_lookup", Preset: "db_lookup_value", Supported: true},
			want:  "text",
		},
		{
			name:  "db lookup id",
			field: runtimeFieldPlan{ColumnName: "lookup_id", Kind: "db_lookup", Supported: true},
			want:  "bigint",
		},
		{
			name:  "multi value is not scalar",
			field: runtimeFieldPlan{ColumnName: "tags", Kind: "multi_select", MultiValue: true, Supported: true},
			want:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := managedRuntimeFieldPhysicalType(tt.field); got != tt.want {
				t.Fatalf("managedRuntimeFieldPhysicalType() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestMissingManagedRuntimeScalarFieldsReturnsAllAbsentScalarColumns(t *testing.T) {
	scope := runtimeRootScopePlan{
		Fields: []runtimeFieldPlan{
			{ColumnName: "catalog", FieldID: "short-text", Kind: "short_text", Supported: true},
			{ColumnName: "answer_options", FieldID: "short-text-3", Kind: "short_text", Supported: true},
			{ColumnName: "answer_required", FieldID: "boolean-2", Kind: "boolean", Supported: true},
			{ColumnName: "visible_when", FieldID: "long-text", Kind: "long_text", Supported: true},
			{ColumnName: "tags", FieldID: "multi-select", Kind: "multi_select", MultiValue: true, Supported: true},
		},
	}

	fields := missingManagedRuntimeScalarFields(scope, map[string]struct{}{
		"catalog": {},
	})

	got := make([]string, 0, len(fields))
	for _, field := range fields {
		got = append(got, field.ColumnName)
	}
	want := []string{"answer_options", "answer_required", "visible_when"}
	if len(got) != len(want) {
		t.Fatalf("missing fields = %#v, want %#v", got, want)
	}
	for index := range want {
		if got[index] != want[index] {
			t.Fatalf("missing fields = %#v, want %#v", got, want)
		}
	}
}
