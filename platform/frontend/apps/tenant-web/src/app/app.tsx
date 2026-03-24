import { useEffect, useState } from "react";

import {
  AuthGuard,
  getDemoSession,
  useAuth,
} from "@platform/auth-core";
import {
  AuthSignInForm,
  FullscreenBrandLoader,
  normalizeAuthIdentifier,
  PublicAuthShell,
  PublicAuthQrPanel,
  sanitizeAuthInputValue,
  type AuthContactMethod,
} from "@platform/app-shell";
import { Navigate, Route, Routes } from "react-router-dom";

import { PrivateApp } from "./private-app";
import { TenantBrandImage } from "./tenant-brand-image";

type TenantBranding = {
  name: string;
  tenantDomain?: string;
  tenantId?: string;
};

const tenantSession = getDemoSession("tenant");

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
  const { isAuthenticated, requestCode, signIn, userId } = useAuth();
  const [codeSent, setCodeSent] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState(tenantSession.email);
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
      setError(method === "email" ? "Enter an email address to continue." : "Enter a phone number to continue.");
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
      setError(requestError instanceof Error ? requestError.message : "Unable to send the code.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerifyCode() {
    const normalizedIdentifier = requestedIdentifier || normalizeAuthIdentifier(identifier, method);
    const normalizedCode = codeValue.trim();

    if (!normalizedCode) {
      setError("Enter the authorization code to continue.");
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await signIn(normalizedCode, normalizedIdentifier);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to verify the code.");
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
    ? `Enter the Authorization Code sent to ${requestedIdentifier}.`
    : "To receive an Authorization Code, please provide your email address or phone number.";

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
            description="Opening your workspace."
            label="Please wait"
          />
        )
      }
      pending={
        <TenantBootstrapLoader
          description="Checking your session."
          label="Welcome"
        />
      }
      unauthenticated={
        <Routes>
          <Route
            element={
              <PublicAuthShell
                brand={<TenantAuthBrandRow qrValue={qrValue} />}
                description={authDescription}
                footer={`© ${currentYear} eSafety Systems. All rights reserved.`}
                floating={(
                  <div className="public-auth-shell__floating-card">
                    <p className="public-auth-shell__floating-title">{tenantBranding.name}</p>
                    <p className="public-auth-shell__floating-subtitle">Secure access</p>
                  </div>
                )}
                tagline="Fast. Efficient. Productive."
                title="Sign in"
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
                  phonePlaceholder="Enter your phone number"
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
