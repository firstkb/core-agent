package dictionary

import (
	"strings"
	"testing"
)

func TestOptionsSourceSupportsPresetLookupFilterColumns(t *testing.T) {
	tests := []struct {
		dictionary string
		field      string
		sourceSQL  string
	}{
		{
			dictionary: "contacts",
			field:      "job_type_id",
			sourceSQL:  "job_type_id AS job_type_id",
		},
		{
			dictionary: "contacts",
			field:      "company_id",
			sourceSQL:  "company_id AS company_id",
		},
		{
			dictionary: "companies",
			field:      "company_type_id",
			sourceSQL:  "company_type_id AS company_type_id",
		},
		{
			dictionary: "companies",
			field:      "main_company_id",
			sourceSQL:  "main_company_id AS main_company_id",
		},
		{
			dictionary: "projects",
			field:      "company_id",
			sourceSQL:  "company_id AS company_id",
		},
	}

	for _, test := range tests {
		t.Run(test.dictionary+"/"+test.field, func(t *testing.T) {
			source, _, filterColumns, err := optionsSource(test.dictionary)
			if err != nil {
				t.Fatalf("optionsSource returned error: %v", err)
			}
			if !strings.Contains(source, test.sourceSQL) {
				t.Fatalf("source SQL does not expose %q:\n%s", test.sourceSQL, source)
			}

			args := []any{}
			clause, err := genericFilterClause(LookupFilter{
				Field:    test.field,
				Operator: "in",
				Value:    []string{"2", "3"},
			}, filterColumns, &args)
			if err != nil {
				t.Fatalf("genericFilterClause returned error: %v", err)
			}
			if !strings.Contains(clause, `"`+test.field+`"::text = ANY($1)`) {
				t.Fatalf("filter clause = %q, want %s ANY($1)", clause, test.field)
			}
			if len(args) != 1 {
				t.Fatalf("args = %#v, want one argument", args)
			}
		})
	}
}

func TestOptionsSourceRejectsUnsupportedNamedFilterColumn(t *testing.T) {
	_, _, filterColumns, err := optionsSource("contacts")
	if err != nil {
		t.Fatalf("optionsSource returned error: %v", err)
	}

	args := []any{}
	_, err = genericFilterClause(LookupFilter{
		Field:    "company_type_id",
		Operator: "eq",
		Value:    "2",
	}, filterColumns, &args)
	if err == nil {
		t.Fatal("genericFilterClause returned nil error, want invalid dictionary")
	}
}
