import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createTenantBusinessTreeClient,
  isUnauthorizedApiError,
  type TenantBusinessTreeNode,
} from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import { useTranslation } from "@platform/i18n";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
  Button,
  TreeView,
  type TreeViewNode,
} from "@platform/ui-kit";

import { useTenantRuntimeConfig } from "../../../app/tenant-runtime-config-context";
import "./business-tree.css";

const businessTreeRootParentId = "root";

function formatLoadError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function setWithValue(previous: Set<string>, value: string) {
  const next = new Set(previous);
  next.add(value);
  return next;
}

function setWithoutValue(previous: Set<string>, value: string) {
  const next = new Set(previous);
  next.delete(value);
  return next;
}

function mapBusinessTreeNodes(
  nodes: TenantBusinessTreeNode[],
  nodesByParent: ReadonlyMap<string, TenantBusinessTreeNode[]>,
  loadingParentIds: ReadonlySet<string>,
  errorByParent: ReadonlyMap<string, string>,
): TreeViewNode[] {
  return nodes.map((node) => {
    const children = nodesByParent.get(node.id);
    const error = errorByParent.get(node.id);

    return {
      children: children
        ? mapBusinessTreeNodes(children, nodesByParent, loadingParentIds, errorByParent)
        : undefined,
      error,
      expandable: node.expandable,
      id: node.id,
      label: node.label,
      loading: loadingParentIds.has(node.id),
    };
  });
}

export function BusinessTreePage() {
  const { t } = useTranslation();
  const runtimeConfig = useTenantRuntimeConfig();
  const { getAccessToken, signOut } = useAuth();
  const client = useMemo(
    () => createTenantBusinessTreeClient(runtimeConfig.tenantApiUrl),
    [runtimeConfig.tenantApiUrl],
  );
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  const [nodesByParent, setNodesByParent] = useState<Map<string, TenantBusinessTreeNode[]>>(() => new Map());
  const [loadedParentIds, setLoadedParentIds] = useState<Set<string>>(() => new Set());
  const [loadingParentIds, setLoadingParentIds] = useState<Set<string>>(() => new Set());
  const [errorByParent, setErrorByParent] = useState<Map<string, string>>(() => new Map());

  const loadParent = useCallback(
    async (parentId: string, options?: { force?: boolean }) => {
      const normalizedParentId = parentId.trim() || businessTreeRootParentId;
      if (!options?.force && loadedParentIds.has(normalizedParentId)) {
        return;
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        void signOut();
        return;
      }

      setLoadingParentIds((previous) => setWithValue(previous, normalizedParentId));
      setErrorByParent((previous) => {
        const next = new Map(previous);
        next.delete(normalizedParentId);
        return next;
      });

      try {
        const response = await client.getNodes(accessToken, normalizedParentId);
        setNodesByParent((previous) => {
          const next = new Map(previous);
          next.set(response.parentId, response.nodes);
          return next;
        });
        setLoadedParentIds((previous) => setWithValue(previous, response.parentId));
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          void signOut();
          return;
        }

        const message = formatLoadError(error, t("tenant.staticModules.businessTree.loadFailed"));
        setErrorByParent((previous) => {
          const next = new Map(previous);
          next.set(normalizedParentId, message);
          return next;
        });
      } finally {
        setLoadingParentIds((previous) => setWithoutValue(previous, normalizedParentId));
      }
    },
    [client, getAccessToken, loadedParentIds, signOut, t],
  );

  useEffect(() => {
    void loadParent(businessTreeRootParentId);
  }, [loadParent]);

  const treeItems = useMemo(
    () => mapBusinessTreeNodes(
      nodesByParent.get(businessTreeRootParentId) ?? [],
      nodesByParent,
      loadingParentIds,
      errorByParent,
    ),
    [errorByParent, loadingParentIds, nodesByParent],
  );

  const rootLoaded = loadedParentIds.has(businessTreeRootParentId);
  const rootLoading = loadingParentIds.has(businessTreeRootParentId);
  const rootError = errorByParent.get(businessTreeRootParentId);

  function reloadRoot() {
    setExpandedItemIds([]);
    setNodesByParent(new Map());
    setLoadedParentIds(new Set());
    setLoadingParentIds(new Set());
    setErrorByParent(new Map());
    void loadParent(businessTreeRootParentId, { force: true });
  }

  return (
    <div className="tenant-business-tree">
      <section className="tenant-business-tree__surface" aria-busy={rootLoading || undefined}>
        {rootError && !rootLoaded ? (
          <Alert tone="danger" appearance="soft">
            <AlertBody>
              <AlertTitle>{t("tenant.staticModules.businessTree.loadFailed")}</AlertTitle>
              <AlertDescription>{rootError}</AlertDescription>
            </AlertBody>
            <AlertActions>
              <Button onClick={reloadRoot} size="sm" variant="outline">
                {t("tenant.staticModules.businessTree.retry")}
              </Button>
            </AlertActions>
          </Alert>
        ) : null}

        {rootLoading && !rootLoaded ? (
          <div className="tenant-business-tree__state">{t("tenant.staticModules.businessTree.loading")}</div>
        ) : null}

        {rootLoaded && treeItems.length === 0 ? (
          <div className="tenant-business-tree__state">{t("tenant.staticModules.businessTree.empty")}</div>
        ) : null}

        {treeItems.length > 0 ? (
          <TreeView
            ariaLabel={t("tenant.staticModules.businessTree.treeAria")}
            density="compact"
            expandedItemIds={expandedItemIds}
            items={treeItems}
            loadingLabel={t("tenant.staticModules.businessTree.loadingBranch")}
            onExpandedItemIdsChange={setExpandedItemIds}
            onItemExpand={(itemId) => {
              void loadParent(itemId);
            }}
            readOnly
          />
        ) : null}
      </section>
    </div>
  );
}
