package server

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
)

func TestWriteRefreshTokenCookie(t *testing.T) {
	srv := &Server{config: &Config{Cookie: normalizeCookieConfig(CookieConfig{})}}
	rec := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "http://127.0.0.1/auth/otp/verify", nil)
	req.Header.Set("X-Forwarded-Proto", "https")

	expiresAt := time.Now().Add(2 * time.Hour).UTC().Truncate(time.Second)
	srv.writeRefreshTokenCookie(rec, req, &authsvc.IssuedTokens{
		RefreshToken:     "refresh-token",
		RefreshExpiresAt: expiresAt,
	})

	res := rec.Result()
	cookies := res.Cookies()
	if len(cookies) != 1 {
		t.Fatalf("cookies len = %d, want 1", len(cookies))
	}

	cookie := cookies[0]
	if cookie.Name != defaultRefreshCookieName {
		t.Fatalf("cookie name = %q, want %q", cookie.Name, defaultRefreshCookieName)
	}
	if cookie.Value != "refresh-token" {
		t.Fatalf("cookie value = %q, want %q", cookie.Value, "refresh-token")
	}
	if cookie.Path != defaultRefreshCookiePath {
		t.Fatalf("cookie path = %q, want %q", cookie.Path, defaultRefreshCookiePath)
	}
	if !cookie.HttpOnly {
		t.Fatal("cookie should be HttpOnly")
	}
	if !cookie.Secure {
		t.Fatal("cookie should be Secure when forwarded proto is https")
	}
	if !cookie.Expires.Equal(expiresAt) {
		t.Fatalf("cookie expires = %s, want %s", cookie.Expires, expiresAt)
	}
	setCookie := res.Header.Get("Set-Cookie")
	if !strings.Contains(setCookie, "SameSite=Lax") {
		t.Fatalf("Set-Cookie missing SameSite=Lax: %q", setCookie)
	}
}

func TestClearRefreshTokenCookie(t *testing.T) {
	srv := &Server{config: &Config{Cookie: normalizeCookieConfig(CookieConfig{})}}
	rec := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "http://127.0.0.1/auth/logout", nil)

	srv.clearRefreshTokenCookie(rec, req)

	res := rec.Result()
	cookies := res.Cookies()
	if len(cookies) != 1 {
		t.Fatalf("cookies len = %d, want 1", len(cookies))
	}

	cookie := cookies[0]
	if cookie.Name != defaultRefreshCookieName {
		t.Fatalf("cookie name = %q, want %q", cookie.Name, defaultRefreshCookieName)
	}
	if cookie.Value != "" {
		t.Fatalf("cookie value = %q, want empty", cookie.Value)
	}
	if cookie.MaxAge != -1 {
		t.Fatalf("cookie maxAge = %d, want -1", cookie.MaxAge)
	}
	if cookie.Path != defaultRefreshCookiePath {
		t.Fatalf("cookie path = %q, want %q", cookie.Path, defaultRefreshCookiePath)
	}
}

func TestRequestIsHTTPS(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1/auth/refresh", nil)
	if requestIsHTTPS(req) {
		t.Fatal("plain request should not be https")
	}

	req.Header.Set("X-Forwarded-Proto", "https")
	if !requestIsHTTPS(req) {
		t.Fatal("forwarded https should be treated as secure")
	}
}

func TestNormalizeCookieConfigDefaults(t *testing.T) {
	cfg := normalizeCookieConfig(CookieConfig{})
	if cfg.Name != defaultRefreshCookieName {
		t.Fatalf("Name = %q, want %q", cfg.Name, defaultRefreshCookieName)
	}
	if cfg.Path != defaultRefreshCookiePath {
		t.Fatalf("Path = %q, want %q", cfg.Path, defaultRefreshCookiePath)
	}
	if cfg.SameSite != defaultCookieSameSite {
		t.Fatalf("SameSite = %q, want %q", cfg.SameSite, defaultCookieSameSite)
	}
	if cfg.SecureMode != defaultCookieSecureMode {
		t.Fatalf("SecureMode = %q, want %q", cfg.SecureMode, defaultCookieSecureMode)
	}
}

func TestNormalizeCookieConfigSanitizesValues(t *testing.T) {
	cfg := normalizeCookieConfig(CookieConfig{
		Name:       " custom_rt ",
		Path:       "auth",
		Domain:     " .platform.local ",
		SameSite:   "Strict",
		SecureMode: "always",
	})

	if cfg.Name != "custom_rt" {
		t.Fatalf("Name = %q, want %q", cfg.Name, "custom_rt")
	}
	if cfg.Path != "/auth" {
		t.Fatalf("Path = %q, want %q", cfg.Path, "/auth")
	}
	if cfg.Domain != ".platform.local" {
		t.Fatalf("Domain = %q, want %q", cfg.Domain, ".platform.local")
	}
	if cfg.SameSite != "strict" {
		t.Fatalf("SameSite = %q, want %q", cfg.SameSite, "strict")
	}
	if cfg.SecureMode != "always" {
		t.Fatalf("SecureMode = %q, want %q", cfg.SecureMode, "always")
	}
}

