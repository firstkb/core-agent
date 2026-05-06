package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	businesstree "dtriton.com/platform/backend/modules/tenant/apppages/businesstree"
)

func buildBusinessTreePage(sqlClient *postgres.Client) *businesstree.Handler {
	repo := businesstree.NewRepository(sqlClient)
	service := businesstree.NewService(repo)
	return businesstree.NewHandler(service)
}
