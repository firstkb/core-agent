type AuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
};

type StoredAuthSession = AuthTokens & {
  userId: string;
};

type AuthStorageNamespace = string;

const defaultAuthStorageNamespace = "platform-auth";

function buildStorageKey(namespace: AuthStorageNamespace, key: string) {
  return `${namespace}:${key}`;
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

function extractUserIdFromToken(idToken: string) {
  const payload = decodeJwtPayload<Record<string, unknown>>(idToken);
  const userId = payload?.["custom:user_id"] ?? payload?.userId ?? payload?.uid;

  return typeof userId === "string" ? userId : "";
}

function readStoredAuthSession(namespace: AuthStorageNamespace = defaultAuthStorageNamespace): StoredAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken = window.localStorage.getItem(buildStorageKey(namespace, "accessToken"));
  const idToken = window.localStorage.getItem(buildStorageKey(namespace, "idToken"));
  const refreshToken = window.localStorage.getItem(buildStorageKey(namespace, "refreshToken"));
  const userId =
    window.localStorage.getItem(buildStorageKey(namespace, "userId")) ??
    (idToken ? extractUserIdFromToken(idToken) : "");

  if (!accessToken || !idToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    idToken,
    refreshToken,
    userId,
  };
}

function persistAuthTokens(
  namespace: AuthStorageNamespace = defaultAuthStorageNamespace,
  tokens: AuthTokens,
): StoredAuthSession {
  const userId = extractUserIdFromToken(tokens.idToken);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(buildStorageKey(namespace, "accessToken"), tokens.accessToken);
    window.localStorage.setItem(buildStorageKey(namespace, "idToken"), tokens.idToken);
    window.localStorage.setItem(buildStorageKey(namespace, "refreshToken"), tokens.refreshToken);
    window.localStorage.setItem(buildStorageKey(namespace, "userId"), userId);
  }

  return {
    ...tokens,
    userId,
  };
}

function clearStoredAuthSession(namespace: AuthStorageNamespace = defaultAuthStorageNamespace) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(buildStorageKey(namespace, "accessToken"));
  window.localStorage.removeItem(buildStorageKey(namespace, "idToken"));
  window.localStorage.removeItem(buildStorageKey(namespace, "refreshToken"));
  window.localStorage.removeItem(buildStorageKey(namespace, "userId"));
}

export {
  clearStoredAuthSession,
  defaultAuthStorageNamespace,
  extractUserIdFromToken,
  persistAuthTokens,
  readStoredAuthSession,
};
export type { AuthStorageNamespace, AuthTokens, StoredAuthSession };
