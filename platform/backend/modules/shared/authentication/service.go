package authsvc

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/appenv"
	"dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/config"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	notifypkg "dtriton.com/platform/backend/internal/platform/notify"
	"dtriton.com/platform/backend/internal/platform/postgres"
	tenantsvc "dtriton.com/platform/backend/internal/platform/tenant"
	eventsvc "dtriton.com/platform/backend/modules/shared/audit"
	notifysvc "dtriton.com/platform/backend/modules/shared/notifications"
	"dtriton.com/platform/backend/modules/shared/sessions"
)

var (
	ErrRateLimited   = errors.New("rate limit exceeded")
	ErrInvalidInput  = errors.New("invalid input")
	ErrTenantMissing = errors.New("tenant not found")
	ErrUserNotFound  = errors.New("user not found")
	ErrUserInactive  = errors.New("user inactive")
	ErrUserAccess    = errors.New("user access denied")
	ErrOTPInvalid    = errors.New("invalid otp code")
	ErrUnauthorized  = errors.New("unauthorized")
)

const defaultOTPMaxAttempts = 5

type AuthService struct {
	otpRepo     OTPRepository
	refreshRepo sessions.RefreshTokenRepository
	tenantUsers TenantUserRepository
	adminUsers  AdminUserRepository
	policyRepo  TenantAuthPolicyRepository
	jwtIssuer   auth.JWTIssuer
	notifySvc   *notifysvc.NotifyService
	eventSvc    *eventsvc.EventService
	rateLimiter auth.RateLimiter
	tenants     *tenantsvc.ServiceTenantProvider
	otpTTL      time.Duration
	otpLength   int
	refreshTTL  time.Duration
	accessTTL   time.Duration
	audience    string
	issuer      string
	logger      *slog.Logger
	jwksTTL     time.Duration
	runtimeEnv  appenv.Environment
	devFixedOTP string
}

type Config struct {
	Runtime appenv.Config `json:"runtime"`
	Auth    AuthConfig    `json:"auth"`
}

type AuthConfig struct {
	OTPTTL            string        `json:"otpttl"`
	OTPLength         int           `json:"otplength"`
	RefreshTTL        string        `json:"refreshttl"`
	AccessTTL         string        `json:"accessttl"`
	Audience          string        `json:"audience"`
	Issuer            string        `json:"issuer"`
	JWTAlgorithm      string        `json:"jwtalg"`
	JWTPrivateKeyPath string        `json:"jwtprivatepempath"`
	JWTPublicKeyPath  string        `json:"jwtpublicpempath"`
	JWKSCacheTTL      string        `json:"jwkscachettl"`
	RateLimitIP       string        `json:"ratelimitip"`
	Dev               AuthDevConfig `json:"dev"`
}

type AuthDevConfig struct {
	FixedOTP string `json:"fixedotp"`
}

type OTPRequest struct {
	Email     *string `json:"email"`
	Phone     *string `json:"phone"`
	IP        string
	UserAgent string
}

type OTPVerifyRequest struct {
	Email     *string `json:"email"`
	Phone     *string `json:"phone"`
	Code      string  `json:"code"`
	IP        string
	UserAgent string
}

type OTPRequestResponse struct {
	Status    string `json:"status"`
	OTPLength int    `json:"otp_length"`
}

type RefreshRequest struct {
	RefreshToken string
	IP           string
	UserAgent    string
}

type LogoutRequest struct {
	AllDevices   bool `json:"all_devices"`
	RefreshToken string
}

func NewService(sqlClient *postgres.Client, cfg *config.Config, logger *slog.Logger, tenants *tenantsvc.ServiceTenantProvider) (*AuthService, error) {

	var c Config
	_ = cfg.Unmarshal("", &c)

	notifySvc, err := notifysvc.NewService(sqlClient, cfg, logger)
	if err != nil {
		return nil, err
	}

	eventSvc, err := eventsvc.NewService(sqlClient, cfg, logger)
	if err != nil {
		return nil, err
	}

	otpRepo := NewOTPRepository(sqlClient)
	refreshRepo := sessions.NewRefreshTokenRepository(sqlClient)
	tenantUsers := NewTenantUserRepository(sqlClient)
	adminUsers := NewAdminUserRepository(sqlClient)
	policyRepo := NewTenantAuthPolicyRepository(sqlClient)

	jwtCfg := auth.JWTConfig{
		Algorithm:      strings.ToLower(c.Auth.JWTAlgorithm),
		PrivateKeyPath: c.Auth.JWTPrivateKeyPath,
		PublicKeyPath:  c.Auth.JWTPublicKeyPath,
		Issuer:         c.Auth.Issuer,
		Audience:       c.Auth.Audience,
	}
	jwtIssuer, err := auth.NewJWTIssuer(jwtCfg)
	if err != nil {
		return nil, fmt.Errorf("auth: init issuer: %w", err)
	}

	rlCfg := parseRateLimit(c.Auth.RateLimitIP, 30, time.Minute)
	rateLimiter := auth.NewRateLimiter(rlCfg)
	runtimeEnv := appenv.Normalize(c.Runtime.Environment)

	return &AuthService{
		otpRepo:     otpRepo,
		refreshRepo: refreshRepo,
		tenantUsers: tenantUsers,
		adminUsers:  adminUsers,
		policyRepo:  policyRepo,
		jwtIssuer:   jwtIssuer,
		notifySvc:   notifySvc,
		eventSvc:    eventSvc,
		rateLimiter: rateLimiter,
		tenants:     tenants,
		otpTTL:      parseDuration(c.Auth.OTPTTL, 10*time.Minute),
		otpLength:   c.Auth.OTPLength,
		refreshTTL:  parseDuration(c.Auth.RefreshTTL, 30*24*time.Hour),
		accessTTL:   parseDuration(c.Auth.AccessTTL, 15*time.Minute),
		audience:    c.Auth.Audience,
		issuer:      c.Auth.Issuer,
		jwksTTL:     parseDuration(c.Auth.JWKSCacheTTL, 10*time.Minute),
		logger:      logger,
		runtimeEnv:  runtimeEnv,
		devFixedOTP: strings.TrimSpace(c.Auth.Dev.FixedOTP),
	}, nil
}

