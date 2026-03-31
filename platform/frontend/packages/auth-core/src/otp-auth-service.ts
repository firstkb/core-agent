import {
  createAuthClient,
  type AuthIdentifier,
  type AuthTokenData,
} from "@platform/api-client";

import type { AuthTokens } from "./auth-storage";
import type {
  AuthCodeRequest,
  AuthMethod,
  AuthService,
} from "./local-auth-service";

type OtpAuthServiceSurface = "admin" | "tenant";

type OtpAuthServiceOptions = {
  authApiUrl: string;
  surface: OtpAuthServiceSurface;
};

function resolveAuthIdentifier(login: string, method?: AuthMethod): AuthIdentifier {
  const normalizedLogin = login.trim();

  if (!normalizedLogin) {
    throw new Error("Login is required.");
  }

  if (method === "phone") {
    return { phone: normalizedLogin };
  }

  if (method === "email") {
    return { email: normalizedLogin };
  }

  return normalizedLogin.includes("@")
    ? { email: normalizedLogin }
    : { phone: normalizedLogin };
}

function mapTokenDataToAuthTokens(tokenData: AuthTokenData): AuthTokens {
  return {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  };
}

function mapCodeRequest(otpLength: number): AuthCodeRequest {
  return {
    ok: true,
    otpLength,
  };
}

function createOtpAuthService({
  authApiUrl,
  surface,
}: OtpAuthServiceOptions): AuthService {
  const authClient = createAuthClient(authApiUrl);

  return {
    async refreshAuthToken() {
      const tokenData = await authClient.refresh();

      return mapTokenDataToAuthTokens(tokenData);
    },
    async requestCode(login, options) {
      const identifier = resolveAuthIdentifier(login, options?.method);
      const response = surface === "admin"
        ? await authClient.requestAdminOtp(identifier)
        : await authClient.requestOtp(identifier);

      return mapCodeRequest(response.otp_length);
    },
    async signOut(options) {
      await authClient.logout({
        allDevices: options?.allDevices ?? false,
      });
    },
    async verifyCode(code, login, options) {
      if (!login?.trim()) {
        throw new Error("Login is required.");
      }

      const identifier = resolveAuthIdentifier(login, options?.method);
      const payload = {
        ...identifier,
        code: code.trim(),
      };
      const tokenData = surface === "admin"
        ? await authClient.verifyAdminOtp(payload)
        : await authClient.verifyOtp(payload);

      return mapTokenDataToAuthTokens(tokenData);
    },
  };
}

export { createOtpAuthService };
export type { OtpAuthServiceOptions, OtpAuthServiceSurface };
