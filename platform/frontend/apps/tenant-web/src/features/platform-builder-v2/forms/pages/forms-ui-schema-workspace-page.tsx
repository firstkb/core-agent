import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  SearchIcon,
  Select,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  Textarea,
} from "@platform/ui-kit";
import {
  useNavigate,
  useParams,
  useBeforeUnload,
} from "react-router-dom";

import { PlatformBuilderTabs } from "../../platform-builder-tabs";
import { PlatformBuilderPanelScroll } from "../../platform-builder-panel-scroll";
import { platformBuilderPaths } from "../../platform-builder-route-meta";
import { FormBuilderElementIcon } from "../forms-builder-icons";
import {
  addFormBuilderElementNode,
  addFormBuilderFieldNode,
  getCurrentFormBuilderChildren,
  getElementPaletteItems,
  getFieldPaletteItems,
  getFormBuilderBreadcrumb,
  getFormBuilderChildren,
  getFormBuilderDisplayLabel,
  getFormBuilderNode,
  getFormBuilderNodeSummary,
  getFormsWorkspaceAccess,
  reorderFormBuilderNode,
  removeFormBuilderNode,
  selectFormBuilderNode,
  setFormBuilderCurrentParent,
  updateFormBuilderNode,
  useFormBuilderDocument,
  type FormBuilderNode,
  type FormBuilderPaletteItem,
} from "../forms-builder-state";
import {
  getFormsAuthoringAccess,
  getFormsPlaceholderActor,
} from "../forms-actors";
import {
  getFormsPlaceholderObject,
  getFormsPlaceholderScreen,
  useFormsPlaceholderObjects,
} from "../forms-placeholder-data";

type InspectorTab = "selection" | "view";

declare global {
  interface Window {
    __tenantPlatformBuilderLeaveGuard?: () => boolean | Promise<boolean>;
  }
}

function getScreenKindKey(kind: "detail" | "form") {
  return `tenant.platformBuilder.forms.screenKind.${kind}`;
}

function getPaletteCategoryKey(category: "containers" | "content" | "fields" | "layout") {
  return `tenant.platformBuilder.forms.builder.category.${category}`;
}

function getNodeTypeKey(nodeType: FormBuilderNode["type"]) {
  return `tenant.platformBuilder.forms.builder.nodeType.${nodeType}`;
}

function getSummaryText(
  node: FormBuilderNode,
  objectTitle: string,
  objectFields: ReadonlyArray<{ id: string; isLocked: boolean; label: string }>,
  summaryKey: string,
  t: ReturnType<typeof useTranslation>["t"],
  childrenCount: number,
) {
  if (summaryKey === "tenant.platformBuilder.forms.builder.summary.children") {
    return t(summaryKey, { count: childrenCount });
  }

  if (node.type === "field") {
    const field = objectFields.find((entry) => entry.id === node.fieldId);

    return t(summaryKey, {
      fieldLabel: field?.label ?? objectTitle,
    });
  }

  return t(summaryKey);
}

function BackArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="tenant-web__platform-builder-back-icon"
      fill="none"
      viewBox="0 0 20 20"
      width="16"
      height="16"
    >
      <path
        d="M10.5 5.5 6 10l4.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 5.5 2 10l4.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DragHandleIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
    >
      <circle cx="7" cy="6" fill="currentColor" r="1.1" />
      <circle cx="13" cy="6" fill="currentColor" r="1.1" />
      <circle cx="7" cy="10" fill="currentColor" r="1.1" />
      <circle cx="13" cy="10" fill="currentColor" r="1.1" />
      <circle cx="7" cy="14" fill="currentColor" r="1.1" />
      <circle cx="13" cy="14" fill="currentColor" r="1.1" />
    </svg>
  );
}

