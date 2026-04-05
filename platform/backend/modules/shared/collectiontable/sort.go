package collectiontable

import (
	"strings"
	"time"
)

const (
	SortDirectionAsc  = "asc"
	SortDirectionDesc = "desc"
)

func NormalizeSortDirection(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), SortDirectionDesc) {
		return SortDirectionDesc
	}
	return SortDirectionAsc
}

func ValidateSortField(fieldID string, fields []FieldDefinition) error {
	trimmed := strings.TrimSpace(fieldID)
	if trimmed == "" {
		return nil
	}

	for _, field := range fields {
		if strings.TrimSpace(field.ID) != trimmed {
			continue
		}
		if field.Sortable {
			return nil
		}
		return ErrInvalidQuery
	}

	return ErrInvalidQuery
}

func CompareStrings(left, right, direction string) bool {
	l := strings.ToLower(strings.TrimSpace(left))
	r := strings.ToLower(strings.TrimSpace(right))
	if NormalizeSortDirection(direction) == SortDirectionDesc {
		return l > r
	}
	return l < r
}

func CompareInts(left, right int, direction string) bool {
	if NormalizeSortDirection(direction) == SortDirectionDesc {
		return left > right
	}
	return left < right
}

func CompareTimes(left, right time.Time, direction string) bool {
	if NormalizeSortDirection(direction) == SortDirectionDesc {
		return left.After(right)
	}
	return left.Before(right)
}
