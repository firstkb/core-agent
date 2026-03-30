import { useEffect, useMemo, useState } from "react";

import {
  type AdminProfile,
  ApiClientError,
  createAdminProfileClient,
  isUnauthorizedApiError,
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
  sanitizeAuthInputValue,
  type AuthContactMethod,
} from "@platform/app-shell";
import { useTranslation } from "@platform/i18n";
import { Navigate, Route, Routes } from "react-router-dom";

import { PrivateApp } from "./private-app";

type AdminRuntimeConfig = {
  adminApiUrl: string;
  authApiUrl: string;
};

type AdminWorkspaceUserSession = {
  displayName: string;
  initial: string;
  secondaryLabel: string;
};

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

function buildAdminWorkspaceUserSession(profile: AdminProfile): AdminWorkspaceUserSession {
  const contactLabel = profile.user.email?.trim() || profile.user.phone?.trim() || "";
  const roleLabel = formatRoleLabel(profile.user.role) || "Platform Admin";
  const displayName = profile.user.name?.trim() || contactLabel || roleLabel;
  const scopeLabel = profile.user.scope?.trim() || "";
  const secondaryLabel = contactLabel || [roleLabel, scopeLabel].filter(Boolean).join(" · ") || profile.user.id;
  const initial = displayName.slice(0, 1).toUpperCase() || "U";

  return {
    displayName,
    initial,
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
    message.includes("admin user not found");
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

function AdminBrandLockup() {
  return (
    <div className="public-brand-lockup">
      <img
        alt="FirstKB Admin"
        className="public-brand-logo public-brand-logo--dark"
        src="/assets/logo-dark.svg"
      />
      <img
        alt="FirstKB Admin"
        className="public-brand-logo public-brand-logo--light"
        src="/assets/logo-light.svg"
      />
    </div>
  );
}

function AdminLoaderLogo() {
  return (
    <img
      alt="eSafety Systems"
      className="public-brand-logo"
      src="/assets/logo-light.svg"
    />
  );
}

function AdminAuthBrandRow() {
  return (
    <div className="public-auth-shell__brand-row admin-web__auth-brand-row">
      <AdminBrandLockup />
      <AdminAuthSurfaceBadge />
    </div>
  );
}

function AdminBootstrapLoader({
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
      logo={<AdminLoaderLogo />}
    />
  );
}

function AdminAuthSurfaceBadge() {
  const { t } = useTranslation();

  return (
    <div className="admin-web__auth-surface-badge">
      <span>{t("admin.auth.surfaceBadge")}</span>
    </div>
  );
}

export function App({
  runtimeConfig,
}: {
  runtimeConfig: AdminRuntimeConfig;
}) {
  const { t } = useTranslation();
  const profileClient = useMemo(
    () => createAdminProfileClient(runtimeConfig.adminApiUrl),
    [runtimeConfig.adminApiUrl],
  );
  const { isAuthenticated, requestCode, signIn, signOut, tokens, userId } = useAuth();
  const [codeSent, setCodeSent] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [method, setMethod] = useState<AuthContactMethod>("email");
  const [otpLength, setOtpLength] = useState(6);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [requestedIdentifier, setRequestedIdentifier] = useState("");
  const [requestedMethod, setRequestedMethod] = useState<AuthContactMethod | null>(null);

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

    const accessToken = tokens?.accessToken;
    if (!accessToken) {
      void signOut();
      return;
    }

    let isActive = true;
    setProfile(null);
    setProfileError(null);
    setProfileReady(false);

    void profileClient
      .getProfile(accessToken)
      .then((nextProfile) => {
        if (isActive) {
          setProfile(nextProfile);
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

        setProfileError(
          profileRequestError instanceof Error
            ? profileRequestError.message
            : t("admin.loaders.profileDescription"),
        );
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, profileClient, signOut, t, tokens?.accessToken, userId]);

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
            ? t("admin.auth.errors.emailNotFound")
            : t("admin.auth.errors.phoneNotFound"),
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
          t("admin.auth.errors.invalidCode"),
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

  const currentYear = new Date().getFullYear();
  const authDescription = codeSent
    ? t("admin.auth.descriptionCode", { identifier: requestedIdentifier })
    : t("admin.auth.descriptionEnter");
  const profileLoaderDescription = profileError ?? t("admin.loaders.profileDescription");
  const workspaceUser = profile ? buildAdminWorkspaceUserSession(profile) : null;

  return (
    <AuthGuard
      authenticated={
        profileReady && workspaceUser ? (
          <Routes>
            <Route element={<Navigate replace to="/dashboard" />} path="/sign-in" />
            <Route element={<PrivateApp userSession={workspaceUser} />} path="/*" />
          </Routes>
        ) : (
          <AdminBootstrapLoader
            description={profileLoaderDescription}
            label={t("admin.loaders.profileLabel")}
          />
        )
      }
      pending={
        <AdminBootstrapLoader
          description={t("admin.loaders.pendingDescription")}
          label={t("admin.loaders.pendingLabel")}
        />
      }
      unauthenticated={
        <Routes>
          <Route
            element={
              <AppInstallProvider>
                <PublicAuthShell
                  brand={<AdminAuthBrandRow />}
                  description={authDescription}
                  footer={<AuthLocaleFooter year={currentYear} />}
                  floating={<AppInstallPrompt />}
                  tagline={t("admin.auth.tagline")}
                  title={t("admin.auth.title")}
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
                    verifyLabel={t("admin.auth.verifyLabel")}
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
  );
}

export type { AdminRuntimeConfig, AdminWorkspaceUserSession };
