import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ReactNode } from "react";

import {
  ApiClientError,
  createTenantFormBuilderAuthoringClient,
  isUnauthorizedApiError,
  requestWithUnauthorizedRetry,
  type FormBuilderCopyViewInput,
  type FormBuilderCreateModelInput,
  type FormBuilderCreateViewInput,
  type FormBuilderModelDetail,
  type FormBuilderModelFieldSummary,
  type FormBuilderModelSummary,
  type FormBuilderViewSummary,
} from "@platform/api-client";
import { useAuth } from "@platform/auth-core";

import { useTenantRuntimeConfig } from "../../../app/tenant-runtime-config-context";
import {
  cloneFormsPlaceholderModel,
  cloneFormsPlaceholderView,
  clearFormsPlaceholderModelsCache,
  getFormsPlaceholderModel,
  sortFormsPlaceholderModels,
  sortFormsPlaceholderViews,
  storeFormsPlaceholderModels,
  type FormsPlaceholderField,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "./forms-placeholder-data";

type FormBuilderModelMutationResult = {
  model: FormsPlaceholderModel;
  selectedViewId: string | null;
};

type FormBuilderAuthoringContextValue = {
  copyView: (
    modelId: string,
    viewId: string,
    input?: FormBuilderCopyViewInput,
  ) => Promise<FormBuilderModelMutationResult>;
  createModel: (input: FormBuilderCreateModelInput) => Promise<FormBuilderModelMutationResult>;
  createView: (modelId: string, input: FormBuilderCreateViewInput) => Promise<FormBuilderModelMutationResult>;
  deleteView: (modelId: string, viewId: string) => Promise<FormBuilderModelMutationResult>;
  ensureModel: (modelId: string) => Promise<FormsPlaceholderModel | null>;
  isLoadingModels: boolean;
  models: ReadonlyArray<FormsPlaceholderModel>;
  modelsError: string | null;
  refreshModels: () => Promise<void>;
  replaceModel: (model: FormsPlaceholderModel) => void;
};

const FormBuilderAuthoringContext = createContext<FormBuilderAuthoringContextValue | null>(null);

function normalizeFieldStatus(status: string | undefined, fallback: FormsPlaceholderField["status"]) {
  switch (status) {
    case "draft":
    case "persisted":
    case "published":
      return status;
    default:
      return fallback;
  }
}

function normalizeViewKind(kind: string): FormsPlaceholderView["kind"] {
  return kind === "detail" ? "detail" : "form";
}

function mergeFieldSummaries(
  existingFields: ReadonlyArray<FormsPlaceholderField>,
  fieldSummaries: ReadonlyArray<FormBuilderModelFieldSummary>,
) {
  if (existingFields.length === 0 || fieldSummaries.length === 0) {
    return existingFields;
  }

  return existingFields.map((field) => {
    const summary = fieldSummaries.find((entry) => entry.id === field.id || entry.key === field.id || entry.key === field.storageKey);
    if (!summary) {
      return field;
    }

    return {
      ...field,
      displayName: summary.displayName,
      isLocked: summary.isLocked,
      isPersisted: summary.isPersisted,
      label: summary.label,
      status: normalizeFieldStatus(summary.status, field.status),
      storageKey: summary.storageKey ?? field.storageKey,
    };
  });
}

function mapViewSummaryToPlaceholder(
  summary: FormBuilderViewSummary,
  model: Pick<FormsPlaceholderModel, "modelStructureVersion">,
): FormsPlaceholderView {
  return cloneFormsPlaceholderView(
    {
      description: summary.description ?? "",
      displayName: summary.displayName,
      guid: summary.guid,
      id: summary.id,
      isActive: summary.isActive,
      isViewLocked: summary.isViewLocked,
      key: summary.key,
      kind: normalizeViewKind(summary.kind),
      lastAlignedModelStructureVersion: summary.lastAlignedModelStructureVersion,
      title: summary.title,
      viewVersion: summary.version,
    },
    model,
  );
}

function mapModelSummaryToPlaceholder(
  summary: FormBuilderModelSummary,
  existing?: FormsPlaceholderModel | null,
): FormsPlaceholderModel {
  return cloneFormsPlaceholderModel({
    canEditViewsOnly: summary.canEditViewsOnly,
    description: summary.description ?? existing?.description ?? "",
    displayName: summary.displayName,
    fields: existing?.fields ?? [],
    guid: summary.guid ?? existing?.guid,
    id: summary.id,
    isStructureLocked: summary.isStructureLocked,
    key: summary.key,
    modelStructureVersion: summary.modelStructureVersion,
    owner: existing?.owner ?? "",
    schemaScopes: existing?.schemaScopes,
    screens: existing?.screens ?? [],
    title: summary.title,
    version: summary.version,
  });
}

function mapModelDetailToPlaceholder(
  detail: FormBuilderModelDetail,
  existing?: FormsPlaceholderModel | null,
): FormsPlaceholderModel {
  const summaryModel = mapModelSummaryToPlaceholder(detail, existing);
  const mergedFields = mergeFieldSummaries(existing?.fields ?? [], detail.fields);

  return cloneFormsPlaceholderModel({
    ...summaryModel,
    fields: mergedFields,
    screens: sortFormsPlaceholderViews(
      detail.views.map((view) => mapViewSummaryToPlaceholder(view, summaryModel)),
    ),
  });
}

function upsertModel(
  currentModels: ReadonlyArray<FormsPlaceholderModel>,
  nextModel: FormsPlaceholderModel,
) {
  const existing = getFormsPlaceholderModel(nextModel.id, currentModels);
  if (!existing) {
    return sortFormsPlaceholderModels([...currentModels, nextModel]);
  }

  return sortFormsPlaceholderModels(
    currentModels.map((model) => (model.id === existing.id ? nextModel : model)),
  );
}

function removeModel(
  currentModels: ReadonlyArray<FormsPlaceholderModel>,
  modelId: string,
) {
  const existing = getFormsPlaceholderModel(modelId, currentModels);
  if (!existing) {
    return sortFormsPlaceholderModels(currentModels);
  }

  return sortFormsPlaceholderModels(
    currentModels.filter((model) => model.id !== existing.id),
  );
}

export function FormBuilderAuthoringProvider({
  children,
}: {
  children: ReactNode;
}) {
  const runtimeConfig = useTenantRuntimeConfig();
  const authoringClient = useMemo(
    () => createTenantFormBuilderAuthoringClient(runtimeConfig.tenantApiUrl),
    [runtimeConfig.tenantApiUrl],
  );
  const {
    checkAuth,
    getAccessToken,
    signOut,
  } = useAuth();
  const [models, setModels] = useState<FormsPlaceholderModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const modelsRef = useRef<FormsPlaceholderModel[]>([]);

  const commitModels = useCallback((nextModels: ReadonlyArray<FormsPlaceholderModel>) => {
    const sortedModels = sortFormsPlaceholderModels(nextModels);
    modelsRef.current = sortedModels;
    setModels(sortedModels);

    if (sortedModels.length === 0) {
      clearFormsPlaceholderModelsCache();
      return;
    }

    storeFormsPlaceholderModels(sortedModels);
  }, []);

  const requestWithSession = useCallback(async <T,>(request: (accessToken: string) => Promise<T>) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      await signOut();
      throw new ApiClientError("Request failed with status 401.", {
        statusCode: 401,
      });
    }

    async function recoverUnauthorizedAccessToken() {
      const recovered = await checkAuth();
      if (!recovered) {
        return null;
      }

      return getAccessToken();
    }

    try {
      return await requestWithUnauthorizedRetry(request, {
        accessToken,
        onUnauthorized: recoverUnauthorizedAccessToken,
      });
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        await signOut();
      }

      throw error;
    }
  }, [checkAuth, getAccessToken, signOut]);

  const replaceModel = useCallback((nextModel: FormsPlaceholderModel) => {
    commitModels(
      upsertModel(modelsRef.current, cloneFormsPlaceholderModel(nextModel)),
    );
  }, [commitModels]);

  const refreshModels = useCallback(async () => {
    setIsLoadingModels(true);
    setModelsError(null);

    try {
      const nextModels = await requestWithSession((accessToken) => authoringClient.listModels(accessToken));
      commitModels(
        nextModels.map((summary) => mapModelSummaryToPlaceholder(summary, getFormsPlaceholderModel(summary.id, modelsRef.current))),
      );
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : "Unable to load models.");
      throw error;
    } finally {
      setIsLoadingModels(false);
    }
  }, [authoringClient, commitModels, requestWithSession]);

  const ensureModel = useCallback(async (modelId: string) => {
    const trimmedModelId = modelId.trim();
    if (!trimmedModelId) {
      return null;
    }

    try {
      const detail = await requestWithSession((accessToken) => authoringClient.getModel(accessToken, trimmedModelId));
      const nextModel = mapModelDetailToPlaceholder(detail, getFormsPlaceholderModel(trimmedModelId, modelsRef.current));

      commitModels(
        upsertModel(modelsRef.current, nextModel),
      );

      return nextModel;
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        commitModels(removeModel(modelsRef.current, trimmedModelId));
      }

      throw error;
    }
  }, [authoringClient, commitModels, requestWithSession]);

  const commitMutation = useCallback(async (
    request: (accessToken: string) => Promise<FormBuilderModelDetail>,
  ): Promise<FormBuilderModelMutationResult> => {
    const detail = await requestWithSession(request);
    const nextModel = mapModelDetailToPlaceholder(detail, getFormsPlaceholderModel(detail.id, modelsRef.current));

    commitModels(
      upsertModel(modelsRef.current, nextModel),
    );

    return {
      model: nextModel,
      selectedViewId: detail.selectedViewId ?? null,
    };
  }, [commitModels, requestWithSession]);

  const createModel = useCallback(async (input: FormBuilderCreateModelInput) => {
    return commitMutation((accessToken) => authoringClient.createModel(accessToken, input));
  }, [authoringClient, commitMutation]);

  const createView = useCallback(async (modelId: string, input: FormBuilderCreateViewInput) => {
    return commitMutation((accessToken) => authoringClient.createView(accessToken, modelId, input));
  }, [authoringClient, commitMutation]);

  const copyView = useCallback(async (modelId: string, viewId: string, input?: FormBuilderCopyViewInput) => {
    return commitMutation((accessToken) => authoringClient.copyView(accessToken, modelId, viewId, input));
  }, [authoringClient, commitMutation]);

  const deleteView = useCallback(async (modelId: string, viewId: string) => {
    return commitMutation((accessToken) => authoringClient.deleteView(accessToken, modelId, viewId));
  }, [authoringClient, commitMutation]);

  useEffect(() => {
    void refreshModels().catch(() => {});
  }, [refreshModels]);

  return (
    <FormBuilderAuthoringContext.Provider
      value={{
        copyView,
        createModel,
        createView,
        deleteView,
        ensureModel,
        isLoadingModels,
        models,
        modelsError,
        refreshModels,
        replaceModel,
      }}
    >
      {children}
    </FormBuilderAuthoringContext.Provider>
  );
}

export function useFormBuilderAuthoring() {
  const context = useContext(FormBuilderAuthoringContext);

  if (!context) {
    throw new Error("Form Builder authoring context is not available.");
  }

  return context;
}
