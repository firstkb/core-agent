import { useEffect, useMemo, useRef, useState } from "react";

import {
  ApiClientError,
  createTenantProfileClient,
  isUnauthorizedApiError,
  requestWithUnauthorizedRetry,
  type TenantProfile,
} from "@platform/api-client";
import {
  AuthGuard,
  useAuth,
} from "@platform/auth-core";
import {
  AppInstallProvider,
  AppInstallPrompt,
  AuthLocaleFooter,
  AuthSignInForm,
  FullscreenBrandLoader,
  normalizeAuthIdentifier,
  PublicAuthShell,
  PublicAuthQrPanel,
  sanitizeAuthInputValue,
  type AuthContactMethod,
} from "@platform/app-shell";
import { useTranslation } from "@platform/i18n";
import { Navigate, Route, Routes } from "react-router-dom";

import { renderPlatformStudioRoutes } from "../features/platform-studio";
import {
  PublishedAppRoutePage,
} from "../features/published-app";
import { TenantDashboardPage } from "../pages/dashboard/page";
import { PrivateApp } from "./private-app";
import { TenantRuntimeConfigProvider } from "./tenant-runtime-config-context";
import type { TenantRuntimeConfig } from "./tenant-runtime-config";
import { TenantBrandImage } from "./tenant-brand-image";
import type { TenantWorkspaceUserSession } from "./tenant-workspace-user-session";

