import type { BuilderId } from "../contracts/common";
import type {
  PageVisibilityPolicy,
  VisibilityPolicy,
  VisibilityRecipientAssignments,
  VisibilitySubjectContext,
} from "../contracts/policy";

export type VisibilityRecipientEvaluation = {
  hasAssignments: boolean;
  isOpen: boolean;
  matches: boolean;
};

export type VisibilityEvaluation = VisibilityRecipientEvaluation & {
  isVisible: boolean;
};

function hasIds(ids?: BuilderId[]): ids is [BuilderId, ...BuilderId[]] {
  return Array.isArray(ids) && ids.length > 0;
}

function hasOverlap(left?: BuilderId[], right?: BuilderId[]): boolean {
  if (!hasIds(left) || !hasIds(right)) {
    return false;
  }

  const rightIds = new Set(right);

  return left.some((id) => rightIds.has(id));
}

export function hasVisibilityAssignments(
  assignments?: VisibilityRecipientAssignments,
): boolean {
  return Boolean(
    hasIds(assignments?.contactIds)
      || hasIds(assignments?.companyIds)
      || hasIds(assignments?.jobTypeIds),
  );
}

export function matchVisibilityRecipients(
  assignments: VisibilityRecipientAssignments | undefined,
  subject: VisibilitySubjectContext,
): boolean {
  if (!hasVisibilityAssignments(assignments)) {
    return false;
  }

  const contactMatch = hasOverlap(assignments?.contactIds, subject.contactIds);
  const companyMatch = hasOverlap(assignments?.companyIds, subject.companyIds);
  const jobTypeMatch = hasOverlap(assignments?.jobTypeIds, subject.jobTypeIds);

  return contactMatch || (companyMatch && jobTypeMatch);
}

export function evaluateVisibilityRecipients(
  assignments: VisibilityRecipientAssignments | undefined,
  subject: VisibilitySubjectContext,
): VisibilityRecipientEvaluation {
  const hasAssignments = hasVisibilityAssignments(assignments);

  if (!hasAssignments) {
    return {
      hasAssignments,
      isOpen: true,
      matches: false,
    };
  }

  return {
    hasAssignments: true,
    isOpen: false,
    matches: matchVisibilityRecipients(assignments, subject),
  };
}

export function isPageVisibilityPolicy(
  policy: VisibilityPolicy | PageVisibilityPolicy | undefined,
): policy is PageVisibilityPolicy {
  return Boolean(policy && "mode" in policy);
}

export function evaluatePageVisibilityPolicy(
  policy: PageVisibilityPolicy | undefined,
  subject: VisibilitySubjectContext,
): VisibilityEvaluation {
  const recipientEvaluation = evaluateVisibilityRecipients(
    policy?.assignments,
    subject,
  );

  if (!policy || recipientEvaluation.isOpen) {
    return {
      ...recipientEvaluation,
      isVisible: true,
    };
  }

  return {
    ...recipientEvaluation,
    isVisible: policy.mode === "allow-matched"
      ? recipientEvaluation.matches
      : !recipientEvaluation.matches,
  };
}

export function evaluateVisibilityPolicy(
  policy: PageVisibilityPolicy | undefined,
  subject: VisibilitySubjectContext,
): VisibilityEvaluation {
  return evaluatePageVisibilityPolicy(policy, subject);
}

export function isVisibilityAllowed(
  policy: PageVisibilityPolicy | undefined,
  subject: VisibilitySubjectContext,
): boolean {
  return evaluatePageVisibilityPolicy(policy, subject).isVisible;
}
