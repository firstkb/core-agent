import { describe, expect, it } from "vitest";

import type { TenantRuntimeNavigationItem } from "@platform/api-client";

import { tenantRuntimeNavigationIncludesTargetPath } from "../../src/shared/tenant-runtime-navigation";

function createRuntimeItem(
  id: string,
  overrides: Partial<TenantRuntimeNavigationItem> = {},
): TenantRuntimeNavigationItem {
  return {
    breadcrumb: [id],
    children: [],
    id,
    label: id,
    type: "entry",
    ...overrides,
  };
}

describe("tenant runtime navigation target guards", () => {
  it("matches visible app page targets by path", () => {
    const items = [
      createRuntimeItem("nav.group.reference", {
        children: [
          createRuntimeItem("nav.entry.business-tree", {
            path: "/app/pages/business-tree",
            targetType: "app_page",
          }),
        ],
        type: "menu_group",
      }),
    ];

    expect(tenantRuntimeNavigationIncludesTargetPath(
      items,
      "app_page",
      "/app/pages/business-tree",
    )).toBe(true);
  });

  it("does not allow a route when the filtered runtime tree omits the parent branch", () => {
    expect(tenantRuntimeNavigationIncludesTargetPath(
      [],
      "app_page",
      "/app/pages/business-tree",
    )).toBe(false);
  });

  it("allows form view child routes through the visible base target", () => {
    const items = [
      createRuntimeItem("nav.entry.accounts", {
        path: "/app/forms/users/views/view-accounts",
        targetType: "form_view",
      }),
    ];

    expect(tenantRuntimeNavigationIncludesTargetPath(
      items,
      "form_view",
      "/app/forms/users/views/view-accounts/new",
    )).toBe(true);
  });
});
