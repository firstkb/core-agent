export { getAppBuildMetadata, useAppUpdate } from "./app-build";
export type {
  AppBuildMetadata,
  AppUpdateOptions,
  AppUpdateState,
  AppVersionDocument,
} from "./app-build";

export { AppInstallProvider, bootstrapAppInstallCapture, useAppInstall } from "./app-install";
export type {
  AppInstallContextValue,
  AppInstallProviderProps,
  DeferredInstallPromptEvent,
} from "./app-install";
export { AppInstallPrompt } from "./app-install";
export type { InstallManifest, InstallManifestAsset, InstallPlatform } from "./app-install";

export { AppUpdateBanner } from "./app-update-banner";
export type { AppUpdateBannerProps } from "./app-update-banner";

export { AuthLocaleFooter } from "./auth-locale-footer";
export type { AuthLocaleFooterProps } from "./auth-locale-footer";

export { normalizeAuthIdentifier, sanitizeAuthInputValue } from "./auth-input";

export { LocaleMenuItems } from "./locale-menu-items";

export { appShellLocaleResources } from "./locales";

export { AuthSignInForm, PublicAuthShell } from "./public-auth-shell";
export type { AuthContactMethod, AuthSignInFormProps, PublicAuthShellProps } from "./public-auth-shell";

export { FullscreenBrandLoader } from "./fullscreen-brand-loader";
export type { FullscreenBrandLoaderProps } from "./fullscreen-brand-loader";

export { PublicAuthQrPanel } from "./public-auth-qr-panel";
export type { PublicAuthQrPanelProps } from "./public-auth-qr-panel";

export { WorkspaceShell } from "./workspace-shell";
export type {
  WorkspaceNavItem,
  WorkspaceShellProps,
  WorkspaceShellSidebarControls,
} from "./workspace-shell";
