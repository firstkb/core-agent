import type { ComponentProps } from "react";

import { CollectionTablePage } from "@platform/collection-table";

import { useAdminNavigationRefresh } from "./admin-navigation-refresh";

type AdminCollectionTablePageProps = Omit<ComponentProps<typeof CollectionTablePage>, "onFavoriteToggleSuccess">;

export function AdminCollectionTablePage(props: AdminCollectionTablePageProps) {
  const onNavigationRefresh = useAdminNavigationRefresh();
  const onFavoriteToggleSuccess = onNavigationRefresh
    ? async () => {
      await onNavigationRefresh();
    }
    : undefined;

  return (
    <CollectionTablePage
      {...props}
      onFavoriteToggleSuccess={onFavoriteToggleSuccess}
    />
  );
}
