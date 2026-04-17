import {
  matchPath,
  type PathMatch,
} from "react-router-dom";

import {
  getCachedFormsPlaceholderModels,
  getFormsPlaceholderModel,
  getFormsPlaceholderView,
} from "../platform-studio/forms/forms-placeholder-data";

type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

const formRuntimeRoutePatterns = {
  create: "/app/forms/:modelId/views/:viewId/new",
  edit: "/app/forms/:modelId/views/:viewId/edit/:docGuid",
  list: "/app/forms/:modelId/views/:viewId",
  view: "/app/forms/:modelId/views/:viewId/view/:docGuid",
} as const;

export const formRuntimePaths = {
  create(modelId: string, viewId: string) {
    return `${formRuntimePaths.list(modelId, viewId)}/new`;
  },
  edit(modelId: string, viewId: string, docGuid: string) {
    return `${formRuntimePaths.list(modelId, viewId)}/edit/${encodeURIComponent(docGuid)}`;
  },
  list(modelId: string, viewId: string) {
    return `/app/forms/${encodeURIComponent(modelId)}/views/${encodeURIComponent(viewId)}`;
  },
  view(modelId: string, viewId: string, docGuid: string) {
    return `${formRuntimePaths.list(modelId, viewId)}/view/${encodeURIComponent(docGuid)}`;
  },
} as const;

type FormRuntimeRouteMeta = {
  kind: "create" | "edit" | "list" | "view";
  modelId: string;
  modelLabel: string;
  viewId: string;
  viewLabel: string;
};

function readFormRuntimeRouteLabels(modelId: string, viewId: string) {
  const cachedModels = getCachedFormsPlaceholderModels();
  const model = getFormsPlaceholderModel(modelId, cachedModels);
  const view = getFormsPlaceholderView(modelId, viewId, cachedModels);

  return {
    modelLabel: model?.title ?? "",
    viewLabel: view?.title ?? "",
  };
}

function buildFormRuntimeRouteMeta(
  kind: FormRuntimeRouteMeta["kind"],
  match: PathMatch<"docGuid" | "modelId" | "viewId">,
): FormRuntimeRouteMeta {
  const modelId = match.params.modelId ?? "";
  const viewId = match.params.viewId ?? "";
  const labels = readFormRuntimeRouteLabels(modelId, viewId);

  return {
    kind,
    modelId,
    modelLabel: labels.modelLabel,
    viewId,
    viewLabel: labels.viewLabel,
  };
}

export function getFormRuntimeRouteMeta(pathname: string): FormRuntimeRouteMeta | null {
  const createMatch = matchPath(formRuntimeRoutePatterns.create, pathname) as PathMatch<"modelId" | "viewId"> | null;
  if (createMatch) {
    return buildFormRuntimeRouteMeta("create", createMatch as PathMatch<"docGuid" | "modelId" | "viewId">);
  }

  const editMatch = matchPath(formRuntimeRoutePatterns.edit, pathname) as PathMatch<"docGuid" | "modelId" | "viewId"> | null;
  if (editMatch) {
    return buildFormRuntimeRouteMeta("edit", editMatch);
  }

  const viewMatch = matchPath(formRuntimeRoutePatterns.view, pathname) as PathMatch<"docGuid" | "modelId" | "viewId"> | null;
  if (viewMatch) {
    return buildFormRuntimeRouteMeta("view", viewMatch);
  }

  const listMatch = matchPath(formRuntimeRoutePatterns.list, pathname) as PathMatch<"modelId" | "viewId"> | null;
  if (listMatch) {
    return buildFormRuntimeRouteMeta("list", listMatch as PathMatch<"docGuid" | "modelId" | "viewId">);
  }

  return null;
}

export function isFormRuntimePath(pathname: string) {
  return getFormRuntimeRouteMeta(pathname) !== null;
}

export function getFormRuntimeHeaderTitle(translate: TranslateFunction, pathname: string) {
  const routeMeta = getFormRuntimeRouteMeta(pathname);
  if (!routeMeta) {
    return null;
  }

  return routeMeta.viewLabel || translate("tenant.navigation.runtime.forms.headerTitle");
}

export function getFormRuntimeHeaderMeta(translate: TranslateFunction, pathname: string) {
  const routeMeta = getFormRuntimeRouteMeta(pathname);
  if (!routeMeta) {
    return null;
  }

  if (!routeMeta.modelLabel || !routeMeta.viewLabel) {
    return translate("tenant.navigation.runtime.forms.headerMeta");
  }

  return translate("tenant.navigation.runtime.forms.viewHeaderMeta", {
    modelLabel: routeMeta.modelLabel,
    viewLabel: routeMeta.viewLabel,
  });
}
