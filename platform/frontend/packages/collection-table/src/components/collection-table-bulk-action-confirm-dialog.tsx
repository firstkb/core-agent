import { useTranslation } from "@platform/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@platform/ui-kit";

import type { CollectionTableBulkActionDefinition } from "../collection-table-contract";

type CollectionTableBulkActionConfirmDialogProps = {
  action: CollectionTableBulkActionDefinition | null;
  onConfirm: (action: CollectionTableBulkActionDefinition) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CollectionTableBulkActionConfirmDialog({
  action,
  onConfirm,
  onOpenChange,
  open,
}: CollectionTableBulkActionConfirmDialogProps) {
  const { t } = useTranslation();
  const confirmation = action?.confirmation;

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {confirmation?.title ?? t("admin.collectionTable.selection.confirmTitle")}
          </AlertDialogTitle>
          {confirmation?.description ? (
            <AlertDialogDescription>{confirmation.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">
            {confirmation?.cancelLabel ?? t("admin.collectionTable.dialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (action) {
                void onConfirm(action);
              }
            }}
            variant={action?.tone === "danger" ? "danger" : "primary"}
          >
            {confirmation?.confirmLabel ?? t("admin.collectionTable.selection.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
