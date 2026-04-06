import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getWorkspaceShellSidebarState,
  readWorkspaceShellSidebarCollapsedPreference,
  writeWorkspaceShellSidebarCollapsedPreference,
} from "./workspace-shell-sidebar-state";

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

describe("workspace shell sidebar collapse persistence", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem(key: string) {
          return storage.has(key) ? storage.get(key) ?? null : null;
        },
        removeItem(key: string) {
          storage.delete(key);
        },
        setItem(key: string, value: string) {
          storage.set(key, value);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads a saved collapsed preference from localStorage", () => {
    storage.set("tenant-shell-sidebar-collapsed", "1");

    expect(
      readWorkspaceShellSidebarCollapsedPreference("tenant-shell-sidebar-collapsed"),
    ).toBe(true);
  });

  it("stores collapsed preference and clears expanded preference", () => {
    writeWorkspaceShellSidebarCollapsedPreference(
      "tenant-shell-sidebar-collapsed",
      true,
    );
    expect(storage.get("tenant-shell-sidebar-collapsed")).toBe("1");

    writeWorkspaceShellSidebarCollapsedPreference(
      "tenant-shell-sidebar-collapsed",
      false,
    );
    expect(storage.has("tenant-shell-sidebar-collapsed")).toBe(false);
  });

  it("falls back to expanded state when localStorage access throws", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem() {
          throw new Error("localStorage blocked");
        },
        removeItem() {
          throw new Error("localStorage blocked");
        },
        setItem() {
          throw new Error("localStorage blocked");
        },
      },
    });

    expect(
      readWorkspaceShellSidebarCollapsedPreference("tenant-shell-sidebar-collapsed"),
    ).toBe(false);

    expect(() => {
      writeWorkspaceShellSidebarCollapsedPreference(
        "tenant-shell-sidebar-collapsed",
        true,
      );
    }).not.toThrow();
  });
});
