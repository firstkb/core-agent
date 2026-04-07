import { describe, expect, it } from "vitest";

import type {
  PublishedManifest,
  VisibilitySubjectContext,
} from "@platform/platform-studio-core";

import { readPublishedManifest } from "../../src/features/published-app/published-manifest-loader";
import { resolvePublishedAppRoutePageState } from "../../src/features/published-app/published-app-route-page-state";

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

function replaceRouteVisibilityPolicyId(
  manifest: PublishedManifest,
  routeKey: string,
  visibilityPolicyId?: string,
): PublishedManifest {
  return {
    ...manifest,
    navigationNodes: manifest.navigationNodes.map((node) => {
      if (node.type !== "item" || node.routeKey !== routeKey) {
        return node;
      }

      return {
        ...node,
        visibilityPolicyId,
      };
    }),
  };
}

describe("resolvePublishedAppRoutePageState", () => {
  it("returns a rendered view state for an allowed published route", () => {
    const manifest = readPublishedManifest();
    const state = resolvePublishedAppRoutePageState({
      manifest,
      routeKey: "incidents",
      subject: createSubject({
        contactIds: ["contact.maya-northwind-example"],
      }),
    });

    expect(state.status).toBe("view");

    if (state.status !== "view") {
      throw new Error("Expected a published view route state.");
    }

    expect(state.resolvedTarget.view.id).toBe("view.incident.list");
  });

  it("returns an explicit access denied state for a denied published route", () => {
    const manifest = readPublishedManifest();
    const state = resolvePublishedAppRoutePageState({
      manifest,
      routeKey: "incident-record",
      subject: createSubject({
        contactIds: ["contact.field-operator"],
      }),
    });

    expect(state.status).toBe("access-denied");

    if (state.status !== "access-denied") {
      throw new Error("Expected an access denied route state.");
    }

    expect(state.access.policyId).toBe("policy.runtime.admin");
    expect(state.access.policy.mode).toBe("allow-matched");
    expect(state.access.evaluation.isVisible).toBe(false);
  });

  it("returns a visibility configuration error when a referenced policy is missing", () => {
    const manifest = readPublishedManifest();
    const manifestWithMissingPolicy = replaceRouteVisibilityPolicyId(
      manifest,
      "workspace-dashboard",
      "policy.missing",
    );
    const state = resolvePublishedAppRoutePageState({
      manifest: manifestWithMissingPolicy,
      routeKey: "workspace-dashboard",
      subject: createSubject(),
    });

    expect(state.status).toBe("visibility-config-error");

    if (state.status !== "visibility-config-error") {
      throw new Error("Expected a visibility configuration error state.");
    }

    expect(state.access.errorCode).toBe("policy-not-found");
    expect(state.access.policyId).toBe("policy.missing");
  });
});
