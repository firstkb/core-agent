package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	moduleregistrymanage "dtriton.com/platform/backend/modules/admin/moduleregistrymanage"
)

func (srv *Server) registerModuleRegistryManageRoutes(b *router.Builder) {
	register := func(id router.RouteID, method, path string, h http.Handler) {
		b.Handle(id, method, path, router.TierSecure, h)
	}

	register("ADMIN_MODULE_REGISTRY_MODULE_GET", http.MethodGet, "/app/admin/module-registry/modules/{moduleId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrymanage.ModuleDetailOutput, error) {
			info, err := srv.moduleRegistryManageHT.GetModule(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_MODULE_GET",
					http.StatusInternalServerError, "cannot get module registry module", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_MODULE_CREATE", http.MethodPost, "/app/admin/module-registry/modules",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrymanage.CreateModuleInput) (*moduleregistrymanage.ModuleDetailOutput, error) {
			info, err := srv.moduleRegistryManageHT.CreateModule(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_MODULE_CREATE",
					http.StatusInternalServerError, "cannot create module registry module", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_MODULE_UPDATE", http.MethodPut, "/app/admin/module-registry/modules/{moduleId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrymanage.UpdateModuleInput) (*moduleregistrymanage.ModuleDetailOutput, error) {
			info, err := srv.moduleRegistryManageHT.UpdateModule(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_MODULE_UPDATE",
					http.StatusInternalServerError, "cannot update module registry module", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_MODULE_ARCHIVE", http.MethodPost, "/app/admin/module-registry/modules/{moduleId}/archive",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrymanage.MutationResult, error) {
			info, err := srv.moduleRegistryManageHT.ArchiveModule(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_MODULE_ARCHIVE",
					http.StatusInternalServerError, "cannot archive module registry module", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_SECTION_CREATE", http.MethodPost, "/app/admin/module-registry/modules/{moduleId}/sections",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrymanage.CreateSectionInput) (*moduleregistrymanage.SectionDetailOutput, error) {
			info, err := srv.moduleRegistryManageHT.CreateSection(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_SECTION_CREATE",
					http.StatusInternalServerError, "cannot create module registry section", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_SECTION_UPDATE", http.MethodPut, "/app/admin/module-registry/sections/{sectionId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrymanage.UpdateSectionInput) (*moduleregistrymanage.SectionDetailOutput, error) {
			info, err := srv.moduleRegistryManageHT.UpdateSection(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_SECTION_UPDATE",
					http.StatusInternalServerError, "cannot update module registry section", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_SECTION_ARCHIVE", http.MethodPost, "/app/admin/module-registry/sections/{sectionId}/archive",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrymanage.MutationResult, error) {
			info, err := srv.moduleRegistryManageHT.ArchiveSection(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_SECTION_ARCHIVE",
					http.StatusInternalServerError, "cannot archive module registry section", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))
}
