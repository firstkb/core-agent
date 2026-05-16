import type { Dispatch, SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";

import {
  type RuntimeFormChecklistItem,
  type RuntimeFormChecklistItemChange,
  type RuntimeFormSaveState,
  type RuntimeFormSubformDataById,
  type RuntimeFormSubformDefinition,
  type RuntimeFormSubformRow,
  type RuntimeFormValues,
} from "@platform/forms";

import type {
  FinishDialogState,
  SubformDeleteDialogState,
} from "./components/form-runtime-dialogs";
import type { createFormRuntimeCollectionTableClient } from "./form-runtime-collection-table-client";
import {
  formRuntimePaths,
  type FormRuntimeRouteContext,
} from "./form-runtime-route-meta";
import type { RuntimeFormSessionState } from "./form-runtime-navigation-state";
import {
  mergeRuntimeChecklistItemState,
  mergeRuntimeSubformData,
  runtimeSubformsFromRecord,
} from "./form-runtime-subform-helpers";
import { coerceLooseRuntimeValues } from "./form-runtime-value-helpers";

type RuntimeFormMutableRef<T> = {
  current: T;
};

type RuntimeFormRuntimeClient = ReturnType<typeof createFormRuntimeCollectionTableClient>;
type RuntimeFormTranslation = (key: string) => string;
type RuntimeFormRequestErrorKind = "auth" | "conflict" | "error";

type RuntimeFormSubformControllerConfig = {
  autosaveTimerRef: RuntimeFormMutableRef<ReturnType<typeof setTimeout> | null>;
  createRecordIfReady: (
    nextValues: RuntimeFormValues,
    options?: {
      replaceRouteAfterCreate?: boolean;
      showValidationDialog?: boolean;
    },
  ) => Promise<string | null>;
  currentDocGuidRef: RuntimeFormMutableRef<string>;
  currentRuntimeFormSession: (docGuid?: string) => RuntimeFormSessionState;
  entryContext: FormRuntimeRouteContext;
  flushPendingPatch: (options?: { showValidationDialog?: boolean }) => Promise<boolean>;
  getRuntimeAccessToken: () => string | null;
  handleRuntimeRequestError: (requestError: unknown) => RuntimeFormRequestErrorKind;
  hasServerRecordRef: RuntimeFormMutableRef<boolean>;
  isSubform: boolean;
  lastCreateBlockedByValidationRef: RuntimeFormMutableRef<boolean>;
  lastPatchValidationErrorsRef: RuntimeFormMutableRef<ReadonlyArray<unknown>>;
  lastRuntimeRequestErrorKindRef: RuntimeFormMutableRef<RuntimeFormRequestErrorKind | null>;
  latestValuesRef: RuntimeFormMutableRef<RuntimeFormValues>;
  modelId: string;
  navigate: NavigateFunction;
  runtimeClient: RuntimeFormRuntimeClient;
  setFinishDialog: Dispatch<SetStateAction<FinishDialogState | null>>;
  setSaveState: Dispatch<SetStateAction<RuntimeFormSaveState>>;
  setSubformDeleteDialog: Dispatch<SetStateAction<SubformDeleteDialogState | null>>;
  setSubforms: Dispatch<SetStateAction<RuntimeFormSubformDataById>>;
  subformDeleteDialog: SubformDeleteDialogState | null;
  t: RuntimeFormTranslation;
  viewId: string;
};

export function createRuntimeFormSubformController({
  autosaveTimerRef,
  createRecordIfReady,
  currentDocGuidRef,
  currentRuntimeFormSession,
  entryContext,
  flushPendingPatch,
  getRuntimeAccessToken,
  handleRuntimeRequestError,
  hasServerRecordRef,
  isSubform,
  lastCreateBlockedByValidationRef,
  lastPatchValidationErrorsRef,
  lastRuntimeRequestErrorKindRef,
  latestValuesRef,
  modelId,
  navigate,
  runtimeClient,
  setFinishDialog,
  setSaveState,
  setSubformDeleteDialog,
  setSubforms,
  subformDeleteDialog,
  t,
  viewId,
}: RuntimeFormSubformControllerConfig) {
  async function reloadSubforms(parentGuid = currentDocGuidRef.current) {
    if (isSubform || !parentGuid) {
      return;
    }
    const accessToken = getRuntimeAccessToken();
    if (!accessToken) {
      return;
    }
    const record = await runtimeClient.loadRecord(accessToken, parentGuid);
    setSubforms((currentSubforms) => mergeRuntimeSubformData(currentSubforms, runtimeSubformsFromRecord(record)));
  }

  async function ensureRecordReadyForSubformAction() {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    let docGuid = currentDocGuidRef.current;
    if (!hasServerRecordRef.current) {
      docGuid = await createRecordIfReady(latestValuesRef.current, {
        replaceRouteAfterCreate: false,
        showValidationDialog: true,
      }) ?? "";
      if (!docGuid) {
        if (!lastCreateBlockedByValidationRef.current) {
          setFinishDialog({
            message: t("tenant.runtime.forms.form.messages.saveFailed"),
            tone: "danger",
          });
        }
        return null;
      }
    }

    const didFlushPatch = await flushPendingPatch({ showValidationDialog: true });
    if (!didFlushPatch) {
      if (lastRuntimeRequestErrorKindRef.current === "conflict" || lastRuntimeRequestErrorKindRef.current === "auth") {
        return null;
      }
      if (lastPatchValidationErrorsRef.current.length > 0) {
        return null;
      }
      setFinishDialog({
        message: t("tenant.runtime.forms.form.messages.saveFailed"),
        tone: "danger",
      });
      return null;
    }

    return docGuid;
  }

  function handleSubformAdd(subform: RuntimeFormSubformDefinition) {
    void (async () => {
      const parentGuid = await ensureRecordReadyForSubformAction();
      if (!parentGuid) {
        return;
      }

      navigate(formRuntimePaths.subformCreate(modelId, viewId, parentGuid, subform.schemaScopeId, entryContext), {
        state: {
          parentRuntimeFormSession: currentRuntimeFormSession(parentGuid),
        },
      });
    })();
  }

  function handleSubformEdit(subform: RuntimeFormSubformDefinition, row: RuntimeFormSubformRow) {
    void (async () => {
      const parentGuid = await ensureRecordReadyForSubformAction();
      if (!parentGuid || !row.id) {
        return;
      }

      navigate(formRuntimePaths.subformEdit(modelId, viewId, parentGuid, subform.schemaScopeId, row.id, entryContext), {
        state: {
          parentRuntimeFormSession: currentRuntimeFormSession(parentGuid),
        },
      });
    })();
  }

  function handleSubformDelete(subform: RuntimeFormSubformDefinition, row: RuntimeFormSubformRow) {
    setSubformDeleteDialog({ row, subform });
  }

  function confirmSubformDelete() {
    const deleteIntent = subformDeleteDialog;
    setSubformDeleteDialog(null);
    if (!deleteIntent) {
      return;
    }

    void (async () => {
      const parentGuid = await ensureRecordReadyForSubformAction();
      if (!parentGuid || !deleteIntent.row.id) {
        return;
      }

      const accessToken = getRuntimeAccessToken();
      if (!accessToken) {
        return;
      }

      setSaveState("saving");
      try {
        await runtimeClient.deleteSubformRecord(
          accessToken,
          parentGuid,
          deleteIntent.subform.schemaScopeId,
          deleteIntent.row.id,
        );
        await reloadSubforms(parentGuid);
        setSaveState("saved");
      } catch (requestError) {
        const errorKind = handleRuntimeRequestError(requestError);
        if (errorKind !== "conflict" && errorKind !== "auth") {
          setFinishDialog({
            message: t("tenant.runtime.forms.form.messages.deleteFailed"),
            tone: "danger",
          });
        }
      }
    })();
  }

  function mergeChecklistItemState(
    subformId: string,
    sourceValue: string,
    change: RuntimeFormChecklistItemChange,
    savedRowDocGuid?: string,
  ) {
    setSubforms((currentSubforms) =>
      mergeRuntimeChecklistItemState(currentSubforms, subformId, sourceValue, change, savedRowDocGuid),
    );
  }

  function handleChecklistItemChange(
    subform: RuntimeFormSubformDefinition,
    item: RuntimeFormChecklistItem,
    change: RuntimeFormChecklistItemChange,
  ) {
    void (async () => {
      const parentGuid = await ensureRecordReadyForSubformAction();
      const sourceRef = item.sourceGuid || item.sourceValue;
      if (!parentGuid || !sourceRef) {
        return;
      }

      const nextChange = {
        notes: change.notes ?? item.notes ?? "",
        value: change.value ?? item.value ?? "",
        values: {
          ...(item.values ?? {}),
          ...(change.values ?? {}),
        },
      };
      mergeChecklistItemState(subform.schemaScopeId, item.sourceValue, nextChange);

      const accessToken = getRuntimeAccessToken();
      if (!accessToken) {
        return;
      }

      setSaveState("saving");
      try {
        const response = await runtimeClient.updateChecklistItem(
          accessToken,
          parentGuid,
          subform.schemaScopeId,
          sourceRef,
          nextChange,
        );
        mergeChecklistItemState(
          response.subformId || subform.schemaScopeId,
          response.item.sourceValue || item.sourceValue,
          {
            notes: response.item.notes ?? nextChange.notes,
            value: response.item.value ?? nextChange.value,
            values: coerceLooseRuntimeValues(response.item.values) ?? nextChange.values,
          },
          response.item.savedRowDocGuid,
        );
        setSaveState("saved");
      } catch (requestError) {
        const errorKind = handleRuntimeRequestError(requestError);
        if (errorKind !== "conflict" && errorKind !== "auth") {
          setFinishDialog({
            message: t("tenant.runtime.forms.form.messages.saveFailed"),
            tone: "danger",
          });
        }
      }
    })();
  }

  return {
    confirmSubformDelete,
    handleChecklistItemChange,
    handleSubformAdd,
    handleSubformDelete,
    handleSubformEdit,
    reloadSubforms,
  };
}
