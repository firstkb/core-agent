package platformstudionavigationbuilder

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

const (
	navigationOwnerTypeAppMenuItem     = "app_menu_item"
	navigationOwnerTypeUtilityRailItem = "utility_rail_item"

	NavigationAccessModeInherit          = "inherit"
	NavigationAccessModeAllAuthenticated = "all_authenticated"
	NavigationAccessModeRootOnly         = "root_only"
	NavigationAccessModeSelectedOnly     = "selected_only"
	NavigationAccessModeEveryoneExcept   = "everyone_except"

	navigationAccessSubjectTypeUser        = "user"
	navigationAccessSubjectTypeCompany     = "company"
	navigationAccessSubjectTypeCompanyType = "company_type"
	navigationAccessSubjectTypeJobType     = "jobtype"
)

type derivedNavigationRows struct {
	Items    []derivedNavigationItem
	Policies []derivedNavigationAccessPolicy
	Subjects []derivedNavigationAccessSubject
}

type derivedNavigationItem struct {
	OwnerType      string
	ItemID         string
	ParentItemID   string
	NodeType       string
	TargetType     string
	TargetModelID  string
	TargetViewID   string
	TargetPageID   string
	TargetModuleID string
	TargetRoute    string
	TargetPath     string
	ExternalURL    string
	Label          string
	Icon           string
	Channel        string
	Active         bool
	SortOrder      int
	Depth          int
	Breadcrumb     []string
}

type derivedNavigationAccessPolicy struct {
	OwnerType string
	OwnerID   string
	Mode      string
}

type derivedNavigationAccessSubject struct {
	OwnerType   string
	OwnerID     string
	SubjectType string
	SubjectID   string
}

type navigationAccessPolicy struct {
	Mode         string
	Users        []string
	Companies    []string
	CompanyTypes []string
	JobTypes     []string
}

func buildDerivedNavigationRows(definition NavigationDefinition) derivedNavigationRows {
	var rows derivedNavigationRows

	for i := range definition.AppMenu {
		appendDerivedNavigationNode(&rows, definition.AppMenu[i], "", i+1, 0, nil)
	}
	for i, item := range definition.UtilityRail {
		appendDerivedNavigationRailItem(&rows, item, i+1)
	}

	return rows
}

func appendDerivedNavigationNode(
	rows *derivedNavigationRows,
	node NavigationNode,
	parentItemID string,
	sortOrder int,
	depth int,
	parentBreadcrumb []string,
) {
	breadcrumb := append(append([]string{}, parentBreadcrumb...), strings.TrimSpace(node.Label))
	item := derivedNavigationItem{
		OwnerType:    navigationOwnerTypeAppMenuItem,
		ItemID:       strings.TrimSpace(node.ID),
		ParentItemID: strings.TrimSpace(parentItemID),
		NodeType:     strings.TrimSpace(node.Type),
		Label:        strings.TrimSpace(node.Label),
		Icon:         strings.TrimSpace(node.Icon),
		Channel:      strings.TrimSpace(node.Channel),
		Active:       navigationNodeIsActive(node),
		SortOrder:    sortOrder,
		Depth:        depth,
		Breadcrumb:   breadcrumb,
	}
	if node.Target != nil {
		item.TargetType = strings.TrimSpace(node.Target.Type)
		item.TargetModelID = strings.TrimSpace(node.Target.ModelID)
		item.TargetViewID = strings.TrimSpace(node.Target.ViewID)
		item.TargetPageID = strings.TrimSpace(node.Target.PageID)
		item.TargetModuleID = strings.TrimSpace(node.Target.ModuleID)
		item.TargetRoute = strings.TrimSpace(node.Target.Route)
		item.TargetPath = runtimeTargetPath(*node.Target)
		item.ExternalURL = runtimeTargetExternalURL(*node.Target)
	}

	rows.Items = append(rows.Items, item)
	appendDerivedAccessRows(rows, item.OwnerType, item.ItemID, parseNavigationAccess(node.Access, node.Meta))

	for i := range node.Children {
		appendDerivedNavigationNode(rows, node.Children[i], item.ItemID, i+1, depth+1, breadcrumb)
	}
}

func appendDerivedNavigationRailItem(rows *derivedNavigationRows, item NavigationRailItem, sortOrder int) {
	row := derivedNavigationItem{
		OwnerType:   navigationOwnerTypeUtilityRailItem,
		ItemID:      strings.TrimSpace(item.ID),
		NodeType:    navigationOwnerTypeUtilityRailItem,
		TargetType:  navigationOwnerTypeUtilityRailItem,
		TargetRoute: strings.TrimSpace(item.Key),
		Label:       strings.TrimSpace(item.Label),
		Active:      item.Active == nil || *item.Active,
		SortOrder:   sortOrder,
		Depth:       0,
		Breadcrumb:  []string{strings.TrimSpace(item.Label)},
	}

	rows.Items = append(rows.Items, row)
	appendDerivedAccessRows(rows, row.OwnerType, row.ItemID, parseNavigationAccess(item.Access))
}

