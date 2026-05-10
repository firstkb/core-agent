package platformstudioformruntime

import (
	"context"
	"database/sql"
	"fmt"
)

func runtimeRelationColumnsTx(ctx context.Context, tx *sql.Tx, relationName string) (map[string]struct{}, error) {
	rows, err := tx.QueryContext(ctx, `
SELECT a.attname
  FROM pg_attribute a
  JOIN pg_class c
    ON c.oid = a.attrelid
  JOIN pg_namespace n
    ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relname = $1
   AND a.attnum > 0
   AND NOT a.attisdropped`, relationName)
	if err != nil {
		return nil, fmt.Errorf("form runtime: relation columns lookup %s: %w", relationName, err)
	}
	defer rows.Close()

	columnSet := make(map[string]struct{})
	for rows.Next() {
		var columnName string
		if err := rows.Scan(&columnName); err != nil {
			return nil, fmt.Errorf("form runtime: scan relation column for %s: %w", relationName, err)
		}
		columnSet[normalizeString(columnName)] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form runtime: relation column rows %s: %w", relationName, err)
	}
	return columnSet, nil
}
