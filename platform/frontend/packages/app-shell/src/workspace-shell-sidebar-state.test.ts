import { describe, expect, it } from "vitest";

import { getWorkspaceShellSidebarState } from "./workspace-shell-sidebar-state";

describe("workspace shell sidebar state", () => {
  it("keeps classic layout out of collapsed rail preview mode", () => {
    expect(
      getWorkspaceShellSidebarState({
        enableCollapsedRailHoverPreview: true,
        isCollapsedRailHoverPreviewOpen: true,
        isMobileViewport: false,
        isSidebarCollapsed: true,
        layout: "classic",
      }),
    ).toEqual({
      isCollapsedRailHoverPreviewEnabled: false,
      isCollapsedRailHoverPreviewVisible: false,
      shellIsSidebarCollapsed: false,
    });
  });

  it("disables collapsed rail preview on mobile viewports", () => {
    expect(
      getWorkspaceShellSidebarState({
        enableCollapsedRailHoverPreview: true,
        isCollapsedRailHoverPreviewOpen: true,
        isMobileViewport: true,
        isSidebarCollapsed: true,
        layout: "rail",
      }),
    ).toEqual({
      isCollapsedRailHoverPreviewEnabled: false,
      isCollapsedRailHoverPreviewVisible: false,
      shellIsSidebarCollapsed: false,
    });
  });

  it("keeps pinned collapsed state separate from preview visibility when opt-in is disabled", () => {
    expect(
      getWorkspaceShellSidebarState({
        enableCollapsedRailHoverPreview: false,
        isCollapsedRailHoverPreviewOpen: true,
        isMobileViewport: false,
        isSidebarCollapsed: true,
        layout: "rail",
      }),
    ).toEqual({
      isCollapsedRailHoverPreviewEnabled: false,
      isCollapsedRailHoverPreviewVisible: false,
      shellIsSidebarCollapsed: true,
    });
  });

  it("shows hover preview only for opt-in pinned collapsed rail state", () => {
    expect(
      getWorkspaceShellSidebarState({
        enableCollapsedRailHoverPreview: true,
        isCollapsedRailHoverPreviewOpen: true,
        isMobileViewport: false,
        isSidebarCollapsed: true,
        layout: "rail",
      }),
    ).toEqual({
      isCollapsedRailHoverPreviewEnabled: true,
      isCollapsedRailHoverPreviewVisible: true,
      shellIsSidebarCollapsed: true,
    });
  });
});
