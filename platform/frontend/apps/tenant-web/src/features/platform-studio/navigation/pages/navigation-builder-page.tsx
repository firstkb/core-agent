import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Button,
  WarningTriangleIcon,
} from "@platform/ui-kit";

import { useFormBuilderAuthoring } from "../../forms/forms-authoring-context";
import { PlatformStudioTabs } from "../../platform-studio-tabs";
import { NavigationBuilderAccessSheet } from "../components/navigation-builder-access-sheet";
import {
  NavigationBuilderAddDialog,
  type NavigationBuilderAddTargetResult,
  type NavigationBuilderPendingAdd,
} from "../components/navigation-builder-add-sheet";
import { NavigationBuilderDeleteDialog } from "../components/navigation-builder-delete-dialog";
import { NavigationBuilderInspector } from "../components/navigation-builder-inspector";
import {
  NavigationBuilderTreePanel,
  type NavigationBuilderTreePanelValue,
} from "../components/navigation-builder-tree-panel";
import {
  buildNavigationBuilderFormViewTargets,
  cloneNavigationBuilderNodes,
  countNavigationBuilderUnsavedChanges,
  createInitialNavigationBuilderNodes,
  createNavigationBuilderNode,
  findNavigationBuilderNode,
  navigationBuilderDashboardNodeId,
  navigationBuilderRailItems,
  reorderNavigationBuilderNode,
  removeNavigationBuilderNode,
  syncNavigationBuilderFormViewLabels,
  updateNavigationBuilderNode,
  type NavigationBuilderAddNodeKind,
  type NavigationBuilderNode,
} from "../navigation-builder-state";

const initialNavigationBuilderNodes = createInitialNavigationBuilderNodes();

