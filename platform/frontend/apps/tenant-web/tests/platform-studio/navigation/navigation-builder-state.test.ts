import { describe, expect, it } from "vitest";

import {
  buildNavigationBuilderFormViewTargets,
  cloneNavigationBuilderNodes,
  countNavigationBuilderUnsavedChanges,
  createInitialNavigationBuilderNodes,
  createNavigationBuilderNode,
  getNavigationBuilderDescendantIds,
  getNavigationBuilderTargetIdentity,
  isNavigationBuilderNodeActive,
  moveNavigationBuilderNode,
  navigationBuilderDashboardNodeId,
  navigationBuilderIconOptions,
  navigationBuilderRailItems,
  reorderNavigationBuilderNode,
  removeNavigationBuilderNode,
  setNavigationBuilderNodeActive,
  syncNavigationBuilderFormViewLabels,
  updateNavigationBuilderNode,
  type NavigationBuilderNode,
} from "../../../src/features/platform-studio/navigation/navigation-builder-state";
import {
  decodeNavigationBuilderDefinition,
  encodeNavigationBuilderDefinition,
} from "../../../src/features/platform-studio/navigation/navigation-builder-api";
import { editableFormBuilderModel } from "../forms-test-fixtures";

function createSampleNavigationBuilderNodes(): NavigationBuilderNode[] {
  return [
    ...createInitialNavigationBuilderNodes(),
    {
      accessMode: "inherit",
      accessSummary: "Menu titles do not have access rules",
      channel: "web",
      id: "nav.section.operations",
      kind: "section",
      label: "Operations",
      order: 1,
      status: "visible",
    },
    {
      accessMode: "custom-preview",
      accessSummary: "Preview: Safety managers and field supervisors",
      channel: "web",
      description: "Groups Safety views and app pages.",
      diagnostic: "Access preview only. Backend enforcement is not active in V1.",
      iconKey: "shield",
      id: "nav.module.safety",
      kind: "app-module",
      label: "Safety",
      order: 2,
      routeKey: "safety",
      status: "restricted",
    },
    {
      accessMode: "inherit",
      accessSummary: "Inherits Safety module access",
      channel: "web",
      description: "Opens the Inspections Form Builder view.",
      id: "nav.entry.safety.inspections",
      kind: "entry",
      label: "Inspections",
      order: 1,
      parentId: "nav.module.safety",
      routeKey: "safety-inspections",
      status: "visible",
      target: {
        kind: "form-view",
        modelLabel: "SOR",
        modelId: "sor",
        routePath: "/app/forms/sor/views/view-default",
        targetType: "form_builder_view",
        viewLabel: "Inspections",
        viewId: "view-default",
      },
      targetKind: "form-view",
    },
    {
      accessMode: "inherit",
      accessSummary: "Inherits Safety module access",
      channel: "web",
      description: "Opens the Business Tree app page.",
      id: "nav.entry.safety.business-tree",
      kind: "entry",
      label: "Business Tree",
      order: 2,
      parentId: "nav.module.safety",
      routeKey: "business-tree",
      status: "visible",
      target: {
        kind: "app-page",
        pageKey: "business-tree",
        routePath: "/app/pages/business-tree",
      },
      targetKind: "app-page",
    },
    {
      accessMode: "inherit",
      accessSummary: "Inherits Safety module access",
      channel: "web",
      description: "Opens an external operations handbook.",
      id: "nav.entry.safety.handbook",
      kind: "entry",
      label: "Operations handbook",
      order: 3,
      parentId: "nav.module.safety",
      routeKey: "ops-handbook",
      status: "visible",
      target: {
        kind: "external-link",
        url: "https://example.com/ops-handbook",
      },
      targetKind: "external-link",
    },
    {
      accessMode: "inherit",
      accessSummary: "App module target family planned",
      channel: "web",
      description: "Future app module with its own subpages.",
      diagnostic: "App Module pages are represented in V1 but cannot be activated yet.",
      iconKey: "briefcase",
      id: "nav.module.training",
      isActive: false,
      kind: "app-module",
      label: "Training",
      order: 3,
      routeKey: "training",
      status: "visible",
      target: {
        disabled: true,
        kind: "app-module",
        moduleKey: "training",
      },
      targetKind: "app-module",
    },
    {
      accessMode: "inherit",
      accessSummary: "Inherits Training module access",
      channel: "web",
      description: "Future app module page target.",
      id: "nav.entry.training.matrix",
      isActive: false,
      kind: "entry",
      label: "Training matrix",
      order: 1,
      parentId: "nav.module.training",
      routeKey: "training-matrix",
      status: "visible",
      target: {
        disabled: true,
        kind: "app-module",
        moduleKey: "training",
      },
      targetKind: "app-module",
    },
  ];
}

