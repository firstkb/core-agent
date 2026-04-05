package adminaccesspolicy

import "strings"

type RouteBinding struct {
	ExactRouteID  string
	PrefixRouteID string
	Requirement   Requirement
}

var adminRouteBindings = []RouteBinding{
	{
		ExactRouteID: "ADMIN_PROFILE_GET",
		Requirement: Requirement{
			Kind: RequirementSelf,
		},
	},
	{
		ExactRouteID: "ADMIN_NAVIGATION_GET",
		Requirement: Requirement{
			Kind: RequirementSelf,
		},
	},
	{
		PrefixRouteID: "ADMIN_MODULE_REGISTRY_",
		Requirement: Requirement{
			Kind:       RequirementRootOnly,
			ModuleKey:  "module_registry",
			SectionKey: "modules_list",
			Access:     "write",
		},
	},
	{
		ExactRouteID: "ADMIN_TENANT_CREATE",
		Requirement: Requirement{
			Kind:       RequirementSection,
			ModuleKey:  "tenant",
			SectionKey: "onboarding",
			Access:     "write",
		},
	},
}

func RequirementForRoute(routeID string) *Requirement {
	routeID = strings.TrimSpace(routeID)
	if routeID == "" {
		return nil
	}

	for _, binding := range adminRouteBindings {
		if binding.matches(routeID) {
			requirement := binding.Requirement
			return &requirement
		}
	}

	return nil
}

func AllowsSectionNavigation(moduleKey, sectionKey, grantedAccess string, isRoot bool) bool {
	moduleKey = strings.TrimSpace(strings.ToLower(moduleKey))
	sectionKey = strings.TrimSpace(strings.ToLower(sectionKey))
	grantedAccess = strings.TrimSpace(strings.ToLower(grantedAccess))
	if moduleKey == "" || sectionKey == "" {
		return false
	}

	for _, binding := range adminRouteBindings {
		req := binding.Requirement
		if !strings.EqualFold(strings.TrimSpace(req.ModuleKey), moduleKey) || !strings.EqualFold(strings.TrimSpace(req.SectionKey), sectionKey) {
			continue
		}

		switch req.Kind {
		case RequirementRootOnly:
			if isRoot {
				return true
			}
		case RequirementSection:
			if isRoot {
				return true
			}
			if accessSatisfies(grantedAccess, req.Access) {
				return true
			}
		}
	}

	return false
}

func accessSatisfies(grantedAccess, requiredAccess string) bool {
	grantedAccess = strings.TrimSpace(strings.ToLower(grantedAccess))
	requiredAccess = strings.TrimSpace(strings.ToLower(requiredAccess))

	switch requiredAccess {
	case "read":
		return grantedAccess == "read" || grantedAccess == "write"
	case "write":
		return grantedAccess == "write"
	default:
		return false
	}
}

func (b RouteBinding) matches(routeID string) bool {
	switch {
	case strings.TrimSpace(b.ExactRouteID) != "":
		return strings.EqualFold(strings.TrimSpace(b.ExactRouteID), routeID)
	case strings.TrimSpace(b.PrefixRouteID) != "":
		return strings.HasPrefix(routeID, strings.TrimSpace(b.PrefixRouteID))
	default:
		return false
	}
}
