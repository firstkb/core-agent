package platformstudioformruntime

import (
	"context"
	"sort"
	"strconv"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	dictionary "dtriton.com/platform/backend/modules/tenant/dictionary"
)

const (
	checklistDefaultGroupID    = "default"
	checklistMatrixPageSize    = 200
	checklistMatrixMaxPageRead = 50
)

type runtimeChecklistSavedRow struct {
	DocGuid     string
	Notes       string
	Revision    string
	SourceID    int64
	SourceValue string
	Value       string
	Values      map[string]any
}

type runtimeChecklistMatrixOption struct {
	Active      bool
	Description string
	Fields      map[string]string
	Label       string
	Value       string
}

func (s *Service) attachChecklistMatrices(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	scope runtimeRootScopePlan,
	response *RuntimeViewFormResponse,
	parentDocGuid string,
) error {
	for _, subformScope := range scope.SubformScopes {
		if !subformScopeSupportsChecklist(subformScope) {
			continue
		}
		matrix, err := s.buildChecklistMatrix(ctx, tenant, scope, subformScope, parentDocGuid)
		if err != nil {
			return err
		}
		if response.Subforms == nil {
			response.Subforms = map[string]RuntimeViewSubformResponse{}
		}
		response.Subforms[subformScope.ScopeID] = RuntimeViewSubformResponse{
			Checklist: matrix,
			Kind:      "checklist",
		}
	}
	return nil
}

func (s *Service) buildChecklistMatrix(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
) (*RuntimeViewChecklistData, error) {
	config := subformScope.ChecklistConfig
	lookupField := findField(rootScopeFromSubform(rootScope, subformScope), config.LookupFieldID)
	resultField := findField(rootScopeFromSubform(rootScope, subformScope), config.ResultFieldID)
	if lookupField == nil || resultField == nil {
		return &RuntimeViewChecklistData{Groups: []RuntimeViewChecklistGroup{}}, nil
	}

	savedRows, err := s.loadChecklistSavedRows(ctx, tenant, rootScope, subformScope, parentDocGuid)
	if err != nil {
		return nil, err
	}
	savedBySourceValue := map[string]runtimeChecklistSavedRow{}
	savedSourceValues := make([]string, 0, len(savedRows))
	for _, row := range savedRows {
		sourceValue := strings.TrimSpace(row.SourceValue)
		if sourceValue == "" {
			continue
		}
		savedBySourceValue[sourceValue] = row
		savedSourceValues = append(savedSourceValues, sourceValue)
	}

	optionsByValue := map[string]runtimeChecklistMatrixOption{}
	activeOptions, err := s.loadChecklistOptions(ctx, *lookupField, nil, true)
	if err != nil {
		return nil, err
	}
	for _, option := range activeOptions {
		optionsByValue[option.Value] = option
	}

	savedOptions, err := s.loadChecklistOptions(ctx, *lookupField, savedSourceValues, false)
	if err != nil {
		return nil, err
	}
	for _, option := range savedOptions {
		if existing, ok := optionsByValue[option.Value]; ok && existing.Active {
			continue
		}
		optionsByValue[option.Value] = option
	}

	for _, sourceValue := range savedSourceValues {
		if _, ok := optionsByValue[sourceValue]; !ok {
			optionsByValue[sourceValue] = runtimeChecklistMatrixOption{
				Active: false,
				Label:  sourceValue,
				Value:  sourceValue,
			}
		}
	}

	groups := []RuntimeViewChecklistGroup{}
	groupIndexByID := map[string]int{}
	for _, option := range sortedChecklistOptions(optionsByValue, *lookupField, subformScope.ChecklistConfig) {
		groupID, groupTitle, itemLabel := checklistOptionGroupAndLabel(*lookupField, subformScope.ChecklistConfig, option)
		if groupID == "" {
			groupID = checklistDefaultGroupID
		}
		if _, ok := groupIndexByID[groupID]; !ok {
			groupIndexByID[groupID] = len(groups)
			groups = append(groups, RuntimeViewChecklistGroup{
				ID:    groupID,
				Items: []RuntimeViewChecklistItem{},
				Title: groupTitle,
			})
		}

		savedRow, saved := savedBySourceValue[option.Value]
		item := RuntimeViewChecklistItem{
			Active:          option.Active,
			AnswerOptions:   checklistAnswerOptions(*resultField, option.Fields),
			Description:     option.Description,
			GroupID:         groupID,
			GroupTitle:      groupTitle,
			InactiveSaved:   saved && !option.Active,
			Label:           chooseString(itemLabel, option.Label),
			Notes:           savedRow.Notes,
			Required:        checklistItemRequired(*resultField, option.Fields),
			SavedRowDocGuid: savedRow.DocGuid,
			SourceValue:     option.Value,
			Value:           savedRow.Value,
			Values:          savedRow.Values,
			VisibleWhen:     strings.TrimSpace(option.Fields["visible_when"]),
		}
		index := groupIndexByID[groupID]
		groups[index].Items = append(groups[index].Items, item)
	}

	return &RuntimeViewChecklistData{Groups: groups}, nil
}

