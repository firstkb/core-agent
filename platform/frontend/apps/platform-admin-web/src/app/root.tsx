import { useEffect, useMemo, useState } from "react";

import {
  AuthProvider,
  createOtpAuthService,
} from "@platform/auth-core";
import {
  appShellLocaleResources,
  AppUpdateBanner,
  FullscreenBrandLoader,
} from "@platform/app-shell";
import {
  mergeLocaleResources,
  PlatformI18nProvider,
  useTranslation,
} from "@platform/i18n";
import { BrowserRouter } from "react-router-dom";

import {
  App,
  type AdminRuntimeConfig,
} from "./app";
import { adminLocaleResources } from "../locales";

const adminI18nResources = mergeLocaleResources(
  appShellLocaleResources,
  adminLocaleResources,
);

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

function requireRuntimeUrl(config: Record<string, unknown>, key: keyof AdminRuntimeConfig) {
  const value = config[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Runtime config is missing ${key}.`);
  }

  return value.trim();
}

let adminBootstrapPromise: Promise<AdminRuntimeConfig> | null = null;

function bootstrapAdminRuntime() {
  if (!adminBootstrapPromise) {
    adminBootstrapPromise = loadRequiredJson("/config.json")
      .then((config) => {
        if (!config || typeof config !== "object" || Array.isArray(config)) {
          throw new Error("Unable to resolve admin runtime config.");
        }

        persistConfigEntries(config as Record<string, unknown>);

        return {
          adminApiUrl: requireRuntimeUrl(config as Record<string, unknown>, "adminApiUrl"),
          authApiUrl: requireRuntimeUrl(config as Record<string, unknown>, "authApiUrl"),
        };
      });
  }

  return adminBootstrapPromise;
}

export function Root() {
  return (
    <PlatformI18nProvider
      resources={adminI18nResources}
      storageKey="platform-admin-locale"
    >
      <AdminRuntimeRoot />
    </PlatformI18nProvider>
  );
}

function AdminRuntimeRoot() {
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [runtimeConfig, setRuntimeConfig] = useState<AdminRuntimeConfig | null>(null);
  const { t } = useTranslation();
  const authService = useMemo(() => {
    if (!runtimeConfig) {
      return null;
    }

    return createOtpAuthService({
      authApiUrl: runtimeConfig.authApiUrl,
      surface: "admin",
    });
  }, [runtimeConfig]);

  useEffect(() => {
    let isActive = true;
    void bootstrapAdminRuntime()
      .then((config) => {
        if (isActive) {
          setRuntimeConfig(config);
          setBootstrapError(null);
          setIsBootstrapping(false);
        }
      })
      .catch((error) => {
        if (isActive) {
          setBootstrapError(error instanceof Error ? error.message : t("admin.loaders.bootstrapDescription"));
          setIsBootstrapping(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [t]);

  if (isBootstrapping || !runtimeConfig || !authService) {
    return (
      <FullscreenBrandLoader
        description={bootstrapError ?? t("admin.loaders.bootstrapDescription")}
        label={t("admin.loaders.bootstrapLabel")}
        logo={<AdminBrandLockup />}
      />
    );
  }

  return (
    <AuthProvider
      service={authService}
      storageNamespace="platform-admin-auth"
    >
      <BrowserRouter>
        <>
          <App runtimeConfig={runtimeConfig} />
          <AppUpdateBanner />
        </>
      </BrowserRouter>
    </AuthProvider>
  );
}
