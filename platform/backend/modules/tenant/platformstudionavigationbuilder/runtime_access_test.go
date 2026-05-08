package platformstudionavigationbuilder

import (
	"encoding/json"
	"testing"
)

func TestRuntimeNavigationAccessFiltersByParentAndChildNarrowing(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Access = json.RawMessage(`{
		"mode":"selected_only",
		"companies":["10"]
	}`)
	definition.AppMenu[1].Children[0].Access = json.RawMessage(`{
		"mode":"selected_only",
		"companies":["11"]
	}`)
	definition.AppMenu[1].Children[1].Access = json.RawMessage(`{
		"mode":"selected_only",
		"companies":["10"]
	}`)

	response := buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		UserID:        "101",
		CompanyID:     "10",
		CompanyTypeID: "100",
		JobTypeID:     "20",
	}))

	safety := findRuntimeItem(t, response.Items, "nav.group.safety")
	if got, want := len(safety.Children), 1; got != want {
		t.Fatalf("visible child count = %d, want %d: %#v", got, want, safety.Children)
	}
	if safety.Children[0].ID != "nav.entry.business-tree" {
		t.Fatalf("visible child id = %q, want nav.entry.business-tree", safety.Children[0].ID)
	}

	response = buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		UserID:        "102",
		CompanyID:     "11",
		CompanyTypeID: "100",
		JobTypeID:     "20",
	}))
	if hasRuntimeItem(response.Items, "nav.group.safety") {
		t.Fatalf("child company match expanded denied parent branch: %#v", response.Items)
	}
}

func TestRuntimeNavigationAccessMatchesUsersOrAudienceRule(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Access = json.RawMessage(`{
		"mode":"selected_only",
		"users":["500"],
		"companyTypes":["300"],
		"jobtypes":["20"]
	}`)

	directUser := buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		UserID:        "500",
		CompanyID:     "99",
		CompanyTypeID: "999",
		JobTypeID:     "77",
	}))
	if !hasRuntimeItem(directUser.Items, "nav.group.safety") {
		t.Fatalf("direct user did not match selected access: %#v", directUser.Items)
	}

	audienceUser := buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		UserID:        "501",
		CompanyID:     "99",
		CompanyTypeID: "300",
		JobTypeID:     "20",
	}))
	if !hasRuntimeItem(audienceUser.Items, "nav.group.safety") {
		t.Fatalf("company type plus job type did not match selected access: %#v", audienceUser.Items)
	}

	wrongJob := buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		UserID:        "501",
		CompanyID:     "99",
		CompanyTypeID: "300",
		JobTypeID:     "21",
	}))
	if hasRuntimeItem(wrongJob.Items, "nav.group.safety") {
		t.Fatalf("company type matched without required job type: %#v", wrongJob.Items)
	}
}

func TestRuntimeNavigationAccessEveryoneExceptAndUtilityRail(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Access = json.RawMessage(`{"mode":"all_authenticated"}`)
	definition.AppMenu[1].Children[0].Access = json.RawMessage(`{
		"mode":"everyone_except",
		"jobtypes":["20"]
	}`)
	definition.UtilityRail = []NavigationRailItem{
		{ID: "rail.platform-studio", Key: "platform-studio", Label: "Platform Studio", Active: boolPtr(true), Access: json.RawMessage(`{"mode":"selected_only","companies":["10"]}`)},
		{ID: "rail.help-center", Key: "help-center", Label: "Help Center", Active: boolPtr(true), Access: json.RawMessage(`{"mode":"all_authenticated"}`)},
	}

	response := buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		UserID:        "501",
		CompanyID:     "10",
		CompanyTypeID: "300",
		JobTypeID:     "20",
	}))
	safety := findRuntimeItem(t, response.Items, "nav.group.safety")
	if hasRuntimeItem(safety.Children, "nav.entry.inspections") {
		t.Fatalf("everyone_except recipient still sees excluded form view: %#v", safety.Children)
	}
	if !response.UtilityRailConfigured {
		t.Fatalf("utility rail configured flag = false, want true")
	}
	if got, want := len(response.UtilityRail), 2; got != want {
		t.Fatalf("utility rail count = %d, want %d", got, want)
	}

	response = buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		UserID:        "502",
		CompanyID:     "11",
		CompanyTypeID: "300",
		JobTypeID:     "21",
	}))
	if got, want := len(response.UtilityRail), 1; got != want {
		t.Fatalf("filtered utility rail count = %d, want %d: %#v", got, want, response.UtilityRail)
	}
	if response.UtilityRail[0].Key != "help-center" {
		t.Fatalf("remaining utility rail key = %q, want help-center", response.UtilityRail[0].Key)
	}
}

