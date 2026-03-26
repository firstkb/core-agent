import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { useTranslation } from "@platform/i18n";
import {
  Button,
  CloseIcon,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@platform/ui-kit";

type InstallManifestAsset = {
  label?: string;
  sizes?: string;
  src: string;
  type?: string;
};

type InstallManifest = {
  description?: string;
  icons?: InstallManifestAsset[];
  id?: string;
  name?: string;
  screenshots?: InstallManifestAsset[];
  short_name?: string;
  start_url?: string;
};

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type DeferredInstallPromptEvent = Event & {
  platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
};

type AppInstallProviderProps = {
  children: ReactNode;
  manifestUrl?: string;
  storageKey?: string;
};

type InstallPlatform = "apple-desktop" | "apple-mobile" | "chromium" | null;

type AppInstallContextValue = {
  canInstall: boolean;
  closeInstallDialog: () => void;
  hidePrompt: () => void;
  hostname: string;
  isInstallDialogOpen: boolean;
  isInstalled: boolean;
  isPromptHidden: boolean;
  manifest: InstallManifest | null;
  openInstallPrompt: () => void;
  platform: InstallPlatform;
  showPrompt: (forced?: boolean) => void;
};

declare global {
  interface Window {
    __platformDeferredInstallPrompt?: DeferredInstallPromptEvent | null;
    __platformInstallCaptureRegistered?: boolean;
  }
}

const installPromptCapturedEvent = "platform-install-prompt-captured";
const installAppInstalledEvent = "platform-install-appinstalled";
const defaultInstallStorageKey = "pwa-hide-install";

const AppInstallContext = createContext<AppInstallContextValue | null>(null);

function readPromptHidden(storageKey: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(storageKey) === "true";
}

function writePromptHidden(storageKey: string, hidden: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(storageKey, hidden ? "true" : "false");
}

function isAppleMobile() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const isiOSDevice = ["iPhone", "iPad", "iPod"].includes(navigator.platform);
  const isTouchMac = /Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 2;

  return (isiOSDevice || isTouchMac) && "serviceWorker" in navigator;
}

function isAppleDesktop() {
  if (typeof navigator === "undefined" || typeof document === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  if (navigator.maxTouchPoints || !userAgent.includes("macintosh")) {
    return false;
  }

  const versionMatch = /version\/(\d{2})\./.exec(userAgent);
  if (!versionMatch?.[1] || Number.parseInt(versionMatch[1], 10) < 17) {
    return false;
  }

  try {
    const audioCheck = document.createElement("audio").canPlayType('audio/wav; codecs="1"') !== "";
    const webGLCheck = typeof OffscreenCanvas !== "undefined" && Boolean(new OffscreenCanvas(1, 1).getContext("webgl"));

    return audioCheck && webGLCheck;
  } catch {
    return false;
  }
}

function isStandaloneMode() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

  return displayModeStandalone || navigatorWithStandalone.standalone === true;
}

async function getInstalledRelatedApps() {
  if (typeof navigator === "undefined" || !("getInstalledRelatedApps" in navigator)) {
    return [] as Array<unknown>;
  }

  try {
    return await (navigator as Navigator & {
      getInstalledRelatedApps: () => Promise<Array<unknown>>;
    }).getInstalledRelatedApps();
  } catch {
    return [];
  }
}

async function isRelatedAppsInstalled() {
  const relatedApps = await getInstalledRelatedApps();
  return relatedApps.length > 0;
}

function normalizeManifestAssetUrls(manifest: InstallManifest, manifestUrl: string) {
  if (typeof document === "undefined") {
    return manifest;
  }

  const normalizedManifestUrl = new URL(manifestUrl, document.location.href);
  for (const asset of [...manifest.icons ?? [], ...manifest.screenshots ?? []]) {
    asset.src = new URL(asset.src, normalizedManifestUrl).href;
  }

  return manifest;
}

