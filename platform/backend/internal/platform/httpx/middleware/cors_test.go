package middleware

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
)

func TestOriginAllowed(t *testing.T) {
	if !OriginAllowed("https://demo.platform.local", []string{"*.platform.local"}) {
		t.Fatal("expected wildcard origin to match")
	}
	if !OriginAllowed("https://admin.platform.local", []string{"admin.platform.local"}) {
		t.Fatal("expected host-only origin to match")
	}
	if OriginAllowed("https://evil.example", []string{"*.platform.local"}) {
		t.Fatal("unexpected origin match")
	}
}

func TestCORSAddsVaryAndCredentialsHeaders(t *testing.T) {
	handler := CORS(nilLogger(), CORSConfig{
		AllowedOrigins:   []string{"*.platform.local"},
		AllowedMethods:   []string{http.MethodPost, http.MethodOptions},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodOptions, "http://127.0.0.1/auth/refresh", nil)
	req = req.WithContext(requestctx.WithRoute(req.Context(), requestctx.RouteInfo{
		ID:     router.RouteID("REFRESH"),
		Tier:   router.TierPublic,
		Domain: "demo.platform.local",
	}))
	req.Header.Set("Origin", "https://demo.platform.local")
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	req.Header.Set("Access-Control-Request-Headers", "Content-Type")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	res := rec.Result()
	if got := res.Header.Get("Access-Control-Allow-Origin"); got != "https://demo.platform.local" {
		t.Fatalf("Access-Control-Allow-Origin = %q, want %q", got, "https://demo.platform.local")
	}
	if got := res.Header.Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Fatalf("Access-Control-Allow-Credentials = %q, want %q", got, "true")
	}
	vary := res.Header.Values("Vary")
	if len(vary) == 0 {
		t.Fatal("expected Vary headers")
	}
}

func nilLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}
