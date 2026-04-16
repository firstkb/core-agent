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

func MatchQuickFilters(filters []QuickFilter, match func(QuickFilter) (bool, error)) (bool, error) {
	if len(filters) == 0 {
		return true, nil
	}

	for _, group := range groupQuickFilters(filters) {
		groupMatched := false

		for _, filter := range group {
			matched, err := match(filter)
			if err != nil {
				return false, err
			}
			if matched {
				groupMatched = true
				break
			}
		}

		if !groupMatched {
			return false, nil
		}
	}

	return true, nil
}

func groupQuickFilters(filters []QuickFilter) [][]QuickFilter {
	groups := make([][]QuickFilter, 0, len(filters))
	containsGroupIndexes := make(map[string]int)

	for _, filter := range filters {
		fieldID := strings.TrimSpace(filter.FieldID)
		operator := strings.TrimSpace(filter.Operator)
		value := strings.TrimSpace(filter.Value)
		normalizedFilter := QuickFilter{
			FieldID:  fieldID,
			Operator: operator,
			Value:    value,
		}

		if operator == "contains" {
			groupKey := fieldID + "\x00" + operator
			if existingIndex, ok := containsGroupIndexes[groupKey]; ok {
				groups[existingIndex] = append(groups[existingIndex], normalizedFilter)
				continue
			}

			containsGroupIndexes[groupKey] = len(groups)
		}

		groups = append(groups, []QuickFilter{normalizedFilter})
	}

	return groups
}
