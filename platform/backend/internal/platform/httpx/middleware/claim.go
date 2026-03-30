package middleware

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
)

type ClaimSource string

const (
	ClaimSourceBearer         ClaimSource = "bearer"
	ClaimSourceTrustedHeaders ClaimSource = "trusted_headers"
)

func NormalizeClaimSource(raw string) ClaimSource {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case string(ClaimSourceTrustedHeaders):
		return ClaimSourceTrustedHeaders
	default:
		return ClaimSourceBearer
	}
}

// Claims resolves claims from the configured trusted source and puts them in the context.
func Claims(logger *slog.Logger, source ClaimSource) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			routeInfo, ok := requestctx.Route(r.Context())
			if !ok {
				logger.Error("CONTEXT: route info missing", "error", errors.New("route info not found in context"))
				http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
				return
			}

			if routeInfo.Tier != router.TierSecure {
				next.ServeHTTP(w, r)
				return
			}

			ctx, err := createClaimContext(r, source)
			if err != nil {
				logger.Error("Parse claim error", "error", err)
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func createClaimContext(r *http.Request, source ClaimSource) (context.Context, error) {
	switch source {
	case ClaimSourceTrustedHeaders:
		return auth.CreateContextWithTrustedHeaders(r)
	default:
		return auth.CreateContextWithClaim(r)
	}
}
