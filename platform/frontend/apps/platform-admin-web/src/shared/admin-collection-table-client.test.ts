import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAdminCollectionTableAdapter } from "./admin-collection-table-client";

describe("admin-collection-table-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens launch urls returned by backend row actions in a new tab", async () => {
    const openSpy = vi.fn();
    vi.stubGlobal("window", {
      location: {
        assign: vi.fn(),
      },
      open: openSpy,
    });
    const adapter = createAdminCollectionTableAdapter({
      client: {
        createSavedFilterSet: vi.fn(),
        deleteSavedFilterSet: vi.fn(),
        loadMeta: vi.fn(),
        loadSearchSuggestions: vi.fn(),
        query: vi.fn(),
        runRowAction: vi.fn(async () => ({
          launchUrl: "https://demo.platform.local/auth/v1/delegated-root/code",
          ok: true,
          openIn: "new_tab" as const,
        })),
        toggleFavorite: vi.fn(),
      },
      getAccessToken: () => "admin-access-token",
      onUnauthorized: vi.fn(),
    });

    await adapter.runRowAction?.({
      actionId: "open_as_root",
      row: { cells: {}, id: "101" },
      rowId: "101",
    });

    expect(openSpy).toHaveBeenCalledWith(
      "https://demo.platform.local/auth/v1/delegated-root/code",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
