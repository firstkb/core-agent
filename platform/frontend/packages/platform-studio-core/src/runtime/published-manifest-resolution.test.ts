import { describe, expect, it } from "vitest";

import type { PublishedManifest, ViewDefinition } from "../index";
import {
  buildRouteMap,
  PublishedManifestRuntimeError,
  resolveNavigationTarget,
  resolveViewDefinition,
} from "../index";

function createViewDefinition(
  id: string,
  title = "Runtime view",
): ViewDefinition {
  return {
    channel: "web",
    entityId: "entity.incident",
    id,
    key: `${id}.key`,
    nodes: [
      {
        id: `${id}.root`,
        kind: "section",
        slots: { body: [] },
        title,
      },
    ],
    rootNodeId: `${id}.root`,
    title,
    type: "list",
  };
}

function createPublishedManifest(
  overrides: Partial<PublishedManifest> = {},
): PublishedManifest {
  return {
    childCollections: [],
    entities: [],
    fields: [],
    manifestId: "manifest.runtime",
    navigationNodes: [],
    optionSets: [],
    policies: [],
    publishedAt: "2026-03-26T00:00:00.000Z",
    relations: [],
    schemaVersion: 1,
    semanticRoles: [],
    snapshotKind: "published",
    version: 1,
    views: [],
    workflows: [],
    ...overrides,
  };
}

describe("buildRouteMap", () => {
  it("maps only navigation item nodes by route key", () => {
    const manifest = createPublishedManifest({
      navigationNodes: [
        {
          id: "nav.group.operations",
          label: "Operations",
          order: 0,
          type: "group",
        },
        {
          id: "nav.item.incidents",
          label: "Incidents",
          order: 1,
          routeKey: "incidents",
          target: {
            kind: "view",
            viewId: "view.incidents.list",
          },
          type: "item",
        },
        {
          id: "nav.divider.operations",
          order: 2,
          type: "divider",
        },
        {
          id: "nav.item.dashboard",
          label: "Dashboard",
          order: 3,
          routeKey: "dashboard",
          target: {
            kind: "system-module",
            moduleKey: "dashboard",
          },
          type: "item",
        },
      ],
    });

    const routeMap = buildRouteMap(manifest);

    expect(Array.from(routeMap.keys())).toEqual(["incidents", "dashboard"]);
    expect(routeMap.get("incidents")?.navigationNode.id).toBe(
      "nav.item.incidents",
    );
    expect(routeMap.get("dashboard")?.navigationNode.id).toBe(
      "nav.item.dashboard",
    );
  });

  it("throws when duplicate route keys exist", () => {
    const manifest = createPublishedManifest({
      navigationNodes: [
        {
          id: "nav.item.incidents.primary",
          label: "Incidents",
          order: 0,
          routeKey: "incidents",
          target: {
            kind: "view",
            viewId: "view.incidents.list",
          },
          type: "item",
        },
        {
          id: "nav.item.incidents.secondary",
          label: "Incidents secondary",
          order: 1,
          routeKey: "incidents",
          target: {
            kind: "system-module",
            moduleKey: "incident-module",
          },
          type: "item",
        },
      ],
    });

    expect(() => buildRouteMap(manifest)).toThrowError(
      /Duplicate route key "incidents"/,
    );

    try {
      buildRouteMap(manifest);
    } catch (error) {
      expect(error).toBeInstanceOf(PublishedManifestRuntimeError);
      expect((error as PublishedManifestRuntimeError).code).toBe(
        "duplicate-route-key",
      );
      expect((error as PublishedManifestRuntimeError).routeKey).toBe(
        "incidents",
      );
    }
  });
});

describe("resolveViewDefinition", () => {
  it("returns the matching published view definition", () => {
    const manifest = createPublishedManifest({
      views: [createViewDefinition("view.incidents.list", "Incidents")],
    });

    expect(
      resolveViewDefinition(manifest, "view.incidents.list").title,
    ).toBe("Incidents");
  });

  it("throws when the manifest does not contain the view id", () => {
    const manifest = createPublishedManifest();

    expect(() =>
      resolveViewDefinition(manifest, "view.missing"),
    ).toThrowError(/View "view.missing" was not found/);
  });
});

describe("resolveNavigationTarget", () => {
  it("resolves a view target with the published view definition", () => {
    const view = createViewDefinition("view.incidents.list", "Incidents");
    const manifest = createPublishedManifest({
      navigationNodes: [
        {
          id: "nav.item.incidents",
          label: "Incidents",
          order: 0,
          routeKey: "incidents",
          target: {
            kind: "view",
            viewId: view.id,
          },
          type: "item",
        },
      ],
      views: [view],
    });

    const resolvedTarget = resolveNavigationTarget(manifest, "incidents");

    expect(resolvedTarget.kind).toBe("view");
    if (resolvedTarget.kind !== "view") {
      throw new Error("Expected a view target.");
    }

    expect(resolvedTarget.route.navigationNode.id).toBe("nav.item.incidents");
    expect(resolvedTarget.target.viewId).toBe(view.id);
    expect(resolvedTarget.view.title).toBe("Incidents");
  });

  it("resolves system module and external link targets without view lookup", () => {
    const manifest = createPublishedManifest({
      navigationNodes: [
        {
          id: "nav.item.dashboard",
          label: "Dashboard",
          order: 0,
          routeKey: "dashboard",
          target: {
            kind: "system-module",
            moduleKey: "dashboard",
          },
          type: "item",
        },
        {
          id: "nav.item.help",
          label: "Help",
          order: 1,
          routeKey: "help",
          target: {
            kind: "external-link",
            url: "https://example.com/help",
          },
          type: "item",
        },
      ],
    });

    const moduleTarget = resolveNavigationTarget(manifest, "dashboard");
    const linkTarget = resolveNavigationTarget(manifest, "help");

    expect(moduleTarget).toEqual({
      kind: "system-module",
      route: {
        navigationNode: manifest.navigationNodes[0],
        routeKey: "dashboard",
      },
      target: {
        kind: "system-module",
        moduleKey: "dashboard",
      },
    });
    expect(linkTarget).toEqual({
      kind: "external-link",
      route: {
        navigationNode: manifest.navigationNodes[1],
        routeKey: "help",
      },
      target: {
        kind: "external-link",
        url: "https://example.com/help",
      },
    });
  });

  it("throws when the route key is missing from the route map", () => {
    const manifest = createPublishedManifest();

    expect(() =>
      resolveNavigationTarget(manifest, "missing"),
    ).toThrowError(/Route key "missing" was not found/);
  });

  it("throws when a view target references a missing published view", () => {
    const manifest = createPublishedManifest({
      navigationNodes: [
        {
          id: "nav.item.incidents",
          label: "Incidents",
          order: 0,
          routeKey: "incidents",
          target: {
            kind: "view",
            viewId: "view.incidents.list",
          },
          type: "item",
        },
      ],
    });

    expect(() =>
      resolveNavigationTarget(manifest, "incidents"),
    ).toThrowError(
      /View "view\.incidents\.list" referenced by route key "incidents" was not found/,
    );
  });
});
