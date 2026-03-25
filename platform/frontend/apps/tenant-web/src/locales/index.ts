import type { LocaleResources } from "@platform/i18n";

import { tenantEnglishMessages } from "./en";
import { tenantSpanishMessages } from "./es";

export const tenantLocaleResources = {
  en: tenantEnglishMessages,
  es: tenantSpanishMessages,
} satisfies LocaleResources;
