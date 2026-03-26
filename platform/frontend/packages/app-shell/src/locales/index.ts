import { installHelperLocaleResources } from "@platform/install-helper";
import { mergeLocaleResources, type LocaleResources } from "@platform/i18n";

import { appShellEnglishMessages } from "./en";
import { appShellSpanishMessages } from "./es";

export const appShellLocaleResources = mergeLocaleResources(
  {
    en: appShellEnglishMessages,
    es: appShellSpanishMessages,
  },
  installHelperLocaleResources,
) satisfies LocaleResources;
