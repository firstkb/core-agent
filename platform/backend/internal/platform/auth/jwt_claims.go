package auth

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// JWTClaims represents the claims in a JWT token
type JWTClaims struct {
	// Standard claims
	Issuer    string `json:"iss"`
	Audience  string `json:"aud"`
	IssuedAt  int64  `json:"iat"`
	ExpiresAt int64  `json:"exp"`
	NotBefore int64  `json:"nbf,omitempty"`
	JWTID     string `json:"jti"`

	// Custom claims
	Subject string `json:"sub"`             // user_id (UUID)
	Tenant  string `json:"tenant_id"`       // tenant_id (numeric string)
	Email   string `json:"email"`           // email
	Phone   string `json:"phone,omitempty"` // phone (E.164, optional)
	Level   int    `json:"level"`           // access level
	Role    string `json:"role,omitempty"`  // role (optional)
	Scope   string `json:"scope,omitempty"` // space-delimited OAuth2 scopes
}

// ToMap converts JWTClaims to a map for JWT library
func (c *JWTClaims) ToMap() map[string]interface{} {
	claims := map[string]interface{}{
		"iss":       c.Issuer,
		"aud":       c.Audience,
		"iat":       c.IssuedAt,
		"exp":       c.ExpiresAt,
		"jti":       c.JWTID,
		"sub":       c.Subject,
		"level":     c.Level,
	}

	if c.Tenant != "" {
		claims["tenant_id"] = c.Tenant
	}

	if c.NotBefore > 0 {
		claims["nbf"] = c.NotBefore
	}

	if c.Email != "" {
		claims["email"] = c.Email
	}

	if c.Phone != "" {
		claims["phone"] = c.Phone
	}

	if c.Role != "" {
		claims["role"] = c.Role
	}

	if c.Scope != "" {
		claims["scope"] = c.Scope
	}

	return claims
}

// NewJWTClaims creates new JWT claims for a user.
func NewJWTClaims(issuer, audience string, userID uuid.UUID, tenantID int64, email, phone string, level int, role, scope string) *JWTClaims {
	now := time.Now()

	return &JWTClaims{
		Issuer:    issuer,
		Audience:  audience,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(15 * time.Minute).Unix(), // Default 15 minutes
		NotBefore: now.Unix(),
		JWTID:     uuid.New().String(),
		Subject:   userID.String(),
		Tenant:    fmt.Sprintf("%d", tenantID),
		Email:     email,
		Phone:     phone,
		Level:     level,
		Role:      role,
		Scope:     scope,
	}
}

func NewAdminJWTClaims(issuer, audience string, userID uuid.UUID, email, phone string, level int, role string) *JWTClaims {
	now := time.Now()

	return &JWTClaims{
		Issuer:    issuer,
		Audience:  audience,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(15 * time.Minute).Unix(),
		NotBefore: now.Unix(),
		JWTID:     uuid.New().String(),
		Subject:   userID.String(),
		Email:     email,
		Phone:     phone,
		Level:     level,
		Role:      role,
		Scope:     AccessScopeAdminAPI,
	}
}