func (s *Service) loadChecklistSavedRows(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
) ([]runtimeChecklistSavedRow, error) {
	if strings.TrimSpace(parentDocGuid) == "" {
		return []runtimeChecklistSavedRow{}, nil
	}
	return s.repo.LoadChecklistRows(ctx, tenant, rootScope, subformScope, parentDocGuid)
}

func (s *Service) loadChecklistOptions(
	ctx context.Context,
	field runtimeFieldPlan,
	ids []string,
	includeFilters bool,
) ([]runtimeChecklistMatrixOption, error) {
	if s.lookupOptions == nil {
		return []runtimeChecklistMatrixOption{}, nil
	}
	req, ok := lookupOptionsRequestForField(field, normalizeRuntimeStringArray(ids))
	if !ok {
		return []runtimeChecklistMatrixOption{}, nil
	}
	if !includeFilters {
		req.Filters = nil
	}
	baseDisplayFields := append([]string(nil), req.DisplayFields...)
	req.DisplayFields = mergeChecklistDisplayFields(req.DisplayFields)

	options, err := s.loadChecklistOptionsWithRequest(ctx, req, ids, includeFilters)
	if err == nil {
		return options, nil
	}
	if !sameStringSlice(baseDisplayFields, req.DisplayFields) {
		req.DisplayFields = baseDisplayFields
		fallbackOptions, fallbackErr := s.loadChecklistOptionsWithRequest(ctx, req, ids, includeFilters)
		if fallbackErr == nil {
			return fallbackOptions, nil
		}
	}
	return nil, err
}

func (s *Service) loadChecklistOptionsWithRequest(
	ctx context.Context,
	req dictionary.OptionsRequest,
	ids []string,
	includeFilters bool,
) ([]runtimeChecklistMatrixOption, error) {
	if len(ids) > 0 {
		req.Page = 1
		req.PageSize = len(ids)
		response, err := s.lookupOptions.ListOptions(ctx, req)
		if err != nil {
			return nil, err
		}
		return checklistOptionsFromDictionaryResponse(response, includeFilters), nil
	}

	out := []runtimeChecklistMatrixOption{}
	for page := 1; page <= checklistMatrixMaxPageRead; page++ {
		req.Page = page
		req.PageSize = checklistMatrixPageSize
		response, err := s.lookupOptions.ListOptions(ctx, req)
		if err != nil {
			return nil, err
		}
		out = append(out, checklistOptionsFromDictionaryResponse(response, includeFilters)...)
		if response == nil || !response.HasMore {
			break
		}
	}
	return out, nil
}

func sameStringSlice(left []string, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}