func appendDerivedAccessRows(rows *derivedNavigationRows, ownerType string, ownerID string, policy navigationAccessPolicy) {
	ownerType = strings.TrimSpace(ownerType)
	ownerID = strings.TrimSpace(ownerID)
	rows.Policies = append(rows.Policies, derivedNavigationAccessPolicy{
		OwnerType: ownerType,
		OwnerID:   ownerID,
		Mode:      normalizeNavigationAccessMode(policy.Mode),
	})

	for _, id := range policy.Users {
		rows.Subjects = append(rows.Subjects, derivedNavigationAccessSubject{
			OwnerType: ownerType, OwnerID: ownerID, SubjectType: navigationAccessSubjectTypeUser, SubjectID: id,
		})
	}
	for _, id := range policy.Companies {
		rows.Subjects = append(rows.Subjects, derivedNavigationAccessSubject{
			OwnerType: ownerType, OwnerID: ownerID, SubjectType: navigationAccessSubjectTypeCompany, SubjectID: id,
		})
	}
	for _, id := range policy.CompanyTypes {
		rows.Subjects = append(rows.Subjects, derivedNavigationAccessSubject{
			OwnerType: ownerType, OwnerID: ownerID, SubjectType: navigationAccessSubjectTypeCompanyType, SubjectID: id,
		})
	}
	for _, id := range policy.JobTypes {
		rows.Subjects = append(rows.Subjects, derivedNavigationAccessSubject{
			OwnerType: ownerType, OwnerID: ownerID, SubjectType: navigationAccessSubjectTypeJobType, SubjectID: id,
		})
	}
}

func parseNavigationAccess(raws ...json.RawMessage) navigationAccessPolicy {
	for _, raw := range raws {
		policy, ok := parseNavigationAccessRaw(raw)
		if ok {
			return policy
		}
	}
	return navigationAccessPolicy{Mode: NavigationAccessModeInherit}
}

func parseNavigationAccessRaw(raw json.RawMessage) (navigationAccessPolicy, bool) {
	policy := navigationAccessPolicy{Mode: NavigationAccessModeInherit}
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 || bytes.Equal(raw, []byte("null")) {
		return policy, false
	}

	var payload map[string]json.RawMessage
	if err := json.Unmarshal(raw, &payload); err != nil {
		return policy, false
	}

	found := false
	if mode, ok := readRawString(payload["mode"]); ok {
		policy.Mode = normalizeNavigationAccessMode(mode)
		found = true
	} else if mode, ok := readRawString(payload["accessMode"]); ok {
		policy.Mode = normalizeNavigationAccessMode(mode)
		found = true
	}

	policy.Users = readSubjectIDs(payload, "users", "userIds")
	policy.Companies = readSubjectIDs(payload, "companies", "companyIds")
	policy.CompanyTypes = readSubjectIDs(payload, "companyTypes", "companyTypeIds")
	policy.JobTypes = readSubjectIDs(payload, "jobtypes", "jobTypes", "jobtypeIds", "jobTypeIds")
	if len(policy.Users) > 0 || len(policy.Companies) > 0 || len(policy.CompanyTypes) > 0 || len(policy.JobTypes) > 0 {
		found = true
	}

	return policy, found
}

func normalizeNavigationAccessMode(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case NavigationAccessModeAllAuthenticated, "all-authenticated", "all_authenticated_users":
		return NavigationAccessModeAllAuthenticated
	case NavigationAccessModeRootOnly, "root-only", "root", "root_only_users", "root-only-users", "platform_admins_only", "platform-admins-only":
		return NavigationAccessModeRootOnly
	case NavigationAccessModeSelectedOnly, "selected-only", "selected", "selected_recipients_only", "selected-recipients-only":
		return NavigationAccessModeSelectedOnly
	case NavigationAccessModeEveryoneExcept, "everyone-except", "everyone_except_selected", "everyone-except-selected", "except_selected":
		return NavigationAccessModeEveryoneExcept
	default:
		return NavigationAccessModeInherit
	}
}

func readRawString(raw json.RawMessage) (string, bool) {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 || bytes.Equal(raw, []byte("null")) {
		return "", false
	}
	var value string
	if err := json.Unmarshal(raw, &value); err != nil {
		return "", false
	}
	value = strings.TrimSpace(value)
	return value, value != ""
}

func readSubjectIDs(payload map[string]json.RawMessage, keys ...string) []string {
	seen := make(map[string]struct{})
	var ids []string
	for _, key := range keys {
		raw, ok := payload[key]
		if !ok {
			continue
		}

		for _, id := range decodeSubjectIDArray(raw) {
			if _, exists := seen[id]; exists {
				continue
			}
			seen[id] = struct{}{}
			ids = append(ids, id)
		}
	}
	sort.Strings(ids)
	return ids
}

func decodeSubjectIDArray(raw json.RawMessage) []string {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 || bytes.Equal(raw, []byte("null")) {
		return nil
	}

	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.UseNumber()
	var values []any
	if err := decoder.Decode(&values); err != nil {
		return nil
	}

	ids := make([]string, 0, len(values))
	for _, value := range values {
		switch typed := value.(type) {
		case string:
			if id := strings.TrimSpace(typed); id != "" {
				ids = append(ids, id)
			}
		case json.Number:
			if id := strings.TrimSpace(typed.String()); id != "" {
				ids = append(ids, id)
			}
		}
	}
	return ids
}

