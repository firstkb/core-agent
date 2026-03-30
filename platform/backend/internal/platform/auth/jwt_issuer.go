package auth

import (
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTIssuer handles JWT token generation and validation
type JWTIssuer interface {
	IssueToken(claims *JWTClaims) (string, error)
	ValidateToken(tokenString string) (*JWTClaims, error)
	GetPublicKey() (*rsa.PublicKey, error)
	GetKeyID() string
}

type jwtIssuer struct {
	publicKey *rsa.PublicKey
	signer    tokenSigner
	keyID     string
	issuer    string
	audience  string
	algorithm string
}

// Config holds JWT issuer configuration
type JWTConfig struct {
	Algorithm            string // "rs256" or "eddsa"
	KeySource            string
	PrivateKeyPath       string
	PublicKeyPath        string
	PrivateKeySecretName string
	PublicKeySecretName  string
	AWSRegion            string
	KMSKeyID             string
	Issuer               string
	Audience             string
	AccessTTL            time.Duration
}

// NewJWTIssuer creates a new JWT issuer
func NewJWTIssuer(config JWTConfig) (JWTIssuer, error) {
	config = normalizeJWTConfig(config)

	// For now, we'll support RS256 only
	if config.Algorithm != "rs256" {
		return nil, fmt.Errorf("unsupported algorithm: %s (only rs256 supported for now)", config.Algorithm)
	}

	privateKey, publicKey, err := loadJWTKeyMaterial(config)
	if err != nil {
		return nil, err
	}

	keyID, err := computeKeyID(publicKey)
	if err != nil {
		return nil, fmt.Errorf("compute key id: %w", err)
	}

	signer, err := newTokenSigner(config, privateKey)
	if err != nil {
		return nil, err
	}

	return &jwtIssuer{
		publicKey: publicKey,
		signer:    signer,
		keyID:     keyID,
		issuer:    config.Issuer,
		audience:  config.Audience,
		algorithm: config.Algorithm,
	}, nil
}

func (j *jwtIssuer) IssueToken(claims *JWTClaims) (string, error) {
	// Set issuer and audience if not set
	if claims.Issuer == "" {
		claims.Issuer = j.issuer
	}
	if claims.Audience == "" {
		claims.Audience = j.audience
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims(claims.ToMap()))
	token.Header["kid"] = j.keyID

	if j.signer == nil {
		return "", fmt.Errorf("sign token: private signing key is not configured")
	}

	tokenString, err := j.signer.Sign(token)
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}

	return tokenString, nil
}

func (j *jwtIssuer) ValidateToken(tokenString string) (*JWTClaims, error) {
	// Parse token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Verify algorithm
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return j.publicKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid claims format")
	}

	// Convert to JWTClaims
	jwtClaims := &JWTClaims{
		Issuer:    getStringClaim(claims, "iss"),
		Audience:  getStringClaim(claims, "aud"),
		IssuedAt:  getInt64Claim(claims, "iat"),
		ExpiresAt: getInt64Claim(claims, "exp"),
		NotBefore: getInt64Claim(claims, "nbf"),
		JWTID:     getStringClaim(claims, "jti"),
		Subject:   getStringClaim(claims, "sub"),
		Tenant:    getStringClaim(claims, "tenant_id"),
		Email:     getStringClaim(claims, "email"),
		Phone:     getStringClaim(claims, "phone"),
		Level:     getIntClaim(claims, "level"),
		Role:      getStringClaim(claims, "role"),
		Scope:     getStringClaim(claims, "scope"),
	}

	return jwtClaims, nil
}

func (j *jwtIssuer) GetPublicKey() (*rsa.PublicKey, error) {
	return j.publicKey, nil
}

func (j *jwtIssuer) GetKeyID() string {
	return j.keyID
}

// Helper functions for claim extraction
func getStringClaim(claims jwt.MapClaims, key string) string {
	if v, ok := claims[key].(string); ok {
		return v
	}
	return ""
}

func getInt64Claim(claims jwt.MapClaims, key string) int64 {
	if v, ok := claims[key].(float64); ok {
		return int64(v)
	}
	return 0
}

func getIntClaim(claims jwt.MapClaims, key string) int {
	if v, ok := claims[key].(float64); ok {
		return int(v)
	}
	return 0
}

func computeKeyID(publicKey *rsa.PublicKey) (string, error) {
	if publicKey == nil {
		return "", fmt.Errorf("public key is nil")
	}

	der, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		return "", err
	}

	sum := sha256.Sum256(der)
	return base64.RawURLEncoding.EncodeToString(sum[:]), nil
}