func mergeChecklistDisplayFields(displayFields []string) []string {
	out := append([]string(nil), displayFields...)
	seen := map[string]struct{}{}
	for _, field := range out {
		seen[strings.TrimSpace(field)] = struct{}{}
	}
	for _, field := range []string{"answer_options", "answer_required", "visible_when"} {
		if _, ok := seen[field]; ok {
			continue
		}
		out = append(out, field)
	}
	return out
}

func checklistOptionsFromDictionaryResponse(response *dictionary.OptionsResponse, active bool) []runtimeChecklistMatrixOption {
	if response == nil {
		return []runtimeChecklistMatrixOption{}
	}
	out := make([]runtimeChecklistMatrixOption, 0, len(response.Items))
	for _, item := range response.Items {
		value := strings.TrimSpace(item.Value)
		if value == "" {
			continue
		}
		out = append(out, runtimeChecklistMatrixOption{
			Active:      active,
			Description: strings.TrimSpace(item.Description),
			Fields:      normalizeRuntimeStringMap(item.Fields),
			Label:       strings.TrimSpace(item.Label),
			Value:       value,
		})
	}
	return out
}

func sortedChecklistOptions(
	optionsByValue map[string]runtimeChecklistMatrixOption,
	lookupField runtimeFieldPlan,
	config runtimeChecklistConfig,
) []runtimeChecklistMatrixOption {
	out := make([]runtimeChecklistMatrixOption, 0, len(optionsByValue))
	for _, option := range optionsByValue {
		out = append(out, option)
	}
	sort.SliceStable(out, func(leftIndex int, rightIndex int) bool {
		left := out[leftIndex]
		right := out[rightIndex]
		leftOrder, leftHasOrder := checklistOptionOrder(left)
		rightOrder, rightHasOrder := checklistOptionOrder(right)
		if leftHasOrder && rightHasOrder && leftOrder != rightOrder {
			return leftOrder < rightOrder
		}
		if leftHasOrder != rightHasOrder {
			return leftHasOrder
		}
		leftGroup, leftTitle, leftLabel := checklistOptionGroupAndLabel(lookupField, config, left)
		rightGroup, rightTitle, rightLabel := checklistOptionGroupAndLabel(lookupField, config, right)
		leftKey := strings.ToLower(leftGroup) + "\x00" + strings.ToLower(leftTitle) + "\x00" + strings.ToLower(leftLabel) + "\x00" + left.Value
		rightKey := strings.ToLower(rightGroup) + "\x00" + strings.ToLower(rightTitle) + "\x00" + strings.ToLower(rightLabel) + "\x00" + right.Value
		return leftKey < rightKey
	})
	return out
}

func checklistOptionGroupAndLabel(
	lookupField runtimeFieldPlan,
	config runtimeChecklistConfig,
	option runtimeChecklistMatrixOption,
) (string, string, string) {
	displayFields := checklistEffectiveDisplayFields(lookupField.LookupDisplayFields)
	if !shouldGroupChecklistOptions(config, displayFields) {
		itemLabel := checklistOptionLabelFromFields(option, displayFields)
		return checklistDefaultGroupID, "", chooseString(itemLabel, strings.TrimSpace(option.Label))
	}

	firstDisplayField := ""
	itemLabel := ""
	if len(displayFields) > 0 {
		firstDisplayField = displayFields[0]
	}
	groupTitle := strings.TrimSpace(option.Fields[firstDisplayField])
	if len(displayFields) > 1 {
		parts := make([]string, 0, len(displayFields)-1)
		for _, field := range displayFields[1:] {
			parts = append(parts, strings.TrimSpace(option.Fields[field]))
		}
		itemLabel = joinNonEmptyChecklistLabels(parts)
	}

	if groupTitle == "" {
		groupTitle, itemLabel = splitChecklistLabel(option.Label)
	}
	if itemLabel == "" {
		itemLabel = strings.TrimSpace(option.Label)
	}
	return normalizeStableKey(chooseString(groupTitle, checklistDefaultGroupID)), groupTitle, itemLabel
}

