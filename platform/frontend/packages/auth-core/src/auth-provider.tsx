import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { ApiClientError, isUnauthorizedApiError } from "@platform/api-client";

import {
  clearStoredAuthSession,
  defaultAuthStorageNamespace,
  extractUserIdFromToken,
  persistAuthTokens,
  readStoredAuthSession,
  type AuthStorageNamespace,
  type AuthTokens,
  type StoredAuthSession,
} from "./auth-storage";
import {
  localAuthService,
  type AuthCodeRequest,
  type AuthMethod,
  type AuthService,
} from "./local-auth-service";

type AuthStatus = "anonymous" | "authenticated" | "unknown";

type AuthProviderProps = PropsWithChildren<{
  service?: AuthService;
  storageNamespace?: AuthStorageNamespace;
}>;

type AuthContextValue = {
  checkAuth: () => Promise<boolean>;
  getAccessToken: () => string | null;
  getTokens: () => AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestCode: (
    login: string,
    options?: { method?: AuthMethod },
  ) => Promise<AuthCodeRequest>;
  saveTokens: (tokens: AuthTokens) => Promise<StoredAuthSession>;
  signIn: (
    code: string,
    login?: string,
    options?: { method?: AuthMethod },
  ) => Promise<StoredAuthSession>;
  signOut: (options?: { allDevices?: boolean }) => Promise<void>;
  status: AuthStatus;
  storageNamespace: AuthStorageNamespace;
  tokens: AuthTokens | null;
  userId: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const authRefreshLeadTimeMs = 60_000;
const authCrossTabRefreshLockTTLms = 15_000;
const authCrossTabRefreshWaitMs = 10_000;
const authCrossTabRefreshPollMs = 250;

type RefreshLock = {
  expiresAt: number;
  owner: string;
};

function buildProviderStorageKey(namespace: AuthStorageNamespace, key: string) {
  return `${namespace}:${key}`;
}

function refreshLockKey(namespace: AuthStorageNamespace) {
  return buildProviderStorageKey(namespace, "refreshLock");
}

function createRefreshLock(owner: string): RefreshLock {
  return {
    owner,
    expiresAt: Date.now() + authCrossTabRefreshLockTTLms,
  };
}

function readRefreshLock(namespace: AuthStorageNamespace): RefreshLock | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(refreshLockKey(namespace));
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<RefreshLock>;
    if (
      typeof parsed.owner === "string" &&
      typeof parsed.expiresAt === "number" &&
      Number.isFinite(parsed.expiresAt)
    ) {
      return {
        owner: parsed.owner,
        expiresAt: parsed.expiresAt,
      };
    }
  } catch {
    // Ignore malformed lock payloads and let the caller replace them.
  }

  return null;
}

function tryAcquireRefreshLock(namespace: AuthStorageNamespace, owner: string) {
  if (typeof window === "undefined") {
    return true;
  }

  const existingLock = readRefreshLock(namespace);
  if (
    existingLock &&
    existingLock.owner !== owner &&
    existingLock.expiresAt > Date.now()
  ) {
    return false;
  }

  window.localStorage.setItem(
    refreshLockKey(namespace),
    JSON.stringify(createRefreshLock(owner)),
  );

  return readRefreshLock(namespace)?.owner === owner;
}

function releaseRefreshLock(namespace: AuthStorageNamespace, owner: string) {
  if (typeof window === "undefined") {
    return;
  }

  const existingLock = readRefreshLock(namespace);
  if (!existingLock || existingLock.owner !== owner) {
    return;
  }

  window.localStorage.removeItem(refreshLockKey(namespace));
}

function waitForCrossTabSession(
  namespace: AuthStorageNamespace,
  expectedAccessToken: string | null,
): Promise<StoredAuthSession | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: StoredAuthSession | null) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("storage", handleStorage);
      resolve(value);
    };

    const resolveSession = () => {
      const sharedSession = readStoredAuthSession(namespace);
      if (
        sharedSession &&
        sharedSession.accessToken &&
        sharedSession.accessToken !== expectedAccessToken
      ) {
        finish(sharedSession);
        return;
      }

      const currentLock = readRefreshLock(namespace);
      if (!currentLock || currentLock.expiresAt <= Date.now()) {
        finish(sharedSession);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) {
        return;
      }

      const key = event.key;
      if (
        key !== refreshLockKey(namespace) &&
        key !== buildProviderStorageKey(namespace, "accessToken") &&
        key !== buildProviderStorageKey(namespace, "expiresAt")
      ) {
        return;
      }

      resolveSession();
    };

    const timeoutId = window.setTimeout(() => {
      finish(readStoredAuthSession(namespace));
    }, authCrossTabRefreshWaitMs);
    const intervalId = window.setInterval(resolveSession, authCrossTabRefreshPollMs);

    window.addEventListener("storage", handleStorage);
    resolveSession();
  });
}

