package server

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	httpjson "dtriton.com/platform/backend/internal/platform/httpx/handler"
	appmw "dtriton.com/platform/backend/internal/platform/httpx/middleware"
	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
)

const (
	defaultRefreshCookieName = "platform_rt"
	defaultRefreshCookiePath = "/auth/"
	defaultCookieSameSite    = "lax"
	defaultCookieSecureMode  = "auto"
)

func (srv *Server) handleOTPVerifyCookie() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req authsvc.OTPVerifyRequest
		if err := decodeJSONBody(r, &req); err != nil {
			writeJSONError(w, apperr.New("INVALID_JSON", http.StatusBadRequest, "invalid json"))
			return
		}

		info, err := srv.authHTTP.VerifyOTPIssuedTokens(r.Context(), r, req)
		if err != nil {
			writeJSONError(w, apperr.WrapAndLog(srv.logger, r.Context(), "OTP_VERIFY",
				http.StatusInternalServerError, "cannot verify OTP", err, srv.FieldsForLog(r.Context(), r, req)...))
			return
		}

		srv.writeRefreshTokenCookie(w, r, info)
		writeJSONOK(w, info.PublicResponse())
	})
}

func (srv *Server) handleAdminOTPVerifyCookie() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req authsvc.OTPVerifyRequest
		if err := decodeJSONBody(r, &req); err != nil {
			writeJSONError(w, apperr.New("INVALID_JSON", http.StatusBadRequest, "invalid json"))
			return
		}

		info, err := srv.authHTTP.VerifyAdminOTPIssuedTokens(r.Context(), r, req)
		if err != nil {
			writeJSONError(w, apperr.WrapAndLog(srv.logger, r.Context(), "ADMIN_OTP_VERIFY",
				http.StatusInternalServerError, "cannot verify admin OTP", err, srv.FieldsForLog(r.Context(), r, req)...))
			return
		}

		srv.writeRefreshTokenCookie(w, r, info)
		writeJSONOK(w, info.PublicResponse())
	})
}

func (srv *Server) handleRefreshCookie() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := srv.ensureCookieRequestOrigin(r); err != nil {
			writeJSONError(w, err)
			return
		}

		req := authsvc.RefreshRequest{
			RefreshToken: srv.readRefreshTokenCookie(r),
		}

		info, err := srv.authHTTP.RefreshIssuedTokens(r.Context(), r, req)
		if err != nil {
			writeJSONError(w, apperr.WrapAndLog(srv.logger, r.Context(), "REFRESH",
				http.StatusInternalServerError, "cannot refresh", err, srv.FieldsForLog(r.Context(), r, req)...))
			return
		}

		srv.writeRefreshTokenCookie(w, r, info)
		writeJSONOK(w, info.PublicResponse())
	})
}

func (srv *Server) handleLogoutCookie() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := srv.ensureCookieRequestOrigin(r); err != nil {
			srv.clearRefreshTokenCookie(w, r)
			writeJSONError(w, err)
			return
		}

		var req authsvc.LogoutRequest
		if err := decodeJSONBody(r, &req); err != nil {
			srv.clearRefreshTokenCookie(w, r)
			writeJSONError(w, apperr.New("INVALID_JSON", http.StatusBadRequest, "invalid json"))
			return
		}
		req.RefreshToken = srv.readRefreshTokenCookie(r)

		info, err := srv.authHTTP.Logout(r.Context(), r, req)
		srv.clearRefreshTokenCookie(w, r)
		if err != nil {
			writeJSONError(w, apperr.WrapAndLog(srv.logger, r.Context(), "LOGOUT",
				http.StatusInternalServerError, "cannot logout", err, srv.FieldsForLog(r.Context(), r, req)...))
			return
		}

		writeJSONOK(w, info)
	})
}

func decodeJSONBody[T any](r *http.Request, out *T) error {
	if r == nil || out == nil || r.Body == nil || r.Body == http.NoBody {
		return nil
	}
	if err := json.NewDecoder(r.Body).Decode(out); err != nil {
		return err
	}
	return nil
}

func writeJSONOK(w http.ResponseWriter, data any) {
	writeJSON(w, http.StatusOK, httpjson.Response{
		Status: "ok",
		Data:   data,
	})
}

func writeJSONError(w http.ResponseWriter, err *apperr.AppError) {
	if err == nil {
		err = apperr.New("INTERNAL_ERROR", http.StatusInternalServerError, "internal server error")
	}
	writeJSON(w, err.StatusCode, httpjson.Response{
		Status:  "error",
		Code:    err.Code,
		Message: err.Message,
	})
}

