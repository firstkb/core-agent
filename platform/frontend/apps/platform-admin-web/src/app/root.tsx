import { useEffect, useState } from "react";

import { AuthProvider } from "@platform/auth-core";
import { AppUpdateBanner, FullscreenBrandLoader } from "@platform/app-shell";
import { BrowserRouter } from "react-router-dom";

import { App } from "./app";

function AdminBrandLockup() {
  return (
    <div className="public-brand-lockup">
      <img
        alt="eSafety Systems"
        className="public-brand-logo"
        src="/assets/logo-light.svg"
      />
    </div>
  );
}

async function loadRequiredJson(path: string) {
  const response = await fetch(path, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${path}.`);
  }

  return response.json();
}

function persistConfigEntries(config: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("platform.admin.config", JSON.stringify(config));

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      window.localStorage.setItem(key, value);
    }
  }
}

function sleep(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

let adminBootstrapPromise: Promise<void> | null = null;

function bootstrapAdminRuntime() {
  if (!adminBootstrapPromise) {
    adminBootstrapPromise = Promise.all([
      loadRequiredJson("/config.json"),
      sleep(250),
    ])
      .then(([config]) => {
        if (config && typeof config === "object" && !Array.isArray(config)) {
          persistConfigEntries(config as Record<string, unknown>);
        }
      })
      .catch(() => undefined);
  }

  return adminBootstrapPromise;
}

export function Root() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isActive = true;
    void bootstrapAdminRuntime().finally(() => {
      if (isActive) {
        setIsBootstrapping(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (isBootstrapping) {
    return (
      <FullscreenBrandLoader
        description="Please wait a moment."
        label="Opening sign in"
        logo={<AdminBrandLockup />}
      />
    );
  }

  return (
    <AuthProvider storageNamespace="platform-admin-auth">
      <BrowserRouter>
        <>
          <App />
          <AppUpdateBanner />
        </>
      </BrowserRouter>
    </AuthProvider>
  );
}
