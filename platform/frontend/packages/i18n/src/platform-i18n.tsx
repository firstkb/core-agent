import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { createInstance } from "i18next";
import type { i18n as I18nInstance } from "i18next";
import {
  I18nextProvider,
  initReactI18next,
  useTranslation,
} from "react-i18next";

type Locale = "en" | "es";

type LocaleResourceValue = string | LocaleResourceTree;
interface LocaleResourceTree {
  [key: string]: LocaleResourceValue;
}
type LocaleResources = Record<Locale, LocaleResourceTree>;

type PlatformI18nProviderProps = {
  children: ReactNode;
  fallbackLocale?: Locale;
  resources: LocaleResources;
  storageKey?: string;
};

type LocaleOption = {
  label: string;
  nativeLabel: string;
  value: Locale;
};

type LocaleContextValue = {
  fallbackLocale: Locale;
  storageKey: string;
};

const SUPPORTED_LOCALES = ["en", "es"] as const satisfies readonly Locale[];
const LOCALE_OPTIONS = [
  { label: "English", nativeLabel: "English", value: "en" },
  { label: "Spanish", nativeLabel: "Español", value: "es" },
] as const satisfies readonly LocaleOption[];

const emptyLocaleResources = {
  en: {},
  es: {},
} satisfies LocaleResources;

const LocaleContext = createContext<LocaleContextValue | null>(null);

function isLocaleResourceTree(value: LocaleResourceValue): value is LocaleResourceTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeLocaleTrees(
  baseTree: LocaleResourceTree,
  nextTree: LocaleResourceTree,
): LocaleResourceTree {
  const mergedTree: LocaleResourceTree = { ...baseTree };

  for (const [key, value] of Object.entries(nextTree)) {
    const existingValue = mergedTree[key];

    if (isLocaleResourceTree(existingValue) && isLocaleResourceTree(value)) {
      mergedTree[key] = mergeLocaleTrees(existingValue, value);
      continue;
    }

    mergedTree[key] = value;
  }

  return mergedTree;
}

function normalizeLocale(value?: string | null, fallbackLocale: Locale = "en"): Locale {
  if (!value) {
    return fallbackLocale;
  }

  const normalizedValue = value.toLowerCase();
  if (normalizedValue.startsWith("es")) {
    return "es";
  }

  if (normalizedValue.startsWith("en")) {
    return "en";
  }

  return fallbackLocale;
}

function resolveInitialLocale(storageKey: string, fallbackLocale: Locale): Locale {
  if (typeof window === "undefined") {
    return fallbackLocale;
  }

  const storedLocale = window.localStorage.getItem(storageKey);
  if (storedLocale) {
    return normalizeLocale(storedLocale, fallbackLocale);
  }

  return normalizeLocale(window.navigator.language, fallbackLocale);
}

function createI18nInstance({
  fallbackLocale,
  initialLocale,
  resources,
}: {
  fallbackLocale: Locale;
  initialLocale: Locale;
  resources: LocaleResources;
}): I18nInstance {
  const instance = createInstance();

  void instance
    .use(initReactI18next)
    .init({
      fallbackLng: fallbackLocale,
      initImmediate: false,
      interpolation: {
        escapeValue: false,
      },
      lng: initialLocale,
      resources: {
        en: { translation: resources.en },
        es: { translation: resources.es },
      },
      returnNull: false,
      supportedLngs: [...SUPPORTED_LOCALES],
    });

  return instance;
}

export function mergeLocaleResources(
  ...resourceSets: Array<Partial<Record<Locale, LocaleResourceTree>>>
): LocaleResources {
  return {
    en: resourceSets.reduce(
      (mergedTree, resourceSet) =>
        mergeLocaleTrees(mergedTree, resourceSet.en ?? emptyLocaleResources.en),
      emptyLocaleResources.en,
    ),
    es: resourceSets.reduce(
      (mergedTree, resourceSet) =>
        mergeLocaleTrees(mergedTree, resourceSet.es ?? emptyLocaleResources.es),
      emptyLocaleResources.es,
    ),
  };
}

export function PlatformI18nProvider({
  children,
  fallbackLocale = "en",
  resources,
  storageKey = "platform.locale",
}: PlatformI18nProviderProps) {
  const initialLocale = useMemo(
    () => resolveInitialLocale(storageKey, fallbackLocale),
    [fallbackLocale, storageKey],
  );
  const i18n = useMemo(
    () => createI18nInstance({ fallbackLocale, initialLocale, resources }),
    [fallbackLocale, initialLocale, resources],
  );

  useEffect(() => {
    function syncLanguageMetadata(nextLanguage?: string) {
      const normalizedLocale = normalizeLocale(nextLanguage, fallbackLocale);

      if (typeof document !== "undefined") {
        document.documentElement.lang = normalizedLocale;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, normalizedLocale);
      }
    }

    syncLanguageMetadata(i18n.resolvedLanguage ?? i18n.language);
    i18n.on("languageChanged", syncLanguageMetadata);

    return () => {
      i18n.off("languageChanged", syncLanguageMetadata);
    };
  }, [fallbackLocale, i18n, storageKey]);

  return (
    <LocaleContext.Provider value={{ fallbackLocale, storageKey }}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  const { i18n } = useTranslation();

  if (!context) {
    throw new Error("useLocale must be used within PlatformI18nProvider.");
  }

  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language, context.fallbackLocale);

  return {
    locale,
    localeOptions: LOCALE_OPTIONS,
    setLocale: async (nextLocale: Locale) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(context.storageKey, nextLocale);
      }

      await i18n.changeLanguage(nextLocale);
    },
  };
}

export {
  LOCALE_OPTIONS,
  SUPPORTED_LOCALES,
  useTranslation,
};

export type {
  Locale,
  LocaleOption,
  LocaleResources,
  LocaleResourceTree,
  LocaleResourceValue,
  PlatformI18nProviderProps,
};
