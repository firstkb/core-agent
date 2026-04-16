import { useMemo } from "react";

import { isUnauthorizedApiError } from "@platform/api-client";
import { useAuth } from "@platform/auth-core";

import { AdminCollectionTablePage } from "../../shared/admin-collection-table-page";
import {
  createAdminCollectionTableAdapter,
  createAdminCollectionTableClient,
} from "../../shared/admin-collection-table-client";

export function AdminTenantsListPage() {
  const { getAccessToken, signOut } = useAuth();
  const client = useMemo(
    () => createAdminCollectionTableClient({
      pathPrefix: "/app/admin/tenants/list",
      supportsRowActions: true,
    }),
    [],
  );
  const adapter = useMemo(
    () => createAdminCollectionTableAdapter({
      client,
      getAccessToken,
      onUnauthorized: () => {
        void signOut();
      },
    }),
    [client, getAccessToken, signOut],
  );

  return (
    <AdminCollectionTablePage
      adapter={adapter}
      isIgnorableError={isUnauthorizedApiError}
      tableId="tenant.list"
    />
  );
}
