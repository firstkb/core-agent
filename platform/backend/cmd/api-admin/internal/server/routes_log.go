package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (srv *Server) FieldsForLog(ctx context.Context, r *http.Request, in any) []any {
	fields := []any{}

	if c, err := auth.GetClaim(ctx); err == nil && c != nil {
		fields = append(fields,
			"tenantID", c.TenantID,
			"userID", c.UserID,
			"email", c.Email,
			"scope", c.Scope,
		)
	}

	if routeInfo, ok := requestctx.Route(ctx); ok {
		fields = append(fields,
			"tier", string(routeInfo.Tier),
			"domain", routeInfo.Domain,
		)
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
