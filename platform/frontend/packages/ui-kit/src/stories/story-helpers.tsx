import type { ReactNode } from "react";

export function StoryGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      }}
    >
      {children}
    </div>
  );
}

export function StorySection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section style={{ display: "grid", gap: "12px" }}>
      <div>
        <h2 style={{ fontSize: "18px", lineHeight: 1.25, margin: 0 }}>{title}</h2>
        {description ? (
          <p style={{ color: "#64748b", margin: "4px 0 0" }}>{description}</p>
        ) : null}
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function StoryStack({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: "28px" }}>{children}</div>;
}
