import {
  extractUserIdFromToken,
  type AuthTokens,
} from "./auth-storage";

type AuthMethod = "email" | "phone";

type AuthCodeRequest = {
  challengeId?: string;
  ok: true;
  otpLength: number;
};

type AuthService = {
  refreshAuthToken: (currentTokens?: AuthTokens | null) => Promise<AuthTokens>;
  requestCode: (
    login: string,
    options?: { method?: AuthMethod },
  ) => Promise<AuthCodeRequest>;
  signOut: (options?: { allDevices?: boolean }) => Promise<void>;
  verifyCode: (
    code: string,
    login?: string,
    options?: { method?: AuthMethod },
  ) => Promise<AuthTokens>;
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

function makeLocalJwt(payload: Record<string, unknown>) {
  const header = encodeBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = encodeBase64Url(JSON.stringify(payload));

  return `${header}.${body}.local-signature`;
}

function normalizeUserId(login?: string) {
  const normalizedLogin = login?.trim().toLowerCase();

  if (!normalizedLogin) {
    return "demo-user-1";
  }

  return normalizedLogin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "demo-user-1";
}

class LocalAuthService implements AuthService {
  async requestCode(
    login: string,
    options?: { method?: AuthMethod },
  ): Promise<AuthCodeRequest> {
    void options;
    const normalizedLogin = login.trim();

    if (!normalizedLogin) {
      throw new Error("Login is required.");
    }

    await sleep(450);

    return {
      challengeId: `local-challenge:${normalizeUserId(normalizedLogin)}`,
      ok: true,
      otpLength: 6,
    };
  }

  async verifyCode(
    code: string,
    login?: string,
    options?: { method?: AuthMethod },
  ): Promise<AuthTokens> {
    void options;
    const normalizedCode = code.trim();

    if (!/^[0-9]{4,8}$/i.test(normalizedCode)) {
      throw new Error("Verification code is invalid.");
    }

    await sleep(450);

    const userId = normalizeUserId(login);
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const exp = Math.floor(expiresAt / 1000);

    return {
      accessToken: makeLocalJwt({
        exp,
        preferred_username: login ?? "demo",
        sub: userId,
      }),
      expiresAt,
    };
  }

  async refreshAuthToken(currentTokens?: AuthTokens | null): Promise<AuthTokens> {
    await sleep(250);

    const userId = currentTokens?.accessToken
      ? extractUserIdFromToken(currentTokens.accessToken) || normalizeUserId(currentTokens.accessToken)
      : "demo-user-1";
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const exp = Math.floor(expiresAt / 1000);

    return {
      accessToken: makeLocalJwt({
        exp,
        preferred_username: userId,
        sub: userId,
      }),
      expiresAt,
    };
  }

  async signOut(options?: { allDevices?: boolean }) {
    void options;
    await sleep(200);
  }
}

const localAuthService = new LocalAuthService();

export { LocalAuthService, localAuthService };
export type { AuthCodeRequest, AuthMethod, AuthService };
