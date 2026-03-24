type AppSurface = "admin" | "tenant";

type DemoSession = {
  displayName: string;
  email: string;
  roleLabel: string;
  tenantName?: string;
};

function getDemoSession(surface: AppSurface): DemoSession {
  if (surface === "admin") {
    return {
      displayName: "Andrii Koien",
      email: "akoien@esafetysystems.com",
      roleLabel: "Platform Operator",
    };
  }

  return {
    displayName: "Maya Patel",
    email: "maya@northwind.example",
    roleLabel: "Tenant Admin",
    tenantName: "Northwind Commerce",
  };
}

function formatSessionLabel(session: DemoSession) {
  return session.tenantName
    ? `${session.displayName} · ${session.roleLabel} · ${session.tenantName}`
    : `${session.displayName} · ${session.roleLabel}`;
}

export { AuthGuard, RequireAuth } from "./auth-guard";
export type { AuthGuardProps, RequireAuthProps } from "./auth-guard";

export { AuthProvider, useAuth } from "./auth-provider";
export type { AuthContextValue, AuthProviderProps, AuthStatus } from "./auth-provider";

export {
  clearStoredAuthSession,
  defaultAuthStorageNamespace,
  extractUserIdFromToken,
  persistAuthTokens,
  readStoredAuthSession,
} from "./auth-storage";
export type { AuthStorageNamespace, AuthTokens, StoredAuthSession } from "./auth-storage";

export { MockAuthService, mockAuthService } from "./mock-auth-service";
export type { AuthCodeRequest, AuthMethod, AuthService } from "./mock-auth-service";

export { formatSessionLabel, getDemoSession };
export type { AppSurface, DemoSession };
