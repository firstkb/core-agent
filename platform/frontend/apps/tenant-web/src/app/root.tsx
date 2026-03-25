import { useEffect, useState } from "react";

import { AuthProvider } from "@platform/auth-core";
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

import { App, type TenantBranding } from "./app";
import { tenantLocaleResources } from "../locales";
import { TenantBrandImage } from "./tenant-brand-image";

const fallbackBranding: TenantBranding = {
  name: "Demo Tenant",
  tenantDomain: "demo.platform.local",
  tenantId: "1000",
};

const tenantI18nResources = mergeLocaleResources(
  appShellLocaleResources,
  tenantLocaleResources,
);

function TenantBrandLockup() {
  return (
    <div className="public-brand-lockup">
      <TenantBrandImage
        alt="eSafety Systems"
        className="public-brand-logo"
        fallbackSrc="/assets/logo-light.svg"
        primarySrc="/assets/logo-light.svg"
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

function sleep(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

let tenantBootstrapPromise: Promise<TenantBranding> | null = null;

function bootstrapTenantRuntime() {
  if (!tenantBootstrapPromise) {
    tenantBootstrapPromise = (async () => {
      ensureTenantStylesheet();

      try {
        const [appConfig, tenantConfig] = await Promise.all([
          loadJson<Record<string, unknown>>("/config.json"),
          loadJson<Record<string, unknown>>("/tenant/config.json", true),
          sleep(250),
        ]);

        if (appConfig) {
          persistConfigEntries("platform.tenant.config", appConfig);
        }

        if (tenantConfig) {
          persistConfigEntries("platform.tenant.branding", tenantConfig);
        }

        if (!tenantConfig) {
          return fallbackBranding;
        }

        return {
          name: typeof tenantConfig.name === "string" && tenantConfig.name.trim()
            ? tenantConfig.name
            : fallbackBranding.name,
          tenantDomain: typeof tenantConfig.tenantDomain === "string"
            ? tenantConfig.tenantDomain
            : fallbackBranding.tenantDomain,
          tenantId: typeof tenantConfig.tenantId === "string"
            ? tenantConfig.tenantId
            : fallbackBranding.tenantId,
        };
      } catch {
        return fallbackBranding;
      }
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
  const [branding, setBranding] = useState<TenantBranding>(fallbackBranding);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let isActive = true;
    void bootstrapTenantRuntime().then((resolvedBranding) => {
      if (isActive) {
        setBranding(resolvedBranding);
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
        description={t("tenant.loaders.bootstrapDescription")}
        label={t("tenant.loaders.bootstrapLabel")}
        logo={<TenantBrandLockup />}
      />
    );
  }

  return (
    <AuthProvider storageNamespace="tenant-workspace-auth">
      <BrowserRouter>
        <>
          <App tenantBranding={branding} />
          <AppUpdateBanner />
        </>
      </BrowserRouter>
    </AuthProvider>
  );
}
