import { useMemo } from "react";

import { useAuth } from "@platform/auth-core";
import type { VisibilitySubjectContext } from "@platform/platform-studio-core";

type PublishedVisibilitySubjectOverrideMode = "merge" | "replace";

type PublishedVisibilitySubjectOverride = VisibilitySubjectContext & {
  mode?: PublishedVisibilitySubjectOverrideMode;
};

export const publishedVisibilitySubjectOverrideStorageKey =
  "tenant.published-runtime.visibility-subject";

const defaultDemoSubjectByUserId: Record<string, VisibilitySubjectContext> = {
  "demo-user-1": {
    companyIds: ["company.northwind"],
    contactIds: ["contact.demo-user-1"],
    jobTypeIds: ["jobtype.tenant-admin"],
  },
  "maya-northwind-example": {
    companyIds: ["company.northwind"],
    contactIds: ["contact.maya-northwind-example"],
    jobTypeIds: ["jobtype.tenant-admin"],
  },
};

function normalizeSubjectId(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeSubjectIds(values?: readonly (string | null | undefined)[]) {
  return Array.from(new Set(
    (values ?? [])
      .map((value) => normalizeSubjectId(value))
      .filter((value) => value.length > 0),
  ));
}

function mergeSubjectIds(
  baseValues?: readonly (string | null | undefined)[],
  overrideValues?: readonly (string | null | undefined)[],
) {
  return normalizeSubjectIds([...(baseValues ?? []), ...(overrideValues ?? [])]);
}

function normalizeSubjectContext(
  subject: VisibilitySubjectContext,
): VisibilitySubjectContext {
  return {
    companyIds: normalizeSubjectIds(subject.companyIds),
    contactIds: normalizeSubjectIds(subject.contactIds),
    jobTypeIds: normalizeSubjectIds(subject.jobTypeIds),
  };
}

function parseSubjectIds(value: unknown) {
  if (Array.isArray(value)) {
    return normalizeSubjectIds(
      value.flatMap((entry) => (typeof entry === "string" ? [entry] : [])),
    );
  }

  if (typeof value === "string") {
    return normalizeSubjectIds(value.split(","));
  }

  return undefined;
}

function parsePublishedVisibilitySubjectOverrideMode(value: unknown) {
  if (value === "merge" || value === "replace") {
    return value;
  }

  return undefined;
}

export function parsePublishedVisibilitySubjectOverride(
  value?: string | null,
): PublishedVisibilitySubjectOverride | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue === "anonymous") {
    return {
      companyIds: [],
      contactIds: [],
      jobTypeIds: [],
      mode: "replace",
    };
  }

  try {
    const parsedValue = JSON.parse(normalizedValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    const overrideValue = parsedValue as Record<string, unknown>;

    return {
      companyIds: parseSubjectIds(overrideValue.companyIds),
      contactIds: parseSubjectIds(overrideValue.contactIds),
      jobTypeIds: parseSubjectIds(overrideValue.jobTypeIds),
      mode: parsePublishedVisibilitySubjectOverrideMode(overrideValue.mode),
    };
  } catch {
    return null;
  }
}

function createFallbackPublishedVisibilitySubject(userId: string) {
  return normalizeSubjectContext({
    companyIds: userId.includes("northwind") ? ["company.northwind"] : [],
    contactIds: userId ? [`contact.${userId}`] : [],
    jobTypeIds: userId === "demo-user-1" ? ["jobtype.tenant-admin"] : [],
  });
}

export function createPublishedVisibilitySubjectFromSession(
  userId?: string | null,
): VisibilitySubjectContext {
  const normalizedUserId = normalizeSubjectId(userId);

  if (!normalizedUserId) {
    return normalizeSubjectContext({
      companyIds: [],
      contactIds: [],
      jobTypeIds: [],
    });
  }

  const defaultSubject = defaultDemoSubjectByUserId[normalizedUserId];
  if (defaultSubject) {
    return normalizeSubjectContext(defaultSubject);
  }

  return createFallbackPublishedVisibilitySubject(normalizedUserId);
}

export function resolvePublishedVisibilitySubject({
  override,
  userId,
}: {
  override?: string | null;
  userId?: string | null;
}): VisibilitySubjectContext {
  const sessionSubject = createPublishedVisibilitySubjectFromSession(userId);
  const subjectOverride = parsePublishedVisibilitySubjectOverride(override);

  if (!subjectOverride) {
    return sessionSubject;
  }

  if (subjectOverride.mode === "replace") {
    return normalizeSubjectContext(subjectOverride);
  }

  if (subjectOverride.mode === "merge") {
    return normalizeSubjectContext({
      companyIds: mergeSubjectIds(
        sessionSubject.companyIds,
        subjectOverride.companyIds,
      ),
      contactIds: mergeSubjectIds(
        sessionSubject.contactIds,
        subjectOverride.contactIds,
      ),
      jobTypeIds: mergeSubjectIds(
        sessionSubject.jobTypeIds,
        subjectOverride.jobTypeIds,
      ),
    });
  }

  return normalizeSubjectContext({
    companyIds: subjectOverride.companyIds ?? sessionSubject.companyIds,
    contactIds: subjectOverride.contactIds ?? sessionSubject.contactIds,
    jobTypeIds: subjectOverride.jobTypeIds ?? sessionSubject.jobTypeIds,
  });
}

export function readPublishedVisibilitySubjectOverride() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(
      publishedVisibilitySubjectOverrideStorageKey,
    );
  } catch {
    return null;
  }
}

export function usePublishedVisibilitySubject() {
  const { userId } = useAuth();
  const subjectOverride = readPublishedVisibilitySubjectOverride();

  return useMemo(() => {
    return resolvePublishedVisibilitySubject({
      override: subjectOverride,
      userId,
    });
  }, [subjectOverride, userId]);
}
