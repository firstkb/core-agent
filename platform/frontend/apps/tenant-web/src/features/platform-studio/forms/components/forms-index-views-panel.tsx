import { type useTranslation } from "@platform/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  getFormsAuthoringAccess,
  type FormsAuthoringAccess,
  type FormsAuthoringActor,
} from "../forms-actors";
import {
  type FormsPlaceholderModel,
  type FormsPlaceholderView,
} from "../forms-placeholder-data";
import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import {
  ScreenActionsIcon,
  ViewWarningIcon,
} from "./forms-index-icons";

type Translate = ReturnType<typeof useTranslation>["t"];

type FormsIndexViewsPanelProps = {
  addViewTitle: string | undefined;
  canExportModelBundle: boolean;
  currentActor: FormsAuthoringActor;
  hasModelParam: boolean;
  isDeletingModel: boolean;
  isDeletingView: boolean;
  isExportingModelBundle: boolean;
  isExportingModelData: boolean;
  isLoadingSelectedModel: boolean;
  isSubmittingDialog: boolean;
  modelActionError: string | null;
  onAddView: (model: FormsPlaceholderModel) => void;
  onCopyView: (model: FormsPlaceholderModel, view: FormsPlaceholderView) => void;
  onDeleteModel: (model: FormsPlaceholderModel) => void;
  onDeleteView: (model: FormsPlaceholderModel, view: FormsPlaceholderView) => void;
  onExportModelBundle: (model: FormsPlaceholderModel) => void;
  onExportModelData: (model: FormsPlaceholderModel) => void;
  onOpenWorkspace: (model: FormsPlaceholderModel, view: FormsPlaceholderView) => void;
  onPreviewView: (model: FormsPlaceholderModel, view: FormsPlaceholderView) => void;
  selectedModel: FormsPlaceholderModel | null;
  selectedModelAccess: FormsAuthoringAccess;
  selectedModelError: string | null;
  selectedModelIsStatic: boolean;
  sortedViews: ReadonlyArray<FormsPlaceholderView>;
  t: Translate;
};

export function FormsIndexViewsPanel({
  addViewTitle,
  canExportModelBundle,
  currentActor,
  hasModelParam,
  isDeletingModel,
  isDeletingView,
  isExportingModelBundle,
  isExportingModelData,
  isLoadingSelectedModel,
  isSubmittingDialog,
  modelActionError,
  onAddView,
  onCopyView,
  onDeleteModel,
  onDeleteView,
  onExportModelBundle,
  onExportModelData,
  onOpenWorkspace,
  onPreviewView,
  selectedModel,
  selectedModelAccess,
  selectedModelError,
  selectedModelIsStatic,
  sortedViews,
  t,
}: FormsIndexViewsPanelProps) {
  return (
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
                  onClick={() => onAddView(selectedModel)}
                  size="sm"
                  title={addViewTitle}
                  variant="secondary"
                >
                  {t("tenant.platformStudio.forms.addView")}
                </Button>
                {!selectedModelIsStatic ? (
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
                      <>
                        <MenuItem
                          disabled={isExportingModelData}
                          onClick={() => onExportModelData(selectedModel)}
                        >
                          {t("tenant.platformStudio.forms.exportData")}
                        </MenuItem>
                        <MenuItem
                          disabled={!canExportModelBundle || isExportingModelBundle}
                          onClick={() => onExportModelBundle(selectedModel)}
                          title={canExportModelBundle ? undefined : t("tenant.platformStudio.forms.permission.viewLocked")}
                        >
                          {t("tenant.platformStudio.forms.exportModel")}
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem
                          disabled={!selectedModelAccess.canDeleteModel || isDeletingModel}
                          onClick={() => onDeleteModel(selectedModel)}
                          title={selectedModelAccess.canDeleteModel ? undefined : t(selectedModelAccess.structureRestrictionKey ?? "tenant.platformStudio.forms.permission.ownerOnlyStructure")}
                          tone="danger"
                        >
                          {t("tenant.platformStudio.forms.deleteModel")}
                        </MenuItem>
                      </>
                    </MenuContent>
                  </Menu>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="tenant-web__platform-studio-panel-content">
            <PlatformStudioPanelScroll className="tenant-web__platform-studio-panel-scroll--views">
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

                {modelActionError ? (
                  <div className="tenant-web__platform-studio-inline-help">
                    <span>{modelActionError}</span>
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
                        <Button
                          disabled={!viewAccess.canOpenWorkspace}
                          onClick={() => {
                            if (!viewAccess.canOpenWorkspace) {
                              return;
                            }

                            onOpenWorkspace(selectedModel, view);
                          }}
                          size="sm"
                          title={viewAccess.canOpenWorkspace ? undefined : t(viewAccess.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.viewLocked")}
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
                              onClick={() => onPreviewView(selectedModel, view)}
                            >
                              {t("tenant.platformStudio.forms.viewData")}
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem
                              disabled={!viewAccess.canCopyView || isSubmittingDialog}
                              onClick={() => onCopyView(selectedModel, view)}
                              title={viewAccess.canCopyView ? undefined : t(viewAccess.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.viewAccessDisabled")}
                            >
                              {t("tenant.platformStudio.forms.copyView")}
                            </MenuItem>
                            {!view.isDefault ? (
                              <>
                                <MenuSeparator />
                                <MenuItem
                                  disabled={!viewAccess.canDeleteView || isDeletingView}
                                  onClick={() => onDeleteView(selectedModel, view)}
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
  );
}
