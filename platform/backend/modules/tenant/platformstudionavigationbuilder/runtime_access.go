package platformstudionavigationbuilder

import (
	"net/url"
	"sort"
	"strings"
)

type runtimeNavigationUserContext struct {
	Authenticated bool
	IsRoot        bool
	UserID        string
	CompanyID     string
	CompanyTypeID string
	JobTypeID     string
}

type runtimeNavigationState struct {
	User runtimeNavigationUserContext

	Items    []derivedNavigationItem
	Policies []derivedNavigationAccessPolicy
	Subjects []derivedNavigationAccessSubject
}

type navigationOwnerKey struct {
	OwnerType string
	OwnerID   string
}

type navigationAccessSubjectSet struct {
	Users        map[string]struct{}
	Companies    map[string]struct{}
	CompanyTypes map[string]struct{}
	JobTypes     map[string]struct{}
}

type runtimeNavigationAccessIndex struct {
	Policies map[navigationOwnerKey]string
	Subjects map[navigationOwnerKey]navigationAccessSubjectSet
}

func buildRuntimeNavigationResponse(state runtimeNavigationState) RuntimeNavigationResponse {
	index := buildRuntimeNavigationAccessIndex(state.Policies, state.Subjects)
	appChildren := buildRuntimeNavigationChildren(state.Items, navigationOwnerTypeAppMenuItem)
	appMenu := filterRuntimeAppMenuItems("", appChildren, index, state.User, true)

	utilityRail, utilityRailConfigured := filterRuntimeUtilityRailItems(state, index)

	return RuntimeNavigationResponse{
		Items:                 appMenu,
		UtilityRail:           utilityRail,
		UtilityRailConfigured: utilityRailConfigured,
		CreateActions:         buildRuntimeCreateActions(appMenu),
	}
}

func buildRuntimeNavigationAccessIndex(
	policies []derivedNavigationAccessPolicy,
	subjects []derivedNavigationAccessSubject,
) runtimeNavigationAccessIndex {
	index := runtimeNavigationAccessIndex{
		Policies: make(map[navigationOwnerKey]string, len(policies)),
		Subjects: make(map[navigationOwnerKey]navigationAccessSubjectSet),
	}

	for _, policy := range policies {
		key := navigationOwnerKey{
			OwnerType: strings.TrimSpace(policy.OwnerType),
			OwnerID:   strings.TrimSpace(policy.OwnerID),
		}
		if key.OwnerType == "" || key.OwnerID == "" {
			continue
		}
		index.Policies[key] = normalizeNavigationAccessMode(policy.Mode)
	}

	for _, subject := range subjects {
		key := navigationOwnerKey{
			OwnerType: strings.TrimSpace(subject.OwnerType),
			OwnerID:   strings.TrimSpace(subject.OwnerID),
		}
		if key.OwnerType == "" || key.OwnerID == "" {
			continue
		}

		set := index.Subjects[key]
		subjectID := strings.TrimSpace(subject.SubjectID)
		if subjectID == "" {
			continue
		}
		switch strings.TrimSpace(subject.SubjectType) {
		case navigationAccessSubjectTypeUser:
			if set.Users == nil {
				set.Users = map[string]struct{}{}
			}
			set.Users[subjectID] = struct{}{}
		case navigationAccessSubjectTypeCompany:
			if set.Companies == nil {
				set.Companies = map[string]struct{}{}
			}
			set.Companies[subjectID] = struct{}{}
		case navigationAccessSubjectTypeCompanyType:
			if set.CompanyTypes == nil {
				set.CompanyTypes = map[string]struct{}{}
			}
			set.CompanyTypes[subjectID] = struct{}{}
		case navigationAccessSubjectTypeJobType:
			if set.JobTypes == nil {
				set.JobTypes = map[string]struct{}{}
			}
			set.JobTypes[subjectID] = struct{}{}
		}
		index.Subjects[key] = set
	}

	return index
}

func buildRuntimeNavigationChildren(items []derivedNavigationItem, ownerType string) map[string][]derivedNavigationItem {
	children := map[string][]derivedNavigationItem{}
	for _, item := range items {
		if item.OwnerType != ownerType {
			continue
		}
		parentID := strings.TrimSpace(item.ParentItemID)
		children[parentID] = append(children[parentID], item)
	}

	for parentID := range children {
		sort.SliceStable(children[parentID], func(i int, j int) bool {
			left := children[parentID][i]
			right := children[parentID][j]
			if left.SortOrder != right.SortOrder {
				return left.SortOrder < right.SortOrder
			}
			return left.ItemID < right.ItemID
		})
	}
	return children
}

