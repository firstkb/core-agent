import type { LocaleResources } from "@platform/i18n";

import { adminEnglishMessages } from "./en";
import { adminSpanishMessages } from "./es";

export const adminLocaleResources = {
  en: adminEnglishMessages,
  es: adminSpanishMessages,
} satisfies LocaleResources;
