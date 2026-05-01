import { useEffect, useMemo, useRef, useState } from "react";

import {
  applyRuntimeWorkflowStatus,
  createRuntimeFormFixture,
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
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { formRuntimePaths } from "../form-runtime-route-meta";
import "./form-runtime.css";

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
  const [saveState, setSaveState] = useState<RuntimeFormSaveState>("idle");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAppliedInitialStatusRef = useRef(false);

  useEffect(() => {
    setValues(fixture.values);
    setErrors({});
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
      setErrors(nextErrors);
      setSaveState("error");
      return;
    }

    setErrors({});
    setValues((currentValues) => applyRuntimeWorkflowStatus(fixture.definition, currentValues, "final"));
    setSaveState("saved");
  }

  function handleBackToList() {
    navigate(formRuntimePaths.list(modelId, viewId));
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
    </div>
  );
}
