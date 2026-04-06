import { describe, expect, it } from "vitest";

import { resolveBootstrapSession } from "./auth-provider";
import type { StoredAuthSession } from "./auth-storage";

function createSession(expiresAt: number): StoredAuthSession {
  return {
    accessToken: "header.payload.signature",
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
});
