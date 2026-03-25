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
  sanitizeAuthInputValue,
  type AuthContactMethod,
} from "@platform/app-shell";
import { useTranslation } from "@platform/i18n";
import { Navigate, Route, Routes } from "react-router-dom";

import { PrivateApp } from "./private-app";

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

export function App() {
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

  const currentYear = new Date().getFullYear();
  const authDescription = codeSent
    ? t("admin.auth.descriptionCode", { identifier: requestedIdentifier })
    : t("admin.auth.descriptionEnter");

  return (
    <AuthGuard
      authenticated={
        profileReady ? (
          <Routes>
            <Route element={<Navigate replace to="/dashboard" />} path="/sign-in" />
            <Route element={<PrivateApp />} path="/*" />
          </Routes>
        ) : (
          <AdminBootstrapLoader
            description={t("admin.loaders.profileDescription")}
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
              <PublicAuthShell
                brand={<AdminAuthBrandRow />}
                description={authDescription}
                footer={<AuthLocaleFooter year={currentYear} />}
                tagline={t("admin.auth.tagline")}
                title={t("admin.auth.title")}
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
                  verifyLabel={t("admin.auth.verifyLabel")}
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
