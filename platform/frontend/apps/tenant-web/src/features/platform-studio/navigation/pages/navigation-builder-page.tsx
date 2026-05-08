import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ApiClientError,
  createTenantNavigationClient,
  isUnauthorizedApiError,
  requestWithUnauthorizedRetry,
  type TenantNavigationAccessOption,
  type TenantNavigationAccessOptionPageRequest,
  type TenantNavigationAccessOptionPageResponse,
  type TenantNavigationAccessOptionsResponse,
} from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import {
  Button,
  WarningTriangleIcon,
} from "@platform/ui-kit";

import { useTenantRuntimeConfig } from "../../../../app/tenant-runtime-config-context";
import { tenantRuntimeNavigationRefreshEvent } from "../../../../shared/tenant-runtime-navigation";
import { useFormBuilderAuthoring } from "../../forms/forms-authoring-context";
import { PlatformStudioTabs } from "../../platform-studio-tabs";
import { NavigationBuilderAccessDialog } from "../components/navigation-builder-access-dialog";
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
  cloneNavigationBuilderRailItems,
  countNavigationBuilderUnsavedChanges,
  createInitialNavigationBuilderNodes,
  createNavigationBuilderNode,
  findNavigationBuilderNode,
  getNavigationBuilderAccessSummary,
  navigationBuilderRailItems,
  reorderNavigationBuilderNode,
  removeNavigationBuilderNode,
  syncNavigationBuilderFormViewLabels,
  updateNavigationBuilderNode,
  type NavigationBuilderAccessPolicy,
  type NavigationBuilderAccessRecipientKind,
  type NavigationBuilderAddNodeKind,
  type NavigationBuilderNode,
  type NavigationBuilderRailItem,
} from "../navigation-builder-state";
import {
  decodeNavigationBuilderDefinition,
  decodeNavigationBuilderRailItems,
  encodeNavigationBuilderDefinition,
} from "../navigation-builder-api";

const initialNavigationBuilderNodes = createInitialNavigationBuilderNodes();
const emptyAccessOptions: TenantNavigationAccessOptionsResponse = {
  companies: [],
  companyTypes: [],
  jobtypes: [],
  users: [],
};

function mergeAccessOptionCache(
  cache: TenantNavigationAccessOptionsResponse,
  category: NavigationBuilderAccessRecipientKind,
  items: ReadonlyArray<TenantNavigationAccessOption>,
) {
  const byId = new Map(cache[category].map((item) => [item.id, item]));
  for (const item of items) {
    byId.set(item.id, item);
  }
  return {
    ...cache,
    [category]: [...byId.values()],
  };
}