async function loadManifest(manifestUrl: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch(manifestUrl, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Unable to load ${manifestUrl}.`);
    }

    const manifest = await response.json() as InstallManifest;
    return normalizeManifestAssetUrls(manifest, manifestUrl);
  } catch {
    return null;
  }
}

function resolvePlatform() {
  if (isAppleMobile()) {
    return "apple-mobile" as const;
  }

  if (isAppleDesktop()) {
    return "apple-desktop" as const;
  }

  if (typeof window !== "undefined" && window.__platformDeferredInstallPrompt) {
    return "chromium" as const;
  }

  return null;
}

function resolveAppName(manifest: InstallManifest | null, hostname: string) {
  return manifest?.short_name || manifest?.name || hostname || "App";
}

function resolveHostName() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname;
}

function resolvePrimaryIcon(manifest: InstallManifest | null) {
  return manifest?.icons?.[0]?.src || "";
}

function InstallSafariIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 19.92c5.45 0 9.96-4.52 9.96-9.96C19.96 4.51 15.44 0 10 0 4.55 0 .04 4.51.04 9.96c0 5.44 4.52 9.96 9.96 9.96Zm0-1.66a8.26 8.26 0 0 1-8.29-8.3c0-4.61 3.67-8.3 8.28-8.3 4.61 0 8.31 3.69 8.31 8.3 0 4.61-3.69 8.3-8.3 8.3Z" />
      <path d="m5.91 14.88 5.6-2.74a1.47 1.47 0 0 0 .69-.67l2.72-5.59c.31-.67-.17-1.19-.85-.84L8.49 7.76c-.3.14-.51.34-.67.67L5.07 14.04c-.31.64.2 1.15.84.84Zm4.09-3.72A1.19 1.19 0 0 1 8.81 9.97c0-.66.53-1.2 1.19-1.2a1.2 1.2 0 0 1 1.2 1.2c0 .66-.54 1.19-1.2 1.19Z" />
    </svg>
  );
}

function InstallShareIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 18 27">
      <path d="M17.33 10.76v9.75c0 2.01-1.03 3.03-3.07 3.03H3.07C1.03 23.54 0 22.52 0 20.51v-9.75c0-2.01 1.03-3.03 3.07-3.03h2.94v1.57H3.09c-.98 0-1.52.53-1.52 1.54v9.57c0 1.02.54 1.54 1.52 1.54h11.15c.97 0 1.52-.53 1.52-1.54v-9.57c0-1.01-.55-1.54-1.52-1.54h-2.91V7.73h2.94c2.04 0 3.07 1.02 3.07 3.03Z" />
      <path d="M8.66 15.89c.42 0 .78-.35.78-.76V5.1l-.06-1.47.66.7 1.48 1.58a.7.7 0 0 0 .53.23c.4 0 .71-.29.71-.69 0-.21-.09-.36-.23-.51L9.22 1.76c-.2-.2-.36-.27-.57-.27-.19 0-.36.07-.56.27L4.8 4.94a.68.68 0 0 0-.23.51c0 .4.29.69.7.69.19 0 .4-.08.54-.23l1.47-1.58.67-.69-.06 1.46v10.03c0 .41.35.76.77.76Z" />
    </svg>
  );
}

function InstallAddIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 25 25">
      <path d="M23.4 1.61C22.08.28 20.21.04 17.81.04H7.15c-2.34 0-4.2.24-5.53 1.57C.3 2.95.06 4.78.06 7.12V17.7c0 2.41.23 4.25 1.55 5.58 1.34 1.33 3.19 1.57 5.6 1.57h10.6c2.41 0 4.27-.24 5.6-1.57 1.32-1.34 1.55-3.17 1.55-5.58V7.19c0-2.41-.23-4.26-1.55-5.58Zm-.38 5.21v11.25c0 1.52-.21 2.95-1.03 3.78-.84.84-2.3 1.06-3.82 1.06H6.84c-1.52 0-2.96-.23-3.8-1.06-.84-.84-1.05-2.27-1.05-3.78V6.87c0-1.55.21-3.02 1.03-3.85.84-.84 2.32-1.05 3.87-1.05h11.28c1.52 0 2.98.23 3.82 1.06.82.82 1.03 2.27 1.03 3.79Zm-10.53 12.08c.65 0 1.03-.44 1.03-1.13v-4.34h4.53c.66 0 1.13-.37 1.13-.99 0-.65-.44-1.03-1.13-1.03h-4.53V6.87c0-.7-.38-1.13-1.03-1.13-.63 0-.99.45-.99 1.13v4.53H6.98c-.7 0-1.15.38-1.15 1.03 0 .63.49.99 1.15.99h4.52v4.34c0 .66.37 1.13.99 1.13Z" />
    </svg>
  );
}

function InstallDockIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 18">
      <path d="M1.05 3.29v1.38h20.94V3.29Zm2.02 14.69h16.89c2.05 0 3.07-1.01 3.07-3.02V3.03C23.03 1.02 22.01 0 19.96 0H3.07C1.03 0 0 1.02 0 3.03v11.93c0 2.01 1.03 3.02 3.07 3.02Zm.02-1.57c-.98 0-1.52-.52-1.52-1.53V3.12c0-1.02.54-1.55 1.52-1.55h16.85c.97 0 1.51.53 1.51 1.55v11.76c0 1.01-.54 1.53-1.51 1.53Z" />
      <path d="M4.2 14.01c0 .51.35.85.87.85h12.92c.52 0 .87-.34.87-.85v-1.47c0-.51-.35-.85-.87-.85H5.07c-.52 0-.87.34-.87.85Z" />
    </svg>
  );
}

function InstallCardIcon({
  appName,
  iconSrc,
}: {
  appName: string;
  iconSrc: string;
}) {
  if (iconSrc) {
    return (
      <div className="install-helper__icon-wrap">
        <img alt="" className="install-helper__icon" draggable={false} src={iconSrc} />
      </div>
    );
  }

  return (
    <div className="install-helper__icon-wrap">
      <span aria-hidden="true" className="install-helper__icon-fallback">
        {appName.slice(0, 1)}
      </span>
    </div>
  );
}

export function bootstrapAppInstallCapture() {
  if (typeof window === "undefined" || window.__platformInstallCaptureRegistered) {
    return;
  }

  window.__platformInstallCaptureRegistered = true;

  if (!isStandaloneMode()) {
    writePromptHidden(defaultInstallStorageKey, false);
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__platformDeferredInstallPrompt = event as DeferredInstallPromptEvent;
    window.dispatchEvent(new CustomEvent(installPromptCapturedEvent));
  });

  window.addEventListener("appinstalled", () => {
    window.__platformDeferredInstallPrompt = null;
    window.dispatchEvent(new CustomEvent(installAppInstalledEvent));
  });
}

export function AppInstallProvider({
  children,
  manifestUrl = "/manifest.json",
  storageKey = defaultInstallStorageKey,
}: AppInstallProviderProps) {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode());
  const [isPromptHidden, setIsPromptHidden] = useState(() => readPromptHidden(storageKey));
  const [manifest, setManifest] = useState<InstallManifest | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform>(() => resolvePlatform());
  const hostname = useMemo(() => resolveHostName(), []);

  useEffect(() => {
    bootstrapAppInstallCapture();
  }, []);

  useEffect(() => {
    let isActive = true;

    void loadManifest(manifestUrl).then((loadedManifest) => {
      if (isActive) {
        setManifest(loadedManifest);
      }
    });

    return () => {
      isActive = false;
    };
  }, [manifestUrl]);

  useEffect(() => {
    let isActive = true;
    let appleTimeoutId: number | null = null;

    async function syncInstallAvailability() {
      const standalone = isStandaloneMode();
      const relatedInstalled = await isRelatedAppsInstalled();

      if (!isActive) {
        return;
      }

      const installed = standalone || relatedInstalled;
      setIsInstalled(installed);

      if (installed) {
        setPlatform(null);
        setCanInstall(false);
        setIsInstallDialogOpen(false);
        return;
      }

      const nextPlatform = resolvePlatform();
      setPlatform(nextPlatform);

      if (nextPlatform === "chromium") {
        setCanInstall(Boolean(window.__platformDeferredInstallPrompt));
        return;
      }

      if (nextPlatform === "apple-mobile" || nextPlatform === "apple-desktop") {
        setCanInstall(false);
        appleTimeoutId = window.setTimeout(() => {
          if (isActive && !isStandaloneMode()) {
            setCanInstall(true);
          }
        }, 1000);
        return;
      }

      setCanInstall(false);
    }

    function handlePromptCaptured() {
      setPlatform("chromium");
      setCanInstall(!isStandaloneMode() && Boolean(window.__platformDeferredInstallPrompt));
    }

    function handleInstalled() {
      setPlatform(null);
      setCanInstall(false);
      setIsInstalled(true);
      setIsInstallDialogOpen(false);
      setIsPromptHidden(true);
      writePromptHidden(storageKey, true);
    }

    void syncInstallAvailability();
    window.addEventListener(installPromptCapturedEvent, handlePromptCaptured as EventListener);
    window.addEventListener(installAppInstalledEvent, handleInstalled as EventListener);

    return () => {
      isActive = false;
      if (appleTimeoutId !== null) {
        window.clearTimeout(appleTimeoutId);
      }
      window.removeEventListener(installPromptCapturedEvent, handlePromptCaptured as EventListener);
      window.removeEventListener(installAppInstalledEvent, handleInstalled as EventListener);
    };
  }, [storageKey]);

  const contextValue = useMemo<AppInstallContextValue>(() => ({
    canInstall,
    closeInstallDialog: () => {
      setIsInstallDialogOpen(false);
    },
    hidePrompt: () => {
      setIsPromptHidden(true);
      setIsInstallDialogOpen(false);
      writePromptHidden(storageKey, true);
    },
    hostname,
    isInstallDialogOpen,
    isInstalled,
    isPromptHidden,
    manifest,
    openInstallPrompt: () => {
      if (isInstalled || !canInstall) {
        return;
      }

      if (platform === "apple-mobile" || platform === "apple-desktop") {
        setIsInstallDialogOpen((value) => !value);
        return;
      }

      const promptEvent = window.__platformDeferredInstallPrompt;
      if (!promptEvent) {
        setCanInstall(false);
        return;
      }

      setIsPromptHidden(true);
      writePromptHidden(storageKey, true);
      setCanInstall(false);
      window.__platformDeferredInstallPrompt = null;

      void promptEvent.prompt().then(async () => {
        try {
          await promptEvent.userChoice;
        } catch {
          // no-op: keep parity with pwa-install and wait for next page load/appinstalled.
        }
      });
    },
    platform,
    showPrompt: (forced = false) => {
      setIsPromptHidden(false);
      writePromptHidden(storageKey, false);

      if (forced && !isInstalled) {
        setCanInstall(true);
      }
    },
  }), [
    canInstall,
    hostname,
    isInstallDialogOpen,
    isInstalled,
    isPromptHidden,
    manifest,
    platform,
    storageKey,
  ]);

  return (
    <AppInstallContext.Provider value={contextValue}>
      {children}
    </AppInstallContext.Provider>
  );
}

export function useAppInstall() {
  const context = useContext(AppInstallContext);

  if (!context) {
    throw new Error("useAppInstall must be used within AppInstallProvider.");
  }

  return context;
}

export function AppInstallPrompt(props: HTMLAttributes<HTMLDivElement>) {
  const {
    canInstall,
    closeInstallDialog,
    hidePrompt,
    hostname,
    isInstallDialogOpen,
    isInstalled,
    isPromptHidden,
    manifest,
    openInstallPrompt,
    platform,
  } = useAppInstall();
  const { t } = useTranslation();

  if (!canInstall || isInstalled || isPromptHidden || !platform) {
    return null;
  }

  const appName = resolveAppName(manifest, hostname);
  const iconSrc = resolvePrimaryIcon(manifest);
  const hostLabel = hostname;
  const dialogDescription = manifest?.description || hostname;
  const isAppleDesktopPlatform = platform === "apple-desktop";
  const isApplePlatform = platform === "apple-desktop" || platform === "apple-mobile";
  const actionLabel = platform === "chromium"
    ? t("install.actions.install")
    : isAppleDesktopPlatform
      ? t("install.actions.addToDock")
      : t("install.actions.addToHomeScreen");
  const installCopy = isAppleDesktopPlatform
    ? t("install.copy.addToDock")
    : t("install.copy.addToHomeScreen");

  return (
    <>
      <div {...props} className={`install-helper__card${props.className ? ` ${props.className}` : ""}`}>
        <div className="install-helper__header">
          <div className="install-helper__identity">
            <InstallCardIcon appName={appName} iconSrc={iconSrc} />
            <div className="install-helper__copy">
              <span className="install-helper__name">{appName}</span>
              <span className="install-helper__host">{hostLabel}</span>
            </div>
          </div>
          <button
            aria-label={t("install.actions.hidePrompt")}
            className="install-helper__close"
            onClick={hidePrompt}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="install-helper__actions">
          <Button onClick={openInstallPrompt} size="md" variant="primary">
            {actionLabel}
          </Button>
        </div>
      </div>

      {isApplePlatform ? (
        <Dialog open={isInstallDialogOpen} onOpenChange={(open: boolean) => {
          if (open) {
            openInstallPrompt();
            return;
          }

          closeInstallDialog();
        }}>
          <DialogContent className="install-helper__dialog" showCloseButton={false}>
            <DialogHeader>
              <div className="install-helper__dialog-header">
                <div className="install-helper__dialog-identity">
                  <InstallCardIcon appName={appName} iconSrc={iconSrc} />
                  <div className="install-helper__dialog-title-wrap">
                    <DialogTitle>{appName}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                  </div>
                </div>
                <button
                  aria-label={t("install.actions.close")}
                  className="install-helper__close install-helper__dialog-close"
                  onClick={closeInstallDialog}
                  type="button"
                >
                  <CloseIcon />
                </button>
              </div>
            </DialogHeader>

            <DialogBody className="install-helper__dialog-body">
              <p className="install-helper__dialog-copy">{installCopy}</p>

              <div className="install-helper__steps">
                {!isAppleDesktopPlatform ? (
                  <div className="install-helper__step">
                    <div className="install-helper__step-icon">
                      <InstallSafariIcon />
                    </div>
                    <div className="install-helper__step-copy">
                      {t("install.steps.openSafari")}
                    </div>
                  </div>
                ) : null}

                <div className="install-helper__step">
                  <div className="install-helper__step-icon">
                    <InstallShareIcon />
                  </div>
                  <div className="install-helper__step-copy">
                    {t("install.steps.pressShare")}
                  </div>
                </div>

                <div className="install-helper__step">
                  <div className="install-helper__step-icon">
                    {isAppleDesktopPlatform ? <InstallDockIcon /> : <InstallAddIcon />}
                  </div>
                  <div className="install-helper__step-copy">
                    {isAppleDesktopPlatform
                      ? t("install.steps.addToDock")
                      : t("install.steps.addToHomeScreen")}
                  </div>
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="install-helper__dialog-footer">
              <Button onClick={closeInstallDialog} variant="primary">
                {t("install.actions.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

export type {
  AppInstallContextValue,
  AppInstallProviderProps,
  DeferredInstallPromptEvent,
  InstallManifest,
  InstallManifestAsset,
  InstallPlatform,
};
