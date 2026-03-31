package postgres

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

func TestResolveInstanceDSNSecretPrecedence(t *testing.T) {
	got, err := resolveInstanceDSN("S1", "host=base", "secret/name", func(code, secretName string) (string, error) {
		if code != "S1" || secretName != "secret/name" {
			t.Fatalf("unexpected resolver input code=%q secret=%q", code, secretName)
		}
		return "host=secret", nil
	})
	if err != nil {
		t.Fatalf("resolveInstanceDSN: %v", err)
	}
	if got != "host=secret" {
		t.Fatalf("expected secret dsn, got %q", got)
	}
}

func TestResolveInstanceDSNFallsBackToDNSWhenSecretEmpty(t *testing.T) {
	got, err := resolveInstanceDSN("S1", "host=base", "", nil)
	if err != nil {
		t.Fatalf("resolveInstanceDSN: %v", err)
	}
	if got != "host=base" {
		t.Fatalf("expected dns fallback, got %q", got)
	}
}

func TestResolveInstanceDSNErrorsWithoutResolver(t *testing.T) {
	if _, err := resolveInstanceDSN("S1", "host=base", "secret/name", nil); err == nil {
		t.Fatalf("expected resolver error")
	}
}

func TestSecretsManagerInstanceResolver(t *testing.T) {
	prevFactory := newSecretsManagerClient
	t.Cleanup(func() { newSecretsManagerClient = prevFactory })

	newSecretsManagerClient = func(ctx context.Context, region string) (secretsManagerGetter, error) {
		if region != "us-east-1" {
			t.Fatalf("unexpected region %q", region)
		}
		return fakeSecretsManagerGetter{
			values: map[string]string{
				"db/instance/s1": "host=example.internal port=5432 user=app password=secret sslmode=require",
			},
		}, nil
	}

	resolver := NewSecretsManagerInstanceResolver("us-east-1")
	got, err := resolver("S1", "db/instance/s1")
	if err != nil {
		t.Fatalf("resolver: %v", err)
	}
	if got == "" {
		t.Fatalf("expected non-empty dsn")
	}
}

type fakeSecretsManagerGetter struct {
	values map[string]string
}

func (f fakeSecretsManagerGetter) GetSecretValue(ctx context.Context, params *secretsmanager.GetSecretValueInput, optFns ...func(*secretsmanager.Options)) (*secretsmanager.GetSecretValueOutput, error) {
	if params == nil || params.SecretId == nil {
		return nil, errors.New("missing secret id")
	}

	value, ok := f.values[*params.SecretId]
	if !ok {
		return nil, errors.New("secret not found")
	}

	return &secretsmanager.GetSecretValueOutput{
		SecretString: &value,
	}, nil
}
