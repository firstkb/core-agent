import { describe, expect, it } from "vitest";

import type {
  DraftSnapshot,
  PageVisibilityPolicy,
  PolicySet,
  PublishedManifest,
  VisibilityPolicy,
  VisibilitySubjectContext,
} from "../index";
import {
  evaluatePageVisibilityPolicy,
  evaluateVisibilityPolicy,
  evaluateVisibilityRecipients,
  isPageVisibilityPolicy,
  isVisibilityAllowed,
  matchVisibilityRecipients,
  parseDraftSnapshot,
  parsePublishedManifest,
} from "../index";

function createPolicySet(overrides: Partial<PolicySet> = {}): PolicySet {
  return {
    id: "policy.visibility",
    key: "policy.visibility",
    name: "Visibility policy",
    roleKeys: [],
    ...overrides,
  };
}

function createVisibilityPolicy(
  overrides: Partial<VisibilityPolicy> = {},
): VisibilityPolicy {
  return {
    ...overrides,
  };
}

function createPageVisibilityPolicy(
  overrides: Partial<PageVisibilityPolicy> = {},
): PageVisibilityPolicy {
  return {
    mode: "allow-matched",
    ...overrides,
  };
}

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

function createPublishedManifest(
  overrides: Partial<PublishedManifest> = {},
): PublishedManifest {
  return {
    childCollections: [],
    entities: [],
    fields: [],
    manifestId: "manifest.visibility",
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

function createDraftSnapshot(
  overrides: Partial<DraftSnapshot> = {},
): DraftSnapshot {
  return {
    childCollections: [],
    draftId: "draft.visibility",
    entities: [],
    fields: [],
    navigationNodes: [],
    optionSets: [],
    policies: [],
    relations: [],
    schemaVersion: 1,
    semanticRoles: [],
    snapshotKind: "draft",
    updatedAt: "2026-03-26T00:00:00.000Z",
    views: [],
    workflows: [],
    ...overrides,
  };
}

describe("matchVisibilityRecipients", () => {
  it("matches direct contact assignments", () => {
    expect(
      matchVisibilityRecipients(
        {
          contactIds: ["contact.alex"],
        },
        createSubject({
          contactIds: ["contact.alex"],
        }),
      ),
    ).toBe(true);
  });

  it("matches company and job type assignments together", () => {
    expect(
      matchVisibilityRecipients(
        {
          companyIds: ["company.acme"],
          jobTypeIds: ["jobtype.inspector"],
        },
        createSubject({
          companyIds: ["company.acme"],
          jobTypeIds: ["jobtype.inspector"],
        }),
      ),
    ).toBe(true);
  });

  it("does not match company assignments without a matching job type", () => {
    expect(
      matchVisibilityRecipients(
        {
          companyIds: ["company.acme"],
          jobTypeIds: ["jobtype.inspector"],
        },
        createSubject({
          companyIds: ["company.acme"],
        }),
      ),
    ).toBe(false);
  });
});

describe("evaluateVisibilityRecipients", () => {
  it("supports generic assignments without page polarity", () => {
    expect(
      evaluateVisibilityRecipients(
        createVisibilityPolicy({
          assignments: {
            companyIds: ["company.acme"],
            jobTypeIds: ["jobtype.inspector"],
          },
        }).assignments,
        createSubject({
          companyIds: ["company.acme"],
          jobTypeIds: ["jobtype.inspector"],
        }),
      ),
    ).toEqual({
      hasAssignments: true,
      isOpen: false,
      matches: true,
    });
  });

  it("treats empty assignments as open access", () => {
    expect(
      evaluateVisibilityRecipients(
        createVisibilityPolicy({
          assignments: {},
        }).assignments,
        createSubject(),
      ),
    ).toEqual({
      hasAssignments: false,
      isOpen: true,
      matches: false,
    });
  });
});

describe("evaluatePageVisibilityPolicy", () => {
  it("allows matched recipients in allow mode", () => {
    expect(
      evaluateVisibilityPolicy(
        createPageVisibilityPolicy({
          assignments: {
            contactIds: ["contact.alex"],
          },
          mode: "allow-matched",
        }),
        createSubject({
          contactIds: ["contact.alex"],
        }),
      ),
    ).toEqual({
      hasAssignments: true,
      isOpen: false,
      isVisible: true,
      matches: true,
    });
  });

  it("denies unmatched recipients in allow mode", () => {
    expect(
      isVisibilityAllowed(
        createPageVisibilityPolicy({
          assignments: {
            contactIds: ["contact.alex"],
          },
          mode: "allow-matched",
        }),
        createSubject({
          contactIds: ["contact.sam"],
        }),
      ),
    ).toBe(false);
  });

  it("denies matched recipients in deny mode", () => {
    expect(
      isVisibilityAllowed(
        createPageVisibilityPolicy({
          assignments: {
            contactIds: ["contact.alex"],
          },
          mode: "deny-matched",
        }),
        createSubject({
          contactIds: ["contact.alex"],
        }),
      ),
    ).toBe(false);
  });

  it("allows unmatched recipients in deny mode", () => {
    expect(
      evaluatePageVisibilityPolicy(
        createPageVisibilityPolicy({
          assignments: {
            contactIds: ["contact.alex"],
          },
          mode: "deny-matched",
        }),
        createSubject({
          contactIds: ["contact.sam"],
        }),
      ),
    ).toEqual({
      hasAssignments: true,
      isOpen: false,
      isVisible: true,
      matches: false,
    });
  });

  it("marks page visibility policies explicitly", () => {
    expect(
      isPageVisibilityPolicy(
        createVisibilityPolicy({
          assignments: {
            contactIds: ["contact.alex"],
          },
        }),
      ),
    ).toBe(false);

    expect(
      isPageVisibilityPolicy(
        createPageVisibilityPolicy({
          assignments: {
            contactIds: ["contact.alex"],
          },
        }),
      ),
    ).toBe(true);
  });
});

describe("policy parsing compatibility", () => {
  it("parses generic visibility assignments without page polarity", () => {
    const manifest = parsePublishedManifest(
      createPublishedManifest({
        policies: [
          createPolicySet({
            visibility: {
              assignments: {
                companyIds: ["company.acme"],
                jobTypeIds: ["jobtype.inspector"],
              },
            },
          }),
        ],
      }),
    );

    expect(manifest.policies[0]?.visibility).toEqual({
      assignments: {
        companyIds: ["company.acme"],
        jobTypeIds: ["jobtype.inspector"],
      },
    });
    expect(isPageVisibilityPolicy(manifest.policies[0]?.visibility)).toBe(false);
  });

  it("parses a page visibility policy with explicit polarity", () => {
    const manifest = parsePublishedManifest(
      createPublishedManifest({
        policies: [
          createPolicySet({
            visibility: {
              assignments: {
                companyIds: ["company.acme"],
                jobTypeIds: ["jobtype.inspector"],
              },
              mode: "allow-matched",
            },
          }),
        ],
      }),
    );

    expect(manifest.policies[0]?.visibility).toEqual({
      assignments: {
        companyIds: ["company.acme"],
        jobTypeIds: ["jobtype.inspector"],
      },
      mode: "allow-matched",
    });
    expect(isPageVisibilityPolicy(manifest.policies[0]?.visibility)).toBe(true);
  });

  it("rejects invalid page visibility polarity", () => {
    expect(() =>
      parsePublishedManifest(
        createPublishedManifest({
          policies: [
            createPolicySet({
              visibility: {
                assignments: {
                  contactIds: ["contact.alex"],
                },
                mode: "invalid-mode" as never,
              },
            }),
          ],
        }),
      ),
    ).toThrow();
  });

  it("keeps old policy fixtures valid when visibility is absent", () => {
    const policies = [
      createPolicySet({
        actionPolicies: [
          {
            actionKey: "builder.publish",
            allowed: true,
          },
        ],
        description: "Legacy policy fixture without visibility.",
        fieldPolicies: [
          {
            access: "editable",
            fieldId: "field.incident.title",
          },
        ],
        id: "policy.builder.admin",
        key: "builder.admin",
        name: "Builder admin",
        roleKeys: ["tenant.admin"],
      }),
    ];

    const manifest = parsePublishedManifest(
      createPublishedManifest({
        policies,
      }),
    );
    const draft = parseDraftSnapshot(
      createDraftSnapshot({
        policies,
      }),
    );

    expect(manifest.policies[0]?.visibility).toBeUndefined();
    expect(draft.policies[0]?.visibility).toBeUndefined();
    expect(manifest.policies[0]?.roleKeys).toEqual(["tenant.admin"]);
    expect(draft.policies[0]?.roleKeys).toEqual(["tenant.admin"]);
  });
});
