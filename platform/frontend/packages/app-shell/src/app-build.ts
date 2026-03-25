import { useEffect, useEffectEvent, useMemo, useState } from "react";

type AppBuildMetadata = {
  buildId: string;
  buildTimestamp: string;
  env: string;
  version: string;
};

type AppVersionDocument = AppBuildMetadata & {
  appId?: string;
};

type AppUpdateOptions = {
  checkIntervalMs?: number;
  versionUrl?: string;
};

type AppUpdateState = {
  currentBuild: AppBuildMetadata;
  isUpdateAvailable: boolean;
  latestBuild: AppVersionDocument | null;
  reloadApp: () => void;
};

function isAppVersionDocument(value: unknown): value is AppVersionDocument {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AppVersionDocument>;
  return typeof candidate.buildId === "string"
    && typeof candidate.buildTimestamp === "string"
    && typeof candidate.env === "string"
    && typeof candidate.version === "string";
}

export function getAppBuildMetadata(): AppBuildMetadata {
  return {
    buildId: __APP_BUILD_ID__,
    buildTimestamp: __BUILD_TIMESTAMP__,
    env: __APP_ENV__,
    version: __APP_VERSION__,
  };
}

export function useAppUpdate({
  checkIntervalMs = 5 * 60 * 1000,
  versionUrl = "/version.json",
}: AppUpdateOptions = {}): AppUpdateState {
  const currentBuild = useMemo(getAppBuildMetadata, []);
  const [latestBuild, setLatestBuild] = useState<AppVersionDocument | null>(null);
  const isUpdateAvailable = latestBuild?.buildId !== undefined
    && latestBuild.buildId !== currentBuild.buildId;

  const checkForUpdate = useEffectEvent(async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    const cacheBustToken = Date.now();
    const requestUrl = `${versionUrl}${versionUrl.includes("?") ? "&" : "?"}t=${cacheBustToken}`;

    try {
      const response = await fetch(requestUrl, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (!isAppVersionDocument(data)) {
        return;
      }

      setLatestBuild((previousBuild) => {
        if (data.buildId === currentBuild.buildId) {
          return previousBuild === null ? previousBuild : null;
        }

        if (
          previousBuild
          && previousBuild.buildId === data.buildId
          && previousBuild.buildTimestamp === data.buildTimestamp
          && previousBuild.env === data.env
          && previousBuild.version === data.version
        ) {
          return previousBuild;
        }

        return data;
      });
    } catch {
      // Ignore transient version-check failures and retry on the next signal.
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    void checkForUpdate();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void checkForUpdate();
      }
    }, checkIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [checkIntervalMs]);

  return {
    currentBuild,
    isUpdateAvailable,
    latestBuild,
    reloadApp: () => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
  };
}

export type {
  AppBuildMetadata,
  AppUpdateOptions,
  AppUpdateState,
  AppVersionDocument,
};
