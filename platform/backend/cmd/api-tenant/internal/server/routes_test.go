package server

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/router"
)

func TestBuildRoutesClassifiesTenantAuthDependentRoutesAsSecure(t *testing.T) {
	_, classifier := (&Server{}).buildRoutes()

	tests := []struct {
		name    string
		method  string
		path    string
		routeID router.RouteID
	}{
		{
			name:    "profile bootstrap",
			method:  http.MethodGet,
			path:    "/app/profile",
			routeID: "PROFILE_GET_APP",
		},
		{
			name:    "runtime navigation",
			method:  http.MethodGet,
			path:    "/app/navigation",
			routeID: "TENANT_RUNTIME_NAVIGATION_GET",
		},
		{
			name:    "navigation builder config",
			method:  http.MethodGet,
			path:    "/app/platform-studio/navigation",
			routeID: "NAVIGATION_BUILDER_CONFIG_GET",
		},
		{
			name:    "form builder model list",
			method:  http.MethodGet,
			path:    "/app/platform-studio/forms/models",
			routeID: "FORM_BUILDER_MODEL_LIST",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, nil)
			match, ok := classifier.Match(req)
			if !ok {
				t.Fatalf("expected %s %s route to be registered", tt.method, tt.path)
			}
			if match.RouteID != tt.routeID {
				t.Fatalf("route id = %q, want %q", match.RouteID, tt.routeID)
			}
			if match.Tier != router.TierSecure {
				t.Fatalf("route tier = %q, want %q", match.Tier, router.TierSecure)
			}
		})
	}
}
