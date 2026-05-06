package platformstudionavigationbuilder

import (
	"fmt"
	"net/url"
	"strings"
)

func ValidateDefinition(definition NavigationDefinition) ValidationSummary {
	var errors []ValidationMessage
	var warnings []ValidationMessage

	if definition.SchemaVersion != SchemaVersionV1 {
		errors = append(errors, ValidationMessage{
			Code:    "unsupported_schema_version",
			Message: fmt.Sprintf("schemaVersion must be %d", SchemaVersionV1),
			Target:  "schemaVersion",
		})
	}

	seenIDs := make(map[string]string)
	seenTargets := make(map[string]string)
	for i := range definition.AppMenu {
		validateNode(definition.AppMenu[i], true, fmt.Sprintf("appMenu[%d]", i), seenIDs, seenTargets, &errors, &warnings)
	}

	seenRailKeys := make(map[string]string)
	for i, item := range definition.UtilityRail {
		target := fmt.Sprintf("utilityRail[%d]", i)
		if item.ID == "" {
			errors = append(errors, ValidationMessage{Code: "rail_id_required", Message: "utility rail item id is required", Target: target + ".id"})
		}
		if item.Key == "" {
			errors = append(errors, ValidationMessage{Code: "rail_key_required", Message: "utility rail item key is required", Target: target + ".key"})
		}
		if item.Label == "" {
			errors = append(errors, ValidationMessage{Code: "rail_label_required", Message: "utility rail item label is required", Target: target + ".label"})
		}
		if previous, ok := seenRailKeys[item.Key]; item.Key != "" && ok {
			errors = append(errors, ValidationMessage{
				Code:    "duplicate_rail_key",
				Message: "utility rail item key is duplicated",
				Target:  previous + "," + target,
			})
		}
		if item.Key != "" {
			seenRailKeys[item.Key] = target
		}
	}

	if errors == nil {
		errors = []ValidationMessage{}
	}
	if warnings == nil {
		warnings = []ValidationMessage{}
	}

	return ValidationSummary{
		CanSave:  len(errors) == 0,
		Errors:   errors,
		Warnings: warnings,
	}
}

func validateNode(
	node NavigationNode,
	isRoot bool,
	path string,
	seenIDs map[string]string,
	seenTargets map[string]string,
	errors *[]ValidationMessage,
	warnings *[]ValidationMessage,
) {
	if node.ID == "" {
		*errors = append(*errors, ValidationMessage{Code: "node_id_required", Message: "navigation item id is required", Target: path + ".id"})
	} else if previous, ok := seenIDs[node.ID]; ok {
		*errors = append(*errors, ValidationMessage{
			Code:    "duplicate_node_id",
			Message: "navigation item id is duplicated",
			Target:  previous + "," + path,
		})
	} else {
		seenIDs[node.ID] = path
	}

	if node.Label == "" {
		*errors = append(*errors, ValidationMessage{Code: "node_label_required", Message: "navigation item label is required", Target: path + ".label"})
	}

	switch node.Type {
	case NodeTypeMenuTitle:
		if !isRoot {
			*errors = append(*errors, ValidationMessage{Code: "menu_title_root_only", Message: "menu title can only be added at root level", Target: path})
		}
		if node.Icon != "" {
			*errors = append(*errors, ValidationMessage{Code: "menu_title_icon_forbidden", Message: "menu title cannot have an icon", Target: path + ".icon"})
		}
		if node.Target != nil {
			*errors = append(*errors, ValidationMessage{Code: "menu_title_target_forbidden", Message: "menu title cannot have a target", Target: path + ".target"})
		}
		if len(node.Children) > 0 {
			*errors = append(*errors, ValidationMessage{Code: "menu_title_children_forbidden", Message: "menu title cannot have child items", Target: path + ".children"})
		}
	case NodeTypeMenuGroup:
		if node.Icon == "" {
			*warnings = append(*warnings, ValidationMessage{Code: "menu_group_icon_recommended", Message: "menu group icon is recommended", Target: path + ".icon"})
		}
		if node.Target != nil {
			*errors = append(*errors, ValidationMessage{Code: "menu_group_target_forbidden", Message: "menu group cannot have a target", Target: path + ".target"})
		}
	case NodeTypeAppModule:
		validateRequiredTarget(node.Target, TargetTypeAppModule, path, errors)
	case NodeTypeFormView:
		validateRequiredTarget(node.Target, TargetTypeFormView, path, errors)
		if len(node.Children) > 0 {
			*errors = append(*errors, ValidationMessage{Code: "entry_children_forbidden", Message: "form view entry cannot have child items", Target: path + ".children"})
		}
	case NodeTypeAppPage:
		validateRequiredTarget(node.Target, TargetTypeAppPage, path, errors)
		if len(node.Children) > 0 {
			*errors = append(*errors, ValidationMessage{Code: "entry_children_forbidden", Message: "app page entry cannot have child items", Target: path + ".children"})
		}
	case NodeTypeExternalURL:
		validateRequiredTarget(node.Target, TargetTypeExternalURL, path, errors)
		if len(node.Children) > 0 {
			*errors = append(*errors, ValidationMessage{Code: "entry_children_forbidden", Message: "external link entry cannot have child items", Target: path + ".children"})
		}
	default:
		*errors = append(*errors, ValidationMessage{Code: "node_type_invalid", Message: "navigation item type is invalid", Target: path + ".type"})
	}

	if identity := targetIdentity(node.Target); identity != "" {
		if previous, ok := seenTargets[identity]; ok {
			*errors = append(*errors, ValidationMessage{
				Code:    "duplicate_target",
				Message: "navigation target is already used",
				Target:  previous + "," + path + ".target",
			})
		} else {
			seenTargets[identity] = path + ".target"
		}
	}

	for i := range node.Children {
		validateNode(node.Children[i], false, fmt.Sprintf("%s.children[%d]", path, i), seenIDs, seenTargets, errors, warnings)
	}
}

