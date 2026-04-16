package server

import (
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/router"
)

func (srv *Server) buildRoutes() (*http.ServeMux, *router.Classifier) {
	b := router.NewBuilder()

	b.Handle("HEALTH_STATUS", "GET", "/status", router.TierHealth,
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			_, _ = w.Write([]byte("OK\n"))
		}))

	b.Handle("HEALTH_LIVE", "GET", "/healthz", router.TierHealth,
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			_, _ = w.Write([]byte("ok\n"))
		}))

	b.Handle("HEALTH_READY", "GET", "/readyz", router.TierHealth,
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			_, _ = w.Write([]byte("ready\n"))
		}))

	srv.registerAdminNavigationRoutes(b)
	srv.registerAdminProfileRoutes(b)
	srv.registerEmployeesListRoutes(b)
	srv.registerTenantListRoutes(b)
	srv.registerTenantManagementRoutes(b)
	srv.registerModuleRegistryListRoutes(b)
	srv.registerModuleRegistryManageRoutes(b)
	srv.registerModuleRegistryGrantRoutes(b)

	return b.Mux(), b.Classifier()
}
