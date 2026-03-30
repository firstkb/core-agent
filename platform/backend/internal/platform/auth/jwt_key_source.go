package auth

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
	"strings"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/golang-jwt/jwt/v5"
)

const (
	KeySourceFile           = "file"
	KeySourceSecretsManager = "secretsmanager"
	KeySourceKMS            = "kms"
)

var errKMSKeySourceUnsupported = errors.New("kms key source is not implemented in this build")

type tokenSigner interface {
	Sign(token *jwt.Token) (string, error)
}

type rsaTokenSigner struct {
	privateKey *rsa.PrivateKey
}

func (s *rsaTokenSigner) Sign(token *jwt.Token) (string, error) {
	return token.SignedString(s.privateKey)
}

type secretValueGetter interface {
	GetSecretValue(ctx context.Context, params *secretsmanager.GetSecretValueInput, optFns ...func(*secretsmanager.Options)) (*secretsmanager.GetSecretValueOutput, error)
}

var newSecretsManagerClient = func(ctx context.Context, region string) (secretValueGetter, error) {
	loadOptions := make([]func(*awsconfig.LoadOptions) error, 0, 1)
	if strings.TrimSpace(region) != "" {
		loadOptions = append(loadOptions, awsconfig.WithRegion(strings.TrimSpace(region)))
	}

	cfg, err := awsconfig.LoadDefaultConfig(ctx, loadOptions...)
	if err != nil {
		return nil, fmt.Errorf("load AWS config: %w", err)
	}

	return secretsmanager.NewFromConfig(cfg), nil
}

func normalizeJWTConfig(cfg JWTConfig) JWTConfig {
	cfg.Algorithm = strings.ToLower(strings.TrimSpace(cfg.Algorithm))
	cfg.KeySource = normalizeKeySource(cfg.KeySource)
	cfg.PrivateKeyPath = strings.TrimSpace(cfg.PrivateKeyPath)
	cfg.PublicKeyPath = strings.TrimSpace(cfg.PublicKeyPath)
	cfg.PrivateKeySecretName = strings.TrimSpace(cfg.PrivateKeySecretName)
	cfg.PublicKeySecretName = strings.TrimSpace(cfg.PublicKeySecretName)
	cfg.AWSRegion = strings.TrimSpace(cfg.AWSRegion)
	cfg.KMSKeyID = strings.TrimSpace(cfg.KMSKeyID)
	return cfg
}

func normalizeKeySource(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "", KeySourceFile:
		return KeySourceFile
	case KeySourceSecretsManager:
		return KeySourceSecretsManager
	case KeySourceKMS:
		return KeySourceKMS
	default:
		return strings.ToLower(strings.TrimSpace(value))
	}
}

func loadJWTKeyMaterial(cfg JWTConfig) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	switch cfg.KeySource {
	case KeySourceFile:
		return loadJWTKeysFromFiles(cfg)
	case KeySourceSecretsManager:
		return loadJWTKeysFromSecrets(context.Background(), cfg)
	case KeySourceKMS:
		return nil, nil, errKMSKeySourceUnsupported
	default:
		return nil, nil, fmt.Errorf("unsupported auth key source: %s", cfg.KeySource)
	}
}

func newTokenSigner(cfg JWTConfig, privateKey *rsa.PrivateKey) (tokenSigner, error) {
	switch cfg.KeySource {
	case KeySourceFile, KeySourceSecretsManager:
		if privateKey == nil {
			return nil, nil
		}
		return &rsaTokenSigner{privateKey: privateKey}, nil
	case KeySourceKMS:
		return nil, errKMSKeySourceUnsupported
	default:
		return nil, fmt.Errorf("unsupported auth key source: %s", cfg.KeySource)
	}
}

