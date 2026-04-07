import { renderToStaticMarkup } from "react-dom/server";

import type { CollectionTableAdapter } from "@platform/collection-table";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { collectionTablePageSpy } = vi.hoisted(() => ({
  collectionTablePageSpy: vi.fn(),
}));

vi.mock("@platform/collection-table", async () => {
  const React = await import("react");

  return {
    CollectionTablePage: (props: unknown) => {
      collectionTablePageSpy(props);
      return React.createElement("div");
    },
  };
});

import { AdminCollectionTablePage } from "./admin-collection-table-page";
import { AdminNavigationRefreshProvider } from "./admin-navigation-refresh";

function createAdapter() {
  return {
    loadMeta: vi.fn(),
    query: vi.fn(),
  } as unknown as CollectionTableAdapter;
}

describe("admin-collection-table-page", () => {
  beforeEach(() => {
    collectionTablePageSpy.mockClear();
  });

  it("wires the admin navigation refresh seam into favorite toggle success", async () => {
    const onNavigationRefresh = vi.fn(async () => {});

    renderToStaticMarkup(
      <AdminNavigationRefreshProvider onNavigationRefresh={onNavigationRefresh}>
        <AdminCollectionTablePage
          adapter={createAdapter()}
          tableId="employees.list"
        />
      </AdminNavigationRefreshProvider>,
    );

    expect(collectionTablePageSpy).toHaveBeenCalledTimes(1);

    const props = collectionTablePageSpy.mock.calls[0][0] as {
      onFavoriteToggleSuccess?: (event: {
        isFavorite: boolean;
        surfaceId: string;
        tableId: string;
      }) => Promise<void>;
      tableId: string;
    };

    expect(props.tableId).toBe("employees.list");
    expect(props.onFavoriteToggleSuccess).toBeTypeOf("function");

    await props.onFavoriteToggleSuccess?.({
      isFavorite: true,
      surfaceId: "employees.list",
      tableId: "employees.list",
    });

    expect(onNavigationRefresh).toHaveBeenCalledTimes(1);
  });
});
