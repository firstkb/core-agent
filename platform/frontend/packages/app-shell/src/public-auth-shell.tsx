import type { FormEvent, HTMLAttributes, ReactNode } from "react";

import { useTranslation } from "@platform/i18n";
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  InputOtp,
} from "@platform/ui-kit";

type AuthContactMethod = "email" | "phone";

type PublicAuthShellProps = HTMLAttributes<HTMLDivElement> & {
  brand?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  floating?: ReactNode;
  footer?: ReactNode;
  secondaryLink?: ReactNode;
  surfaceBadge?: ReactNode;
  tagline?: ReactNode;
  title?: ReactNode;
};

type AuthSignInFormProps = {
  backLabel?: string;
  codeSent: boolean;
  codeValue: string;
  emailEnabled?: boolean;
  emailPlaceholder?: string;
  error?: ReactNode;
  helper?: ReactNode;
  inputValue: string;
  isBusy?: boolean;
  method: AuthContactMethod;
  onBack?: () => void;
  onCodeValueChange: (value: string) => void;
  onInputValueChange: (value: string) => void;
  onMethodChange: (method: AuthContactMethod) => void;
  onRequestCode: () => void;
  onVerifyCode: () => void;
  otpLength?: number;
  phoneEnabled?: boolean;
  phonePlaceholder?: string;
  requestLabel?: string;
  verifyLabel?: string;
};

export function PublicAuthShell({
  brand,
  children,
  className,
  description,
  floating,
  footer,
  secondaryLink,
  surfaceBadge,
  tagline,
  title,
  ...props
}: PublicAuthShellProps) {
  return (
    <div
      {...props}
      className={`public-auth-shell${className ? ` ${className}` : ""}`}
    >
      {floating ? <div className="public-auth-shell__floating">{floating}</div> : null}

      <div className="public-auth-shell__content">
        {tagline ? <p className="public-auth-shell__tagline">{tagline}</p> : null}

        <section className="public-auth-shell__card">
          {brand ? <div className="public-auth-shell__brand">{brand}</div> : null}
          {surfaceBadge ? <div className="public-auth-shell__surface">{surfaceBadge}</div> : null}

          {(title || description) ? (
            <header className="public-auth-shell__copy">
              {title ? <h1 className="public-auth-shell__title">{title}</h1> : null}
              {description ? <p className="public-auth-shell__description">{description}</p> : null}
            </header>
          ) : null}

          <div className="public-auth-shell__body">
            {children}
          </div>

          {secondaryLink ? <div className="public-auth-shell__secondary-link">{secondaryLink}</div> : null}
        </section>

        {footer ? <div className="public-auth-shell__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AuthSignInForm({
  backLabel,
  codeSent,
  codeValue,
  emailEnabled = true,
  emailPlaceholder,
  error,
  helper,
  inputValue,
  isBusy = false,
  method,
  onBack,
  onCodeValueChange,
  onInputValueChange,
  onMethodChange,
  onRequestCode,
  onVerifyCode,
  otpLength = 6,
  phoneEnabled = true,
  phonePlaceholder,
  requestLabel,
  verifyLabel,
}: AuthSignInFormProps) {
  const { t } = useTranslation();
  const resolvedBackLabel = backLabel ?? t("auth.back");
  const resolvedEmailPlaceholder = emailPlaceholder ?? t("auth.placeholders.email");
  const resolvedPhonePlaceholder = phonePlaceholder ?? t("auth.placeholders.phone");
  const resolvedRequestLabel = requestLabel ?? t("auth.actions.requestCode");
  const resolvedVerifyLabel = verifyLabel ?? t("auth.actions.verifyCode");
  const inputLabel = method === "email" ? t("auth.labels.email") : t("auth.labels.phone");
  const inputPlaceholder = method === "email" ? resolvedEmailPlaceholder : resolvedPhonePlaceholder;
  const canSwitchMethods = emailEnabled && phoneEnabled;
  const fieldId = !codeSent ? "public-auth-identifier" : "public-auth-code-slot-1";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (codeSent) {
      onVerifyCode();
      return;
    }

    onRequestCode();
  }

  return (
    <form className="public-auth-shell__form" onSubmit={handleSubmit}>
      {!codeSent && canSwitchMethods ? (
        <div
          aria-label={t("auth.methods.label")}
          className="public-auth-shell__method-switcher"
          role="tablist"
        >
          <button
            aria-selected={method === "email"}
            className={`public-auth-shell__method-pill${method === "email" ? " public-auth-shell__method-pill--active" : ""}`}
            onClick={() => onMethodChange("email")}
            role="tab"
            type="button"
          >
            {t("auth.methods.email")}
          </button>
          <button
            aria-selected={method === "phone"}
            className={`public-auth-shell__method-pill${method === "phone" ? " public-auth-shell__method-pill--active" : ""}`}
            onClick={() => onMethodChange("phone")}
            role="tab"
            type="button"
          >
            {t("auth.methods.phone")}
          </button>
        </div>
      ) : null}

      {!codeSent ? (
        <div className="public-auth-shell__field-stack">
          <label className="public-auth-shell__field-label" htmlFor={fieldId}>
            {inputLabel}
          </label>
          <Input
            autoCapitalize={method === "email" ? "none" : undefined}
            autoComplete={method === "email" ? "email" : "tel"}
            disabled={isBusy}
            id="public-auth-identifier"
            onChange={(event) => onInputValueChange(event.target.value)}
            placeholder={inputPlaceholder}
            spellCheck={method === "email" ? false : undefined}
            type={method === "email" ? "email" : "tel"}
            value={inputValue}
          />
        </div>
      ) : (
        <div className="public-auth-shell__field-stack">
          <label className="public-auth-shell__field-label" htmlFor={fieldId}>
            {t("auth.labels.code")}
          </label>
          <InputOtp
            autoFocus
            id="public-auth-code"
            invalid={Boolean(error)}
            length={otpLength}
            onValueChange={onCodeValueChange}
            value={codeValue}
          />
        </div>
      )}

      {error ? (
        <Alert className="public-auth-shell__alert" size="sm" tone="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="public-auth-shell__actions">
        {codeSent ? (
          <Button disabled={isBusy} onClick={onBack} size="lg" type="button" variant="ghost">
            {resolvedBackLabel}
          </Button>
        ) : (
          <span />
        )}

        <Button disabled={isBusy} size="lg" type="submit">
          {codeSent ? resolvedVerifyLabel : resolvedRequestLabel}
        </Button>
      </div>

      {helper ? <div className="public-auth-shell__helper">{helper}</div> : null}
    </form>
  );
}

export type { AuthContactMethod, AuthSignInFormProps, PublicAuthShellProps };
