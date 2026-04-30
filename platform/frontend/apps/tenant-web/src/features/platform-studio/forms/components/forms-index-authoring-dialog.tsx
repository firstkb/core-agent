import { type FormEvent } from "react";

import { type useTranslation } from "@platform/i18n";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@platform/ui-kit";

import { type AuthoringDialogState } from "./forms-index-page-helpers";

type Translate = ReturnType<typeof useTranslation>["t"];

type FormsIndexAuthoringDialogProps = {
  dialogError: string | null;
  dialogState: AuthoringDialogState | null;
  isSubmittingDialog: boolean;
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (title: string) => void;
  t: Translate;
};

export function FormsIndexAuthoringDialog({
  dialogError,
  dialogState,
  isSubmittingDialog,
  onCancel,
  onOpenChange,
  onSubmit,
  onTitleChange,
  t,
}: FormsIndexAuthoringDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(dialogState)}>
      <DialogContent className="tenant-web__platform-studio-authoring-dialog">
        <DialogHeader>
          <DialogTitle>
            {dialogState?.kind === "create-model"
              ? t("tenant.platformStudio.forms.createModelTitle")
              : dialogState?.kind === "create-view"
                ? t("tenant.platformStudio.forms.createViewTitle")
                : t("tenant.platformStudio.forms.copyViewTitle")}
          </DialogTitle>
          <DialogDescription>
            {dialogState?.kind === "create-model"
              ? t("tenant.platformStudio.forms.createModelDescription")
              : dialogState?.kind === "create-view"
                ? t("tenant.platformStudio.forms.createViewDescription")
                : t("tenant.platformStudio.forms.copyViewDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="tenant-web__platform-studio-authoring-dialog-body">
          <form onSubmit={(event) => {
            onSubmit(event);
          }}>
            <div className="tenant-web__platform-studio-form-group">
              <Label htmlFor="tenant-platform-studio-authoring-title">
                {t("tenant.platformStudio.forms.titleLabel")}
              </Label>
              <Input
                autoFocus
                id="tenant-platform-studio-authoring-title"
                onChange={(event) => {
                  onTitleChange(event.target.value);
                }}
                placeholder={t("tenant.platformStudio.forms.titlePlaceholder")}
                value={dialogState?.title ?? ""}
              />
            </div>

            {dialogError ? (
              <div className="tenant-web__platform-studio-inline-help">
                <span>{dialogError}</span>
              </div>
            ) : null}

            <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--align-end">
              <Button
                disabled={isSubmittingDialog}
                onClick={onCancel}
                type="button"
                variant="ghost"
              >
                {t("tenant.platformStudio.forms.cancelAction")}
              </Button>
              <Button
                disabled={isSubmittingDialog}
                type="submit"
              >
                {isSubmittingDialog
                  ? t("tenant.platformStudio.forms.savingAction")
                  : dialogState?.kind === "copy-view"
                    ? t("tenant.platformStudio.forms.copyAction")
                    : t("tenant.platformStudio.forms.createAction")}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