func (s *AuthService) NewJWKSEndpoint() *auth.JWKSEndpoint {
	return auth.NewJWKSEndpoint(s.jwtIssuer, auth.NewJWKSCache(), s.jwksTTL)
}

func (s *AuthService) RequestOTP(ctx context.Context, req OTPRequest, r *http.Request) (*OTPRequestResponse, error) {
	if req.Email == nil && req.Phone == nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status": "failed",
			"reason": "invalid_input",
		})
		return nil, ErrInvalidInput
	}

	if req.IP != "" {
		if ok, err := s.rateLimiter.Check("ip:" + req.IP); err != nil || !ok {
			s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
				"status": "failed",
				"reason": "rate_limited_ip",
				"ip":     req.IP,
			})
			return nil, ErrRateLimited
		}
	}

	channel, address := resolveChannel(req.Email, req.Phone)
	if address == "" {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status": "failed",
			"reason": "invalid_input",
		})
		return nil, ErrInvalidInput
	}

	if ok, err := s.rateLimiter.Check("addr:" + address); err != nil || !ok {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  "rate_limited_address",
			"channel": channel,
			"address": address,
		})
		return nil, ErrRateLimited
	}

	tenantInfo, tenantID, err := tenantFromContext(ctx)
	if err != nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  authFailureReason(err),
			"channel": channel,
			"address": address,
		})
		return nil, err
	}

	policy, err := s.tenantPolicy(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	user, tenantCtx, err := s.resolveTenantUserByContact(ctx, tenantInfo, channel, address, policy)
	if err != nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  authFailureReason(err),
			"channel": channel,
			"address": address,
		})
		return nil, err
	}
	code, err := s.nextOTPCode(policy.OTPLength)
	if err != nil {
		return nil, err
	}

	hash, err := auth.HashOTP(code)
	if err != nil {
		return nil, err
	}

	_ = s.otpRepo.DeleteExpiredOTPsByAddress(ctx, tenantID, OTPChannel(channel), address)

	otp := &OTP{
		TenantID:  tenantID,
		Channel:   OTPChannel(channel),
		Address:   address,
		CodeHash:  hash,
		ExpiresAt: time.Now().Add(policy.OTPTTL),
		CreatedAt: time.Now(),
	}
	if err := s.otpRepo.CreateOTP(ctx, otp); err != nil {
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  "otp_create_failed",
			"channel": channel,
			"address": address,
			"code":    code,
		})
		return nil, err
	}

	data := map[string]any{
		"code": code,
		"ttl":  int(policy.OTPTTL.Minutes()),
	}

	if channel == "email" {
		_, err = s.notifySvc.SendEmail(tenantCtx, tenantInfo.ID, notifysvc.EmailRequest{
			To:       []string{address},
			Template: "otp",
			Locale:   "default",
			Data:     data,
		})
	} else {
		_, err = s.notifySvc.SendSMS(tenantCtx, tenantInfo.ID, notifysvc.SMSRequest{
			To:       address,
			Template: "otp",
			Locale:   "default",
			Data:     data,
		})
	}
	if err != nil {
		s.logger.Warn("notify send failed", "error", err)
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  "notify_send_failed",
			"channel": channel,
			"address": address,
			"code":    code,
		})
	}

	s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeOTPRequest, eventsvc.EventData{
		"channel": channel,
		"address": address,
		"code":    code,
		"status":  "success",
		"user_id": user.ID.String(),
	})

	return &OTPRequestResponse{
		Status:    "ok",
		OTPLength: policy.OTPLength,
	}, nil
}

func (s *AuthService) RequestAdminOTP(ctx context.Context, req OTPRequest, r *http.Request) (*OTPRequestResponse, error) {
	if req.Email == nil && req.Phone == nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status": "failed",
			"reason": "invalid_input",
		})
		return nil, ErrInvalidInput
	}

	if req.IP != "" {
		if ok, err := s.rateLimiter.Check("admin-ip:" + req.IP); err != nil || !ok {
			s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
				"status": "failed",
				"reason": "rate_limited_ip",
				"ip":     req.IP,
			})
			return nil, ErrRateLimited
		}
	}

	channel, address := resolveChannel(req.Email, req.Phone)
	if address == "" {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status": "failed",
			"reason": "invalid_input",
		})
		return nil, ErrInvalidInput
	}

	if ok, err := s.rateLimiter.Check("admin-addr:" + address); err != nil || !ok {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  "rate_limited_address",
			"channel": channel,
			"address": address,
		})
		return nil, ErrRateLimited
	}

	user, err := s.resolveAdminUserByContact(ctx, channel, address)
	if err != nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  authFailureReason(err),
			"channel": channel,
			"address": address,
		})
		return nil, err
	}

	adminCtx := requestctx.WithUser(ctx, requestctx.UserInfo{
		ID:    user.ID.String(),
		Email: user.Email,
		Level: user.Level,
		Role:  user.Role,
	})

	code, err := s.nextOTPCode(s.otpLength)
	if err != nil {
		return nil, err
	}

	hash, err := auth.HashOTP(code)
	if err != nil {
		return nil, err
	}

	_ = s.otpRepo.DeleteExpiredOTPsByAddress(ctx, platformAuthTenantID, OTPChannel(channel), address)

	otp := &OTP{
		TenantID:  platformAuthTenantID,
		Channel:   OTPChannel(channel),
		Address:   address,
		CodeHash:  hash,
		ExpiresAt: time.Now().Add(s.otpTTL),
		CreatedAt: time.Now(),
	}
	if err := s.otpRepo.CreateOTP(ctx, otp); err != nil {
		s.logAuthEvent(adminCtx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  "otp_create_failed",
			"channel": channel,
			"address": address,
			"code":    code,
		})
		return nil, err
	}

	if err := s.sendAdminOTP(ctx, channel, address, code); err != nil {
		s.logAuthEvent(adminCtx, r, eventsvc.EventTypeOTPRequestFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  "notify_send_failed",
			"channel": channel,
			"address": address,
			"code":    code,
		})
	}

	s.logAuthEvent(adminCtx, r, eventsvc.EventTypeOTPRequest, eventsvc.EventData{
		"channel": channel,
		"address": address,
		"code":    code,
		"status":  "success",
		"user_id": user.ID.String(),
	})
	return &OTPRequestResponse{
		Status:    "ok",
		OTPLength: s.otpLength,
	}, nil
}

