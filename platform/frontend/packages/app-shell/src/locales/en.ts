import type { LocaleResourceTree } from "@platform/i18n";

export const appShellEnglishMessages = {
  appUpdate: {
    message: "A new version is available. Update to load the latest changes.",
    reload: "Update",
  },
  auth: {
    actions: {
      requestCode: "Send code",
      verifyCode: "Verify code",
    },
    back: "Use another contact",
    errors: {
      enterCode: "Enter the authorization code to continue.",
      enterCodeLength: "Enter the {{count}}-digit authorization code to continue.",
      enterEmail: "Enter an email address to continue.",
      enterPhone: "Enter a phone number to continue.",
      unableToSendCode: "Unable to send the code.",
      unableToVerifyCode: "Unable to verify the code.",
    },
    footer: {
      copyright: "© {{year}} {{companyName}}. All rights reserved.",
    },
    helper: {
      codeLength: "This authorization code has {{count}} digits.",
    },
    labels: {
      code: "Authorization code",
      email: "Email address",
      phone: "Phone number",
    },
    methods: {
      email: "Email",
      label: "Sign-in method",
      phone: "Phone",
    },
    placeholders: {
      email: "Enter your email address",
      phone: "Enter your phone number",
    },
  },
  common: {
    current: "Current",
    language: "Language",
    languages: {
      en: "English",
      es: "Español",
    },
    themes: {
      dark: "Dark",
      light: "Light",
    },
  },
  shell: {
    actions: {
      collapseNavigation: "Collapse navigation",
      expandNavigation: "Expand navigation",
      switchToDarkTheme: "Switch to dark theme",
      switchToLightTheme: "Switch to light theme",
    },
    aria: {
      closeNavigation: "Close navigation",
      openNavigation: "Open navigation",
      platformUtilities: "Platform utilities",
      primary: "Primary",
      primaryModuleNavigation: "Primary module navigation",
    },
    brand: {
      firstkbPlatform: "FirstKB Platform",
    },
    menu: {
      installApp: "Install app",
      language: "Language",
      myProfile: "My profile",
      preferences: "Preferences",
      signOut: "Sign out",
      themeSwitcher: "Theme switcher",
    },
  },
} satisfies LocaleResourceTree;