function PaletteItem({
  description,
  disabled,
  disabledReason,
  iconKey,
  label,
  onClick,
}: {
  description: string;
  disabled: boolean;
  disabledReason: string | null;
  iconKey: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`tenant-web__platform-builder-palette-item${disabled ? " tenant-web__platform-builder-palette-item--disabled" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={disabledReason ?? undefined}
      type="button"
    >
      <span className="tenant-web__platform-builder-item-icon">
        <FormBuilderElementIcon iconKey={iconKey} />
      </span>
      <span className="tenant-web__platform-builder-palette-copy">
        <span className="tenant-web__platform-builder-palette-title">{label}</span>
        <span className="tenant-web__platform-builder-palette-description">{description}</span>
      </span>
    </button>
  );
}

function CanvasNodeRow({
  canMoveItems,
  currentLevelId,
  document,
  dragOverNodeId,
  draggedNodeId,
  object,
  onDragEnd,
  onDragOverNode,
  onDragStartNode,
  onDropNode,
  onOpenLevel,
  onSelect,
  selectedNodeId,
  t,
  workspaceDocumentChildrenCount,
  node,
}: {
  canMoveItems: boolean;
  currentLevelId: string | null;
  document: Parameters<typeof getFormBuilderNodeSummary>[1];
  dragOverNodeId: string | null;
  draggedNodeId: string | null;
  node: FormBuilderNode;
  object: NonNullable<ReturnType<typeof getFormsPlaceholderObject>>;
  onDragEnd: () => void;
  onDragOverNode: () => void;
  onDragStartNode: () => void;
  onDropNode: () => void;
  onOpenLevel: () => void;
  onSelect: () => void;
  selectedNodeId: string | null;
  t: ReturnType<typeof useTranslation>["t"];
  workspaceDocumentChildrenCount: number;
}) {
  const isSelected = selectedNodeId === node.id;
  const isCurrentLevel = currentLevelId === node.id;
  const isDragging = draggedNodeId === node.id;
  const isDropTarget = dragOverNodeId === node.id && draggedNodeId !== node.id;
  const isContainer = node.type !== "field" && node.type !== "text" && node.type !== "divider"
    ? true
    : false;
  const summaryKey = getFormBuilderNodeSummary(
    node,
    document,
    object,
  );
  const summary = getSummaryText(
    node,
    object.title,
    object.fields,
    summaryKey,
    t,
    workspaceDocumentChildrenCount,
  );

  return (
    <div
      className={`tenant-web__platform-builder-canvas-item${isSelected ? " tenant-web__platform-builder-canvas-item--selected" : ""}${isDragging ? " tenant-web__platform-builder-canvas-item--dragging" : ""}${isDropTarget ? " tenant-web__platform-builder-canvas-item--drop-target" : ""}`}
      draggable={canMoveItems}
      role="button"
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDragOverNode();
      }}
      onDragStart={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", node.id);
        onDragStartNode();
      }}
      onDrop={(event) => {
        if (!canMoveItems) {
          return;
        }

        event.preventDefault();
        onDropNode();
      }}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="tenant-web__platform-builder-canvas-item-main">
        {canMoveItems ? (
          <span className="tenant-web__platform-builder-drag-handle" title={t("tenant.platformBuilder.forms.builder.dragToReorder")}>
            <DragHandleIcon />
          </span>
        ) : null}
        <span className="tenant-web__platform-builder-item-icon tenant-web__platform-builder-item-icon--canvas">
          <FormBuilderElementIcon iconKey={node.type === "field" ? (object.fields.find((field) => field.id === node.fieldId)?.kind ?? "field") : node.type} />
        </span>
        <div className="tenant-web__platform-builder-canvas-copy">
          <span className="tenant-web__platform-builder-canvas-item-title">{getFormBuilderDisplayLabel(node, object)}</span>
          <span className="tenant-web__platform-builder-canvas-item-summary">{summary}</span>
        </div>
      </div>

      <div className="tenant-web__platform-builder-canvas-actions">
        {isContainer ? (
          <>
            {isCurrentLevel ? (
              <Badge appearance="soft" size="sm" variant="brand">
                {t("tenant.platformBuilder.forms.builder.currentLevelBadge")}
              </Badge>
            ) : (
              <Button onClick={onOpenLevel} size="sm" variant="secondary">
                {t("tenant.platformBuilder.forms.builder.openLevel")}
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function FormsScreenWorkspacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const currentActor = getFormsPlaceholderActor(undefined);
  const [objects, setObjects] = useFormsPlaceholderObjects();
  const object = getFormsPlaceholderObject(params.objectId, objects);
  const screen = getFormsPlaceholderScreen(params.objectId, params.screenId, objects);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("selection");
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [deleteNodeOpen, setDeleteNodeOpen] = useState(false);
  const [savePulse, setSavePulse] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  if (!object || !screen) {
    return (
      <Card className="tenant-web__platform-builder-missing">
        <CardHeader>
          <div>
            <CardTitle>{t("tenant.platformBuilder.forms.missingTitle")}</CardTitle>
            <CardDescription>{t("tenant.platformBuilder.forms.missingDescription")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="tenant-web__platform-builder-row">
          <Button onClick={() => navigate(platformBuilderPaths.forms)} variant="outline">
            {t("tenant.platformBuilder.forms.backToForms")}
          </Button>
          {params.objectId ? (
            <Button onClick={() => navigate(platformBuilderPaths.object(params.objectId ?? ""))} variant="ghost">
              {t("tenant.platformBuilder.forms.backToObject")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const currentObject = object;
  const currentScreen = screen;

  const access = getFormsAuthoringAccess(currentActor, currentObject);
  const workspaceAccess = getFormsWorkspaceAccess(access, currentObject);
  const {
    document,
    isDirty: isDocumentDirty,
    saveDocument,
    setDocument,
  } = useFormBuilderDocument(currentObject, currentScreen);
  const [draftScreenTitle, setDraftScreenTitle] = useState(currentScreen.title);
  const [draftScreenIsActive, setDraftScreenIsActive] = useState(currentScreen.isActive);
  const currentNodes = getCurrentFormBuilderChildren(document);
  const selectedNode = getFormBuilderNode(document, document.selectedNodeId);
  const currentParentNode = getFormBuilderNode(document, document.currentParentId);
  const breadcrumb = getFormBuilderBreadcrumb(document);
  const elementItems = getElementPaletteItems(document, workspaceAccess, paletteQuery);
  const fieldItems = getFieldPaletteItems(document, currentObject, workspaceAccess, paletteQuery);
  const hasPendingScreenChanges =
    draftScreenTitle !== currentScreen.title || draftScreenIsActive !== currentScreen.isActive;
  const hasUnsavedChanges = isDocumentDirty || hasPendingScreenChanges;
  const pendingNavigationPathRef = useRef<string | null>(null);
  const pendingLeaveResolverRef = useRef<((value: boolean) => void) | null>(null);

  useBeforeUnload((event) => {
    if (!hasUnsavedChanges) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });

  useEffect(() => {
    setDraftScreenTitle(currentScreen.title);
    setDraftScreenIsActive(currentScreen.isActive);
  }, [currentScreen.id, currentScreen.isActive, currentScreen.title]);

  useEffect(() => {
    window.__tenantPlatformBuilderLeaveGuard = () => {
      if (!hasUnsavedChanges) {
        return true;
      }

      return new Promise<boolean>((resolve) => {
        pendingLeaveResolverRef.current = resolve;
        pendingNavigationPathRef.current = null;
        setLeaveConfirmOpen(true);
      });
    };

    return () => {
      if (window.__tenantPlatformBuilderLeaveGuard) {
        delete window.__tenantPlatformBuilderLeaveGuard;
      }
    };
  }, [hasUnsavedChanges]);

  const paletteSections = useMemo(
    () => [
      {
        items: elementItems.filter((item) => item.category === "layout"),
        key: "layout" as const,
      },
      {
        items: elementItems.filter((item) => item.category === "containers"),
        key: "containers" as const,
      },
      {
        items: elementItems.filter((item) => item.category === "content"),
        key: "content" as const,
      },
      {
        items: fieldItems,
        key: "fields" as const,
      },
    ].filter((section) => section.items.length > 0),
    [elementItems, fieldItems],
  );

  function updateDocument(updater: (currentDocument: typeof document) => typeof document) {
    setDocument((currentDocument) => updater(currentDocument));
  }

  function updateObjects(
    updater: (currentObjects: typeof objects) => typeof objects,
  ) {
    setObjects((currentObjects) => updater(currentObjects));
  }

  function updateScreenMetadata(
    updates: Partial<typeof currentScreen>,
  ) {
    updateObjects((currentObjects) =>
      currentObjects.map((entry) => {
        if (entry.id !== currentObject.id) {
          return entry;
        }

        return {
          ...entry,
          screens: entry.screens.map((item) =>
            item.id === currentScreen.id
              ? {
                  ...item,
                  ...updates,
                }
              : (updates.isActive ? { ...item, isActive: false } : item),
          ),
        };
      }),
    );
  }

  const currentLevelLabel = currentParentNode
    ? getFormBuilderDisplayLabel(currentParentNode, currentObject)
    : t("tenant.platformBuilder.forms.builder.rootLevel");
  const canDragItems = workspaceAccess.canMoveItems && currentNodes.length > 1;
  const selectedNodeLabel = selectedNode ? getFormBuilderDisplayLabel(selectedNode, currentObject) : "";

  function handleSave() {
    saveDocument();

    if (hasPendingScreenChanges) {
      updateScreenMetadata({
        isActive: draftScreenIsActive,
        title: draftScreenTitle,
      });
    }

    setSavePulse(true);
    window.setTimeout(() => setSavePulse(false), 1200);
  }

  function resolveLeaveConfirmation(shouldLeave: boolean) {
    const pendingPath = pendingNavigationPathRef.current;
    const pendingResolver = pendingLeaveResolverRef.current;

    pendingNavigationPathRef.current = null;
    pendingLeaveResolverRef.current = null;
    setLeaveConfirmOpen(false);

    if (pendingResolver) {
      pendingResolver(shouldLeave);
      return;
    }

    if (shouldLeave && pendingPath) {
      navigate(pendingPath);
    }
  }

  function requestNavigate(nextPath: string) {
    if (!hasUnsavedChanges) {
      navigate(nextPath);
      return;
    }

    pendingNavigationPathRef.current = nextPath;
    pendingLeaveResolverRef.current = null;
    setLeaveConfirmOpen(true);
  }

  return (
    <div className="tenant-web__platform-builder-shell tenant-web__platform-builder-shell--desktop-panels">
      <PlatformBuilderTabs onFormsNavigate={() => requestNavigate(platformBuilderPaths.forms)} />

      <div className="tenant-web__platform-builder-workspace-topline">
        <div className="tenant-web__platform-builder-panel-actions">
          <Button
            leadingIcon={<BackArrowIcon />}
            onClick={() => requestNavigate(platformBuilderPaths.object(object.id))}
            variant="ghost"
          >
            {t("tenant.platformBuilder.forms.backToObject")}
          </Button>
          <Button
            disabled={!hasUnsavedChanges && !savePulse}
            onClick={handleSave}
            size="sm"
            variant={savePulse ? "secondary" : "primary"}
          >
            {savePulse
              ? t("tenant.platformBuilder.forms.builder.savedAction")
              : t("tenant.platformBuilder.forms.builder.saveAction")}
          </Button>
        </div>
        <div className="tenant-web__platform-builder-badge-row">
          <Badge appearance="soft" size="sm" variant="brand">
            {currentObject.title}
          </Badge>
          <Badge appearance="soft" size="sm" variant="info">
            {t(getScreenKindKey(currentScreen.kind))}
          </Badge>
          {currentObject.isStructureLocked ? (
            <Badge appearance="soft" size="sm" variant="warning">
              {t("tenant.platformBuilder.forms.structureLocked")}
            </Badge>
          ) : null}
          {currentObject.canEditScreensOnly ? (
            <Badge appearance="soft" size="sm" variant="info">
              {t("tenant.platformBuilder.forms.canEditScreensOnly")}
            </Badge>
          ) : null}
        </div>
      </div>

      <section className="tenant-web__platform-builder-builder-grid">
        <Card className="tenant-web__platform-builder-panel">
          <CardContent className="tenant-web__platform-builder-panel-content tenant-web__platform-builder-panel-content--split">
            <div className="tenant-web__platform-builder-panel-static tenant-web__platform-builder-panel-static--compact-x">
              <div className="tenant-web__platform-builder-search">
                <div className="tenant-web__platform-builder-search-field">
                  <span className="tenant-web__platform-builder-search-icon">
                    <SearchIcon />
                  </span>
                  <Input
                    className="tenant-web__platform-builder-search-input"
                    id="tenant-platform-builder-palette-search"
                    onChange={(event) => setPaletteQuery(event.target.value)}
                    placeholder={t("tenant.platformBuilder.forms.builder.searchPlaceholder")}
                    value={paletteQuery}
                  />
                </div>
              </div>
            </div>

            <PlatformBuilderPanelScroll>
              <div className="tenant-web__platform-builder-builder-panel-body tenant-web__platform-builder-builder-panel-body--compact tenant-web__platform-builder-builder-panel-body--compact-x tenant-web__platform-builder-builder-panel-body--scroll tenant-web__platform-builder-builder-panel-body--workspace-scroll tenant-web__platform-builder-builder-panel-body--palette-scroll">
                <div className="tenant-web__platform-builder-palette">
                  {paletteSections.map((section) => (
                    <section className="tenant-web__platform-builder-palette-section" key={section.key}>
                      <h3 className="tenant-web__platform-builder-palette-heading">
                        {t(getPaletteCategoryKey(section.key))}
                      </h3>
                      <div className="tenant-web__platform-builder-palette-list">
                        {section.items.map((item) => {
                          if (item.kind === "element") {
                            return (
                              <PaletteItem
                                description={t(item.descriptionKey)}
                                disabled={item.disabled}
                                disabledReason={item.disabledReasonKey ? t(item.disabledReasonKey) : null}
                                iconKey={item.iconKey}
                                key={item.nodeType}
                                label={t(item.labelKey)}
                                onClick={() => updateDocument((currentDocument) =>
                                  addFormBuilderElementNode(currentDocument, currentDocument.currentParentId, item.nodeType)
                                )}
                              />
                            );
                          }

                          return (
                            <PaletteItem
                              description={t(item.descriptionKey)}
                              disabled={item.disabled}
                              disabledReason={item.disabledReasonKey ? t(item.disabledReasonKey) : null}
                              iconKey={item.iconKey}
                              key={item.field.id}
                              label={item.field.label}
                              onClick={() => updateDocument((currentDocument) =>
                                addFormBuilderFieldNode(currentDocument, currentDocument.currentParentId, item.field)
                              )}
                            />
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  {paletteSections.length === 0 ? (
                    <div className="tenant-web__platform-builder-empty-state tenant-web__platform-builder-builder-empty">
                      <p>{t("tenant.platformBuilder.forms.builder.noPaletteResults")}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </PlatformBuilderPanelScroll>
          </CardContent>
        </Card>

        <Card className="tenant-web__platform-builder-panel">
          <CardContent className="tenant-web__platform-builder-panel-content tenant-web__platform-builder-panel-content--split">
            <div className="tenant-web__platform-builder-panel-static tenant-web__platform-builder-panel-static--compact-x">
              <div className="tenant-web__platform-builder-workspace-header">
                <p className="tenant-web__platform-builder-workspace-title">{draftScreenTitle}</p>
                <Breadcrumb className="tenant-web__platform-builder-workspace-breadcrumbs">
                  <BreadcrumbList>
                    {document.currentParentId ? (
                      <>
                        <BreadcrumbItem>
                          <button
                            className="tenant-web__platform-builder-breadcrumb-button"
                            onClick={() => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, null))}
                            type="button"
                          >
                            {t("tenant.platformBuilder.forms.builder.rootLevel")}
                          </button>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        {breadcrumb.map((node, index) => {
                          const label = getFormBuilderDisplayLabel(node, currentObject);
                          const isLast = index === breadcrumb.length - 1;

                          return (
                            <Fragment key={node.id}>
                              <BreadcrumbItem>
                                {isLast ? (
                                  <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                  <button
                                    className="tenant-web__platform-builder-breadcrumb-button"
                                    onClick={() => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, node.id))}
                                    type="button"
                                  >
                                    {label}
                                  </button>
                                )}
                              </BreadcrumbItem>
                              {!isLast ? <BreadcrumbSeparator>/</BreadcrumbSeparator> : null}
                            </Fragment>
                          );
                        })}
                      </>
                    ) : (
                      <BreadcrumbItem>
                        <BreadcrumbPage>{currentLevelLabel}</BreadcrumbPage>
                      </BreadcrumbItem>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>

            <PlatformBuilderPanelScroll>
              <div className="tenant-web__platform-builder-builder-panel-body tenant-web__platform-builder-builder-panel-body--compact tenant-web__platform-builder-builder-panel-body--compact-x tenant-web__platform-builder-builder-panel-body--scroll tenant-web__platform-builder-builder-panel-body--workspace-scroll">
                <div className="tenant-web__platform-builder-canvas-list">
                  {currentNodes.length > 0 ? (
                    currentNodes.map((node) => (
                      <CanvasNodeRow
                        canMoveItems={canDragItems}
                        currentLevelId={document.currentParentId}
                        document={document}
                        dragOverNodeId={dragOverNodeId}
                        draggedNodeId={draggedNodeId}
                        key={node.id}
                        node={node}
                        object={currentObject}
                        onDragEnd={() => {
                          setDraggedNodeId(null);
                          setDragOverNodeId(null);
                        }}
                        onDragOverNode={() => setDragOverNodeId(node.id)}
                        onDragStartNode={() => {
                          setDraggedNodeId(node.id);
                          setDragOverNodeId(node.id);
                        }}
                        onDropNode={() => {
                          if (!draggedNodeId || draggedNodeId === node.id) {
                            setDragOverNodeId(null);
                            return;
                          }

                          updateDocument((currentDocument) =>
                            reorderFormBuilderNode(currentDocument, draggedNodeId, node.id)
                          );
                          setDraggedNodeId(null);
                          setDragOverNodeId(null);
                        }}
                        onOpenLevel={() => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, node.id))}
                        onSelect={() => {
                          updateDocument((currentDocument) => selectFormBuilderNode(currentDocument, node.id));
                          setInspectorTab("selection");
                        }}
                        selectedNodeId={document.selectedNodeId}
                        t={t}
                        workspaceDocumentChildrenCount={getFormBuilderChildren(document, node.id).length}
                      />
                    ))
                  ) : (
                    <div className="tenant-web__platform-builder-empty-state tenant-web__platform-builder-builder-empty">
                      <p>
                        {workspaceAccess.canAddItems
                          ? t("tenant.platformBuilder.forms.builder.canvasEmpty")
                          : t("tenant.platformBuilder.forms.builder.canvasEmptyLocked")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </PlatformBuilderPanelScroll>
          </CardContent>
        </Card>

        <Card className="tenant-web__platform-builder-panel">
          <CardContent className="tenant-web__platform-builder-panel-content tenant-web__platform-builder-panel-content--split">
            <Tabs
              defaultValue="selection"
              onValueChange={(value) => setInspectorTab(value as InspectorTab)}
              value={inspectorTab}
              variant="surface"
            >
              <div className="tenant-web__platform-builder-panel-static">
                <div className="tenant-web__platform-builder-inspector-tabs">
                  <TabsList>
                    <TabsTrigger value="selection">{t("tenant.platformBuilder.forms.builder.selectionTab")}</TabsTrigger>
                    <TabsTrigger value="view">{t("tenant.platformBuilder.forms.builder.viewTab")}</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <PlatformBuilderPanelScroll>
                <div className="tenant-web__platform-builder-builder-panel-body tenant-web__platform-builder-builder-panel-body--compact tenant-web__platform-builder-builder-panel-body--scroll tenant-web__platform-builder-builder-panel-body--workspace-scroll">
                  <TabsPanel value="selection">
                    {selectedNode ? (
                      <div className="tenant-web__platform-builder-inspector-section">
                        <div className="tenant-web__platform-builder-inspector-head">
                          <span className="tenant-web__platform-builder-item-icon">
                            <FormBuilderElementIcon iconKey={selectedNode.type === "field" ? (object.fields.find((field) => field.id === selectedNode.fieldId)?.kind ?? "field") : selectedNode.type} />
                          </span>
                          <div>
                            <p className="tenant-web__platform-builder-inspector-title">{getFormBuilderDisplayLabel(selectedNode, currentObject)}</p>
                            <p className="tenant-web__platform-builder-inspector-meta">{t(getNodeTypeKey(selectedNode.type))}</p>
                          </div>
                        </div>

                        {workspaceAccess.canEditSettings ? (
                          <div className="tenant-web__platform-builder-form">
                            {selectedNode.type === "field" ? (
                              <>
                                <div className="tenant-web__platform-builder-form-group">
                                  <Label htmlFor="tenant-platform-builder-bound-field">
                                    {t("tenant.platformBuilder.forms.builder.boundFieldLabel")}
                                  </Label>
                                  <Input
                                    disabled
                                    id="tenant-platform-builder-bound-field"
                                    value={currentObject.fields.find((field) => field.id === selectedNode.fieldId)?.label ?? ""}
                                  />
                                </div>
                                <div className="tenant-web__platform-builder-form-group">
                                  <Label htmlFor="tenant-platform-builder-node-title">
                                    {t("tenant.platformBuilder.forms.builder.nodeTitleLabel")}
                                  </Label>
                                  <Input
                                    id="tenant-platform-builder-node-title"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                    )}
                                    value={selectedNode.title ?? ""}
                                  />
                                </div>
                                <div className="tenant-web__platform-builder-form-group">
                                  <Label htmlFor="tenant-platform-builder-node-visibility">
                                    {t("tenant.platformBuilder.forms.builder.nodeVisibilityLabel")}
                                  </Label>
                                  <Select
                                    id="tenant-platform-builder-node-visibility"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, {
                                        visibility: event.target.value as FormBuilderNode["visibility"],
                                      })
                                    )}
                                    value={selectedNode.visibility}
                                  >
                                    <option value="visible">{t("tenant.platformBuilder.forms.builder.visibility.visible")}</option>
                                    <option value="readonly">{t("tenant.platformBuilder.forms.builder.visibility.readonly")}</option>
                                    <option value="hidden">{t("tenant.platformBuilder.forms.builder.visibility.hidden")}</option>
                                  </Select>
                                </div>
                                <div className="tenant-web__platform-builder-form-group">
                                  <Label htmlFor="tenant-platform-builder-node-helper">
                                    {t("tenant.platformBuilder.forms.builder.nodeHelperLabel")}
                                  </Label>
                                  <Textarea
                                    id="tenant-platform-builder-node-helper"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, { helperText: event.target.value })
                                    )}
                                    rows={4}
                                    value={selectedNode.helperText ?? ""}
                                  />
                                </div>
                              </>
                            ) : selectedNode.type === "text" ? (
                              <>
                                <div className="tenant-web__platform-builder-form-group">
                                  <Label htmlFor="tenant-platform-builder-node-title">
                                    {t("tenant.platformBuilder.forms.builder.nodeTitleLabel")}
                                  </Label>
                                  <Input
                                    id="tenant-platform-builder-node-title"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                    )}
                                    value={selectedNode.title ?? ""}
                                  />
                                </div>
                                <div className="tenant-web__platform-builder-form-group">
                                  <Label htmlFor="tenant-platform-builder-node-text">
                                    {t("tenant.platformBuilder.forms.builder.nodeTextLabel")}
                                  </Label>
                                  <Textarea
                                    id="tenant-platform-builder-node-text"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, { text: event.target.value })
                                    )}
                                    rows={5}
                                    value={selectedNode.text ?? ""}
                                  />
                                </div>
                              </>
                            ) : selectedNode.type === "divider" ? (
                              <p className="tenant-web__platform-builder-inline-help">
                                {t("tenant.platformBuilder.forms.builder.noAdvancedSettings")}
                              </p>
                            ) : (
                              <div className="tenant-web__platform-builder-form-group">
                                <Label htmlFor="tenant-platform-builder-node-title">
                                  {t("tenant.platformBuilder.forms.builder.nodeTitleLabel")}
                                </Label>
                                <Input
                                  id="tenant-platform-builder-node-title"
                                  onChange={(event) => updateDocument((currentDocument) =>
                                    updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                  )}
                                  value={selectedNode.title ?? ""}
                                />
                              </div>
                            )}

                            {selectedNode.type !== "divider" && selectedNode.type !== "field" ? (
                              <div className="tenant-web__platform-builder-form-group">
                                <Label htmlFor="tenant-platform-builder-node-visibility">
                                  {t("tenant.platformBuilder.forms.builder.nodeVisibilityLabel")}
                                </Label>
                                <Select
                                  id="tenant-platform-builder-node-visibility"
                                  onChange={(event) => updateDocument((currentDocument) =>
                                    updateFormBuilderNode(currentDocument, selectedNode.id, {
                                      visibility: event.target.value as FormBuilderNode["visibility"],
                                    })
                                  )}
                                  value={selectedNode.visibility}
                                >
                                  <option value="visible">{t("tenant.platformBuilder.forms.builder.visibility.visible")}</option>
                                  <option value="readonly">{t("tenant.platformBuilder.forms.builder.visibility.readonly")}</option>
                                  <option value="hidden">{t("tenant.platformBuilder.forms.builder.visibility.hidden")}</option>
                                </Select>
                              </div>
                            ) : null}

                            {!workspaceAccess.canRemoveItems ? (
                              <p className="tenant-web__platform-builder-inline-help">
                                {t("tenant.platformBuilder.forms.builder.lockedStructureHint")}
                              </p>
                            ) : null}

                            {workspaceAccess.canRemoveItems ? (
                              <div className="tenant-web__platform-builder-danger-zone">
                                <Button
                                  onClick={() => setDeleteNodeOpen(true)}
                                  variant="danger"
                                >
                                  {t("tenant.platformBuilder.forms.builder.deleteNode")}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <p className="tenant-web__platform-builder-inline-help">
                            {t(access.viewRestrictionKey ?? "tenant.platformBuilder.forms.permission.readonly")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="tenant-web__platform-builder-empty-state tenant-web__platform-builder-builder-empty">
                        <p className="tenant-web__platform-builder-empty-title">
                          {t("tenant.platformBuilder.forms.builder.selectionEmptyTitle")}
                        </p>
                        <p>{t("tenant.platformBuilder.forms.builder.selectionEmptyDescription")}</p>
                      </div>
                    )}
                  </TabsPanel>

                  <TabsPanel value="view">
                    <div className="tenant-web__platform-builder-form">
                      <div className="tenant-web__platform-builder-form-group">
                          <Label htmlFor="tenant-platform-builder-view-title">
                            {t("tenant.platformBuilder.forms.builder.viewTitleLabel")}
                          </Label>
                          <Input
                            disabled={!workspaceAccess.canEditSettings}
                            id="tenant-platform-builder-view-title"
                            onChange={(event) => setDraftScreenTitle(event.target.value)}
                            value={draftScreenTitle}
                          />
                      </div>

                      <div className="tenant-web__platform-builder-form-group">
                        <Label htmlFor="tenant-platform-builder-view-type">
                          {t("tenant.platformBuilder.forms.builder.viewTypeLabel")}
                        </Label>
                        <Input
                          disabled
                          id="tenant-platform-builder-view-type"
                          value={t(getScreenKindKey(screen.kind))}
                        />
                      </div>

                      <div className="tenant-web__platform-builder-form-group">
                        <Label htmlFor="tenant-platform-builder-view-description">
                          {t("tenant.platformBuilder.forms.builder.viewDescriptionLabel")}
                        </Label>
                        <Textarea
                          disabled={!workspaceAccess.canEditSettings}
                          id="tenant-platform-builder-view-description"
                          onChange={(event) => updateDocument((currentDocument) => ({
                            ...currentDocument,
                            viewDescription: event.target.value,
                          }))}
                          rows={5}
                          value={document.viewDescription}
                        />
                      </div>

                      <label className="tenant-web__platform-builder-checkbox-row">
                        <Checkbox
                          checked={draftScreenIsActive}
                          disabled={!workspaceAccess.canEditSettings}
                          onChange={(event) => setDraftScreenIsActive(event.target.checked)}
                        />
                        <span>{t("tenant.platformBuilder.forms.builder.activeViewLabel")}</span>
                      </label>
                    </div>
                  </TabsPanel>
                </div>
              </PlatformBuilderPanelScroll>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <AlertDialog onOpenChange={setDeleteNodeOpen} open={deleteNodeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tenant.platformBuilder.forms.builder.confirmDeleteNode", { title: selectedNodeLabel })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tenant.platformBuilder.forms.builder.confirmDeleteNodeDescription", { title: selectedNodeLabel })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("tenant.platformBuilder.forms.cancelDelete")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selectedNode) {
                  setDeleteNodeOpen(false);
                  return;
                }

                updateDocument((currentDocument) => removeFormBuilderNode(currentDocument, selectedNode.id));
                setDeleteNodeOpen(false);
              }}
              variant="danger"
            >
              {t("tenant.platformBuilder.forms.builder.deleteNode")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && leaveConfirmOpen) {
            resolveLeaveConfirmation(false);
          }
        }}
        open={leaveConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tenant.platformBuilder.forms.builder.unsavedLeaveTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tenant.platformBuilder.forms.builder.unsavedLeaveDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => resolveLeaveConfirmation(false)}
            >
              {t("tenant.platformBuilder.forms.builder.stayAction")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resolveLeaveConfirmation(true)}
              variant="danger"
            >
              {t("tenant.platformBuilder.forms.builder.leaveWithoutSavingAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
