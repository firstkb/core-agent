package platformstudioformbuilder

import (
	"context"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type runtimeRelationRef struct {
	Name  string
	Kind  string
	Owner string
}

func collectDataSchemaRuntimeRelationRefs(dataSchema map[string]any, owner string) []runtimeRelationRef {
	refs := make([]runtimeRelationRef, 0)
	rootRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(dataSchema, rootSchemaScopeID))
	refs = appendRuntimeDataScopeRelationRefs(refs, rootRuntime, owner+" root")
	for _, rawScope := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		scopeRuntime := readRuntimeDataScopeMetadata(scope)
		refs = appendRuntimeDataScopeRelationRefs(refs, scopeRuntime, owner+" scope "+scopeID)
	}
	return refs
}

func appendRuntimeDataScopeRelationRefs(refs []runtimeRelationRef, runtime runtimeDataScopeMetadata, owner string) []runtimeRelationRef {
	refs = appendRuntimeRelationRef(refs, runtime.TableName, "table", owner)
	refs = appendRuntimeRelationRef(refs, runtime.MVTableName, "multivalue table", owner)
	refs = appendRuntimeRelationRef(refs, runtime.DataViewName, "data view", owner)
	return refs
}

func collectUISchemaGridRelationRefs(uiSchema map[string]any, owner string) []runtimeRelationRef {
	refs := make([]runtimeRelationRef, 0)
	rootRuntime := readRuntimeViewScopeMetadata(uiScope(uiSchema, rootSchemaScopeID))
	refs = appendRuntimeRelationRef(refs, rootRuntime.GridViewName, "grid view", owner+" root")
	for _, rawScope := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		scopeRuntime := readRuntimeViewScopeMetadata(scope)
		refs = appendRuntimeRelationRef(refs, scopeRuntime.GridViewName, "grid view", owner+" scope "+scopeID)
	}
	return refs
}

func appendRuntimeRelationRef(refs []runtimeRelationRef, name string, kind string, owner string) []runtimeRelationRef {
	name = strings.TrimSpace(name)
	if name == "" {
		return refs
	}
	return append(refs, runtimeRelationRef{
		Name:  name,
		Kind:  kind,
		Owner: owner,
	})
}

func validateUniqueRuntimeRelationRefs(refs []runtimeRelationRef) error {
	seen := make(map[string]runtimeRelationRef, len(refs))
	for _, ref := range refs {
		if existing, ok := seen[ref.Name]; ok {
			return fmt.Errorf("%w: relation name %q is duplicated between %s and %s", ErrRuntimeNameConflict, ref.Name, existing.Owner, ref.Owner)
		}
		seen[ref.Name] = ref
	}
	return nil
}

func (s *Service) validateRuntimeRelationConflicts(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	currentModelID string,
	currentViewID string,
	modelPayload map[string]any,
	viewPayload map[string]any,
	existingModelPayload map[string]any,
	existingViewPayload map[string]any,
) error {
	currentRefs := append(
		collectDataSchemaRuntimeRelationRefs(asMap(modelPayload["dataSchema"]), "current model"),
		collectUISchemaGridRelationRefs(asMap(viewPayload["uiSchema"]), "current view")...,
	)
	if err := validateUniqueRuntimeRelationRefs(currentRefs); err != nil {
		return err
	}

	used := make(map[string]runtimeRelationRef)
	models, err := s.repo.ListModels(ctx, tenant)
	if err != nil {
		return err
	}
	for _, model := range models {
		views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
		if err != nil {
			return err
		}

		if model.ModelID != currentModelID {
			modelPayload, err := buildCanonicalModelPayload(&model, views)
			if err != nil {
				return err
			}
			for _, ref := range collectDataSchemaRuntimeRelationRefs(asMap(modelPayload["dataSchema"]), "model "+model.ModelID) {
				used[ref.Name] = ref
			}
		}

		for _, view := range views {
			if model.ModelID == currentModelID && view.ViewID == currentViewID {
				continue
			}
			modelPayload, err := buildCanonicalModelPayload(&model, views)
			if err != nil {
				return err
			}
			viewPayload, err := buildCanonicalViewPayload(&model, &view, views, modelPayload)
			if err != nil {
				return err
			}
			for _, ref := range collectUISchemaGridRelationRefs(asMap(viewPayload["uiSchema"]), "view "+view.ViewID) {
				used[ref.Name] = ref
			}
		}
	}

	for _, ref := range currentRefs {
		if existing, ok := used[ref.Name]; ok {
			return fmt.Errorf("%w: relation name %q for %s conflicts with %s", ErrRuntimeNameConflict, ref.Name, ref.Owner, existing.Owner)
		}
	}

	ownedByCurrent := make(map[string]runtimeRelationRef)
	for _, ref := range append(
		collectDataSchemaRuntimeRelationRefs(asMap(existingModelPayload["dataSchema"]), "persisted model"),
		collectUISchemaGridRelationRefs(asMap(existingViewPayload["uiSchema"]), "persisted view")...,
	) {
		ownedByCurrent[ref.Name] = ref
	}

	actualRelations, err := s.repo.ListExistingRuntimeRelations(ctx, tenant, runtimeRelationNames(currentRefs))
	if err != nil {
		return err
	}
	for _, ref := range currentRefs {
		actualKind, ok := actualRelations[ref.Name]
		if !ok {
			continue
		}
		expectedKind := expectedRuntimeRelationPhysicalKind(ref.Kind)
		if actualKind != expectedKind {
			return fmt.Errorf("%w: relation name %q for %s already exists in public as %s, expected %s", ErrRuntimeNameConflict, ref.Name, ref.Owner, actualKind, expectedKind)
		}
		if _, ok := ownedByCurrent[ref.Name]; !ok {
			return fmt.Errorf("%w: relation name %q for %s already exists in public as %s and is not owned by current runtime metadata", ErrRuntimeNameConflict, ref.Name, ref.Owner, actualKind)
		}
	}

	return nil
}

func runtimeRelationNames(refs []runtimeRelationRef) []string {
	names := make([]string, 0, len(refs))
	for _, ref := range refs {
		names = append(names, ref.Name)
	}
	return normalizeRuntimeRelationNames(names)
}

func expectedRuntimeRelationPhysicalKind(kind string) string {
	if strings.Contains(kind, "view") {
		return "view"
	}
	return "table"
}
