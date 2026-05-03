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
	CreateSubformRecord(ctx context.Context, tenant requestctx.TenantInfo, rootScope runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, values map[string]any, docGuid string) (*runtimeRecordMutationRow, error)
	UpdateRootRecord(ctx context.Context, tenant requestctx.TenantInfo, scope runtimeRootScopePlan, docGuid string, values map[string]any, expectedRevision string) (*runtimeRecordMutationRow, error)
	UpdateSubformRecord(ctx context.Context, tenant requestctx.TenantInfo, rootScope runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, docGuid string, values map[string]any, expectedRevision string) (*runtimeRecordMutationRow, error)
	SetRootRecordsActive(ctx context.Context, tenant requestctx.TenantInfo, scope runtimeRootScopePlan, docGuids []string, activeColumn string, active bool) error
	DeleteRootRecords(ctx context.Context, tenant requestctx.TenantInfo, scope runtimeRootScopePlan, docGuids []string) error
	DeleteSubformRecord(ctx context.Context, tenant requestctx.TenantInfo, rootScope runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, docGuid string) error
	LoadRootRecord(ctx context.Context, tenant requestctx.TenantInfo, scope runtimeRootScopePlan, docGuid string) (*runtimeRecordMutationRow, error)
	LoadSubformRecord(ctx context.Context, tenant requestctx.TenantInfo, rootScope runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, docGuid string) (*runtimeRecordMutationRow, error)
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

func (s *Service) LoadSubform(
	ctx context.Context,
	modelID string,
	viewID string,
	parentDocGuid string,
	subformID string,
	docGuid string,
) (*RuntimeViewFormResponse, error) {
	tenant, _, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}

	scopeContext, err := s.loadRootScopeContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	subformScope, ok := findSubformScope(scopeContext.Scope, subformID)
	if !ok || !subformScopeSupportsRuntimeForm(subformScope) {
		return nil, ErrRuntimeUnsupported
	}

	parentDocGuid = strings.TrimSpace(parentDocGuid)
	docGuid = strings.TrimSpace(docGuid)
	if parentDocGuid == "" {
		return nil, ErrInvalidRequest
	}

	values := map[string]any{}
	revision := ""
	if docGuid != "" {
		row, err := s.repo.LoadSubformRecord(ctx, tenant, scopeContext.Scope, subformScope, parentDocGuid, docGuid)
		if err != nil {
			return nil, err
		}
		values = row.Values
		revision = row.Revision
		docGuid = row.DocGuid
	}

	response := buildRuntimeSubformFormResponse(scopeContext, subformScope, docGuid, revision, values)
	if err := s.attachCurrentLookupOptions(ctx, tenant, rootScopeFromSubform(scopeContext.Scope, subformScope), response.DataSchema, values); err != nil {
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

func (s *Service) CreateSubformRecord(
	ctx context.Context,
	modelID string,
	viewID string,
	parentDocGuid string,
	subformID string,
	req RuntimeViewRecordMutationRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	tenant, _, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}
	parentDocGuid = strings.TrimSpace(parentDocGuid)
	if parentDocGuid == "" {
		return nil, ErrInvalidRequest
	}

	scopeContext, err := s.loadRootScopeContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	subformScope, ok := findSubformScope(scopeContext.Scope, subformID)
	if !ok || !subformScopeSupportsRuntimeForm(subformScope) {
		return nil, ErrRuntimeUnsupported
	}
	mutationScope := rootScopeFromSubform(scopeContext.Scope, subformScope)
	values := s.prepareMutationValues(mutationScope, req.Values)
	if validationErrors := validateRequiredValues(mutationScope, values); len(validationErrors) > 0 {
		return &RuntimeViewRecordMutationResponse{
			ValidationErrors: validationErrors,
			Values:           values,
		}, nil
	}

	createDocGuid := normalizeClientCreateToken(req.ClientCreateToken)
	row, err := s.repo.CreateSubformRecord(ctx, tenant, scopeContext.Scope, subformScope, parentDocGuid, values, createDocGuid)
	if errors.Is(err, ErrCreateTokenConflict) && createDocGuid != "" {
		row, err = s.repo.LoadSubformRecord(ctx, tenant, scopeContext.Scope, subformScope, parentDocGuid, createDocGuid)
		if err != nil {
			return nil, err
		}
		return buildMutationResponse(false, mutationScope, row), nil
	}
	if err != nil {
		return nil, err
	}
	return buildMutationResponse(true, mutationScope, row), nil
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

func (s *Service) UpdateSubformRecord(
	ctx context.Context,
	modelID string,
	viewID string,
	parentDocGuid string,
	subformID string,
	docGuid string,
	req RuntimeViewRecordMutationRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	tenant, _, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}
	parentDocGuid = strings.TrimSpace(parentDocGuid)
	docGuid = strings.TrimSpace(docGuid)
	if parentDocGuid == "" || docGuid == "" {
		return nil, ErrInvalidRequest
	}

	scopeContext, err := s.loadRootScopeContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	subformScope, ok := findSubformScope(scopeContext.Scope, subformID)
	if !ok || !subformScopeSupportsRuntimeForm(subformScope) {
		return nil, ErrRuntimeUnsupported
	}
	mutationScope := rootScopeFromSubform(scopeContext.Scope, subformScope)
	values := s.prepareMutationValues(mutationScope, req.Values)

	row, err := s.repo.UpdateSubformRecord(ctx, tenant, scopeContext.Scope, subformScope, parentDocGuid, docGuid, values, strings.TrimSpace(req.ExpectedRevision))
	if err != nil {
		return nil, err
	}
	return buildMutationResponse(false, mutationScope, row), nil
}

