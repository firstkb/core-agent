import {
  createContext,
  useContext,
} from "react";

import type { ReactNode } from "react";

import type { TenantWorkspaceUserSession } from "./tenant-workspace-user-session";

const TenantWorkspaceUserContext = createContext<TenantWorkspaceUserSession | null>(null);

export function TenantWorkspaceUserProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TenantWorkspaceUserSession;
}) {
  return (
    <TenantWorkspaceUserContext.Provider value={value}>
      {children}
    </TenantWorkspaceUserContext.Provider>
  );
}

export function useTenantWorkspaceUser() {
  const context = useContext(TenantWorkspaceUserContext);
  if (!context) {
    throw new Error("useTenantWorkspaceUser must be used inside TenantWorkspaceUserProvider.");
  }

  return context;
}
