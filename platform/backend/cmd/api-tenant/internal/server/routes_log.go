package server

import (
	"context"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (srv *Server) FieldsForLog(ctx context.Context, r *http.Request, in any) []any {
	fields := []any{}

	tenantLogged := false
	if c, err := auth.GetClaim(ctx); err == nil && c != nil {
		fields = append(fields,
			"tenantID", c.TenantID,
			"userID", c.UserID,
			"email", c.Email,
		)
		tenantLogged = c.TenantID != ""
	}

	if tenant, ok := requestctx.Tenant(ctx); ok && tenant.ID != "" && !tenantLogged {
		fields = append(fields, "tenantID", tenant.ID)
	}

	if routeInfo, ok := requestctx.Route(ctx); ok {
		fields = append(fields,
			"routeID", string(routeInfo.ID),
			"routePattern", routeInfo.Pattern,
			"tier", string(routeInfo.Tier),
			"domain", routeInfo.Domain,
		)
	}

	fields = append(fields,
		"method", r.Method,
		"path", r.URL.Path,
	)

	for _, paramName := range []string{"modelId", "viewId", "docGuid", "savedFilterId", "routeKey"} {
		if paramValue := r.PathValue(paramName); strings.TrimSpace(paramValue) != "" {
			fields = append(fields, paramName, strings.TrimSpace(paramValue))
		}
	}

	query := r.URL.RawQuery
	if query != "" {
		fields = append(fields, "query", query)
	}

	if in != nil {
		fields = append(fields, "input", in)
	}

	return fields
}
