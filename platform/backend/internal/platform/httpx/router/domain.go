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

	for _, candidate := range []string{
		strings.TrimSpace(r.Header.Get("X-Forwarded-Host")),
		strings.TrimSpace(r.Host),
	} {
		if host := normalizeHost(candidate); host != "" {
			return host
		}
	}

	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin == "" {
		return "undefined"
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

func errString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}