func loadJWTKeysFromFiles(cfg JWTConfig) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	privateKey, err := loadPrivateKeyFile(cfg.PrivateKeyPath)
	if err != nil {
		return nil, nil, err
	}

	publicKey, err := loadPublicKeyFile(cfg.PublicKeyPath)
	if err != nil {
		return nil, nil, err
	}

	if publicKey == nil && privateKey != nil {
		publicKey = &privateKey.PublicKey
	}
	if publicKey == nil {
		return nil, nil, fmt.Errorf("public key is not configured")
	}

	return privateKey, publicKey, nil
}

func loadJWTKeysFromSecrets(ctx context.Context, cfg JWTConfig) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	client, err := newSecretsManagerClient(ctx, cfg.AWSRegion)
	if err != nil {
		return nil, nil, err
	}

	privateKey, err := loadPrivateKeySecret(ctx, client, cfg.PrivateKeySecretName)
	if err != nil {
		return nil, nil, err
	}

	publicKey, err := loadPublicKeySecret(ctx, client, cfg.PublicKeySecretName)
	if err != nil {
		return nil, nil, err
	}

	if publicKey == nil && privateKey != nil {
		publicKey = &privateKey.PublicKey
	}
	if publicKey == nil {
		return nil, nil, fmt.Errorf("public key is not configured")
	}

	return privateKey, publicKey, nil
}

func loadPrivateKeyFile(path string) (*rsa.PrivateKey, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return nil, nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read private key file: %w", err)
	}

	privateKey, err := parsePrivateKeyPEM(data)
	if err != nil {
		return nil, fmt.Errorf("parse private key file: %w", err)
	}

	return privateKey, nil
}

func loadPublicKeyFile(path string) (*rsa.PublicKey, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return nil, nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read public key file: %w", err)
	}

	publicKey, err := parsePublicKeyPEM(data)
	if err != nil {
		return nil, fmt.Errorf("parse public key file: %w", err)
	}

	return publicKey, nil
}

func loadPrivateKeySecret(ctx context.Context, client secretValueGetter, secretName string) (*rsa.PrivateKey, error) {
	secretName = strings.TrimSpace(secretName)
	if secretName == "" {
		return nil, nil
	}

	pemValue, err := loadSecretValue(ctx, client, secretName)
	if err != nil {
		return nil, fmt.Errorf("load private key secret: %w", err)
	}

	privateKey, err := parsePrivateKeyPEM([]byte(pemValue))
	if err != nil {
		return nil, fmt.Errorf("parse private key secret: %w", err)
	}

	return privateKey, nil
}

func loadPublicKeySecret(ctx context.Context, client secretValueGetter, secretName string) (*rsa.PublicKey, error) {
	secretName = strings.TrimSpace(secretName)
	if secretName == "" {
		return nil, nil
	}

	pemValue, err := loadSecretValue(ctx, client, secretName)
	if err != nil {
		return nil, fmt.Errorf("load public key secret: %w", err)
	}

	publicKey, err := parsePublicKeyPEM([]byte(pemValue))
	if err != nil {
		return nil, fmt.Errorf("parse public key secret: %w", err)
	}

	return publicKey, nil
}

func loadSecretValue(ctx context.Context, client secretValueGetter, secretName string) (string, error) {
	output, err := client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: &secretName,
	})
	if err != nil {
		return "", err
	}

	switch {
	case output.SecretString != nil:
		return *output.SecretString, nil
	case len(output.SecretBinary) > 0:
		return string(output.SecretBinary), nil
	default:
		return "", fmt.Errorf("secret %q is empty", secretName)
	}
}

func parsePrivateKeyPEM(data []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block")
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err == nil {
		return privateKey, nil
	}

	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse private key: %w", err)
	}

	rsaKey, ok := key.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("not an RSA private key")
	}

	return rsaKey, nil
}

func parsePublicKeyPEM(data []byte) (*rsa.PublicKey, error) {
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse public key: %w", err)
	}

	rsaPub, ok := pub.(*rsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("not an RSA public key")
	}

	return rsaPub, nil
}

// GenerateKeyPair generates a new RSA key pair (for development/testing)
func GenerateKeyPair(bits int) (*rsa.PrivateKey, error) {
	return rsa.GenerateKey(rand.Reader, bits)
}
