import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  isUnauthorizedApiError,
  requestWithUnauthorizedRetry,
} from "@platform/api-client";

import {
  type FormBuilderDraftLoadClient,
} from "./form-builder-draft-api";
import {
  buildLookupSourceModelFromDraft,
  buildLookupSourceModelFromPlaceholderModel,
  type LookupSourceModelOption,
} from "./form-builder-workspace-lookup-options";
import {
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";

type UseFormBuilderLookupSourceModelsInput = {
  checkAuth: () => Promise<boolean>;
  currentModelId: string;
  draftClient: FormBuilderDraftLoadClient;
  ensureModel: (modelId: string) => Promise<FormsPlaceholderModel | null>;
  getAccessToken: () => string | null;
  models: ReadonlyArray<FormsPlaceholderModel>;
  prefetchModelId: string | null | undefined;
  signOut: () => Promise<void> | void;
};

export function useFormBuilderLookupSourceModels({
  checkAuth,
  currentModelId,
  draftClient,
  ensureModel,
  getAccessToken,
  models,
  prefetchModelId,
  signOut,
}: UseFormBuilderLookupSourceModelsInput) {
  const [lookupSourceModelsById, setLookupSourceModelsById] = useState<Record<string, LookupSourceModelOption>>({});
  const availableLookupSourceModels = useMemo(
    () => models
      .filter((entry) => entry.id !== currentModelId)
      .map((entry) => lookupSourceModelsById[entry.id] ?? buildLookupSourceModelFromPlaceholderModel(entry)),
    [currentModelId, lookupSourceModelsById, models],
  );

  const loadLookupSourceModel = useCallback(async (modelId: string) => {
    const trimmedModelId = modelId.trim();
    if (!trimmedModelId) {
      return null;
    }

    const cachedModel = lookupSourceModelsById[trimmedModelId];
    if (cachedModel) {
      return cachedModel;
    }

    const sourceModel = await ensureModel(trimmedModelId);
    if (!sourceModel) {
      return null;
    }

    const fallbackSourceModel = buildLookupSourceModelFromPlaceholderModel(sourceModel);
    const defaultView = sourceModel.screens.find((entry) => entry.isDefault) ?? sourceModel.screens[0] ?? null;
    if (!defaultView) {
      setLookupSourceModelsById((currentValue) => ({
        ...currentValue,
        [trimmedModelId]: currentValue[trimmedModelId] ?? fallbackSourceModel,
      }));
      return fallbackSourceModel;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setLookupSourceModelsById((currentValue) => ({
        ...currentValue,
        [trimmedModelId]: currentValue[trimmedModelId] ?? fallbackSourceModel,
      }));
      return fallbackSourceModel;
    }

    async function recoverUnauthorizedAccessToken() {
      const recovered = await checkAuth();
      if (!recovered) {
        return null;
      }

      return getAccessToken();
    }

    try {
      const response = await requestWithUnauthorizedRetry(
        (bearerToken) => draftClient.loadDraft(bearerToken, sourceModel.id, defaultView.id),
        {
          accessToken,
          onUnauthorized: recoverUnauthorizedAccessToken,
        },
      );
      const nextSourceModel = buildLookupSourceModelFromDraft(sourceModel, response.draft.model);

      setLookupSourceModelsById((currentValue) => ({
        ...currentValue,
        [trimmedModelId]: currentValue[trimmedModelId] ?? nextSourceModel,
      }));

      return nextSourceModel;
    } catch (error) {
      setLookupSourceModelsById((currentValue) => ({
        ...currentValue,
        [trimmedModelId]: currentValue[trimmedModelId] ?? fallbackSourceModel,
      }));

      if (isUnauthorizedApiError(error)) {
        await signOut();
      }

      throw error;
    }
  }, [
    checkAuth,
    draftClient,
    ensureModel,
    getAccessToken,
    lookupSourceModelsById,
    signOut,
  ]);

  useEffect(() => {
    const sourceModelId = prefetchModelId?.trim() ?? "";
    if (!sourceModelId || lookupSourceModelsById[sourceModelId]) {
      return;
    }

    void loadLookupSourceModel(sourceModelId).catch(() => {});
  }, [
    loadLookupSourceModel,
    lookupSourceModelsById,
    prefetchModelId,
  ]);

  return {
    availableLookupSourceModels,
    loadLookupSourceModel,
    lookupSourceModelsById,
  } as const;
}
