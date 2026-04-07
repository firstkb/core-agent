import { useMemo } from "react";

import { isUnauthorizedApiError } from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import {
  type CollectionTablePageRowActionPathResolver,
} from "@platform/collection-table";

import { AdminCollectionTablePage } from "../../shared/admin-collection-table-page";
import {
  createAdminCollectionTableAdapter,
  createAdminCollectionTableClient,
} from "../../shared/admin-collection-table-client";

const EMPLOYEES_LIST_TABLE_ID = "employees.list";

const resolveFrontendRowActionPath: CollectionTablePageRowActionPathResolver = (
  action,
  row,
) => {
  switch (action.id) {
    case "edit":
      return `/admin/users/edit/${encodeURIComponent(row.id)}`;
    default:
      return null;
  }
};

export function AdminEmployeesListPage() {
  const { getAccessToken, signOut } = useAuth();
  const client = useMemo(
    () => createAdminCollectionTableClient({
      pathPrefix: "/app/admin/employees/list",
      supportsBulkActions: true,
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
      resolveFrontendRowActionPath={resolveFrontendRowActionPath}
      tableId={EMPLOYEES_LIST_TABLE_ID}
    />
  );
}
