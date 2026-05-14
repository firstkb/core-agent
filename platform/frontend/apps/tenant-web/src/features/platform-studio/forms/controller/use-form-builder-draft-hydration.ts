import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  isUnauthorizedApiError,
  requestWithUnauthorizedRetry,
} from "@platform/api-client";

import {
  isDraftEndpointUnavailable,
  type FormBuilderDraftLoadClient,
} from "./form-builder-draft-api";
import { buildWorkspaceDocumentFromCanonicalSchemas } from "./form-builder-workspace-document-hydration";
import { pruneLeakedChecklistRootFields } from "./form-builder-workspace-checklist-orphans";
import {
  createEmptyLayoutBlueprint,
  deriveModelSchemaScopes,
  isRecord,
  replaceModelViewById,
} from "./form-builder-workspace-schema-utils";
import { syncFieldNodeTitlesWithModel } from "./form-builder-workspace-normalization-helpers";
import {
  findFormsPlaceholderScreenById,
  normalizeFormsPlaceholderModel,
  normalizeFormsPlaceholderView,
  cloneFormsPlaceholderModel,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";
import {
  reconcileFormBuilderDocumentWithModel,
  type FormBuilderDocument,
} from "../forms-builder-state";

export type HydratedFormBuilderDraft = {
  baselineDocument: FormBuilderDocument;
  baselineModel: FormsPlaceholderModel;
  layoutBlueprint: Record<string, unknown>;
  savedDocument: FormBuilderDocument;
};

export function resolveHydratedDraftDocuments(
  serverDocument: FormBuilderDocument,
  reconciledDocument: FormBuilderDocument,
) {
  const hasReconciledChanges = JSON.stringify(reconciledDocument) !== JSON.stringify(serverDocument);

  return {
    baselineDocument: hasReconciledChanges ? reconciledDocument : serverDocument,
    hasReconciledChanges,
    savedDocument: serverDocument,
  };
}

type UseFormBuilderDraftHydrationInput = {
  checkAuth: () => Promise<boolean>;
  draftClient: FormBuilderDraftLoadClient;
  draftLoadErrorMessage: string;
  getAccessToken: () => string | null;
  hasResolvedWorkspace: boolean;
  onHydratedDraft: (draft: HydratedFormBuilderDraft) => void;
  resolvedModel: FormsPlaceholderModel;
  resolvedView: FormsPlaceholderView;
  routeDraftSignature: string | null;
  shouldSyncFieldNodeTitlesWithModel: boolean;
  signOut: () => Promise<void> | void;
};

export function useFormBuilderDraftHydration({
  checkAuth,
  draftClient,
  draftLoadErrorMessage,
  getAccessToken,
  hasResolvedWorkspace,
  onHydratedDraft,
  resolvedModel,
  resolvedView,
  routeDraftSignature,
  shouldSyncFieldNodeTitlesWithModel,
  signOut,
}: UseFormBuilderDraftHydrationInput) {
  const [draftSyncError, setDraftSyncError] = useState<string | null>(null);
  const [isDraftSyncing, setIsDraftSyncing] = useState(false);
  const [hydratedDraftSignature, setHydratedDraftSignature] = useState<string | null>(null);
  const onHydratedDraftRef = useRef(onHydratedDraft);
  const hasHydratedCurrentDraft = routeDraftSignature !== null && hydratedDraftSignature === routeDraftSignature;

  useEffect(() => {
    onHydratedDraftRef.current = onHydratedDraft;
  }, [onHydratedDraft]);

  useEffect(() => {
    if (!hasResolvedWorkspace || !routeDraftSignature) {
      return;
    }

    if (hydratedDraftSignature === routeDraftSignature) {
      return;
    }
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    let isActive = true;
    setIsDraftSyncing(true);
    setDraftSyncError(null);
    setHydratedDraftSignature((current) => (current === routeDraftSignature ? current : null));

    async function recoverUnauthorizedAccessToken() {
      const recovered = await checkAuth();
      if (!recovered) {
        return null;
      }

      return getAccessToken();
    }

    void requestWithUnauthorizedRetry(
      (bearerToken) => draftClient.loadDraft(bearerToken, resolvedModel.id, resolvedView.id),
      {
        accessToken,
        onUnauthorized: recoverUnauthorizedAccessToken,
      },
    )
      .then((response) => {
        if (!isActive) {
          return;
        }

        const loadedModel = normalizeFormsPlaceholderModel(response.draft.model, resolvedModel);
        const hydratedView = normalizeFormsPlaceholderView(
          response.draft.view,
          findFormsPlaceholderScreenById(loadedModel.screens, resolvedView.id) ?? resolvedView,
          loadedModel,
        );
        const modelWithView = replaceModelViewById(loadedModel, hydratedView);
        const nextLayoutBlueprint = isRecord(response.draft.model.layoutBlueprint)
          ? response.draft.model.layoutBlueprint
          : createEmptyLayoutBlueprint(modelWithView);
        const nextModel = pruneLeakedChecklistRootFields(
          modelWithView,
          nextLayoutBlueprint,
        );
        const nextView = findFormsPlaceholderScreenById(nextModel.screens, resolvedView.id) ?? hydratedView;
        const nextDocument = buildWorkspaceDocumentFromCanonicalSchemas(
          response.draft.model,
          response.draft.view,
          nextModel,
          nextView,
        );
        const nextCanonicalDocument = shouldSyncFieldNodeTitlesWithModel
          ? syncFieldNodeTitlesWithModel(nextDocument, nextModel)
          : nextDocument;
        const alignedStructureVersions = [
          resolvedView.lastAlignedModelStructureVersion,
          hydratedView.lastAlignedModelStructureVersion,
          nextView.lastAlignedModelStructureVersion,
        ].filter((value): value is number => typeof value === "number");
        const lastKnownAlignedStructureVersion = alignedStructureVersions.length > 0
          ? Math.min(...alignedStructureVersions)
          : (nextModel.modelStructureVersion ?? 1);
        const shouldEnforceCanonicalFieldPlacements =
          (nextModel.modelStructureVersion ?? 1) > lastKnownAlignedStructureVersion;
        const nextModelWithScopes = cloneFormsPlaceholderModel({
          ...nextModel,
          schemaScopes: deriveModelSchemaScopes(nextModel, nextCanonicalDocument),
        });
        const reconciledDocument = reconcileFormBuilderDocumentWithModel(
          nextCanonicalDocument,
          nextModelWithScopes,
          nextLayoutBlueprint,
          {
            enforceCanonicalFieldPlacements: shouldEnforceCanonicalFieldPlacements,
          },
        );
        const {
          baselineDocument,
          savedDocument,
        } = resolveHydratedDraftDocuments(nextCanonicalDocument, reconciledDocument);
        const baselineModel = cloneFormsPlaceholderModel({
          ...nextModelWithScopes,
          schemaScopes: deriveModelSchemaScopes(nextModelWithScopes, baselineDocument),
        });

        setHydratedDraftSignature(routeDraftSignature);
        onHydratedDraftRef.current({
          baselineDocument,
          baselineModel,
          layoutBlueprint: nextLayoutBlueprint,
          savedDocument,
        });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedApiError(error)) {
          void signOut();
          return;
        }

        if (isDraftEndpointUnavailable(error)) {
          setHydratedDraftSignature(routeDraftSignature);
          return;
        }
        setDraftSyncError(
          error instanceof Error
            ? error.message
            : draftLoadErrorMessage,
        );
      })
      .finally(() => {
        if (isActive) {
          setIsDraftSyncing(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    checkAuth,
    draftClient,
    draftLoadErrorMessage,
    getAccessToken,
    hasResolvedWorkspace,
    hydratedDraftSignature,
    resolvedModel,
    resolvedView,
    routeDraftSignature,
    shouldSyncFieldNodeTitlesWithModel,
    signOut,
  ]);

  return {
    draftSyncError,
    hasHydratedCurrentDraft,
    isDraftSyncing,
    setDraftSyncError,
  } as const;
}
