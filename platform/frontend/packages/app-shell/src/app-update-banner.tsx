import type { HTMLAttributes } from "react";

import { useTranslation } from "@platform/i18n";
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
  message,
  reloadLabel,
  versionUrl,
  ...props
}: AppUpdateBannerProps) {
  const { t } = useTranslation();
  const { isUpdateAvailable, latestBuild, reloadApp } = useAppUpdate({
    checkIntervalMs,
    versionUrl,
  });
  const resolvedMessage = message ?? t("appUpdate.message");
  const resolvedReloadLabel = reloadLabel ?? t("appUpdate.reload");

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
        <p className="app-update-banner__message">{resolvedMessage}</p>
      </div>

      <div className="app-update-banner__actions">
        <Button onClick={reloadApp} size="sm" variant="primary">
          {resolvedReloadLabel}
        </Button>
      </div>
    </div>
  );
}

export type { AppUpdateBannerProps };
