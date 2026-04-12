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
  extractIssuedAtFromToken,
  persistAuthSessionHint,
  persistAuthTokens,
  readAuthSessionHint,
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
const authDefaultRefreshLeadTimeMs = 60_000;
const authMinimumRefreshLeadTimeMs = 1_000;
const authRefreshLeadTimeFactor = 0.2;
const authRecoveryRetryBaseMs = 1_000;
const authRecoveryRetryMaxMs = 30_000;
const authCrossTabRefreshLockTTLms = 15_000;
const authCrossTabRefreshPollMs = 250;
const authCrossTabRefreshLockSettleMs = 50;

type RefreshLock = {
  expiresAt: number;
  owner: string;
};

function resolveCrossTabRefreshWaitMs(
  lockTTLms = authCrossTabRefreshLockTTLms,
  pollMs = authCrossTabRefreshPollMs,
  settleMs = authCrossTabRefreshLockSettleMs,
) {
  return lockTTLms + pollMs + settleMs + 250;
}

function resolveRecoveryRetryDelayMs(attempt: number) {
  const normalizedAttempt = Number.isFinite(attempt) && attempt > 0
    ? Math.floor(attempt)
    : 0;

  return Math.min(
    authRecoveryRetryMaxMs,
    authRecoveryRetryBaseMs * (2 ** normalizedAttempt),
  );
}

const authCrossTabRefreshWaitMs = resolveCrossTabRefreshWaitMs();

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