func filterRuntimeAppMenuItems(
	parentID string,
	children map[string][]derivedNavigationItem,
	index runtimeNavigationAccessIndex,
	user runtimeNavigationUserContext,
	parentAllowed bool,
) []RuntimeNavigationItem {
	items := []RuntimeNavigationItem{}

	for _, record := range children[parentID] {
		if !record.Active {
			continue
		}

		allowed := parentAllowed && runtimeNavigationItemAllowed(record, index, user)
		if !allowed {
			continue
		}

		childItems := filterRuntimeAppMenuItems(record.ItemID, children, index, user, allowed)
		item := runtimeNavigationItemFromDerived(record, childItems)
		if shouldExposeRuntimeNavigationItem(item, record.NodeType) {
			items = append(items, item)
		}
	}

	return suppressEmptyRuntimeMenuTitles(items)
}

func runtimeNavigationAppMenuTargetAllowed(state runtimeNavigationState, target RuntimeTargetAccessRequest) bool {
	index := buildRuntimeNavigationAccessIndex(state.Policies, state.Subjects)
	children := buildRuntimeNavigationChildren(state.Items, navigationOwnerTypeAppMenuItem)
	return runtimeNavigationAppMenuTargetAllowedFromParent("", children, index, state.User, true, target)
}

func runtimeNavigationAppMenuTargetAllowedFromParent(
	parentID string,
	children map[string][]derivedNavigationItem,
	index runtimeNavigationAccessIndex,
	user runtimeNavigationUserContext,
	parentAllowed bool,
	target RuntimeTargetAccessRequest,
) bool {
	for _, record := range children[parentID] {
		if !record.Active {
			continue
		}

		allowed := parentAllowed && runtimeNavigationItemAllowed(record, index, user)
		if !allowed {
			continue
		}

		if runtimeNavigationItemMatchesTarget(record, target) {
			return true
		}

		if runtimeNavigationAppMenuTargetAllowedFromParent(record.ItemID, children, index, user, allowed, target) {
			return true
		}
	}

	return false
}

func runtimeNavigationItemMatchesTarget(record derivedNavigationItem, target RuntimeTargetAccessRequest) bool {
	switch target.TargetType {
	case TargetTypeFormView:
		return record.TargetType == TargetTypeFormView &&
			strings.TrimSpace(record.TargetModelID) == target.ModelID &&
			strings.TrimSpace(record.TargetViewID) == target.ViewID
	case TargetTypeAppPage:
		if record.TargetType != TargetTypeAppPage {
			return false
		}
		if target.PageID != "" && strings.TrimSpace(record.TargetPageID) == target.PageID {
			return true
		}
		if target.Route != "" {
			return strings.TrimSpace(record.TargetRoute) == target.Route ||
				strings.TrimSpace(record.TargetPath) == target.Route
		}
		return false
	default:
		return false
	}
}

func filterRuntimeUtilityRailItems(
	state runtimeNavigationState,
	index runtimeNavigationAccessIndex,
) ([]RuntimeNavigationItem, bool) {
	records := make([]derivedNavigationItem, 0)
	for _, item := range state.Items {
		if item.OwnerType == navigationOwnerTypeUtilityRailItem {
			records = append(records, item)
		}
	}
	sort.SliceStable(records, func(i int, j int) bool {
		if records[i].SortOrder != records[j].SortOrder {
			return records[i].SortOrder < records[j].SortOrder
		}
		return records[i].ItemID < records[j].ItemID
	})

	items := make([]RuntimeNavigationItem, 0, len(records))
	for _, record := range records {
		if !record.Active {
			continue
		}
		if !runtimeNavigationItemAllowed(record, index, state.User) {
			continue
		}
		items = append(items, runtimeNavigationItemFromDerived(record, nil))
	}

	return items, len(records) > 0
}

func runtimeNavigationUtilityRailTargetAllowed(state runtimeNavigationState, utilityKey string) (bool, bool) {
	index := buildRuntimeNavigationAccessIndex(state.Policies, state.Subjects)
	utilityKey = strings.TrimSpace(utilityKey)
	configured := false

	for _, record := range state.Items {
		if record.OwnerType != navigationOwnerTypeUtilityRailItem {
			continue
		}
		configured = true
		if !runtimeNavigationUtilityRailItemMatches(record, utilityKey) {
			continue
		}
		if !record.Active {
			return false, configured
		}
		return runtimeNavigationItemAllowed(record, index, state.User), configured
	}

	return false, configured
}

func runtimeNavigationUtilityRailItemMatches(record derivedNavigationItem, utilityKey string) bool {
	if utilityKey == "" {
		return false
	}
	itemID := strings.TrimSpace(record.ItemID)
	return itemID == utilityKey ||
		strings.TrimPrefix(itemID, "rail.") == utilityKey ||
		strings.TrimSpace(record.TargetRoute) == utilityKey
}

func runtimeNavigationItemAllowed(
	item derivedNavigationItem,
	index runtimeNavigationAccessIndex,
	user runtimeNavigationUserContext,
) bool {
	if user.IsRoot {
		return true
	}

	key := navigationOwnerKey{OwnerType: item.OwnerType, OwnerID: item.ItemID}
	mode := normalizeNavigationAccessMode(index.Policies[key])
	subjects := index.Subjects[key]

	switch mode {
	case NavigationAccessModeAllAuthenticated:
		return user.Authenticated
	case NavigationAccessModeRootOnly:
		return false
	case NavigationAccessModeSelectedOnly:
		return user.Authenticated && subjects.Match(user)
	case NavigationAccessModeEveryoneExcept:
		return user.Authenticated && !subjects.Match(user)
	default:
		return user.Authenticated
	}
}

