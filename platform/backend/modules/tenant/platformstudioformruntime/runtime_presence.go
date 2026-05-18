package platformstudioformruntime

import (
	"context"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

const (
	editPresenceCleanupAfter = 30 * time.Minute
	editPresenceHeartbeat    = 25 * time.Second
	editPresenceTargetType   = "form_runtime_record"
	editPresenceTTL          = 90 * time.Second
)

type runtimeEditPresenceUpsert struct {
	ClientID        string
	Context         map[string]any
	ParentTargetKey string
	TargetKey       string
	TargetLabel     string
	TargetType      string
	UserDisplayName string
	UserEmail       string
	UserID          string
}

type runtimeEditPresenceConflictQuery struct {
	ActiveSince     time.Time
	ClientID        string
	ParentTargetKey string
	TargetKey       string
	UserID          string
}

type runtimeEditPresenceRow struct {
	ClientID        string
	LastSeenAt      time.Time
	ParentTargetKey string
	TargetKey       string
	TargetLabel     string
	TargetType      string
	UserDisplayName string
	UserEmail       string
	UserID          string
}

type EditPresenceRepository interface {
	CleanupEditPresence(ctx context.Context, tenant requestctx.TenantInfo, olderThan time.Time) error
	GetModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) (*ModelRecord, error)
	GetView(ctx context.Context, tenant requestctx.TenantInfo, modelID string, viewID string) (*ViewRecord, error)
	ListEditPresenceConflicts(ctx context.Context, tenant requestctx.TenantInfo, query runtimeEditPresenceConflictQuery) ([]runtimeEditPresenceRow, error)
	LoadRootRecord(ctx context.Context, tenant requestctx.TenantInfo, scope runtimeRootScopePlan, docGuid string) (*runtimeRecordMutationRow, error)
	LoadSubformRecord(ctx context.Context, tenant requestctx.TenantInfo, rootScope runtimeRootScopePlan, subformScope runtimeSubformScopePlan, parentDocGuid string, docGuid string) (*runtimeRecordMutationRow, error)
	UpsertEditPresence(ctx context.Context, tenant requestctx.TenantInfo, presence runtimeEditPresenceUpsert) error
}

type EditPresenceService struct {
	now  func() time.Time
	repo EditPresenceRepository
}

func NewEditPresenceService(repo EditPresenceRepository) *EditPresenceService {
	return &EditPresenceService{
		now:  func() time.Time { return time.Now().UTC() },
		repo: repo,
	}
}

func (s *EditPresenceService) HeartbeatRecordPresence(
	ctx context.Context,
	modelID string,
	viewID string,
	docGuid string,
	req RuntimeViewEditPresenceRequest,
) (*RuntimeViewEditPresenceResponse, error) {
	tenant, claims, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}
	clientID, err := normalizePresenceClientID(req.ClientID)
	if err != nil {
		return nil, err
	}
	scopeContext, err := s.loadRootScopeContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	docGuid = strings.TrimSpace(docGuid)
	if docGuid == "" {
		return nil, ErrInvalidRequest
	}
	row, err := s.repo.LoadRootRecord(ctx, tenant, scopeContext.Scope, docGuid)
	if err != nil {
		return nil, err
	}
	docGuid = chooseString(row.DocGuid, docGuid)

	targetKey := runtimePresenceRootTargetKey(scopeContext.Scope.ModelID, scopeContext.Scope.ViewID, docGuid)
	return s.heartbeatEditPresence(ctx, tenant, claims, req, clientID, row.Revision, runtimeEditPresenceUpsert{
		ClientID:        clientID,
		Context:         runtimePresenceContext(scopeContext.Scope.ModelID, scopeContext.Scope.ViewID, "", docGuid),
		ParentTargetKey: targetKey,
		TargetKey:       targetKey,
		TargetLabel:     runtimePresenceRootTargetLabel(scopeContext),
		TargetType:      editPresenceTargetType,
	})
}

