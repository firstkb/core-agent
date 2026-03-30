package auth

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// ClaimResolver extracts claims from JWT tokens
type ClaimResolver interface {
	ExtractTenantID(claims jwt.MapClaims) (int64, error)
	ExtractUserID(claims jwt.MapClaims) (uuid.UUID, error)
	ExtractEmail(claims jwt.MapClaims) (string, error)
	ExtractLevel(claims jwt.MapClaims) (int, error)
	ExtractRoles(claims jwt.MapClaims) ([]string, error)
	Validate(claims jwt.MapClaims) error
}

// InternalClaimResolver extracts claims from internal JWT tokens
type InternalClaimResolver struct{}

func NewInternalClaimResolver() ClaimResolver {
	return &InternalClaimResolver{}
}

func (r *InternalClaimResolver) ExtractTenantID(claims jwt.MapClaims) (int64, error) {
	tenantIDRaw, ok := claims["tenant_id"].(string)
	if !ok {
		return 0, errors.New("tenant_id claim missing or invalid")
	}

	tenantID, err := strconv.ParseInt(tenantIDRaw, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("tenant ID format not supported: %s", tenantIDRaw)
	}

	return tenantID, nil
}

func (r *InternalClaimResolver) ExtractUserID(claims jwt.MapClaims) (uuid.UUID, error) {
	sub, ok := claims["sub"].(string)
	if !ok {
		return uuid.Nil, errors.New("sub claim missing or invalid")
	}
	return uuid.Parse(sub)
}

func (r *InternalClaimResolver) ExtractEmail(claims jwt.MapClaims) (string, error) {
	email, ok := claims["email"].(string)
	if !ok || email == "" {
		return "", errors.New("email claim missing or invalid")
	}
	return email, nil
}

func (r *InternalClaimResolver) ExtractLevel(claims jwt.MapClaims) (int, error) {
	lvl, ok := claims["level"].(float64)
	if !ok {
		return 0, errors.New("level claim missing or invalid")
	}
	return int(lvl), nil
}

func (r *InternalClaimResolver) ExtractRoles(claims jwt.MapClaims) ([]string, error) {
	role, ok := claims["role"].(string)
	if !ok || role == "" {
		return nil, nil
	}
	return []string{role}, nil
}

func (r *InternalClaimResolver) Validate(claims jwt.MapClaims) error {
	if _, err := r.ExtractTenantID(claims); err != nil {
		return fmt.Errorf("tenant_id: %w", err)
	}
	if _, err := r.ExtractUserID(claims); err != nil {
		return fmt.Errorf("user_id: %w", err)
	}
	if _, err := r.ExtractEmail(claims); err != nil {
		return fmt.Errorf("email: %w", err)
	}
	return nil
}

func NewClaimResolver() ClaimResolver {
	return NewInternalClaimResolver()
}
