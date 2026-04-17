import {
  createContext,
  useContext,
} from "react";
import type { ReactNode } from "react";

type TenantFavoritesRefreshHandler = () => Promise<void>;

const TenantFavoritesRefreshContext = createContext<TenantFavoritesRefreshHandler | undefined>(undefined);

export function TenantFavoritesRefreshProvider({
  children,
  onFavoritesRefresh,
}: {
  children: ReactNode;
  onFavoritesRefresh: TenantFavoritesRefreshHandler;
}) {
  return (
    <TenantFavoritesRefreshContext.Provider value={onFavoritesRefresh}>
      {children}
    </TenantFavoritesRefreshContext.Provider>
  );
}

export function useTenantFavoritesRefresh() {
  return useContext(TenantFavoritesRefreshContext);
}
