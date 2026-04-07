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

import { PlatformStudioTabs } from "../../platform-studio-tabs";
import { PlatformStudioPanelScroll } from "../../platform-studio-panel-scroll";
import { platformStudioPaths } from "../../platform-studio-route-meta";
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
  isFormBuilderContainer,
  reorderFormBuilderNode,
  removeFormBuilderNode,
  selectFormBuilderNode,
  setFormBuilderCurrentParent,
  updateFormBuilderNode,
  useFormBuilderDocument,
  type FormBuilderNode,
} from "../forms-builder-state";
import {
  getFormsAuthoringAccess,
  getFormsPlaceholderActor,
} from "../forms-actors";
import {
  getFormsPlaceholderFieldIconKey,
  getFormsPlaceholderModel,
  type FormsPlaceholderField,
  getFormsPlaceholderView,
  useFormsPlaceholderModels,
} from "../forms-placeholder-data";

type InspectorTab = "selection" | "view";
type PaletteSectionKey =
  | "advancedFields"
  | "choiceFields"
  | "containers"
  | "content"
  | "coreFields"
  | "layout"
  | "presets";

declare global {
  interface Window {
    __tenantPlatformStudioLeaveGuard?: () => boolean | Promise<boolean>;
  }
}

function getViewKindKey(kind: "detail" | "form") {
  return `tenant.platformStudio.forms.screenKind.${kind}`;
}

function getPaletteCategoryKey(category: PaletteSectionKey) {
  return `tenant.platformStudio.forms.builder.category.${category}`;
}

function getNodeTypeKey(nodeType: FormBuilderNode["type"]) {
  return `tenant.platformStudio.forms.builder.nodeType.${nodeType}`;
}

function getFieldTypeKey(field: FormsPlaceholderField) {
  return `tenant.platformStudio.forms.builder.fieldType.${field.kind}`;
}

function getFieldPresetKey(preset: NonNullable<FormsPlaceholderField["preset"]>) {
  return `tenant.platformStudio.forms.builder.fieldPreset.${preset}`;
}

function getFieldFamilyKey(field: FormsPlaceholderField) {
  return `tenant.platformStudio.forms.builder.fieldFamily.${field.family}`;
}

function getFieldPaletteDescription(
  field: FormsPlaceholderField,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const typeLabel = t(getFieldTypeKey(field));

  if (field.kind === "db_lookup") {
    return `${typeLabel} / ${field.sourceLabel ?? t("tenant.platformStudio.forms.builder.fieldMeta.lookupReady")}`;
  }

  if (field.kind === "long_text" && field.historicalUpdates) {
    return `${typeLabel} / ${t("tenant.platformStudio.forms.builder.fieldMeta.historyEnabled")}`;
  }

  if (field.preset) {
    return `${typeLabel} / ${t(getFieldPresetKey(field.preset))}`;
  }

  if (field.options?.length) {
    return `${typeLabel} / ${t("tenant.platformStudio.forms.builder.fieldMeta.optionsCount", { count: field.options.length })}`;
  }

  return typeLabel;
}

function getFieldInspectorMeta(
  field: FormsPlaceholderField,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const rows = [
    {
      label: t("tenant.platformStudio.forms.builder.fieldMeta.family"),
      value: t(getFieldFamilyKey(field)),
    },
    {
      label: t("tenant.platformStudio.forms.builder.fieldMeta.baseType"),
      value: t(getFieldTypeKey(field)),
    },
  ];

  if (field.preset) {
    rows.push({
      label: t("tenant.platformStudio.forms.builder.fieldMeta.preset"),
      value: t(getFieldPresetKey(field.preset)),
    });
  }

  if (field.kind === "long_text") {
    rows.push({
      label: t("tenant.platformStudio.forms.builder.fieldMeta.historicalUpdates"),
      value: field.historicalUpdates
        ? t("tenant.platformStudio.forms.builder.fieldMeta.enabled")
        : t("tenant.platformStudio.forms.builder.fieldMeta.disabled"),
    });
  }

  if (field.options?.length) {
    rows.push({
      label: t("tenant.platformStudio.forms.builder.fieldMeta.options"),
      value: field.options.join(", "),
    });
  }

  if (field.sourceLabel) {
    rows.push({
      label: t("tenant.platformStudio.forms.builder.fieldMeta.lookupSource"),
      value: field.sourceLabel,
    });
  }

  if (field.displayFields?.length) {
    rows.push({
      label: t("tenant.platformStudio.forms.builder.fieldMeta.displayFields"),
      value: field.displayFields.join(", "),
    });
  }

  if (field.sourceFilters?.length) {
    rows.push({
      label: t("tenant.platformStudio.forms.builder.fieldMeta.sourceFilters"),
      value: field.sourceFilters.join(", "),
    });
  }

  if (field.dependentFilter) {
    rows.push({
      label: t("tenant.platformStudio.forms.builder.fieldMeta.dependentFilter"),
      value: field.dependentFilter,
    });
  }

  return rows;
}

