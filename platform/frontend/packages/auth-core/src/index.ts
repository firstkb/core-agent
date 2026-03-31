export { AuthGuard, RequireAuth } from "./auth-guard";
export type { AuthGuardProps, RequireAuthProps } from "./auth-guard";

export { AuthProvider, useAuth } from "./auth-provider";
export type { AuthContextValue, AuthProviderProps, AuthStatus } from "./auth-provider";

export { createOtpAuthService } from "./otp-auth-service";
export type { OtpAuthServiceOptions, OtpAuthServiceSurface } from "./otp-auth-service";

export {
  clearStoredAuthSession,
  decodeJwtPayload,
  defaultAuthStorageNamespace,
  extractExpiresAtFromToken,
  extractUserIdFromToken,
  persistAuthSessionHint,
  persistAuthTokens,
  readAuthSessionHint,
  readStoredAuthSession,
} from "./auth-storage";
export type { AuthStorageNamespace, AuthTokens, StoredAuthSession } from "./auth-storage";

export { LocalAuthService, localAuthService } from "./local-auth-service";
export type { AuthCodeRequest, AuthMethod, AuthService } from "./local-auth-service";
