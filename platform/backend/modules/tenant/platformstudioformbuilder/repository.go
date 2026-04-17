package platformstudioformbuilder

import (
	"context"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/postgres"
)

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

type Repository interface {
	ListModels(ctx context.Context, tenant requestctx.TenantInfo) ([]ModelRecord, error)
	GetModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) (*ModelRecord, error)
	ListViews(ctx context.Context, tenant requestctx.TenantInfo, modelID string) ([]ViewRecord, error)
	GetView(ctx context.Context, tenant requestctx.TenantInfo, modelID, viewID string) (*ViewRecord, error)
	CountRelationRows(ctx context.Context, tenant requestctx.TenantInfo, relationName string) (int64, error)
	ExportDataRows(ctx context.Context, tenant requestctx.TenantInfo, relationName string, columnNames []string, orderByColumn string) ([][]string, error)
	QueryRuntimeRows(
		ctx context.Context,
		tenant requestctx.TenantInfo,
		relationName string,
		columnNames []string,
		whereClause string,
		whereArgs []any,
		orderByColumn string,
		orderDirection string,
		page int,
		pageSize int,
	) ([]runtimeRelationQueryRow, int, error)
	LoadRuntimeSuggestions(
		ctx context.Context,
		tenant requestctx.TenantInfo,
		relationName string,
		columnName string,
		limit int,
	) ([]runtimeRelationSuggestion, error)
	ListExistingRuntimeRelations(ctx context.Context, tenant requestctx.TenantInfo, names []string) (map[string]string, error)
	CreateModelWithFirstView(ctx context.Context, tenant requestctx.TenantInfo, model ModelRecord, firstView ViewRecord) (*ModelRecord, *ViewRecord, error)
	CreateView(ctx context.Context, tenant requestctx.TenantInfo, view ViewRecord) (*ViewRecord, error)
	UpdateModel(ctx context.Context, tenant requestctx.TenantInfo, model ModelRecord, expectedVersion *int64) (*ModelRecord, error)
	UpdateView(ctx context.Context, tenant requestctx.TenantInfo, view ViewRecord, expectedVersion *int64) (*ViewRecord, error)
	DeleteModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) error
	DeleteView(ctx context.Context, tenant requestctx.TenantInfo, modelID, viewID string) error
	ApplyRuntime(ctx context.Context, tenant requestctx.TenantInfo, plan runtimeApplyPlan) (*RuntimeApplySummary, error)
}

type runtimeRelationQueryRow struct {
	ID    string
	Cells map[string]string
}

type runtimeRelationSuggestion struct {
	Count int
	Value string
}
