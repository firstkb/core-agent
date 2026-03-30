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
  signOut: () => Promise<void>;
  status: AuthStatus;
  storageNamespace: AuthStorageNamespace;
  tokens: AuthTokens | null;
  userId: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const authRefreshLeadTimeMs = 60_000;

function toAuthTokens(session: StoredAuthSession): AuthTokens {
  return {
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
  };
}

function shouldRefreshSession(session: StoredAuthSession, now = Date.now()) {
  return session.expiresAt - now <= authRefreshLeadTimeMs;
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
    const refreshPromise = service
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
          clearSessionState();
        }

        throw error;
      })
      .finally(() => {
        if (refreshPromiseRef.current === refreshPromise) {
          refreshPromiseRef.current = null;
        }
      });

    refreshPromiseRef.current = refreshPromise;

    return refreshPromise;
  }, [clearSessionState, saveTokens, service]);

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

  const signOut = useCallback(async () => {
    try {
      await service.signOut({ allDevices: true });
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