func (subjects navigationAccessSubjectSet) Match(user runtimeNavigationUserContext) bool {
	if !user.Authenticated {
		return false
	}

	hasUsers := len(subjects.Users) > 0
	hasAudience := len(subjects.Companies) > 0 ||
		len(subjects.CompanyTypes) > 0 ||
		len(subjects.JobTypes) > 0
	if !hasUsers && !hasAudience {
		return false
	}

	if hasUsers && containsNavigationSubject(subjects.Users, user.UserID) {
		return true
	}
	if !hasAudience {
		return false
	}

	companyScopeMatches := true
	if len(subjects.Companies) > 0 || len(subjects.CompanyTypes) > 0 {
		companyScopeMatches =
			containsNavigationSubject(subjects.Companies, user.CompanyID) ||
				containsNavigationSubject(subjects.CompanyTypes, user.CompanyTypeID)
	}

	jobTypeMatches := true
	if len(subjects.JobTypes) > 0 {
		jobTypeMatches = containsNavigationSubject(subjects.JobTypes, user.JobTypeID)
	}

	return companyScopeMatches && jobTypeMatches
}

func containsNavigationSubject(subjects map[string]struct{}, id string) bool {
	id = strings.TrimSpace(id)
	if id == "" {
		return false
	}
	_, ok := subjects[id]
	return ok
}

func runtimeNavigationItemFromDerived(record derivedNavigationItem, children []RuntimeNavigationItem) RuntimeNavigationItem {
	item := RuntimeNavigationItem{
		ID:          strings.TrimSpace(record.ItemID),
		Label:       strings.TrimSpace(record.Label),
		Type:        strings.TrimSpace(record.NodeType),
		Icon:        strings.TrimSpace(record.Icon),
		Path:        strings.TrimSpace(record.TargetPath),
		ExternalURL: strings.TrimSpace(record.ExternalURL),
		TargetType:  strings.TrimSpace(record.TargetType),
		Breadcrumb:  normalizeRuntimeBreadcrumb(record.Breadcrumb),
		Children:    children,
	}

	if record.OwnerType == navigationOwnerTypeUtilityRailItem {
		item.Key = strings.TrimSpace(record.TargetRoute)
		if item.Key == "" {
			item.Key = strings.TrimPrefix(item.ID, "rail.")
		}
	}

	if item.Children == nil {
		item.Children = []RuntimeNavigationItem{}
	}
	return item
}

func buildRuntimeCreateActions(items []RuntimeNavigationItem) []RuntimeCreateAction {
	actions := make([]RuntimeCreateAction, 0)
	for _, item := range items {
		if item.TargetType == TargetTypeFormView && item.Path != "" {
			modelID, viewID := runtimeFormViewIDsFromPath(item.Path)
			action := RuntimeCreateAction{
				ID:         item.ID,
				Label:      item.Label,
				Path:       strings.TrimRight(item.Path, "/") + "/new",
				TargetType: TargetTypeFormView,
				ModelID:    modelID,
				ViewID:     viewID,
				Breadcrumb: normalizeRuntimeBreadcrumb(item.Breadcrumb),
			}
			actions = append(actions, action)
		}
		if len(item.Children) > 0 {
			actions = append(actions, buildRuntimeCreateActions(item.Children)...)
		}
	}
	return actions
}

func runtimeFormViewIDsFromPath(path string) (string, string) {
	parts := strings.Split(strings.TrimSpace(path), "/")
	if len(parts) < 6 {
		return "", ""
	}
	for i := 0; i+4 < len(parts); i++ {
		if parts[i] == "app" && parts[i+1] == "forms" && parts[i+3] == "views" {
			modelID, modelErr := url.PathUnescape(parts[i+2])
			viewID, viewErr := url.PathUnescape(parts[i+4])
			if modelErr != nil {
				modelID = parts[i+2]
			}
			if viewErr != nil {
				viewID = parts[i+4]
			}
			return modelID, viewID
		}
	}
	return "", ""
}

func normalizeRuntimeBreadcrumb(values []string) []string {
	breadcrumb := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			breadcrumb = append(breadcrumb, value)
		}
	}
	return breadcrumb
}

func suppressEmptyRuntimeMenuTitles(items []RuntimeNavigationItem) []RuntimeNavigationItem {
	out := make([]RuntimeNavigationItem, 0, len(items))
	var pendingTitle *RuntimeNavigationItem

	for _, item := range items {
		item.Children = suppressEmptyRuntimeMenuTitles(item.Children)
		if item.Type == NodeTypeMenuTitle {
			copyItem := item
			pendingTitle = &copyItem
			continue
		}

		if pendingTitle != nil {
			out = append(out, *pendingTitle)
			pendingTitle = nil
		}
		out = append(out, item)
	}

	return out
}
