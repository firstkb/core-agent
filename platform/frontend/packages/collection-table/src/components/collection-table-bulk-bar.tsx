import { useTranslation } from "@platform/i18n";
import { Button } from "@platform/ui-kit";

import type { CollectionTableBulkActionDefinition } from "../collection-table-contract";

type CollectionTableBulkBarProps = {
  actions: ReadonlyArray<CollectionTableBulkActionDefinition>;
  getActionLabel: (action: CollectionTableBulkActionDefinition) => string;
  getActionToneClass: (action: CollectionTableBulkActionDefinition) => string;
  onApplyAction: (actionId: string) => Promise<void> | void;
  pendingActionId?: string | null;
  selectedRowCount: number;
};

export function CollectionTableBulkBar({
  actions,
  getActionLabel,
  getActionToneClass,
  onApplyAction,
  pendingActionId = null,
  selectedRowCount,
}: CollectionTableBulkBarProps) {
  const { t } = useTranslation();

  if (selectedRowCount <= 0) {
    return null;
  }

  return (
    <div className="admin-web__collection-bulk-bar" role="region" aria-label={t("admin.collectionTable.selection.bulkActions")}>
      <div className="admin-web__collection-bulk-bar-copy">
        <span className="admin-web__collection-bulk-bar-count">{t("admin.collectionTable.selection.selectedCount", { count: selectedRowCount })}</span>
      </div>

      <div className="admin-web__collection-bulk-bar-actions">
        {actions.map((action) => (
          <Button
            className={`admin-web__collection-bulk-button${getActionToneClass(action)}`}
            disabled={Boolean(pendingActionId) && pendingActionId !== action.id}
            key={action.id}
            onClick={() => {
              void onApplyAction(action.id);
            }}
            pending={pendingActionId === action.id}
            size="sm"
            variant="outline"
          >
            {getActionLabel(action)}
          </Button>
        ))}
      </div>
    </div>
  );
}
