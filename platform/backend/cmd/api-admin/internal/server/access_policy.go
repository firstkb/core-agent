package server

import (
	"log/slog"
	"net/http"

	adminaccesspolicy "dtriton.com/platform/backend/modules/admin/accesspolicy"
)

type adminRoutePolicy struct {
	requirement *adminaccesspolicy.Requirement
}

func routePolicyForAdminAPI(routeID string) *adminRoutePolicy {
	requirement := adminaccesspolicy.RequirementForRoute(routeID)
	if requirement == nil {
		return nil
	}
	return &adminRoutePolicy{requirement: requirement}
}

func logAccessPolicyDeny(logger *slog.Logger, reason, routeID, userID string) {
	if logger == nil {
		return
	}
	logger.Warn("admin access policy denied",
		"reason", reason,
		"route_id", routeID,
		"user_id", userID,
	)
}

func writeAdminAccessError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(`{"status":"error","code":"` + code + `","message":"` + message + `"}` + "\n"))
}
