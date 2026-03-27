import { describe, expect, it } from "vitest";

import type {
  NavigationNode,
  PublishedManifest,
  VisibilitySubjectContext,
} from "@platform/platform-builder-core";
import type { SidebarNavItem } from "@platform/ui-kit";

import {
  getPublishedRuntimeItemId,
  publishedRuntimeSectionId,
} from "../../src/shared/navigation";
import { readPublishedManifest } from "../../src/features/published-app/published-manifest-loader";
import {
  buildPublishedNavigationSidebarItems,
  createPublishedNavigationSection,
} from "../../src/features/published-app/published-navigation-sidebar-adapter";

const copy = {
  emptyLabel: "No published navigation",
  errorLabel: "Published navigation unavailable",
  loadingLabel: "Loading published navigation",
  policyUnavailableLabel: "visibility policy unavailable",
  sectionLabel: "Published App",
};

function createSubject(
  overrides: Partial<VisibilitySubjectContext> = {},
): VisibilitySubjectContext {
  return {
    companyIds: [],
    contactIds: [],
    jobTypeIds: [],
    ...overrides,
  };
}

function flattenSidebarItems(items: SidebarNavItem[]): SidebarNavItem[] {
  return items.flatMap((item) => [
    item,
    ...(item.children ? flattenSidebarItems(item.children) : []),
  ]);
}

function replaceNavigationNode(
  manifest: PublishedManifest,
  routeKey: string,
  update: (
    node: Extract<NavigationNode, { type: "item" }>,
  ) => Extract<NavigationNode, { type: "item" }>,
) {
  return {
    ...manifest,
    navigationNodes: manifest.navigationNodes.map((node) => {
      if (node.type !== "item" || node.routeKey !== routeKey) {
        return node;
      }

      return update(node);
    }),
  };
}

describe("published navigation sidebar adapter", () => {
  it("renders a loud disabled fallback when a referenced visibility policy is missing", () => {
    const manifest = readPublishedManifest();
    const manifestWithMissingPolicy = replaceNavigationNode(
      manifest,
      "workspace-dashboard",
      (node) => ({
        ...node,
        visibilityPolicyId: "policy.missing",
      }),
    );
    const items = flattenSidebarItems(buildPublishedNavigationSidebarItems(
      manifestWithMissingPolicy,
      createSubject(),
      copy,
    ));

    expect(items).toContainEqual(expect.objectContaining({
      disabled: true,
      id: `${getPublishedRuntimeItemId("workspace-dashboard")}:policy-unavailable`,
      label: "Workspace dashboard (visibility policy unavailable)",
    }));
  });

  it("returns the section-level error fallback when the manifest route map is unsafe", () => {
    const manifest = readPublishedManifest();
    const section = createPublishedNavigationSection(
      copy,
      {
        manifest: {
          ...manifest,
          navigationNodes: [
            ...manifest.navigationNodes,
            {
              channels: ["web"],
              id: "nav.item.incidents.duplicate",
              label: "Incidents duplicate",
              order: 99,
              routeKey: "incidents",
              target: {
                kind: "view",
                viewId: "view.incident.list",
              },
              type: "item",
            },
          ],
        },
        status: "ready",
      },
      createSubject({
        contactIds: ["contact.maya-northwind-example"],
      }),
    );

    expect(section).toMatchObject({
      children: [
        {
          disabled: true,
          id: "published-runtime-error",
          label: copy.errorLabel,
        },
      ],
      id: publishedRuntimeSectionId,
      label: copy.sectionLabel,
    });
  });
});