func (s *AuthService) VerifyOTP(ctx context.Context, r *http.Request, req OTPVerifyRequest) (*IssuedTokens, error) {
	if req.Code == "" {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"status": "failed",
			"reason": "invalid_input",
		})
		return nil, ErrInvalidInput
	}

	channel, address := resolveChannel(req.Email, req.Phone)
	if address == "" {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"status": "failed",
			"reason": "invalid_input",
			"code":   req.Code,
		})
		return nil, ErrInvalidInput
	}

	tenantInfo, tenantID, err := tenantFromContext(ctx)
	if err != nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"channel": channel,
			"address": address,
			"code":    req.Code,
			"status":  "failed",
			"reason":  authFailureReason(err),
		})
		return nil, err
	}

	policy, err := s.tenantPolicy(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	user, tenantCtx, err := s.resolveTenantUserByContact(ctx, tenantInfo, channel, address, policy)
	if err != nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"channel": channel,
			"address": address,
			"code":    req.Code,
			"status":  "failed",
			"reason":  authFailureReason(err),
		})
		return nil, err
	}
	otps, err := s.otpRepo.ListActiveOTPs(ctx, tenantID, OTPChannel(channel), address, policy.OTPMaxAttempts)
	if err != nil {
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"channel":      channel,
			"address":      address,
			"code":         req.Code,
			"status":       "failed",
			"reason":       "otp_not_found",
			"max_attempts": policy.OTPMaxAttempts,
		})
		return nil, ErrOTPInvalid
	}
	if len(otps) == 0 {
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"channel":      channel,
			"address":      address,
			"code":         req.Code,
			"status":       "failed",
			"reason":       "otp_not_found",
			"max_attempts": policy.OTPMaxAttempts,
		})
		return nil, ErrOTPInvalid
	}

	matchedOTP, err := findMatchingOTP(req.Code, otps)
	if err != nil {
		return nil, err
	}
	if matchedOTP == nil {
		nextAttempt := 1
		if latest := latestAttempt(otps); latest > 0 {
			nextAttempt = latest + 1
		}
		_ = s.otpRepo.IncrementAttemptsByAddress(ctx, tenantID, OTPChannel(channel), address, policy.OTPMaxAttempts)
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"channel":      channel,
			"address":      address,
			"code":         req.Code,
			"status":       "failed",
			"reason":       "otp_invalid",
			"attempt":      nextAttempt,
			"max_attempts": policy.OTPMaxAttempts,
		})
		return nil, ErrOTPInvalid
	}

	_ = s.otpRepo.DeleteOTPsByAddress(ctx, tenantID, OTPChannel(channel), address)

	claims := auth.NewJWTClaims(s.issuer, s.audience, user.ID, tenantID, user.Email, user.Phone, user.Level, user.Role, auth.AccessScopeTenantAPI)
	claims.ExpiresAt = time.Now().Add(s.accessTTL).Unix()

	accessToken, err := s.jwtIssuer.IssueToken(claims)
	if err != nil {
		return nil, err
	}

	refreshToken := generateRefreshToken()
	issuedAt := time.Now()
	refreshRecord := &sessions.RefreshToken{
		SessionID:     uuid.New(),
		TenantID:      tenantID,
		UserID:        user.ID,
		Surface:       sessions.RefreshSurfaceTenant,
		TokenHash:     sessions.HashToken(refreshToken),
		TokenFamilyID: uuid.New(),
		IPAddress:     optionalString(req.IP),
		UserAgent:     optionalString(req.UserAgent),
		CreatedAt:     issuedAt,
		UpdatedAt:     issuedAt,
		ExpiresAt:     issuedAt.Add(s.refreshTTL),
	}
	if err := s.refreshRepo.CreateToken(ctx, refreshRecord); err != nil {
		return nil, err
	}
	s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeSessionCreated, sessionEventData(refreshRecord, eventsvc.EventData{
		"status": "success",
		"action": "login",
	}))

	s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeOTPVerify, eventsvc.EventData{
		"channel": channel,
		"address": address,
		"code":    req.Code,
		"status":  "success",
		"user_id": user.ID.String(),
	})
	s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeLogin, eventsvc.EventData{
		"method":  "otp",
		"channel": channel,
		"address": address,
		"status":  "success",
		"text":    "OK",
		"user_id": user.ID.String(),
	})

	return &IssuedTokens{
		AccessToken:      accessToken,
		RefreshToken:     refreshToken,
		RefreshExpiresAt: refreshRecord.ExpiresAt,
		ExpiresIn:        int(s.accessTTL.Seconds()),
	}, nil
}

