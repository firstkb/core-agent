import {
  extractUserIdFromToken,
  type AuthTokens,
} from "./auth-storage";

type AuthMethod = "email" | "phone";

type AuthCodeRequest = {
  challengeId: string;
  ok: true;
};

type AuthService = {
  refreshAuthToken: (
    refreshToken: string | null,
    currentTokens?: AuthTokens | null,
  ) => Promise<AuthTokens>;
  requestCode: (
    login: string,
    options?: { method?: AuthMethod },
  ) => Promise<AuthCodeRequest>;
  verifyCode: (code: string, login?: string) => Promise<AuthTokens>;
};

function sleep(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function encodeBase64Url(input: string) {
  return globalThis.btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeFakeJwt(payload: Record<string, unknown>) {
  const header = encodeBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = encodeBase64Url(JSON.stringify(payload));

  return `${header}.${body}.mock-signature`;
}

function normalizeUserId(login?: string) {
  const normalizedLogin = login?.trim().toLowerCase();

  if (!normalizedLogin) {
    return "demo-user-1";
  }

  return normalizedLogin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "demo-user-1";
}

class MockAuthService implements AuthService {
  async requestCode(
    login: string,
    _options?: { method?: AuthMethod },
  ): Promise<AuthCodeRequest> {
    const normalizedLogin = login.trim();

    if (!normalizedLogin) {
      throw new Error("Login is required.");
    }

    await sleep(450);

    return {
      challengeId: `mock-challenge:${normalizeUserId(normalizedLogin)}`,
      ok: true,
    };
  }

  async verifyCode(code: string, login?: string): Promise<AuthTokens> {
    const normalizedCode = code.trim();

    if (!/^[A-Z0-9]{4,8}$/i.test(normalizedCode)) {
      throw new Error("Verification code is invalid.");
    }

    await sleep(450);

    const userId = normalizeUserId(login);
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;

    return {
      accessToken: makeFakeJwt({
        exp,
        preferred_username: login ?? "demo",
        sub: userId,
      }),
      idToken: makeFakeJwt({
        "custom:user_id": userId,
        email: login ?? "demo@example.com",
        exp,
      }),
      refreshToken: `mock-refresh-token:${userId}`,
    };
  }

  async refreshAuthToken(
    refreshToken: string | null,
    currentTokens?: AuthTokens | null,
  ): Promise<AuthTokens> {
    await sleep(250);

    const userId =
      (currentTokens?.idToken ? extractUserIdFromToken(currentTokens.idToken) : "") ||
      normalizeUserId(refreshToken ?? undefined);
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;

    return {
      accessToken: makeFakeJwt({
        exp,
        preferred_username: userId,
        sub: userId,
      }),
      idToken: makeFakeJwt({
        "custom:user_id": userId,
        email: `${userId}@example.com`,
        exp,
      }),
      refreshToken: refreshToken ?? `mock-refresh-token:${userId}`,
    };
  }
}

const mockAuthService = new MockAuthService();

export { MockAuthService, mockAuthService };
export type { AuthCodeRequest, AuthMethod, AuthService };
