package middleware

import (
	"net"
	"net/http"
	"net/url"
	"strings"

	"log/slog"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
)

type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	AllowCredentials bool
	Debug            bool
}

func CORS(logger *slog.Logger, config CORSConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			addVaryOriginHeaders(w)

			route, ok := requestctx.Route(r.Context())
			if !ok {
				logger.Error("CORS: route info not found", "path", r.URL.Path)
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			tier := route.Tier

			if tier == router.TierHealth {
				next.ServeHTTP(w, r)
				return
			}

			if r.Method == http.MethodOptions {
				origin := r.Header.Get("Origin")
				if OriginAllowed(origin, config.AllowedOrigins) {
					w.Header().Set("Access-Control-Allow-Origin", origin)
				} else {
					if config.Debug {
						logger.Debug("CORS: Invalid Origin", "origin", origin)
					}
					http.Error(w, "Forbidden", http.StatusForbidden)
					return
				}
				w.Header().Set("Access-Control-Allow-Methods", strings.Join(config.AllowedMethods, ", "))
				w.Header().Set("Access-Control-Allow-Headers", strings.Join(config.AllowedHeaders, ", "))
				if config.AllowCredentials {
					w.Header().Set("Access-Control-Allow-Credentials", "true")
				}
				w.Header().Set("Access-Control-Max-Age", "86400")
				w.WriteHeader(http.StatusNoContent)
				return
			}

			origin := r.Header.Get("Origin")
			if origin == "" {
				next.ServeHTTP(w, r)
				return
			}
			if OriginAllowed(origin, config.AllowedOrigins) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				if config.Debug {
					logger.Debug("CORS: Invalid Origin", "origin", origin)
				}
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			w.Header().Set("Access-Control-Allow-Methods", strings.Join(config.AllowedMethods, ", "))
			w.Header().Set("Access-Control-Allow-Headers", strings.Join(config.AllowedHeaders, ", "))
			if config.AllowCredentials {
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}

			if r.Method == http.MethodOptions {
				w.Header().Set("Access-Control-Max-Age", "86400")
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func OriginAllowed(origin string, allowedOrigins []string) bool {
	origin = strings.TrimSpace(origin)
	if origin == "" {
		return false
	}

	originURL, err := url.Parse(origin)
	if err != nil || originURL.Scheme == "" || originURL.Host == "" {
		return false
	}

	originScheme := strings.ToLower(originURL.Scheme)
	originHost := strings.ToLower(originURL.Hostname())
	originPort := originURL.Port()

	for _, allowedOrigin := range allowedOrigins {
		allowedOrigin = strings.TrimSpace(allowedOrigin)
		if allowedOrigin == "" {
			continue
		}

		if origin == allowedOrigin {
			return true
		}

		allowedURL, err := url.Parse(allowedOrigin)
		if err == nil && allowedURL.Scheme != "" && allowedURL.Host != "" {
			if !strings.EqualFold(allowedURL.Scheme, originScheme) {
				continue
			}

			allowedHost := strings.ToLower(allowedURL.Hostname())
			allowedPort := allowedURL.Port()
			if allowedPort != "" && allowedPort != originPort {
				continue
			}

			if strings.HasPrefix(allowedHost, "*.") {
				domain := strings.TrimPrefix(allowedHost, "*.")
				if isSubdomain(originHost, domain) {
					return true
				}
				continue
			}

			if allowedHost == originHost {
				return true
			}
			continue
		}

		if strings.HasPrefix(allowedOrigin, "*.") {
			domain := strings.TrimPrefix(strings.ToLower(allowedOrigin), "*.")
			if isSubdomain(originHost, domain) {
				return true
			}
			continue
		}

		if host := normalizeAllowedOriginHost(allowedOrigin); host != "" && host == originHost {
			return true
		}
	}
	return false
}

func addVaryOriginHeaders(w http.ResponseWriter) {
	headers := w.Header()
	headers.Add("Vary", "Origin")
	headers.Add("Vary", "Access-Control-Request-Method")
	headers.Add("Vary", "Access-Control-Request-Headers")
}

func isSubdomain(origin, domain string) bool {
	if strings.HasSuffix(origin, "."+domain) || origin == domain {
		return true
	}
	return false
}

func normalizeAllowedOriginHost(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return ""
	}
	if strings.HasPrefix(value, "http://") || strings.HasPrefix(value, "https://") {
		return ""
	}
	if strings.Contains(value, "/") {
		return ""
	}
	host, _, err := net.SplitHostPort(value)
	if err == nil {
		return strings.TrimSpace(strings.ToLower(host))
	}
	return value
}
