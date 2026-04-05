package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	moduleregistrygrants "dtriton.com/platform/backend/modules/admin/moduleregistrygrants"
)

func (srv *Server) registerModuleRegistryGrantRoutes(b *router.Builder) {
	register := func(id router.RouteID, method, path string, h http.Handler) {
		b.Handle(id, method, path, router.TierSecure, h)
	}

	register("ADMIN_MODULE_REGISTRY_SECTION_GRANTS_GET", http.MethodGet, "/app/admin/module-registry/sections/{sectionId}/grants",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrygrants.SectionGrantListOutput, error) {
			info, err := srv.moduleRegistryGrantHT.ListSectionGrants(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_SECTION_GRANTS_GET",
					http.StatusInternalServerError, "cannot list module registry section grants", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_SECTION_GRANT_UPSERT", http.MethodPut, "/app/admin/module-registry/sections/{sectionId}/grants/{adminUserId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrygrants.UpsertSectionGrantInput) (*moduleregistrygrants.SectionGrantOutput, error) {
			info, err := srv.moduleRegistryGrantHT.UpsertSectionGrant(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_SECTION_GRANT_UPSERT",
					http.StatusInternalServerError, "cannot upsert module registry section grant", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_SECTION_GRANT_REVOKE", http.MethodDelete, "/app/admin/module-registry/sections/{sectionId}/grants/{adminUserId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrygrants.MutationResult, error) {
			info, err := srv.moduleRegistryGrantHT.RevokeSectionGrant(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_SECTION_GRANT_REVOKE",
					http.StatusInternalServerError, "cannot revoke module registry section grant", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_MODULE_GRANTS_UPSERT", http.MethodPut, "/app/admin/module-registry/modules/{moduleId}/grants/{adminUserId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrygrants.UpsertSectionGrantInput) (*moduleregistrygrants.GrantMutationOutput, error) {
			info, err := srv.moduleRegistryGrantHT.UpsertModuleGrants(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_MODULE_GRANTS_UPSERT",
					http.StatusInternalServerError, "cannot upsert module registry module grants", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_MODULE_GRANTS_REVOKE", http.MethodDelete, "/app/admin/module-registry/modules/{moduleId}/grants/{adminUserId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrygrants.GrantMutationOutput, error) {
			info, err := srv.moduleRegistryGrantHT.RevokeModuleGrants(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_MODULE_GRANTS_REVOKE",
					http.StatusInternalServerError, "cannot revoke module registry module grants", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))
}
