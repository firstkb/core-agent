export type WorkspaceShellLayout = "classic" | "rail";

type WorkspaceShellSidebarStateOptions = {
  enableCollapsedRailHoverPreview: boolean;
  isCollapsedRailHoverPreviewOpen: boolean;
  isMobileViewport: boolean;
  isSidebarCollapsed: boolean;
  layout: WorkspaceShellLayout;
};

type WorkspaceShellSidebarState = {
  isCollapsedRailHoverPreviewEnabled: boolean;
  isCollapsedRailHoverPreviewVisible: boolean;
  shellIsSidebarCollapsed: boolean;
};

export function getWorkspaceShellSidebarState({
  enableCollapsedRailHoverPreview,
  isCollapsedRailHoverPreviewOpen,
  isMobileViewport,
  isSidebarCollapsed,
  layout,
}: WorkspaceShellSidebarStateOptions): WorkspaceShellSidebarState {
  const shellIsSidebarCollapsed = layout === "rail" && !isMobileViewport && isSidebarCollapsed;
  const isCollapsedRailHoverPreviewEnabled = enableCollapsedRailHoverPreview && shellIsSidebarCollapsed;

  return {
    isCollapsedRailHoverPreviewEnabled,
    isCollapsedRailHoverPreviewVisible:
      isCollapsedRailHoverPreviewEnabled && isCollapsedRailHoverPreviewOpen,
    shellIsSidebarCollapsed,
  };
}