function formatRoleLabel(role?: string) {
  if (!role?.trim()) {
    return "";
  }

  return role
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildTenantWorkspaceUserSession(profile: TenantProfile): TenantWorkspaceUserSession {
  const fullName = [profile.user.first_name, profile.user.last_name]
    .map((segment) => segment?.trim() || "")
    .filter(Boolean)
    .join(" ");
  const contactLabel = profile.user.email?.trim() || profile.user.phone?.trim() || "";
  const level = typeof profile.user.level === "number" && Number.isFinite(profile.user.level)
    ? Math.trunc(profile.user.level)
    : 0;
  const role = profile.user.role?.trim() || "";
  const roleLabel = formatRoleLabel(profile.user.role) || "Tenant User";
  const isRoot = level === 100;
  const tenantLabel = profile.tenant.name?.trim() || profile.tenant.host?.trim() || "";
  const displayName = fullName || contactLabel || roleLabel;
  const secondaryLabel = contactLabel || [roleLabel, tenantLabel].filter(Boolean).join(" · ") || profile.user.id;
  const initial = displayName.slice(0, 1).toUpperCase() || "U";

  return {
    displayName,
    initial,
    isRoot,
    level,
    role,
    secondaryLabel,
  };
}

function isLookupFailure(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return error.statusCode === 400 ||
    error.statusCode === 404 ||
    error.statusCode === 422 ||
    error.code === "AUTH_USER_NOT_FOUND" ||
    message.includes("user not found") ||
    message.includes("tenant user not found");
}

function isInvalidCodeFailure(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return error.statusCode === 400 ||
    error.statusCode === 401 ||
    error.statusCode === 403 ||
    error.statusCode === 404 ||
    error.statusCode === 422 ||
    error.code === "AUTH_OTP_INVALID" ||
    message.includes("invalid code") ||
    message.includes("invalid otp") ||
    message.includes("cannot verify otp");
}

function TenantBrandLockup() {
  return (
    <div className="public-brand-lockup">
      <TenantBrandImage
        alt="Tenant Workspace"
        className="public-brand-logo public-brand-logo--dark"
        fallbackSrc="/assets/logo-dark.svg"
        primarySrc="/tenant/logo-dark.svg"
      />
      <TenantBrandImage
        alt="Tenant Workspace"
        className="public-brand-logo public-brand-logo--light"
        fallbackSrc="/assets/logo-light.svg"
        primarySrc="/tenant/logo-light.svg"
      />
    </div>
  );
}

function TenantLoaderLogo() {
  return (
    <img
      alt="eSafety Systems"
      className="public-brand-logo"
      src="/assets/logo-light.svg"
    />
  );
}

function TenantAuthBrandRow({
  qrValue,
}: {
  qrValue: string;
}) {
  return (
    <div className="public-auth-shell__brand-row">
      <TenantBrandLockup />
      <PublicAuthQrPanel
        className="public-auth-shell__brand-qr"
        foregroundColor="#111111"
        size={50}
        value={qrValue}
      />
    </div>
  );
}

function TenantBootstrapLoader({
  description,
  label,
}: {
  description: string;
  label: string;
}) {
  return (
    <FullscreenBrandLoader
      description={description}
      label={label}
      logo={<TenantLoaderLogo />}
    />
  );
}

export function App({
  runtimeConfig,
}: {
  runtimeConfig: TenantRuntimeConfig;
}) {
  const { t } = useTranslation();
  const profileClient = useMemo(
    () => createTenantProfileClient(runtimeConfig.tenantApiUrl),
    [runtimeConfig.tenantApiUrl],
  );
  const { checkAuth, getAccessToken, isAuthenticated, requestCode, signIn, signOut, userId } = useAuth();
  const [codeSent, setCodeSent] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [method, setMethod] = useState<AuthContactMethod>("email");
  const [otpLength, setOtpLength] = useState(6);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [requestedIdentifier, setRequestedIdentifier] = useState("");
  const [requestedMethod, setRequestedMethod] = useState<AuthContactMethod | null>(null);
  const profileRef = useRef<TenantProfile | null>(null);
  const profileReadyRef = useRef(false);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    profileReadyRef.current = profileReady;
  }, [profileReady]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCodeSent(false);
      setCodeValue("");
      setError(null);
      setOtpLength(6);
      setProfile(null);
      setProfileError(null);
      setProfileReady(false);
      setRequestedIdentifier("");
      setRequestedMethod(null);
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      void signOut();
      return;
    }

    let isActive = true;
    const shouldPreserveProfile = Boolean(
      profileReadyRef.current &&
      profileRef.current &&
      profileRef.current.user.id === userId,
    );

    if (!shouldPreserveProfile) {
      setProfile(null);
      setProfileError(null);
      setProfileReady(false);
    } else {
      setProfileError(null);
    }

    async function recoverUnauthorizedAccessToken() {
      const recovered = await checkAuth();
      if (!recovered) {
        return null;
      }

      return getAccessToken();
    }

    void requestWithUnauthorizedRetry(
      (bearerToken) => profileClient.getProfile(bearerToken),
      {
        accessToken,
        onUnauthorized: recoverUnauthorizedAccessToken,
      },
    )
      .then((nextProfile) => {
        if (isActive) {
          setProfile(nextProfile);
          setProfileError(null);
          setProfileReady(true);
        }
      })
      .catch((profileRequestError: unknown) => {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedApiError(profileRequestError)) {
          void signOut();
          return;
        }

        if (!shouldPreserveProfile) {
          setProfileError(
            profileRequestError instanceof Error
              ? profileRequestError.message
              : t("tenant.loaders.profileDescription"),
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [checkAuth, getAccessToken, isAuthenticated, profileClient, signOut, t, userId]);

  async function handleRequestCode() {
    const normalizedIdentifier = normalizeAuthIdentifier(identifier, method);

    if (!normalizedIdentifier) {
      setError(method === "email" ? t("auth.errors.enterEmail") : t("auth.errors.enterPhone"));
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const response = await requestCode(normalizedIdentifier, { method });
      setCodeSent(true);
      setCodeValue("");
      setIdentifier(normalizedIdentifier);
      setOtpLength(response.otpLength);
      setRequestedIdentifier(normalizedIdentifier);
      setRequestedMethod(method);
    } catch (requestError) {
      if (isLookupFailure(requestError)) {
        setError(
          method === "email"
            ? t("tenant.auth.errors.emailNotRegistered")
            : t("tenant.auth.errors.phoneNotRegistered"),
        );
      } else {
        setError(requestError instanceof Error ? requestError.message : t("auth.errors.unableToSendCode"));
      }
    } finally {
      setIsBusy(false);
    }
  }

  function returnToRequestStep(nextError: string, nextIdentifier: string, nextMethod: AuthContactMethod) {
    setCodeSent(false);
    setCodeValue("");
    setError(nextError);
    setIdentifier(nextIdentifier);
    setMethod(nextMethod);
    setOtpLength(6);
    setRequestedIdentifier("");
    setRequestedMethod(null);
  }

  async function handleVerifyCode() {
    const normalizedIdentifier = requestedIdentifier || normalizeAuthIdentifier(identifier, method);
    const normalizedMethod = requestedMethod ?? method;
    const normalizedCode = codeValue.trim();

    if (!normalizedCode) {
      setError(t("auth.errors.enterCode"));
      return;
    }

    if (normalizedCode.length !== otpLength) {
      setError(t("auth.errors.enterCodeLength", { count: otpLength }));
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await signIn(normalizedCode, normalizedIdentifier, { method: normalizedMethod });
    } catch (requestError) {
      if (isInvalidCodeFailure(requestError)) {
        returnToRequestStep(
          t("tenant.auth.errors.invalidCode"),
          normalizedIdentifier,
          normalizedMethod,
        );
      } else {
        setError(requestError instanceof Error ? requestError.message : t("auth.errors.unableToVerifyCode"));
      }
    } finally {
      setIsBusy(false);
    }
  }

  function resetFlow() {
    setCodeSent(false);
    setCodeValue("");
    setError(null);
    setOtpLength(6);
    setRequestedIdentifier("");
    setRequestedMethod(null);
  }

  const qrValue = typeof window === "undefined" ? "/sign-in" : window.location.href;
  const currentYear = new Date().getFullYear();
  const authDescription = codeSent
    ? t("tenant.auth.descriptionCode", { identifier: requestedIdentifier })
    : t("tenant.auth.descriptionEnter");
  const profileLoaderDescription = profileError ?? t("tenant.loaders.profileDescription");
  const workspaceUser = profile ? buildTenantWorkspaceUserSession(profile) : null;
  const tenantName = profile?.tenant.name?.trim();

  return (
    <TenantRuntimeConfigProvider value={runtimeConfig}>
      <AuthGuard
        authenticated={
        profileReady && workspaceUser ? (
          <Routes>
            <Route element={<Navigate replace to="/dashboard" />} path="/sign-in" />
              <Route
                element={(
                  <PrivateApp
                    tenantName={tenantName}
                    userSession={workspaceUser}
                  />
                )}
              path="/"
            >
              <Route element={<Navigate replace to="/dashboard" />} index />
              <Route element={<TenantDashboardPage />} path="dashboard" />
              {renderPlatformStudioRoutes()}
              <Route element={<PublishedAppRoutePage />} path="app/:routeKey/*" />
              <Route element={<Navigate replace to="/dashboard" />} path="*" />
            </Route>
          </Routes>
        ) : (
          <TenantBootstrapLoader
            description={profileLoaderDescription}
            label={t("tenant.loaders.profileLabel")}
          />
        )
      }
      pending={
        <TenantBootstrapLoader
          description={t("tenant.loaders.pendingDescription")}
          label={t("tenant.loaders.pendingLabel")}
        />
      }
        unauthenticated={
        <Routes>
          <Route
            element={
              <AppInstallProvider>
                <PublicAuthShell
                  brand={<TenantAuthBrandRow qrValue={qrValue} />}
                  description={authDescription}
                  footer={<AuthLocaleFooter year={currentYear} />}
                  floating={<AppInstallPrompt />}
                  tagline={t("tenant.auth.tagline")}
                  title={t("tenant.auth.title")}
                >
                  <AuthSignInForm
                    codeSent={codeSent}
                    codeValue={codeValue}
                    error={error}
                    helper={codeSent ? t("auth.helper.codeLength", { count: otpLength }) : undefined}
                    inputValue={identifier}
                    isBusy={isBusy}
                    method={method}
                    onBack={resetFlow}
                    onCodeValueChange={(value) => {
                      setCodeValue(value);
                      setError(null);
                    }}
                    onInputValueChange={(value) => {
                      setIdentifier(sanitizeAuthInputValue(value, method));
                      setError(null);
                    }}
                    onMethodChange={(value) => {
                      setMethod(value);
                      setIdentifier("");
                      setError(null);
                      setRequestedIdentifier("");
                      setRequestedMethod(null);
                    }}
                    onRequestCode={() => {
                      void handleRequestCode();
                    }}
                    onVerifyCode={() => {
                      void handleVerifyCode();
                    }}
                    otpLength={otpLength}
                  />
                </PublicAuthShell>
              </AppInstallProvider>
            }
            path="/sign-in"
          />
          <Route element={<Navigate replace to="/sign-in" />} path="*" />
        </Routes>
      }
      />
    </TenantRuntimeConfigProvider>
  );
}

export type { TenantRuntimeConfig };
