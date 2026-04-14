import {
  useEffect,
  useState,
} from "react";

import { ApiClientError } from "@platform/api-client";
import { useTranslation } from "@platform/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EyeIcon,
  EyeOffIcon,
  Input,
  Label,
  LockIcon,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PlusIcon,
  StarIcon,
} from "@platform/ui-kit";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getFormsAuthoringAccess,
  getFormsPlaceholderActor,
} from "../forms-actors";
import { useFormBuilderAuthoring } from "../forms-authoring-context";
import {
  getFormsPlaceholderModel,
  sortFormsPlaceholderViews,
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";
import {
  getFormsPlaceholderModelRouteId,
  getFormsPlaceholderViewRouteId,
} from "../forms-route-helpers";
import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import { platformStudioPaths } from "../../platform-studio-route-meta";
import { PlatformStudioTabs } from "../../platform-studio-tabs";

function ScreenActionsIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="5.5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="18.5" cy="12" r="1.75" />
    </svg>
  );
}

function ViewWarningIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 3.2 2.6 20.2h18.8L12 3.2Zm0 5.1c.5 0 .9.4.9.9v4.8a.9.9 0 1 1-1.8 0V9.2c0-.5.4-.9.9-.9Zm0 9.1a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />
    </svg>
  );
}

function createCopiedViewTitle(title: string, existingTitles: ReadonlyArray<string>) {
  const baseTitle = `${title} Copy`;
  if (!existingTitles.includes(baseTitle)) {
    return baseTitle;
  }

  let index = 2;
  while (existingTitles.includes(`${baseTitle} ${index}`)) {
    index += 1;
  }

  return `${baseTitle} ${index}`;
}

function getViewStatusKey(isActive: boolean) {
  return isActive
    ? "tenant.platformStudio.forms.viewActive"
    : "tenant.platformStudio.forms.viewInactive";
}

function resolveMutationSelectedViewRouteId(
  model: Pick<FormsPlaceholderModel, "screens">,
  selectedViewId: string | null,
) {
  const normalizedSelectedViewId = selectedViewId?.trim() ?? "";
  if (!normalizedSelectedViewId) {
    return null;
  }

  const selectedView = model.screens.find((screen) => screen.id === normalizedSelectedViewId);
  return selectedView ? getFormsPlaceholderViewRouteId(selectedView) : null;
}

type AuthoringDialogState =
  | {
      kind: "create-model";
      title: string;
    }
  | {
      kind: "create-view";
      modelId: string;
      title: string;
    }
  | {
      kind: "copy-view";
      modelId: string;
      title: string;
      viewId: string;
    };

type DeleteIntent = {
  kind: "view";
  modelId: string;
  title: string;
  viewId: string;
};

type DeleteModelIntent = {
  modelId: string;
  title: string;
};

