type AuthTokens = {
  accessToken: string;
  expiresAt: number;
};

type StoredAuthSession = AuthTokens;

type AuthStorageNamespace = string;

const defaultAuthStorageNamespace = "platform-auth";

function buildStorageKey(namespace: AuthStorageNamespace, key: string) {
  return `${namespace}:${key}`;
}

function sessionHintStorageKey(namespace: AuthStorageNamespace) {
  return buildStorageKey(namespace, "sessionHint");
}

function decodeJwtPayload<T extends Record<string, unknown>>(token: string): T | null {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    return null;
  }

  try {
    const normalizedPayload = payloadSegment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadSegment.length / 4) * 4, "=");

    return JSON.parse(globalThis.atob(normalizedPayload)) as T;
  } catch {
    return null;
  }
}

function extractUserIdFromToken(accessToken: string) {
  const payload = decodeJwtPayload<Record<string, unknown>>(accessToken);
  const userId =
    payload?.sub ??
    payload?.["custom:user_id"] ??
    payload?.userId ??
    payload?.uid;

  return typeof userId === "string" ? userId : "";
}

function extractExpiresAtFromToken(accessToken: string) {
  const payload = decodeJwtPayload<Record<string, unknown>>(accessToken);
  const exp = payload?.exp;

  if (typeof exp !== "number" || !Number.isFinite(exp)) {
    return null;
  }

  return exp * 1000;
}

function extractIssuedAtFromToken(accessToken: string) {
  const payload = decodeJwtPayload<Record<string, unknown>>(accessToken);
  const iat = payload?.iat;

  if (typeof iat !== "number" || !Number.isFinite(iat)) {
    return null;
  }

  return iat * 1000;
}

function resolveExpiresAt(tokens: Pick<AuthTokens, "accessToken" | "expiresAt">) {
  if (Number.isFinite(tokens.expiresAt) && tokens.expiresAt > 0) {
    return tokens.expiresAt;
  }

  return extractExpiresAtFromToken(tokens.accessToken);
}

function readStoredAuthSession(namespace: AuthStorageNamespace = defaultAuthStorageNamespace): StoredAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken = window.localStorage.getItem(buildStorageKey(namespace, "accessToken"));
  const storedExpiresAt = Number(window.localStorage.getItem(buildStorageKey(namespace, "expiresAt")));

  if (!accessToken) {
    return null;
  }

  const expiresAt = Number.isFinite(storedExpiresAt) && storedExpiresAt > 0
    ? storedExpiresAt
    : extractExpiresAtFromToken(accessToken);

  if (!expiresAt) {
    return null;
  }

  return {
    accessToken,
    expiresAt,
  };
}

function persistAuthTokens(
  namespace: AuthStorageNamespace = defaultAuthStorageNamespace,
  tokens: AuthTokens,
): StoredAuthSession {
  const expiresAt = resolveExpiresAt(tokens);
  if (!expiresAt) {
    throw new Error("Unable to resolve access token expiry.");
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(buildStorageKey(namespace, "accessToken"), tokens.accessToken);
    window.localStorage.setItem(buildStorageKey(namespace, "expiresAt"), String(expiresAt));
  }

  return {
    accessToken: tokens.accessToken,
    expiresAt,
  };
}

function persistAuthSessionHint(namespace: AuthStorageNamespace = defaultAuthStorageNamespace) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(sessionHintStorageKey(namespace), "1");
}

function readAuthSessionHint(namespace: AuthStorageNamespace = defaultAuthStorageNamespace) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(sessionHintStorageKey(namespace)) === "1";
}

function clearStoredAuthSession(
  namespace: AuthStorageNamespace = defaultAuthStorageNamespace,
  options?: { preserveSessionHint?: boolean },
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(buildStorageKey(namespace, "accessToken"));
  window.localStorage.removeItem(buildStorageKey(namespace, "expiresAt"));
  window.localStorage.removeItem(buildStorageKey(namespace, "refreshToken"));

  // Remove legacy keys from the previous browser-side session contract.
  window.localStorage.removeItem(buildStorageKey(namespace, "idToken"));
  window.localStorage.removeItem(buildStorageKey(namespace, "userId"));
  if (!options?.preserveSessionHint) {
    window.localStorage.removeItem(sessionHintStorageKey(namespace));
  }
}

export {
  clearStoredAuthSession,
  decodeJwtPayload,
  defaultAuthStorageNamespace,
  extractExpiresAtFromToken,
  extractIssuedAtFromToken,
  extractUserIdFromToken,
  persistAuthSessionHint,
  persistAuthTokens,
  readAuthSessionHint,
  readStoredAuthSession,
};
export type { AuthStorageNamespace, AuthTokens, StoredAuthSession };
