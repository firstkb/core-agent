import type {
  FormsPlaceholderModel,
  FormsPlaceholderView,
} from "./forms-placeholder-data";

function normalizeRouteId(value: string | undefined, fallback: string) {
  const trimmedValue = value?.trim();
  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : fallback;
}

export function getFormsPlaceholderModelRouteId(model: Pick<FormsPlaceholderModel, "id">) {
  return normalizeRouteId(model.id, "");
}

export function getFormsPlaceholderViewRouteId(view: Pick<FormsPlaceholderView, "id">) {
  return normalizeRouteId(view.id, "");
}

export function getPreferredFormsPlaceholderViewRouteId(
  model: Pick<FormsPlaceholderModel, "screens">,
  selectedViewId: string | null,
) {
  const normalizedSelectedViewId = selectedViewId?.trim() ?? "";
  const nextView =
    (normalizedSelectedViewId.length > 0
      ? model.screens.find((screen) => screen.id === normalizedSelectedViewId)
      : null)
    ?? model.screens.find((screen) => screen.isDefault)
    ?? model.screens.find((screen) => screen.isActive)
    ?? model.screens[0]
    ?? null;

  return nextView ? getFormsPlaceholderViewRouteId(nextView) : null;
}

export function createRouteBootstrapFallbackView(viewId?: string): FormsPlaceholderView {
  const normalizedViewId = normalizeRouteId(viewId, "__route-bootstrap-view__");

  return {
    description: "",
    displayName: normalizedViewId,
    id: normalizedViewId,
    isActive: false,
    isDefault: false,
    isViewLocked: false,
    key: "__route-bootstrap-view-key__",
    kind: "form",
    lastAlignedModelStructureVersion: 1,
    title: normalizedViewId,
    viewVersion: 1,
  };
}

export function createRouteBootstrapFallbackModel(
  modelId: string | undefined,
  fallbackView: FormsPlaceholderView,
): FormsPlaceholderModel {
  const normalizedModelId = normalizeRouteId(modelId, "__route-bootstrap-model__");

  return {
    canEditViewsOnly: false,
    description: "",
    displayName: normalizedModelId,
    fields: [],
    id: normalizedModelId,
    isStructureLocked: false,
    key: "__route-bootstrap-model-key__",
    modelStructureVersion: 1,
    owner: "",
    screens: [fallbackView],
    title: normalizedModelId,
    version: 1,
  };
}

export function isDefaultFormsPlaceholderView(view: Pick<FormsPlaceholderView, "isDefault">) {
  return view.isDefault;
}
