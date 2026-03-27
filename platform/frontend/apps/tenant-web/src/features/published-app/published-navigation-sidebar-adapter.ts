import { useEffect, useState, useSyncExternalStore } from "react";

import type {
  NavigationGroupNode,
  NavigationItemNode,
  NavigationNode,
  PublishedManifest,
  VisibilitySubjectContext,
} from "@platform/platform-builder-core";
import { buildRouteMap } from "@platform/platform-builder-core";
import type { SidebarNavItem } from "@platform/ui-kit";

import {
  getPublishedRuntimeItemId,
  publishedRuntimeSectionId,
} from "../../shared/navigation";
import {
  getPublishedManifestSourceRevision,
  loadPublishedManifest,
  subscribeToPublishedManifestSource,
} from "./published-manifest-loader";
import {
  resolvePublishedNavigationItemAccess,
} from "./published-navigation-access";
import {
  usePublishedVisibilitySubject,
} from "./published-visibility-subject";

export type PublishedNavigationSidebarCopy = {
  emptyLabel: string;
  errorLabel: string;
  loadingLabel: string;
  policyUnavailableLabel: string;
  sectionLabel: string;
};

export type PublishedNavigationSidebarState =
  | { status: "loading" }
  | { error: Error; status: "error" }
  | { manifest: PublishedManifest; status: "ready" };

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown published navigation failure.");
}

function sortNavigationNodes(nodes: NavigationNode[]) {
  return [...nodes].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.id.localeCompare(right.id);
  });
}

function createStatusItem(id: string, label: string): SidebarNavItem {
  return {
    disabled: true,
    id,
    label,
  };
}

function isWebNavigationItem(node: NavigationItemNode) {
  return !node.channels?.length || node.channels.includes("web");
}

function resolveParentGroupId(
  node: NavigationNode,
  nodesById: Map<string, NavigationNode>,
): string | undefined {
  if (!node.parentId) {
    return undefined;
  }

  const parentNode = nodesById.get(node.parentId);
  if (!parentNode || parentNode.type !== "group") {
    return undefined;
  }

  return parentNode.id;
}