export function NavigationBuilderPage() {
  const runtimeConfig = useTenantRuntimeConfig();
  const navigationClient = useMemo(
    () => createTenantNavigationClient(runtimeConfig.tenantApiUrl),
    [runtimeConfig.tenantApiUrl],
  );
  const {
    checkAuth,
    getAccessToken,
    signOut,
  } = useAuth();
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
  const [draftRailItems, setDraftRailItems] = useState(() =>
    cloneNavigationBuilderRailItems(navigationBuilderRailItems),
  );
  const [savedRailItems, setSavedRailItems] = useState(() =>
    cloneNavigationBuilderRailItems(navigationBuilderRailItems),
  );
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [activeTreePanel, setActiveTreePanel] =
    useState<NavigationBuilderTreePanelValue>("sidebar");
  const [selectedRailItemId, setSelectedRailItemId] = useState("rail.platform-studio");
  const [accessPickerCategory, setAccessPickerCategory] =
    useState<NavigationBuilderAccessRecipientKind | null>(null);
  const [accessOptionCache, setAccessOptionCache] =
    useState<TenantNavigationAccessOptionsResponse>(emptyAccessOptions);
  const [pendingAdd, setPendingAdd] = useState<NavigationBuilderPendingAdd | null>(null);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const [configVersion, setConfigVersion] = useState(0);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedNodeCandidate = findNavigationBuilderNode(draftNodes, selectedNodeId);
  const selectedNode = selectedNodeCandidate?.isLocked ? null : selectedNodeCandidate;
  const deleteNode = deleteNodeId
    ? findNavigationBuilderNode(draftNodes, deleteNodeId)
    : null;
  const selectedRailItem =
    draftRailItems.find((item) => item.id === selectedRailItemId)
    ?? draftRailItems[0]
    ?? null;
  const formViewTargets = useMemo(
    () => buildNavigationBuilderFormViewTargets(models),
    [models],
  );
  const unsavedChanges = useMemo(
    () => countNavigationBuilderUnsavedChanges(draftNodes, savedNodes, draftRailItems, savedRailItems),
    [draftNodes, draftRailItems, savedNodes, savedRailItems],
  );
  const saveStatusLabel = isLoadingConfig
    ? "Loading..."
    : isSavingConfig
      ? "Saving..."
      : unsavedChanges === 0
        ? "Saved"
        : `${unsavedChanges} unsaved ${unsavedChanges === 1 ? "change" : "changes"}`;

  const requestWithSession = useCallback(async <T,>(request: (accessToken: string) => Promise<T>) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      await signOut();
      throw new ApiClientError("Request failed with status 401.", {
        statusCode: 401,
      });
    }

    async function recoverUnauthorizedAccessToken() {
      const recovered = await checkAuth();
      if (!recovered) {
        return null;
      }

      return getAccessToken();
    }

    try {
      return await requestWithUnauthorizedRetry(request, {
        accessToken,
        onUnauthorized: recoverUnauthorizedAccessToken,
      });
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        await signOut();
      }

      throw error;
    }
  }, [checkAuth, getAccessToken, signOut]);

  useEffect(() => {
    setDraftNodes((currentNodes) =>
      syncNavigationBuilderFormViewLabels(currentNodes, formViewTargets),
    );
    setSavedNodes((currentNodes) =>
      syncNavigationBuilderFormViewLabels(currentNodes, formViewTargets),
    );
  }, [formViewTargets]);

  const loadAccessOptionPage = useCallback(
    async (request: TenantNavigationAccessOptionPageRequest): Promise<TenantNavigationAccessOptionPageResponse> =>
      requestWithSession((accessToken) =>
        navigationClient.loadAccessOptionPage(accessToken, request),
      ),
    [navigationClient, requestWithSession],
  );

  const handleAccessOptionsLoaded = useCallback((
    category: NavigationBuilderAccessRecipientKind,
    items: ReadonlyArray<TenantNavigationAccessOption>,
  ) => {
    setAccessOptionCache((cache) => mergeAccessOptionCache(cache, category, items));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadNavigationConfig() {
      setIsLoadingConfig(true);
      setSaveError(null);

      try {
        const response = await requestWithSession((accessToken) =>
          navigationClient.loadConfig(accessToken),
        );

        if (cancelled) {
          return;
        }

        const isNewConfig = response.version === 0;
        const nextNodes = decodeNavigationBuilderDefinition(response.definition, {
          seedWhenEmpty: isNewConfig,
        });
        const nextRailItems = decodeNavigationBuilderRailItems(response.definition, {
          seedWhenEmpty: isNewConfig,
        });
        const persistedNodes = isNewConfig
          ? decodeNavigationBuilderDefinition(response.definition)
          : nextNodes;
        const persistedRailItems = isNewConfig
          ? decodeNavigationBuilderRailItems(response.definition)
          : nextRailItems;
        setConfigVersion(response.version);
        setDraftNodes(cloneNavigationBuilderNodes(nextNodes));
        setSavedNodes(cloneNavigationBuilderNodes(persistedNodes));
        setDraftRailItems(cloneNavigationBuilderRailItems(nextRailItems));
        setSavedRailItems(cloneNavigationBuilderRailItems(persistedRailItems));
        setSelectedNodeId((currentNodeId) => {
          const currentNode = findNavigationBuilderNode(nextNodes, currentNodeId);

          return currentNode && !currentNode.isLocked
            ? currentNode.id
            : nextNodes.find((node) => !node.isLocked)?.id ?? "";
        });
      } catch (error) {
        if (!cancelled) {
          setSaveError(error instanceof Error ? error.message : "Unable to load navigation configuration.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingConfig(false);
        }
      }
    }

    void loadNavigationConfig();

    return () => {
      cancelled = true;
    };
  }, [navigationClient, requestWithSession]);

  function handleAddNode(kind: NavigationBuilderAddNodeKind, parentId?: string) {
    if (
      kind === "form-view" ||
      kind === "app-page" ||
      kind === "external-link" ||
      kind === "app-module"
    ) {
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
      case "external-link":
        nextNode = {
          ...baseNode,
          diagnostic: undefined,
          label: result.label,
          routeKey: result.url,
          status: "visible",
          target: {
            kind: "external-link",
            url: result.url,
          },
          targetKind: "external-link",
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

  function updateRailItem(
    railItemId: string,
    update: (railItem: NavigationBuilderRailItem) => NavigationBuilderRailItem,
  ) {
    setDraftRailItems((currentItems) =>
      currentItems.map((item) => item.id === railItemId ? update(item) : item),
    );
  }

  function applyAccessChange(access: NavigationBuilderAccessPolicy) {
    const nextAccess = {
      companies: [...access.companies],
      companyTypes: [...access.companyTypes],
      jobtypes: [...access.jobtypes],
      mode: access.mode,
      users: [...access.users],
    };
    const accessSummary = getNavigationBuilderAccessSummary(nextAccess);
    const nextStatus = nextAccess.mode === "inherit" || nextAccess.mode === "all-authenticated"
      ? "visible"
      : "restricted";

    if (activeTreePanel === "railbar" && selectedRailItem) {
      updateRailItem(selectedRailItem.id, (item) => ({
        ...item,
        access: nextAccess,
        accessMode: nextAccess.mode,
        accessSummary,
        status: item.status === "hidden" ? item.status : nextStatus,
      }));
      return;
    }

    if (!selectedNode || selectedNode.isLocked) {
      return;
    }

    setDraftNodes((currentNodes) =>
      updateNavigationBuilderNode(currentNodes, selectedNode.id, (node) => ({
        ...node,
        access: nextAccess,
        accessMode: nextAccess.mode,
        accessSummary,
        status: node.status === "hidden" || node.status === "broken" ? node.status : nextStatus,
      })),
    );
  }

  function applyAccessRecipients(
    category: NavigationBuilderAccessRecipientKind,
    ids: string[],
  ) {
    const currentAccess = activeTreePanel === "railbar"
      ? selectedRailItem?.access
      : selectedNode?.access;
    if (!currentAccess) {
      return;
    }

    applyAccessChange({
      ...currentAccess,
      [category]: [...ids],
    });
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
      : "");
    setDeleteNodeId(null);
    setActiveTreePanel("sidebar");
  }

  async function saveChanges() {
    setIsSavingConfig(true);
    setSaveError(null);

    try {
      const response = await requestWithSession((accessToken) =>
        navigationClient.saveConfig(accessToken, {
          definition: encodeNavigationBuilderDefinition(draftNodes, draftRailItems),
          expectedVersion: configVersion,
        }),
      );
      const nextNodes = decodeNavigationBuilderDefinition(response.definition);
      const nextRailItems = decodeNavigationBuilderRailItems(response.definition);

      setConfigVersion(response.version);
      setDraftNodes(cloneNavigationBuilderNodes(nextNodes));
      setSavedNodes(cloneNavigationBuilderNodes(nextNodes));
      setDraftRailItems(cloneNavigationBuilderRailItems(nextRailItems));
      setSavedRailItems(cloneNavigationBuilderRailItems(nextRailItems));
      window.dispatchEvent(new Event(tenantRuntimeNavigationRefreshEvent));
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 409) {
        setSaveError("Navigation was changed in another session. Reload the builder before saving again.");
      } else {
        setSaveError(error instanceof Error ? error.message : "Unable to save navigation configuration.");
      }
    } finally {
      setIsSavingConfig(false);
    }
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
        <div className="tenant-web__navigation-builder-save-cluster">
          <Button
            className="tenant-web__navigation-builder-save-button"
            disabled={unsavedChanges === 0 || isLoadingConfig || isSavingConfig}
            onClick={() => {
              void saveChanges();
            }}
            size="sm"
          >
            Save
          </Button>
          <span className="tenant-web__navigation-builder-save-status">
            {saveStatusLabel}
          </span>
        </div>
        {saveError ? (
          <div className="tenant-web__navigation-builder-save-error">
            <WarningTriangleIcon />
            <span>{saveError}</span>
          </div>
        ) : null}
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
          railItems={draftRailItems}
          selectedRailItemId={selectedRailItem?.id ?? ""}
          selectedNodeId={selectedNode?.id ?? ""}
        />
        <NavigationBuilderInspector
          formViewTargets={formViewTargets}
          accessOptions={accessOptionCache}
          accessOptionsError={null}
          isLoadingAccessOptions={false}
          node={activeTreePanel === "sidebar" ? selectedNode : null}
          onAccessChange={applyAccessChange}
          onChooseAccessRecipients={setAccessPickerCategory}
          onDeleteNode={(node) => setDeleteNodeId(node.id)}
          onNodeChange={handleSelectedNodeChange}
          railItem={activeTreePanel === "railbar" ? selectedRailItem : null}
        />
      </section>

      <NavigationBuilderAccessDialog
        category={accessPickerCategory}
        loadOptions={loadAccessOptionPage}
        node={activeTreePanel === "sidebar" ? selectedNode : selectedRailItem}
        onApply={applyAccessRecipients}
        onOptionsLoaded={handleAccessOptionsLoaded}
        onOpenChange={(open) => {
          if (!open) {
            setAccessPickerCategory(null);
          }
        }}
        open={Boolean(accessPickerCategory)}
        options={accessOptionCache}
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
