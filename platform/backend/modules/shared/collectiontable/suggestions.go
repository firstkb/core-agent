package collectiontable

import (
	"sort"
	"strings"
)

const SuggestionGroupLimit = 10

func BuildSuggestionGroup[T any](fieldID, label string, rows []T, values func(T) []string) SearchSuggestionGroup {
	counts := make(map[string]int)
	for _, row := range rows {
		for _, value := range values(row) {
			trimmed := strings.TrimSpace(value)
			if trimmed == "" {
				continue
			}
			counts[trimmed]++
		}
	}

	items := make([]SearchSuggestionItem, 0, len(counts))
	for value, count := range counts {
		items = append(items, SearchSuggestionItem{
			Value: value,
			Count: count,
		})
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].Count != items[j].Count {
			return items[i].Count > items[j].Count
		}
		return strings.ToLower(items[i].Value) < strings.ToLower(items[j].Value)
	})

	if len(items) > SuggestionGroupLimit {
		items = items[:SuggestionGroupLimit]
	}

	return SearchSuggestionGroup{
		FieldID: fieldID,
		Label:   label,
		Items:   items,
	}
}