func (s *EditPresenceService) HeartbeatSubformPresence(
	ctx context.Context,
	modelID string,
	viewID string,
	parentDocGuid string,
	subformID string,
	docGuid string,
	req RuntimeViewEditPresenceRequest,
) (*RuntimeViewEditPresenceResponse, error) {
	tenant, claims, err := requireRuntimeContext(ctx)
	if err != nil {
		return nil, err
	}
	clientID, err := normalizePresenceClientID(req.ClientID)
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
	parentRow, err := s.repo.LoadRootRecord(ctx, tenant, scopeContext.Scope, parentDocGuid)
	if err != nil {
		return nil, err
	}
	parentDocGuid = chooseString(parentRow.DocGuid, parentDocGuid)
	parentTargetKey := runtimePresenceRootTargetKey(scopeContext.Scope.ModelID, scopeContext.Scope.ViewID, parentDocGuid)

	currentRevision := parentRow.Revision
	targetKey := runtimePresenceSubformCreateTargetKey(parentTargetKey, subformScope.ScopeID, clientID)
	if docGuid != "" {
		row, err := s.repo.LoadSubformRecord(ctx, tenant, scopeContext.Scope, subformScope, parentDocGuid, docGuid)
		if err != nil {
			return nil, err
		}
		docGuid = chooseString(row.DocGuid, docGuid)
		currentRevision = row.Revision
		targetKey = runtimePresenceSubformTargetKey(parentTargetKey, subformScope.ScopeID, docGuid)
	}

	return s.heartbeatEditPresence(ctx, tenant, claims, req, clientID, currentRevision, runtimeEditPresenceUpsert{
		ClientID:        clientID,
		Context:         runtimePresenceContext(scopeContext.Scope.ModelID, scopeContext.Scope.ViewID, subformScope.ScopeID, chooseString(docGuid, parentDocGuid)),
		ParentTargetKey: parentTargetKey,
		TargetKey:       targetKey,
		TargetLabel:     runtimePresenceSubformTargetLabel(scopeContext, subformScope),
		TargetType:      editPresenceTargetType,
	})
}

func (s *EditPresenceService) heartbeatEditPresence(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	claims requestctx.ClaimsInfo,
	req RuntimeViewEditPresenceRequest,
	clientID string,
	currentRevision string,
	presence runtimeEditPresenceUpsert,
) (*RuntimeViewEditPresenceResponse, error) {
	userID := strings.TrimSpace(claims.UserID)
	if userID == "" {
		return nil, ErrUnauthorized
	}
	presence.ClientID = clientID
	presence.UserDisplayName = runtimePresenceUserDisplayName(claims)
	presence.UserEmail = strings.TrimSpace(claims.Email)
	presence.UserID = userID
	if err := s.repo.UpsertEditPresence(ctx, tenant, presence); err != nil {
		return nil, err
	}
	_ = s.repo.CleanupEditPresence(ctx, tenant, s.now().Add(-editPresenceCleanupAfter))

	conflicts, err := s.repo.ListEditPresenceConflicts(ctx, tenant, runtimeEditPresenceConflictQuery{
		ActiveSince:     s.now().Add(-editPresenceTTL),
		ClientID:        clientID,
		ParentTargetKey: presence.ParentTargetKey,
		TargetKey:       presence.TargetKey,
		UserID:          userID,
	})
	if err != nil {
		return nil, err
	}

	return &RuntimeViewEditPresenceResponse{
		Editors:                  runtimePresenceEditors(conflicts, userID, presence),
		HeartbeatIntervalSeconds: int(editPresenceHeartbeat / time.Second),
		Record: RuntimeViewEditPresenceRecordState{
			Changed:         strings.TrimSpace(req.KnownRevision) != "" && strings.TrimSpace(currentRevision) != "" && strings.TrimSpace(req.KnownRevision) != strings.TrimSpace(currentRevision),
			CurrentRevision: strings.TrimSpace(currentRevision),
		},
		TTLSeconds: int(editPresenceTTL / time.Second),
	}, nil
}

func normalizePresenceClientID(clientID string) (string, error) {
	clientID = strings.TrimSpace(clientID)
	if clientID == "" || len(clientID) > 128 {
		return "", ErrInvalidRequest
	}
	return clientID, nil
}

