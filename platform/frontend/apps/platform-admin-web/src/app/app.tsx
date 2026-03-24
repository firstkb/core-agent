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

const adminSession = getDemoSession("admin");

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

function AdminAuthBrandRow({
  qrValue,
}: {
  qrValue: string;
}) {
  return (
    <div className="public-auth-shell__brand-row">
      <AdminBrandLockup />
      <PublicAuthQrPanel
        className="public-auth-shell__brand-qr"
        foregroundColor="#111111"
        size={50}
        value={qrValue}
      />
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

export function App() {
  const { isAuthenticated, requestCode, signIn, userId } = useAuth();
  const [codeSent, setCodeSent] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState(adminSession.email);
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
            <Route element={<Navigate replace to="/dashboard" />} path="/sign-in" />
            <Route element={<PrivateApp />} path="/*" />
          </Routes>
        ) : (
          <AdminBootstrapLoader
            description="Opening your workspace."
            label="Please wait"
          />
        )
      }
      pending={
        <AdminBootstrapLoader
          description="Checking your session."
          label="Welcome"
        />
      }
      unauthenticated={
        <Routes>
          <Route
            element={
              <PublicAuthShell
                brand={<AdminAuthBrandRow qrValue={qrValue} />}
                description={authDescription}
                footer={`© ${currentYear} eSafety Systems. All rights reserved.`}
                floating={(
                  <div className="public-auth-shell__floating-card">
                    <p className="public-auth-shell__floating-title">Platform Admin</p>
                    <p className="public-auth-shell__floating-subtitle">Secure access</p>
                  </div>
                )}
                tagline="Control. Visibility. Reliability."
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
