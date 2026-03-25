import type { LocaleResources } from "@platform/i18n";

import { appShellEnglishMessages } from "./en";
import { appShellSpanishMessages } from "./es";

export const appShellLocaleResources = {
  en: appShellEnglishMessages,
  es: appShellSpanishMessages,
} satisfies LocaleResources;