function getSummaryText(
  node: FormBuilderNode,
  objectTitle: string,
  objectFields: ReadonlyArray<{ id: string; isLocked: boolean; label: string }>,
  summaryKey: string,
  t: ReturnType<typeof useTranslation>["t"],
  childrenCount: number,
) {
  if (summaryKey === "tenant.platformStudio.forms.builder.summary.children") {
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
      className="tenant-web__platform-studio-back-icon"
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
      className={`tenant-web__platform-studio-palette-item${disabled ? " tenant-web__platform-studio-palette-item--disabled" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={disabledReason ?? undefined}
      type="button"
    >
      <span className="tenant-web__platform-studio-item-icon">
        <FormBuilderElementIcon iconKey={iconKey} />
      </span>
      <span className="tenant-web__platform-studio-palette-copy">
        <span className="tenant-web__platform-studio-palette-title">{label}</span>
        <span className="tenant-web__platform-studio-palette-description">{description}</span>
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
  object: NonNullable<ReturnType<typeof getFormsPlaceholderModel>>;
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
  const isContainer = isFormBuilderContainer(node.type);
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
      className={`tenant-web__platform-studio-canvas-item${isSelected ? " tenant-web__platform-studio-canvas-item--selected" : ""}${isDragging ? " tenant-web__platform-studio-canvas-item--dragging" : ""}${isDropTarget ? " tenant-web__platform-studio-canvas-item--drop-target" : ""}`}
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
      <div className="tenant-web__platform-studio-canvas-item-main">
        {canMoveItems ? (
          <span className="tenant-web__platform-studio-drag-handle" title={t("tenant.platformStudio.forms.builder.dragToReorder")}>
            <DragHandleIcon />
          </span>
        ) : null}
        <span className="tenant-web__platform-studio-item-icon tenant-web__platform-studio-item-icon--canvas">
          <FormBuilderElementIcon
            iconKey={
              node.type === "field"
                ? getFormsPlaceholderFieldIconKey(object.fields.find((field) => field.id === node.fieldId) ?? {
                  family: "core",
                  id: "missing-field",
                  isLocked: false,
                  kind: "text",
                  label: "Field",
                })
                : node.type
            }
          />
        </span>
        <div className="tenant-web__platform-studio-canvas-copy">
          <span className="tenant-web__platform-studio-canvas-item-title">{getFormBuilderDisplayLabel(node, object)}</span>
          <span className="tenant-web__platform-studio-canvas-item-summary">{summary}</span>
        </div>
      </div>

      <div className="tenant-web__platform-studio-canvas-actions">
        {isContainer ? (
          <>
            {isCurrentLevel ? (
              <Badge appearance="soft" size="sm" variant="brand">
                {t("tenant.platformStudio.forms.builder.currentLevelBadge")}
              </Badge>
            ) : (
              <Button onClick={onOpenLevel} size="sm" variant="secondary">
                {t("tenant.platformStudio.forms.builder.openLevel")}
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function FormsViewWorkspacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const currentActor = getFormsPlaceholderActor(undefined);
  const [models, setModels] = useFormsPlaceholderModels();
  const model = getFormsPlaceholderModel(params.modelId, models);
  const view = getFormsPlaceholderView(params.modelId, params.viewId, models);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("selection");
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [deleteNodeOpen, setDeleteNodeOpen] = useState(false);
  const [savePulse, setSavePulse] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  if (!model || !view) {
    return (
      <Card className="tenant-web__platform-studio-missing">
        <CardHeader>
          <div>
            <CardTitle>{t("tenant.platformStudio.forms.missingTitle")}</CardTitle>
            <CardDescription>{t("tenant.platformStudio.forms.missingDescription")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="tenant-web__platform-studio-row">
          <Button onClick={() => navigate(platformStudioPaths.forms)} variant="outline">
            {t("tenant.platformStudio.forms.backToForms")}
          </Button>
          {params.modelId ? (
            <Button onClick={() => navigate(platformStudioPaths.model(params.modelId ?? ""))} variant="ghost">
              {t("tenant.platformStudio.forms.backToModel")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const currentModel = model;
  const currentView = view;

  const access = getFormsAuthoringAccess(currentActor, currentModel);
  const workspaceAccess = getFormsWorkspaceAccess(access, currentModel);
  const {
    document,
    isDirty: isDocumentDirty,
    saveDocument,
    setDocument,
  } = useFormBuilderDocument(currentModel, currentView);
  const [draftViewTitle, setDraftViewTitle] = useState(currentView.title);
  const [draftViewIsActive, setDraftViewIsActive] = useState(currentView.isActive);
  const currentNodes = getCurrentFormBuilderChildren(document);
  const selectedNode = getFormBuilderNode(document, document.selectedNodeId);
  const selectedField =
    selectedNode?.type === "field"
      ? currentModel.fields.find((field) => field.id === selectedNode.fieldId) ?? null
      : null;
  const currentParentNode = getFormBuilderNode(document, document.currentParentId);
  const breadcrumb = getFormBuilderBreadcrumb(document);
  const elementItems = getElementPaletteItems(document, workspaceAccess, paletteQuery);
  const fieldItems = getFieldPaletteItems(document, currentModel, workspaceAccess, paletteQuery);
  const hasPendingViewChanges =
    draftViewTitle !== currentView.title || draftViewIsActive !== currentView.isActive;
  const hasUnsavedChanges = isDocumentDirty || hasPendingViewChanges;
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
    setDraftViewTitle(currentView.title);
    setDraftViewIsActive(currentView.isActive);
  }, [currentView.id, currentView.isActive, currentView.title]);

  useEffect(() => {
    window.__tenantPlatformStudioLeaveGuard = () => {
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
      if (window.__tenantPlatformStudioLeaveGuard) {
        delete window.__tenantPlatformStudioLeaveGuard;
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
        items: fieldItems.filter((item) => item.category === "core"),
        key: "coreFields" as const,
      },
      {
        items: fieldItems.filter((item) => item.category === "choice"),
        key: "choiceFields" as const,
      },
      {
        items: fieldItems.filter((item) => item.category === "advanced"),
        key: "advancedFields" as const,
      },
      {
        items: fieldItems.filter((item) => item.category === "preset"),
        key: "presets" as const,
      },
    ].filter((section) => section.items.length > 0),
    [elementItems, fieldItems],
  );

  function updateDocument(updater: (currentDocument: typeof document) => typeof document) {
    setDocument((currentDocument) => updater(currentDocument));
  }

  function updateObjects(
    updater: (currentModels: typeof models) => typeof models,
  ) {
    setModels((currentModels) => updater(currentModels));
  }

  function updateViewMetadata(
    updates: Partial<typeof currentView>,
  ) {
    updateObjects((currentModels) =>
      currentModels.map((entry) => {
        if (entry.id !== currentModel.id) {
          return entry;
        }

        return {
          ...entry,
          screens: entry.screens.map((item) =>
            item.id === currentView.id
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
    ? getFormBuilderDisplayLabel(currentParentNode, currentModel)
    : t("tenant.platformStudio.forms.builder.rootLevel");
  const canDragItems = workspaceAccess.canMoveItems && currentNodes.length > 1;
  const selectedNodeLabel = selectedNode ? getFormBuilderDisplayLabel(selectedNode, currentModel) : "";

  function handleSave() {
    saveDocument();

    if (hasPendingViewChanges) {
      updateViewMetadata({
        isActive: draftViewIsActive,
        title: draftViewTitle,
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
    <div className="tenant-web__platform-studio-shell tenant-web__platform-studio-shell--desktop-panels">
      <PlatformStudioTabs onFormsNavigate={() => requestNavigate(platformStudioPaths.forms)} />

      <div className="tenant-web__platform-studio-workspace-topline">
        <div className="tenant-web__platform-studio-panel-actions">
          <Button
            leadingIcon={<BackArrowIcon />}
            onClick={() => requestNavigate(platformStudioPaths.model(currentModel.id))}
            variant="ghost"
          >
            {t("tenant.platformStudio.forms.backToModel")}
          </Button>
          <Button
            disabled={!hasUnsavedChanges && !savePulse}
            onClick={handleSave}
            size="sm"
            variant={savePulse ? "secondary" : "primary"}
          >
            {savePulse
              ? t("tenant.platformStudio.forms.builder.savedAction")
              : t("tenant.platformStudio.forms.builder.saveAction")}
          </Button>
        </div>
        <div className="tenant-web__platform-studio-badge-row">
          <Badge appearance="soft" size="sm" variant="brand">
            {currentModel.title}
          </Badge>
          <Badge appearance="soft" size="sm" variant="info">
            {t(getViewKindKey(currentView.kind))}
          </Badge>
          {currentModel.isStructureLocked ? (
            <Badge appearance="soft" size="sm" variant="warning">
              {t("tenant.platformStudio.forms.structureLocked")}
            </Badge>
          ) : null}
          {currentModel.canEditViewsOnly ? (
            <Badge appearance="soft" size="sm" variant="info">
              {t("tenant.platformStudio.forms.canEditViewsOnly")}
            </Badge>
          ) : null}
        </div>
      </div>

      <section className="tenant-web__platform-studio-builder-grid">
        <Card className="tenant-web__platform-studio-panel">
          <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
            <div className="tenant-web__platform-studio-panel-static tenant-web__platform-studio-panel-static--compact-x">
              <div className="tenant-web__platform-studio-search">
                <div className="tenant-web__platform-studio-search-field">
                  <span className="tenant-web__platform-studio-search-icon">
                    <SearchIcon />
                  </span>
                  <Input
                    className="tenant-web__platform-studio-search-input"
                    id="tenant-platform-studio-palette-search"
                    onChange={(event) => setPaletteQuery(event.target.value)}
                    placeholder={t("tenant.platformStudio.forms.builder.searchPlaceholder")}
                    value={paletteQuery}
                  />
                </div>
              </div>
            </div>

            <PlatformStudioPanelScroll>
              <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--compact-x tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll tenant-web__platform-studio-builder-panel-body--palette-scroll">
                <div className="tenant-web__platform-studio-palette">
                  {paletteSections.map((section) => (
                    <section className="tenant-web__platform-studio-palette-section" key={section.key}>
                      <h3 className="tenant-web__platform-studio-palette-heading">
                        {t(getPaletteCategoryKey(section.key))}
                      </h3>
                      <div className="tenant-web__platform-studio-palette-list">
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
                              description={getFieldPaletteDescription(item.field, t)}
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
                    <div className="tenant-web__platform-studio-empty-state tenant-web__platform-studio-builder-empty">
                      <p>{t("tenant.platformStudio.forms.builder.noPaletteResults")}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </PlatformStudioPanelScroll>
          </CardContent>
        </Card>

        <Card className="tenant-web__platform-studio-panel">
          <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
            <div className="tenant-web__platform-studio-panel-static tenant-web__platform-studio-panel-static--compact-x">
              <div className="tenant-web__platform-studio-workspace-header">
                <p className="tenant-web__platform-studio-workspace-title">{draftViewTitle}</p>
                <Breadcrumb className="tenant-web__platform-studio-workspace-breadcrumbs">
                  <BreadcrumbList>
                    {document.currentParentId ? (
                      <>
                        <BreadcrumbItem>
                          <button
                            className="tenant-web__platform-studio-breadcrumb-button"
                            onClick={() => updateDocument((currentDocument) => setFormBuilderCurrentParent(currentDocument, null))}
                            type="button"
                          >
                            {t("tenant.platformStudio.forms.builder.rootLevel")}
                          </button>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        {breadcrumb.map((node, index) => {
                          const label = getFormBuilderDisplayLabel(node, currentModel);
                          const isLast = index === breadcrumb.length - 1;

                          return (
                            <Fragment key={node.id}>
                              <BreadcrumbItem>
                                {isLast ? (
                                  <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                  <button
                                    className="tenant-web__platform-studio-breadcrumb-button"
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

            <PlatformStudioPanelScroll>
              <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--compact-x tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll">
                <div className="tenant-web__platform-studio-canvas-list">
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
                        object={currentModel}
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
                    <div className="tenant-web__platform-studio-empty-state tenant-web__platform-studio-builder-empty">
                      <p>
                        {workspaceAccess.canAddItems
                          ? t("tenant.platformStudio.forms.builder.canvasEmpty")
                          : t("tenant.platformStudio.forms.builder.canvasEmptyLocked")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </PlatformStudioPanelScroll>
          </CardContent>
        </Card>

        <Card className="tenant-web__platform-studio-panel">
          <CardContent className="tenant-web__platform-studio-panel-content tenant-web__platform-studio-panel-content--split">
            <Tabs
              defaultValue="selection"
              onValueChange={(value) => setInspectorTab(value as InspectorTab)}
              value={inspectorTab}
              variant="surface"
            >
              <div className="tenant-web__platform-studio-panel-static">
                <div className="tenant-web__platform-studio-inspector-tabs">
                  <TabsList>
                    <TabsTrigger value="selection">{t("tenant.platformStudio.forms.builder.selectionTab")}</TabsTrigger>
                    <TabsTrigger value="view">{t("tenant.platformStudio.forms.builder.viewTab")}</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <PlatformStudioPanelScroll>
                <div className="tenant-web__platform-studio-builder-panel-body tenant-web__platform-studio-builder-panel-body--compact tenant-web__platform-studio-builder-panel-body--scroll tenant-web__platform-studio-builder-panel-body--workspace-scroll">
                  <TabsPanel value="selection">
                    {selectedNode ? (
                      <div className="tenant-web__platform-studio-inspector-section">
                        <div className="tenant-web__platform-studio-inspector-head">
                          <span className="tenant-web__platform-studio-item-icon">
                            <FormBuilderElementIcon
                              iconKey={
                                selectedField
                                  ? getFormsPlaceholderFieldIconKey(selectedField)
                                  : selectedNode.type
                              }
                            />
                          </span>
                          <div>
                            <p className="tenant-web__platform-studio-inspector-title">{getFormBuilderDisplayLabel(selectedNode, currentModel)}</p>
                            <p className="tenant-web__platform-studio-inspector-meta">{t(getNodeTypeKey(selectedNode.type))}</p>
                          </div>
                        </div>

                        {workspaceAccess.canEditSettings ? (
                          <div className="tenant-web__platform-studio-form">
                            {selectedNode.type === "field" ? (
                              <>
                                <div className="tenant-web__platform-studio-form-group">
                                  <Label htmlFor="tenant-platform-studio-bound-field">
                                    {t("tenant.platformStudio.forms.builder.boundFieldLabel")}
                                  </Label>
                                  <Input
                                    disabled
                                    id="tenant-platform-studio-bound-field"
                                    value={selectedField?.label ?? ""}
                                  />
                                </div>
                                {selectedField ? (
                                  <div className="tenant-web__platform-studio-field-meta-grid">
                                    {getFieldInspectorMeta(selectedField, t).map((item) => (
                                      <div className="tenant-web__platform-studio-field-meta-item" key={item.label}>
                                        <span className="tenant-web__platform-studio-field-meta-label">{item.label}</span>
                                        <span className="tenant-web__platform-studio-field-meta-value">{item.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                {selectedField?.kind === "multi_select" ? (
                                  <p className="tenant-web__platform-studio-inline-help">
                                    {t("tenant.platformStudio.forms.builder.fieldMeta.multiSelectDeferred")}
                                  </p>
                                ) : null}
                                {selectedField?.kind === "db_lookup" ? (
                                  <p className="tenant-web__platform-studio-inline-help">
                                    {t("tenant.platformStudio.forms.builder.fieldMeta.dbLookupPlaceholder")}
                                  </p>
                                ) : null}
                                <div className="tenant-web__platform-studio-form-group">
                                  <Label htmlFor="tenant-platform-studio-node-title">
                                    {t("tenant.platformStudio.forms.builder.nodeTitleLabel")}
                                  </Label>
                                  <Input
                                    id="tenant-platform-studio-node-title"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                    )}
                                    value={selectedNode.title ?? ""}
                                  />
                                </div>
                                <div className="tenant-web__platform-studio-form-group">
                                  <Label htmlFor="tenant-platform-studio-node-visibility">
                                    {t("tenant.platformStudio.forms.builder.nodeVisibilityLabel")}
                                  </Label>
                                  <Select
                                    id="tenant-platform-studio-node-visibility"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, {
                                        visibility: event.target.value as FormBuilderNode["visibility"],
                                      })
                                    )}
                                    value={selectedNode.visibility}
                                  >
                                    <option value="visible">{t("tenant.platformStudio.forms.builder.visibility.visible")}</option>
                                    <option value="readonly">{t("tenant.platformStudio.forms.builder.visibility.readonly")}</option>
                                    <option value="hidden">{t("tenant.platformStudio.forms.builder.visibility.hidden")}</option>
                                  </Select>
                                </div>
                                <div className="tenant-web__platform-studio-form-group">
                                  <Label htmlFor="tenant-platform-studio-node-helper">
                                    {t("tenant.platformStudio.forms.builder.nodeHelperLabel")}
                                  </Label>
                                  <Textarea
                                    id="tenant-platform-studio-node-helper"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, { helperText: event.target.value })
                                    )}
                                    rows={4}
                                    value={selectedNode.helperText ?? ""}
                                  />
                                </div>
                              </>
                            ) : selectedNode.type === "text" || selectedNode.type === "rich_text" ? (
                              <>
                                <div className="tenant-web__platform-studio-form-group">
                                  <Label htmlFor="tenant-platform-studio-node-title">
                                    {t("tenant.platformStudio.forms.builder.nodeTitleLabel")}
                                  </Label>
                                  <Input
                                    id="tenant-platform-studio-node-title"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                    )}
                                    value={selectedNode.title ?? ""}
                                  />
                                </div>
                                <div className="tenant-web__platform-studio-form-group">
                                  <Label htmlFor="tenant-platform-studio-node-text">
                                    {t("tenant.platformStudio.forms.builder.nodeTextLabel")}
                                  </Label>
                                  <Textarea
                                    id="tenant-platform-studio-node-text"
                                    onChange={(event) => updateDocument((currentDocument) =>
                                      updateFormBuilderNode(currentDocument, selectedNode.id, { text: event.target.value })
                                    )}
                                    rows={5}
                                    value={selectedNode.text ?? ""}
                                  />
                                </div>
                              </>
                            ) : selectedNode.type === "divider" || selectedNode.type === "spacer" ? (
                              <p className="tenant-web__platform-studio-inline-help">
                                {t("tenant.platformStudio.forms.builder.noAdvancedSettings")}
                              </p>
                            ) : (
                              <div className="tenant-web__platform-studio-form-group">
                                <Label htmlFor="tenant-platform-studio-node-title">
                                  {t("tenant.platformStudio.forms.builder.nodeTitleLabel")}
                                </Label>
                                <Input
                                  id="tenant-platform-studio-node-title"
                                  onChange={(event) => updateDocument((currentDocument) =>
                                    updateFormBuilderNode(currentDocument, selectedNode.id, { title: event.target.value })
                                  )}
                                  value={selectedNode.title ?? ""}
                                />
                              </div>
                            )}

                            {selectedNode.type !== "divider" && selectedNode.type !== "field" ? (
                              <div className="tenant-web__platform-studio-form-group">
                                <Label htmlFor="tenant-platform-studio-node-visibility">
                                  {t("tenant.platformStudio.forms.builder.nodeVisibilityLabel")}
                                </Label>
                                <Select
                                  id="tenant-platform-studio-node-visibility"
                                  onChange={(event) => updateDocument((currentDocument) =>
                                    updateFormBuilderNode(currentDocument, selectedNode.id, {
                                      visibility: event.target.value as FormBuilderNode["visibility"],
                                    })
                                  )}
                                  value={selectedNode.visibility}
                                >
                                  <option value="visible">{t("tenant.platformStudio.forms.builder.visibility.visible")}</option>
                                  <option value="readonly">{t("tenant.platformStudio.forms.builder.visibility.readonly")}</option>
                                  <option value="hidden">{t("tenant.platformStudio.forms.builder.visibility.hidden")}</option>
                                </Select>
                              </div>
                            ) : null}

                            {!workspaceAccess.canRemoveItems ? (
                              <p className="tenant-web__platform-studio-inline-help">
                                {t("tenant.platformStudio.forms.builder.lockedStructureHint")}
                              </p>
                            ) : null}

                            {workspaceAccess.canRemoveItems ? (
                              <div className="tenant-web__platform-studio-danger-zone">
                                <Button
                                  onClick={() => setDeleteNodeOpen(true)}
                                  variant="danger"
                                >
                                  {t("tenant.platformStudio.forms.builder.deleteNode")}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <p className="tenant-web__platform-studio-inline-help">
                            {t(access.viewRestrictionKey ?? "tenant.platformStudio.forms.permission.readonly")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="tenant-web__platform-studio-empty-state tenant-web__platform-studio-builder-empty">
                        <p className="tenant-web__platform-studio-empty-title">
                          {t("tenant.platformStudio.forms.builder.selectionEmptyTitle")}
                        </p>
                        <p>{t("tenant.platformStudio.forms.builder.selectionEmptyDescription")}</p>
                      </div>
                    )}
                  </TabsPanel>

                  <TabsPanel value="view">
                    <div className="tenant-web__platform-studio-form">
                      <div className="tenant-web__platform-studio-form-group">
                          <Label htmlFor="tenant-platform-studio-view-title">
                            {t("tenant.platformStudio.forms.builder.viewTitleLabel")}
                          </Label>
                          <Input
                            disabled={!workspaceAccess.canEditSettings}
                            id="tenant-platform-studio-view-title"
                            onChange={(event) => setDraftViewTitle(event.target.value)}
                            value={draftViewTitle}
                          />
                      </div>

                      <div className="tenant-web__platform-studio-form-group">
                        <Label htmlFor="tenant-platform-studio-view-type">
                          {t("tenant.platformStudio.forms.builder.viewTypeLabel")}
                        </Label>
                        <Input
                          disabled
                          id="tenant-platform-studio-view-type"
                          value={t(getViewKindKey(currentView.kind))}
                        />
                      </div>

                      <div className="tenant-web__platform-studio-form-group">
                        <Label htmlFor="tenant-platform-studio-view-description">
                          {t("tenant.platformStudio.forms.builder.viewDescriptionLabel")}
                        </Label>
                        <Textarea
                          disabled={!workspaceAccess.canEditSettings}
                          id="tenant-platform-studio-view-description"
                          onChange={(event) => updateDocument((currentDocument) => ({
                            ...currentDocument,
                            viewDescription: event.target.value,
                          }))}
                          rows={5}
                          value={document.viewDescription}
                        />
                      </div>

                      <label className="tenant-web__platform-studio-checkbox-row">
                        <Checkbox
                          checked={draftViewIsActive}
                          disabled={!workspaceAccess.canEditSettings}
                          onChange={(event) => setDraftViewIsActive(event.target.checked)}
                        />
                        <span>{t("tenant.platformStudio.forms.builder.activeViewLabel")}</span>
                      </label>
                    </div>
                  </TabsPanel>
                </div>
              </PlatformStudioPanelScroll>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <AlertDialog onOpenChange={setDeleteNodeOpen} open={deleteNodeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tenant.platformStudio.forms.builder.confirmDeleteNode", { title: selectedNodeLabel })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tenant.platformStudio.forms.builder.confirmDeleteNodeDescription", { title: selectedNodeLabel })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("tenant.platformStudio.forms.cancelDelete")}</AlertDialogCancel>
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
              {t("tenant.platformStudio.forms.builder.deleteNode")}
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
              {t("tenant.platformStudio.forms.builder.unsavedLeaveTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tenant.platformStudio.forms.builder.unsavedLeaveDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => resolveLeaveConfirmation(false)}
            >
              {t("tenant.platformStudio.forms.builder.stayAction")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resolveLeaveConfirmation(true)}
              variant="danger"
            >
              {t("tenant.platformStudio.forms.builder.leaveWithoutSavingAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
