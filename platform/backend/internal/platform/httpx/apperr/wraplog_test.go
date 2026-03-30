package apperr

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"testing"
)

func TestWrapAndLog_PreservesNestedAppError(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	nested := New("AUTH_USER_NOT_FOUND", http.StatusNotFound, "user not found")

	got := WrapAndLog(logger, context.Background(), "OTP_REQUEST", http.StatusInternalServerError, "cannot request OTP", nested)
	if got == nil {
		t.Fatal("WrapAndLog returned nil")
	}
	if got.Code != "AUTH_USER_NOT_FOUND" {
		t.Fatalf("code = %q, want %q", got.Code, "AUTH_USER_NOT_FOUND")
	}
	if got.Message != "user not found" {
		t.Fatalf("message = %q, want %q", got.Message, "user not found")
	}
	if got.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", got.StatusCode, http.StatusNotFound)
	}
}

func TestWrapAndLog_WrapsGenericError(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	got := WrapAndLog(logger, context.Background(), "OTP_REQUEST", http.StatusInternalServerError, "cannot request OTP", io.EOF)
	if got == nil {
		t.Fatal("WrapAndLog returned nil")
	}
	if got.Code != "OTP_REQUEST" {
		t.Fatalf("code = %q, want %q", got.Code, "OTP_REQUEST")
	}
	if got.Message != "cannot request OTP" {
		t.Fatalf("message = %q, want %q", got.Message, "cannot request OTP")
	}
	if got.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", got.StatusCode, http.StatusInternalServerError)
	}
}