func validateRequiredTarget(target *NavigationTarget, expectedType string, path string, errors *[]ValidationMessage) {
	if target == nil {
		*errors = append(*errors, ValidationMessage{Code: "target_required", Message: "navigation item target is required", Target: path + ".target"})
		return
	}
	if target.Type != expectedType {
		*errors = append(*errors, ValidationMessage{Code: "target_type_invalid", Message: "navigation target type does not match item type", Target: path + ".target.type"})
		return
	}

	switch expectedType {
	case TargetTypeFormView:
		if target.ModelID == "" || target.ViewID == "" {
			*errors = append(*errors, ValidationMessage{Code: "form_view_target_required", Message: "form view target requires modelId and viewId", Target: path + ".target"})
		}
	case TargetTypeAppPage:
		if target.PageID == "" && target.Route == "" {
			*errors = append(*errors, ValidationMessage{Code: "app_page_target_required", Message: "app page target requires pageId or route", Target: path + ".target"})
		}
	case TargetTypeExternalURL:
		if !isValidExternalURL(target.URL) {
			*errors = append(*errors, ValidationMessage{Code: "external_url_invalid", Message: "external link target requires a valid http or https URL", Target: path + ".target.url"})
		}
	case TargetTypeAppModule:
		if target.ModuleID == "" {
			*errors = append(*errors, ValidationMessage{Code: "app_module_target_required", Message: "app module target requires moduleId", Target: path + ".target.moduleId"})
		}
	}
}

func targetIdentity(target *NavigationTarget) string {
	if target == nil {
		return ""
	}

	switch target.Type {
	case TargetTypeFormView:
		if target.ModelID == "" || target.ViewID == "" {
			return ""
		}
		return "form_view:" + strings.ToLower(target.ModelID) + ":" + strings.ToLower(target.ViewID)
	case TargetTypeAppPage:
		if target.PageID != "" {
			return "app_page:" + strings.ToLower(target.PageID)
		}
		if target.Route != "" {
			return "app_page_route:" + strings.ToLower(target.Route)
		}
	case TargetTypeExternalURL:
		if target.URL != "" {
			return "external_link:" + strings.ToLower(target.URL)
		}
	case TargetTypeAppModule:
		if target.ModuleID != "" {
			return "app_module:" + strings.ToLower(target.ModuleID)
		}
	}

	return ""
}

func isValidExternalURL(value string) bool {
	parsed, err := url.Parse(value)
	if err != nil {
		return false
	}
	return parsed.Scheme == "http" || parsed.Scheme == "https"
}
