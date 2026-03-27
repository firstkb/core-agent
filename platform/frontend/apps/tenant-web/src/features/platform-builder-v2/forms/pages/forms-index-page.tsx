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
import { PlatformBuilderPanelScroll } from "../../platform-builder-panel-scroll";
import { PlatformBuilderTabs } from "../../platform-builder-tabs";
import { platformBuilderPaths } from "../../platform-builder-route-meta";
import {
  getFormsPlaceholderObject,
  sortFormsPlaceholderObjects,
  sortFormsPlaceholderScreens,
  useFormsPlaceholderObjects,
  type FormsPlaceholderObject,
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

function createCopiedScreenTitle(title: string, existingTitles: ReadonlyArray<string>) {
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
    ? "tenant.platformBuilder.forms.viewActive"
    : "tenant.platformBuilder.forms.viewInactive";
}

type DeleteIntent =
  | {
      kind: "object";
      objectId: string;
      title: string;
    }
  | {
      kind: "screen";
      objectId: string;
      screenId: string;
      title: string;
    };

export function FormsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const currentActor = getFormsPlaceholderActor(undefined);
  const [objects, setObjects] = useFormsPlaceholderObjects();
  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent | null>(null);
  const selectedObject = getFormsPlaceholderObject(params.objectId, objects);
  const hasObjectParam = Boolean(params.objectId);
  const pageAccess = getFormsAuthoringAccess(currentActor);
  const selectedObjectAccess = getFormsAuthoringAccess(currentActor, selectedObject);

  useEffect(() => {
    if (hasObjectParam && !selectedObject) {
      navigate(platformBuilderPaths.forms, { replace: true });
    }
  }, [hasObjectParam, navigate, selectedObject]);

  useEffect(() => {
    if (!deleteIntent) {
      return;
    }

    if (!selectedObject || deleteIntent.objectId !== selectedObject.id) {
      setDeleteIntent(null);
      return;
    }

    if (
      deleteIntent.kind === "screen" &&
      !selectedObject.screens.some((screen) => screen.id === deleteIntent.screenId)
    ) {
      setDeleteIntent(null);
      return;
    }

    const access = getFormsAuthoringAccess(currentActor, selectedObject);
    if (
      (deleteIntent.kind === "object" && !access.canDeleteModel) ||
      (deleteIntent.kind === "screen" && !access.canDeleteView)
    ) {
      setDeleteIntent(null);
    }
  }, [currentActor, deleteIntent, selectedObject]);

  function updateObject(objectId: string, updater: (object: FormsPlaceholderObject) => FormsPlaceholderObject) {
    setObjects((currentObjects) =>
      sortFormsPlaceholderObjects(
        currentObjects.map((object) => {
          if (object.id !== objectId) {
            return object;
          }

          const nextObject = updater(object);

          return {
            ...nextObject,
            screens: sortFormsPlaceholderScreens(nextObject.screens),
          };
        }),
      ),
    );
  }

  function handleCopyScreen(objectId: string, screenId: string) {
    const object = getFormsPlaceholderObject(objectId, objects);
    if (!getFormsAuthoringAccess(currentActor, object).canCopyView) {
      return;
    }

    updateObject(objectId, (object) => {
      const sourceScreen = object.screens.find((screen) => screen.id === screenId);
      if (!sourceScreen) {
        return object;
      }

      const nextTitle = createCopiedScreenTitle(
        sourceScreen.title,
        object.screens.map((screen) => screen.title),
      );

      return {
        ...object,
        screens: [
          ...object.screens,
          {
            ...sourceScreen,
            id: `${sourceScreen.id}-copy-${Date.now()}`,
            title: nextTitle,
          },
        ],
      };
    });
  }

  function handleDeleteScreen(objectId: string, screenId: string, screenTitle: string) {
    const object = getFormsPlaceholderObject(objectId, objects);
    if (!getFormsAuthoringAccess(currentActor, object).canDeleteView) {
      return;
    }

    setDeleteIntent({
      kind: "screen",
      objectId,
      screenId,
      title: screenTitle,
    });
  }

  function handleDeleteObject(objectId: string, objectTitle: string) {
    const object = getFormsPlaceholderObject(objectId, objects);
    if (!getFormsAuthoringAccess(currentActor, object).canDeleteModel) {
      return;
    }

    setDeleteIntent({
      kind: "object",
      objectId,
      title: objectTitle,
    });
  }

  function handleConfirmDelete() {
    if (!deleteIntent) {
      return;
    }

    const object = getFormsPlaceholderObject(deleteIntent.objectId, objects);
    const access = getFormsAuthoringAccess(currentActor, object);

    if (deleteIntent.kind === "screen") {
      if (!access.canDeleteView) {
        setDeleteIntent(null);
        return;
      }

      updateObject(deleteIntent.objectId, (object) => ({
        ...object,
        screens: object.screens.filter((screen) => screen.id !== deleteIntent.screenId),
      }));
      setDeleteIntent(null);
      return;
    }

    if (!access.canDeleteModel) {
      setDeleteIntent(null);
      return;
    }

    setObjects((currentObjects) =>
      sortFormsPlaceholderObjects(currentObjects.filter((object) => object.id !== deleteIntent.objectId)),
    );
    setDeleteIntent(null);
    navigate(platformBuilderPaths.forms, { replace: true });
  }

  const activeDeleteIntent =
    deleteIntent &&
    selectedObject &&
    deleteIntent.objectId === selectedObject.id &&
    (
      (deleteIntent.kind === "object" && selectedObjectAccess.canDeleteModel) ||
      (deleteIntent.kind === "screen" && selectedObjectAccess.canDeleteView)
    )
      ? deleteIntent
      : null;
  const sortedObjects = sortFormsPlaceholderObjects(objects);
  const sortedScreens = selectedObject ? sortFormsPlaceholderScreens(selectedObject.screens) : [];
  const addObjectTitle = pageAccess.canManageStructure
    ? t("tenant.platformBuilder.forms.placeholderActionTitle")
    : t(pageAccess.structureRestrictionKey ?? "tenant.platformBuilder.forms.permission.ownerOnlyStructure");
  const addScreenTitle = selectedObjectAccess.canEditViews
    ? t("tenant.platformBuilder.forms.placeholderActionTitle")
    : t(selectedObjectAccess.viewRestrictionKey ?? "tenant.platformBuilder.forms.permission.viewAccessDisabled");
  const deleteModelActionTitle = selectedObjectAccess.canDeleteModel
    ? undefined
    : t(selectedObjectAccess.structureRestrictionKey ?? "tenant.platformBuilder.forms.permission.ownerOnlyStructure");

  return (
    <div className="tenant-web__platform-builder-shell tenant-web__platform-builder-shell--desktop-panels">
      <PlatformBuilderTabs />

      <section className="tenant-web__platform-builder-master-detail">
        <Card className="tenant-web__platform-builder-panel">
          <CardHeader>
            <div className="tenant-web__platform-builder-panel-header">
              <CardTitle>{t("tenant.platformBuilder.forms.objectsTitle")}</CardTitle>
              <Button
                className="tenant-web__platform-builder-action-button"
                disabled
                leadingIcon={<PlusIcon />}
                size="sm"
                title={addObjectTitle}
                variant="secondary"
              >
                {t("tenant.platformBuilder.forms.addObject")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="tenant-web__platform-builder-panel-content">
            <PlatformBuilderPanelScroll aria-label={t("tenant.platformBuilder.forms.objectsTitle")}>
              <div className="tenant-web__platform-builder-object-list">
                {sortedObjects.map((object) => {
                  const isActive = selectedObject?.id === object.id;

                  return (
                    <button
                      className={`tenant-web__platform-builder-object-item${isActive ? " tenant-web__platform-builder-object-item--active" : ""}`}
                      key={object.id}
                      onClick={() => navigate(platformBuilderPaths.object(object.id))}
                      type="button"
                    >
                      <span className="tenant-web__platform-builder-object-copy">
                        <span className="tenant-web__platform-builder-object-title">{object.title}</span>
                      </span>
                      {object.isStructureLocked ? (
                        <Badge
                          appearance="soft"
                          aria-label={t("tenant.platformBuilder.forms.structureLocked")}
                          className="tenant-web__platform-builder-lock-badge"
                          size="sm"
                          title={t("tenant.platformBuilder.forms.structureLocked")}
                          variant="warning"
                        >
                          <LockIcon />
                        </Badge>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </PlatformBuilderPanelScroll>
          </CardContent>
        </Card>

        <Card className="tenant-web__platform-builder-panel">
          {selectedObject ? (
            <>
              <CardHeader>
                <div className="tenant-web__platform-builder-panel-header">
                  <CardTitle>{selectedObject.title}</CardTitle>
                  <div className="tenant-web__platform-builder-panel-actions">
                    <Button
                      className="tenant-web__platform-builder-action-button"
                      disabled
                      leadingIcon={<PlusIcon />}
                      size="sm"
                      title={addScreenTitle}
                      variant="secondary"
                    >
                      {t("tenant.platformBuilder.forms.addScreen")}
                    </Button>
                    <Menu align="end">
                      <MenuTrigger>
                        <button
                          aria-label={t("tenant.platformBuilder.forms.modelActions")}
                          className="tenant-web__platform-builder-menu-trigger"
                          type="button"
                        >
                          <ScreenActionsIcon />
                        </button>
                      </MenuTrigger>
                      <MenuContent className="tenant-web__platform-builder-menu">
                        <MenuItem
                          disabled
                          title={t("tenant.platformBuilder.forms.placeholderActionTitle")}
                        >
                          {t("tenant.platformBuilder.forms.exportData")}
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem
                          disabled={!selectedObjectAccess.canDeleteModel}
                          onClick={() => handleDeleteObject(selectedObject.id, selectedObject.title)}
                          title={deleteModelActionTitle}
                          tone="danger"
                        >
                          {t("tenant.platformBuilder.forms.deleteObject")}
                        </MenuItem>
                      </MenuContent>
                    </Menu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="tenant-web__platform-builder-panel-content">
                <PlatformBuilderPanelScroll>
                  <div className="tenant-web__platform-builder-screen-list">
                    <div className="tenant-web__platform-builder-badge-row tenant-web__platform-builder-content-badges">
                      {selectedObject.isStructureLocked ? (
                        <Badge appearance="soft" size="sm" variant="warning">
                          {t("tenant.platformBuilder.forms.structureLocked")}
                        </Badge>
                      ) : null}
                      {selectedObject.canEditScreensOnly ? (
                        <Badge appearance="soft" size="sm" variant="info">
                          {t("tenant.platformBuilder.forms.canEditScreensOnly")}
                        </Badge>
                      ) : null}
                    </div>

                    {sortedScreens.map((screen) => (
                      <div className="tenant-web__platform-builder-screen-item" key={screen.id}>
                        <div className="tenant-web__platform-builder-screen-copy">
                          <span className="tenant-web__platform-builder-screen-title">{screen.title}</span>
                          <span className="tenant-web__platform-builder-screen-description">{screen.description}</span>
                        </div>
                        <div className="tenant-web__platform-builder-screen-actions">
                          <span
                            aria-label={t(getViewStatusKey(screen.isActive))}
                            className={`tenant-web__platform-builder-view-status${screen.isActive ? " tenant-web__platform-builder-view-status--active" : " tenant-web__platform-builder-view-status--inactive"}`}
                            title={t(getViewStatusKey(screen.isActive))}
                          >
                            {screen.isActive ? <EyeIcon /> : <EyeOffIcon />}
                          </span>
                          <Button
                            onClick={() => navigate(platformBuilderPaths.view(selectedObject.id, screen.id))}
                            size="sm"
                            variant="secondary"
                          >
                            {t("tenant.platformBuilder.forms.openWorkspace")}
                          </Button>
                          <Menu align="end">
                            <MenuTrigger>
                              <button
                                aria-label={t("tenant.platformBuilder.forms.screenActions")}
                                className="tenant-web__platform-builder-menu-trigger"
                                type="button"
                              >
                                <ScreenActionsIcon />
                              </button>
                            </MenuTrigger>
                            <MenuContent className="tenant-web__platform-builder-menu">
                              <MenuItem
                                disabled
                                title={t("tenant.platformBuilder.forms.placeholderActionTitle")}
                              >
                                {t("tenant.platformBuilder.forms.exportScreen")}
                              </MenuItem>
                              <MenuItem
                                disabled={!selectedObjectAccess.canCopyView}
                                onClick={() => handleCopyScreen(selectedObject.id, screen.id)}
                                title={selectedObjectAccess.canCopyView ? undefined : t(selectedObjectAccess.viewRestrictionKey ?? "tenant.platformBuilder.forms.permission.viewAccessDisabled")}
                              >
                                {t("tenant.platformBuilder.forms.copyScreen")}
                              </MenuItem>
                              <MenuSeparator />
                              <MenuItem
                                disabled={!selectedObjectAccess.canDeleteView}
                                onClick={() => handleDeleteScreen(selectedObject.id, screen.id, screen.title)}
                                title={selectedObjectAccess.canDeleteView ? undefined : t(selectedObjectAccess.viewRestrictionKey ?? "tenant.platformBuilder.forms.permission.viewAccessDisabled")}
                                tone="danger"
                              >
                                {t("tenant.platformBuilder.forms.deleteScreen")}
                              </MenuItem>
                            </MenuContent>
                          </Menu>
                        </div>
                      </div>
                    ))}
                  </div>
                </PlatformBuilderPanelScroll>
              </CardContent>
            </>
          ) : hasObjectParam ? null : (
            <>
              <CardHeader>
                <CardTitle>{t("tenant.platformBuilder.forms.emptySelectionTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="tenant-web__platform-builder-panel-content">
                <PlatformBuilderPanelScroll>
                  <div className="tenant-web__platform-builder-empty-state" />
                </PlatformBuilderPanelScroll>
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
              {activeDeleteIntent?.kind === "object"
                ? t("tenant.platformBuilder.forms.confirmDeleteObject", { title: activeDeleteIntent.title })
                : t("tenant.platformBuilder.forms.confirmDeleteScreen", { title: activeDeleteIntent?.title ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeDeleteIntent?.kind === "object"
                ? t("tenant.platformBuilder.forms.confirmDeleteObjectDescription", { title: activeDeleteIntent.title })
                : t("tenant.platformBuilder.forms.confirmDeleteScreenDescription", { title: activeDeleteIntent?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("tenant.platformBuilder.forms.cancelDelete")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} variant="danger">
              {activeDeleteIntent?.kind === "object"
                ? t("tenant.platformBuilder.forms.deleteObject")
                : t("tenant.platformBuilder.forms.deleteScreen")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
