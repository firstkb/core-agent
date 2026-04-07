import type {
  NavigationItemNode,
  PageVisibilityPolicy,
  PolicySet,
  PublishedManifest,
  VisibilityEvaluation,
  VisibilitySubjectContext,
} from "@platform/platform-studio-core";
import {
  evaluatePageVisibilityPolicy,
  isPageVisibilityPolicy,
} from "@platform/platform-studio-core";

export type PublishedNavigationAccessConfigurationErrorCode =
  | "policy-not-found"
  | "policy-not-page-visibility";

export type PublishedNavigationItemVisibleAccessResult = {
  status: "visible";
};

export type PublishedNavigationItemDeniedAccessResult = {
  evaluation: VisibilityEvaluation;
  policy: PageVisibilityPolicy;
  policyId: string;
  policySet: PolicySet;
  status: "denied";
};

export type PublishedNavigationItemConfigurationErrorAccessResult = {
  errorCode: PublishedNavigationAccessConfigurationErrorCode;
  policyId: string;
  policySet?: PolicySet;
  status: "configuration-error";
};

export type PublishedNavigationItemAccessResult =
  | PublishedNavigationItemVisibleAccessResult
  | PublishedNavigationItemDeniedAccessResult
  | PublishedNavigationItemConfigurationErrorAccessResult;

function findManifestPolicySet(
  manifest: PublishedManifest,
  policyId: string,
): PolicySet | undefined {
  return manifest.policies.find((policy) => policy.id === policyId);
}

export function resolvePublishedNavigationItemAccess({
  manifest,
  navigationItem,
  subject,
}: {
  manifest: PublishedManifest;
  navigationItem: NavigationItemNode;
  subject: VisibilitySubjectContext;
}): PublishedNavigationItemAccessResult {
  const policyId = navigationItem.visibilityPolicyId;

  if (!policyId) {
    return {
      status: "visible",
    };
  }

  const policySet = findManifestPolicySet(manifest, policyId);

  if (!policySet) {
    return {
      errorCode: "policy-not-found",
      policyId,
      status: "configuration-error",
    };
  }

  if (!policySet.visibility) {
    return {
      errorCode: "policy-not-page-visibility",
      policyId,
      policySet,
      status: "configuration-error",
    };
  }

  if (!isPageVisibilityPolicy(policySet.visibility)) {
    return {
      errorCode: "policy-not-page-visibility",
      policyId,
      policySet,
      status: "configuration-error",
    };
  }

  const evaluation = evaluatePageVisibilityPolicy(policySet.visibility, subject);

  if (evaluation.isVisible) {
    return {
      status: "visible",
    };
  }

  return {
    evaluation,
    policy: policySet.visibility,
    policyId,
    policySet,
    status: "denied",
  };
}
