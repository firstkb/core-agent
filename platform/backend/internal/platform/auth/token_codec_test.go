package auth

import (
	"errors"
	"testing"
	"time"
)

type mockTokenSchema struct {
	marshal   func(testTokenPayload) ([]byte, error)
	unmarshal func([]byte) (testTokenPayload, error)
}

type testTokenPayload struct {
	Value string
	Time  time.Time
}

func (m mockTokenSchema) Marshal(p testTokenPayload) ([]byte, error) {
	if m.marshal != nil {
		return m.marshal(p)
	}
	return []byte(p.Value), nil
}

func (m mockTokenSchema) Unmarshal(data []byte) (testTokenPayload, error) {
	if m.unmarshal != nil {
		return m.unmarshal(data)
	}
	return testTokenPayload{Value: string(data)}, nil
}

func TestTokenCodecEncodeDecode(t *testing.T) {
	codec, err := NewTokenCodec([]byte("super-secret"))
	if err != nil {
		t.Fatalf("NewTokenCodec: %v", err)
	}

	payload := testTokenPayload{Value: "hello"}
	schema := mockTokenSchema{}

	token, err := EncodeToken(codec, schema, payload)
	if err != nil {
		t.Fatalf("EncodeToken: %v", err)
	}

	decoded, err := DecodeToken(codec, schema, token)
	if err != nil {
		t.Fatalf("DecodeToken: %v", err)
	}

	if decoded.Value != payload.Value {
		t.Fatalf("expected %s got %s", payload.Value, decoded.Value)
	}
}

func TestTokenCodecInvalidSignature(t *testing.T) {
	codec, err := NewTokenCodec([]byte("secret"))
	if err != nil {
		t.Fatalf("NewTokenCodec: %v", err)
	}

	token, err := EncodeToken(codec, mockTokenSchema{}, testTokenPayload{Value: "data"})
	if err != nil {
		t.Fatalf("EncodeToken: %v", err)
	}

	token += "tamper"

	if _, err := DecodeToken(codec, mockTokenSchema{}, token); err == nil {
		t.Fatalf("expected error for tampered token")
	}
}

func TestParseTokenCodecKey(t *testing.T) {
	key, err := ParseTokenCodecKey("c2VjcmV0")
	if err != nil {
		t.Fatalf("ParseTokenCodecKey: %v", err)
	}
	if string(key) != "secret" {
		t.Fatalf("unexpected key %s", string(key))
	}
}

func TestTokenCodecSchemaErrors(t *testing.T) {
	codec, err := NewTokenCodec([]byte("secret"))
	if err != nil {
		t.Fatalf("NewTokenCodec: %v", err)
	}

	brokenSchema := mockTokenSchema{
		marshal: func(testTokenPayload) ([]byte, error) { return nil, errors.New("boom") },
	}
	if _, err := EncodeToken(codec, brokenSchema, testTokenPayload{}); err == nil {
		t.Fatalf("expected marshal error")
	}
}
