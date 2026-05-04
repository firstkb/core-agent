import {
  requestWithUnauthorizedRetry,
} from "@platform/api-client";

import {
  isDraftEndpointUnavailable,
  type FormBuilderDraftSaveClient,
} from "./form-builder-draft-api";
import { buildCanonicalDataSchema } from "./form-builder-workspace-data-schema";
import { buildWorkspaceDocumentFromCanonicalSchemas } from "./form-builder-workspace-document-hydration";
import {
  buildDataSchemaStructureSignature,
} from "./form-builder-workspace-diff-helpers";
import { getModelFieldLabel } from "./form-builder-workspace-field-scope-grid";
import {
  isPersistedModelField,
  syncFieldNodeTitlesWithModel,
} from "./form-builder-workspace-normalization-helpers";
import {
  getDocumentFieldSchemaScopeKey,
  isRecord,
  replaceModelViewById,
} from "./form-builder-workspace-schema-utils";
import { buildCanonicalUiSchema } from "./form-builder-workspace-ui-schema";
import {
  reconcileFormBuilderDocumentWithModel,
  type FormBuilderDocument,
} from "../forms-builder-state";
import {
  cloneFormsPlaceholderModel,
  createFormsPlaceholderStorageKey,
  findFormsPlaceholderScreenById,
  normalizeFormsPlaceholderModel,
  normalizeFormsPlaceholderView,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";

export type SavedFormBuilderDraft = {
  savedDocument: FormBuilderDocument;
  savedLayoutBlueprint: Record<string, unknown>;
  savedModel: FormsPlaceholderModel;
};

type SaveFormBuilderDraftInput = {
  accessToken: string;
  checkAuth: () => Promise<boolean>;
  currentDataSchema: Record<string, unknown>;
  currentLayoutBlueprint: Record<string, unknown>;
  currentModel: FormsPlaceholderModel;
  currentModelSchemaScopes: FormsPlaceholderModel["schemaScopes"];
  currentView: FormsPlaceholderView;
  document: FormBuilderDocument;
  draftClient: FormBuilderDraftSaveClient;
  getAccessToken: () => string | null;
  hasUnsavedModelChanges: boolean;
  isDefaultView: boolean;
  savedDataSchema: Record<string, unknown>;
  savedLayoutBlueprintDraft: Record<string, unknown>;
  savedModelDraft: FormsPlaceholderModel;
  shouldSyncFieldNodeTitlesWithModel: boolean;
};

export async function saveFormBuilderDraft({
  accessToken,
  checkAuth,
  currentDataSchema,
  currentLayoutBlueprint,
  currentModel,
  currentModelSchemaScopes,
  currentView,
  document,
  draftClient,
  getAccessToken,
  hasUnsavedModelChanges,
  isDefaultView,
  savedDataSchema,
  savedLayoutBlueprintDraft,
  savedModelDraft,
  shouldSyncFieldNodeTitlesWithModel,
}: SaveFormBuilderDraftInput): Promise<SavedFormBuilderDraft> {
  const structureChanged = isDefaultView && (
    buildDataSchemaStructureSignature(currentDataSchema) !== buildDataSchemaStructureSignature(savedDataSchema)
  );
  const previousModelStructureVersion = savedModelDraft.modelStructureVersion ?? 1;
  const nextModelStructureVersion = structureChanged
    ? previousModelStructureVersion + 1
    : (savedModelDraft.modelStructureVersion ?? currentModel.modelStructureVersion ?? previousModelStructureVersion);
  const previousCurrentView = findFormsPlaceholderScreenById(savedModelDraft.screens, currentView.id) ?? currentView;
  const nextViewTitle = document.viewTitle.trim() || currentView.title;
  const nextViewDescription = document.viewDescription;
  const nextModel = cloneFormsPlaceholderModel({
    ...currentModel,
    fields: currentModel.fields.map((field) => {
      const modelLabel = getModelFieldLabel(field);
      const schemaScopeKey = getDocumentFieldSchemaScopeKey(document, field.id) ?? field.schemaScopeKey;
      const storageKey = field.storageKey && isPersistedModelField(field)
        ? field.storageKey
        : createFormsPlaceholderStorageKey(field.storageKey ?? modelLabel, field.id);

      return {
        ...field,
        displayName: modelLabel,
        isPersisted: true,
        label: modelLabel,
        schemaScopeKey,
        status: field.status === "published" ? "published" : "persisted",
        storageKey,
      };
    }),
    modelStructureVersion: nextModelStructureVersion,
    schemaScopes: currentModelSchemaScopes,
    screens: currentModel.screens.map((screenEntry) =>
      screenEntry.id === currentView.id
        ? {
            ...screenEntry,
            displayName: nextViewTitle,
            description: nextViewDescription,
            lastAlignedModelStructureVersion: nextModelStructureVersion,
            title: nextViewTitle,
            viewVersion: (previousCurrentView.viewVersion ?? screenEntry.viewVersion ?? 0) + 1,
          }
        : screenEntry
    ),
    version: hasUnsavedModelChanges
      ? ((savedModelDraft.version ?? previousModelStructureVersion) + 1)
      : (currentModel.version ?? savedModelDraft.version ?? previousModelStructureVersion),
  });
  const documentForSave = shouldSyncFieldNodeTitlesWithModel
    ? syncFieldNodeTitlesWithModel(document, nextModel)
    : document;
  const nextView = findFormsPlaceholderScreenById(nextModel.screens, currentView.id) ?? currentView;
  const nextDataSchema = isDefaultView
    ? buildCanonicalDataSchema({
      ...nextModel,
      schemaScopes: currentModelSchemaScopes,
    }, documentForSave)
    : savedDataSchema;
  const nextLayoutBlueprint = isDefaultView ? currentLayoutBlueprint : savedLayoutBlueprintDraft;
  const nextUiSchema = buildCanonicalUiSchema(documentForSave, nextModel);
  const expectedVersions = {
    model: savedModelDraft.version ?? previousModelStructureVersion,
    view: previousCurrentView.viewVersion ?? currentView.viewVersion ?? 1,
  };

  async function recoverUnauthorizedAccessToken() {
    const recovered = await checkAuth();
    if (!recovered) {
      return null;
    }

    return getAccessToken();
  }

  try {
    const response = await requestWithUnauthorizedRetry(
      (bearerToken) => draftClient.saveDraft(
        bearerToken,
        nextModel.id,
        currentView.id,
        {
          draft: {
            model: {
              ...(nextModel as unknown as Record<string, unknown>),
              dataSchema: nextDataSchema,
              layoutBlueprint: nextLayoutBlueprint,
            },
            view: {
              ...(nextView as unknown as Record<string, unknown>),
              description: nextViewDescription,
              kind: nextView.kind,
              title: nextViewTitle,
              uiSchema: nextUiSchema,
            },
          },
          expectedVersions,
        },
      ),
      {
        accessToken,
        onUnauthorized: recoverUnauthorizedAccessToken,
      },
    );

    const savedModel = normalizeFormsPlaceholderModel(response.draft.model, nextModel);
    const hydratedSavedView = normalizeFormsPlaceholderView(
      response.draft.view,
      findFormsPlaceholderScreenById(savedModel.screens, currentView.id) ?? nextView,
      savedModel,
    );
    const savedModelWithView = replaceModelViewById(savedModel, hydratedSavedView);
    const savedLayoutBlueprint = isRecord(response.draft.model.layoutBlueprint)
      ? response.draft.model.layoutBlueprint
      : nextLayoutBlueprint;
    const savedDocument = reconcileFormBuilderDocumentWithModel(
      buildWorkspaceDocumentFromCanonicalSchemas(
        response.draft.model,
        response.draft.view,
        savedModelWithView,
        hydratedSavedView,
      ),
      savedModelWithView,
      savedLayoutBlueprint,
    );

    return {
      savedDocument: shouldSyncFieldNodeTitlesWithModel
        ? syncFieldNodeTitlesWithModel(savedDocument, savedModelWithView)
        : savedDocument,
      savedLayoutBlueprint,
      savedModel: savedModelWithView,
    };
  } catch (error) {
    if (isDraftEndpointUnavailable(error)) {
      return {
        savedDocument: documentForSave,
        savedLayoutBlueprint: nextLayoutBlueprint,
        savedModel: nextModel,
      };
    }

    throw error;
  }
}
