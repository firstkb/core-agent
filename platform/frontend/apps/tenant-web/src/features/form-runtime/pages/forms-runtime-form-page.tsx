import { useEffect, useMemo, useRef, useState } from "react";

import {
  applyRuntimeWorkflowStatus,
  createRuntimeFormFixture,
  findRuntimeFormField,
  RuntimeFormScaffold,
  validateRuntimeForm,
  type RuntimeFormCommitMode,
  type RuntimeFormMode,
  type RuntimeFormSaveState,
  type RuntimeFormValidationErrors,
  type RuntimeFormValue,
  type RuntimeFormValues,
} from "@platform/forms";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  CheckCircleIcon,
  CloseIcon,
} from "@platform/ui-kit";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { formRuntimePaths } from "../form-runtime-route-meta";
import "./form-runtime.css";

type FinishDialogState = {
  fieldId?: string;
  message: string;
  tone: "danger" | "success";
};

function getRuntimeControlId(definitionId: string, fieldId: string) {
  return `runtime-form-${definitionId}-${fieldId}`;
}

function getRuntimeOptionControl(controlId: string) {
  return Array.from(document.querySelectorAll<HTMLElement>("[id]")).find((element) =>
    element.id.startsWith(`${controlId}-`),
  ) ?? null;
}

export function FormsRuntimeFormPage({
  mode,
}: {
  mode: RuntimeFormMode;
}) {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modelId = params.modelId?.trim() ?? "";
  const viewId = params.viewId?.trim() ?? "";
  const routeDocGuid = params.docGuid?.trim() ?? "";
  const commitMode: RuntimeFormCommitMode = searchParams.get("source") === "static" || searchParams.get("commit") === "finish"
    ? "finish"
    : "autosave";
  const fixture = useMemo(
    () => createRuntimeFormFixture({
      commitMode,
      docGuid: routeDocGuid,
      mode,
      modelId,
      viewId,
    }),
    [commitMode, mode, modelId, routeDocGuid, viewId],
  );
  const [values, setValues] = useState<RuntimeFormValues>(fixture.values);
  const [errors, setErrors] = useState<RuntimeFormValidationErrors>({});
  const [finishDialog, setFinishDialog] = useState<FinishDialogState | null>(null);
  const [saveState, setSaveState] = useState<RuntimeFormSaveState>("idle");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAppliedInitialStatusRef = useRef(false);

  useEffect(() => {
    setValues(fixture.values);
    setErrors({});
    setFinishDialog(null);
    setSaveState("idle");
    hasAppliedInitialStatusRef.current = false;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, [fixture]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  if (!modelId || !viewId || (mode === "edit" && !routeDocGuid)) {
    return <Navigate replace to="/dashboard" />;
  }

  function markAutosaveModeChanged() {
    if (fixture.definition.commitMode !== "autosave") {
      setSaveState("dirty");
      return;
    }

    setSaveState("saving");
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      setSaveState("saved");
      autosaveTimerRef.current = null;
    }, 350);
  }

  function focusRuntimeField(fieldId: string) {
    if (typeof document === "undefined") {
      return;
    }

    const controlId = getRuntimeControlId(fixture.definition.id, fieldId);
    const directControl = document.getElementById(controlId);
    const optionControl = getRuntimeOptionControl(controlId);
    const focusTarget = directControl ?? optionControl;

    if (!focusTarget) {
      return;
    }

    focusTarget.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });

    if (typeof focusTarget.focus === "function") {
      focusTarget.focus({ preventScroll: true });
    }
  }

  function handleFieldChange(fieldId: string, value: RuntimeFormValue) {
    setValues((currentValues) => {
      let nextValues: RuntimeFormValues = {
        ...currentValues,
        [fieldId]: value,
      };

      if (mode === "create" && fixture.definition.commitMode === "autosave" && !hasAppliedInitialStatusRef.current) {
        nextValues = applyRuntimeWorkflowStatus(fixture.definition, nextValues, "initial");
        hasAppliedInitialStatusRef.current = true;
      }

      return nextValues;
    });
    setErrors((currentErrors) => {
      if (!currentErrors[fieldId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldId];
      return nextErrors;
    });
    markAutosaveModeChanged();
  }

  function handleFinish() {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    const nextErrors = validateRuntimeForm(fixture.definition, values);
    if (Object.values(nextErrors).some(Boolean)) {
      const firstErrorFieldId = Object.keys(nextErrors).find((fieldId) => nextErrors[fieldId]);
      const firstErrorField = firstErrorFieldId
        ? findRuntimeFormField(fixture.definition, firstErrorFieldId)
        : null;
      const firstErrorLabel = firstErrorField?.label ?? "this field";

      setErrors(nextErrors);
      setSaveState("error");
      setFinishDialog({
        fieldId: firstErrorFieldId,
        message: `Please fill field: "${firstErrorLabel}"`,
        tone: "danger",
      });
      return;
    }

    setErrors({});
    setValues((currentValues) => applyRuntimeWorkflowStatus(fixture.definition, currentValues, "final"));
    setSaveState("saved");
    setFinishDialog({
      message: "Successfully saved to server.",
      tone: "success",
    });
  }

  function handleBackToList() {
    navigate(formRuntimePaths.list(modelId, viewId));
  }

  function handleFinishDialogAction() {
    const currentDialog = finishDialog;
    setFinishDialog(null);

    if (!currentDialog) {
      return;
    }

    if (currentDialog.tone === "success") {
      navigate(formRuntimePaths.list(modelId, viewId));
      return;
    }

    if (currentDialog.fieldId) {
      globalThis.setTimeout(() => {
        focusRuntimeField(currentDialog.fieldId ?? "");
      }, 0);
    }
  }

  return (
    <div className="tenant-web__form-runtime-form-page">
      <RuntimeFormScaffold
        definition={fixture.definition}
        errors={errors}
        onBack={handleBackToList}
        onFieldChange={handleFieldChange}
        onFinish={handleFinish}
        saveState={saveState}
        values={values}
      />
      <AlertDialog
        closeOnEscape={false}
        closeOnOverlay={false}
        onOpenChange={(open) => {
          if (!open) {
            setFinishDialog(null);
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
              onClick={handleFinishDialogAction}
              variant={finishDialog?.tone === "success" ? "success" : "danger"}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
