import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiClientError, isUnauthorizedApiError } from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import {
  applyRuntimeWorkflowStatus,
  createRuntimeFormDefinitionFromSchema,
  findRuntimeFormField,
  RuntimeFormScaffold,
  validateRuntimeForm,
  type RuntimeFormCommitMode,
  type RuntimeFormDefinition,
  type RuntimeFormFieldType,
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
  useLocation,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useTenantRuntimeConfig } from "../../../app/tenant-runtime-config-context";
import {
  createFormRuntimeCollectionTableClient,
  type FormRuntimeFormResponse,
  type FormRuntimeRecordMutationResponse,
  type FormRuntimeRecordValidationError,
} from "../form-runtime-collection-table-client";
import { formRuntimePaths } from "../form-runtime-route-meta";
import "./form-runtime.css";

type FinishDialogState = {
  fieldId?: string;
  message: string;
  tone: "danger" | "success";
};

type RuntimeFormFieldRevealRequest = {
  fieldId: string;
  requestKey: number;
};

type RuntimeFormNavigationState = {
  runtimeFormSession?: {
    docGuid?: string;
    revision?: string;
    values?: Record<string, unknown>;
  };
};

const AUTOSAVE_DELAY_MS = 350;

function createClientCreateToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (placeholder) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = placeholder === "x" ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getRuntimeControlId(definitionId: string, fieldId: string) {
  return `runtime-form-${definitionId}-${fieldId}`;
}

function getRuntimeOptionControl(controlId: string) {
  return Array.from(document.querySelectorAll<HTMLElement>("[id]")).find((element) =>
    element.id.startsWith(`${controlId}-`),
  ) ?? null;
}

function isRuntimeNavigationState(value: unknown): value is RuntimeFormNavigationState {
  return Boolean(value && typeof value === "object" && "runtimeFormSession" in value);
}

function coerceRuntimeFormValue(
  fieldType: RuntimeFormFieldType,
  value: unknown,
): RuntimeFormValue | undefined {
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === "string");
    return items;
  }

  if (fieldType === "boolean") {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      return value.trim().toLowerCase() === "true";
    }
  }

  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value;
  }
  return undefined;
}

function coerceRuntimeFormValues(
  definition: RuntimeFormDefinition,
  rawValues: Record<string, unknown> | undefined,
) {
  const values: RuntimeFormValues = {};
  if (!rawValues) {
    return values;
  }

  Object.entries(rawValues).forEach(([fieldId, value]) => {
    const field = findRuntimeFormField(definition, fieldId);
    if (!field) {
      return;
    }
    const coerced = coerceRuntimeFormValue(field.type, value);
    if (coerced !== undefined) {
      values[fieldId] = coerced;
    }
  });
  return values;
}

function isEmptyRuntimeFormValue(value: RuntimeFormValue | undefined) {
  return value === undefined
    || value === ""
    || (Array.isArray(value) && value.length === 0);
}

function serializeRuntimeFormValues(values: RuntimeFormValues) {
  const out: Record<string, unknown> = {};
  Object.entries(values).forEach(([fieldId, value]) => {
    if (value !== undefined) {
      out[fieldId] = value;
    }
  });
  return out;
}

function mergeServerValues(
  currentValues: RuntimeFormValues,
  serverValues: RuntimeFormValues,
  serverWins: boolean,
) {
  const nextValues: RuntimeFormValues = {
    ...currentValues,
  };

  Object.entries(serverValues).forEach(([fieldId, value]) => {
    if (serverWins || isEmptyRuntimeFormValue(nextValues[fieldId])) {
      nextValues[fieldId] = value;
    }
  });
  return nextValues;
}

function hasRuntimeValidationErrors(errors: RuntimeFormValidationErrors) {
  return Object.values(errors).some(Boolean);
}

function findFirstValidationError(
  definition: RuntimeFormDefinition,
  errors: RuntimeFormValidationErrors,
) {
  const fieldId = Object.keys(errors).find((candidateFieldId) => errors[candidateFieldId]);
  const field = fieldId ? findRuntimeFormField(definition, fieldId) : null;
  return {
    fieldId,
    label: field?.label ?? "this field",
  };
}

