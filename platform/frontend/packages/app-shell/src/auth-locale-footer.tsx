import { useLocale, useTranslation } from "@platform/i18n";

type AuthLocaleFooterProps = {
  companyName?: string;
  year?: number;
};

export function AuthLocaleFooter({
  companyName = "eSafety Systems",
  year = new Date().getFullYear(),
}: AuthLocaleFooterProps) {
  const { locale, localeOptions, setLocale } = useLocale();
  const { t } = useTranslation();

  return (
    <div className="public-auth-shell__locale-footer">
      <div
        aria-label={t("common.language")}
        className="public-auth-shell__locale-switcher"
        role="group"
      >
        {localeOptions.map((option, index) => (
          <div className="public-auth-shell__locale-link-group" key={option.value}>
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="public-auth-shell__locale-separator"
              >
                /
              </span>
            ) : null}
            <button
              aria-current={locale === option.value ? "true" : undefined}
              className={`public-auth-shell__locale-link${locale === option.value ? " public-auth-shell__locale-link--active" : ""}`}
              onClick={() => {
                void setLocale(option.value);
              }}
              type="button"
            >
              {option.nativeLabel}
            </button>
          </div>
        ))}
      </div>

      <p className="public-auth-shell__locale-legal">
        {t("auth.footer.copyright", { companyName, year })}
      </p>
    </div>
  );
}

export type { AuthLocaleFooterProps };
