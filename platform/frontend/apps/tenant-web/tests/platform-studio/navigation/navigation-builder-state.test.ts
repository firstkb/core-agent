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
  reorderNavigationBuilderNode,
  removeNavigationBuilderNode,
  setNavigationBuilderNodeActive,
  syncNavigationBuilderFormViewLabels,
  updateNavigationBuilderNode,
} from "../../../src/features/platform-studio/navigation/navigation-builder-state";
import { editableFormBuilderModel } from "../forms-test-fixtures";

describe("navigation builder state", () => {
  it("seeds a locked dashboard and app module entries without preview routes", () => {
    const nodes = createInitialNavigationBuilderNodes();
    const dashboard = nodes.find((node) => node.id === navigationBuilderDashboardNodeId);
    const appModule = nodes.find((node) => node.kind === "app-module" && node.label === "Safety");
    const formEntry = nodes.find((node) => node.id === "nav.entry.safety.inspections");

    expect(dashboard).toMatchObject({
      isLocked: true,
      kind: "locked-dashboard",
      label: "Dashboard",
    });
    expect(appModule).toMatchObject({
      kind: "app-module",
      label: "Safety",
    });
    expect(formEntry?.target).toMatchObject({
      kind: "form-view",
      modelId: "sor",
      routePath: "/app/forms/sor/views/view-default",
      targetType: "form_builder_view",
      viewId: "view-default",
    });
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
    const nodes = createInitialNavigationBuilderNodes();
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
    const saved = createInitialNavigationBuilderNodes();
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
    const nodes = createInitialNavigationBuilderNodes();
    const formView = createNavigationBuilderNode("form-view", "nav.module.safety", nodes);
    const appPage = createNavigationBuilderNode("app-page", "nav.module.safety", nodes);

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
    expect(formView.target).toBeUndefined();
    expect(appPage.target).toBeUndefined();
  });

  it("keeps a simple icon dictionary for container nodes", () => {
    expect(navigationBuilderIconOptions.map((option) => option.key)).toEqual(
      expect.arrayContaining(["folder", "layers", "shield", "briefcase"]),
    );
  });

  it("builds target identities for duplicate detection", () => {
    const nodes = createInitialNavigationBuilderNodes();
    const businessTree = nodes.find((node) => node.id === "nav.entry.safety.business-tree");

    expect(getNavigationBuilderTargetIdentity(businessTree?.target)).toBe("app-page:business-tree");
  });

  it("removes a navigation node and its children without deleting locked dashboard", () => {
    const nodes = createInitialNavigationBuilderNodes();
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
    const nodes = createInitialNavigationBuilderNodes();
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
    const nodes = createInitialNavigationBuilderNodes();
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
    const nodes = createInitialNavigationBuilderNodes();
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
