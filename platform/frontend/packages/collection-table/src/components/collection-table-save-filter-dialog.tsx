import { useTranslation } from "@platform/i18n";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@platform/ui-kit";

type CollectionTableSaveFilterDialogProps = {
  labelError: string | null;
  onConfirm: () => Promise<void> | void;
  onLabelChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  value: string;
};

export function CollectionTableSaveFilterDialog({
  labelError,
  onConfirm,
  onLabelChange,
  onOpenChange,
  open,
  value,
}: CollectionTableSaveFilterDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.collectionTable.dialog.title")}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="admin-web__collection-save-dialog-form">
            <Input
              autoFocus
              aria-invalid={labelError ? "true" : undefined}
              id="saved-filter-set-name"
              onChange={(event) => onLabelChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }

                event.preventDefault();
                void onConfirm();
              }}
              placeholder={t("admin.collectionTable.dialog.placeholder")}
              value={value}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            {t("admin.collectionTable.dialog.cancel")}
          </Button>
          <Button disabled={Boolean(labelError)} onClick={() => void onConfirm()}>
            {t("admin.collectionTable.dialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