func writeJSON(w http.ResponseWriter, status int, body httpjson.Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func (srv *Server) writeRefreshTokenCookie(w http.ResponseWriter, r *http.Request, tokens *authsvc.IssuedTokens) {
	if tokens == nil || strings.TrimSpace(tokens.RefreshToken) == "" {
		return
	}

	cookie := srv.baseRefreshCookie(r)
	cookie.Value = tokens.RefreshToken
	if !tokens.RefreshExpiresAt.IsZero() {
		cookie.Expires = tokens.RefreshExpiresAt.UTC()
		maxAge := int(time.Until(tokens.RefreshExpiresAt).Seconds())
		if maxAge < 0 {
			maxAge = 0
		}
		cookie.MaxAge = maxAge
	}

	http.SetCookie(w, cookie)
}

func (srv *Server) clearRefreshTokenCookie(w http.ResponseWriter, r *http.Request) {
	cookie := srv.baseRefreshCookie(r)
	cookie.Value = ""
	cookie.Expires = time.Unix(0, 0).UTC()
	cookie.MaxAge = -1
	http.SetCookie(w, cookie)
}

func (srv *Server) readRefreshTokenCookie(r *http.Request) string {
	if r == nil {
		return ""
	}
	cfg := normalizeCookieConfig(CookieConfig{})
	if srv != nil && srv.config != nil {
		cfg = normalizeCookieConfig(srv.config.Cookie)
	}
	cookie, err := r.Cookie(cfg.Name)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(cookie.Value)
}

func (srv *Server) baseRefreshCookie(r *http.Request) *http.Cookie {
	cfg := normalizeCookieConfig(CookieConfig{})
	if srv != nil && srv.config != nil {
		cfg = normalizeCookieConfig(srv.config.Cookie)
	}

	cookie := &http.Cookie{
		Name:     cfg.Name,
		Path:     cfg.Path,
		HttpOnly: true,
		Secure:   cookieSecure(cfg.SecureMode, r),
		SameSite: cookieSameSite(cfg.SameSite),
	}
	if domain := strings.TrimSpace(cfg.Domain); domain != "" {
		cookie.Domain = domain
	}
	return cookie
}

func requestIsHTTPS(r *http.Request) bool {
	if r == nil {
		return false
	}
	if r.TLS != nil {
		return true
	}
	forwardedProto := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-Proto"), ",")[0])
	if strings.EqualFold(forwardedProto, "https") {
		return true
	}
	if strings.EqualFold(strings.TrimSpace(r.Header.Get("X-Forwarded-Ssl")), "on") {
		return true
	}
	return false
}

func (srv *Server) ensureCookieRequestOrigin(r *http.Request) *apperr.AppError {
	if r == nil {
		return apperr.New("AUTH_CSRF_ORIGIN_INVALID", http.StatusForbidden, "origin check failed")
	}

	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin == "" {
		return apperr.New("AUTH_CSRF_ORIGIN_MISSING", http.StatusForbidden, "origin required")
	}

	allowedOrigins := []string{}
	if srv != nil && srv.config != nil {
		allowedOrigins = splitAllowedOrigins(srv.config.Origin)
	}
	if !appmw.OriginAllowed(origin, allowedOrigins) {
		return apperr.New("AUTH_CSRF_ORIGIN_INVALID", http.StatusForbidden, "origin check failed")
	}

	return nil
}

func normalizeCookieConfig(cfg CookieConfig) CookieConfig {
	cfg.Name = strings.TrimSpace(cfg.Name)
	if cfg.Name == "" {
		cfg.Name = defaultRefreshCookieName
	}

	cfg.Path = strings.TrimSpace(cfg.Path)
	if cfg.Path == "" {
		cfg.Path = defaultRefreshCookiePath
	}
	if !strings.HasPrefix(cfg.Path, "/") {
		cfg.Path = "/" + cfg.Path
	}

	cfg.Domain = strings.TrimSpace(cfg.Domain)

	cfg.SameSite = strings.ToLower(strings.TrimSpace(cfg.SameSite))
	switch cfg.SameSite {
	case "", "default":
		cfg.SameSite = defaultCookieSameSite
	case "lax", "strict", "none":
	default:
		cfg.SameSite = defaultCookieSameSite
	}

	cfg.SecureMode = strings.ToLower(strings.TrimSpace(cfg.SecureMode))
	switch cfg.SecureMode {
	case "", "default":
		cfg.SecureMode = defaultCookieSecureMode
	case "auto", "always", "never":
	default:
		cfg.SecureMode = defaultCookieSecureMode
	}

	return cfg
}

func cookieSameSite(value string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}

func cookieSecure(mode string, r *http.Request) bool {
	switch strings.ToLower(strings.TrimSpace(mode)) {
	case "always":
		return true
	case "never":
		return false
	default:
		return requestIsHTTPS(r)
	}
}
