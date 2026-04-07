package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	employeeslist "dtriton.com/platform/backend/modules/admin/employeeslist"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
)

func buildEmployeesListModule(sqlClient *postgres.Client) *employeeslist.Handler {
	repo := employeeslist.NewRepository(sqlClient)
	prefsRepo := collectionprefs.NewAdminRepository(sqlClient)
	prefsService := collectionprefs.NewService(prefsRepo)
	service := employeeslist.NewService(repo, prefsService)
	return employeeslist.NewHandler(service)
}
