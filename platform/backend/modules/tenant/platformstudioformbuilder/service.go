package platformstudioformbuilder

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrCannotDeleteLastView   = errors.New("form builder cannot delete last view")
	ErrDraftConflict          = errors.New("form builder draft version conflict")
	ErrInvalidDraft           = errors.New("form builder invalid draft")
	ErrDeleteUnsupported      = errors.New("form builder delete unsupported")
	ErrModelLocked            = errors.New("form builder model locked")
	ErrModelStructureReadOnly = errors.New("form builder model structure read only")
	ErrModelNotFound          = errors.New("form builder model not found")
	ErrRecordNotFound         = errors.New("form builder record not found")
	ErrRecordViewRequiresGUID = errors.New("form builder record view requires guid")
	ErrExportUnsupported      = errors.New("form builder export unsupported")
	ErrRuntimeNameConflict    = errors.New("form builder runtime name conflict")
	ErrTenantMissing          = errors.New("form builder tenant missing")
	ErrUnauthorized           = errors.New("form builder unauthorized")
	ErrViewLocked             = errors.New("form builder view locked")
	ErrViewNotFound           = errors.New("form builder view not found")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func buildModelRecordFromPayload(payload map[string]any) ModelRecord {
	displayName := chooseString(normalizeString(payload["displayName"]), chooseString(normalizeString(payload["title"]), normalizeString(payload["name"])))
	modelID := chooseString(normalizeString(payload["id"]), normalizeString(payload["key"]))
	modelKey := chooseString(normalizeString(payload["key"]), modelID)

	return ModelRecord{
		ModelID:           modelID,
		ModelKey:          modelKey,
		StorageKey:        normalizeString(payload["storageKey"]),
		DisplayName:       displayName,
		Description:       normalizeString(payload["description"]),
		SourceType:        chooseString(normalizeString(payload["sourceType"]), "managed"),
		Status:            chooseString(normalizeString(payload["status"]), "draft"),
		Version:           getInt64Value(payload, "version", 1),
		PublishedVersion:  getInt64Value(payload, "publishedVersion", 0),
		StructureVersion:  getInt64Value(payload, "modelStructureVersion", 1),
		IsStructureLocked: getBoolValue(payload, "isStructureLocked", getBoolValue(payload, "modelLocked", false)),
		CanEditViewsOnly: effectiveCanEditViewsOnlyForSourceType(
			chooseString(normalizeString(payload["sourceType"]), "managed"),
			getBoolValue(payload, "canEditViewsOnly", getBoolValue(payload, "isStructureLocked", false)),
		),
		DefinitionJSON: mustCanonicalJSON(payload),
	}
}

func buildViewRecordFromPayload(modelID, viewID string, payload map[string]any) ViewRecord {
	displayName := chooseString(normalizeString(payload["displayName"]), chooseString(normalizeString(payload["title"]), normalizeString(payload["name"])))
	return ViewRecord{
		ModelID:                          modelID,
		ViewID:                           viewID,
		ViewKey:                          chooseString(normalizeString(payload["key"]), viewID),
		DisplayName:                      displayName,
		Description:                      normalizeString(payload["description"]),
		ViewType:                         chooseString(normalizeString(payload["kind"]), "form"),
		IsDefault:                        getBoolValue(payload, "isDefault", false),
		IsActive:                         getBoolValue(payload, "isActive", true),
		IsViewLocked:                     getBoolValue(payload, "isViewLocked", getBoolValue(payload, "viewLocked", false)),
		Status:                           chooseString(normalizeString(payload["status"]), "draft"),
		Version:                          getInt64Value(payload, "viewVersion", 1),
		PublishedVersion:                 getInt64Value(payload, "publishedVersion", 0),
		LastAlignedModelStructureVersion: getInt64Value(payload, "lastAlignedModelStructureVersion", 1),
		DefinitionJSON:                   mustCanonicalJSON(payload),
		PublishedArtifactsJSON:           json.RawMessage(`{}`),
	}
}

func normalizeStableKey(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return ""
	}

	var b strings.Builder
	lastDash := false
	for _, r := range value {
		switch {
		case r >= 'a' && r <= 'z':
			b.WriteRune(r)
			lastDash = false
		case r >= '0' && r <= '9':
			b.WriteRune(r)
			lastDash = false
		default:
			if !lastDash {
				b.WriteByte('-')
				lastDash = true
			}
		}
	}

	out := strings.Trim(b.String(), "-")
	if out == "" {
		return ""
	}
	return out
}

func toStorageKey(value string) string {
	value = normalizeStableKey(value)
	if value == "" {
		return ""
	}

	value = strings.ReplaceAll(value, "-", "_")
	return strings.Trim(value, "_")
}

func normalizeViewKind(value string, fallback ...string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value != "" {
		return value
	}
	if len(fallback) > 0 {
		return strings.TrimSpace(strings.ToLower(fallback[0]))
	}
	return "form"
}

func chooseString(primary, fallback string) string {
	if strings.TrimSpace(primary) != "" {
		return strings.TrimSpace(primary)
	}
	return strings.TrimSpace(fallback)
}

func chooseBool(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}

func normalizeString(value any) string {
	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed)
	case json.RawMessage:
		return strings.TrimSpace(string(typed))
	default:
		return ""
	}
}

func getBoolValue(payload map[string]any, key string, fallback bool) bool {
	value, ok := payload[key]
	if !ok {
		return fallback
	}
	if typed, ok := value.(bool); ok {
		return typed
	}
	return fallback
}

