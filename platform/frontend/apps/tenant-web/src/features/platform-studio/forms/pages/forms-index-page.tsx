import {
  useEffect,
  useState,
} from "react";

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
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PlusIcon,
} from "@platform/ui-kit";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getFormsAuthoringAccess,
  getFormsPlaceholderActor,
} from "../forms-actors";
import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import { PlatformStudioTabs } from "../../platform-studio-tabs";
import { platformStudioPaths } from "../../platform-studio-route-meta";
import {
  getFormsPlaceholderModel,
  sortFormsPlaceholderModels,
  sortFormsPlaceholderViews,
  useFormsPlaceholderModels,
  type FormsPlaceholderModel,
} from "../forms-placeholder-data";

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

type DeleteIntent =
  | {
      kind: "model";
      modelId: string;
      title: string;
    }
  | {
      kind: "view";
      modelId: string;
      viewId: string;
      title: string;
    };

export function FormsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const currentActor = getFormsPlaceholderActor(undefined);
  const [models, setModels] = useFormsPlaceholderModels();
  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent | null>(null);
  const selectedModel = getFormsPlaceholderModel(params.modelId, models);
  const hasModelParam = Boolean(params.modelId);
  const pageAccess = getFormsAuthoringAccess(currentActor);
  const selectedModelAccess = getFormsAuthoringAccess(currentActor, selectedModel);

  useEffect(() => {
    if (hasModelParam && !selectedModel) {
      navigate(platformStudioPaths.forms, { replace: true });
    }
  }, [hasModelParam, navigate, selectedModel]);

  useEffect(() => {
    if (!deleteIntent) {
      return;
    }

    if (!selectedModel || deleteIntent.modelId !== selectedModel.id) {
      setDeleteIntent(null);
      return;
    }

    if (
      deleteIntent.kind === "view" &&
      !selectedModel.screens.some((screen) => screen.id === deleteIntent.viewId)
    ) {
      setDeleteIntent(null);
      return;
    }

    const access = getFormsAuthoringAccess(currentActor, selectedModel);
    if (
      (deleteIntent.kind === "model" && !access.canDeleteModel) ||
      (deleteIntent.kind === "view" && !access.canDeleteView)
    ) {
      setDeleteIntent(null);
    }
  }, [currentActor, deleteIntent, selectedModel]);

  function updateModel(modelId: string, updater: (model: FormsPlaceholderModel) => FormsPlaceholderModel) {
    setModels((currentModels) =>
      sortFormsPlaceholderModels(
        currentModels.map((model) => {
          if (model.id !== modelId) {
            return model;
          }

          const nextModel = updater(model);

          return {
            ...nextModel,
            screens: sortFormsPlaceholderViews(nextModel.screens),
          };
        }),
      ),
    );
  }

  function handleCopyView(modelId: string, viewId: string) {
    const model = getFormsPlaceholderModel(modelId, models);
    if (!getFormsAuthoringAccess(currentActor, model).canCopyView) {
      return;
    }

    updateModel(modelId, (model) => {
      const sourceView = model.screens.find((screen) => screen.id === viewId);
      if (!sourceView) {
        return model;
      }

      const nextTitle = createCopiedViewTitle(
        sourceView.title,
        model.screens.map((screen) => screen.title),
      );

      return {
        ...model,
        screens: [
          ...model.screens,
          {
            ...sourceView,
            id: `${sourceView.id}-copy-${Date.now()}`,
            title: nextTitle,
          },
        ],
      };
    });
  }

  function handleDeleteView(modelId: string, viewId: string, viewTitle: string) {
    const model = getFormsPlaceholderModel(modelId, models);
    if (!getFormsAuthoringAccess(currentActor, model).canDeleteView) {
      return;
    }

    setDeleteIntent({
      kind: "view",
      modelId,
      viewId,
      title: viewTitle,
    });
  }

  function handleDeleteModel(modelId: string, modelTitle: string) {
    const model = getFormsPlaceholderModel(modelId, models);
    if (!getFormsAuthoringAccess(currentActor, model).canDeleteModel) {
      return;
    }

    setDeleteIntent({
      kind: "model",
      modelId,
      title: modelTitle,
    });
  }

  function handleConfirmDelete() {
    if (!deleteIntent) {
      return;
    }

    const model = getFormsPlaceholderModel(deleteIntent.modelId, models);
    const access = getFormsAuthoringAccess(currentActor, model);

    if (deleteIntent.kind === "view") {
      if (!access.canDeleteView) {
        setDeleteIntent(null);
        return;
      }

      updateModel(deleteIntent.modelId, (model) => ({
        ...model,
        screens: model.screens.filter((screen) => screen.id !== deleteIntent.viewId),
      }));
      setDeleteIntent(null);
      return;
    }

    if (!access.canDeleteModel) {
      setDeleteIntent(null);
      return;
    }

    setModels((currentModels) =>
      sortFormsPlaceholderModels(currentModels.filter((model) => model.id !== deleteIntent.modelId)),
    );
    setDeleteIntent(null);
    navigate(platformStudioPaths.forms, { replace: true });
  }

  const activeDeleteIntent =
    deleteIntent &&
    selectedModel &&
    deleteIntent.modelId === selectedModel.id &&
    (
      (deleteIntent.kind === "model" && selectedModelAccess.canDeleteModel) ||
      (deleteIntent.kind === "view" && selectedModelAccess.canDeleteView)
    )
      ? deleteIntent
      : null;
  const sortedModels = sortFormsPlaceholderModels(models);
  const sortedViews = selectedModel ? sortFormsPlaceholderViews(selectedModel.screens) : [];
  const addModelTitle = pageAccess.canManageStructure
    ? t("tenant.platformStudio.forms.placeholderActionTitle")
    : t(pageAccess.structureRestrictionKey ?? "tenant.platformStudio.forms.permission.ownerOnlyStructure");
  const addViewTitle = selectedModelAccess.canEditViews
    ? t("tenant.platformStudio.forms.placeholderActionTitle")
    : t(selectedModelAccess.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.viewAccessDisabled");
  const deleteModelActionTitle = selectedModelAccess.canDeleteModel
    ? undefined
    : t(selectedModelAccess.structureRestrictionKey ?? "tenant.platformStudio.forms.permission.ownerOnlyStructure");

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
                disabled
                leadingIcon={<PlusIcon />}
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
                {sortedModels.map((model) => {
                  const isActive = selectedModel?.id === model.id;

                  return (
                    <button
                      className={`tenant-web__platform-studio-object-item${isActive ? " tenant-web__platform-studio-object-item--active" : ""}`}
                      key={model.id}
                      onClick={() => navigate(platformStudioPaths.model(model.id))}
                      type="button"
                    >
                      <span className="tenant-web__platform-studio-object-copy">
                        <span className="tenant-web__platform-studio-object-title">{model.title}</span>
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
                      disabled
                      leadingIcon={<PlusIcon />}
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
                          disabled={!selectedModelAccess.canDeleteModel}
                          onClick={() => handleDeleteModel(selectedModel.id, selectedModel.title)}
                          title={deleteModelActionTitle}
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

                    {sortedViews.map((view) => (
                      <div className="tenant-web__platform-studio-screen-item" key={view.id}>
                        <div className="tenant-web__platform-studio-screen-copy">
                          <span className="tenant-web__platform-studio-screen-title">{view.title}</span>
                          <span className="tenant-web__platform-studio-screen-description">{view.description}</span>
                        </div>
                        <div className="tenant-web__platform-studio-screen-actions">
                          <span
                            aria-label={t(getViewStatusKey(view.isActive))}
                            className={`tenant-web__platform-studio-view-status${view.isActive ? " tenant-web__platform-studio-view-status--active" : " tenant-web__platform-studio-view-status--inactive"}`}
                            title={t(getViewStatusKey(view.isActive))}
                          >
                            {view.isActive ? <EyeIcon /> : <EyeOffIcon />}
                          </span>
                          <Button
                            onClick={() => navigate(platformStudioPaths.view(selectedModel.id, view.id))}
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
                                disabled={!selectedModelAccess.canCopyView}
                                onClick={() => handleCopyView(selectedModel.id, view.id)}
                                title={selectedModelAccess.canCopyView ? undefined : t(selectedModelAccess.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.viewAccessDisabled")}
                              >
                                {t("tenant.platformStudio.forms.copyView")}
                              </MenuItem>
                              <MenuSeparator />
                              <MenuItem
                                disabled={!selectedModelAccess.canDeleteView}
                                onClick={() => handleDeleteView(selectedModel.id, view.id, view.title)}
                                title={selectedModelAccess.canDeleteView ? undefined : t(selectedModelAccess.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.viewAccessDisabled")}
                                tone="danger"
                              >
                                {t("tenant.platformStudio.forms.deleteView")}
                              </MenuItem>
                            </MenuContent>
                          </Menu>
                        </div>
                      </div>
                    ))}
                  </div>
                </PlatformStudioPanelScroll>
              </CardContent>
            </>
          ) : hasModelParam ? null : (
            <>
              <CardHeader>
                <CardTitle>{t("tenant.platformStudio.forms.emptySelectionTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="tenant-web__platform-studio-panel-content">
                <PlatformStudioPanelScroll>
                  <div className="tenant-web__platform-studio-empty-state" />
                </PlatformStudioPanelScroll>
              </CardContent>
            </>
          )}
        </Card>
      </section>

      <AlertDialog onOpenChange={(open) => {
        if (!open) {
          setDeleteIntent(null);
        }
      }} open={Boolean(activeDeleteIntent)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeDeleteIntent?.kind === "model"
                ? t("tenant.platformStudio.forms.confirmDeleteModel", { title: activeDeleteIntent.title })
                : t("tenant.platformStudio.forms.confirmDeleteScreen", { title: activeDeleteIntent?.title ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeDeleteIntent?.kind === "model"
                ? t("tenant.platformStudio.forms.confirmDeleteModelDescription", { title: activeDeleteIntent.title })
                : t("tenant.platformStudio.forms.confirmDeleteScreenDescription", { title: activeDeleteIntent?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("tenant.platformStudio.forms.cancelDelete")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} variant="danger">
              {activeDeleteIntent?.kind === "model"
                ? t("tenant.platformStudio.forms.deleteModel")
                : t("tenant.platformStudio.forms.deleteView")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
