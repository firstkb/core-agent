package collectiontable

import "strings"

func ValidateQuickFilters(filters []QuickFilter) error {
	for _, filter := range filters {
		fieldID := strings.TrimSpace(filter.FieldID)
		operator := strings.TrimSpace(filter.Operator)
		if fieldID == "" || operator == "" {
			return ErrInvalidQuery
		}
		switch operator {
		case "contains", "is_equal_to", "is_not_equal_to", "is_empty", "is_not_empty", "is_less_than", "is_less_or_equal_to", "is_greater_than", "is_greater_or_equal_to":
		default:
			return ErrInvalidQuery
		}
		if FilterRequiresValue(operator) && strings.TrimSpace(filter.Value) == "" {
			return ErrInvalidQuery
		}
	}
	return nil
}

func ValidateQueryRequest(req QueryRequest, fields []FieldDefinition) error {
	if err := ValidateQuickFilters(req.QuickFilters); err != nil {
		return err
	}
	if err := ValidateSortField(req.Sort.ColumnID, fields); err != nil {
		return err
	}
	return nil
}

func FilterRequiresValue(operator string) bool {
	return operator != "is_empty" && operator != "is_not_empty"
}

func NormalizePageSize(value int, allowed []int, fallback int) int {
	for _, candidate := range allowed {
		if candidate == value {
			return value
		}
	}
	return fallback
}

func TotalPageCount(totalItems, pageSize int) int {
	if totalItems <= 0 || pageSize <= 0 {
		return 1
	}
	totalPages := totalItems / pageSize
	if totalItems%pageSize != 0 {
		totalPages++
	}
	if totalPages <= 0 {
		return 1
	}
	return totalPages
}
