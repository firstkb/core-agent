package auth

import (
	"context"
	"crypto/x509"
	"encoding/pem"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/google/uuid"
)

func TestNormalizeKeySourceDefaultsToFile(t *testing.T) {
	if got := normalizeKeySource(""); got != KeySourceFile {
		t.Fatalf("expected file default, got %q", got)
	}
	if got := normalizeKeySource("FILE"); got != KeySourceFile {
		t.Fatalf("expected normalized file source, got %q", got)
	}
}

func TestNewJWTIssuerSupportsPublicOnlyFileConfig(t *testing.T) {
	privateKey, err := GenerateKeyPair(2048)
	if err != nil {
		t.Fatalf("GenerateKeyPair: %v", err)
	}

	publicDER, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		t.Fatalf("MarshalPKIXPublicKey: %v", err)
	}

	dir := t.TempDir()
	publicPath := filepath.Join(dir, "public.pem")
	if err := os.WriteFile(publicPath, pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: publicDER}), 0o644); err != nil {
		t.Fatalf("WriteFile public: %v", err)
	}

	issuer, err := NewJWTIssuer(JWTConfig{
		Algorithm:     "rs256",
		KeySource:     KeySourceFile,
		PublicKeyPath: publicPath,
		Issuer:        "test-issuer",
		Audience:      "test-audience",
	})
	if err != nil {
		t.Fatalf("NewJWTIssuer: %v", err)
	}

	if issuer.GetKeyID() == "" {
		t.Fatalf("expected non-empty key id")
	}

	if _, err := issuer.IssueToken(NewJWTClaims("test-issuer", "test-audience", uuid.New(), 1, "user@example.com", "", 10, "member", AccessScopeTenantAPI)); err == nil {
		t.Fatalf("expected sign error without private key")
	}
}

func TestNewJWTIssuerLoadsKeysFromSecretsManager(t *testing.T) {
	privateKey, err := GenerateKeyPair(2048)
	if err != nil {
		t.Fatalf("GenerateKeyPair: %v", err)
	}

	privatePEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(privateKey)})
	publicDER, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		t.Fatalf("MarshalPKIXPublicKey: %v", err)
	}
	publicPEM := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: publicDER})

	prevFactory := newSecretsManagerClient
	t.Cleanup(func() { newSecretsManagerClient = prevFactory })
	newSecretsManagerClient = func(ctx context.Context, region string) (secretValueGetter, error) {
		return fakeSecretGetter{
			values: map[string]string{
				"private": string(privatePEM),
				"public":  string(publicPEM),
			},
		}, nil
	}

	issuer, err := NewJWTIssuer(JWTConfig{
		Algorithm:            "rs256",
		KeySource:            KeySourceSecretsManager,
		PrivateKeySecretName: "private",
		PublicKeySecretName:  "public",
		Issuer:               "test-issuer",
		Audience:             "test-audience",
	})
	if err != nil {
		t.Fatalf("NewJWTIssuer: %v", err)
	}

	token, err := issuer.IssueToken(NewJWTClaims("test-issuer", "test-audience", uuid.New(), 101, "user@example.com", "", 90, "owner", AccessScopeTenantAPI))
	if err != nil {
		t.Fatalf("IssueToken: %v", err)
	}
	if token == "" {
		t.Fatalf("expected token")
	}
}

func TestNewJWTIssuerRejectsKMSKeySource(t *testing.T) {
	_, err := NewJWTIssuer(JWTConfig{
		Algorithm: "rs256",
		KeySource: KeySourceKMS,
		KMSKeyID:  "arn:aws:kms:us-east-1:123456789012:key/example",
	})
	if err == nil {
		t.Fatalf("expected kms error")
	}
	if !strings.Contains(err.Error(), "kms key source") {
		t.Fatalf("expected kms error, got %v", err)
	}
}

type fakeSecretGetter struct {
	values map[string]string
}

func (f fakeSecretGetter) GetSecretValue(ctx context.Context, params *secretsmanager.GetSecretValueInput, optFns ...func(*secretsmanager.Options)) (*secretsmanager.GetSecretValueOutput, error) {
	name := ""
	if params != nil && params.SecretId != nil {
		name = *params.SecretId
	}

	value, ok := f.values[name]
	if !ok {
		return nil, os.ErrNotExist
	}

	return &secretsmanager.GetSecretValueOutput{
		SecretString: &value,
	}, nil
}