func TestBaseRefreshCookieUsesConfiguredPolicy(t *testing.T) {
	srv := &Server{config: &Config{Cookie: normalizeCookieConfig(CookieConfig{
		Name:       "admin_rt",
		Path:       "/session/",
		Domain:     ".platform.local",
		SameSite:   "none",
		SecureMode: "always",
	})}}
	req := httptest.NewRequest("POST", "http://127.0.0.1/auth/refresh", nil)

	cookie := srv.baseRefreshCookie(req)
	if cookie.Name != "admin_rt" {
		t.Fatalf("Name = %q, want %q", cookie.Name, "admin_rt")
	}
	if cookie.Path != "/session/" {
		t.Fatalf("Path = %q, want %q", cookie.Path, "/session/")
	}
	if cookie.Domain != ".platform.local" {
		t.Fatalf("Domain = %q, want %q", cookie.Domain, ".platform.local")
	}
	if cookie.SameSite != http.SameSiteNoneMode {
		t.Fatalf("SameSite = %v, want %v", cookie.SameSite, http.SameSiteNoneMode)
	}
	if !cookie.Secure {
		t.Fatal("cookie should be Secure when securemode=always")
	}
	if !cookie.HttpOnly {
		t.Fatal("cookie should be HttpOnly")
	}
}

func TestCookieSameSiteModes(t *testing.T) {
	if got := cookieSameSite("strict"); got != http.SameSiteStrictMode {
		t.Fatalf("strict same-site = %v, want %v", got, http.SameSiteStrictMode)
	}
	if got := cookieSameSite("none"); got != http.SameSiteNoneMode {
		t.Fatalf("none same-site = %v, want %v", got, http.SameSiteNoneMode)
	}
	if got := cookieSameSite("invalid"); got != http.SameSiteLaxMode {
		t.Fatalf("invalid same-site = %v, want %v", got, http.SameSiteLaxMode)
	}
}

func TestCookieSecureModes(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1/auth/refresh", nil)
	if !cookieSecure("always", req) {
		t.Fatal("always mode should force secure")
	}
	if cookieSecure("never", req) {
		t.Fatal("never mode should disable secure")
	}
	req.Header.Set("X-Forwarded-Proto", "https")
	if !cookieSecure("auto", req) {
		t.Fatal("auto mode should follow request security")
	}
}

func TestReadRefreshTokenCookie(t *testing.T) {
	srv := &Server{config: &Config{Cookie: normalizeCookieConfig(CookieConfig{
		Name: "tenant_rt",
	})}}
	req := httptest.NewRequest("POST", "http://127.0.0.1/auth/refresh", nil)
	req.AddCookie(&http.Cookie{Name: "tenant_rt", Value: "cookie-refresh"})

	if got := srv.readRefreshTokenCookie(req); got != "cookie-refresh" {
		t.Fatalf("readRefreshTokenCookie = %q, want %q", got, "cookie-refresh")
	}
}

func TestHandleLogoutCookieClearsCookieOnInvalidJSON(t *testing.T) {
	srv := &Server{config: &Config{
		Origin: "admin.platform.local",
		Cookie: normalizeCookieConfig(CookieConfig{}),
	}}
	rec := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "http://127.0.0.1/auth/logout", bytes.NewBufferString("{invalid"))
	req.Header.Set("Origin", "https://admin.platform.local")

	srv.handleLogoutCookie().ServeHTTP(rec, req)

	res := rec.Result()
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.StatusCode, http.StatusBadRequest)
	}
	setCookie := res.Header.Get("Set-Cookie")
	if !strings.Contains(setCookie, defaultRefreshCookieName+"=") {
		t.Fatalf("Set-Cookie missing refresh cookie clear instruction: %q", setCookie)
	}
}

func TestEnsureCookieRequestOrigin(t *testing.T) {
	srv := &Server{config: &Config{Origin: "*.platform.local"}}

	validReq := httptest.NewRequest("POST", "http://127.0.0.1/auth/refresh", nil)
	validReq.Header.Set("Origin", "https://demo.platform.local")
	if err := srv.ensureCookieRequestOrigin(validReq); err != nil {
		t.Fatalf("valid origin returned error: %#v", err)
	}

	missingReq := httptest.NewRequest("POST", "http://127.0.0.1/auth/refresh", nil)
	if err := srv.ensureCookieRequestOrigin(missingReq); err == nil || err.Code != "AUTH_CSRF_ORIGIN_MISSING" {
		t.Fatalf("missing origin error = %#v, want AUTH_CSRF_ORIGIN_MISSING", err)
	}

	invalidReq := httptest.NewRequest("POST", "http://127.0.0.1/auth/refresh", nil)
	invalidReq.Header.Set("Origin", "https://evil.example")
	if err := srv.ensureCookieRequestOrigin(invalidReq); err == nil || err.Code != "AUTH_CSRF_ORIGIN_INVALID" {
		t.Fatalf("invalid origin error = %#v, want AUTH_CSRF_ORIGIN_INVALID", err)
	}
}