export function NavigationBuilderPage() {
  const {
    isLoadingModels,
    models,
    modelsError,
  } = useFormBuilderAuthoring();
  const [draftNodes, setDraftNodes] = useState(() =>
    cloneNavigationBuilderNodes(initialNavigationBuilderNodes),
  );
  const [savedNodes, setSavedNodes] = useState(() =>
    cloneNavigationBuilderNodes(initialNavigationBuilderNodes),
  );
  const [selectedNodeId, setSelectedNodeId] = useState("nav.entry.safety.inspections");
  const [activeTreePanel, setActiveTreePanel] =
    useState<NavigationBuilderTreePanelValue>("sidebar");
  const [selectedRailItemId, setSelectedRailItemId] = useState("rail.platform-studio");
  const [isAccessSheetOpen, setIsAccessSheetOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<NavigationBuilderPendingAdd | null>(null);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const selectedNode =
    findNavigationBuilderNode(draftNodes, selectedNodeId)
    ?? findNavigationBuilderNode(draftNodes, navigationBuilderDashboardNodeId);
  const deleteNode = deleteNodeId
    ? findNavigationBuilderNode(draftNodes, deleteNodeId)
    : null;
  const selectedRailItem =
    navigationBuilderRailItems.find((item) => item.id === selectedRailItemId)
    ?? navigationBuilderRailItems[0];
  const formViewTargets = useMemo(
    () => buildNavigationBuilderFormViewTargets(models),
    [models],
  );
  const unsavedChanges = useMemo(
    () => countNavigationBuilderUnsavedChanges(draftNodes, savedNodes),
    [draftNodes, savedNodes],
  );
  const saveStatusLabel = unsavedChanges === 0
    ? "Saved"
    : `${unsavedChanges} unsaved ${unsavedChanges === 1 ? "change" : "changes"}`;

  useEffect(() => {
    setDraftNodes((currentNodes) =>
      syncNavigationBuilderFormViewLabels(currentNodes, formViewTargets),
    );
    setSavedNodes((currentNodes) =>
      syncNavigationBuilderFormViewLabels(currentNodes, formViewTargets),
    );
  }, [formViewTargets]);

  function handleAddNode(kind: NavigationBuilderAddNodeKind, parentId?: string) {
    if (kind === "form-view" || kind === "app-page" || kind === "app-module") {
      setPendingAdd({ kind, parentId });
      return;
    }

    const nextNode = createNavigationBuilderNode(kind, parentId, draftNodes);
    setDraftNodes([...draftNodes, nextNode]);
    setSelectedNodeId(nextNode.id);
    setActiveTreePanel("sidebar");
  }

  function handleAddTargetNode(result: NavigationBuilderAddTargetResult) {
    const baseNode = createNavigationBuilderNode(result.kind, result.parentId, draftNodes);
    let nextNode: NavigationBuilderNode;

    switch (result.kind) {
      case "form-view":
        nextNode = {
          ...baseNode,
          diagnostic: undefined,
          label: result.target.viewLabel,
          routeKey: `${result.target.modelId}-${result.target.viewId}`,
          status: "visible",
          target: {
            kind: "form-view",
            modelLabel: result.target.modelLabel,
            modelId: result.target.modelId,
            routePath: result.target.routePath,
            targetType: "form_builder_view",
            viewLabel: result.target.viewLabel,
            viewId: result.target.viewId,
          },
          targetKind: "form-view",
        };
        break;
      case "app-page":
        nextNode = {
          ...baseNode,
          diagnostic: undefined,
          label: result.label,
          routeKey: result.page.key,
          status: "visible",
          target: {
            kind: "app-page",
            pageKey: result.page.key,
            routePath: result.page.routePath,
          },
          targetKind: "app-page",
        };
        break;
      case "app-module":
        nextNode = {
          ...baseNode,
          diagnostic: "App Module targets are planned and preview-only in this version.",
          isActive: false,
          label: result.label,
          routeKey: result.appModule.key,
          status: "visible",
          target: {
            disabled: true,
            kind: "app-module",
            moduleKey: result.appModule.key,
          },
          targetKind: "app-module",
        };
        break;
    }

    setDraftNodes([...draftNodes, nextNode]);
    setSelectedNodeId(nextNode.id);
    setActiveTreePanel("sidebar");
    setPendingAdd(null);
  }

  function handleSelectedNodeChange(nextNode: NavigationBuilderNode) {
    if (nextNode.isLocked) {
      return;
    }

    setDraftNodes((currentNodes) =>
      updateNavigationBuilderNode(currentNodes, nextNode.id, () => nextNode),
    );
  }

  function handleConfirmDeleteNode() {
    if (!deleteNode || deleteNode.isLocked) {
      setDeleteNodeId(null);
      return;
    }

    const parentId = deleteNode.parentId;
    setDraftNodes((currentNodes) => removeNavigationBuilderNode(currentNodes, deleteNode.id));
    setSelectedNodeId(parentId && findNavigationBuilderNode(draftNodes, parentId)
      ? parentId
      : navigationBuilderDashboardNodeId);
    setDeleteNodeId(null);
    setActiveTreePanel("sidebar");
  }

  function saveChanges() {
    setSavedNodes(cloneNavigationBuilderNodes(draftNodes));
  }

  function handleReorderNode(activeNodeId: string, overNodeId: string) {
    setDraftNodes((currentNodes) =>
      reorderNavigationBuilderNode(currentNodes, activeNodeId, overNodeId),
    );
  }

  return (
    <div className="tenant-web__platform-studio-shell tenant-web__platform-studio-shell--desktop-panels tenant-web__navigation-builder-shell">
      <PlatformStudioTabs activeTool="navigation" />

      <div className="tenant-web__platform-studio-workspace-topline tenant-web__navigation-builder-topline">
        <div className="tenant-web__platform-studio-panel-actions tenant-web__platform-studio-panel-actions--workspace-primary">
          <span className="tenant-web__navigation-builder-save-status">
            {saveStatusLabel}
          </span>
          <Button
            className="tenant-web__navigation-builder-save-button"
            disabled={unsavedChanges === 0}
            onClick={saveChanges}
            size="sm"
          >
            Save
          </Button>
        </div>
      </div>

      {modelsError ? (
        <div className="tenant-web__platform-studio-inline-help">
          <WarningTriangleIcon />
          <span>Form View picker could not load live Form Builder models: {modelsError}</span>
        </div>
      ) : null}

      {isLoadingModels ? (
        <div className="tenant-web__navigation-builder-loading-note">
          Loading Form Builder views for target picker...
        </div>
      ) : null}

      <section className="tenant-web__navigation-builder-grid">
        <NavigationBuilderTreePanel
          activePanel={activeTreePanel}
          nodes={draftNodes}
          onAddNode={handleAddNode}
          onActivePanelChange={setActiveTreePanel}
          onReorderNode={handleReorderNode}
          onSelectRailItem={setSelectedRailItemId}
          onSelectNode={setSelectedNodeId}
          selectedRailItemId={selectedRailItem.id}
          selectedNodeId={selectedNode?.id ?? navigationBuilderDashboardNodeId}
        />
        <NavigationBuilderInspector
          formViewTargets={formViewTargets}
          node={activeTreePanel === "sidebar" ? selectedNode : null}
          onConfigureAccess={() => setIsAccessSheetOpen(true)}
          onDeleteNode={(node) => setDeleteNodeId(node.id)}
          onNodeChange={handleSelectedNodeChange}
          railItem={activeTreePanel === "railbar" ? selectedRailItem : null}
        />
      </section>

      <NavigationBuilderAccessSheet
        node={activeTreePanel === "sidebar" ? selectedNode : selectedRailItem}
        onOpenChange={setIsAccessSheetOpen}
        open={isAccessSheetOpen}
      />
      <NavigationBuilderAddDialog
        formViewTargets={formViewTargets}
        nodes={draftNodes}
        onCancel={() => setPendingAdd(null)}
        onConfirm={handleAddTargetNode}
        request={pendingAdd}
      />
      <NavigationBuilderDeleteDialog
        node={deleteNode}
        nodes={draftNodes}
        onConfirm={handleConfirmDeleteNode}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteNodeId(null);
          }
        }}
        open={Boolean(deleteNode)}
      />
    </div>
  );
}
