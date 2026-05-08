package platformstudionavigationbuilder

import (
	"encoding/json"
	"testing"
)

func TestBuildDerivedNavigationRowsProjectsTreeTargetsAndAccess(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Access = json.RawMessage(`{
		"mode":"selected_only",
		"users":["user-2","user-1","user-1"],
		"companies":["company-1"],
		"companyTypes":["contractor"],
		"jobtypes":["foreman"]
	}`)
	definition.AppMenu[1].Children[0].Access = json.RawMessage(`{
		"mode":"everyone_except",
		"userIds":["user-3"],
		"companyIds":[108],
		"jobTypeIds":["safety-manager"]
	}`)
	definition.UtilityRail[0].Access = json.RawMessage(`{"accessMode":"all-authenticated"}`)

	rows := buildDerivedNavigationRows(definition)

	if got, want := len(rows.Items), 5; got != want {
		t.Fatalf("derived item count = %d, want %d", got, want)
	}
	if got, want := len(rows.Policies), 5; got != want {
		t.Fatalf("derived policy count = %d, want %d", got, want)
	}
	if got, want := len(rows.Subjects), 8; got != want {
		t.Fatalf("derived subject count = %d, want %d", got, want)
	}

	group := findDerivedItem(t, rows, navigationOwnerTypeAppMenuItem, "nav.group.safety")
	if group.ParentItemID != "" {
		t.Fatalf("group parent = %q, want empty root parent", group.ParentItemID)
	}
	if group.Icon != "shield" {
		t.Fatalf("group icon = %q, want shield", group.Icon)
	}
	if group.SortOrder != 2 {
		t.Fatalf("group sort order = %d, want 2", group.SortOrder)
	}

	entry := findDerivedItem(t, rows, navigationOwnerTypeAppMenuItem, "nav.entry.inspections")
	if entry.ParentItemID != "nav.group.safety" {
		t.Fatalf("entry parent = %q, want nav.group.safety", entry.ParentItemID)
	}
	if entry.TargetType != TargetTypeFormView || entry.TargetModelID != "sor" || entry.TargetViewID != "view-default" {
		t.Fatalf("entry target = %#v", entry)
	}
	if entry.TargetPath != "/app/forms/sor/views/view-default" {
		t.Fatalf("entry target path = %q", entry.TargetPath)
	}
	if got, want := entry.Breadcrumb, []string{"Safety", "Inspections"}; len(got) != len(want) || got[0] != want[0] || got[1] != want[1] {
		t.Fatalf("entry breadcrumb = %#v, want %#v", got, want)
	}

	groupPolicy := findDerivedPolicy(t, rows, navigationOwnerTypeAppMenuItem, "nav.group.safety")
	if groupPolicy.Mode != NavigationAccessModeSelectedOnly {
		t.Fatalf("group access mode = %q, want %q", groupPolicy.Mode, NavigationAccessModeSelectedOnly)
	}

	entryPolicy := findDerivedPolicy(t, rows, navigationOwnerTypeAppMenuItem, "nav.entry.inspections")
	if entryPolicy.Mode != NavigationAccessModeEveryoneExcept {
		t.Fatalf("entry access mode = %q, want %q", entryPolicy.Mode, NavigationAccessModeEveryoneExcept)
	}

	railPolicy := findDerivedPolicy(t, rows, navigationOwnerTypeUtilityRailItem, "rail.platform-studio")
	if railPolicy.Mode != NavigationAccessModeAllAuthenticated {
		t.Fatalf("rail access mode = %q, want %q", railPolicy.Mode, NavigationAccessModeAllAuthenticated)
	}

	if !hasDerivedSubject(rows, navigationOwnerTypeAppMenuItem, "nav.group.safety", navigationAccessSubjectTypeUser, "user-1") ||
		!hasDerivedSubject(rows, navigationOwnerTypeAppMenuItem, "nav.group.safety", navigationAccessSubjectTypeUser, "user-2") {
		t.Fatalf("group user subjects were not parsed/deduped: %#v", rows.Subjects)
	}
	if !hasDerivedSubject(rows, navigationOwnerTypeAppMenuItem, "nav.entry.inspections", navigationAccessSubjectTypeCompany, "108") {
		t.Fatalf("numeric company subject was not preserved as text: %#v", rows.Subjects)
	}
	if !hasDerivedSubject(rows, navigationOwnerTypeAppMenuItem, "nav.group.safety", navigationAccessSubjectTypeCompanyType, "contractor") {
		t.Fatalf("group company type subject was not parsed: %#v", rows.Subjects)
	}
}

func TestParseNavigationAccessFallsBackToMetaAndDefaultsUnknownModes(t *testing.T) {
	policy := parseNavigationAccess(nil, json.RawMessage(`{"accessMode":"custom-preview","users":["user-1"]}`))

	if policy.Mode != NavigationAccessModeInherit {
		t.Fatalf("legacy custom-preview mode = %q, want inherit", policy.Mode)
	}
	if got, want := len(policy.Users), 1; got != want {
		t.Fatalf("parsed users = %d, want %d", got, want)
	}
}

func findDerivedItem(t *testing.T, rows derivedNavigationRows, ownerType string, ownerID string) derivedNavigationItem {
	t.Helper()
	for _, item := range rows.Items {
		if item.OwnerType == ownerType && item.ItemID == ownerID {
			return item
		}
	}
	t.Fatalf("missing derived item %s/%s", ownerType, ownerID)
	return derivedNavigationItem{}
}

func findDerivedPolicy(t *testing.T, rows derivedNavigationRows, ownerType string, ownerID string) derivedNavigationAccessPolicy {
	t.Helper()
	for _, policy := range rows.Policies {
		if policy.OwnerType == ownerType && policy.OwnerID == ownerID {
			return policy
		}
	}
	t.Fatalf("missing derived policy %s/%s", ownerType, ownerID)
	return derivedNavigationAccessPolicy{}
}

func hasDerivedSubject(rows derivedNavigationRows, ownerType string, ownerID string, subjectType string, subjectID string) bool {
	for _, subject := range rows.Subjects {
		if subject.OwnerType == ownerType &&
			subject.OwnerID == ownerID &&
			subject.SubjectType == subjectType &&
			subject.SubjectID == subjectID {
			return true
		}
	}
	return false
}
