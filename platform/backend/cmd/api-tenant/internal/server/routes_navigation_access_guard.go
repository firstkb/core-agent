package server

import (
	"encoding/json"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	navigationbuilder "dtriton.com/platform/backend/modules/tenant/platformstudionavigationbuilder"
)

func (srv *Server) withPlatformStudioAccess(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := srv.platformStudioNavigationBuilderHTTP.AuthorizeRuntimeTarget(
			r.Context(),
			navigationbuilder.RuntimeTargetAccessRequest{
				TargetType: navigationbuilder.RuntimeTargetTypeUtilityRail,
				UtilityKey: "platform-studio",
			},
		); err != nil {
			writeNavigationAccessError(w, err)
			return
		}

		h.ServeHTTP(w, r)
	})
}

func (srv *Server) withRuntimeFormViewAccess(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := srv.platformStudioNavigationBuilderHTTP.AuthorizeRuntimeTarget(
			r.Context(),
			navigationbuilder.RuntimeTargetAccessRequest{
				TargetType: navigationbuilder.TargetTypeFormView,
				ModelID:    strings.TrimSpace(r.PathValue("modelId")),
				ViewID:     strings.TrimSpace(r.PathValue("viewId")),
			},
		); err != nil {
			writeNavigationAccessError(w, err)
			return
		}

		h.ServeHTTP(w, r)
	})
}

func (srv *Server) withRuntimeAppPageAccess(pageID string, route string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := srv.platformStudioNavigationBuilderHTTP.AuthorizeRuntimeTarget(
			r.Context(),
			navigationbuilder.RuntimeTargetAccessRequest{
				TargetType: navigationbuilder.TargetTypeAppPage,
				PageID:     pageID,
				Route:      route,
			},
		); err != nil {
			writeNavigationAccessError(w, err)
			return
		}

		h.ServeHTTP(w, r)
	})
}

func writeNavigationAccessError(w http.ResponseWriter, err error) {
	appErr := apperr.ToHTTP(err)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(appErr.StatusCode)
	_ = json.NewEncoder(w).Encode(handler.Response{
		Status:  "error",
		Code:    appErr.Code,
		Message: appErr.Message,
	})
}
