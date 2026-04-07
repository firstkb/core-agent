import { describe, expect, it } from "vitest";

import {
  resolveBootstrapSession,
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
