import type {
  RuntimeFormChecklistRevealRequest,
  RuntimeFormSubformDefinition,
  RuntimeFormSubformRow,
} from "@platform/forms";
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
  CheckCircleIcon,
  CloseIcon,
} from "@platform/ui-kit";

export type FinishDialogState = {
  checklistReveal?: RuntimeFormChecklistRevealRequest;
  fieldId?: string;
  message: string;
  nodeId?: string;
  tone: "danger" | "success";
};

export type SubformDeleteDialogState = {
  row: RuntimeFormSubformRow;
  subform: RuntimeFormSubformDefinition;
};

export type UnsavedLeaveDialogState = {
  scope: "root" | "subform";
};

type RuntimeFormDialogsProps = {
  finishDialog: FinishDialogState | null;
  onCloseFinishDialog: () => void;
  onCloseSubformDeleteDialog: () => void;
  onCloseUnsavedLeaveDialog: () => void;
  onConfirmSubformDelete: () => void;
  onConfirmUnsavedLeave: () => void;
  onFinishDialogAction: () => void;
  subformDeleteDialog: SubformDeleteDialogState | null;
  unsavedLeaveDialog: UnsavedLeaveDialogState | null;
};

export function RuntimeFormDialogs({
  finishDialog,
  onCloseFinishDialog,
  onCloseSubformDeleteDialog,
  onCloseUnsavedLeaveDialog,
  onConfirmSubformDelete,
  onConfirmUnsavedLeave,
  onFinishDialogAction,
  subformDeleteDialog,
  unsavedLeaveDialog,
}: RuntimeFormDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      <AlertDialog
        closeOnEscape={false}
        closeOnOverlay={false}
        onOpenChange={(open) => {
          if (!open) {
            onCloseFinishDialog();
          }
        }}
        open={Boolean(finishDialog)}
      >
        <AlertDialogContent
          aria-label={finishDialog?.message}
          className={`tenant-web__form-runtime-finish-dialog tenant-web__form-runtime-finish-dialog--${finishDialog?.tone ?? "danger"}`}
          showCloseButton={false}
        >
          <AlertDialogHeader className="tenant-web__form-runtime-finish-dialog-header">
            <span
              aria-hidden="true"
              className={`tenant-web__form-runtime-finish-dialog-icon tenant-web__form-runtime-finish-dialog-icon--${finishDialog?.tone ?? "danger"}`}
            >
              {finishDialog?.tone === "success" ? <CheckCircleIcon /> : <CloseIcon />}
            </span>
            <AlertDialogTitle className="tenant-web__form-runtime-finish-dialog-title">
              {finishDialog?.message}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="tenant-web__form-runtime-finish-dialog-footer">
            <AlertDialogAction
              onClick={onFinishDialogAction}
              variant={finishDialog?.tone === "success" ? "success" : "danger"}
            >
              {t("tenant.runtime.forms.form.dialog.ok")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            onCloseSubformDeleteDialog();
          }
        }}
        open={Boolean(subformDeleteDialog)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tenant.runtime.forms.form.deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tenant.runtime.forms.form.deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">
              {t("tenant.runtime.forms.form.dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmSubformDelete} variant="danger">
              {t("tenant.runtime.forms.form.dialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            onCloseUnsavedLeaveDialog();
          }
        }}
        open={Boolean(unsavedLeaveDialog)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tenant.runtime.forms.form.unsavedDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {unsavedLeaveDialog?.scope === "subform"
                ? t("tenant.runtime.forms.form.unsavedDialog.subformDescription")
                : t("tenant.runtime.forms.form.unsavedDialog.rootDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">
              {t("tenant.runtime.forms.form.dialog.stay")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmUnsavedLeave} variant="danger">
              {t("tenant.runtime.forms.form.dialog.leave")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
