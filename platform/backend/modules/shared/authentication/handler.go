package authsvc

import (
	"context"
	"errors"
	"net"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
)

type Handler struct {
	service *AuthService
}

func NewHandler(service *AuthService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RequestOTP(ctx context.Context, r *http.Request, req OTPRequest) (any, error) {
	req.IP = extractIP(r)
	req.UserAgent = r.Header.Get("User-Agent")

	resp, err := h.service.RequestOTP(ctx, req, r)
	if err != nil {
		return nil, mapError(err)
	}

	return resp, nil
}

func (h *Handler) VerifyOTP(ctx context.Context, r *http.Request, req OTPVerifyRequest) (*TokenResponse, error) {
	req.IP = extractIP(r)
	req.UserAgent = r.Header.Get("User-Agent")

	resp, err := h.service.VerifyOTP(ctx, r, req)
	if err != nil {
		return nil, mapError(err)
	}
	return resp, nil
}

func (h *Handler) RequestAdminOTP(ctx context.Context, r *http.Request, req OTPRequest) (any, error) {
	req.IP = extractIP(r)
	req.UserAgent = r.Header.Get("User-Agent")

	resp, err := h.service.RequestAdminOTP(ctx, req, r)
	if err != nil {
		return nil, mapError(err)
	}

	return resp, nil
}

func (h *Handler) VerifyAdminOTP(ctx context.Context, r *http.Request, req OTPVerifyRequest) (*TokenResponse, error) {
	req.IP = extractIP(r)
	req.UserAgent = r.Header.Get("User-Agent")

	resp, err := h.service.VerifyAdminOTP(ctx, r, req)
	if err != nil {
		return nil, mapError(err)
	}
	return resp, nil
}

func (h *Handler) Refresh(ctx context.Context, r *http.Request, req RefreshRequest) (*TokenResponse, error) {
	req.IP = extractIP(r)
	req.UserAgent = r.Header.Get("User-Agent")

	resp, err := h.service.Refresh(ctx, r, req)
	if err != nil {
		return nil, mapError(err)
	}
	return resp, nil
}

func (h *Handler) Logout(ctx context.Context, r *http.Request, req LogoutRequest) (any, error) {
	if err := h.service.Logout(ctx, r, req); err != nil {
		return nil, mapError(err)
	}
	return map[string]string{"status": "ok"}, nil
}

func (h *Handler) CleanupExpiredOTPs(ctx context.Context, _ *http.Request, _ CleanupExpiredTokensRequest) (any, error) {
	if err := h.service.CleanupExpiredOTPs(ctx); err != nil {
		return nil, mapError(err)
	}
	return map[string]string{"status": "ok"}, nil
}

func (h *Handler) CleanupExpiredRefreshTokens(ctx context.Context, _ *http.Request, _ CleanupExpiredRefreshTokensRequest) (any, error) {
	if err := h.service.CleanupExpiredRefreshTokens(ctx); err != nil {
		return nil, mapError(err)
	}
	return map[string]string{"status": "ok"}, nil
}

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrRateLimited):
		return apperr.New("AUTH_RATE_LIMIT", http.StatusTooManyRequests, "rate limit exceeded")
	case errors.Is(err, ErrInvalidInput):
		return apperr.New("AUTH_INVALID_INPUT", http.StatusBadRequest, "invalid input")
	case errors.Is(err, ErrTenantMissing):
		return apperr.New("AUTH_TENANT_MISSING", http.StatusBadRequest, "tenant not found")
	case errors.Is(err, ErrUserNotFound):
		return apperr.New("AUTH_USER_NOT_FOUND", http.StatusNotFound, "user not found")
	case errors.Is(err, ErrUserAccess):
		return apperr.New("AUTH_USER_ACCESS_DISABLED", http.StatusForbidden, "user access denied")
	case errors.Is(err, ErrUserInactive):
		return apperr.New("AUTH_USER_INACTIVE", http.StatusForbidden, "user inactive")
	case errors.Is(err, ErrOTPInvalid):
		return apperr.New("AUTH_OTP_INVALID", http.StatusForbidden, "invalid code")
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("AUTH_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	default:
		return apperr.New("AUTH_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}

func extractIP(r *http.Request) string {
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		parts := strings.Split(ip, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}
