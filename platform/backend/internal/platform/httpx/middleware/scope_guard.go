package middleware

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
)

func RequireScope(logger *slog.Logger, required ...string) func(http.Handler) http.Handler {
	expected := normalizeScopes(required)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			routeInfo, ok := requestctx.Route(r.Context())
			if !ok {
				logger.Error("CONTEXT: route info missing", "error", errors.New("route info not found in context"))
				http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
				return
			}

			if routeInfo.Tier != router.TierSecure || len(expected) == 0 {
				next.ServeHTTP(w, r)
				return
			}

			claims, ok := requestctx.Claims(r.Context())
			if !ok || !hasAnyScope(claims.Scope, expected) {
				http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func hasAnyScope(raw string, required []string) bool {
	if len(required) == 0 {
		return true
	}

	granted := make(map[string]struct{})
	for _, scope := range strings.Fields(strings.TrimSpace(raw)) {
		scope = strings.TrimSpace(scope)
		if scope == "" {
			continue
		}
		granted[scope] = struct{}{}
	}

	for _, scope := range required {
		if _, ok := granted[scope]; ok {
			return true
		}
	}
	return false
}

func normalizeScopes(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{})
	for _, value := range values {
		for _, scope := range strings.Fields(strings.TrimSpace(value)) {
			if scope == "" {
				continue
			}
			if _, ok := seen[scope]; ok {
				continue
			}
			seen[scope] = struct{}{}
			result = append(result, scope)
		}
	}
	return result
}