func getInt64Value(payload map[string]any, key string, fallback int64) int64 {
	value, ok := payload[key]
	if !ok {
		return fallback
	}
	switch typed := value.(type) {
	case int64:
		return typed
	case int:
		return int64(typed)
	case float64:
		return int64(typed)
	case json.Number:
		if parsed, err := typed.Int64(); err == nil {
			return parsed
		}
	}
	return fallback
}

func getBoolFallback(payload map[string]any, primaryKey, fallbackKey string, fallback bool) bool {
	if value, ok := payload[primaryKey]; ok {
		if typed, ok := value.(bool); ok {
			return typed
		}
	}
	if value, ok := payload[fallbackKey]; ok {
		if typed, ok := value.(bool); ok {
			return typed
		}
	}
	return fallback
}

func normalizeStableKeyFromPayload(payload map[string]any, keys ...string) string {
	for _, key := range keys {
		if value := normalizeStableKey(normalizeString(payload[key])); value != "" {
			return value
		}
	}
	return ""
}

func cloneJSONToMap(raw json.RawMessage) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return map[string]any{}
	}
	if out == nil {
		return map[string]any{}
	}
	return out
}

func mustCanonicalJSON(value any) json.RawMessage {
	encoded, err := json.Marshal(value)
	if err != nil {
		return json.RawMessage(`{}`)
	}
	return json.RawMessage(encoded)
}

func decodeObject(raw json.RawMessage, fieldName string) (map[string]any, error) {
	if len(raw) == 0 {
		return nil, ErrInvalidDraft
	}

	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("%w: invalid %s", ErrInvalidDraft, fieldName)
	}
	if out == nil {
		return nil, ErrInvalidDraft
	}
	return out, nil
}

func payloadChanged(existing json.RawMessage, incoming map[string]any, transientKeys []string) (bool, error) {
	existingMap := cloneJSONToMap(existing)
	existingPruned := pruneTransientKeys(existingMap, transientKeys)
	incomingPruned := pruneTransientKeys(cloneJSONToMap(mustCanonicalJSON(incoming)), transientKeys)

	left, err := json.Marshal(existingPruned)
	if err != nil {
		return false, err
	}
	right, err := json.Marshal(incomingPruned)
	if err != nil {
		return false, err
	}

	return string(left) != string(right), nil
}

func structureChanged(existing json.RawMessage, incoming map[string]any) (bool, error) {
	existingMap := cloneJSONToMap(existing)
	existingSignature := pruneTransientKeys(existingMap, []string{
		"version",
		"modelStructureVersion",
		"guid",
		"status",
		"screens",
		"canEditViewsOnly",
		"modelLocked",
		"isStructureLocked",
		"description",
		"displayName",
		"label",
		"modelTitle",
		"name",
		"title",
	})
	incomingSignature := pruneTransientKeys(cloneJSONToMap(mustCanonicalJSON(incoming)), []string{
		"version",
		"modelStructureVersion",
		"guid",
		"status",
		"screens",
		"canEditViewsOnly",
		"modelLocked",
		"isStructureLocked",
		"description",
		"displayName",
		"label",
		"modelTitle",
		"name",
		"title",
	})

	left, err := json.Marshal(existingSignature)
	if err != nil {
		return false, err
	}
	right, err := json.Marshal(incomingSignature)
	if err != nil {
		return false, err
	}

	return string(left) != string(right), nil
}

func pruneTransientKeys(value map[string]any, transientKeys []string) map[string]any {
	if value == nil {
		return map[string]any{}
	}

	blocked := make(map[string]struct{}, len(transientKeys))
	for _, key := range transientKeys {
		blocked[key] = struct{}{}
	}

	return pruneValue(value, blocked).(map[string]any)
}

func pruneValue(value any, blocked map[string]struct{}) any {
	switch typed := value.(type) {
	case map[string]any:
		out := make(map[string]any, len(typed))
		for key, child := range typed {
			if _, ok := blocked[key]; ok {
				continue
			}
			out[key] = pruneValue(child, blocked)
		}
		return out
	case []any:
		out := make([]any, 0, len(typed))
		for _, entry := range typed {
			out = append(out, pruneValue(entry, blocked))
		}
		return out
	default:
		return typed
	}
}

func isRootActor(claims requestctx.ClaimsInfo) bool {
	return claims.Level == 100
}

func canAccessViewAuthoring(claims requestctx.ClaimsInfo, view *ViewRecord) bool {
	if view == nil {
		return false
	}
	return isRootActor(claims) || !view.IsViewLocked
}

func isStaticModelRestrictedForActor(claims requestctx.ClaimsInfo, model *ModelRecord) bool {
	if model == nil {
		return false
	}
	return !isRootActor(claims) && isExternalRuntimeSourceType(model.SourceType)
}

func isModelStructureReadOnly(model *ModelRecord) bool {
	if model == nil {
		return false
	}
	return isExternalRuntimeSourceType(model.SourceType)
}

func effectiveCanEditViewsOnly(model *ModelRecord) bool {
	if model == nil {
		return false
	}
	return effectiveCanEditViewsOnlyForSourceType(model.SourceType, model.CanEditViewsOnly || model.IsStructureLocked)
}

func effectiveCanEditViewsOnlyForSourceType(sourceType string, configured bool) bool {
	return isExternalRuntimeSourceType(sourceType) || configured
}