func (s *Service) DeleteSubformRecord(
	ctx context.Context,
	modelID string,
	viewID string,
	parentDocGuid string,
	subformID string,
	docGuid string,
) (*RuntimeViewDeleteResponse, error) {
	tenant, _, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}
	parentDocGuid = strings.TrimSpace(parentDocGuid)
	docGuid = strings.TrimSpace(docGuid)
	if parentDocGuid == "" || docGuid == "" {
		return nil, ErrInvalidRequest
	}

	scopeContext, err := s.loadRootScopeContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	subformScope, ok := findSubformScope(scopeContext.Scope, subformID)
	if !ok || !subformScopeSupportsRuntimeForm(subformScope) {
		return nil, ErrRuntimeUnsupported
	}
	if err := s.repo.DeleteSubformRecord(ctx, tenant, scopeContext.Scope, subformScope, parentDocGuid, docGuid); err != nil {
		return nil, err
	}
	return &RuntimeViewDeleteResponse{OK: true}, nil
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

func (s *Service) RunBulkAction(
	ctx context.Context,
	modelID string,
	viewID string,
	actionID string,
	req RuntimeViewBulkActionRequest,
) (*RuntimeViewBulkActionResponse, error) {
	tenant, _, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}
	actionID = strings.TrimSpace(actionID)
	rowIDs := normalizeBulkRowIDs(req.RowIDs)
	if actionID == "" || len(rowIDs) == 0 {
		return nil, ErrInvalidRequest
	}

	scopeContext, err := s.loadRootScopeContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	if scopeContext.Scope.SourceGUIDColumn == "" {
		return nil, ErrRuntimeUnsupported
	}

	switch actionID {
	case "active", "inactive":
		if !readRuntimeViewAction(scopeContext.ViewPayload, "canEdit", true) {
			return nil, ErrRuntimeUnsupported
		}
		activeField := findVisibleActiveField(scopeContext.Scope, scopeContext.ViewPayload)
		if activeField == nil {
			return nil, ErrRuntimeUnsupported
		}
		if err := s.repo.SetRootRecordsActive(ctx, tenant, scopeContext.Scope, rowIDs, activeField.ColumnName, actionID == "active"); err != nil {
			return nil, err
		}
		return &RuntimeViewBulkActionResponse{OK: true}, nil
	case "delete":
		if !readRuntimeViewAction(scopeContext.ViewPayload, "canDelete", true) {
			return nil, ErrRuntimeUnsupported
		}
		if err := s.repo.DeleteRootRecords(ctx, tenant, scopeContext.Scope, rowIDs); err != nil {
			return nil, err
		}
		return &RuntimeViewBulkActionResponse{OK: true}, nil
	default:
		return nil, ErrInvalidRequest
	}
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

