package platformstudioformruntime

import (
	"context"
	"errors"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrCreateTokenConflict = errors.New("form runtime create token conflict")
	ErrConflict            = errors.New("form runtime record conflict")
	ErrInvalidRequest      = errors.New("form runtime invalid request")
	ErrModelNotFound       = errors.New("form runtime model not found")
	ErrRecordNotFound      = errors.New("form runtime record not found")
	ErrRuntimeUnsupported  = errors.New("form runtime unsupported")
	ErrTenantMissing       = errors.New("form runtime tenant missing")
	ErrUnauthorized        = errors.New("form runtime unauthorized")
	ErrViewNotFound        = errors.New("form runtime view not found")
)

type Repository interface {
	GetModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) (*ModelRecord, error)
	GetView(ctx context.Context, tenant requestctx.TenantInfo, modelID string, viewID string) (*ViewRecord, error)
	CreateRootRecord(ctx context.Context, tenant requestctx.TenantInfo, scope runtimeRootScopePlan, values map[string]any, docGuid string) (*runtimeRecordMutationRow, error)
	UpdateRootRecord(ctx context.Context, tenant requestctx.TenantInfo, scope runtimeRootScopePlan, docGuid string, values map[string]any, expectedRevision string) (*runtimeRecordMutationRow, error)
	LoadRootRecord(ctx context.Context, tenant requestctx.TenantInfo, scope runtimeRootScopePlan, docGuid string) (*runtimeRecordMutationRow, error)
	ResolveContactLookupLabels(ctx context.Context, tenant requestctx.TenantInfo, ids []int64) (map[int64]string, error)
	ResolveCurrentUserBusinessID(ctx context.Context, tenant requestctx.TenantInfo, userGUID string) (int64, error)
}

type Service struct {
	now  func() time.Time
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{
		now:  func() time.Time { return time.Now().UTC() },
		repo: repo,
	}
}

func (s *Service) LoadForm(
	ctx context.Context,
	modelID string,
	viewID string,
	docGuid string,
) (*RuntimeViewFormResponse, error) {
	tenant, claims, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}

	scopeContext, err := s.loadRootScopeContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}

	docGuid = strings.TrimSpace(docGuid)
	values := map[string]any{}
	revision := ""
	if docGuid == "" {
		if err := s.applyCreateSystemDefaults(ctx, tenant, claims, scopeContext.Scope, values); err != nil {
			return nil, err
		}
	} else {
		row, err := s.repo.LoadRootRecord(ctx, tenant, scopeContext.Scope, docGuid)
		if err != nil {
			return nil, err
		}
		values = row.Values
		revision = row.Revision
		docGuid = row.DocGuid
	}

	response := buildRuntimeViewFormResponse(scopeContext, docGuid, revision, values)
	if err := s.attachCurrentLookupOptions(ctx, tenant, scopeContext.Scope, response.DataSchema, values); err != nil {
		return nil, err
	}
	return response, nil
}

func (s *Service) CreateRecord(
	ctx context.Context,
	modelID string,
	viewID string,
	req RuntimeViewRecordMutationRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	tenant, claims, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}

	scope, err := s.loadRootScopePlan(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}

	values := s.prepareMutationValues(scope, req.Values)
	if err := s.applyCreateSystemDefaults(ctx, tenant, claims, scope, values); err != nil {
		return nil, err
	}
	if validationErrors := validateRequiredValues(scope, values); len(validationErrors) > 0 {
		return &RuntimeViewRecordMutationResponse{
			ValidationErrors: validationErrors,
			Values:           values,
		}, nil
	}

	createDocGuid := normalizeClientCreateToken(req.ClientCreateToken)
	row, err := s.repo.CreateRootRecord(ctx, tenant, scope, values, createDocGuid)
	if errors.Is(err, ErrCreateTokenConflict) && createDocGuid != "" {
		row, err = s.repo.LoadRootRecord(ctx, tenant, scope, createDocGuid)
		if err != nil {
			return nil, err
		}
		return buildMutationResponse(false, scope, row), nil
	}
	if err != nil {
		return nil, err
	}
	return buildMutationResponse(true, scope, row), nil
}

