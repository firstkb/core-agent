type AppSurface = "admin" | "tenant";

type DemoSession = {
  displayName: string;
  email: string;
  roleLabel: string;
  tenantName?: string;
};

function getDemoSession(surface: AppSurface): DemoSession {
  if (surface === "admin") {
    return {
      displayName: "Alex Morgan",
      email: "alex@firstkb.internal",
      roleLabel: "Platform Operator",
    };
  }

  return {
    displayName: "Maya Patel",
    email: "maya@northwind.example",
    roleLabel: "Tenant Admin",
    tenantName: "Northwind Commerce",
  };
}

function formatSessionLabel(session: DemoSession) {
  return session.tenantName
    ? `${session.displayName} · ${session.roleLabel} · ${session.tenantName}`
    : `${session.displayName} · ${session.roleLabel}`;
}

export { formatSessionLabel, getDemoSession };
export type { AppSurface, DemoSession };
