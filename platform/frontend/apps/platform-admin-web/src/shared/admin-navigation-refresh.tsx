import { createContext, useContext, type PropsWithChildren } from "react";

type AdminNavigationRefreshHandler = () => Promise<void>;

const AdminNavigationRefreshContext = createContext<AdminNavigationRefreshHandler | undefined>(undefined);

export function AdminNavigationRefreshProvider({
  children,
  onNavigationRefresh,
}: PropsWithChildren<{
  onNavigationRefresh: AdminNavigationRefreshHandler;
}>) {
  return (
    <AdminNavigationRefreshContext.Provider value={onNavigationRefresh}>
      {children}
    </AdminNavigationRefreshContext.Provider>
  );
}

export function useAdminNavigationRefresh() {
  return useContext(AdminNavigationRefreshContext);
}
