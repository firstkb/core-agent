import type { HTMLAttributes } from "react";

import { Button } from "@platform/ui-kit";

import { useAppUpdate } from "./app-build";

type AppUpdateBannerProps = HTMLAttributes<HTMLDivElement> & {
  checkIntervalMs?: number;
  message?: string;
  reloadLabel?: string;
  versionUrl?: string;
};

export function AppUpdateBanner({
  checkIntervalMs,
  className,
  message = "A new version is available. Update to load the latest changes.",
  reloadLabel = "Reload",
  versionUrl,
  ...props
}: AppUpdateBannerProps) {
  const { isUpdateAvailable, latestBuild, reloadApp } = useAppUpdate({
    checkIntervalMs,
    versionUrl,
  });

  if (!isUpdateAvailable || !latestBuild) {
    return null;
  }

  return (
    <div
      {...props}
      className={`app-update-banner${className ? ` ${className}` : ""}`}
      role="status"
    >
      <div className="app-update-banner__body">
        <p className="app-update-banner__message">{message}</p>
      </div>

      <div className="app-update-banner__actions">
        <Button onClick={reloadApp} size="sm" variant="primary">
          {reloadLabel}
        </Button>
      </div>
    </div>
  );
}

export type { AppUpdateBannerProps };
