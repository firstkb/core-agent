import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { ApiClientError } from "@platform/api-client";
import { useTranslation } from "@platform/i18n";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getFormsAuthoringAccess,
  getFormsAuthoringActor,
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
import { FormsIndexAuthoringDialog } from "../components/forms-index-authoring-dialog";
import { FormsIndexDeleteDialogs } from "../components/forms-index-delete-dialogs";
import { FormsIndexModelsPanel } from "../components/forms-index-models-panel";
import {
  type AuthoringDialogState,
  createCopiedViewTitle,
  type DeleteIntent,
  type DeleteModelIntent,
  isStaticFormsModel,
  resolveMutationSelectedViewRouteId,
  triggerBrowserDownload,
} from "../components/forms-index-page-helpers";
import { FormsIndexViewsPanel } from "../components/forms-index-views-panel";
import { platformStudioPaths } from "../../platform-studio-route-meta";
import { PlatformStudioTabs } from "../../platform-studio-tabs";
import { useTenantWorkspaceUser } from "../../../../app/tenant-workspace-user-context";

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
    exportModelBundle,
    exportModelData,
    isLoadingModels,
    models,
    modelsError,
  } = useFormBuilderAuthoring();
  const workspaceUser = useTenantWorkspaceUser();
  const currentActor = getFormsAuthoringActor(workspaceUser);
  const [dialogState, setDialogState] = useState<AuthoringDialogState | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false);
  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent | null>(null);
  const [deleteModelIntent, setDeleteModelIntent] = useState<DeleteModelIntent | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingView, setIsDeletingView] = useState(false);
  const [isDeletingModel, setIsDeletingModel] = useState(false);
  const [isExportingModelBundle, setIsExportingModelBundle] = useState(false);
  const [isExportingModelData, setIsExportingModelData] = useState(false);
  const [isLoadingSelectedModel, setIsLoadingSelectedModel] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [modelActionError, setModelActionError] = useState<string | null>(null);
  const [selectedModelError, setSelectedModelError] = useState<string | null>(null);
  const selectedModel = getFormsPlaceholderModel(params.modelId, models);
  const hasModelParam = Boolean(params.modelId);
  const pageAccess = getFormsAuthoringAccess(currentActor);
  const selectedModelAccess = getFormsAuthoringAccess(currentActor, selectedModel);
  const selectedModelIsStatic = isStaticFormsModel(selectedModel);
  const sortedViews = selectedModel ? sortFormsPlaceholderViews(selectedModel.screens) : [];
  const canExportModelBundle = !selectedModelIsStatic && (currentActor.isRoot || !sortedViews.some((view) => view.isViewLocked));
  const filteredModels = useMemo(() => {
    const normalizedQuery = modelSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return models;
    }

    return models.filter((model) => {
      const candidates = [
        model.title,
        model.displayName,
        model.key,
      ];

      return candidates.some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [modelSearchQuery, models]);

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
    setModelActionError(null);
  }, [selectedModel?.id]);

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

  async function handleExportModelData(model: FormsPlaceholderModel) {
    setModelActionError(null);
    setIsExportingModelData(true);

    try {
      const file = await exportModelData(model.id);
      triggerBrowserDownload(file);
    } catch (error) {
      setModelActionError(
        error instanceof Error
          ? error.message
          : t("tenant.platformStudio.forms.mutationError"),
      );
    } finally {
      setIsExportingModelData(false);
    }
  }

  async function handleExportModelBundle(model: FormsPlaceholderModel) {
    setModelActionError(null);
    setIsExportingModelBundle(true);

    try {
      const file = await exportModelBundle(model.id);
      triggerBrowserDownload(file);
    } catch (error) {
      setModelActionError(
        error instanceof Error
          ? error.message
          : t("tenant.platformStudio.forms.mutationError"),
      );
    } finally {
      setIsExportingModelBundle(false);
    }
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

  function handleDialogTitleChange(title: string) {
    if (!dialogState) {
      return;
    }

    setDialogState({
      ...dialogState,
      title,
    });
    setDialogError(null);
  }

  function cancelDialog() {
    setDialogState(null);
    setDialogError(null);
  }

  function closeDeleteViewDialog(open: boolean) {
    if (!open && !isDeletingView) {
      setDeleteIntent(null);
      setDeleteError(null);
    }
  }

  function closeDeleteModelDialog(open: boolean) {
    if (!open && !isDeletingModel) {
      setDeleteModelIntent(null);
      setDeleteError(null);
    }
  }

  function navigateToModel(model: FormsPlaceholderModel) {
    navigate(platformStudioPaths.model(getFormsPlaceholderModelRouteId(model)));
  }

  function navigateToView(model: FormsPlaceholderModel, view: FormsPlaceholderView) {
    navigate(platformStudioPaths.view(
      getFormsPlaceholderModelRouteId(model),
      getFormsPlaceholderViewRouteId(view),
    ));
  }

  function navigateToPreviewView(model: FormsPlaceholderModel, view: FormsPlaceholderView) {
    navigate(platformStudioPaths.previewRuntimeView(
      getFormsPlaceholderModelRouteId(model),
      getFormsPlaceholderViewRouteId(view),
    ));
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
        <FormsIndexModelsPanel
          addModelTitle={addModelTitle}
          canManageStructure={pageAccess.canManageStructure}
          filteredModels={filteredModels}
          isLoadingModels={isLoadingModels}
          isSubmittingDialog={isSubmittingDialog}
          modelSearchQuery={modelSearchQuery}
          models={models}
          modelsError={modelsError}
          onAddModel={openCreateModelDialog}
          onModelSearchChange={setModelSearchQuery}
          onModelSelect={navigateToModel}
          selectedModel={selectedModel}
          t={t}
        />

        <FormsIndexViewsPanel
          addViewTitle={addViewTitle}
          canExportModelBundle={canExportModelBundle}
          currentActor={currentActor}
          hasModelParam={hasModelParam}
          isDeletingModel={isDeletingModel}
          isDeletingView={isDeletingView}
          isExportingModelBundle={isExportingModelBundle}
          isExportingModelData={isExportingModelData}
          isLoadingSelectedModel={isLoadingSelectedModel}
          isSubmittingDialog={isSubmittingDialog}
          modelActionError={modelActionError}
          onAddView={openCreateViewDialog}
          onCopyView={openCopyViewDialog}
          onDeleteModel={handleDeleteModelIntent}
          onDeleteView={handleDeleteViewIntent}
          onExportModelBundle={(model) => {
            void handleExportModelBundle(model);
          }}
          onExportModelData={(model) => {
            void handleExportModelData(model);
          }}
          onOpenWorkspace={navigateToView}
          onPreviewView={navigateToPreviewView}
          selectedModel={selectedModel}
          selectedModelAccess={selectedModelAccess}
          selectedModelError={selectedModelError}
          selectedModelIsStatic={selectedModelIsStatic}
          sortedViews={sortedViews}
          t={t}
        />
      </section>

      <FormsIndexAuthoringDialog
        dialogError={dialogError}
        dialogState={dialogState}
        isSubmittingDialog={isSubmittingDialog}
        onCancel={cancelDialog}
        onOpenChange={closeDialog}
        onSubmit={(event) => {
          void handleDialogSubmit(event);
        }}
        onTitleChange={handleDialogTitleChange}
        t={t}
      />

      <FormsIndexDeleteDialogs
        deleteError={deleteError}
        deleteIntent={deleteIntent}
        deleteModelIntent={deleteModelIntent}
        isDeletingModel={isDeletingModel}
        isDeletingView={isDeletingView}
        onConfirmDeleteModel={() => {
          void handleConfirmDeleteModel();
        }}
        onConfirmDeleteView={() => {
          void handleConfirmDeleteView();
        }}
        onModelOpenChange={closeDeleteModelDialog}
        onViewOpenChange={closeDeleteViewDialog}
        t={t}
      />
    </div>
  );
}
