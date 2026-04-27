import { useTranslation } from "@platform/i18n";
import { Button, CloseIcon } from "@platform/ui-kit";

export type CollectionTableQuickFilterToken = {
  id: string;
  label: string;
  onRemove: () => void;
};

type CollectionTableFilterTokenBarProps = {
  activeTokens: ReadonlyArray<CollectionTableQuickFilterToken>;
  isCurrentFilterSetSaved: boolean;
  onResetFilters: () => void;
  onSaveFilterSet: () => void;
  quickFilterCount: number;
};

export function CollectionTableFilterTokenBar({
  activeTokens,
  isCurrentFilterSetSaved,
  onResetFilters,
  onSaveFilterSet,
  quickFilterCount,
}: CollectionTableFilterTokenBarProps) {
  const { t } = useTranslation();

  if (activeTokens.length === 0) {
    return null;
  }

  return (
    <div className="admin-web__collection-toolbar-secondary">
      <div className="admin-web__collection-toolbar-tokens">
        {activeTokens.map((token) => (
          <button
            className="admin-web__collection-filter-token"
            key={token.id}
            onClick={token.onRemove}
            type="button"
          >
            <span>{token.label}</span>
            <CloseIcon className="admin-web__collection-filter-token-icon" />
          </button>
        ))}
      </div>

      <div className="admin-web__collection-toolbar-secondary-actions">
        <Button className="admin-web__collection-reset-filter" onClick={onResetFilters} size="sm" variant="outline">
          {t("admin.collectionTable.actions.resetFilters")}
        </Button>

        <Button
          className="admin-web__collection-save-filter"
          disabled={quickFilterCount === 0 || isCurrentFilterSetSaved}
          onClick={onSaveFilterSet}
          size="sm"
          variant="ghost"
        >
          {isCurrentFilterSetSaved ? t("admin.collectionTable.actions.saved") : t("admin.collectionTable.actions.saveFilterSet")}
        </Button>
      </div>
    </div>
  );
}
