import { type useTranslation } from "@platform/i18n";
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

import {
  type DeleteIntent,
  type DeleteModelIntent,
} from "./forms-index-page-helpers";

type Translate = ReturnType<typeof useTranslation>["t"];

type FormsIndexDeleteDialogsProps = {
  deleteError: string | null;
  deleteIntent: DeleteIntent | null;
  deleteModelIntent: DeleteModelIntent | null;
  isDeletingModel: boolean;
  isDeletingView: boolean;
  onConfirmDeleteModel: () => void;
  onConfirmDeleteView: () => void;
  onModelOpenChange: (open: boolean) => void;
  onViewOpenChange: (open: boolean) => void;
  t: Translate;
};

export function FormsIndexDeleteDialogs({
  deleteError,
  deleteIntent,
  deleteModelIntent,
  isDeletingModel,
  isDeletingView,
  onConfirmDeleteModel,
  onConfirmDeleteView,
  onModelOpenChange,
  onViewOpenChange,
  t,
}: FormsIndexDeleteDialogsProps) {
  return (
    <>
      <AlertDialog
        onOpenChange={onViewOpenChange}
        open={Boolean(deleteIntent)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tenant.platformStudio.forms.confirmDeleteScreen", { title: deleteIntent?.title ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError
                ? deleteError
                : t("tenant.platformStudio.forms.confirmDeleteScreenDescription", { title: deleteIntent?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingView}>
              {t("tenant.platformStudio.forms.cancelDelete")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingView}
              onClick={onConfirmDeleteView}
              variant="danger"
            >
              {isDeletingView
                ? t("tenant.platformStudio.forms.deletingAction")
                : t("tenant.platformStudio.forms.deleteView")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onModelOpenChange}
        open={Boolean(deleteModelIntent)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tenant.platformStudio.forms.confirmDeleteModel", { title: deleteModelIntent?.title ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError
                ? deleteError
                : t("tenant.platformStudio.forms.confirmDeleteModelDescription", { title: deleteModelIntent?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingModel}>
              {t("tenant.platformStudio.forms.cancelDelete")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingModel}
              onClick={onConfirmDeleteModel}
              variant="danger"
            >
              {isDeletingModel
                ? t("tenant.platformStudio.forms.deletingAction")
                : t("tenant.platformStudio.forms.deleteModel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
