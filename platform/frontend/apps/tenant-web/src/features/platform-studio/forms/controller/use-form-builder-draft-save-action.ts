import {
  useCallback,
  useRef,
} from "react";

import {
  isUnauthorizedApiError,
} from "@platform/api-client";

import {
  type FormBuilderDraftSaveClient,
} from "./form-builder-draft-api";
import {
  saveFormBuilderDraft,
  type SavedFormBuilderDraft,
} from "./form-builder-draft-save";
import {
  type FormBuilderDocument,
} from "../forms-builder-state";
import {
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";

type UseFormBuilderDraftSaveActionInput = {
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
  onSavedDraft: (draft: SavedFormBuilderDraft) => void;
  saveErrorMessage: string;
  savedDataSchema: Record<string, unknown>;
  savedLayoutBlueprintDraft: Record<string, unknown>;
  savedModelDraft: FormsPlaceholderModel;
  setDraftSyncError: (error: string | null) => void;
  setIsSavingDraft: (isSavingDraft: boolean) => void;
  shouldSyncFieldNodeTitlesWithModel: boolean;
  signOut: () => Promise<void> | void;
};

export function useFormBuilderDraftSaveAction({
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
  onSavedDraft,
  saveErrorMessage,
  savedDataSchema,
  savedLayoutBlueprintDraft,
  savedModelDraft,
  setDraftSyncError,
  setIsSavingDraft,
  shouldSyncFieldNodeTitlesWithModel,
  signOut,
}: UseFormBuilderDraftSaveActionInput) {
  const inFlightSaveRef = useRef<Promise<void> | null>(null);
  const handleSave = useCallback(async () => {
    if (inFlightSaveRef.current) {
      return inFlightSaveRef.current;
    }

    const saveTask = (async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setDraftSyncError(saveErrorMessage);
        return;
      }

      setIsSavingDraft(true);
      setDraftSyncError(null);

      try {
        const savedDraft = await saveFormBuilderDraft({
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
        });
        onSavedDraft(savedDraft);
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          void signOut();
          return;
        }

        setDraftSyncError(error instanceof Error ? error.message : saveErrorMessage);
      } finally {
        setIsSavingDraft(false);
      }
    })();

    inFlightSaveRef.current = saveTask;
    try {
      await saveTask;
    } finally {
      if (inFlightSaveRef.current === saveTask) {
        inFlightSaveRef.current = null;
      }
    }
  }, [
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
    onSavedDraft,
    saveErrorMessage,
    savedDataSchema,
    savedLayoutBlueprintDraft,
    savedModelDraft,
    setDraftSyncError,
    setIsSavingDraft,
    shouldSyncFieldNodeTitlesWithModel,
    signOut,
  ]);

  return {
    handleSave,
  } as const;
}