func (s *AuthService) VerifyAdminOTP(ctx context.Context, r *http.Request, req OTPVerifyRequest) (*IssuedTokens, error) {
	if req.Code == "" {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"status": "failed",
			"reason": "invalid_input",
		})
		return nil, ErrInvalidInput
	}

	channel, address := resolveChannel(req.Email, req.Phone)
	if address == "" {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"status": "failed",
			"reason": "invalid_input",
			"code":   req.Code,
		})
		return nil, ErrInvalidInput
	}

	user, err := s.resolveAdminUserByContact(ctx, channel, address)
	if err != nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  authFailureReason(err),
			"channel": channel,
			"address": address,
			"code":    req.Code,
		})
		return nil, err
	}

	adminCtx := requestctx.WithUser(ctx, requestctx.UserInfo{
		ID:    user.ID.String(),
		Email: user.Email,
		Level: user.Level,
		Role:  user.Role,
	})

	otps, err := s.otpRepo.ListActiveOTPs(ctx, platformAuthTenantID, OTPChannel(channel), address, defaultOTPMaxAttempts)
	if err != nil || len(otps) == 0 {
		s.logAuthEvent(adminCtx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  "otp_not_found",
			"channel": channel,
			"address": address,
			"code":    req.Code,
		})
		return nil, ErrOTPInvalid
	}

	matchedOTP, err := findMatchingOTP(req.Code, otps)
	if err != nil {
		return nil, err
	}
	if matchedOTP == nil {
		nextAttempt := 1
		if latest := latestAttempt(otps); latest > 0 {
			nextAttempt = latest + 1
		}
		_ = s.otpRepo.IncrementAttemptsByAddress(ctx, platformAuthTenantID, OTPChannel(channel), address, defaultOTPMaxAttempts)
		s.logAuthEvent(adminCtx, r, eventsvc.EventTypeOTPVerifyFail, eventsvc.EventData{
			"status":       "failed",
			"reason":       "otp_invalid",
			"attempt":      nextAttempt,
			"max_attempts": defaultOTPMaxAttempts,
			"channel":      channel,
			"address":      address,
			"code":         req.Code,
		})
		return nil, ErrOTPInvalid
	}

	_ = s.otpRepo.DeleteOTPsByAddress(ctx, platformAuthTenantID, OTPChannel(channel), address)

	claims := auth.NewAdminJWTClaims(s.issuer, s.audience, user.ID, user.Email, user.Phone, user.Level, user.Role)
	claims.ExpiresAt = time.Now().Add(s.accessTTL).Unix()

	accessToken, err := s.jwtIssuer.IssueToken(claims)
	if err != nil {
		return nil, err
	}

	refreshToken := generateRefreshToken()
	issuedAt := time.Now()
	refreshRecord := &sessions.RefreshToken{
		SessionID:     uuid.New(),
		TenantID:      platformAuthTenantID,
		UserID:        user.ID,
		Surface:       sessions.RefreshSurfaceAdmin,
		TokenHash:     sessions.HashToken(refreshToken),
		TokenFamilyID: uuid.New(),
		IPAddress:     optionalString(req.IP),
		UserAgent:     optionalString(req.UserAgent),
		CreatedAt:     issuedAt,
		UpdatedAt:     issuedAt,
		ExpiresAt:     issuedAt.Add(s.refreshTTL),
	}
	if err := s.refreshRepo.CreateToken(ctx, refreshRecord); err != nil {
		return nil, err
	}
	s.logAuthEvent(adminCtx, r, eventsvc.EventTypeSessionCreated, sessionEventData(refreshRecord, eventsvc.EventData{
		"status": "success",
		"action": "login",
	}))

	s.logAuthEvent(adminCtx, r, eventsvc.EventTypeOTPVerify, eventsvc.EventData{
		"channel": channel,
		"address": address,
		"code":    req.Code,
		"status":  "success",
		"user_id": user.ID.String(),
	})
	s.logAuthEvent(adminCtx, r, eventsvc.EventTypeLogin, eventsvc.EventData{
		"method":  "otp",
		"channel": channel,
		"address": address,
		"status":  "success",
		"text":    "OK",
		"user_id": user.ID.String(),
	})
	return &IssuedTokens{
		AccessToken:      accessToken,
		RefreshToken:     refreshToken,
		RefreshExpiresAt: refreshRecord.ExpiresAt,
		ExpiresIn:        int(s.accessTTL.Seconds()),
	}, nil
}

