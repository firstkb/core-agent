package router

import (
	"net"
	"net/http"
	"net/url"
	"strings"
)

// ExtractDomain returns the effective request host for tenant routing.
// It prefers forwarded/host headers and falls back to Origin only when needed.
func ExtractDomain(r *http.Request) string {
	if r == nil {
		return "undefined"
	}

	if host := normalizeHost(strings.TrimSpace(r.Header.Get("X-Forwarded-Host"))); host != "" {
		return host
	}

	requestHost := normalizeHost(strings.TrimSpace(r.Host))
	originHost := extractOriginHost(r.Header.Get("Origin"))

	// Local browser dev often calls backend on 127.0.0.1 while the tenant/admin
	// identity lives in the frontend origin host. In that case prefer Origin.
	if isLoopbackHost(requestHost) && originHost != "" {
		return originHost
	}

	if requestHost != "" {
		return requestHost
	}

	if originHost != "" {
		return originHost
	}

	return "undefined"
}

func extractOriginHost(origin string) string {
	origin = strings.TrimSpace(origin)
	if origin == "" {
		return ""
	}

	if parsed, err := url.Parse(origin); err == nil && parsed.Host != "" {
		if host := normalizeHost(parsed.Host); host != "" {
			return host
		}
	}

	return normalizeHost(origin)
}

func normalizeHost(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}

	value = strings.TrimPrefix(value, "http://")
	value = strings.TrimPrefix(value, "https://")
	value = strings.TrimSuffix(value, "/")

	host, _, err := net.SplitHostPort(value)
	if err == nil {
		return strings.ToLower(strings.TrimSpace(host))
	}
	if strings.Contains(errString(err), "missing port in address") {
		return strings.ToLower(value)
	}

	return strings.ToLower(value)
}

func isLoopbackHost(host string) bool {
	switch strings.TrimSpace(strings.ToLower(host)) {
	case "127.0.0.1", "localhost", "::1":
		return true
	default:
		return false
	}
}

func errString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}
