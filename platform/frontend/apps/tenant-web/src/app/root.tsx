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
  type TenantRuntimeConfig,
} from "./app";
import { tenantLocaleResources } from "../locales";
import { TenantBrandImage } from "./tenant-brand-image";

const tenantI18nResources = mergeLocaleResources(
  appShellLocaleResources,
  tenantLocaleResources,
);

type TenantRuntimeBootstrap = {
  runtimeConfig: TenantRuntimeConfig;
};

function TenantBrandLockup() {
  return (
    <div className="public-brand-lockup">
      <TenantBrandImage
        alt="Tenant Workspace"
        className="public-brand-logo"
        fallbackSrc="/assets/logo-light.svg"
        primarySrc="/tenant/logo-light.svg"
      />
    </div>
  );
}

async function loadJson<T>(path: string, optional = false): Promise<T | null> {
  try {
    const response = await fetch(path, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (optional) {
        return null;
      }

      throw new Error(`Unable to load ${path}.`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (optional) {
      return null;
    }

    throw error;
  }
}

function persistConfigEntries(storageKey: string, config: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(config));

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      window.localStorage.setItem(key, value);
    }
  }
}

function ensureTenantStylesheet() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById("tenant-runtime-style")) {
    return;
  }

  const link = document.createElement("link");
  link.id = "tenant-runtime-style";
  link.rel = "stylesheet";
  link.href = "/tenant/style.css";
  document.head.append(link);
}

function requireRuntimeUrl(config: Record<string, unknown>, key: keyof TenantRuntimeConfig) {
  const value = config[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Runtime config is missing ${key}.`);
  }

  return value.trim();
}

let tenantBootstrapPromise: Promise<TenantRuntimeBootstrap> | null = null;

function bootstrapTenantRuntime() {
  if (!tenantBootstrapPromise) {
    tenantBootstrapPromise = (async () => {
      ensureTenantStylesheet();

      const appConfig = await loadJson<Record<string, unknown>>("/config.json");

      if (!appConfig) {
        throw new Error("Unable to resolve tenant runtime config.");
      }

      persistConfigEntries("platform.tenant.config", appConfig);

      return {
        runtimeConfig: {
          authApiUrl: requireRuntimeUrl(appConfig, "authApiUrl"),
          tenantApiUrl: requireRuntimeUrl(appConfig, "tenantApiUrl"),
        },
      };
    })();
  }

  return tenantBootstrapPromise;
}

export function Root() {
  return (
    <PlatformI18nProvider
      resources={tenantI18nResources}
      storageKey="tenant-workspace-locale"
    >
      <TenantRuntimeRoot />
    </PlatformI18nProvider>
  );
}

function TenantRuntimeRoot() {
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [runtimeConfig, setRuntimeConfig] = useState<TenantRuntimeConfig | null>(null);
  const { t } = useTranslation();
  const authService = useMemo(() => {
    if (!runtimeConfig) {
      return null;
    }

    return createOtpAuthService({
      authApiUrl: runtimeConfig.authApiUrl,
      surface: "tenant",
    });
  }, [runtimeConfig]);

  useEffect(() => {
    let isActive = true;
    void bootstrapTenantRuntime()
      .then((bootstrap) => {
        if (isActive) {
          setRuntimeConfig(bootstrap.runtimeConfig);
          setBootstrapError(null);
          setIsBootstrapping(false);
        }
      })
      .catch((error) => {
        if (isActive) {
          setBootstrapError(error instanceof Error ? error.message : t("tenant.loaders.bootstrapDescription"));
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
        description={bootstrapError ?? t("tenant.loaders.bootstrapDescription")}
        label={t("tenant.loaders.bootstrapLabel")}
        logo={<TenantBrandLockup />}
      />
    );
  }

  return (
    <AuthProvider
      service={authService}
      storageNamespace="tenant-workspace-auth"
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
