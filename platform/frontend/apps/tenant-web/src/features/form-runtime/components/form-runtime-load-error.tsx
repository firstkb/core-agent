import { Button } from "@platform/ui-kit";

export type RuntimeFormLoadErrorState = {
  code?: string;
  description: string;
  title: string;
};

type FormRuntimeLoadErrorProps = RuntimeFormLoadErrorState & {
  backLabel: string;
  onBack: () => void;
};

export function FormRuntimeLoadError({
  backLabel,
  code,
  description,
  onBack,
  title,
}: FormRuntimeLoadErrorProps) {
  return (
    <div className="tenant-web__form-runtime-form-page tenant-web__form-runtime-form-page--centered">
      <div className="tenant-web__form-runtime-load-error" role="status">
        {code ? (
          <div aria-hidden="true" className="tenant-web__form-runtime-load-error-code">
            {code}
          </div>
        ) : null}
        <h1 className="tenant-web__form-runtime-load-error-title">
          {title}
        </h1>
        <p className="tenant-web__form-runtime-load-error-description">
          {description}
        </p>
        <Button onClick={onBack} type="button" variant="secondary">
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
