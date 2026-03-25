import { useEffect, useState } from "react";

import {
  AuthGuard,
  useAuth,
} from "@platform/auth-core";
import {
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

import { PrivateApp } from "./private-app";
import { TenantBrandImage } from "./tenant-brand-image";

type TenantBranding = {
  name: string;
  tenantDomain?: string;
  tenantId?: string;
};

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
  tenantBranding,
}: {
  tenantBranding: TenantBranding;
}) {
  const { t } = useTranslation();
  const { isAuthenticated, requestCode, signIn, userId } = useAuth();
  const [codeSent, setCodeSent] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [method, setMethod] = useState<AuthContactMethod>("email");
  const [profileReady, setProfileReady] = useState(false);
  const [requestedIdentifier, setRequestedIdentifier] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileReady(false);
      setCodeSent(false);
      setCodeValue("");
      setError(null);
      setRequestedIdentifier("");
      return;
    }

    setProfileReady(false);
    // TODO(auth-profile): Replace this dev-only delay with a real tenant /profile bootstrap.
    // Load the private-area profile after auth is restored and after runtime config/branding bootstrap.
    // Until the API exists, keep an explicit mock here instead of silently bypassing the gate.
    const timeoutId = window.setTimeout(() => {
      setProfileReady(true);
    }, 650);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAuthenticated, userId]);

  async function handleRequestCode() {
    const normalizedIdentifier = normalizeAuthIdentifier(identifier, method);

    if (!normalizedIdentifier) {
      setError(method === "email" ? t("auth.errors.enterEmail") : t("auth.errors.enterPhone"));
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await requestCode(normalizedIdentifier, { method });
      setIdentifier(normalizedIdentifier);
      setRequestedIdentifier(normalizedIdentifier);
      setCodeSent(true);
      setCodeValue("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("auth.errors.unableToSendCode"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerifyCode() {
    const normalizedIdentifier = requestedIdentifier || normalizeAuthIdentifier(identifier, method);
    const normalizedCode = codeValue.trim();

    if (!normalizedCode) {
      setError(t("auth.errors.enterCode"));
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await signIn(normalizedCode, normalizedIdentifier);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("auth.errors.unableToVerifyCode"));
    } finally {
      setIsBusy(false);
    }
  }

  function resetFlow() {
    setCodeSent(false);
    setCodeValue("");
    setError(null);
    setRequestedIdentifier("");
  }

  const qrValue = typeof window === "undefined" ? "/sign-in" : window.location.href;
  const currentYear = new Date().getFullYear();
  const authDescription = codeSent
    ? t("tenant.auth.descriptionCode", { identifier: requestedIdentifier })
    : t("tenant.auth.descriptionEnter");

  return (
    <AuthGuard
      authenticated={
        profileReady ? (
          <Routes>
            <Route element={<Navigate replace to="/dashboard" />} path="/" />
            <Route element={<Navigate replace to="/dashboard" />} path="/sign-in" />
            <Route element={<PrivateApp />} path="/dashboard" />
            <Route element={<Navigate replace to="/dashboard" />} path="*" />
          </Routes>
        ) : (
          <TenantBootstrapLoader
            description={t("tenant.loaders.profileDescription")}
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
              <PublicAuthShell
                brand={<TenantAuthBrandRow qrValue={qrValue} />}
                description={authDescription}
                footer={<AuthLocaleFooter year={currentYear} />}
                tagline={t("tenant.auth.tagline")}
                title={t("tenant.auth.title")}
              >
                <AuthSignInForm
                  codeSent={codeSent}
                  codeValue={codeValue}
                  error={error}
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
                  }}
                  onRequestCode={() => {
                    void handleRequestCode();
                  }}
                  onVerifyCode={() => {
                    void handleVerifyCode();
                  }}
                />
              </PublicAuthShell>
            }
            path="/sign-in"
          />
          <Route element={<Navigate replace to="/sign-in" />} path="*" />
        </Routes>
      }
    />
  );
}

export type { TenantBranding };
