package authsvc

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/config"
	tenantsvc "dtriton.com/platform/backend/internal/platform/tenant"
)

const (
	DelegatedTenantRootLaunchPath = "/auth/v1/delegated-root/"
	DefaultDelegatedTenantRootTTL = time.Minute
)

type DelegatedTenantRootTokenPayload struct {
	AdminUserID string `json:"adminUserId"`
	IssuedAt    int64  `json:"issuedAt"`
	Nonce       string `json:"nonce"`
	ReturnTo    string `json:"returnTo,omitempty"`
	TenantHost  string `json:"tenantHost"`
	TenantID    string `json:"tenantId"`
}

type DelegatedTenantRootTokenSchema struct {
	Clock     func() time.Time
	MaxAge    time.Duration
	NonceSize int
}

type DelegatedTenantRootLaunchInput struct {
	AdminUserID uuid.UUID
	ReturnTo    string
	Scheme      string
	TenantHost  string
	TenantID    string
}

type DelegatedTenantRootTokenService struct {
	codec  *auth.TokenCodec
	schema DelegatedTenantRootTokenSchema
}

func NewDelegatedTenantRootTokenService(cfg *config.Config) (*DelegatedTenantRootTokenService, error) {
	if cfg == nil {
		return nil, errors.New("delegated tenant root token config must not be nil")
	}

	var tenantCfg tenantsvc.Config
	if err := cfg.Unmarshal("", &tenantCfg); err != nil {
		return nil, err
	}

	key, err := auth.ParseTokenCodecKey(strings.TrimSpace(tenantCfg.Tenants.Key))
	if err != nil {
		return nil, fmt.Errorf("delegated tenant root token requires tenants.key: %w", err)
	}

	codec, err := auth.NewTokenCodec(key)
	if err != nil {
		return nil, err
	}

	return &DelegatedTenantRootTokenService{
		codec: codec,
		schema: DelegatedTenantRootTokenSchema{
			MaxAge: DefaultDelegatedTenantRootTTL,
		},
	}, nil
}

func (s *DelegatedTenantRootTokenService) BuildLaunchURL(input DelegatedTenantRootLaunchInput) (string, error) {
	if s == nil {
		return "", errors.New("delegated tenant root token service is not configured")
	}
	if input.AdminUserID == uuid.Nil {
		return "", errors.New("delegated tenant root launch requires admin user id")
	}

	tenantID := strings.TrimSpace(input.TenantID)
	tenantHost := strings.TrimSpace(strings.ToLower(input.TenantHost))
	if tenantID == "" || tenantHost == "" {
		return "", errors.New("delegated tenant root launch requires tenant id and host")
	}

	token, err := auth.EncodeToken(s.codec, s.schema, DelegatedTenantRootTokenPayload{
		AdminUserID: input.AdminUserID.String(),
		ReturnTo:    NormalizeDelegatedTenantRootReturnTo(input.ReturnTo),
		TenantHost:  tenantHost,
		TenantID:    tenantID,
	})
	if err != nil {
		return "", err
	}

	scheme := normalizeDelegatedTenantRootScheme(input.Scheme)
	return fmt.Sprintf("%s://%s%s%s", scheme, tenantHost, DelegatedTenantRootLaunchPath, url.PathEscape(token)), nil
}

func (s *DelegatedTenantRootTokenService) Decode(token string) (DelegatedTenantRootTokenPayload, error) {
	if s == nil {
		return DelegatedTenantRootTokenPayload{}, errors.New("delegated tenant root token service is not configured")
	}

	return auth.DecodeToken(s.codec, s.schema, strings.TrimSpace(token))
}

func NormalizeDelegatedTenantRootReturnTo(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || !strings.HasPrefix(value, "/") || strings.HasPrefix(value, "//") {
		return "/"
	}

	return value
}

func normalizeDelegatedTenantRootScheme(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "http":
		return "http"
	default:
		return "https"
	}
}

func (s DelegatedTenantRootTokenSchema) now() time.Time {
	if s.Clock != nil {
		return s.Clock().UTC()
	}
	return time.Now().UTC()
}

func (s DelegatedTenantRootTokenSchema) maxAge() time.Duration {
	if s.MaxAge <= 0 {
		return DefaultDelegatedTenantRootTTL
	}
	return s.MaxAge
}

func (s DelegatedTenantRootTokenSchema) nonceSize() int {
	if s.NonceSize <= 0 {
		return 16
	}
	return s.NonceSize
}

func (s DelegatedTenantRootTokenSchema) Marshal(payload DelegatedTenantRootTokenPayload) ([]byte, error) {
	payload.AdminUserID = strings.TrimSpace(payload.AdminUserID)
	payload.TenantID = strings.TrimSpace(payload.TenantID)
	payload.TenantHost = strings.TrimSpace(strings.ToLower(payload.TenantHost))
	payload.ReturnTo = NormalizeDelegatedTenantRootReturnTo(payload.ReturnTo)

	if payload.AdminUserID == "" || payload.TenantID == "" || payload.TenantHost == "" {
		return nil, errors.New("delegated tenant root token requires admin user id, tenant id, and tenant host")
	}
	if _, err := uuid.Parse(payload.AdminUserID); err != nil {
		return nil, errors.New("delegated tenant root token admin user id is invalid")
	}
	if payload.IssuedAt <= 0 {
		payload.IssuedAt = s.now().Unix()
	}
	if payload.Nonce == "" {
		nonce, err := auth.GenerateNonce(s.nonceSize())
		if err != nil {
			return nil, err
		}
		payload.Nonce = nonce
	}

	return json.Marshal(payload)
}

func (s DelegatedTenantRootTokenSchema) Unmarshal(data []byte) (DelegatedTenantRootTokenPayload, error) {
	var payload DelegatedTenantRootTokenPayload
	if err := json.Unmarshal(data, &payload); err != nil {
		return payload, err
	}

	payload.AdminUserID = strings.TrimSpace(payload.AdminUserID)
	payload.TenantID = strings.TrimSpace(payload.TenantID)
	payload.TenantHost = strings.TrimSpace(strings.ToLower(payload.TenantHost))
	payload.ReturnTo = NormalizeDelegatedTenantRootReturnTo(payload.ReturnTo)

	if payload.AdminUserID == "" || payload.TenantID == "" || payload.TenantHost == "" || payload.IssuedAt <= 0 || strings.TrimSpace(payload.Nonce) == "" {
		return payload, errors.New("delegated tenant root token payload is invalid")
	}
	if _, err := uuid.Parse(payload.AdminUserID); err != nil {
		return payload, errors.New("delegated tenant root token admin user id is invalid")
	}

	issuedAt := time.Unix(payload.IssuedAt, 0).UTC()
	now := s.now()
	if issuedAt.After(now.Add(5 * time.Second)) {
		return payload, errors.New("delegated tenant root token issued_at is in the future")
	}
	if now.Sub(issuedAt) > s.maxAge() {
		return payload, errors.New("delegated tenant root token expired")
	}

	return payload, nil
}