func runtimePresenceRootTargetKey(modelID string, viewID string, docGuid string) string {
	return "form:" + strings.TrimSpace(modelID) + ":view:" + strings.TrimSpace(viewID) + ":record:" + strings.TrimSpace(docGuid)
}

func runtimePresenceSubformTargetKey(parentTargetKey string, subformID string, docGuid string) string {
	return strings.TrimSpace(parentTargetKey) + ":subform:" + strings.TrimSpace(subformID) + ":record:" + strings.TrimSpace(docGuid)
}

func runtimePresenceSubformCreateTargetKey(parentTargetKey string, subformID string, clientID string) string {
	return strings.TrimSpace(parentTargetKey) + ":subform:" + strings.TrimSpace(subformID) + ":new:" + strings.TrimSpace(clientID)
}

func runtimePresenceContext(modelID string, viewID string, subformID string, docGuid string) map[string]any {
	context := map[string]any{
		"docGuid": strings.TrimSpace(docGuid),
		"modelId": strings.TrimSpace(modelID),
		"viewId":  strings.TrimSpace(viewID),
	}
	if strings.TrimSpace(subformID) != "" {
		context["subformId"] = strings.TrimSpace(subformID)
	}
	return context
}

func runtimePresenceRootTargetLabel(scopeContext runtimeRootScopeContext) string {
	return chooseString(scopeContext.View.DisplayName, chooseString(scopeContext.Model.DisplayName, scopeContext.Scope.ModelID))
}

func runtimePresenceSubformTargetLabel(scopeContext runtimeRootScopeContext, subformScope runtimeSubformScopePlan) string {
	viewUISchema := asMap(scopeContext.ViewPayload["uiSchema"])
	return chooseString(runtimeSubformNodeTitle(viewUISchema, subformScope.ScopeID), chooseString(subformScope.TableKey, subformScope.ScopeID))
}

func runtimePresenceUserDisplayName(claims requestctx.ClaimsInfo) string {
	displayName := strings.TrimSpace(strings.TrimSpace(claims.FirstName) + " " + strings.TrimSpace(claims.LastName))
	if displayName != "" {
		return displayName
	}
	if email := strings.TrimSpace(claims.Email); email != "" {
		return email
	}
	return strings.TrimSpace(claims.UserID)
}

func (s *EditPresenceService) loadRootScopeContext(
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

func runtimePresenceEditors(rows []runtimeEditPresenceRow, currentUserID string, current runtimeEditPresenceUpsert) []RuntimeViewEditPresenceEditor {
	out := make([]RuntimeViewEditPresenceEditor, 0, len(rows))
	seenUsers := map[string]struct{}{}
	for _, row := range rows {
		rowUserID := strings.TrimSpace(row.UserID)
		if rowUserID == "" || rowUserID == strings.TrimSpace(currentUserID) {
			continue
		}
		if _, seen := seenUsers[rowUserID]; seen {
			continue
		}
		seenUsers[rowUserID] = struct{}{}
		out = append(out, RuntimeViewEditPresenceEditor{
			ClientID:    row.ClientID,
			DisplayName: chooseString(row.UserDisplayName, chooseString(row.UserEmail, row.UserID)),
			Email:       row.UserEmail,
			LastSeenAt:  row.LastSeenAt.UTC().Format(time.RFC3339),
			SameUser:    false,
			Scope:       runtimePresenceConflictScope(row, current),
			TargetLabel: row.TargetLabel,
			UserID:      row.UserID,
		})
	}
	return out
}

func runtimePresenceConflictScope(row runtimeEditPresenceRow, current runtimeEditPresenceUpsert) string {
	switch {
	case row.TargetKey == current.TargetKey:
		return "same_record"
	case row.TargetKey == current.ParentTargetKey:
		return "parent_record"
	case current.ParentTargetKey != "" && row.ParentTargetKey == current.ParentTargetKey:
		return "related_subform"
	default:
		return "related_record"
	}
}
