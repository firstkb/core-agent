package authsvc

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"strconv"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func isMembershipActive(status string) bool {
	return strings.EqualFold(strings.TrimSpace(status), "active")
}

func normalizeTenantUser(user *TenantUser) {
	if user == nil {
		return
	}

	user.Role = strings.TrimSpace(user.Role)
	if strings.EqualFold(user.Role, "owner") {
		user.Role = "admin"
	}
	if user.Role == "" {
		if user.Admin {
			user.Role = "admin"
		} else {
			user.Role = "member"
		}
	}

	if user.Level <= 0 {
		if user.Admin {
			user.Level = 80
		} else {
			user.Level = 20
		}
	}
}

func splitAuthDisplayName(value string) (string, string) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", ""
	}

	parts := strings.Fields(value)
	if len(parts) == 1 {
		return parts[0], ""
	}

	return parts[0], strings.Join(parts[1:], " ")
}

func tenantUserBlockReason(user *TenantUser, policy TenantAuthPolicy) string {
	if user == nil {
		return "user_not_found"
	}
	if policy.LoginRequiresUsersAccess && !user.Access {
		return "user_access_disabled"
	}
	if policy.LoginRequiresUsersAct && !user.Active {
		return "user_inactive"
	}
	return ""
}

func normalizeAdminUser(user *AdminUser) {
	if user == nil {
		return
	}

	user.Status = strings.TrimSpace(user.Status)
	user.Role = adminRoleFromLevel(user.Level)
}

func adminRoleFromLevel(level int) string {
	switch {
	case level >= 100:
		return "root"
	case level >= 80:
		return "admin"
	case level >= 60:
		return "support"
	default:
		return "readonly"
	}
}

func adminUserBlockReason(user *AdminUser) string {
	if user == nil {
		return "user_not_found"
	}
	if !isMembershipActive(user.Status) {
		return "user_inactive"
	}
	return ""
}

func authChannelEnabled(policy TenantAuthPolicy, channel string) bool {
	switch strings.TrimSpace(channel) {
	case "email":
		return policy.OTPEmailEnabled
	case "sms":
		return policy.OTPPhoneEnabled
	default:
		return false
	}
}

func tenantFromContext(ctx context.Context) (tenant requestctx.TenantInfo, tenantID int64, err error) {
	info, ok := requestctx.Tenant(ctx)
	if !ok || info.ID == "" {
		return requestctx.TenantInfo{}, 0, ErrTenantMissing
	}
	id, convErr := strconv.ParseInt(strings.TrimSpace(info.ID), 10, 64)
	if convErr != nil {
		return requestctx.TenantInfo{}, 0, ErrTenantMissing
	}
	return info, id, nil
}

func scopeContains(raw, expected string) bool {
	for _, scope := range strings.Fields(strings.TrimSpace(raw)) {
		if strings.TrimSpace(scope) == expected {
			return true
		}
	}
	return false
}

func resolveChannel(email, phone *string) (string, string) {
	if email != nil && strings.TrimSpace(*email) != "" {
		value := strings.TrimSpace(*email)
		return "email", value
	}
	if phone != nil && strings.TrimSpace(*phone) != "" {
		value := strings.TrimSpace(*phone)
		return "sms", value
	}
	return "", ""
}

func maskAddress(channel, address string) string {
	if channel == "email" {
		return maskEmail(address)
	}
	return maskPhone(address)
}

func maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}
	local := parts[0]
	domain := parts[1]
	if len(local) == 0 {
		return "***@" + domain
	}
	if len(local) == 1 {
		return local[:1] + "***@" + domain
	}
	return local[:1] + "***@" + domain
}

func maskPhone(phone string) string {
	if len(phone) <= 4 {
		return "***"
	}
	return phone[:len(phone)-4] + "****"
}

func generateRefreshToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

func optionalString(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func refreshSurfaceOrDefault(value, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}
	return trimmed
}

func parseDuration(value string, def time.Duration) time.Duration {
	if strings.TrimSpace(value) == "" {
		return def
	}
	if d, err := time.ParseDuration(value); err == nil {
		return d
	}
	return def
}

func parseRateLimit(value string, defaultMax int, defaultWindow time.Duration) auth.RateLimiterConfig {
	cfg := auth.RateLimiterConfig{
		MaxRequests: defaultMax,
		Window:      defaultWindow,
		MaxSize:     10000,
	}
	parts := strings.Split(value, "/")
	if len(parts) != 2 {
		return cfg
	}
	if max, err := strconv.Atoi(strings.TrimSpace(parts[0])); err == nil && max > 0 {
		cfg.MaxRequests = max
	}
	if window, err := time.ParseDuration(strings.TrimSpace(parts[1])); err == nil && window > 0 {
		cfg.Window = window
	}
	return cfg
}
