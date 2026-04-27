import { useTranslation } from "@platform/i18n";
import { CloseIcon, MenuItem } from "@platform/ui-kit";

import type { CollectionTableSavedFilterSet } from "../collection-table-contract";

type CollectionTableSavedFilterMenuItemsProps = {
  canDelete: boolean;
  deletingSavedFilterId: string | null;
  onApplySavedFilterSet: (savedFilterSet: CollectionTableSavedFilterSet) => void;
  onDeleteSavedFilterSet: (savedFilterId: string) => Promise<void> | void;
  savedFilterSets: ReadonlyArray<CollectionTableSavedFilterSet>;
};

export function CollectionTableSavedFilterMenuItems({
  canDelete,
  deletingSavedFilterId,
  onApplySavedFilterSet,
  onDeleteSavedFilterSet,
  savedFilterSets,
}: CollectionTableSavedFilterMenuItemsProps) {
  const { t } = useTranslation();

  if (savedFilterSets.length === 0) {
    return (
      <MenuItem disabled>
        {t("admin.collectionTable.menu.noSavedFilters")}
      </MenuItem>
    );
  }

  return (
    <>
      {savedFilterSets.map((savedFilterSet) => (
        <div className="admin-web__collection-saved-filter-row" key={savedFilterSet.id}>
          <MenuItem
            className="admin-web__collection-saved-filter-apply"
            onClick={() => onApplySavedFilterSet(savedFilterSet)}
          >
            {savedFilterSet.label}
          </MenuItem>
          {canDelete ? (
            <button
              aria-label={t("admin.collectionTable.menu.deleteSavedFilter", { label: savedFilterSet.label })}
              className="admin-web__collection-saved-filter-delete"
              disabled={deletingSavedFilterId === savedFilterSet.id}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void onDeleteSavedFilterSet(savedFilterSet.id);
              }}
              title={t("admin.collectionTable.menu.deleteSavedFilter", { label: savedFilterSet.label })}
              type="button"
            >
              <CloseIcon className="admin-web__collection-saved-filter-delete-icon" />
            </button>
          ) : null}
        </div>
      ))}
    </>
  );
}