func TestRuntimeNavigationRootBypassesAccessButNotInactiveItems(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Access = json.RawMessage(`{"mode":"selected_only","companies":["404"]}`)
	definition.AppMenu[1].Children[0].Access = json.RawMessage(`{"mode":"selected_only","users":["nobody"]}`)
	definition.AppMenu[1].Children[1].Active = boolPtr(false)
	definition.UtilityRail = []NavigationRailItem{
		{ID: "rail.platform-studio", Key: "platform-studio", Label: "Platform Studio", Active: boolPtr(true), Access: json.RawMessage(`{"mode":"selected_only","companies":["404"]}`)},
		{ID: "rail.task-manager", Key: "task-manager", Label: "Task Manager", Active: boolPtr(false), Access: json.RawMessage(`{"mode":"all_authenticated"}`)},
	}

	response := buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		IsRoot:        true,
		UserID:        "root-admin",
	}))

	safety := findRuntimeItem(t, response.Items, "nav.group.safety")
	if !hasRuntimeItem(safety.Children, "nav.entry.inspections") {
		t.Fatalf("root did not bypass selected access for form view: %#v", safety.Children)
	}
	if hasRuntimeItem(safety.Children, "nav.entry.business-tree") {
		t.Fatalf("root bypassed inactive app menu item: %#v", safety.Children)
	}
	if got, want := len(response.UtilityRail), 1; got != want {
		t.Fatalf("root utility rail count = %d, want %d: %#v", got, want, response.UtilityRail)
	}
	if response.UtilityRail[0].ID != "rail.platform-studio" {
		t.Fatalf("root utility rail item = %q, want rail.platform-studio", response.UtilityRail[0].ID)
	}
}

func TestRuntimeNavigationRootOnlyAccess(t *testing.T) {
	definition := sampleDefinition()
	definition.AppMenu[1].Access = json.RawMessage(`{"mode":"root_only"}`)
	definition.UtilityRail = []NavigationRailItem{
		{ID: "rail.platform-studio", Key: "platform-studio", Label: "Platform Studio", Active: boolPtr(true), Access: json.RawMessage(`{"mode":"root_only"}`)},
	}

	regularUser := buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		UserID:        "501",
		CompanyID:     "10",
		CompanyTypeID: "300",
		JobTypeID:     "20",
	}))
	if hasRuntimeItem(regularUser.Items, "nav.group.safety") {
		t.Fatalf("regular user sees root-only app menu branch: %#v", regularUser.Items)
	}
	if got := len(regularUser.UtilityRail); got != 0 {
		t.Fatalf("regular user root-only utility rail count = %d, want 0: %#v", got, regularUser.UtilityRail)
	}

	rootUser := buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		IsRoot:        true,
		UserID:        "root-admin",
	}))
	if !hasRuntimeItem(rootUser.Items, "nav.group.safety") {
		t.Fatalf("root user does not see root-only app menu branch: %#v", rootUser.Items)
	}
	if got, want := len(rootUser.UtilityRail), 1; got != want {
		t.Fatalf("root utility rail count = %d, want %d: %#v", got, want, rootUser.UtilityRail)
	}
}

func TestRuntimeNavigationSuppressesEmptyMenuTitlesAfterAccessFiltering(t *testing.T) {
	definition := NavigationDefinition{
		SchemaVersion: SchemaVersionV1,
		AppMenu: []NavigationNode{
			{ID: "nav.title.empty", Type: NodeTypeMenuTitle, Label: "Empty"},
			{
				ID:     "nav.entry.hidden",
				Type:   NodeTypeAppPage,
				Label:  "Hidden",
				Active: boolPtr(true),
				Target: &NavigationTarget{
					Type:   TargetTypeAppPage,
					PageID: "hidden",
					Route:  "/app/pages/hidden",
				},
				Access: json.RawMessage(`{"mode":"selected_only","companies":["404"]}`),
			},
			{ID: "nav.title.visible", Type: NodeTypeMenuTitle, Label: "Visible"},
			{
				ID:     "nav.entry.visible",
				Type:   NodeTypeAppPage,
				Label:  "Visible page",
				Active: boolPtr(true),
				Target: &NavigationTarget{
					Type:   TargetTypeAppPage,
					PageID: "visible",
					Route:  "/app/pages/visible",
				},
			},
			{ID: "nav.title.trailing", Type: NodeTypeMenuTitle, Label: "Trailing"},
		},
	}

	response := buildRuntimeNavigationResponse(runtimeStateForDefinition(definition, runtimeNavigationUserContext{
		Authenticated: true,
		UserID:        "501",
		CompanyID:     "10",
		CompanyTypeID: "300",
		JobTypeID:     "20",
	}))

	if got, want := len(response.Items), 2; got != want {
		t.Fatalf("runtime item count = %d, want %d: %#v", got, want, response.Items)
	}
	if response.Items[0].ID != "nav.title.visible" || response.Items[1].ID != "nav.entry.visible" {
		t.Fatalf("unexpected title suppression result: %#v", response.Items)
	}
}

func runtimeStateForDefinition(definition NavigationDefinition, user runtimeNavigationUserContext) runtimeNavigationState {
	rows := buildDerivedNavigationRows(definition)
	return runtimeNavigationState{
		User:     user,
		Items:    rows.Items,
		Policies: rows.Policies,
		Subjects: rows.Subjects,
	}
}

func findRuntimeItem(t *testing.T, items []RuntimeNavigationItem, id string) RuntimeNavigationItem {
	t.Helper()
	for _, item := range items {
		if item.ID == id {
			return item
		}
		if child := findRuntimeItemInChildren(item.Children, id); child != nil {
			return *child
		}
	}
	t.Fatalf("missing runtime item %q in %#v", id, items)
	return RuntimeNavigationItem{}
}

func hasRuntimeItem(items []RuntimeNavigationItem, id string) bool {
	return findRuntimeItemInChildren(items, id) != nil
}

func findRuntimeItemInChildren(items []RuntimeNavigationItem, id string) *RuntimeNavigationItem {
	for _, item := range items {
		if item.ID == id {
			copyItem := item
			return &copyItem
		}
		if child := findRuntimeItemInChildren(item.Children, id); child != nil {
			return child
		}
	}
	return nil
}
