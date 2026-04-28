import { describe, expect, it } from "vitest";
import { ApiClientError } from "@platform/api-client";

import {
  resolveBootstrapSession,
  resolveCrossTabRefreshWaitMs,
  resolveMissingSessionStatus,
  resolveRecoveryRetryDelayMs,
  resolveRefreshFailureDisposition,
  resolveRefreshLeadTimeMs,
} from "./auth-provider";
import type { StoredAuthSession } from "./auth-storage";

function createTokenPayloadBase64(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function createAccessToken(expiresAt: number, issuedAt?: number) {
  if (typeof issuedAt !== "number") {
    return "header.payload.signature";
  }

  return [
    createTokenPayloadBase64({ alg: "RS256", typ: "JWT" }),
    createTokenPayloadBase64({
      exp: Math.floor(expiresAt / 1000),
      iat: Math.floor(issuedAt / 1000),
      sub: "user-1",
    }),
    "signature",
  ].join(".");
}

function createSession(expiresAt: number, options?: { issuedAt?: number }): StoredAuthSession {
  return {
    accessToken: createAccessToken(expiresAt, options?.issuedAt),
    expiresAt,
  };
}

function createApiError(statusCode: number) {
  return new ApiClientError(`Request failed with status ${statusCode}.`, {
    responseStatus: statusCode === 401 || statusCode === 403 ? "unauthorized" : undefined,
    statusCode,
  });
}

describe("resolveBootstrapSession", () => {
  it("returns null when the candidate session is missing", () => {
    expect(resolveBootstrapSession(null)).toBeNull();
  });

  it("returns null when the candidate session is already inside the refresh lead window", () => {
    const now = Date.now();

    expect(
      resolveBootstrapSession(createSession(now + 30_000), now),
    ).toBeNull();
  });

  it("keeps a candidate session that is still safely valid", () => {
    const now = Date.now();
    const session = createSession(now + 5 * 60_000);

    expect(resolveBootstrapSession(session, now)).toEqual(session);
  });

  it("does not force immediate bootstrap refresh for short-lived tokens outside the dynamic lead window", () => {
    const now = Date.now();
    const session = createSession(now + 30_000, {
      issuedAt: now - 30_000,
    });

    expect(resolveBootstrapSession(session, now)).toEqual(session);
  });

  it("enters the dynamic refresh window for short-lived tokens near expiry", () => {
    const now = Date.now();
    const session = createSession(now + 10_000, {
      issuedAt: now - 50_000,
    });

    expect(resolveBootstrapSession(session, now)).toBeNull();
  });
});

describe("resolveRefreshLeadTimeMs", () => {
  it("caps the lead window for long-lived tokens at sixty seconds", () => {
    const now = 1_700_000_000_000;
    const session = createSession(now + 15 * 60_000, {
      issuedAt: now,
    });

    expect(resolveRefreshLeadTimeMs(session)).toBe(60_000);
  });

  it("scales the lead window down for short-lived tokens", () => {
    const now = 1_700_000_000_000;
    const session = createSession(now + 60_000, {
      issuedAt: now,
    });

    expect(resolveRefreshLeadTimeMs(session)).toBe(12_000);
  });
});

describe("resolveCrossTabRefreshWaitMs", () => {
  it("waits longer than the refresh lock ttl so a stalled owner does not force followers out", () => {
    expect(resolveCrossTabRefreshWaitMs()).toBe(15_550);
  });
});

describe("resolveMissingSessionStatus", () => {
  it("keeps auth in recovery mode while a session hint still exists", () => {
    expect(resolveMissingSessionStatus(true)).toBe("unknown");
  });

  it("falls back to anonymous when there is no recoverable session hint", () => {
    expect(resolveMissingSessionStatus(false)).toBe("anonymous");
  });
});

describe("resolveRecoveryRetryDelayMs", () => {
  it("starts retries quickly and backs off between attempts", () => {
    expect(resolveRecoveryRetryDelayMs(0)).toBe(1_000);
    expect(resolveRecoveryRetryDelayMs(1)).toBe(2_000);
    expect(resolveRecoveryRetryDelayMs(2)).toBe(4_000);
  });

  it("caps recovery delay growth so retries do not disappear for minutes", () => {
    expect(resolveRecoveryRetryDelayMs(8)).toBe(30_000);
  });
});

describe("resolveRefreshFailureDisposition", () => {
  it("clears the session after a hard unauthorized refresh failure", () => {
    const session = createSession(Date.now() - 1_000);

    expect(resolveRefreshFailureDisposition(createApiError(401), session)).toBe("clear");
  });

  it("keeps an active session when refresh fails with a temporary transport error", () => {
    const session = createSession(Date.now() + 60_000);

    expect(resolveRefreshFailureDisposition(new Error("network error"), session)).toBe("retain");
  });

  it("enters recovery when an expired session hits a temporary refresh failure", () => {
    const session = createSession(Date.now() - 1_000);

    expect(resolveRefreshFailureDisposition(new Error("network error"), session)).toBe("recover");
  });

  it("treats forbidden refresh as terminal only after the access token can no longer be trusted", () => {
    const activeSession = createSession(Date.now() + 60_000);
    const expiredSession = createSession(Date.now() - 1_000);

    expect(resolveRefreshFailureDisposition(createApiError(403), activeSession)).toBe("retain");
    expect(resolveRefreshFailureDisposition(createApiError(403), expiredSession)).toBe("clear");
  });
});
