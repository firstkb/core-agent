import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../../lib/cx";

export type GuidedEmptyStateStep = {
  id: string;
  title: string;
  description?: string;
};

export type GuidedEmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  steps: ReadonlyArray<GuidedEmptyStateStep>;
};

export function GuidedEmptyState({
  actions,
  className,
  description,
  eyebrow,
  steps,
  title,
  ...props
}: GuidedEmptyStateProps) {
  return (
    <div {...props} className={cx("ui-pattern ui-guided-empty-state", className)}>
      {eyebrow ? <p className="ui-guided-empty-state__eyebrow">{eyebrow}</p> : null}
      <h2 className="ui-pattern__title">{title}</h2>
      {description ? <p className="ui-pattern__description">{description}</p> : null}
      <ol className="ui-guided-empty-state__steps">
        {steps.map((step, index) => (
          <li className="ui-guided-empty-state__step" key={step.id}>
            <span className="ui-guided-empty-state__step-index">{index + 1}</span>
            <div className="ui-guided-empty-state__step-copy">
              <span className="ui-guided-empty-state__step-title">{step.title}</span>
              {step.description ? (
                <span className="ui-guided-empty-state__step-description">{step.description}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {actions ? <div className="ui-pattern__actions">{actions}</div> : null}
    </div>
  );
}