function runtimeValidationErrorsFromServer(
  validationErrors: ReadonlyArray<FormRuntimeRecordValidationError> | undefined,
) {
  const errors: RuntimeFormValidationErrors = {};
  validationErrors?.forEach((error) => {
    if (error.fieldId) {
      errors[error.fieldId] = error.message;
    }
  });
  return errors;
}

function firstRuntimeValidationMessage(
  validationErrors: ReadonlyArray<FormRuntimeRecordValidationError> | undefined,
) {
  return validationErrors?.find((error) => error.message.trim().length > 0)?.message;
}

function hasUserEnteredCreateValues(values: RuntimeFormValues, initialValues: RuntimeFormValues) {
  return Object.entries(values).some(([fieldId, value]) => {
    const initialValue = initialValues[fieldId];
    if (Array.isArray(value) || Array.isArray(initialValue)) {
      return JSON.stringify(value ?? []) !== JSON.stringify(initialValue ?? []);
    }
    return value !== initialValue && !isEmptyRuntimeFormValue(value);
  });
}

function isConflictRuntimeError(requestError: unknown) {
  return requestError instanceof ApiClientError
    && (requestError.statusCode === 409 || requestError.code === "FORM_RUNTIME_CONFLICT");
}

export function FormsRuntimeFormPage({
  mode,
}: {
  mode: RuntimeFormMode;
}) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const runtimeConfig = useTenantRuntimeConfig();
  const { getAccessToken, signOut } = useAuth();
  const modelId = params.modelId?.trim() ?? "";
  const viewId = params.viewId?.trim() ?? "";
  const routeDocGuid = params.docGuid?.trim() ?? "";
  const commitMode: RuntimeFormCommitMode = searchParams.get("source") === "static" || searchParams.get("commit") === "finish"
    ? "finish"
    : "autosave";
  const restoredSession = useMemo(() => {
    if (!isRuntimeNavigationState(location.state)) {
      return null;
    }
    return location.state.runtimeFormSession ?? null;
  }, [location.state]);
  const client = useMemo(
    () => modelId && viewId
      ? createFormRuntimeCollectionTableClient({
        baseUrl: runtimeConfig.tenantApiUrl,
        modelId,
        viewId,
      })
      : null,
    [modelId, runtimeConfig.tenantApiUrl, viewId],
  );
  const [formLoadError, setFormLoadError] = useState("");
  const [formResponse, setFormResponse] = useState<FormRuntimeFormResponse | null>(null);
  const [values, setValues] = useState<RuntimeFormValues>({});
  const [errors, setErrors] = useState<RuntimeFormValidationErrors>({});
  const [fieldRevealRequest, setFieldRevealRequest] = useState<RuntimeFormFieldRevealRequest | null>(null);
  const [finishDialog, setFinishDialog] = useState<FinishDialogState | null>(null);
  const [saveState, setSaveState] = useState<RuntimeFormSaveState>("saving");
  const definition = useMemo(() => {
    if (!formResponse) {
      return null;
    }
    return createRuntimeFormDefinitionFromSchema({
      commitMode,
      dataSchema: formResponse.dataSchema,
      description: formResponse.description,
      mode,
      modelId,
      title: formResponse.title,
      uiSchema: formResponse.uiSchema,
      viewId,
    });
  }, [commitMode, formResponse, mode, modelId, viewId]);
  const initialValues = useMemo<RuntimeFormValues>(() => {
    if (!definition || !formResponse) {
      return {};
    }
    return coerceRuntimeFormValues(definition, formResponse.values);
  }, [definition, formResponse]);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientCreateTokenRef = useRef(createClientCreateToken());
  const createInFlightRef = useRef(false);
  const lastCreateBlockedByValidationRef = useRef(false);
  const lastRuntimeRequestErrorKindRef = useRef<"auth" | "conflict" | "error" | null>(null);
  const fieldRevealRequestKeyRef = useRef(0);
  const createPromiseRef = useRef<Promise<string | null> | null>(null);
  const hasAppliedInitialStatusRef = useRef(false);
  const hasServerRecordRef = useRef(mode === "edit" && routeDocGuid.length > 0);
  const lastPatchSucceededRef = useRef(true);
  const latestValuesRef = useRef<RuntimeFormValues>({});
  const patchInFlightRef = useRef(false);
  const patchPromiseRef = useRef<Promise<void> | null>(null);
  const pendingPatchValuesRef = useRef<Record<string, unknown>>({});
  const revisionRef = useRef(restoredSession?.revision ?? "");
  const currentDocGuidRef = useRef(routeDocGuid || restoredSession?.docGuid || "");

  const getRuntimeAccessToken = useCallback(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      void signOut();
      return null;
    }
    return accessToken;
  }, [getAccessToken, signOut]);

  useEffect(() => {
    if (!client || !modelId || !viewId || (mode === "edit" && !routeDocGuid)) {
      return;
    }

    const accessToken = getRuntimeAccessToken();
    if (!accessToken) {
      return;
    }

    let isCancelled = false;
    setSaveState("saving");
    setFormLoadError("");
    setFormResponse(null);
    void client.loadForm(accessToken, mode === "edit" ? routeDocGuid : undefined)
      .then((response) => {
        if (isCancelled) {
          return;
        }
        setFormResponse(response);
        setSaveState("idle");
      })
      .catch((requestError: unknown) => {
        if (isCancelled) {
          return;
        }
        if (isUnauthorizedApiError(requestError)) {
          void signOut();
          return;
        }
        setFormResponse(null);
        setFormLoadError("Could not load form.");
        setSaveState("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [client, getRuntimeAccessToken, mode, modelId, routeDocGuid, signOut, viewId]);

  useEffect(() => {
    if (!definition || !formResponse) {
      return;
    }
    const restoredValues = restoredSession?.values
      ? coerceRuntimeFormValues(definition, restoredSession.values)
      : {};
    const nextValues = mergeServerValues(initialValues, restoredValues, true);

    setValues(nextValues);
    setErrors({});
    setFieldRevealRequest(null);
    setFinishDialog(null);
    setSaveState("idle");
    latestValuesRef.current = nextValues;
    revisionRef.current = restoredSession?.revision ?? formResponse.revision ?? "";
    currentDocGuidRef.current = routeDocGuid || restoredSession?.docGuid || formResponse.docGuid || "";
    hasServerRecordRef.current = Boolean(currentDocGuidRef.current);
    hasAppliedInitialStatusRef.current = Boolean(nextValues[definition.workflowStatus?.fieldId ?? ""]);
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    pendingPatchValuesRef.current = {};
    lastPatchSucceededRef.current = true;
    lastRuntimeRequestErrorKindRef.current = null;
    clientCreateTokenRef.current = createClientCreateToken();
  }, [definition, formResponse, initialValues, restoredSession, routeDocGuid]);

  useEffect(() => {
    latestValuesRef.current = values;
  }, [values]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  if (!modelId || !viewId || !client || (mode === "edit" && !routeDocGuid)) {
    return <Navigate replace to="/dashboard" />;
  }
  if (formLoadError) {
    return (
      <div className="tenant-web__form-runtime-form-page">
        <div className="tenant-web__form-runtime-form-state tenant-web__form-runtime-form-state--error">
          {formLoadError}
        </div>
      </div>
    );
  }
  if (!definition) {
    return (
      <div className="tenant-web__form-runtime-form-page">
        <div className="tenant-web__form-runtime-form-state">
          Loading form...
        </div>
      </div>
    );
  }
  const runtimeClient = client;
  const runtimeDefinition = definition;

  function handleRuntimeRequestError(requestError: unknown) {
    if (isUnauthorizedApiError(requestError)) {
      void signOut();
      lastRuntimeRequestErrorKindRef.current = "auth";
      return "auth";
    }
    if (isConflictRuntimeError(requestError)) {
      setFinishDialog({
        message: "This record changed on the server. Please reload before continuing.",
        tone: "danger",
      });
      setSaveState("error");
      lastRuntimeRequestErrorKindRef.current = "conflict";
      return "conflict";
    }
    setSaveState("error");
    lastRuntimeRequestErrorKindRef.current = "error";
    return "error";
  }

  function applyMutationResponse(response: FormRuntimeRecordMutationResponse, options?: { serverWins?: boolean }) {
    if (response.revision) {
      revisionRef.current = response.revision;
    }
    if (response.docGuid) {
      currentDocGuidRef.current = response.docGuid;
      hasServerRecordRef.current = true;
    }

    const serverValues = coerceRuntimeFormValues(runtimeDefinition, response.values);
    if (response.status && runtimeDefinition.workflowStatus?.fieldId) {
      serverValues[runtimeDefinition.workflowStatus.fieldId] = response.status;
    }
    setValues((currentValues) => {
      const nextValues = mergeServerValues(currentValues, serverValues, Boolean(options?.serverWins));
      latestValuesRef.current = nextValues;
      return nextValues;
    });
  }

  function applyInitialStatusIfNeeded(nextValues: RuntimeFormValues) {
    if (mode !== "create" || hasAppliedInitialStatusRef.current) {
      return nextValues;
    }
    hasAppliedInitialStatusRef.current = true;
    return applyRuntimeWorkflowStatus(runtimeDefinition, nextValues, "initial");
  }

  async function flushPendingPatch(): Promise<boolean> {
    if (patchInFlightRef.current) {
      await patchPromiseRef.current;
      if (!lastPatchSucceededRef.current) {
        return false;
      }
      if (Object.keys(pendingPatchValuesRef.current).length > 0) {
        return flushPendingPatch();
      }
      return true;
    }

    const docGuid = currentDocGuidRef.current;
    if (!docGuid || Object.keys(pendingPatchValuesRef.current).length === 0) {
      return true;
    }

    const accessToken = getRuntimeAccessToken();
    if (!accessToken) {
      return false;
    }

    const patchValues = pendingPatchValuesRef.current;
    pendingPatchValuesRef.current = {};
    patchInFlightRef.current = true;
    lastPatchSucceededRef.current = true;
    lastRuntimeRequestErrorKindRef.current = null;
    setSaveState("saving");
    let didSave = false;

    const patchPromise = runtimeClient.updateRecord(accessToken, docGuid, {
      expectedRevision: revisionRef.current || undefined,
      values: patchValues,
    })
      .then((response) => {
        applyMutationResponse(response);
        setSaveState("saved");
        lastPatchSucceededRef.current = true;
        didSave = true;
      })
      .catch((requestError: unknown) => {
        pendingPatchValuesRef.current = {
          ...patchValues,
          ...pendingPatchValuesRef.current,
        };
        lastPatchSucceededRef.current = false;
        handleRuntimeRequestError(requestError);
      })
      .finally(() => {
        patchInFlightRef.current = false;
        patchPromiseRef.current = null;
      });

    patchPromiseRef.current = patchPromise;
    await patchPromise;

    if (!didSave) {
      return false;
    }

    if (Object.keys(pendingPatchValuesRef.current).length > 0) {
      return flushPendingPatch();
    }
    return true;
  }

  function schedulePatch(patchValues: Record<string, unknown>) {
    if (!hasServerRecordRef.current) {
      pendingPatchValuesRef.current = {
        ...pendingPatchValuesRef.current,
        ...patchValues,
      };
      return;
    }

    pendingPatchValuesRef.current = {
      ...pendingPatchValuesRef.current,
      ...patchValues,
    };
    setSaveState("saving");

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      void flushPendingPatch();
    }, AUTOSAVE_DELAY_MS);
  }

  async function createRecordIfReady(
    nextValues: RuntimeFormValues,
    options?: { showValidationDialog?: boolean },
  ) {
    if (hasServerRecordRef.current) {
      return currentDocGuidRef.current;
    }
    if (createInFlightRef.current) {
      return createPromiseRef.current;
    }

    const createValues = applyInitialStatusIfNeeded(nextValues);
    if (createValues !== nextValues) {
      latestValuesRef.current = createValues;
      setValues(createValues);
    }

    lastCreateBlockedByValidationRef.current = false;
    const nextErrors = validateRuntimeForm(runtimeDefinition, createValues);
    if (hasRuntimeValidationErrors(nextErrors)) {
      lastCreateBlockedByValidationRef.current = true;
      setSaveState("dirty");
      return null;
    }

    const accessToken = getRuntimeAccessToken();
    if (!accessToken) {
      return null;
    }

    createInFlightRef.current = true;
    lastRuntimeRequestErrorKindRef.current = null;
    setSaveState("saving");

    const createPromise = runtimeClient.createRecord(accessToken, {
      clientCreateToken: clientCreateTokenRef.current,
      values: serializeRuntimeFormValues(createValues),
    })
      .then(async (response) => {
        if ((response.validationErrors?.length ?? 0) > 0) {
          const serverErrors = runtimeValidationErrorsFromServer(response.validationErrors);
          lastCreateBlockedByValidationRef.current = true;
          if (hasRuntimeValidationErrors(serverErrors)) {
            setErrors(serverErrors);
          }
          if (options?.showValidationDialog) {
            const firstError = findFirstValidationError(runtimeDefinition, serverErrors);
            revealRuntimeField(firstError.fieldId);
            setFinishDialog({
              fieldId: firstError.fieldId,
              message: firstRuntimeValidationMessage(response.validationErrors) ?? `Please fill field: "${firstError.label}"`,
              tone: "danger",
            });
          }
          setSaveState("dirty");
          return null;
        }

        applyMutationResponse(response);
        setSaveState("saved");

        if (response.docGuid) {
          navigate(formRuntimePaths.edit(modelId, viewId, response.docGuid), {
            replace: true,
            state: {
              runtimeFormSession: {
                docGuid: response.docGuid,
                revision: response.revision,
                values: {
                  ...serializeRuntimeFormValues(latestValuesRef.current),
                  ...response.values,
                },
              },
            },
          });
        }

        if (Object.keys(pendingPatchValuesRef.current).length > 0) {
          const didFlushPatch = await flushPendingPatch();
          if (!didFlushPatch) {
            return null;
          }
        }

        return response.docGuid || null;
      })
      .catch((requestError: unknown) => {
        handleRuntimeRequestError(requestError);
        return null;
      })
      .finally(() => {
        createInFlightRef.current = false;
        createPromiseRef.current = null;
      });

    createPromiseRef.current = createPromise;
    return createPromise;
  }

  function markRuntimeValueChanged(fieldId: string, value: RuntimeFormValue, nextValues: RuntimeFormValues) {
    const patchValues = {
      [fieldId]: value,
    };

    if (mode === "create" && !hasServerRecordRef.current) {
      if (createInFlightRef.current) {
        pendingPatchValuesRef.current = {
          ...pendingPatchValuesRef.current,
          ...patchValues,
        };
        return;
      }
      void createRecordIfReady(nextValues);
      return;
    }

    schedulePatch(patchValues);
  }

  function revealRuntimeField(fieldId: string | undefined) {
    if (!fieldId) {
      return;
    }

    fieldRevealRequestKeyRef.current += 1;
    setFieldRevealRequest({
      fieldId,
      requestKey: fieldRevealRequestKeyRef.current,
    });
  }

  function focusRuntimeField(fieldId: string) {
    if (typeof document === "undefined") {
      return;
    }

    const controlId = getRuntimeControlId(runtimeDefinition.id, fieldId);
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
    let nextValues: RuntimeFormValues = {
      ...latestValuesRef.current,
      [fieldId]: value,
    };
    nextValues = applyInitialStatusIfNeeded(nextValues);
    latestValuesRef.current = nextValues;
    setValues(nextValues);
    setErrors((currentErrors) => {
      if (!currentErrors[fieldId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldId];
      return nextErrors;
    });
    markRuntimeValueChanged(fieldId, value, nextValues);
  }

  async function handleFinish() {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    const finishValues = applyInitialStatusIfNeeded(latestValuesRef.current);
    if (finishValues !== latestValuesRef.current) {
      latestValuesRef.current = finishValues;
      setValues(finishValues);
    }

    const nextErrors = validateRuntimeForm(runtimeDefinition, finishValues);
    if (hasRuntimeValidationErrors(nextErrors)) {
      const firstError = findFirstValidationError(runtimeDefinition, nextErrors);

      setErrors(nextErrors);
      revealRuntimeField(firstError.fieldId);
      setSaveState("error");
      setFinishDialog({
        fieldId: firstError.fieldId,
        message: `Please fill field: "${firstError.label}"`,
        tone: "danger",
      });
      return;
    }

    setErrors({});
    lastCreateBlockedByValidationRef.current = false;
    const docGuid = hasServerRecordRef.current
      ? currentDocGuidRef.current
      : await createRecordIfReady(finishValues, { showValidationDialog: true });
    if (!docGuid) {
      if (lastCreateBlockedByValidationRef.current) {
        return;
      }
      setFinishDialog({
        message: "Could not save record.",
        tone: "danger",
      });
      return;
    }

    const didFlushPatch = await flushPendingPatch();
    if (!didFlushPatch) {
      if (lastRuntimeRequestErrorKindRef.current === "conflict" || lastRuntimeRequestErrorKindRef.current === "auth") {
        return;
      }
      setFinishDialog({
        message: "Could not save record.",
        tone: "danger",
      });
      return;
    }

    const accessToken = getRuntimeAccessToken();
    if (!accessToken) {
      return;
    }

    setSaveState("saving");
    lastRuntimeRequestErrorKindRef.current = null;
    try {
      const response = await runtimeClient.finishRecord(accessToken, docGuid, {
        expectedRevision: revisionRef.current || undefined,
      });
      applyMutationResponse(response, { serverWins: true });
      setSaveState("saved");
      setFinishDialog({
        message: "Successfully saved to server.",
        tone: "success",
      });
    } catch (requestError) {
      const errorKind = handleRuntimeRequestError(requestError);
      if (errorKind !== "conflict" && errorKind !== "auth") {
        setFinishDialog({
          message: "Could not save record.",
          tone: "danger",
        });
      }
    }
  }

  function handleBackToList() {
    void (async () => {
      if (mode === "create" && !hasServerRecordRef.current && hasUserEnteredCreateValues(values, initialValues)) {
        const canLeave = typeof window === "undefined" || window.confirm("Entered data will be lost. Leave this form?");
        if (!canLeave) {
          return;
        }
      }

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      const didFlushPatch = await flushPendingPatch();
      if (!didFlushPatch) {
        if (lastRuntimeRequestErrorKindRef.current === "conflict" || lastRuntimeRequestErrorKindRef.current === "auth") {
          return;
        }
        setFinishDialog({
          message: "Could not save record.",
          tone: "danger",
        });
        return;
      }
      navigate(formRuntimePaths.list(modelId, viewId));
    })();
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
      revealRuntimeField(currentDialog.fieldId);
      globalThis.setTimeout(() => {
        focusRuntimeField(currentDialog.fieldId ?? "");
      }, 25);
    }
  }

  return (
    <div className="tenant-web__form-runtime-form-page">
      <RuntimeFormScaffold
        definition={runtimeDefinition}
        errors={errors}
        onBack={handleBackToList}
        onFieldChange={handleFieldChange}
        onFinish={() => {
          void handleFinish();
        }}
        revealFieldId={fieldRevealRequest?.fieldId}
        revealRequestKey={fieldRevealRequest?.requestKey}
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