func (s *AuthService) Refresh(ctx context.Context, r *http.Request, req RefreshRequest) (*IssuedTokens, error) {
	if strings.TrimSpace(req.RefreshToken) == "" {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeTokenRefreshFail, eventsvc.EventData{
			"status": "failed",
			"reason": "refresh_cookie_missing",
		})
		return nil, ErrUnauthorized
	}

	tokenHash := sessions.HashToken(req.RefreshToken)
	token, err := s.refreshRepo.GetTokenRecord(ctx, tokenHash)
	if err != nil {
		reason := refreshFailureReason(nil, err)
		s.logAuthEvent(ctx, r, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData(reason, nil))
		if errors.Is(err, sessions.ErrRefreshTokenNotFound) {
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	switch token.StateAt(time.Now()) {
	case sessions.RefreshTokenStateRotated:
		s.revokeTokenFamilyQuietly(ctx, token)
		s.logAuthEvent(ctx, r, eventsvc.EventTypeSessionReuse, sessionEventData(token, eventsvc.EventData{
			"status": "failed",
			"reason": "reuse_detected",
		}))
		s.logAuthEvent(ctx, r, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData("reuse_detected", token))
		return nil, ErrUnauthorized
	case sessions.RefreshTokenStateRevoked:
		s.logAuthEvent(ctx, r, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData("token_revoked", token))
		return nil, ErrUnauthorized
	case sessions.RefreshTokenStateExpired:
		s.logAuthEvent(ctx, r, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData("token_expired", token))
		return nil, ErrUnauthorized
	}

	if token.TenantID == platformAuthTenantID {
		return s.refreshAdminToken(ctx, token, tokenHash, req)
	}

	return s.refreshTenantToken(ctx, r, token, tokenHash, req)
}

func (s *AuthService) Logout(ctx context.Context, r *http.Request, req LogoutRequest) error {
	refreshToken := strings.TrimSpace(req.RefreshToken)
	if refreshToken == "" {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeLogoutFail, eventsvc.EventData{
			"status": "failed",
			"reason": "refresh_cookie_missing",
		})
		return nil
	}

	tokenHash := sessions.HashToken(refreshToken)
	token, err := s.refreshRepo.GetTokenRecord(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, sessions.ErrRefreshTokenNotFound) {
			s.logAuthEvent(ctx, r, eventsvc.EventTypeLogout, eventsvc.EventData{
				"all_devices": req.AllDevices,
				"status":      "success",
				"reason":      "session_not_found",
			})
			return nil
		}
		s.logAuthEvent(ctx, r, eventsvc.EventTypeLogoutFail, eventsvc.EventData{
			"status": "failed",
			"reason": "token_lookup_failed",
		})
		return err
	}

	logoutCtx := ctx
	if token.TenantID != platformAuthTenantID {
		if tenantCtx, tenantInfo, terr := s.ensureTenantContext(ctx, token.TenantID); terr == nil {
			if !routeDomainMatchesTenantHost(refreshRouteDomain(ctx), tenantInfo.Host) {
				s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeLogoutFail, eventsvc.EventData{
					"status":    "failed",
					"reason":    "tenant_host_mismatch",
					"tenant_id": token.TenantID,
					"surface":   sessions.RefreshSurfaceTenant,
				})
				return ErrUnauthorized
			}
			logoutCtx = tenantCtx
		}
	}

	if req.AllDevices {
		err = s.refreshRepo.RevokeUserTokens(ctx, token.TenantID, token.UserID, nil)
	} else if token.TokenFamilyID != uuid.Nil {
		err = s.refreshRepo.RevokeTokenFamily(ctx, token.TokenFamilyID)
	} else {
		err = s.refreshRepo.RevokeToken(ctx, tokenHash)
	}
	if err != nil && !errors.Is(err, sessions.ErrRefreshTokenNotFound) {
		s.logAuthEvent(logoutCtx, r, eventsvc.EventTypeLogoutFail, eventsvc.EventData{
			"status":      "failed",
			"reason":      "revoke_failed",
			"all_devices": req.AllDevices,
		})
		return err
	}

	s.logAuthEvent(logoutCtx, r, eventsvc.EventTypeLogout, eventsvc.EventData{
		"all_devices": req.AllDevices,
		"status":      "success",
		"surface":     token.Surface,
		"user_id":     token.UserID.String(),
	})
	s.logAuthEvent(logoutCtx, r, eventsvc.EventTypeSessionRevoked, sessionEventData(token, eventsvc.EventData{
		"status":      "success",
		"all_devices": req.AllDevices,
		"action":      "logout",
	}))

	return nil
}

func (s *AuthService) CleanupExpiredOTPs(ctx context.Context) error {
	_, tenantID, err := tenantFromContext(ctx)
	if err != nil {
		return err
	}
	return s.otpRepo.DeleteExpiredOTPs(ctx, tenantID)
}

func (s *AuthService) CleanupExpiredRefreshTokens(ctx context.Context) error {
	_, tenantID, err := tenantFromContext(ctx)
	if err != nil {
		return err
	}
	return s.refreshRepo.DeleteExpiredTokens(ctx, tenantID)
}

func (s *AuthService) ValidateToken(token string) (*auth.JWTClaims, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, ErrInvalidInput
	}
	return s.jwtIssuer.ValidateToken(token)
}

func (s *AuthService) nextOTPCode(length int) (string, error) {
	if !s.runtimeEnv.IsDevelopmentLike() {
		return auth.GenerateOTP(length)
	}

	return resolveDevOTPCode(length, s.devFixedOTP)
}

func resolveDevOTPCode(length int, fixed string) (string, error) {
	if length < 4 || length > 10 {
		return "", fmt.Errorf("OTP length must be between 4 and 10, got %d", length)
	}

	fixed = strings.TrimSpace(fixed)
	if fixed == "" {
		return strings.Repeat("9", length), nil
	}

	for _, r := range fixed {
		if r < '0' || r > '9' {
			return "", errors.New("auth.dev.fixedotp must contain only digits")
		}
	}

	if len(fixed) == length {
		return fixed, nil
	}

	if len(fixed) > length {
		return fixed[:length], nil
	}

	last := fixed[len(fixed)-1:]
	return fixed + strings.Repeat(last, length-len(fixed)), nil
}

func latestAttempt(otps []*OTP) int {
	maxAttempt := 0
	for _, otp := range otps {
		if otp != nil && otp.Attempts > maxAttempt {
			maxAttempt = otp.Attempts
		}
	}
	return maxAttempt
}

func authFailureReason(err error) string {
	switch {
	case errors.Is(err, ErrInvalidInput):
		return "invalid_input"
	case errors.Is(err, ErrRateLimited):
		return "rate_limited"
	case errors.Is(err, ErrTenantMissing):
		return "tenant_missing"
	case errors.Is(err, ErrUserNotFound):
		return "user_not_found"
	case errors.Is(err, ErrUserAccess):
		return "user_access_disabled"
	case errors.Is(err, ErrUserInactive):
		return "user_inactive"
	case errors.Is(err, ErrOTPInvalid):
		return "otp_invalid"
	case errors.Is(err, ErrUnauthorized):
		return "unauthorized"
	default:
		return "internal_error"
	}
}

