import { isUnauthorizedApiError } from "@platform/api-client";
import {
  applyRuntimeWorkflowStatus,
  validateRuntimeForm,
  type RuntimeFormActiveTabs,
  type RuntimeFormDefinition,
  type RuntimeFormLabels,
  type RuntimeFormMode,
  type RuntimeFormSaveState,
  type RuntimeFormValidationErrors,
  type RuntimeFormValues,
} from "@platform/forms";

import type { Dispatch, SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";

import type { FinishDialogState } from "./components/form-runtime-dialogs";
import type {
  createFormRuntimeCollectionTableClient,
  FormRuntimeFormResponse,
  FormRuntimeRecordMutationResponse,
  FormRuntimeRecordValidationError,
} from "./form-runtime-collection-table-client";
import { AUTOSAVE_DELAY_MS } from "./form-runtime-browser-helpers";
import {
  isConflictRuntimeError,
  isRuntimeSchemaDriftError,
} from "./form-runtime-error-helpers";
import {
  cloneLookupLabels,
  hasLookupLabels,
  lookupLabelsForChangedValues,
  mergeLookupLabelMaps,
} from "./form-runtime-lookup-helpers";
import {
  formRuntimePaths,
  type FormRuntimeRouteContext,
} from "./form-runtime-route-meta";
import {
  coerceRuntimeFormValues,
  mergeServerValues,
  serializeRuntimeFormValues,
} from "./form-runtime-value-helpers";
import {
  findFirstValidationError,
  firstRuntimeValidationMessage,
  hasRuntimeValidationErrors,
  inputValidationErrorsOnly,
  runtimeClientValidationDialogMessage,
  runtimeValidationErrorsFromServer,
} from "./form-runtime-validation-helpers";

type RuntimeFormMutableRef<T> = {
  current: T;
};

type RuntimeFormRuntimeClient = ReturnType<typeof createFormRuntimeCollectionTableClient>;

type RuntimeFormTranslation = (key: string) => string;

type RuntimeFormMutationControllerConfig = {
  activeTabsRef: RuntimeFormMutableRef<RuntimeFormActiveTabs>;
  autosaveTimerRef: RuntimeFormMutableRef<ReturnType<typeof setTimeout> | null>;
  clientCreateTokenRef: RuntimeFormMutableRef<string>;
  createInFlightRef: RuntimeFormMutableRef<boolean>;
  createPromiseRef: RuntimeFormMutableRef<Promise<string | null> | null>;
  currentDocGuidRef: RuntimeFormMutableRef<string>;
  currentRecordIdRef: RuntimeFormMutableRef<number | string | undefined>;
  entryContext: FormRuntimeRouteContext;
  getRuntimeAccessToken: () => string | null;
  hasAppliedInitialStatusRef: RuntimeFormMutableRef<boolean>;
  hasServerRecordRef: RuntimeFormMutableRef<boolean>;
  isSubform: boolean;
  lastCreateBlockedByValidationRef: RuntimeFormMutableRef<boolean>;
  lastPatchSucceededRef: RuntimeFormMutableRef<boolean>;
  lastPatchValidationErrorsRef: RuntimeFormMutableRef<ReadonlyArray<FormRuntimeRecordValidationError>>;
  lastRuntimeRequestErrorKindRef: RuntimeFormMutableRef<"auth" | "conflict" | "error" | null>;
  latestLookupLabelsRef: RuntimeFormMutableRef<Record<string, Record<string, string>>>;
  latestValuesRef: RuntimeFormMutableRef<RuntimeFormValues>;
  mode: RuntimeFormMode;
  modelId: string;
  navigate: NavigateFunction;
  parentDocGuid: string;
  patchInFlightRef: RuntimeFormMutableRef<boolean>;
  patchPromiseRef: RuntimeFormMutableRef<Promise<void> | null>;
  pendingLookupLabelsRef: RuntimeFormMutableRef<Record<string, Record<string, string>>>;
  pendingPatchValuesRef: RuntimeFormMutableRef<Record<string, unknown>>;
  restoredParentSession: unknown;
  revealRuntimeField: (fieldId: string | undefined) => void;
  revisionRef: RuntimeFormMutableRef<string>;
  runtimeClient: RuntimeFormRuntimeClient;
  runtimeDefinition: RuntimeFormDefinition;
  runtimeFormResponse: FormRuntimeFormResponse | null;
  runtimeLabels: RuntimeFormLabels & {
    requiredError: string;
    validationFillField: string;
    validationFillFieldCorrectly: string;
  };
  setErrors: Dispatch<SetStateAction<RuntimeFormValidationErrors>>;
  setFinishDialog: Dispatch<SetStateAction<FinishDialogState | null>>;
  setSaveState: Dispatch<SetStateAction<RuntimeFormSaveState>>;
  setValues: Dispatch<SetStateAction<RuntimeFormValues>>;
  signOut: () => void | Promise<void>;
  subformId: string;
  t: RuntimeFormTranslation;
  viewId: string;
};

export function createRuntimeFormMutationController({
  activeTabsRef,
  autosaveTimerRef,
  clientCreateTokenRef,
  createInFlightRef,
  createPromiseRef,
  currentDocGuidRef,
  currentRecordIdRef,
  entryContext,
  getRuntimeAccessToken,
  hasAppliedInitialStatusRef,
  hasServerRecordRef,
  isSubform,
  lastCreateBlockedByValidationRef,
  lastPatchSucceededRef,
  lastPatchValidationErrorsRef,
  lastRuntimeRequestErrorKindRef,
  latestLookupLabelsRef,
  latestValuesRef,
  mode,
  modelId,
  navigate,
  parentDocGuid,
  patchInFlightRef,
  patchPromiseRef,
  pendingLookupLabelsRef,
  pendingPatchValuesRef,
  restoredParentSession,
  revealRuntimeField,
  revisionRef,
  runtimeClient,
  runtimeDefinition,
  runtimeFormResponse,
  runtimeLabels,
  setErrors,
  setFinishDialog,
  setSaveState,
  setValues,
  signOut,
  subformId,
  t,
  viewId,
}: RuntimeFormMutationControllerConfig) {
  function handleRuntimeRequestError(requestError: unknown) {
    if (isUnauthorizedApiError(requestError)) {
      void signOut();
      lastRuntimeRequestErrorKindRef.current = "auth";
      return "auth";
    }
    if (isConflictRuntimeError(requestError)) {
      setFinishDialog({
        message: t("tenant.runtime.forms.form.messages.conflict"),
        tone: "danger",
      });
      setSaveState("error");
      lastRuntimeRequestErrorKindRef.current = "conflict";
      return "conflict";
    }
    if (isRuntimeSchemaDriftError(requestError)) {
      setFinishDialog({
        message: t("tenant.runtime.forms.form.messages.schemaDrift"),
        tone: "danger",
      });
      setSaveState("error");
      lastRuntimeRequestErrorKindRef.current = "error";
      return "error";
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
    if (typeof response.recordId === "string" || typeof response.recordId === "number") {
      currentRecordIdRef.current = response.recordId;
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

  function handleRuntimeServerValidation(
    validationErrors: ReadonlyArray<FormRuntimeRecordValidationError> | undefined,
    options?: { showValidationDialog?: boolean },
  ) {
    const serverErrors = runtimeValidationErrorsFromServer(validationErrors);
    if (hasRuntimeValidationErrors(serverErrors)) {
      setErrors(serverErrors);
    }
    if (!options?.showValidationDialog) {
      return;
    }

    const firstError = findFirstValidationError(runtimeDefinition, serverErrors);
    revealRuntimeField(firstError.fieldId);
    setFinishDialog({
      fieldId: firstError.fieldId,
      message: firstRuntimeValidationMessage(validationErrors) ?? runtimeClientValidationDialogMessage(firstError, runtimeLabels),
      tone: "danger",
    });
  }

  async function flushPendingPatch(options?: { showValidationDialog?: boolean }): Promise<boolean> {
    if (patchInFlightRef.current) {
      await patchPromiseRef.current;
      if (!lastPatchSucceededRef.current) {
        if (options?.showValidationDialog && lastPatchValidationErrorsRef.current.length > 0) {
          handleRuntimeServerValidation(lastPatchValidationErrorsRef.current, options);
        }
        return false;
      }
      if (Object.keys(pendingPatchValuesRef.current).length > 0) {
        return flushPendingPatch(options);
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
    const patchLookupLabels = lookupLabelsForChangedValues(patchValues, pendingLookupLabelsRef.current);
    pendingPatchValuesRef.current = {};
    pendingLookupLabelsRef.current = {};
    patchInFlightRef.current = true;
    lastPatchSucceededRef.current = true;
    lastPatchValidationErrorsRef.current = [];
    lastRuntimeRequestErrorKindRef.current = null;
    setSaveState("saving");
    let didSave = false;

    const patchPromise = (isSubform
      ? runtimeClient.updateSubformRecord(accessToken, parentDocGuid, subformId, docGuid, {
        expectedRevision: revisionRef.current || undefined,
        lookupLabels: hasLookupLabels(patchLookupLabels) ? patchLookupLabels : undefined,
        values: patchValues,
      })
      : runtimeClient.updateRecord(accessToken, docGuid, {
        expectedRevision: revisionRef.current || undefined,
        lookupLabels: hasLookupLabels(patchLookupLabels) ? patchLookupLabels : undefined,
        values: patchValues,
      }))
      .then((response) => {
        if ((response.validationErrors?.length ?? 0) > 0) {
          pendingPatchValuesRef.current = {
            ...patchValues,
            ...pendingPatchValuesRef.current,
          };
          pendingLookupLabelsRef.current = mergeLookupLabelMaps(patchLookupLabels, pendingLookupLabelsRef.current);
          lastPatchValidationErrorsRef.current = response.validationErrors ?? [];
          lastPatchSucceededRef.current = false;
          handleRuntimeServerValidation(response.validationErrors, options);
          setSaveState("dirty");
          return;
        }

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
        pendingLookupLabelsRef.current = mergeLookupLabelMaps(patchLookupLabels, pendingLookupLabelsRef.current);
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
      return flushPendingPatch(options);
    }
    return true;
  }

  function schedulePatch(
    patchValues: Record<string, unknown>,
    lookupLabels?: Record<string, Record<string, string>>,
  ) {
    pendingLookupLabelsRef.current = mergeLookupLabelMaps(
      pendingLookupLabelsRef.current,
      lookupLabels ?? {},
    );

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
    options?: { replaceRouteAfterCreate?: boolean; showValidationDialog?: boolean },
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
      if (options?.showValidationDialog) {
        const firstError = findFirstValidationError(runtimeDefinition, nextErrors);
        setErrors(nextErrors);
        revealRuntimeField(firstError.fieldId);
        setFinishDialog({
          fieldId: firstError.fieldId,
          message: runtimeClientValidationDialogMessage(firstError, runtimeLabels),
          tone: "danger",
        });
      } else {
        const inputErrors = inputValidationErrorsOnly(nextErrors, runtimeLabels.requiredError);
        if (hasRuntimeValidationErrors(inputErrors)) {
          setErrors((currentErrors) => ({
            ...currentErrors,
            ...inputErrors,
          }));
        }
      }
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

    const mutationInput = {
      clientCreateToken: clientCreateTokenRef.current,
      lookupLabels: hasLookupLabels(latestLookupLabelsRef.current)
        ? cloneLookupLabels(latestLookupLabelsRef.current)
        : undefined,
      values: serializeRuntimeFormValues(createValues),
    };
    const createPromise = (isSubform
      ? runtimeClient.createSubformRecord(accessToken, parentDocGuid, subformId, mutationInput)
      : runtimeClient.createRecord(accessToken, mutationInput))
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
              message: firstRuntimeValidationMessage(response.validationErrors) ?? runtimeClientValidationDialogMessage(firstError, runtimeLabels),
              tone: "danger",
            });
          }
          setSaveState("dirty");
          return null;
        }

        applyMutationResponse(response);
        setSaveState("saved");

        if (response.docGuid && options?.replaceRouteAfterCreate !== false) {
          const nextEditPath = isSubform
            ? formRuntimePaths.subformEdit(modelId, viewId, parentDocGuid, subformId, response.docGuid, entryContext)
            : formRuntimePaths.edit(modelId, viewId, response.docGuid, entryContext);
          const restoredValues = {
            ...serializeRuntimeFormValues(latestValuesRef.current),
            ...response.values,
          };
          navigate(nextEditPath, {
            replace: true,
            state: {
              parentRuntimeFormSession: isSubform ? restoredParentSession ?? undefined : undefined,
              runtimeFormSession: {
                activeTabs: activeTabsRef.current,
                docGuid: response.docGuid,
                formResponse: runtimeFormResponse
                  ? {
                    ...runtimeFormResponse,
                    docGuid: response.docGuid,
                    recordId: response.recordId ?? currentRecordIdRef.current,
                    revision: response.revision,
                    values: restoredValues,
                  }
                  : undefined,
                recordId: response.recordId ?? currentRecordIdRef.current,
                revision: response.revision,
                values: restoredValues,
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

  return {
    applyInitialStatusIfNeeded,
    applyMutationResponse,
    createRecordIfReady,
    flushPendingPatch,
    handleRuntimeRequestError,
    schedulePatch,
  };
}
