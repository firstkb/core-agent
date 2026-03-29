package onboardingsvc

import (
	"strings"
	"unicode"
)

func normalizePlan(raw string, fallback Plan) Plan {
	value := strings.ToLower(strings.TrimSpace(raw))
	switch Plan(value) {
	case PlanLight, PlanPro, PlanTrial, PlanEnterprise:
		return Plan(value)
	default:
		return fallback
	}
}

func normalizeHost(host string) string {
	return strings.TrimSpace(strings.ToLower(host))
}

func sanitizeDBName(raw string) string {
	r := strings.Builder{}
	for _, ch := range strings.ToLower(strings.TrimSpace(raw)) {
		if (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '-' {
			r.WriteRune(ch)
			continue
		}
		if unicode.IsSpace(ch) || ch == '_' {
			r.WriteRune('-')
		}
	}
	result := r.String()
	result = strings.Trim(result, "-")
	if len(result) > 50 {
		result = result[:50]
	}
	return result
}

func proDBName(prefix, primary, fallback string) string {
	name := sanitizeDBName(primary)
	if name == "" {
		name = sanitizeDBName(fallback)
	}
	if name == "" {
		name = "tenant"
	}
	if prefix == "" {
		prefix = defaultProDBPrefix
	}
	return prefix + name
}

func isSandboxPlan(plan Plan) bool {
	switch plan {
	case PlanLight, PlanTrial:
		return true
	default:
		return false
	}
}

func isDedicatedPlan(plan Plan) bool {
	switch plan {
	case PlanPro, PlanEnterprise:
		return true
	default:
		return false
	}
}
