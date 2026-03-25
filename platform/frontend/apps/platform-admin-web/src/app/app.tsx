import { useEffect, useState } from "react";

import {
  AuthGuard,
  useAuth,
} from "@platform/auth-core";
import {
  AuthSignInForm,
  FullscreenBrandLoader,
  normalizeAuthIdentifier,
  PublicAuthShell,
  sanitizeAuthInputValue,
  type AuthContactMethod,
} from "@platform/app-shell";
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
  return (
    <div className="admin-web__auth-surface-badge">
      <span>Admin Console</span>
    </div>
  );
}

export function App() {
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

  const currentYear = new Date().getFullYear();
  const authDescription = codeSent
    ? `Enter the Authorization Code sent to ${requestedIdentifier}.`
    : "Use your platform admin email or phone to access Admin Console.";

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
            description="Loading your platform controls."
            label="Opening Admin Console"
          />
        )
      }
      pending={
        <AdminBootstrapLoader
          description="Checking your admin session."
          label="Welcome back"
        />
      }
      unauthenticated={
        <Routes>
          <Route
            element={
              <PublicAuthShell
                brand={<AdminAuthBrandRow />}
                description={authDescription}
                footer={`© ${currentYear} eSafety Systems. All rights reserved.`}
                tagline="Control. Visibility. Reliability."
                title="Sign in to Admin Console"
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
                  requestLabel="Send code"
                  verifyLabel="Enter Admin Console"
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