function indexNavigationNodesByParent(nodes: NavigationNode[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParentId = new Map<string | undefined, NavigationNode[]>();

  for (const node of sortNavigationNodes(nodes)) {
    const parentId = resolveParentGroupId(node, nodesById);
    const siblings = childrenByParentId.get(parentId) ?? [];
    siblings.push(node);
    childrenByParentId.set(parentId, siblings);
  }

  return childrenByParentId;
}

function buildGroupSidebarItem(
  copy: PublishedNavigationSidebarCopy,
  node: NavigationGroupNode,
  childrenByParentId: Map<string | undefined, NavigationNode[]>,
  manifest: PublishedManifest,
  subject: VisibilitySubjectContext,
): SidebarNavItem | null {
  const children = buildPublishedNavigationSidebarItemsFromIndex(
    childrenByParentId,
    copy,
    manifest,
    subject,
    node.id,
  );

  if (children.length === 0) {
    return null;
  }

  return {
    children,
    defaultOpen: true,
    id: node.id,
    label: node.label,
  };
}

function buildConfigurationErrorSidebarItem(
  copy: PublishedNavigationSidebarCopy,
  node: NavigationItemNode,
): SidebarNavItem {
  return {
    disabled: true,
    id: `${getPublishedRuntimeItemId(node.routeKey)}:policy-unavailable`,
    label: `${node.label} (${copy.policyUnavailableLabel})`,
  };
}

function buildPublishedNavigationSidebarItemsFromIndex(
  childrenByParentId: Map<string | undefined, NavigationNode[]>,
  copy: PublishedNavigationSidebarCopy,
  manifest: PublishedManifest,
  subject: VisibilitySubjectContext,
  parentId?: string,
): SidebarNavItem[] {
  const nodes = childrenByParentId.get(parentId) ?? [];
  const items: SidebarNavItem[] = [];

  for (const node of nodes) {
    if (node.type === "divider") {
      continue;
    }

    if (node.type === "item") {
      if (!isWebNavigationItem(node)) {
        continue;
      }

      const access = resolvePublishedNavigationItemAccess({
        manifest,
        navigationItem: node,
        subject,
      });

      if (access.status === "denied") {
        continue;
      }

      if (access.status === "configuration-error") {
        items.push(buildConfigurationErrorSidebarItem(copy, node));
        continue;
      }

      items.push({
        id: getPublishedRuntimeItemId(node.routeKey),
        label: node.label,
      });
      continue;
    }

    const groupItem = buildGroupSidebarItem(
      copy,
      node,
      childrenByParentId,
      manifest,
      subject,
    );
    if (groupItem) {
      items.push(groupItem);
    }
  }

  return items;
}

function countPublishedRouteItems(items: SidebarNavItem[]): number {
  return items.reduce((count, item) => {
    if (item.children?.length) {
      return count + countPublishedRouteItems(item.children);
    }

    return item.disabled ? count : count + 1;
  }, 0);
}

export function buildPublishedNavigationSidebarItems(
  manifest: PublishedManifest,
  subject: VisibilitySubjectContext,
  copy: PublishedNavigationSidebarCopy,
) {
  buildRouteMap(manifest);

  return buildPublishedNavigationSidebarItemsFromIndex(
    indexNavigationNodesByParent(manifest.navigationNodes),
    copy,
    manifest,
    subject,
  );
}

export function createPublishedNavigationSection(
  copy: PublishedNavigationSidebarCopy,
  state: PublishedNavigationSidebarState,
  subject: VisibilitySubjectContext,
): SidebarNavItem {
  if (state.status === "loading") {
    return {
      children: [createStatusItem("published-runtime-loading", copy.loadingLabel)],
      defaultOpen: true,
      id: publishedRuntimeSectionId,
      label: copy.sectionLabel,
    };
  }

  if (state.status === "error") {
    return {
      children: [createStatusItem("published-runtime-error", copy.errorLabel)],
      defaultOpen: true,
      id: publishedRuntimeSectionId,
      label: copy.sectionLabel,
    };
  }

  let navigationItems: SidebarNavItem[];

  try {
    navigationItems = buildPublishedNavigationSidebarItems(
      state.manifest,
      subject,
      copy,
    );
  } catch {
    return {
      children: [createStatusItem("published-runtime-error", copy.errorLabel)],
      defaultOpen: true,
      id: publishedRuntimeSectionId,
      label: copy.sectionLabel,
    };
  }

  if (navigationItems.length === 0) {
    return {
      children: [createStatusItem("published-runtime-empty", copy.emptyLabel)],
      defaultOpen: true,
      id: publishedRuntimeSectionId,
      label: copy.sectionLabel,
    };
  }

  return {
    children: navigationItems,
    defaultOpen: true,
    id: publishedRuntimeSectionId,
    label: copy.sectionLabel,
    meta: countPublishedRouteItems(navigationItems),
  };
}

export function usePublishedNavigationSection(copy: PublishedNavigationSidebarCopy) {
  const [state, setState] = useState<PublishedNavigationSidebarState>({
    status: "loading",
  });
  const subject = usePublishedVisibilitySubject();
  const manifestSourceRevision = useSyncExternalStore(
    subscribeToPublishedManifestSource,
    getPublishedManifestSourceRevision,
    getPublishedManifestSourceRevision,
  );

  useEffect(() => {
    let isActive = true;

    setState({ status: "loading" });

    void loadPublishedManifest()
      .then((manifest) => {
        if (isActive) {
          setState({
            manifest,
            status: "ready",
          });
        }
      })
      .catch((error) => {
        if (isActive) {
          setState({
            error: toError(error),
            status: "error",
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [manifestSourceRevision]);

  return createPublishedNavigationSection(copy, state, subject);
}
