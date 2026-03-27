import type { ReactNode } from "react";

import "./published-app.css";

type PublishedAppPageShellProps = {
  actions?: ReactNode;
  badges?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

export function PublishedAppPageShell({
  actions,
  badges,
  children,
  description,
  eyebrow,
  title,
}: PublishedAppPageShellProps) {
  return (
    <div className="tenant-published-app__page">
      <section className="tenant-published-app__hero">
        <div className="tenant-published-app__hero-copy">
          {eyebrow ? <p className="tenant-published-app__eyebrow">{eyebrow}</p> : null}
          <h2 className="tenant-published-app__title">{title}</h2>
          <p className="tenant-published-app__description">{description}</p>
          {badges ? <div className="tenant-published-app__badge-row">{badges}</div> : null}
        </div>

        {actions ? <div className="tenant-published-app__hero-actions">{actions}</div> : null}
      </section>

      {children}
    </div>
  );
}
