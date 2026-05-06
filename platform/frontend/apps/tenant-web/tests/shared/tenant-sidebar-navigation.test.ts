import { describe, expect, it } from "vitest";

import type { TenantRuntimeNavigationItem } from "@platform/api-client";

import { buildTenantRuntimeSidebarSections } from "../../src/shared/tenant-sidebar-navigation";

function createRuntimeItem(
  id: string,
  label: string,
  type: string,
  overrides: Partial<TenantRuntimeNavigationItem> = {},
): TenantRuntimeNavigationItem {
  return {
    breadcrumb: [label],
    children: [],
    id,
    label,
    type,
    ...overrides,
  };
}

function createMenuTitle(id: string, label: string) {
  return createRuntimeItem(id, label, "menu_title");
}

function createFormViewItem(id: string, label: string) {
  return createRuntimeItem(id, label, "entry", {
    path: `/app/forms/sor/views/${id}`,
    targetType: "form_builder_view",
  });
}

function createMenuGroup(
  id: string,
  label: string,
  children: TenantRuntimeNavigationItem[],
) {
  return createRuntimeItem(id, label, "menu_group", {
    children,
  });
}

describe("tenant sidebar runtime navigation sections", () => {
  it("hides empty, consecutive, and trailing menu titles", () => {
    const sections = buildTenantRuntimeSidebarSections([
      createMenuTitle("nav.title.general", "GENERAL"),
      createMenuTitle("nav.title.forms", "FORMS"),
      createFormViewItem("nav.entry.business-units", "Business Units"),
      createMenuTitle("nav.title.empty", "EMPTY"),
    ]);

    expect(sections.map((section) => ({
      items: section.items.map((item) => item.id),
      label: section.label,
    }))).toEqual([
      {
        items: ["nav.entry.business-units"],
        label: "FORMS",
      },
    ]);
  });

  it("keeps root items before the first menu title in an unlabeled section", () => {
    const sections = buildTenantRuntimeSidebarSections([
      createFormViewItem("nav.entry.contacts", "Contacts"),
      createMenuTitle("nav.title.general", "GENERAL"),
      createFormViewItem("nav.entry.business-tree", "Business Tree"),
    ]);

    expect(sections.map((section) => ({
      items: section.items.map((item) => item.id),
      label: section.label,
    }))).toEqual([
      {
        items: ["nav.entry.contacts"],
        label: undefined,
      },
      {
        items: ["nav.entry.business-tree"],
        label: "GENERAL",
      },
    ]);
  });

  it("opens only the branch that contains the active runtime item by default", () => {
    const sections = buildTenantRuntimeSidebarSections([
      createMenuGroup("nav.group.reference", "Reference", [
        createFormViewItem("nav.entry.business-units", "Business Units"),
        createFormViewItem("nav.entry.contacts", "Contacts"),
      ]),
      createMenuGroup("nav.group.safety", "Safety", [
        createFormViewItem("nav.entry.inspections", "Inspections"),
      ]),
    ], "nav.entry.contacts");

    expect(sections[0]?.items.map((item) => ({
      defaultOpen: item.defaultOpen,
      id: item.id,
    }))).toEqual([
      {
        defaultOpen: true,
        id: "nav.group.reference",
      },
      {
        defaultOpen: false,
        id: "nav.group.safety",
      },
    ]);
  });
});
