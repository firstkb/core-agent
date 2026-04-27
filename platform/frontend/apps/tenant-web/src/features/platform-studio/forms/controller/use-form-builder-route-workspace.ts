import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { ApiClientError } from "@platform/api-client";

import {
  createRouteBootstrapFallbackModel,
  createRouteBootstrapFallbackView,
} from "../forms-route-helpers";
import {
  findFormsPlaceholderScreenById,
  getFormsPlaceholderModel,
  getFormsPlaceholderView,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";

type UseFormBuilderRouteWorkspaceInput = {
  ensureModel: (modelId: string) => Promise<FormsPlaceholderModel | null>;
  modelId?: string;
  models: ReadonlyArray<FormsPlaceholderModel>;
  viewId?: string;
  workspaceBootstrapErrorMessage: string;
};

export function useFormBuilderRouteWorkspace({
  ensureModel,
  modelId,
  models,
  viewId,
  workspaceBootstrapErrorMessage,
}: UseFormBuilderRouteWorkspaceInput) {
  const model = getFormsPlaceholderModel(modelId, models);
  const view = getFormsPlaceholderView(modelId, viewId, models);
  const fallbackView = useMemo(
    () => createRouteBootstrapFallbackView(viewId),
    [viewId],
  );
  const fallbackModel = useMemo(
    () => createRouteBootstrapFallbackModel(modelId, fallbackView),
    [fallbackView, modelId],
  );
  const hasResolvedWorkspace = Boolean(model && view);
  const resolvedModel = model ?? fallbackModel;
  const resolvedView = view
    ?? findFormsPlaceholderScreenById(resolvedModel.screens, fallbackView.id)
    ?? fallbackView;
  const routeDraftSignature = hasResolvedWorkspace ? `${resolvedModel.id}:${resolvedView.id}` : null;
  const [routeBootstrapError, setRouteBootstrapError] = useState<string | null>(null);
  const [isBootstrappingRoute, setIsBootstrappingRoute] = useState(Boolean(modelId && viewId));

  useEffect(() => {
    if (!modelId || !viewId) {
      setIsBootstrappingRoute(false);
      setRouteBootstrapError(null);
      return;
    }

    if (model && view) {
      setIsBootstrappingRoute(false);
      setRouteBootstrapError(null);
      return;
    }

    let isActive = true;
    setIsBootstrappingRoute(true);
    setRouteBootstrapError(null);

    void ensureModel(modelId)
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.statusCode === 404) {
          setRouteBootstrapError(null);
          return;
        }

        setRouteBootstrapError(
          error instanceof Error
            ? error.message
            : workspaceBootstrapErrorMessage,
        );
      })
      .finally(() => {
        if (isActive) {
          setIsBootstrappingRoute(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [ensureModel, model, modelId, view, viewId, workspaceBootstrapErrorMessage]);

  return {
    hasResolvedWorkspace,
    isBootstrappingRoute,
    resolvedModel,
    resolvedView,
    routeBootstrapError,
    routeDraftSignature,
  } as const;
}
