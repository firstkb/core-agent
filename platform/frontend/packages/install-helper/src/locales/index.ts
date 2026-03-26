import type { LocaleResources } from "@platform/i18n";

import { installHelperEnglishMessages } from "./en";
import { installHelperSpanishMessages } from "./es";

export const installHelperLocaleResources = {
  en: installHelperEnglishMessages,
  es: installHelperSpanishMessages,
} satisfies LocaleResources;