function waitForDuration(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
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

async function tryAcquireRefreshLock(namespace: AuthStorageNamespace, owner: string) {
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
  await waitForDuration(authCrossTabRefreshLockSettleMs);

  const confirmedLock = readRefreshLock(namespace);

  return Boolean(
    confirmedLock &&
    confirmedLock.owner === owner &&
    confirmedLock.expiresAt > Date.now(),
  );
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

function isSessionActive(session: StoredAuthSession | null, now = Date.now()) {
  return Boolean(
    session &&
    Number.isFinite(session.expiresAt) &&
    session.expiresAt > now,
  );
}

function resolveRefreshLeadTimeMs(session: StoredAuthSession) {
  const issuedAt = extractIssuedAtFromToken(session.accessToken);
  if (!issuedAt) {
    return authDefaultRefreshLeadTimeMs;
  }

  const lifetimeMs = session.expiresAt - issuedAt;
  if (!Number.isFinite(lifetimeMs) || lifetimeMs <= 0) {
    return authDefaultRefreshLeadTimeMs;
  }

  return Math.min(
    authDefaultRefreshLeadTimeMs,
    Math.max(authMinimumRefreshLeadTimeMs, Math.floor(lifetimeMs * authRefreshLeadTimeFactor)),
  );
}

function shouldRefreshSession(session: StoredAuthSession, now = Date.now()) {
  return session.expiresAt - now <= resolveRefreshLeadTimeMs(session);
}

function resolveBootstrapSession(session: StoredAuthSession | null, now = Date.now()) {
  if (!session || !isSessionActive(session, now)) {
    return null;
  }

  return shouldRefreshSession(session, now)
    ? null
    : session;
}

function isRefreshUnauthorizedError(error: unknown) {
  return error instanceof ApiClientError &&
    isUnauthorizedApiError(error) &&
    error.statusCode === 401;
}

function isRefreshForbiddenError(error: unknown) {
  return error instanceof ApiClientError &&
    isUnauthorizedApiError(error) &&
    error.statusCode === 403;
}

function resolveMissingSessionStatus(hasSessionHint: boolean): AuthStatus {
  return hasSessionHint ? "unknown" : "anonymous";
}

function resolveRefreshFailureDisposition(
  error: unknown,
  session: StoredAuthSession | null | undefined,
) {
  if (isRefreshUnauthorizedError(error)) {
    return "clear" as const;
  }

  if (isRefreshForbiddenError(error)) {
    return isSessionActive(session ?? null) ? "retain" as const : "clear" as const;
  }

  return isSessionActive(session ?? null) ? "retain" as const : "recover" as const;
}

export function AuthProvider({
  children,
  service = localAuthService,
  storageNamespace = defaultAuthStorageNamespace,
}: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [session, setSession] = useState<StoredAuthSession | null>(null);
  const recoveryAttemptRef = useRef(0);
  const recoveryTimeoutRef = useRef<number | null>(null);
  const refreshNonceRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<StoredAuthSession | null> | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const scheduleRecoveryRetryRef = useRef<() => void>(() => undefined);
  const sessionRef = useRef<StoredAuthSession | null>(null);
  const tabIdRef = useRef(`auth-tab-${Math.random().toString(36).slice(2)}-${Date.now()}`);

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      globalThis.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const clearRecoveryTimeout = useCallback(() => {
    if (recoveryTimeoutRef.current !== null) {
      globalThis.clearTimeout(recoveryTimeoutRef.current);
      recoveryTimeoutRef.current = null;
    }
  }, []);

  const commitSession = useCallback((nextSession: StoredAuthSession | null, nextStatus: AuthStatus) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    setStatus(nextStatus);
  }, []);

  const enterRecoveryState = useCallback((options?: { preserveAttempt?: boolean }) => {
    refreshNonceRef.current += 1;
    refreshPromiseRef.current = null;
    clearRefreshTimeout();
    clearRecoveryTimeout();
    releaseRefreshLock(storageNamespace, tabIdRef.current);
    clearStoredAuthSession(storageNamespace, { preserveSessionHint: true });
    if (!options?.preserveAttempt) {
      recoveryAttemptRef.current = 0;
    }
    commitSession(null, "unknown");
  }, [clearRecoveryTimeout, clearRefreshTimeout, commitSession, storageNamespace]);

  const syncMissingSessionState = useCallback(() => {
    refreshNonceRef.current += 1;
    refreshPromiseRef.current = null;
    clearRefreshTimeout();
    clearRecoveryTimeout();

    const hasSessionHint = readAuthSessionHint(storageNamespace);
    if (hasSessionHint) {
      recoveryAttemptRef.current = 0;
      commitSession(null, "unknown");
      scheduleRecoveryRetryRef.current();
      return;
    }

    recoveryAttemptRef.current = 0;
    commitSession(null, "anonymous");
  }, [clearRecoveryTimeout, clearRefreshTimeout, commitSession, storageNamespace]);

  const clearSessionState = useCallback((options?: { preserveSessionHint?: boolean }) => {
    refreshNonceRef.current += 1;
    refreshPromiseRef.current = null;
    clearRefreshTimeout();
    clearRecoveryTimeout();
    recoveryAttemptRef.current = 0;
    releaseRefreshLock(storageNamespace, tabIdRef.current);
    clearStoredAuthSession(storageNamespace, options);
    commitSession(null, "anonymous");
  }, [clearRecoveryTimeout, clearRefreshTimeout, commitSession, storageNamespace]);

  const saveTokens = useCallback(async (nextTokens: AuthTokens) => {
    refreshNonceRef.current += 1;
    recoveryAttemptRef.current = 0;
    clearRecoveryTimeout();
    persistAuthSessionHint(storageNamespace);
    const storedSession = persistAuthTokens(storageNamespace, nextTokens);

    commitSession(storedSession, "authenticated");

    return storedSession;
  }, [clearRecoveryTimeout, commitSession, storageNamespace]);

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
            const failureDisposition = resolveRefreshFailureDisposition(error, currentSession);

            if (failureDisposition === "clear" && isRefreshUnauthorizedError(error)) {
              try {
                await service.signOut({ allDevices: false });
              } catch {
                // Ignore logout failures here: local auth state must still be cleared.
              }
            }

            if (failureDisposition === "clear") {
              clearSessionState();
            } else if (failureDisposition === "recover") {
              enterRecoveryState();
              scheduleRecoveryRetryRef.current();
            }

            throw error;
          })();
        }

        throw error;
      });

    const refreshPromise: Promise<StoredAuthSession | null> = (async () => {
      if (!await tryAcquireRefreshLock(storageNamespace, tabIdRef.current)) {
        const sharedSession = await waitForCrossTabSession(storageNamespace, expectedAccessToken);

        if (refreshNonce !== refreshNonceRef.current) {
          return sessionRef.current;
        }

        if (
          sharedSession &&
          sharedSession.accessToken &&
          sharedSession.accessToken !== expectedAccessToken
        ) {
          if (refreshNonce === refreshNonceRef.current) {
            recoveryAttemptRef.current = 0;
            clearRecoveryTimeout();
            commitSession(sharedSession, "authenticated");
          }
          return sharedSession;
        }

        if (!sharedSession && !sessionRef.current) {
          return null;
        }

        if (!await tryAcquireRefreshLock(storageNamespace, tabIdRef.current)) {
          return sharedSession ?? sessionRef.current;
        }
      }

      if (refreshNonce !== refreshNonceRef.current) {
        return sessionRef.current;
      }

      const activeSession = sessionRef.current;
      if (!currentSession && activeSession) {
        return activeSession;
      }

      if (expectedAccessToken && !activeSession) {
        return null;
      }

      if (
        expectedAccessToken &&
        activeSession &&
        activeSession.accessToken !== expectedAccessToken
      ) {
        return activeSession;
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
  }, [clearSessionState, commitSession, enterRecoveryState, saveTokens, service, storageNamespace]);

  const scheduleRecoveryRetry = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (sessionRef.current || !readAuthSessionHint(storageNamespace)) {
      return;
    }

    clearRecoveryTimeout();
    recoveryTimeoutRef.current = window.setTimeout(() => {
      void refreshSession(null)
        .then((candidateSession) => {
          const nextSession = resolveBootstrapSession(candidateSession);
          if (!nextSession) {
            if (!readAuthSessionHint(storageNamespace)) {
              recoveryAttemptRef.current = 0;
              commitSession(null, "anonymous");
              return;
            }

            recoveryAttemptRef.current += 1;
            scheduleRecoveryRetryRef.current();
            return;
          }

          recoveryAttemptRef.current = 0;
          clearRecoveryTimeout();
          commitSession(nextSession, "authenticated");
        })
        .catch((error) => {
          if (resolveRefreshFailureDisposition(error, null) === "clear" ||
            !readAuthSessionHint(storageNamespace)
          ) {
            recoveryAttemptRef.current = 0;
            clearRecoveryTimeout();
            return;
          }

          recoveryAttemptRef.current += 1;
          scheduleRecoveryRetryRef.current();
        });
    }, resolveRecoveryRetryDelayMs(recoveryAttemptRef.current));
  }, [clearRecoveryTimeout, commitSession, refreshSession, storageNamespace]);

  scheduleRecoveryRetryRef.current = scheduleRecoveryRetry;

  const getTokens = useCallback(() => {
    const activeSession = sessionRef.current;

    return activeSession ? toAuthTokens(activeSession) : null;
  }, []);

  const getAccessToken = useCallback(() => {
    return sessionRef.current?.accessToken ?? null;
  }, []);

  const checkAuth = useCallback(async () => {
    function finalizeBootstrapSession(candidateSession: StoredAuthSession | null) {
      const nextSession = resolveBootstrapSession(candidateSession);

      if (!nextSession) {
        if (readAuthSessionHint(storageNamespace)) {
          commitSession(null, "unknown");
          scheduleRecoveryRetry();
          return false;
        }

        clearSessionState();
        return false;
      }

      recoveryAttemptRef.current = 0;
      clearRecoveryTimeout();
      commitSession(nextSession, "authenticated");
      return true;
    }

    const storedSession = readStoredAuthSession(storageNamespace);

    if (!storedSession) {
      if (!readAuthSessionHint(storageNamespace)) {
        commitSession(null, "anonymous");
        return false;
      }

      try {
        const refreshedSession = await refreshSession(null);
        return finalizeBootstrapSession(refreshedSession);
      } catch {
        commitSession(
          null,
          resolveMissingSessionStatus(readAuthSessionHint(storageNamespace)),
        );
        return false;
      }
    }

    if (shouldRefreshSession(storedSession)) {
      try {
        const refreshedSession = await refreshSession(storedSession);
        return finalizeBootstrapSession(refreshedSession);
      } catch (error) {
        if (resolveRefreshFailureDisposition(error, storedSession) === "retain") {
          commitSession(storedSession, "authenticated");
          return true;
        }

        commitSession(
          null,
          resolveMissingSessionStatus(readAuthSessionHint(storageNamespace)),
        );
        return false;
      }
    }

    commitSession(storedSession, "authenticated");

    return true;
  }, [
    clearRecoveryTimeout,
    clearSessionState,
    commitSession,
    refreshSession,
    scheduleRecoveryRetry,
    storageNamespace,
  ]);

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
      clearRecoveryTimeout();
      releaseRefreshLock(storageNamespace, tabIdRef.current);
    };

    window.addEventListener("pagehide", releaseLock);
    window.addEventListener("beforeunload", releaseLock);

    return () => {
      window.removeEventListener("pagehide", releaseLock);
      window.removeEventListener("beforeunload", releaseLock);
      releaseLock();
    };
  }, [clearRecoveryTimeout, storageNamespace]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const accessTokenKey = buildProviderStorageKey(storageNamespace, "accessToken");
    const expiresAtKey = buildProviderStorageKey(storageNamespace, "expiresAt");
    const sessionHintKey = buildProviderStorageKey(storageNamespace, "sessionHint");

    function handleStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage) {
        return;
      }
      if (
        event.key !== accessTokenKey &&
        event.key !== expiresAtKey &&
        event.key !== sessionHintKey
      ) {
        return;
      }

      const sharedSession = readStoredAuthSession(storageNamespace);
      if (!sharedSession) {
        syncMissingSessionState();
        return;
      }

      const activeSession = sessionRef.current;
      if (
        activeSession?.accessToken === sharedSession.accessToken &&
        activeSession.expiresAt === sharedSession.expiresAt
      ) {
        return;
      }

      recoveryAttemptRef.current = 0;
      clearRecoveryTimeout();
      commitSession(sharedSession, "authenticated");
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [clearRecoveryTimeout, commitSession, storageNamespace, syncMissingSessionState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    clearRefreshTimeout();

    if (status !== "authenticated" || !session) {
      return;
    }

    const refreshDelay = Math.max(session.expiresAt - Date.now() - resolveRefreshLeadTimeMs(session), 0);

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

  useEffect(() => {
    if (typeof window === "undefined" || status !== "unknown") {
      return;
    }

    if (!readAuthSessionHint(storageNamespace)) {
      return;
    }

    scheduleRecoveryRetry();

    function retryRecovery() {
      if (document.visibilityState === "hidden") {
        return;
      }

      recoveryAttemptRef.current = 0;
      scheduleRecoveryRetryRef.current();
    }

    window.addEventListener("focus", retryRecovery);
    window.addEventListener("online", retryRecovery);
    document.addEventListener("visibilitychange", retryRecovery);

    return () => {
      window.removeEventListener("focus", retryRecovery);
      window.removeEventListener("online", retryRecovery);
      document.removeEventListener("visibilitychange", retryRecovery);
    };
  }, [scheduleRecoveryRetry, status, storageNamespace]);

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

export { resolveBootstrapSession };
export { resolveCrossTabRefreshWaitMs };
export { resolveMissingSessionStatus };
export { resolveRecoveryRetryDelayMs };
export { resolveRefreshFailureDisposition };
export { resolveRefreshLeadTimeMs };
export type { AuthContextValue, AuthProviderProps, AuthStatus };