describe("navigation builder state", () => {
  it("starts with only the locked dashboard and no mock app menu entries", () => {
    const nodes = createInitialNavigationBuilderNodes();
    const dashboard = nodes.find((node) => node.id === navigationBuilderDashboardNodeId);

    expect(dashboard).toMatchObject({
      isLocked: true,
      kind: "locked-dashboard",
      label: "Dashboard",
    });
    expect(nodes).toHaveLength(1);
    expect(JSON.stringify(nodes)).not.toContain("/app/platform-studio/forms");
  });

  it("builds Form View target options from Form Builder models", () => {
    expect(buildNavigationBuilderFormViewTargets([editableFormBuilderModel])).toEqual([
      expect.objectContaining({
        id: "site-audit:field-checklist",
        label: "Site Audit / Field Checklist",
        modelId: "site-audit",
        routePath: "/app/forms/site-audit/views/field-checklist",
        viewId: "field-checklist",
      }),
    ]);
  });

  it("keeps Form View entry labels derived from the selected View title", () => {
    const targets = buildNavigationBuilderFormViewTargets([editableFormBuilderModel]);
    const nodes = createSampleNavigationBuilderNodes();
    const formViewNode = createNavigationBuilderNode("form-view", "nav.module.safety", nodes);
    const selectedTarget = targets[0]!;
    const synced = syncNavigationBuilderFormViewLabels([
      ...nodes,
      {
        ...formViewNode,
        label: "Manual label",
        status: "visible",
        target: {
          kind: "form-view",
          modelId: selectedTarget.modelId,
          routePath: selectedTarget.routePath,
          targetType: "form_builder_view",
          viewId: selectedTarget.viewId,
        },
      },
    ], targets);

    expect(synced.find((node) => node.id === formViewNode.id)?.label).toBe(selectedTarget.viewLabel);
  });

  it("counts draft changes against the saved navigation copy", () => {
    const saved = createSampleNavigationBuilderNodes();
    const draft = updateNavigationBuilderNode(
      cloneNavigationBuilderNodes(saved),
      "nav.entry.safety.inspections",
      (node) => ({
        ...node,
        label: "Safety inspections",
      }),
    );

    expect(countNavigationBuilderUnsavedChanges(draft, saved)).toBe(1);
    expect(countNavigationBuilderUnsavedChanges(saved, saved)).toBe(0);

    const addedNode = createNavigationBuilderNode("app-page", "nav.module.safety", saved);
    expect(countNavigationBuilderUnsavedChanges([...saved, addedNode], saved)).toBe(1);
  });

  it("creates title dividers only at the root level", () => {
    const nodes = createInitialNavigationBuilderNodes();
    const title = createNavigationBuilderNode("section", "nav.module.safety", nodes);

    expect(title).toMatchObject({
      kind: "section",
      label: "New menu title",
    });
    expect(title.parentId).toBeUndefined();
  });

  it("creates fixed-type target entries from the add menu choices", () => {
    const nodes = createSampleNavigationBuilderNodes();
    const formView = createNavigationBuilderNode("form-view", "nav.module.safety", nodes);
    const appPage = createNavigationBuilderNode("app-page", "nav.module.safety", nodes);
    const externalLink = createNavigationBuilderNode("external-link", "nav.module.safety", nodes);

    expect(formView).toMatchObject({
      kind: "entry",
      parentId: "nav.module.safety",
      status: "broken",
      targetKind: "form-view",
    });
    expect(appPage).toMatchObject({
      kind: "entry",
      parentId: "nav.module.safety",
      status: "broken",
      targetKind: "app-page",
    });
    expect(externalLink).toMatchObject({
      kind: "entry",
      parentId: "nav.module.safety",
      status: "broken",
      targetKind: "external-link",
    });
    expect(formView.target).toBeUndefined();
    expect(appPage.target).toBeUndefined();
    expect(externalLink.target).toBeUndefined();
  });

  it("keeps an inspection-ready icon dictionary for app menu nodes", () => {
    expect(navigationBuilderIconOptions.map((option) => option.key)).toEqual(
      expect.arrayContaining([
        "camera",
        "car",
        "clipboard-check",
        "briefcase",
        "fire",
        "folder",
        "hard-hat",
        "layers",
        "map-pin",
        "shield",
        "toolbox",
        "warning",
        "wrench",
      ]),
    );
  });

  it("builds target identities for duplicate detection", () => {
    const nodes = createSampleNavigationBuilderNodes();
    const businessTree = nodes.find((node) => node.id === "nav.entry.safety.business-tree");

    expect(getNavigationBuilderTargetIdentity(businessTree?.target)).toBe("app-page:business-tree");
  });

  it("encodes builder state into the backend definition without the locked dashboard", () => {
    const nodes = createSampleNavigationBuilderNodes();
    const definition = encodeNavigationBuilderDefinition(nodes, navigationBuilderRailItems);
    const safety = definition.appMenu.find((node) => node.id === "nav.module.safety");
    const inspections = safety?.children.find((node) => node.id === "nav.entry.safety.inspections");

    expect(definition.appMenu.some((node) => node.id === navigationBuilderDashboardNodeId)).toBe(false);
    expect(safety).toMatchObject({
      icon: "shield",
      label: "Safety",
      type: "menu_group",
    });
    expect(inspections).toMatchObject({
      target: {
        modelId: "sor",
        type: "form_view",
        viewId: "view-default",
      },
      type: "form_view",
    });
  });

  it("decodes missing backend config to an empty builder tree with only dashboard", () => {
    const emptyDefinition = {
      appMenu: [],
      schemaVersion: 1,
      utilityRail: [],
    };

    expect(decodeNavigationBuilderDefinition(emptyDefinition)).toEqual([
      expect.objectContaining({
        id: navigationBuilderDashboardNodeId,
      }),
    ]);
    expect(decodeNavigationBuilderDefinition(emptyDefinition, { seedWhenEmpty: true })).toEqual([
      expect.objectContaining({
        id: navigationBuilderDashboardNodeId,
      }),
    ]);
  });

  it("removes a navigation node and its children without deleting locked dashboard", () => {
    const nodes = createSampleNavigationBuilderNodes();
    const removedIds = getNavigationBuilderDescendantIds(nodes, "nav.module.training");
    const withoutTraining = removeNavigationBuilderNode(nodes, "nav.module.training");
    const withDashboardAttempt = removeNavigationBuilderNode(nodes, navigationBuilderDashboardNodeId);

    expect([...removedIds].sort()).toEqual([
      "nav.entry.training.matrix",
      "nav.module.training",
    ]);
    expect(withoutTraining.some((node) => node.id === "nav.module.training")).toBe(false);
    expect(withoutTraining.some((node) => node.id === "nav.entry.training.matrix")).toBe(false);
    expect(withDashboardAttempt).toHaveLength(nodes.length);
  });

  it("tracks active state separately from access restriction status", () => {
    const nodes = createSampleNavigationBuilderNodes();
    const safety = nodes.find((node) => node.id === "nav.module.safety");

    expect(safety).toMatchObject({
      status: "restricted",
    });
    expect(isNavigationBuilderNodeActive(safety!)).toBe(true);

    const inactiveSafety = setNavigationBuilderNodeActive(safety!, false);
    expect(inactiveSafety).toMatchObject({
      isActive: false,
      status: "restricted",
    });
    expect(isNavigationBuilderNodeActive(inactiveSafety)).toBe(false);

    const activeSafety = setNavigationBuilderNodeActive(inactiveSafety, true);
    expect(activeSafety).toMatchObject({
      isActive: true,
      status: "restricted",
    });
    expect(isNavigationBuilderNodeActive(activeSafety)).toBe(true);
  });

  it("moves nodes only within their current sidebar level", () => {
    const nodes = createSampleNavigationBuilderNodes();
    const moved = moveNavigationBuilderNode(nodes, "nav.entry.safety.business-tree", "up");
    const safetyChildren = moved
      .filter((node) => node.parentId === "nav.module.safety")
      .sort((left, right) => left.order - right.order)
      .map((node) => node.id);
    const rootNodes = moved
      .filter((node) => !node.parentId)
      .sort((left, right) => left.order - right.order)
      .map((node) => node.id);

    expect(safetyChildren).toEqual([
      "nav.entry.safety.business-tree",
      "nav.entry.safety.inspections",
      "nav.entry.safety.handbook",
    ]);
    expect(rootNodes).toEqual([
      "nav.locked.dashboard",
      "nav.section.operations",
      "nav.module.safety",
      "nav.module.training",
    ]);
  });

  it("reorders nodes by drag target only within their current sidebar level", () => {
    const nodes = createSampleNavigationBuilderNodes();
    const reordered = reorderNavigationBuilderNode(
      nodes,
      "nav.entry.safety.inspections",
      "nav.entry.safety.handbook",
    );
    const safetyChildren = reordered
      .filter((node) => node.parentId === "nav.module.safety")
      .sort((left, right) => left.order - right.order)
      .map((node) => node.id);
    const rootNodes = reordered
      .filter((node) => !node.parentId)
      .sort((left, right) => left.order - right.order)
      .map((node) => node.id);

    expect(safetyChildren).toEqual([
      "nav.entry.safety.business-tree",
      "nav.entry.safety.handbook",
      "nav.entry.safety.inspections",
    ]);
    expect(rootNodes).toEqual([
      "nav.locked.dashboard",
      "nav.section.operations",
      "nav.module.safety",
      "nav.module.training",
    ]);
  });
});