function toAuthTokens(session: StoredAuthSession): AuthTokens {
  return {
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
  };
}

function shouldRefreshSession(session: StoredAuthSession, now = Date.now()) {
  return session.expiresAt - now <= authRefreshLeadTimeMs;
}

function isRefreshUnauthorizedError(error: unknown) {
  return error instanceof ApiClientError &&
    isUnauthorizedApiError(error) &&
    error.statusCode === 401;
}

export function AuthProvider({
  children,
  service = localAuthService,
  storageNamespace = defaultAuthStorageNamespace,
}: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [session, setSession] = useState<StoredAuthSession | null>(null);
  const refreshNonceRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<StoredAuthSession | null> | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const sessionRef = useRef<StoredAuthSession | null>(null);
  const tabIdRef = useRef(`auth-tab-${Math.random().toString(36).slice(2)}-${Date.now()}`);

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      globalThis.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const commitSession = useCallback((nextSession: StoredAuthSession | null, nextStatus: AuthStatus) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    setStatus(nextStatus);
  }, []);

  const clearSessionState = useCallback(() => {
    refreshNonceRef.current += 1;
    refreshPromiseRef.current = null;
    clearRefreshTimeout();
    releaseRefreshLock(storageNamespace, tabIdRef.current);
    clearStoredAuthSession(storageNamespace);
    commitSession(null, "anonymous");
  }, [clearRefreshTimeout, commitSession, storageNamespace]);

  const saveTokens = useCallback(async (nextTokens: AuthTokens) => {
    refreshNonceRef.current += 1;
    const storedSession = persistAuthTokens(storageNamespace, nextTokens);

    commitSession(storedSession, "authenticated");

    return storedSession;
  }, [commitSession, storageNamespace]);

  const refreshSession = useCallback(async (candidateSession?: StoredAuthSession | null) => {
    const currentSession = candidateSession ?? sessionRef.current;

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshNonce = refreshNonceRef.current;
    const expectedAccessToken = currentSession?.accessToken ?? null;
    const performRefresh = () => service
      .refreshAuthToken(currentSession ? toAuthTokens(currentSession) : null)
      .then(async (nextTokens) => {
        const activeSession = sessionRef.current;

        if (
          refreshNonce !== refreshNonceRef.current ||
          (expectedAccessToken &&
            activeSession &&
            activeSession.accessToken !== expectedAccessToken)
        ) {
          return activeSession;
        }

        return saveTokens(nextTokens);
      })
      .catch((error) => {
        if (refreshNonce === refreshNonceRef.current) {
          return (async () => {
            if (isRefreshUnauthorizedError(error)) {
              try {
                await service.signOut({ allDevices: false });
              } catch {
                // Ignore logout failures here: local auth state must still be cleared.
              }
            }

            clearSessionState();
            throw error;
          })();
        }

        throw error;
      });

    let refreshPromise: Promise<StoredAuthSession | null>;
    refreshPromise = (async () => {
      if (!tryAcquireRefreshLock(storageNamespace, tabIdRef.current)) {
        const sharedSession = await waitForCrossTabSession(storageNamespace, expectedAccessToken);

        if (
          sharedSession &&
          sharedSession.accessToken &&
          sharedSession.accessToken !== expectedAccessToken
        ) {
          if (refreshNonce === refreshNonceRef.current) {
            commitSession(sharedSession, "authenticated");
          }
          return sharedSession;
        }

        if (!tryAcquireRefreshLock(storageNamespace, tabIdRef.current)) {
          return sharedSession ?? sessionRef.current;
        }
      }

      return performRefresh();
    })().finally(() => {
      if (refreshPromiseRef.current === refreshPromise) {
        refreshPromiseRef.current = null;
      }
      releaseRefreshLock(storageNamespace, tabIdRef.current);
    });

    refreshPromiseRef.current = refreshPromise;

    return refreshPromise;
  }, [clearSessionState, commitSession, saveTokens, service, storageNamespace]);

  const getTokens = useCallback(() => {
    return session ? toAuthTokens(session) : null;
  }, [session]);

  const getAccessToken = useCallback(() => {
    return session?.accessToken ?? null;
  }, [session]);

  const checkAuth = useCallback(async () => {
    const storedSession = readStoredAuthSession(storageNamespace);

    if (!storedSession) {
      try {
        const refreshedSession = await refreshSession(null);
        return Boolean(refreshedSession);
      } catch {
        return false;
      }
    }

    if (shouldRefreshSession(storedSession)) {
      try {
        const refreshedSession = await refreshSession(storedSession);
        return Boolean(refreshedSession);
      } catch {
        return false;
      }
    }

    commitSession(storedSession, "authenticated");

    return true;
  }, [clearSessionState, commitSession, refreshSession, storageNamespace]);

  const requestCode = useCallback((
    login: string,
    options?: { method?: AuthMethod },
  ) => {
    return service.requestCode(login, options);
  }, [service]);

  const signIn = useCallback(async (
    code: string,
    login?: string,
    options?: { method?: AuthMethod },
  ) => {
    const nextTokens = await service.verifyCode(code, login, options);

    return saveTokens(nextTokens);
  }, [saveTokens, service]);

  const signOut = useCallback(async (options?: { allDevices?: boolean }) => {
    try {
      await service.signOut({
        allDevices: options?.allDevices ?? false,
      });
    } finally {
      clearSessionState();
    }
  }, [clearSessionState, service]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const releaseLock = () => {
      releaseRefreshLock(storageNamespace, tabIdRef.current);
    };

    window.addEventListener("pagehide", releaseLock);
    window.addEventListener("beforeunload", releaseLock);

    return () => {
      window.removeEventListener("pagehide", releaseLock);
      window.removeEventListener("beforeunload", releaseLock);
      releaseLock();
    };
  }, [storageNamespace]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const accessTokenKey = buildProviderStorageKey(storageNamespace, "accessToken");
    const expiresAtKey = buildProviderStorageKey(storageNamespace, "expiresAt");

    function handleStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage) {
        return;
      }
      if (event.key !== accessTokenKey && event.key !== expiresAtKey) {
        return;
      }

      const sharedSession = readStoredAuthSession(storageNamespace);
      if (!sharedSession) {
        refreshNonceRef.current += 1;
        refreshPromiseRef.current = null;
        clearRefreshTimeout();
        commitSession(null, "anonymous");
        return;
      }

      const activeSession = sessionRef.current;
      if (
        activeSession?.accessToken === sharedSession.accessToken &&
        activeSession.expiresAt === sharedSession.expiresAt
      ) {
        return;
      }

      commitSession(sharedSession, "authenticated");
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [clearRefreshTimeout, commitSession, storageNamespace]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    clearRefreshTimeout();

    if (status !== "authenticated" || !session) {
      return;
    }

    const refreshDelay = Math.max(session.expiresAt - Date.now() - authRefreshLeadTimeMs, 0);

    if (refreshDelay === 0) {
      void refreshSession(session).catch(() => undefined);
      return;
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      void refreshSession(session).catch(() => undefined);
    }, refreshDelay);

    return () => {
      clearRefreshTimeout();
    };
  }, [clearRefreshTimeout, refreshSession, session, status]);

  useEffect(() => {
    if (typeof window === "undefined" || status !== "authenticated") {
      return;
    }

    function revalidateSession() {
      const activeSession = sessionRef.current;

      if (!activeSession) {
        return;
      }

      if (activeSession.expiresAt <= Date.now() || shouldRefreshSession(activeSession)) {
        void refreshSession(activeSession).catch(() => undefined);
      }
    }

    window.addEventListener("focus", revalidateSession);
    document.addEventListener("visibilitychange", revalidateSession);

    return () => {
      window.removeEventListener("focus", revalidateSession);
      document.removeEventListener("visibilitychange", revalidateSession);
    };
  }, [refreshSession, status]);

  const tokens = session ? toAuthTokens(session) : null;
  const userId = session ? extractUserIdFromToken(session.accessToken) : "";
  const value = useMemo<AuthContextValue>(() => ({
    checkAuth,
    getAccessToken,
    getTokens,
    isAuthenticated: status === "authenticated",
    isLoading: status === "unknown",
    requestCode,
    saveTokens,
    signIn,
    signOut,
    status,
    storageNamespace,
    tokens,
    userId,
  }), [
    checkAuth,
    getAccessToken,
    getTokens,
    requestCode,
    saveTokens,
    session,
    signIn,
    signOut,
    status,
    storageNamespace,
    tokens,
    userId,
  ]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export type { AuthContextValue, AuthProviderProps, AuthStatus };
