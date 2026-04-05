package collectiontable

import (
	"strings"
	"time"
)

func MatchString(fieldValue, operator, target string) (bool, error) {
	normalizedField := strings.TrimSpace(strings.ToLower(fieldValue))
	normalizedTarget := strings.TrimSpace(strings.ToLower(target))

	switch operator {
	case "contains":
		return strings.Contains(normalizedField, normalizedTarget), nil
	case "is_equal_to":
		return normalizedField == normalizedTarget, nil
	case "is_not_equal_to":
		return normalizedField != normalizedTarget, nil
	case "is_empty":
		return normalizedField == "", nil
	case "is_not_empty":
		return normalizedField != "", nil
	default:
		return false, ErrInvalidQuery
	}
}

func MatchDate(field time.Time, operator, value string) (bool, error) {
	if field.IsZero() {
		switch operator {
		case "is_empty":
			return true, nil
		case "is_not_empty":
			return false, nil
		default:
			return false, nil
		}
	}

	if operator == "is_empty" {
		return false, nil
	}
	if operator == "is_not_empty" {
		return true, nil
	}

	target, err := time.Parse("2006-01-02", strings.TrimSpace(value))
	if err != nil {
		return false, ErrInvalidQuery
	}

	fieldDate := time.Date(field.Year(), field.Month(), field.Day(), 0, 0, 0, 0, time.UTC)
	targetDate := time.Date(target.Year(), target.Month(), target.Day(), 0, 0, 0, 0, time.UTC)

	switch operator {
	case "is_equal_to":
		return fieldDate.Equal(targetDate), nil
	case "is_less_than":
		return fieldDate.Before(targetDate), nil
	case "is_less_or_equal_to":
		return fieldDate.Before(targetDate) || fieldDate.Equal(targetDate), nil
	case "is_greater_than":
		return fieldDate.After(targetDate), nil
	case "is_greater_or_equal_to":
		return fieldDate.After(targetDate) || fieldDate.Equal(targetDate), nil
	default:
		return false, ErrInvalidQuery
	}
}