func (s *Service) UpdateRecord(
	ctx context.Context,
	modelID string,
	viewID string,
	docGuid string,
	req RuntimeViewRecordMutationRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	tenant, _, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}
	docGuid = strings.TrimSpace(docGuid)
	if docGuid == "" {
		return nil, ErrInvalidRequest
	}

	scope, err := s.loadRootScopePlan(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	values := s.prepareMutationValues(scope, req.Values)

	row, err := s.repo.UpdateRootRecord(ctx, tenant, scope, docGuid, values, strings.TrimSpace(req.ExpectedRevision))
	if err != nil {
		return nil, err
	}
	return buildMutationResponse(false, scope, row), nil
}

func (s *Service) FinishRecord(
	ctx context.Context,
	modelID string,
	viewID string,
	docGuid string,
	req RuntimeViewRecordFinishRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	tenant, _, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}
	docGuid = strings.TrimSpace(docGuid)
	if docGuid == "" {
		return nil, ErrInvalidRequest
	}

	scope, err := s.loadRootScopePlan(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}

	values := map[string]any{}
	if statusField := findField(scope, scope.SystemFields.WorkflowStatus.FieldID); statusField != nil && validOptionValue(*statusField, scope.SystemFields.WorkflowStatus.FinalValue) {
		values[statusField.FieldID] = scope.SystemFields.WorkflowStatus.FinalValue
	}

	var row *runtimeRecordMutationRow
	if len(values) == 0 {
		row, err = s.repo.LoadRootRecord(ctx, tenant, scope, docGuid)
	} else {
		row, err = s.repo.UpdateRootRecord(ctx, tenant, scope, docGuid, values, strings.TrimSpace(req.ExpectedRevision))
	}
	if err != nil {
		return nil, err
	}
	return buildMutationResponse(false, scope, row), nil
}

func (s *Service) loadRootScopePlan(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	modelID string,
	viewID string,
) (runtimeRootScopePlan, error) {
	scopeContext, err := s.loadRootScopeContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return runtimeRootScopePlan{}, err
	}
	return scopeContext.Scope, nil
}

type runtimeRootScopeContext struct {
	Model        *ModelRecord
	ModelPayload map[string]any
	Scope        runtimeRootScopePlan
	View         *ViewRecord
	ViewPayload  map[string]any
}

func (s *Service) loadRootScopeContext(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	modelID string,
	viewID string,
) (runtimeRootScopeContext, error) {
	modelID = strings.TrimSpace(modelID)
	viewID = strings.TrimSpace(viewID)
	if modelID == "" || viewID == "" {
		return runtimeRootScopeContext{}, ErrInvalidRequest
	}

	model, err := s.repo.GetModel(ctx, tenant, modelID)
	if err != nil {
		return runtimeRootScopeContext{}, err
	}
	if model == nil {
		return runtimeRootScopeContext{}, ErrModelNotFound
	}

	view, err := s.repo.GetView(ctx, tenant, model.ModelID, viewID)
	if err != nil {
		return runtimeRootScopeContext{}, err
	}
	if view == nil {
		return runtimeRootScopeContext{}, ErrViewNotFound
	}

	scope, err := buildRuntimeRootScopePlan(model, view)
	if err != nil {
		return runtimeRootScopeContext{}, err
	}
	if scope.TableName == "" || scope.SourceGUIDColumn == "" {
		return runtimeRootScopeContext{}, ErrRuntimeUnsupported
	}
	return runtimeRootScopeContext{
		Model:        model,
		ModelPayload: cloneJSONToMap(model.DefinitionJSON),
		Scope:        scope,
		View:         view,
		ViewPayload:  cloneJSONToMap(view.DefinitionJSON),
	}, nil
}
