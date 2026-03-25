import { useLocale, useTranslation } from "@platform/i18n";
import {
  MenuItem,
  MenuLabel,
  MenuSeparator,
} from "@platform/ui-kit";

export function LocaleMenuItems() {
  const { locale, localeOptions, setLocale } = useLocale();
  const { t } = useTranslation();

  return (
    <>
      <MenuLabel>{t("shell.menu.language")}</MenuLabel>
      {localeOptions.map((option) => (
        <MenuItem
          key={option.value}
          onClick={() => {
            void setLocale(option.value);
          }}
        >
          {locale === option.value
            ? `${option.nativeLabel} (${t("common.current")})`
            : option.nativeLabel}
        </MenuItem>
      ))}
      <MenuSeparator />
    </>
  );
}