export function FormsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const {
    copyView,
    createModel,
    createView,
    deleteModel,
    deleteView,
    ensureModel,
    isLoadingModels,
    models,
    modelsError,
  } = useFormBuilderAuthoring();
  const currentActor = getFormsPlaceholderActor(undefined);
  const [dialogState, setDialogState] = useState<AuthoringDialogState | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false);
  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent | null>(null);
  const [deleteModelIntent, setDeleteModelIntent] = useState<DeleteModelIntent | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingView, setIsDeletingView] = useState(false);
  const [isDeletingModel, setIsDeletingModel] = useState(false);
  const [isLoadingSelectedModel, setIsLoadingSelectedModel] = useState(false);
  const [selectedModelError, setSelectedModelError] = useState<string | null>(null);
  const selectedModel = getFormsPlaceholderModel(params.modelId, models);
  const hasModelParam = Boolean(params.modelId);
  const pageAccess = getFormsAuthoringAccess(currentActor);
  const selectedModelAccess = getFormsAuthoringAccess(currentActor, selectedModel);
  const sortedViews = selectedModel ? sortFormsPlaceholderViews(selectedModel.screens) : [];

  useEffect(() => {
    if (!params.modelId) {
      setIsLoadingSelectedModel(false);
      setSelectedModelError(null);
      return;
    }

    let isActive = true;
    setIsLoadingSelectedModel(true);
    setSelectedModelError(null);

    void ensureModel(params.modelId)
      .then((model) => {
        if (!isActive) {
          return;
        }

        if (!model) {
          navigate(platformStudioPaths.forms, { replace: true });
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.statusCode === 404) {
          navigate(platformStudioPaths.forms, { replace: true });
          return;
        }

        setSelectedModelError(
          error instanceof Error
            ? error.message
            : t("tenant.platformStudio.forms.modelDetailLoadError"),
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingSelectedModel(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [ensureModel, navigate, params.modelId, t]);

  useEffect(() => {
    if (!deleteIntent || !selectedModel) {
      return;
    }

    if (deleteIntent.modelId !== selectedModel.id) {
      setDeleteIntent(null);
      setDeleteError(null);
      return;
    }

    if (!selectedModel.screens.some((screen) => screen.id === deleteIntent.viewId)) {
      setDeleteIntent(null);
      setDeleteError(null);
    }
  }, [deleteIntent, selectedModel]);

  useEffect(() => {
    if (!deleteModelIntent || !selectedModel) {
      return;
    }

    if (deleteModelIntent.modelId !== selectedModel.id) {
      setDeleteModelIntent(null);
      setDeleteError(null);
    }
  }, [deleteModelIntent, selectedModel]);

  function openCreateModelDialog() {
    setDialogError(null);
    setDialogState({
      kind: "create-model",
      title: "",
    });
  }

  function openCreateViewDialog(model: FormsPlaceholderModel) {
    setDialogError(null);
    setDialogState({
      kind: "create-view",
      modelId: getFormsPlaceholderModelRouteId(model),
      title: "",
    });
  }

  function openCopyViewDialog(model: FormsPlaceholderModel, view: FormsPlaceholderView) {
    setDialogError(null);
    setDialogState({
      kind: "copy-view",
      modelId: getFormsPlaceholderModelRouteId(model),
      title: createCopiedViewTitle(view.title, model.screens.map((screen) => screen.title)),
      viewId: getFormsPlaceholderViewRouteId(view),
    });
  }

  function closeDialog(nextOpen: boolean) {
    if (nextOpen) {
      return;
    }

    if (isSubmittingDialog) {
      return;
    }

    setDialogState(null);
    setDialogError(null);
  }

  async function handleDialogSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!dialogState) {
      return;
    }

    const title = dialogState.title.trim();
    if (!title) {
      setDialogError(t("tenant.platformStudio.forms.titleRequired"));
      return;
    }

    setIsSubmittingDialog(true);
    setDialogError(null);

    try {
      if (dialogState.kind === "create-model") {
        const result = await createModel({ title });
        const selectedViewId = resolveMutationSelectedViewRouteId(result.model, result.selectedViewId);
        if (!selectedViewId) {
          throw new Error(t("tenant.platformStudio.forms.mutationSelectedViewMissing"));
        }

        setDialogState(null);
        navigate(platformStudioPaths.view(getFormsPlaceholderModelRouteId(result.model), selectedViewId));
        return;
      }

      if (dialogState.kind === "create-view") {
        const result = await createView(dialogState.modelId, { title });
        const selectedViewId = resolveMutationSelectedViewRouteId(result.model, result.selectedViewId);
        if (!selectedViewId) {
          throw new Error(t("tenant.platformStudio.forms.mutationSelectedViewMissing"));
        }

        setDialogState(null);
        navigate(platformStudioPaths.view(getFormsPlaceholderModelRouteId(result.model), selectedViewId));
        return;
      }

      const result = await copyView(dialogState.modelId, dialogState.viewId, { title });
      const selectedViewId = resolveMutationSelectedViewRouteId(result.model, result.selectedViewId);
      if (!selectedViewId) {
        throw new Error(t("tenant.platformStudio.forms.mutationSelectedViewMissing"));
      }

      setDialogState(null);
      navigate(platformStudioPaths.view(getFormsPlaceholderModelRouteId(result.model), selectedViewId));
    } catch (error) {
      setDialogError(
        error instanceof Error
          ? error.message
          : t("tenant.platformStudio.forms.mutationError"),
      );
    } finally {
      setIsSubmittingDialog(false);
    }
  }

  function handleDeleteViewIntent(model: FormsPlaceholderModel, view: FormsPlaceholderView) {
    if (!getFormsAuthoringAccess(currentActor, model, view).canDeleteView) {
      return;
    }

    setDeleteError(null);
    setDeleteIntent({
      kind: "view",
      modelId: getFormsPlaceholderModelRouteId(model),
      title: view.title,
      viewId: getFormsPlaceholderViewRouteId(view),
    });
  }

  function handleDeleteModelIntent(model: FormsPlaceholderModel) {
    if (!getFormsAuthoringAccess(currentActor, model).canDeleteModel) {
      return;
    }

    setDeleteError(null);
    setDeleteModelIntent({
      modelId: getFormsPlaceholderModelRouteId(model),
      title: model.title,
    });
  }

  async function handleConfirmDeleteView() {
    if (!deleteIntent) {
      return;
    }

    setIsDeletingView(true);
    setDeleteError(null);

    try {
      await deleteView(deleteIntent.modelId, deleteIntent.viewId);
      setDeleteIntent(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : t("tenant.platformStudio.forms.mutationError"),
      );
    } finally {
      setIsDeletingView(false);
    }
  }

  async function handleConfirmDeleteModel() {
    if (!deleteModelIntent) {
      return;
    }

    setIsDeletingModel(true);
    setDeleteError(null);

    try {
      await deleteModel(deleteModelIntent.modelId);
      setDeleteModelIntent(null);
      navigate(platformStudioPaths.forms, { replace: true });
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : t("tenant.platformStudio.forms.mutationError"),
      );
    } finally {
      setIsDeletingModel(false);
    }
  }

  const addModelTitle = pageAccess.canManageStructure
    ? undefined
    : t(pageAccess.structureRestrictionKey ?? "tenant.platformStudio.forms.permission.ownerOnlyStructure");
  const addViewTitle = selectedModelAccess.canEditViews
    ? undefined
    : t(selectedModelAccess.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.viewAccessDisabled");

  return (
    <div className="tenant-web__platform-studio-shell tenant-web__platform-studio-shell--desktop-panels">
      <PlatformStudioTabs />

      <section className="tenant-web__platform-studio-master-detail">
        <Card className="tenant-web__platform-studio-panel">
          <CardHeader>
            <div className="tenant-web__platform-studio-panel-header">
              <CardTitle>{t("tenant.platformStudio.forms.modelsTitle")}</CardTitle>
              <Button
                className="tenant-web__platform-studio-action-button"
                disabled={!pageAccess.canManageStructure || isSubmittingDialog}
                leadingIcon={<PlusIcon />}
                onClick={openCreateModelDialog}
                size="sm"
                title={addModelTitle}
                variant="secondary"
              >
                {t("tenant.platformStudio.forms.addModel")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="tenant-web__platform-studio-panel-content">
            <PlatformStudioPanelScroll aria-label={t("tenant.platformStudio.forms.modelsTitle")}>
              <div className="tenant-web__platform-studio-object-list">
                {modelsError ? (
                  <div className="tenant-web__platform-studio-inline-help">
                    <span>{modelsError}</span>
                  </div>
                ) : null}

                {isLoadingModels && models.length === 0 ? (
                  <div className="tenant-web__platform-studio-builder-empty">
                    <p>{t("tenant.platformStudio.forms.loadingModels")}</p>
                  </div>
                ) : null}

                {!isLoadingModels && models.length === 0 ? (
                  <div className="tenant-web__platform-studio-builder-empty">
                    <p className="tenant-web__platform-studio-empty-title">
                      {t("tenant.platformStudio.forms.emptyModelsTitle")}
                    </p>
                    <p>{t("tenant.platformStudio.forms.emptyModelsDescription")}</p>
                  </div>
                ) : null}

                {models.map((model) => {
                  const isActive = selectedModel?.id === model.id;

                  return (
                    <button
                      className={`tenant-web__platform-studio-object-item${isActive ? " tenant-web__platform-studio-object-item--active" : ""}`}
                      key={model.id}
                      onClick={() => navigate(platformStudioPaths.model(getFormsPlaceholderModelRouteId(model)))}
                      type="button"
                    >
                      <span className="tenant-web__platform-studio-object-copy">
                        <span className="tenant-web__platform-studio-object-title">{model.title}</span>
                        {model.description ? (
                          <span className="tenant-web__platform-studio-screen-description">{model.description}</span>
                        ) : null}
                      </span>
                      {model.isStructureLocked ? (
                        <Badge
                          appearance="soft"
                          aria-label={t("tenant.platformStudio.forms.structureLocked")}
                          className="tenant-web__platform-studio-lock-badge"
                          size="sm"
                          title={t("tenant.platformStudio.forms.structureLocked")}
                          variant="warning"
                        >
                          <LockIcon />
                        </Badge>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </PlatformStudioPanelScroll>
          </CardContent>
        </Card>

        <Card className="tenant-web__platform-studio-panel">
          {selectedModel ? (
            <>
              <CardHeader>
                <div className="tenant-web__platform-studio-panel-header">
                  <CardTitle>{selectedModel.title}</CardTitle>
                  <div className="tenant-web__platform-studio-panel-actions">
                    <Button
                      className="tenant-web__platform-studio-action-button"
                      disabled={!selectedModelAccess.canEditViews || isSubmittingDialog}
                      leadingIcon={<PlusIcon />}
                      onClick={() => openCreateViewDialog(selectedModel)}
                      size="sm"
                      title={addViewTitle}
                      variant="secondary"
                    >
                      {t("tenant.platformStudio.forms.addView")}
                    </Button>
                    <Menu align="end">
                      <MenuTrigger>
                        <button
                          aria-label={t("tenant.platformStudio.forms.modelActions")}
                          className="tenant-web__platform-studio-menu-trigger"
                          type="button"
                        >
                          <ScreenActionsIcon />
                        </button>
                      </MenuTrigger>
                      <MenuContent className="tenant-web__platform-studio-menu">
                        <MenuItem
                          disabled
                          title={t("tenant.platformStudio.forms.placeholderActionTitle")}
                        >
                          {t("tenant.platformStudio.forms.exportData")}
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem
                          disabled={!selectedModelAccess.canDeleteModel || isDeletingModel}
                          onClick={() => handleDeleteModelIntent(selectedModel)}
                          title={selectedModelAccess.canDeleteModel ? undefined : t(selectedModelAccess.structureRestrictionKey ?? "tenant.platformStudio.forms.permission.ownerOnlyStructure")}
                          tone="danger"
                        >
                          {t("tenant.platformStudio.forms.deleteModel")}
                        </MenuItem>
                      </MenuContent>
                    </Menu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="tenant-web__platform-studio-panel-content">
                <PlatformStudioPanelScroll>
                  <div className="tenant-web__platform-studio-screen-list">
                    <div className="tenant-web__platform-studio-badge-row tenant-web__platform-studio-content-badges">
                      {selectedModel.isStructureLocked ? (
                        <Badge appearance="soft" size="sm" variant="warning">
                          {t("tenant.platformStudio.forms.structureLocked")}
                        </Badge>
                      ) : null}
                      {selectedModel.canEditViewsOnly ? (
                        <Badge appearance="soft" size="sm" variant="info">
                          {t("tenant.platformStudio.forms.canEditViewsOnly")}
                        </Badge>
                      ) : null}
                    </div>

                    {selectedModelError ? (
                      <div className="tenant-web__platform-studio-inline-help">
                        <span>{selectedModelError}</span>
                      </div>
                    ) : null}

                    {isLoadingSelectedModel && sortedViews.length === 0 ? (
                      <div className="tenant-web__platform-studio-builder-empty">
                        <p>{t("tenant.platformStudio.forms.loadingViews")}</p>
                      </div>
                    ) : null}

                    {!isLoadingSelectedModel && sortedViews.length === 0 ? (
                      <div className="tenant-web__platform-studio-builder-empty">
                        <p className="tenant-web__platform-studio-empty-title">
                          {t("tenant.platformStudio.forms.emptyViewsTitle")}
                        </p>
                        <p>{t("tenant.platformStudio.forms.emptyViewsDescription")}</p>
                      </div>
                    ) : null}

                    {sortedViews.map((view) => {
                      const viewAccess = getFormsAuthoringAccess(currentActor, selectedModel, view);
                      const viewHasModelDrift = (selectedModel.modelStructureVersion ?? 1) > (view.lastAlignedModelStructureVersion ?? 1);

                      return (
                        <div className="tenant-web__platform-studio-screen-item" key={view.id}>
                          <div className="tenant-web__platform-studio-screen-copy">
                            <div className="tenant-web__platform-studio-screen-title-row">
                              <span className="tenant-web__platform-studio-screen-title">{view.title}</span>
                              {view.isDefault ? (
                                <Badge appearance="soft" size="sm" variant="brand">
                                  <span className="tenant-web__platform-studio-badge-label">
                                    <StarIcon
                                      aria-hidden="true"
                                      className="tenant-web__platform-studio-badge-icon"
                                    />
                                    {t("tenant.platformStudio.forms.builder.viewMode.default")}
                                  </span>
                                </Badge>
                              ) : null}
                            </div>
                            <span className="tenant-web__platform-studio-screen-description">
                              {view.description || t(`tenant.platformStudio.forms.screenKind.${view.kind}`)}
                            </span>
                          </div>
                          <div className="tenant-web__platform-studio-screen-actions">
                            {viewHasModelDrift ? (
                              <span
                                aria-label={t("tenant.platformStudio.forms.viewModelStructureChanged")}
                                className="tenant-web__platform-studio-view-status tenant-web__platform-studio-view-status--warning"
                                title={t("tenant.platformStudio.forms.viewModelStructureChanged")}
                              >
                                <ViewWarningIcon />
                              </span>
                            ) : null}
                            {view.isViewLocked ? (
                              <span
                                aria-label={t("tenant.platformStudio.forms.viewLocked")}
                                className="tenant-web__platform-studio-view-status tenant-web__platform-studio-view-status--inactive"
                                title={t("tenant.platformStudio.forms.viewLocked")}
                              >
                                <LockIcon />
                              </span>
                            ) : null}
                            <span
                              aria-label={t(getViewStatusKey(view.isActive))}
                              className={`tenant-web__platform-studio-view-status${view.isActive ? " tenant-web__platform-studio-view-status--active" : " tenant-web__platform-studio-view-status--inactive"}`}
                              title={t(getViewStatusKey(view.isActive))}
                            >
                              {view.isActive ? <EyeIcon /> : <EyeOffIcon />}
                            </span>
                            <Button
                              onClick={() => navigate(platformStudioPaths.view(
                                getFormsPlaceholderModelRouteId(selectedModel),
                                getFormsPlaceholderViewRouteId(view),
                              ))}
                              size="sm"
                              variant="secondary"
                            >
                              {t("tenant.platformStudio.forms.openWorkspace")}
                            </Button>
                            <Menu align="end">
                              <MenuTrigger>
                                <button
                                  aria-label={t("tenant.platformStudio.forms.viewActions")}
                                  className="tenant-web__platform-studio-menu-trigger"
                                  type="button"
                                >
                                  <ScreenActionsIcon />
                                </button>
                              </MenuTrigger>
                            <MenuContent className="tenant-web__platform-studio-menu">
                              <MenuItem
                                disabled
                                title={t("tenant.platformStudio.forms.placeholderActionTitle")}
                              >
                                {t("tenant.platformStudio.forms.exportView")}
                              </MenuItem>
                              <MenuItem
                                disabled={!viewAccess.canCopyView || isSubmittingDialog}
                                onClick={() => openCopyViewDialog(selectedModel, view)}
                                title={viewAccess.canCopyView ? undefined : t(viewAccess.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.viewAccessDisabled")}
                              >
                                {t("tenant.platformStudio.forms.copyView")}
                              </MenuItem>
                              {!view.isDefault ? (
                                <>
                                  <MenuSeparator />
                                  <MenuItem
                                    disabled={!viewAccess.canDeleteView || isDeletingView}
                                    onClick={() => handleDeleteViewIntent(selectedModel, view)}
                                    title={viewAccess.canDeleteView ? undefined : t(viewAccess.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.viewAccessDisabled")}
                                    tone="danger"
                                  >
                                    {t("tenant.platformStudio.forms.deleteView")}
                                  </MenuItem>
                                </>
                              ) : null}
                            </MenuContent>
                          </Menu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </PlatformStudioPanelScroll>
              </CardContent>
            </>
          ) : hasModelParam ? (
            <>
              <CardHeader>
                <div className="tenant-web__platform-studio-panel-header">
                  <CardTitle>
                    {selectedModelError
                      ? t("tenant.platformStudio.forms.missingTitle")
                      : t("tenant.platformStudio.forms.loadingModelTitle")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="tenant-web__platform-studio-panel-content">
                <PlatformStudioPanelScroll>
                  <div className="tenant-web__platform-studio-builder-empty">
                    <p>{selectedModelError ?? t("tenant.platformStudio.forms.loadingViews")}</p>
                  </div>
                </PlatformStudioPanelScroll>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="tenant-web__platform-studio-panel-header">
                  <CardTitle>{t("tenant.platformStudio.forms.emptySelectionTitle")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="tenant-web__platform-studio-panel-content">
                <PlatformStudioPanelScroll>
                  <div className="tenant-web__platform-studio-builder-empty">
                    <p>{t("tenant.platformStudio.forms.emptySelectionDescription")}</p>
                  </div>
                </PlatformStudioPanelScroll>
              </CardContent>
            </>
          )}
        </Card>
      </section>

      <Dialog onOpenChange={closeDialog} open={Boolean(dialogState)}>
        <DialogContent className="tenant-web__platform-studio-authoring-dialog">
          <DialogHeader>
            <DialogTitle>
              {dialogState?.kind === "create-model"
                ? t("tenant.platformStudio.forms.createModelTitle")
                : dialogState?.kind === "create-view"
                  ? t("tenant.platformStudio.forms.createViewTitle")
                  : t("tenant.platformStudio.forms.copyViewTitle")}
            </DialogTitle>
            <DialogDescription>
              {dialogState?.kind === "create-model"
                ? t("tenant.platformStudio.forms.createModelDescription")
                : dialogState?.kind === "create-view"
                  ? t("tenant.platformStudio.forms.createViewDescription")
                  : t("tenant.platformStudio.forms.copyViewDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="tenant-web__platform-studio-authoring-dialog-body">
            <form onSubmit={(event) => {
              void handleDialogSubmit(event);
            }}>
              <div className="tenant-web__platform-studio-form-group">
                <Label htmlFor="tenant-platform-studio-authoring-title">
                  {t("tenant.platformStudio.forms.titleLabel")}
                </Label>
                <Input
                  autoFocus
                  id="tenant-platform-studio-authoring-title"
                  onChange={(event) => {
                    if (!dialogState) {
                      return;
                    }

                    setDialogState({
                      ...dialogState,
                      title: event.target.value,
                    });
                    setDialogError(null);
                  }}
                  placeholder={t("tenant.platformStudio.forms.titlePlaceholder")}
                  value={dialogState?.title ?? ""}
                />
              </div>

              {dialogError ? (
                <div className="tenant-web__platform-studio-inline-help">
                  <span>{dialogError}</span>
                </div>
              ) : null}

              <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
                <Button
                  disabled={isSubmittingDialog}
                  onClick={() => {
                    setDialogState(null);
                    setDialogError(null);
                  }}
                  type="button"
                  variant="ghost"
                >
                  {t("tenant.platformStudio.forms.cancelAction")}
                </Button>
                <Button
                  disabled={isSubmittingDialog}
                  type="submit"
                >
                  {isSubmittingDialog
                    ? t("tenant.platformStudio.forms.savingAction")
                    : dialogState?.kind === "copy-view"
                      ? t("tenant.platformStudio.forms.copyAction")
                      : t("tenant.platformStudio.forms.createAction")}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !isDeletingView) {
            setDeleteIntent(null);
            setDeleteError(null);
          }
        }}
        open={Boolean(deleteIntent)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tenant.platformStudio.forms.confirmDeleteScreen", { title: deleteIntent?.title ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError
                ? deleteError
                : t("tenant.platformStudio.forms.confirmDeleteScreenDescription", { title: deleteIntent?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingView}>
              {t("tenant.platformStudio.forms.cancelDelete")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingView}
              onClick={() => {
                void handleConfirmDeleteView();
              }}
              variant="danger"
            >
              {isDeletingView
                ? t("tenant.platformStudio.forms.deletingAction")
                : t("tenant.platformStudio.forms.deleteView")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !isDeletingModel) {
            setDeleteModelIntent(null);
            setDeleteError(null);
          }
        }}
        open={Boolean(deleteModelIntent)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tenant.platformStudio.forms.confirmDeleteModel", { title: deleteModelIntent?.title ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError
                ? deleteError
                : t("tenant.platformStudio.forms.confirmDeleteModelDescription", { title: deleteModelIntent?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingModel}>
              {t("tenant.platformStudio.forms.cancelDelete")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingModel}
              onClick={() => {
                void handleConfirmDeleteModel();
              }}
              variant="danger"
            >
              {isDeletingModel
                ? t("tenant.platformStudio.forms.deletingAction")
                : t("tenant.platformStudio.forms.deleteModel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
