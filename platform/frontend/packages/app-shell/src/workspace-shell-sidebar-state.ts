export type WorkspaceShellLayout = "classic" | "rail";

const collapsedSidebarPreferenceValue = "1";

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

export function readWorkspaceShellSidebarCollapsedPreference(
  storageKey?: string,
): boolean {
  if (typeof window === "undefined" || !storageKey) {
    return false;
  }

  try {
    return window.localStorage.getItem(storageKey) === collapsedSidebarPreferenceValue;
  } catch {
    return false;
  }
}

export function writeWorkspaceShellSidebarCollapsedPreference(
  storageKey: string | undefined,
  isCollapsed: boolean,
) {
  if (typeof window === "undefined" || !storageKey) {
    return;
  }

  try {
    if (isCollapsed) {
      window.localStorage.setItem(storageKey, collapsedSidebarPreferenceValue);
      return;
    }

    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage failures so the shell stays usable in restricted environments.
  }
}

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