func (s *AuthService) tenantPolicy(ctx context.Context, tenantID int64) (TenantAuthPolicy, error) {
	policy := TenantAuthPolicy{
		TenantID:                 tenantID,
		OTPLength:                s.otpLength,
		OTPTTL:                   s.otpTTL,
		OTPMaxAttempts:           defaultOTPMaxAttempts,
		OTPEmailEnabled:          true,
		OTPPhoneEnabled:          true,
		LoginRequiresUsersAccess: true,
		LoginRequiresUsersAct:    true,
	}
	if s.policyRepo == nil || tenantID == 0 {
		return policy, nil
	}

	stored, err := s.policyRepo.GetByTenantID(ctx, tenantID)
	if err != nil {
		return policy, err
	}
	if stored == nil {
		return policy, nil
	}
	if stored.OTPLength > 0 {
		policy.OTPLength = stored.OTPLength
	}
	if stored.OTPTTL > 0 {
		policy.OTPTTL = stored.OTPTTL
	}
	if stored.OTPMaxAttempts > 0 {
		policy.OTPMaxAttempts = stored.OTPMaxAttempts
	}
	policy.OTPEmailEnabled = stored.OTPEmailEnabled
	policy.OTPPhoneEnabled = stored.OTPPhoneEnabled
	policy.LoginRequiresUsersAccess = stored.LoginRequiresUsersAccess
	policy.LoginRequiresUsersAct = stored.LoginRequiresUsersAct
	return policy, nil
}

func (s *AuthService) logAuthEvent(ctx context.Context, r *http.Request, eventType eventsvc.EventType, data eventsvc.EventData) {
	if s.eventSvc == nil {
		return
	}
	if !shouldLogAuthEvent(eventType) {
		return
	}
	if err := s.eventSvc.Log(ctx, eventsvc.ModuleAuth, eventType, r, data); err != nil {
		s.logger.Debug("auth event log failed", "event_type", eventType, "error", err)
	}
}

func shouldLogAuthEvent(eventType eventsvc.EventType) bool {
	switch eventType {
	case eventsvc.EventTypeOTPRequest,
		eventsvc.EventTypeLogin,
		eventsvc.EventTypeLogout,
		eventsvc.EventTypeSessionCreated,
		eventsvc.EventTypeSessionRotated,
		eventsvc.EventTypeSessionRevoked,
		eventsvc.EventTypeSessionReuse,
		eventsvc.EventTypeOTPRequestFail,
		eventsvc.EventTypeOTPVerifyFail,
		eventsvc.EventTypeTokenRefreshFail,
		eventsvc.EventTypeLogoutFail:
		return true
	default:
		return false
	}
}

func (s *AuthService) resolveAdminUserByContact(ctx context.Context, channel, address string) (*AdminUser, error) {
	var (
		user *AdminUser
		err  error
	)

	switch channel {
	case "email":
		user, err = s.adminUsers.FindByEmail(ctx, address)
	case "sms":
		user, err = s.adminUsers.FindByPhone(ctx, address)
	default:
		return nil, ErrInvalidInput
	}
	if err != nil {
		if errors.Is(err, ErrAdminUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("admin user lookup: %w", err)
	}

	normalizeAdminUser(user)
	if reason := adminUserBlockReason(user); reason != "" {
		return nil, ErrUserInactive
	}

	return user, nil
}

func (s *AuthService) sendAdminOTP(ctx context.Context, channel, address, code string) error {
	if s.notifySvc == nil {
		return nil
	}

	switch channel {
	case "email":
		_, err := s.notifySvc.SendRenderedEmail(ctx, notifypkg.EmailInput{
			To:       []string{address},
			Subject:  "Platform admin verification code",
			HTMLBody: "<p>Your platform admin verification code is <strong>" + code + "</strong>.</p>",
			TextBody: "Your platform admin verification code is " + code + ".",
			Metadata: map[string]string{
				"surface": "admin",
				"channel": "email",
			},
		})
		return err
	case "sms":
		_, err := s.notifySvc.SendRenderedSMS(ctx, notifypkg.SMSInput{
			To:   address,
			Body: "Your platform admin verification code is " + code + ".",
			Metadata: map[string]string{
				"surface": "admin",
				"channel": "sms",
			},
		})
		return err
	default:
		return ErrInvalidInput
	}
}

func (s *AuthService) refreshTenantToken(ctx context.Context, r *http.Request, token *sessions.RefreshToken, currentTokenHash string, req RefreshRequest) (*IssuedTokens, error) {
	tenantCtx, tenantInfo, terr := s.ensureTenantContext(ctx, token.TenantID)
	if terr != nil {
		s.logAuthEvent(ctx, r, eventsvc.EventTypeTokenRefreshFail, eventsvc.EventData{
			"status": "failed",
			"reason": "tenant_missing",
		})
		return nil, ErrTenantMissing
	}
	if !routeDomainMatchesTenantHost(refreshRouteDomain(ctx), tenantInfo.Host) {
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeTokenRefreshFail, eventsvc.EventData{
			"status":    "failed",
			"reason":    "tenant_host_mismatch",
			"tenant_id": token.TenantID,
			"surface":   sessions.RefreshSurfaceTenant,
		})
		return nil, ErrUnauthorized
	}

	policy, err := s.tenantPolicy(ctx, token.TenantID)
	if err != nil {
		return nil, err
	}

	user, err := s.tenantUsers.GetByID(tenantCtx, tenantInfo, token.UserID)
	if err != nil {
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeTokenRefreshFail, eventsvc.EventData{
			"status": "failed",
			"reason": "user_not_found",
		})
		return nil, ErrUnauthorized
	}

	normalizeTenantUser(user)
	if reason := tenantUserBlockReason(user, policy); reason != "" {
		errResult := ErrUserInactive
		if reason == "user_access_disabled" {
			errResult = ErrUserAccess
		}
		s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeTokenRefreshFail, eventsvc.EventData{
			"status":  "failed",
			"reason":  reason,
			"user_id": user.ID.String(),
		})
		return nil, errResult
	}

	claims := auth.NewJWTClaims(s.issuer, s.audience, token.UserID, token.TenantID, user.Email, user.Phone, user.Level, user.Role, auth.AccessScopeTenantAPI)
	claims.ExpiresAt = time.Now().Add(s.accessTTL).Unix()

	accessToken, err := s.jwtIssuer.IssueToken(claims)
	if err != nil {
		return nil, err
	}

	newRefresh := generateRefreshToken()
	issuedAt := time.Now()
	refreshRecord := &sessions.RefreshToken{
		SessionID:     token.SessionID,
		TenantID:      token.TenantID,
		UserID:        token.UserID,
		Surface:       refreshSurfaceOrDefault(token.Surface, sessions.RefreshSurfaceTenant),
		TokenHash:     sessions.HashToken(newRefresh),
		TokenFamilyID: token.TokenFamilyID,
		IPAddress:     optionalString(req.IP),
		UserAgent:     optionalString(req.UserAgent),
		CreatedAt:     issuedAt,
		UpdatedAt:     issuedAt,
		ExpiresAt:     issuedAt.Add(s.refreshTTL),
	}
	if err := s.refreshRepo.RotateToken(ctx, currentTokenHash, refreshRecord); err != nil {
		if errors.Is(err, sessions.ErrRefreshTokenRotated) {
			s.revokeTokenFamilyQuietly(tenantCtx, token)
			s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeSessionReuse, sessionEventData(token, eventsvc.EventData{
				"status": "failed",
				"reason": "reuse_detected",
			}))
			s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData("reuse_detected", token))
			return nil, ErrUnauthorized
		}
		if errors.Is(err, sessions.ErrRefreshTokenRevoked) || errors.Is(err, sessions.ErrRefreshTokenExpired) || errors.Is(err, sessions.ErrRefreshTokenNotFound) {
			s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData(refreshFailureReason(token, err), token))
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeTokenRefresh, eventsvc.EventData{
		"status":  "success",
		"user_id": user.ID.String(),
	})
	s.logAuthEvent(tenantCtx, r, eventsvc.EventTypeSessionRotated, sessionEventData(refreshRecord, eventsvc.EventData{
		"status": "success",
		"action": "refresh",
	}))

	return &IssuedTokens{
		AccessToken:      accessToken,
		RefreshToken:     newRefresh,
		RefreshExpiresAt: refreshRecord.ExpiresAt,
		ExpiresIn:        int(s.accessTTL.Seconds()),
	}, nil
}

