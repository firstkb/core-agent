package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strings"
)

// Schema converts a domain payload to token bytes and back.
type Schema[T any] interface {
	Marshal(T) ([]byte, error)
	Unmarshal([]byte) (T, error)
}

type TokenCodecOption func(*tokenCodecConfig)

type tokenCodecConfig struct {
	delimiter string
}

// TokenCodec encapsulates a simple signed token format:
// base64(payload).base64(HMAC(payload,key)).
type TokenCodec struct {
	key []byte

	delimiter string
}

func NewTokenCodec(key []byte, opts ...TokenCodecOption) (*TokenCodec, error) {
	if len(key) == 0 {
		return nil, errors.New("auth: empty token codec key")
	}

	cfg := tokenCodecConfig{
		delimiter: ".",
	}
	for _, opt := range opts {
		opt(&cfg)
	}
	if cfg.delimiter == "" {
		cfg.delimiter = "."
	}

	return &TokenCodec{
		key:       append([]byte(nil), key...),
		delimiter: cfg.delimiter,
	}, nil
}

func WithTokenDelimiter(delim string) TokenCodecOption {
	return func(cfg *tokenCodecConfig) {
		cfg.delimiter = delim
	}
}

func EncodeToken[T any](codec *TokenCodec, schema Schema[T], data T) (string, error) {
	if codec == nil {
		return "", errors.New("auth: token codec is nil")
	}
	if schema == nil {
		return "", errors.New("auth: token schema is nil")
	}

	payload, err := schema.Marshal(data)
	if err != nil {
		return "", err
	}
	if len(payload) == 0 {
		return "", errors.New("auth: empty token payload")
	}

	signature := codec.sign(payload)
	return base64.RawURLEncoding.EncodeToString(payload) +
		codec.delimiter +
		base64.RawURLEncoding.EncodeToString(signature), nil
}

func DecodeToken[T any](codec *TokenCodec, schema Schema[T], token string) (T, error) {
	var zero T
	if codec == nil {
		return zero, errors.New("auth: token codec is nil")
	}
	if schema == nil {
		return zero, errors.New("auth: token schema is nil")
	}

	payload, err := codec.extractPayload(token)
	if err != nil {
		return zero, err
	}

	return schema.Unmarshal(payload)
}

func (c *TokenCodec) extractPayload(token string) ([]byte, error) {
	if token == "" {
		return nil, errors.New("auth: empty token")
	}

	parts := strings.SplitN(token, c.delimiter, 2)
	if len(parts) != 2 {
		return nil, errors.New("auth: malformed token")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, err
	}
	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}

	expected := c.sign(payload)
	if !hmac.Equal(signature, expected) {
		return nil, errors.New("auth: invalid token signature")
	}

	return payload, nil
}

func (c *TokenCodec) sign(payload []byte) []byte {
	mac := hmac.New(sha256.New, c.key)
	_, _ = mac.Write(payload)
	return mac.Sum(nil)
}
