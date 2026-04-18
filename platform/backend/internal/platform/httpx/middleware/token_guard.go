package middleware

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
)

type tokenValidator interface {
	ValidateToken(token string) (*authpkg.JWTClaims, error)
}

// ValidatedClaims validates JWT tokens via authsvc and stores claims in context.
func ValidatedClaims(logger *slog.Logger, validator tokenValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			routeInfo, ok := requestctx.Route(r.Context())
			if !ok {
				logger.Error("CONTEXT: route info missing", "error", errors.New("route info not found in context"), "method", r.Method, "path", r.URL.Path)
				http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
				return
			}

			if routeInfo.Tier != router.TierSecure {
				next.ServeHTTP(w, r)
				return
			}

			token, err := bearerToken(r)
			if err != nil {
				logger.Error("AUTHORIZATION: bearer token invalid", append([]any{"error", err}, authLogFields(r)...)...)
				http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
				return
			}

			_, err = validator.ValidateToken(token)
			if err != nil {
				logger.Error("AUTHORIZATION: token validation failed", append([]any{"error", err}, authLogFields(r)...)...)
				http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func authLogFields(r *http.Request) []any {
	fields := []any{
		"method", r.Method,
		"path", r.URL.Path,
	}

	if routeInfo, ok := requestctx.Route(r.Context()); ok {
		fields = append(fields,
			"routeID", string(routeInfo.ID),
			"routePattern", routeInfo.Pattern,
			"tier", string(routeInfo.Tier),
			"domain", routeInfo.Domain,
		)
	}

	if tenant, ok := requestctx.Tenant(r.Context()); ok && tenant.ID != "" {
		fields = append(fields, "tenantID", tenant.ID)
	}

	return fields
}

func bearerToken(r *http.Request) (string, error) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		return "", errors.New("authorization header missing")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("authorization header must be 'Bearer <token>'")
	}
	token := strings.TrimSpace(parts[1])
	if token == "" {
		return "", errors.New("token cannot be empty")
	}
	return token, nil
}