func (s *AuthService) refreshAdminToken(ctx context.Context, token *sessions.RefreshToken, currentTokenHash string, req RefreshRequest) (*IssuedTokens, error) {
	user, err := s.adminUsers.GetByID(ctx, token.UserID)
	if err != nil {
		return nil, ErrUnauthorized
	}
	if reason := adminUserBlockReason(user); reason != "" {
		return nil, ErrUserInactive
	}

	claims := auth.NewAdminJWTClaims(s.issuer, s.audience, token.UserID, user.Email, user.Phone, user.Level, user.Role)
	claims.ExpiresAt = time.Now().Add(s.accessTTL).Unix()

	accessToken, err := s.jwtIssuer.IssueToken(claims)
	if err != nil {
		return nil, err
	}

	newRefresh := generateRefreshToken()
	issuedAt := time.Now()
	refreshRecord := &sessions.RefreshToken{
		SessionID:     token.SessionID,
		TenantID:      platformAuthTenantID,
		UserID:        token.UserID,
		Surface:       refreshSurfaceOrDefault(token.Surface, sessions.RefreshSurfaceAdmin),
		TokenHash:     sessions.HashToken(newRefresh),
		TokenFamilyID: token.TokenFamilyID,
		IPAddress:     optionalString(req.IP),
		UserAgent:     optionalString(req.UserAgent),
		CreatedAt:     issuedAt,
		UpdatedAt:     issuedAt,
		ExpiresAt:     issuedAt.Add(s.refreshTTL),
	}
	refreshCtx := requestctx.WithUser(ctx, requestctx.UserInfo{
		ID:    user.ID.String(),
		Email: user.Email,
		Level: user.Level,
		Role:  user.Role,
	})
	if err := s.refreshRepo.RotateToken(ctx, currentTokenHash, refreshRecord); err != nil {
		if errors.Is(err, sessions.ErrRefreshTokenRotated) {
			s.revokeTokenFamilyQuietly(refreshCtx, token)
			s.logAuthEvent(refreshCtx, nil, eventsvc.EventTypeSessionReuse, sessionEventData(token, eventsvc.EventData{
				"status": "failed",
				"reason": "reuse_detected",
			}))
			s.logAuthEvent(refreshCtx, nil, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData("reuse_detected", token))
			return nil, ErrUnauthorized
		}
		if errors.Is(err, sessions.ErrRefreshTokenRevoked) || errors.Is(err, sessions.ErrRefreshTokenExpired) || errors.Is(err, sessions.ErrRefreshTokenNotFound) {
			s.logAuthEvent(refreshCtx, nil, eventsvc.EventTypeTokenRefreshFail, refreshFailureEventData(refreshFailureReason(token, err), token))
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	s.logAuthEvent(refreshCtx, nil, eventsvc.EventTypeTokenRefresh, eventsvc.EventData{
		"status":  "success",
		"user_id": user.ID.String(),
	})
	s.logAuthEvent(refreshCtx, nil, eventsvc.EventTypeSessionRotated, sessionEventData(refreshRecord, eventsvc.EventData{
		"status": "success",
		"action": "refresh",
	}))
	return &IssuedTokens{
		AccessToken:      accessToken,
		RefreshToken:     newRefresh,
		RefreshExpiresAt: refreshRecord.ExpiresAt,
		ExpiresIn:        int(s.accessTTL.Seconds()),
	}, nil
}

func findMatchingOTP(code string, otps []*OTP) (*OTP, error) {
	for _, otp := range otps {
		valid, err := auth.VerifyOTP(code, otp.CodeHash)
		if err != nil {
			return nil, err
		}
		if valid {
			return otp, nil
		}
	}

	return nil, nil
}

func refreshFailureReason(token *sessions.RefreshToken, err error) string {
	switch {
	case errors.Is(err, sessions.ErrRefreshTokenNotFound):
		return "token_not_found"
	case errors.Is(err, sessions.ErrRefreshTokenRotated):
		return "reuse_detected"
	case errors.Is(err, sessions.ErrRefreshTokenRevoked):
		return "token_revoked"
	case errors.Is(err, sessions.ErrRefreshTokenExpired):
		return "token_expired"
	}

	if token == nil {
		return "internal_error"
	}

	switch token.StateAt(time.Now()) {
	case sessions.RefreshTokenStateRotated:
		return "reuse_detected"
	case sessions.RefreshTokenStateRevoked:
		return "token_revoked"
	case sessions.RefreshTokenStateExpired:
		return "token_expired"
	default:
		return "internal_error"
	}
}

func refreshFailureEventData(reason string, token *sessions.RefreshToken) eventsvc.EventData {
	data := eventsvc.EventData{
		"status": "failed",
		"reason": reason,
	}
	if token == nil {
		return data
	}
	if token.SessionID != uuid.Nil {
		data["session_id"] = token.SessionID.String()
	}
	if token.TokenFamilyID != uuid.Nil {
		data["token_family_id"] = token.TokenFamilyID.String()
	}
	if token.UserID != uuid.Nil {
		data["user_id"] = token.UserID.String()
	}
	if token.TenantID != 0 {
		data["tenant_id"] = token.TenantID
	}
	if surface := strings.TrimSpace(token.Surface); surface != "" {
		data["surface"] = surface
	}
	return data
}

func sessionEventData(token *sessions.RefreshToken, base eventsvc.EventData) eventsvc.EventData {
	data := eventsvc.EventData{}
	for k, v := range base {
		data[k] = v
	}
	if token == nil {
		return data
	}
	if token.SessionID != uuid.Nil {
		data["session_id"] = token.SessionID.String()
	}
	if token.TokenFamilyID != uuid.Nil {
		data["token_family_id"] = token.TokenFamilyID.String()
	}
	if token.UserID != uuid.Nil {
		data["user_id"] = token.UserID.String()
	}
	if token.TenantID != 0 {
		data["tenant_id"] = token.TenantID
	}
	if surface := strings.TrimSpace(token.Surface); surface != "" {
		data["surface"] = surface
	}
	if token.ExpiresAt.IsZero() {
		return data
	}
	data["expires_at"] = token.ExpiresAt.UTC().Format(time.RFC3339)
	return data
}

func (s *AuthService) revokeTokenFamilyQuietly(ctx context.Context, token *sessions.RefreshToken) {
	if s.refreshRepo == nil || token == nil || token.TokenFamilyID == uuid.Nil {
		return
	}
	if err := s.refreshRepo.RevokeTokenFamily(ctx, token.TokenFamilyID); err != nil && !errors.Is(err, sessions.ErrRefreshTokenNotFound) {
		s.logger.Debug("refresh token family revoke failed",
			"token_family_id", token.TokenFamilyID.String(),
			"error", err,
		)
	}
}

func (s *AuthService) resolveTenantUserByContact(ctx context.Context, tenantInfo requestctx.TenantInfo, channel, address string, policy TenantAuthPolicy) (*TenantUser, context.Context, error) {
	if !authChannelEnabled(policy, channel) {
		return nil, ctx, ErrInvalidInput
	}

	var (
		user *TenantUser
		err  error
	)

	switch channel {
	case "email":
		user, err = s.tenantUsers.FindByEmail(ctx, tenantInfo, address)
	case "sms":
		user, err = s.tenantUsers.FindByPhone(ctx, tenantInfo, address)
	default:
		return nil, ctx, ErrInvalidInput
	}
	if err != nil {
		if errors.Is(err, ErrTenantUserNotFound) {
			return nil, ctx, ErrUserNotFound
		}
		return nil, ctx, fmt.Errorf("tenant user lookup: %w", err)
	}

	normalizeTenantUser(user)
	if reason := tenantUserBlockReason(user, policy); reason != "" {
		if reason == "user_access_disabled" {
			return nil, ctx, ErrUserAccess
		}
		return nil, ctx, ErrUserInactive
	}

	tenantCtx := requestctx.WithUser(ctx, requestctx.UserInfo{
		ID:    user.ID.String(),
		Email: user.Email,
		Level: user.Level,
		Role:  user.Role,
	})
	return user, tenantCtx, nil
}

func (s *AuthService) ensureTenantContext(ctx context.Context, tenantID int64) (context.Context, requestctx.TenantInfo, error) {
	if tenantID == 0 {
		return ctx, requestctx.TenantInfo{}, ErrTenantMissing
	}

	tenantIDStr := strconv.FormatInt(tenantID, 10)
	tenant, err := s.tenants.GetByID(ctx, tenantIDStr)
	if err != nil {
		return ctx, requestctx.TenantInfo{}, fmt.Errorf("tenant lookup: %w", err)
	}

	info := requestctx.TenantInfo{
		ID:             tenant.ID,
		Name:           tenant.Name,
		Host:           tenant.Host,
		Status:         tenant.Status,
		Plan:           tenant.Plan,
		DBName:         tenant.DBName,
		DBInstanceID:   tenant.DBInstanceID,
		DBInstanceCode: tenant.DBInstanceCode,
	}
	return requestctx.WithTenant(ctx, info), info, nil
}

func refreshRouteDomain(ctx context.Context) string {
	route, ok := requestctx.Route(ctx)
	if !ok {
		return ""
	}
	return strings.TrimSpace(route.Domain)
}

func routeDomainMatchesTenantHost(routeDomain, tenantHost string) bool {
	routeDomain = strings.TrimSpace(strings.ToLower(routeDomain))
	tenantHost = strings.TrimSpace(strings.ToLower(tenantHost))
	if routeDomain == "" || routeDomain == "undefined" || tenantHost == "" {
		return false
	}
	return routeDomain == tenantHost
}
