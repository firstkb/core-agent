package server

import (
	"errors"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	adminaccesspolicy "dtriton.com/platform/backend/modules/admin/accesspolicy"
)

func (srv *Server) adminAccessPolicyMiddleware(next http.Handler) http.Handler {
	if srv == nil || srv.adminAccessPolicy == nil {
		return next
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		routeInfo, ok := requestctx.Route(r.Context())
		if !ok || routeInfo.Tier != router.TierSecure {
			next.ServeHTTP(w, r)
			return
		}

		claims, ok := requestctx.Claims(r.Context())
		if !ok {
			logAccessPolicyDeny(srv.logger, "claims_missing", string(routeInfo.ID), "")
			writeAdminAccessError(w, http.StatusUnauthorized, "ADMIN_ACCESS_UNAUTHORIZED", "unauthorized")
			return
		}

		policy := routePolicyForAdminAPI(string(routeInfo.ID))
		if err := srv.adminAccessPolicy.Authorize(r.Context(), claims, requirementFromPolicy(policy)); err != nil {
			srv.writeAccessPolicyError(w, routeInfo, claims, err)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func requirementFromPolicy(policy *adminRoutePolicy) *adminaccesspolicy.Requirement {
	if policy == nil {
		return nil
	}
	return policy.requirement
}

func (srv *Server) writeAccessPolicyError(w http.ResponseWriter, route requestctx.RouteInfo, claims requestctx.ClaimsInfo, err error) {
	userID := claims.UserID
	switch {
	case errors.Is(err, adminaccesspolicy.ErrUnauthorized):
		logAccessPolicyDeny(srv.logger, "unauthorized", string(route.ID), userID)
		writeAdminAccessError(w, http.StatusUnauthorized, "ADMIN_ACCESS_UNAUTHORIZED", "unauthorized")
	case errors.Is(err, adminaccesspolicy.ErrInvalidScope):
		logAccessPolicyDeny(srv.logger, "invalid_scope", string(route.ID), userID)
		writeAdminAccessError(w, http.StatusForbidden, "ADMIN_ACCESS_FORBIDDEN", "forbidden")
	case errors.Is(err, adminaccesspolicy.ErrUserNotFound):
		logAccessPolicyDeny(srv.logger, "user_not_found", string(route.ID), userID)
		writeAdminAccessError(w, http.StatusNotFound, "ADMIN_ACCESS_USER_NOT_FOUND", "user not found")
	case errors.Is(err, adminaccesspolicy.ErrUserInactive):
		logAccessPolicyDeny(srv.logger, "user_inactive", string(route.ID), userID)
		writeAdminAccessError(w, http.StatusForbidden, "ADMIN_ACCESS_USER_INACTIVE", "user inactive")
	case errors.Is(err, adminaccesspolicy.ErrUnmappedRoute):
		logAccessPolicyDeny(srv.logger, "unmapped_route", string(route.ID), userID)
		writeAdminAccessError(w, http.StatusForbidden, "ADMIN_ACCESS_UNMAPPED_ROUTE", "forbidden")
	default:
		logAccessPolicyDeny(srv.logger, "forbidden", string(route.ID), userID)
		writeAdminAccessError(w, http.StatusForbidden, "ADMIN_ACCESS_FORBIDDEN", "forbidden")
	}
}
