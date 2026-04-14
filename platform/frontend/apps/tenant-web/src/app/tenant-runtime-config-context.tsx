import {
  createContext,
  useContext,
} from "react";

import type { ReactNode } from "react";

import type { TenantRuntimeConfig } from "./tenant-runtime-config";

const TenantRuntimeConfigContext = createContext<TenantRuntimeConfig | null>(null);

export function TenantRuntimeConfigProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TenantRuntimeConfig;
}) {
  return (
    <TenantRuntimeConfigContext.Provider value={value}>
      {children}
    </TenantRuntimeConfigContext.Provider>
  );
}

export function useTenantRuntimeConfig() {
  const context = useContext(TenantRuntimeConfigContext);

  if (!context) {
    throw new Error("Tenant runtime config is not available.");
  }

  return context;
}