func syncDerivedNavigationTx(ctx context.Context, tx *sql.Tx, configKey string, definition NavigationDefinition) error {
	configKey = configKeyOrDefault(configKey)
	rows := buildDerivedNavigationRows(definition)

	if _, err := tx.ExecContext(ctx, `DELETE FROM ps_navigation_runtime_item WHERE config_key = $1`, configKey); err != nil {
		return fmt.Errorf("navigation builder: clear derived runtime rows: %w", err)
	}

	for _, item := range rows.Items {
		if err := insertDerivedNavigationItemTx(ctx, tx, configKey, item); err != nil {
			return err
		}
	}
	for _, policy := range rows.Policies {
		if err := insertDerivedNavigationAccessPolicyTx(ctx, tx, configKey, policy); err != nil {
			return err
		}
	}
	for _, subject := range rows.Subjects {
		if err := insertDerivedNavigationAccessSubjectTx(ctx, tx, configKey, subject); err != nil {
			return err
		}
	}

	return nil
}

func insertDerivedNavigationItemTx(ctx context.Context, tx *sql.Tx, configKey string, item derivedNavigationItem) error {
	breadcrumbJSON, err := json.Marshal(item.Breadcrumb)
	if err != nil {
		return fmt.Errorf("navigation builder: encode derived breadcrumb: %w", err)
	}

	const query = `
INSERT INTO ps_navigation_runtime_item (
  config_key,
  owner_type,
  item_id,
  parent_item_id,
  node_type,
  target_type,
  target_model_id,
  target_view_id,
  target_page_id,
  target_module_id,
  target_route,
  target_path,
  external_url,
  label,
  icon,
  channel,
  active,
  sort_order,
  depth,
  breadcrumb_json
)
VALUES (
  $1,
  $2,
  $3,
  NULLIF($4, ''),
  $5,
  NULLIF($6, ''),
  NULLIF($7, ''),
  NULLIF($8, ''),
  NULLIF($9, ''),
  NULLIF($10, ''),
  NULLIF($11, ''),
  NULLIF($12, ''),
  NULLIF($13, ''),
  $14,
  NULLIF($15, ''),
  NULLIF($16, ''),
  $17,
  $18,
  $19,
  $20::jsonb
)`
	if _, err := tx.ExecContext(
		ctx,
		query,
		configKey,
		strings.TrimSpace(item.OwnerType),
		strings.TrimSpace(item.ItemID),
		strings.TrimSpace(item.ParentItemID),
		strings.TrimSpace(item.NodeType),
		strings.TrimSpace(item.TargetType),
		strings.TrimSpace(item.TargetModelID),
		strings.TrimSpace(item.TargetViewID),
		strings.TrimSpace(item.TargetPageID),
		strings.TrimSpace(item.TargetModuleID),
		strings.TrimSpace(item.TargetRoute),
		strings.TrimSpace(item.TargetPath),
		strings.TrimSpace(item.ExternalURL),
		strings.TrimSpace(item.Label),
		strings.TrimSpace(item.Icon),
		strings.TrimSpace(item.Channel),
		item.Active,
		item.SortOrder,
		item.Depth,
		breadcrumbJSON,
	); err != nil {
		return fmt.Errorf("navigation builder: insert derived runtime item %q: %w", item.ItemID, err)
	}
	return nil
}

func insertDerivedNavigationAccessPolicyTx(ctx context.Context, tx *sql.Tx, configKey string, policy derivedNavigationAccessPolicy) error {
	const query = `
INSERT INTO ps_navigation_access_policy (
  config_key,
  owner_type,
  owner_id,
  access_mode
)
VALUES ($1, $2, $3, $4)`
	if _, err := tx.ExecContext(
		ctx,
		query,
		configKey,
		strings.TrimSpace(policy.OwnerType),
		strings.TrimSpace(policy.OwnerID),
		normalizeNavigationAccessMode(policy.Mode),
	); err != nil {
		return fmt.Errorf("navigation builder: insert derived access policy %q: %w", policy.OwnerID, err)
	}
	return nil
}

func insertDerivedNavigationAccessSubjectTx(ctx context.Context, tx *sql.Tx, configKey string, subject derivedNavigationAccessSubject) error {
	const query = `
INSERT INTO ps_navigation_access_subject (
  config_key,
  owner_type,
  owner_id,
  subject_type,
  subject_id
)
VALUES ($1, $2, $3, $4, $5)`
	if _, err := tx.ExecContext(
		ctx,
		query,
		configKey,
		strings.TrimSpace(subject.OwnerType),
		strings.TrimSpace(subject.OwnerID),
		strings.TrimSpace(subject.SubjectType),
		strings.TrimSpace(subject.SubjectID),
	); err != nil {
		return fmt.Errorf("navigation builder: insert derived access subject %q/%q: %w", subject.SubjectType, subject.SubjectID, err)
	}
	return nil
}
