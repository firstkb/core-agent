export type RuntimeSystemModule = {
  actionLabel: string;
  description: string;
  moduleKey: string;
  path: string;
  title: string;
};

const runtimeSystemModules: Record<string, RuntimeSystemModule> = {
  dashboard: {
    actionLabel: "Open dashboard",
    description: "Resume the tenant dashboard module inside the authenticated shell.",
    moduleKey: "dashboard",
    path: "/dashboard",
    title: "Tenant dashboard",
  },
};

export function resolveRuntimeSystemModule(moduleKey: string): RuntimeSystemModule | null {
  return runtimeSystemModules[moduleKey] ?? null;
}