func shouldGroupChecklistOptions(config runtimeChecklistConfig, displayFields []string) bool {
	return config.Grouping == "by_first_display_field" || len(displayFields) > 1
}

func checklistEffectiveDisplayFields(displayFields []string) []string {
	out := make([]string, 0, len(displayFields))
	for _, field := range displayFields {
		field = strings.TrimSpace(field)
		if field == "" || isChecklistIdentityDisplayField(field) {
			continue
		}
		out = append(out, field)
	}
	return out
}

func isChecklistIdentityDisplayField(field string) bool {
	switch strings.ToLower(strings.TrimSpace(field)) {
	case "_id", "id", "doc_id", "docid", "doc_guid", "docguid", "_guid", "guid":
		return true
	default:
		return false
	}
}

func checklistOptionLabelFromFields(option runtimeChecklistMatrixOption, displayFields []string) string {
	parts := make([]string, 0, len(displayFields))
	for _, field := range displayFields {
		parts = append(parts, strings.TrimSpace(option.Fields[field]))
	}
	return joinNonEmptyChecklistLabels(parts)
}

func checklistOptionOrder(option runtimeChecklistMatrixOption) (int64, bool) {
	value := strings.TrimSpace(option.Fields["order"])
	if value == "" {
		return 0, false
	}
	order, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, false
	}
	return order, true
}

func joinNonEmptyChecklistLabels(parts []string) string {
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		out = append(out, part)
	}
	return strings.Join(out, ", ")
}

func splitChecklistLabel(label string) (string, string) {
	for _, delimiter := range []string{",", " / ", " - "} {
		parts := strings.SplitN(label, delimiter, 2)
		if len(parts) == 2 {
			return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
		}
	}
	return "", strings.TrimSpace(label)
}

func checklistAnswerOptions(resultField runtimeFieldPlan, fields map[string]string) []RuntimeViewChecklistOption {
	rawOptions := splitChecklistAnswerOptions(fields["answer_options"])
	if len(rawOptions) == 0 {
		rawOptions = append([]string(nil), resultField.OptionValue...)
	}
	out := make([]RuntimeViewChecklistOption, 0, len(rawOptions))
	for index, value := range rawOptions {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		out = append(out, RuntimeViewChecklistOption{
			Label:        chooseString(resultField.OptionLabel[value], value),
			StyleVariant: checklistOptionStyleVariant(index, value),
			Value:        value,
		})
	}
	return out
}

func splitChecklistAnswerOptions(value string) []string {
	value = strings.TrimSpace(value)
	if value == "" {
		return []string{}
	}
	delimiter := "|"
	if !strings.Contains(value, "|") && strings.Contains(value, ",") {
		delimiter = ","
	}
	parts := strings.Split(value, delimiter)
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if normalized := strings.TrimSpace(part); normalized != "" {
			out = append(out, normalized)
		}
	}
	return out
}

func checklistItemRequired(resultField runtimeFieldPlan, fields map[string]string) bool {
	if resultField.Required {
		return true
	}
	switch strings.ToLower(strings.TrimSpace(fields["answer_required"])) {
	case "1", "true", "yes", "y":
		return true
	default:
		return false
	}
}

func checklistOptionStyleVariant(index int, value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "yes", "pass", "passed", "complete", "completed":
		return "success"
	case "no", "fail", "failed":
		return "warning"
	case "n/a", "na":
		return "secondary"
	}
	switch index {
	case 0:
		return "success"
	case 1:
		return "warning"
	default:
		return "secondary"
	}
}

func normalizeRuntimeStringMap(values map[string]string) map[string]string {
	out := map[string]string{}
	for key, value := range values {
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if key != "" && value != "" {
			out[key] = value
		}
	}
	return out
}
