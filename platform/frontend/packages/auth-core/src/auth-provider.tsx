import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  clearStoredAuthSession,
  defaultAuthStorageNamespace,
  persistAuthTokens,
  readStoredAuthSession,
  type AuthStorageNamespace,
  type AuthTokens,
  type StoredAuthSession,
} from "./auth-storage";
import {
  mockAuthService,
  type AuthCodeRequest,
  type AuthMethod,
  type AuthService,
} from "./mock-auth-service";

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
  signIn: (code: string, login?: string) => Promise<StoredAuthSession>;
  signOut: () => Promise<void>;
  status: AuthStatus;
  storageNamespace: AuthStorageNamespace;
  tokens: AuthTokens | null;
  userId: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  service = mockAuthService,
  storageNamespace = defaultAuthStorageNamespace,
}: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [userId, setUserId] = useState("");

  const saveTokens = useCallback(async (nextTokens: AuthTokens) => {
    const storedSession = persistAuthTokens(storageNamespace, nextTokens);

    setTokens(nextTokens);
    setUserId(storedSession.userId);
    setStatus("authenticated");

    return storedSession;
  }, [storageNamespace]);

  const getTokens = useCallback(() => {
    const storedSession = readStoredAuthSession(storageNamespace);

    if (!storedSession) {
      return null;
    }

    return {
      accessToken: storedSession.accessToken,
      idToken: storedSession.idToken,
      refreshToken: storedSession.refreshToken,
    };
  }, [storageNamespace]);

  const getAccessToken = useCallback(() => {
    return getTokens()?.accessToken ?? null;
  }, [getTokens]);

  const checkAuth = useCallback(async () => {
    const storedSession = readStoredAuthSession(storageNamespace);

    if (!storedSession) {
      setTokens(null);
      setUserId("");
      setStatus("anonymous");
      return false;
    }

    setTokens({
      accessToken: storedSession.accessToken,
      idToken: storedSession.idToken,
      refreshToken: storedSession.refreshToken,
    });
    setUserId(storedSession.userId);
    setStatus("authenticated");

    return true;
  }, [storageNamespace]);

  const requestCode = useCallback((
    login: string,
    options?: { method?: AuthMethod },
  ) => {
    return service.requestCode(login, options);
  }, [service]);

  const signIn = useCallback(async (code: string, login?: string) => {
    const nextTokens = await service.verifyCode(code, login);

    return saveTokens(nextTokens);
  }, [saveTokens, service]);

  const signOut = useCallback(async () => {
    clearStoredAuthSession(storageNamespace);
    setTokens(null);
    setUserId("");
    setStatus("anonymous");
  }, [storageNamespace]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

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