func findSubformScope(scope runtimeRootScopePlan, subformID string) (runtimeSubformScopePlan, bool) {
	subformID = strings.TrimSpace(subformID)
	if subformID == "" {
		return runtimeSubformScopePlan{}, false
	}
	for _, subformScope := range scope.SubformScopes {
		if subformScope.ScopeID == subformID || subformScope.TableKey == subformID {
			return subformScope, true
		}
	}
	return runtimeSubformScopePlan{}, false
}

func subformScopeSupportsRuntimeForm(subformScope runtimeSubformScopePlan) bool {
	return subformScope.SubformType != "CHECKLIST" &&
		strings.TrimSpace(subformScope.TableName) != "" &&
		strings.TrimSpace(subformScope.ParentForeignKey) != "" &&
		strings.TrimSpace(subformScope.SourceIDColumn) != "" &&
		strings.TrimSpace(subformScope.SourceGUIDColumn) != ""
}

func rootScopeFromSubform(rootScope runtimeRootScopePlan, subformScope runtimeSubformScopePlan) runtimeRootScopePlan {
	return runtimeRootScopePlan{
		ModelID:                   rootScope.ModelID,
		ViewID:                    rootScope.ViewID,
		SourceType:                rootScope.SourceType,
		TableName:                 subformScope.TableName,
		DataViewName:              subformScope.DataViewName,
		MultiValueOwnerForeignKey: subformScope.MultiValueOwnerForeignKey,
		MultiValueTableName:       subformScope.MultiValueTableName,
		SourceIDColumn:            subformScope.SourceIDColumn,
		SourceTenantColumn:        subformScope.SourceTenantColumn,
		SourceGUIDColumn:          subformScope.SourceGUIDColumn,
		SourceUpdatedColumn:       subformScope.SourceUpdatedColumn,
		TenantScoped:              subformScope.TenantScoped,
		Fields:                    subformScope.Fields,
	}
}

func normalizeBulkRowIDs(rowIDs []string) []string {
	out := make([]string, 0, len(rowIDs))
	seen := make(map[string]struct{}, len(rowIDs))
	for _, rowID := range rowIDs {
		rowID = strings.TrimSpace(rowID)
		if rowID == "" {
			continue
		}
		if _, ok := seen[rowID]; ok {
			continue
		}
		seen[rowID] = struct{}{}
		out = append(out, rowID)
	}
	return out
}

func readRuntimeViewAction(viewPayload map[string]any, actionKey string, fallback bool) bool {
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	viewSettings := asMap(rootScope["viewSettings"])
	if len(viewSettings) == 0 {
		rootView := asMap(viewPayload["rootView"])
		viewSettings = asMap(rootView["viewSettings"])
	}
	actions := asMap(viewSettings["actions"])
	return getBoolValue(actions, actionKey, fallback)
}

func findVisibleActiveField(scope runtimeRootScopePlan, viewPayload map[string]any) *runtimeFieldPlan {
	visibleFieldIDs := visibleRuntimeListFieldIDs(viewPayload)
	if len(visibleFieldIDs) == 0 {
		return nil
	}
	for index := range scope.Fields {
		field := &scope.Fields[index]
		if !field.Supported || field.Kind != "boolean" || field.ColumnName != "active" {
			continue
		}
		if _, ok := visibleFieldIDs[field.FieldID]; ok {
			return field
		}
	}
	return nil
}

func visibleRuntimeListFieldIDs(viewPayload map[string]any) map[string]struct{} {
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	viewSettings := asMap(rootScope["viewSettings"])
	if len(viewSettings) == 0 {
		rootView := asMap(viewPayload["rootView"])
		viewSettings = asMap(rootView["viewSettings"])
	}
	listSettings := asMap(viewSettings["list"])
	rawColumns := asSlice(listSettings["columns"])
	out := make(map[string]struct{}, len(rawColumns))
	for _, rawColumn := range rawColumns {
		column := asMap(rawColumn)
		if !getBoolValue(column, "visible", true) {
			continue
		}
		fieldID := normalizeString(column["fieldId"])
		if fieldID == "" || strings.Contains(fieldID, "::lookup_output::") {
			continue
		}
		out[fieldID] = struct{}{}
	}
	return out
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
