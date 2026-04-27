import type { ReactNode } from "react";

import { useTranslation } from "@platform/i18n";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  StarIcon,
} from "@platform/ui-kit";

import type { CollectionTableFavoriteActionMeta } from "../collection-table-contract";
import { OverflowMenuIcon } from "../collection-table-render";
import {
  FilterFunnelIcon,
  RefreshIcon,
  SpreadsheetExportIcon,
} from "./collection-table-icons";

type CollectionTableToolbarAction = {
  label: string;
};

type CollectionTableToolbarActionsProps = {
  exportAction: CollectionTableToolbarAction | null;
  favoriteAction: CollectionTableFavoriteActionMeta | null;
  onExportXls: () => void;
  onReload: () => void;
  onToggleFavorite: () => Promise<void> | void;
  reloadAction: CollectionTableToolbarAction | null;
  savedFilterMenuItems: ReactNode;
};

export function CollectionTableToolbarActions({
  exportAction,
  favoriteAction,
  onExportXls,
  onReload,
  onToggleFavorite,
  reloadAction,
  savedFilterMenuItems,
}: CollectionTableToolbarActionsProps) {
  return (
    <>
      <CollectionTableToolbarDesktopActions
        exportAction={exportAction}
        favoriteAction={favoriteAction}
        onExportXls={onExportXls}
        onReload={onReload}
        onToggleFavorite={onToggleFavorite}
        reloadAction={reloadAction}
        savedFilterMenuItems={savedFilterMenuItems}
      />
      <CollectionTableToolbarMobileActions
        exportAction={exportAction}
        favoriteAction={favoriteAction}
        onExportXls={onExportXls}
        onReload={onReload}
        onToggleFavorite={onToggleFavorite}
        reloadAction={reloadAction}
        savedFilterMenuItems={savedFilterMenuItems}
      />
    </>
  );
}

function CollectionTableFavoriteButton({
  favoriteAction,
  onToggleFavorite,
}: {
  favoriteAction: CollectionTableFavoriteActionMeta | null;
  onToggleFavorite: () => Promise<void> | void;
}) {
  const { t } = useTranslation();

  if (!favoriteAction) {
    return null;
  }

  return (
    <button
      aria-label={favoriteAction.isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
      className={`admin-web__collection-smart-icon-button admin-web__collection-smart-icon-button--favorite${favoriteAction.isFavorite ? " admin-web__collection-smart-icon-button--active" : ""}`}
      onClick={() => {
        void onToggleFavorite();
      }}
      title={favoriteAction.isFavorite ? t("admin.collectionTable.favorite.remove") : t("admin.collectionTable.favorite.add")}
      type="button"
    >
      <StarIcon className="admin-web__collection-smart-action-icon" />
    </button>
  );
}

function CollectionTableToolbarDesktopActions(props: CollectionTableToolbarActionsProps) {
  const { t } = useTranslation();
  const {
    exportAction,
    favoriteAction,
    onExportXls,
    onReload,
    onToggleFavorite,
    reloadAction,
    savedFilterMenuItems,
  } = props;

  return (
    <div className="admin-web__collection-smart-actions admin-web__collection-smart-actions--desktop">
      <CollectionTableFavoriteButton favoriteAction={favoriteAction} onToggleFavorite={onToggleFavorite} />

      <Menu align="end">
        <MenuTrigger>
          <button
            aria-label={t("admin.collectionTable.menu.openSavedFilters")}
            className="admin-web__collection-smart-icon-button"
            title={t("admin.collectionTable.menu.savedFilters")}
            type="button"
          >
            <FilterFunnelIcon className="admin-web__collection-smart-action-icon" />
          </button>
        </MenuTrigger>
        <MenuContent className="admin-web__collection-smart-menu-content">
          <MenuLabel className="admin-web__collection-smart-menu-label">
            {t("admin.collectionTable.menu.savedFilters")}
          </MenuLabel>
          {savedFilterMenuItems}
        </MenuContent>
      </Menu>

      {reloadAction ? (
        <button
          aria-label={t("admin.collectionTable.actions.reload")}
          className="admin-web__collection-smart-icon-button"
          onClick={onReload}
          title={t("admin.collectionTable.actions.reload")}
          type="button"
        >
          <RefreshIcon className="admin-web__collection-smart-action-icon" />
        </button>
      ) : null}

      {exportAction ? (
        <button
          aria-label={t("admin.collectionTable.actions.exportXls")}
          className="admin-web__collection-smart-icon-button"
          onClick={onExportXls}
          title={t("admin.collectionTable.actions.exportXls")}
          type="button"
        >
          <SpreadsheetExportIcon className="admin-web__collection-smart-action-icon" />
        </button>
      ) : null}
    </div>
  );
}

function CollectionTableToolbarMobileActions(props: CollectionTableToolbarActionsProps) {
  const { t } = useTranslation();
  const {
    exportAction,
    favoriteAction,
    onExportXls,
    onReload,
    onToggleFavorite,
    reloadAction,
    savedFilterMenuItems,
  } = props;

  return (
    <div className="admin-web__collection-smart-actions admin-web__collection-smart-actions--mobile">
      <CollectionTableFavoriteButton favoriteAction={favoriteAction} onToggleFavorite={onToggleFavorite} />

      <Menu align="end">
        <MenuTrigger>
          <button
            aria-label={t("admin.collectionTable.menu.openTableActions")}
            className="admin-web__collection-smart-icon-button"
            title={t("admin.collectionTable.menu.moreActions")}
            type="button"
          >
            <OverflowMenuIcon className="admin-web__collection-smart-menu-icon" />
          </button>
        </MenuTrigger>
        <MenuContent className="admin-web__collection-smart-menu-content">
          {reloadAction ? (
            <MenuItem onClick={onReload}>
              {t("admin.collectionTable.actions.reload")}
            </MenuItem>
          ) : null}

          {exportAction ? (
            <MenuItem onClick={onExportXls}>
              {t("admin.collectionTable.actions.exportXls")}
            </MenuItem>
          ) : null}

          {reloadAction || exportAction ? <MenuSeparator /> : null}

          <MenuLabel className="admin-web__collection-smart-menu-label">
            {t("admin.collectionTable.menu.savedFilters")}
          </MenuLabel>
          {savedFilterMenuItems}
        </MenuContent>
      </Menu>
    </div>
  );
}
