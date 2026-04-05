import { describe, expect, it } from "vitest";

import type { CollectionTableMetaResponse } from "./collection-table-contract";
import { createCollectionRenderConfig } from "./collection-table-render";

function createMeta(
  overrides: Partial<CollectionTableMetaResponse> = {},
): CollectionTableMetaResponse {
  return {
    columns: [
      { defaultVisible: true, fieldId: "module_title", id: "module_title", label: "Module", type: "text" },
      { defaultVisible: true, fieldId: "status", id: "status", label: "Status", type: "badge" },
    ],
    fields: [
      { id: "module_title", label: "Module", searchable: true, sortable: true, suggestable: true, type: "text" },
      { id: "status", label: "Status", searchable: true, sortable: true, suggestable: true, type: "badge" },
    ],
    rowActions: [{ execution: "frontend", id: "edit", kind: "button" }],
    surfaceId: "module-registry.list",
    title: "Module registry",
    ...overrides,
  };
}

describe("collection-table-render", () => {
  it("injects a visible actions column when row actions are provided without one", () => {
    const config = createCollectionRenderConfig(createMeta(), {
      getRowActionLabel: (action) => action.id,
      resolveRowAction: (action) => ({ id: action.id, label: action.id }),
    });

    expect(config.columns.map((column) => column.id)).toEqual([
      "actions",
      "module_title",
      "status",
    ]);
  });
});
