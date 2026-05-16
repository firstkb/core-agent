package platformstudioformruntime

import (
	"errors"
	"fmt"
	"strings"

	"github.com/lib/pq"
)

const (
	postgresNotNullViolationCode = "23502"
	postgresUniqueViolationCode  = "23505"
)

type runtimeMutationConstraintError struct {
	cause      error
	code       string
	columnName string
}

func (e *runtimeMutationConstraintError) Error() string {
	if e == nil {
		return ""
	}
	if e.columnName != "" {
		return fmt.Sprintf("runtime mutation constraint %s on column %s", e.code, e.columnName)
	}
	return fmt.Sprintf("runtime mutation constraint %s", e.code)
}

func (e *runtimeMutationConstraintError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.cause
}

func isUniqueViolation(err error) bool {
	var pqErr *pq.Error
	return errors.As(err, &pqErr) && pqErr.Code == postgresUniqueViolationCode
}

func runtimeMutationConstraintErrorFromDatabase(err error) *runtimeMutationConstraintError {
	var pqErr *pq.Error
	if !errors.As(err, &pqErr) {
		return nil
	}
	if pqErr.Code != postgresNotNullViolationCode {
		return nil
	}
	columnName := strings.TrimSpace(pqErr.Column)
	if columnName == "" {
		return nil
	}
	return &runtimeMutationConstraintError{
		cause:      err,
		code:       string(pqErr.Code),
		columnName: columnName,
	}
}

func wrapRuntimeMutationDatabaseError(operation string, err error) error {
	if constraintErr := runtimeMutationConstraintErrorFromDatabase(err); constraintErr != nil {
		return fmt.Errorf("form runtime: %s: %w", operation, constraintErr)
	}
	return fmt.Errorf("form runtime: %s: %w", operation, err)
}
