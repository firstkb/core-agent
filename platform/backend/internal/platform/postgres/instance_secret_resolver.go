package postgres

import (
	"context"
	"fmt"
	"strings"
	"sync"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type secretsManagerGetter interface {
	GetSecretValue(ctx context.Context, params *secretsmanager.GetSecretValueInput, optFns ...func(*secretsmanager.Options)) (*secretsmanager.GetSecretValueOutput, error)
}

var newSecretsManagerClient = func(ctx context.Context, region string) (secretsManagerGetter, error) {
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

func NewSecretsManagerInstanceResolver(region string) InstanceResolver {
	var (
		once      sync.Once
		client    secretsManagerGetter
		clientErr error
	)

	return func(code, secretName string) (string, error) {
		secretName = strings.TrimSpace(secretName)
		if secretName == "" {
			return "", nil
		}

		once.Do(func() {
			client, clientErr = newSecretsManagerClient(context.Background(), region)
		})
		if clientErr != nil {
			return "", clientErr
		}

		output, err := client.GetSecretValue(context.Background(), &secretsmanager.GetSecretValueInput{
			SecretId: &secretName,
		})
		if err != nil {
			return "", fmt.Errorf("resolve DB instance secret %q for %s: %w", secretName, strings.TrimSpace(code), err)
		}

		switch {
		case output.SecretString != nil && strings.TrimSpace(*output.SecretString) != "":
			return strings.TrimSpace(*output.SecretString), nil
		case len(output.SecretBinary) > 0:
			return strings.TrimSpace(string(output.SecretBinary)), nil
		default:
			return "", fmt.Errorf("DB instance secret %q is empty", secretName)
		}
	}
}
