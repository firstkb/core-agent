import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  createTenantDictionaryClient,
  isUnauthorizedApiError,
} from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import {
  createRuntimeFormDefinitionFromSchema,
  findFirstRuntimeChecklistRequiredError,
  RuntimeFormScaffold,
  validateRuntimeForm,
  type RuntimeFormActiveTabs,
  type RuntimeFormCommitMode,
  type RuntimeFormFieldChangeMeta,
  type RuntimeFormGeoPoint,
  type RuntimeFormLookupOptionsRequest,
  type RuntimeFormLookupOptionsResponse,
  type RuntimeFormMode,
  type RuntimeFormSaveState,
  type RuntimeFormChecklistRevealRequest,
  type RuntimeFormSubformDataById,
  type RuntimeFormValidationErrors,
  type RuntimeFormValue,
  type RuntimeFormValues,
} from "@platform/forms";
import { useTranslation } from "@platform/i18n";
import { CloseIcon, UsersIcon } from "@platform/ui-kit";
import {
  useLocation,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useTenantRuntimeConfig } from "../../../app/tenant-runtime-config-context";
import {
  RuntimeFormDialogs,
  type FinishDialogState,
  type SubformDeleteDialogState,
  type UnsavedLeaveDialogState,
} from "../components/form-runtime-dialogs";
import {
  FormRuntimeLoadError,
  type RuntimeFormLoadErrorState,
} from "../components/form-runtime-load-error";
import {
  createFormRuntimeCollectionTableClient,
  type FormRuntimeEditPresenceEditor,
  type FormRuntimeFormResponse,
  type FormRuntimeRecordValidationError,
} from "../form-runtime-collection-table-client";
import {
  createClientCreateToken,
  getRuntimeControlId,
  getRuntimeOptionControl,
  resolveRuntimeGeoPoint,
} from "../form-runtime-browser-helpers";
import {
  collectRuntimeControlValueChanges,
} from "../form-runtime-dom-sync";
import {
  runtimeFormLoadErrorFromRequest,
} from "../form-runtime-error-helpers";
import {
  buildRuntimeLookupDictionaryRequest,
  lookupOutputValueKey,
  mergeLookupLabelMaps,
  mergeLookupLabels,
  selectedLookupRuntimeValues,
} from "../form-runtime-lookup-helpers";
import { createRuntimeFormMutationController } from "../form-runtime-mutation-controller";
import {
  isRuntimeNavigationState,
  type RuntimeFormSessionState,
} from "../form-runtime-navigation-state";
import {
  formRuntimePaths,
  type FormRuntimeRouteContext,
} from "../form-runtime-route-meta";
import { createRuntimeFormSubformController } from "../form-runtime-subform-controller";
import {
  mergeRuntimeSubformData,
  runtimeSubformsFromFormResponse,
  runtimeSubformsFromRecord,
} from "../form-runtime-subform-helpers";
import {
  coerceRuntimeFormValues,
  hasUserEnteredCreateValues,
  mergeServerValues,
  serializeRuntimeFormValues,
} from "../form-runtime-value-helpers";
import {
  findFirstValidationError,
  hasRuntimeValidationErrors,
  runtimeClientValidationDialogMessage,
} from "../form-runtime-validation-helpers";
import { useRuntimeFormLabels } from "../use-runtime-form-labels";
import "./form-runtime.css";

type RuntimeFormFieldRevealRequest = {
  fieldId: string;
  requestKey: number;
};

type RuntimeFormNodeRevealRequest = {
  nodeId: string;
  requestKey: number;
};

type RuntimeFormEditPresenceState = {
  editors: ReadonlyArray<FormRuntimeEditPresenceEditor>;
  recordChanged: boolean;
  recordRevision?: string;
};

function editPresenceEditorName(editor: FormRuntimeEditPresenceEditor) {
  return (editor.displayName || editor.email || editor.userId || "").trim();
}

function editPresenceSummary(
  editors: ReadonlyArray<FormRuntimeEditPresenceEditor>,
  t: (key: string, values?: Record<string, unknown>) => string,
) {
  if (editors.length > 0 && editors.every((editor) => editor.sameUser)) {
    return t("tenant.runtime.forms.form.presence.titleSameUser");
  }
  const names = Array.from(new Set(editors.map(editPresenceEditorName).filter(Boolean)));
  if (names.length === 0) {
    return t("tenant.runtime.forms.form.presence.titleUnknown");
  }
  if (names.length === 1) {
    return t("tenant.runtime.forms.form.presence.titleOne", { name: names[0] });
  }
  return t("tenant.runtime.forms.form.presence.titleMany", {
    names: names.slice(0, 3).join(", "),
  });
}

function editPresenceDismissKey(state: RuntimeFormEditPresenceState) {
  if (state.editors.length === 0 && !state.recordChanged) {
    return "";
  }
  const editorsKey = state.editors
    .map((editor) => [
      editor.userId ?? "",
      editor.clientId ?? "",
      editor.scope ?? "",
      editor.targetLabel ?? "",
    ].join(":"))
    .sort()
    .join("|");
  return [
    state.recordChanged ? "changed" : "current",
    state.recordRevision ?? "",
    editorsKey,
  ].join("::");
}

export function FormsRuntimeFormPage({
  entryContext = "runtime",
  mode,
  scope = "root",
}: {
  entryContext?: FormRuntimeRouteContext;
  mode: RuntimeFormMode;
  scope?: "root" | "subform";
}) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const runtimeConfig = useTenantRuntimeConfig();
  const { getAccessToken, signOut } = useAuth();
  const modelId = params.modelId?.trim() ?? "";
  const viewId = params.viewId?.trim() ?? "";
  const routeDocGuid = params.docGuid?.trim() ?? "";
  const parentDocGuid = params.parentDocGuid?.trim() ?? "";
  const subformId = params.subformId?.trim() ?? "";
  const isSubform = scope === "subform";
  const commitMode: RuntimeFormCommitMode = searchParams.get("source") === "static" || searchParams.get("commit") === "finish"
    ? "finish"
    : "autosave";
  const restoredSession = useMemo(() => {
    if (!isRuntimeNavigationState(location.state)) {
      return null;
    }
    return location.state.runtimeFormSession ?? null;
  }, [location.state]);
  const restoredParentSession = useMemo(() => {
    if (!isRuntimeNavigationState(location.state)) {
      return null;
    }
    return location.state.parentRuntimeFormSession ?? null;
  }, [location.state]);
  const client = useMemo(
    () => modelId && viewId
      ? createFormRuntimeCollectionTableClient({
        baseUrl: runtimeConfig.tenantApiUrl,
        modelId,
        routeContext: entryContext,
        viewId,
      })
      : null,
    [entryContext, modelId, runtimeConfig.tenantApiUrl, viewId],
  );
  const dictionaryClient = useMemo(
    () => createTenantDictionaryClient(runtimeConfig.tenantApiUrl),
    [runtimeConfig.tenantApiUrl],
  );
  const [formLoadError, setFormLoadError] = useState<RuntimeFormLoadErrorState | null>(null);
  const [formResponse, setFormResponse] = useState<FormRuntimeFormResponse | null>(() => restoredSession?.formResponse ?? null);
  const [formValuesReady, setFormValuesReady] = useState(false);
  const [editPresence, setEditPresence] = useState<RuntimeFormEditPresenceState>({
    editors: [],
    recordChanged: false,
  });
  const [dismissedEditPresenceKey, setDismissedEditPresenceKey] = useState("");
  const [values, setValues] = useState<RuntimeFormValues>({});
  const [errors, setErrors] = useState<RuntimeFormValidationErrors>({});
  const [activeTabs, setActiveTabs] = useState<RuntimeFormActiveTabs>(() => restoredSession?.activeTabs ?? {});
  const [checklistRevealRequest, setChecklistRevealRequest] = useState<RuntimeFormChecklistRevealRequest | null>(null);
  const [fieldRevealRequest, setFieldRevealRequest] = useState<RuntimeFormFieldRevealRequest | null>(null);
  const [finishDialog, setFinishDialog] = useState<FinishDialogState | null>(null);
  const [saveState, setSaveState] = useState<RuntimeFormSaveState>("saving");
  const [subformDeleteDialog, setSubformDeleteDialog] = useState<SubformDeleteDialogState | null>(null);
  const [nodeRevealRequest, setNodeRevealRequest] = useState<RuntimeFormNodeRevealRequest | null>(null);
  const [subforms, setSubforms] = useState<RuntimeFormSubformDataById>({});
  const [unsavedLeaveDialog, setUnsavedLeaveDialog] = useState<UnsavedLeaveDialogState | null>(null);
  const { loadErrorLabels, runtimeLabels } = useRuntimeFormLabels(isSubform);
  const definition = useMemo(() => {
    if (!formResponse) {
      return null;
    }
    return createRuntimeFormDefinitionFromSchema({
      commitMode,
      dataSchema: formResponse.dataSchema,
      description: formResponse.description,
      labels: runtimeLabels,
      mode,
      modelId,
      title: formResponse.title,
      uiSchema: formResponse.uiSchema,
      viewId,
    });
  }, [commitMode, formResponse, mode, modelId, runtimeLabels, viewId]);
  const initialValues = useMemo<RuntimeFormValues>(() => {
    if (!definition || !formResponse) {
      return {};
    }
    return coerceRuntimeFormValues(definition, formResponse.values);
  }, [definition, formResponse]);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientCreateTokenRef = useRef(createClientCreateToken());
  const editPresenceClientIdRef = useRef(createClientCreateToken());
  const createInFlightRef = useRef(false);
  const lastCreateBlockedByValidationRef = useRef(false);
  const lastRuntimeRequestErrorKindRef = useRef<"auth" | "conflict" | "error" | null>(null);
  const fieldRevealRequestKeyRef = useRef(0);
  const nodeRevealRequestKeyRef = useRef(0);
  const createPromiseRef = useRef<Promise<string | null> | null>(null);
  const hasAppliedInitialStatusRef = useRef(false);
  const hasServerRecordRef = useRef(mode === "edit" && routeDocGuid.length > 0);
  const lastPatchSucceededRef = useRef(true);
  const lastPatchValidationErrorsRef = useRef<ReadonlyArray<FormRuntimeRecordValidationError>>([]);
  const latestValuesRef = useRef<RuntimeFormValues>({});
  const latestLookupLabelsRef = useRef<Record<string, Record<string, string>>>({});
  const geoPointResolutionPromiseRef = useRef<Promise<RuntimeFormGeoPoint | null> | null>(null);
  const patchInFlightRef = useRef(false);
  const patchPromiseRef = useRef<Promise<void> | null>(null);
  const pendingLookupLabelsRef = useRef<Record<string, Record<string, string>>>({});
  const pendingPatchValuesRef = useRef<Record<string, unknown>>({});
  const revisionRef = useRef(restoredSession?.revision ?? "");
  const runtimeControlSyncTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const runtimeFormContainerRef = useRef<HTMLDivElement | null>(null);
  const currentDocGuidRef = useRef(routeDocGuid || restoredSession?.docGuid || "");
  const currentRecordIdRef = useRef<number | string | undefined>(restoredSession?.recordId ?? restoredSession?.formResponse?.recordId);
  const activeTabsRef = useRef<RuntimeFormActiveTabs>(restoredSession?.activeTabs ?? {});
  const routeIsInvalid = !modelId
    || !viewId
    || (mode === "edit" && !routeDocGuid)
    || (isSubform && (!parentDocGuid || !subformId));

  const getRuntimeAccessToken = useCallback(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      void signOut();
      return null;
    }
    return accessToken;
  }, [getAccessToken, signOut]);

  const loadRuntimeLookupOptions = useCallback(async (
    request: RuntimeFormLookupOptionsRequest,
  ): Promise<RuntimeFormLookupOptionsResponse> => {
    const dictionaryRequest = buildRuntimeLookupDictionaryRequest(request);
    if (!dictionaryRequest) {
      return { hasMore: false, options: [] };
    }

    const accessToken = getRuntimeAccessToken();
    if (!accessToken) {
      return { hasMore: false, options: [] };
    }

    const response = await dictionaryClient.loadOptions(accessToken, dictionaryRequest);
    return {
      hasMore: response.hasMore,
      options: response.items.map((item) => ({
        description: item.description,
        fields: item.fields,
        label: item.label,
        value: request.lookup.valueMode === "text" ? item.label : item.value,
      })),
    };
  }, [dictionaryClient, getRuntimeAccessToken]);

  const loadRuntimeGeoPoint = useCallback(() => {
    if (!geoPointResolutionPromiseRef.current) {
      geoPointResolutionPromiseRef.current = resolveRuntimeGeoPoint();
    }
    return geoPointResolutionPromiseRef.current;
  }, []);

  useEffect(() => {
    const restoredActiveTabs = restoredSession?.activeTabs ?? {};
    activeTabsRef.current = restoredActiveTabs;
    setActiveTabs(restoredActiveTabs);
  }, [isSubform, mode, modelId, parentDocGuid, restoredSession, routeDocGuid, subformId, viewId]);

  useEffect(() => {
    if (!client || routeIsInvalid) {
      return;
    }

    const accessToken = getRuntimeAccessToken();
    if (!accessToken) {
      return;
    }

    let isCancelled = false;
    setSaveState("saving");
    setFormLoadError(null);
    setFormValuesReady(false);
    if (!restoredSession?.formResponse) {
      setFormResponse(null);
    }
    const loadFormPromise = isSubform
      ? client.loadSubform(accessToken, parentDocGuid, subformId, mode === "edit" ? routeDocGuid : undefined)
      : client.loadForm(accessToken, mode === "edit" ? routeDocGuid : undefined);

    void loadFormPromise
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
        setFormLoadError(runtimeFormLoadErrorFromRequest(requestError, loadErrorLabels));
        setSaveState("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [
    client,
    getRuntimeAccessToken,
    isSubform,
    loadErrorLabels,
    mode,
    parentDocGuid,
    restoredSession,
    routeDocGuid,
    routeIsInvalid,
    signOut,
    subformId,
  ]);

  useLayoutEffect(() => {
    if (!definition || !formResponse) {
      return;
    }
    const restoredValues = restoredSession?.values
      ? coerceRuntimeFormValues(definition, restoredSession.values)
      : {};
    const nextValues = mergeServerValues(initialValues, restoredValues, true);

    setValues(nextValues);
    setErrors({});
    setChecklistRevealRequest(null);
    setFieldRevealRequest(null);
    setNodeRevealRequest(null);
    setFinishDialog(null);
    setSubformDeleteDialog(null);
    setUnsavedLeaveDialog(null);
    setSaveState("idle");
    setEditPresence({ editors: [], recordChanged: false });
    setDismissedEditPresenceKey("");
    setSubforms(isSubform ? {} : runtimeSubformsFromFormResponse(formResponse));
    latestValuesRef.current = nextValues;
    revisionRef.current = restoredSession?.revision ?? formResponse.revision ?? "";
    currentDocGuidRef.current = routeDocGuid || restoredSession?.docGuid || formResponse.docGuid || "";
    currentRecordIdRef.current = restoredSession?.recordId ?? restoredSession?.formResponse?.recordId ?? formResponse.recordId;
    hasServerRecordRef.current = Boolean(currentDocGuidRef.current);
    hasAppliedInitialStatusRef.current = Boolean(nextValues[definition.workflowStatus?.fieldId ?? ""]);
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    runtimeControlSyncTimersRef.current.forEach((timer) => clearTimeout(timer));
    runtimeControlSyncTimersRef.current = [];
    latestLookupLabelsRef.current = {};
    pendingLookupLabelsRef.current = {};
    pendingPatchValuesRef.current = {};
    lastPatchSucceededRef.current = true;
    lastPatchValidationErrorsRef.current = [];
    lastRuntimeRequestErrorKindRef.current = null;
    clientCreateTokenRef.current = createClientCreateToken();
    geoPointResolutionPromiseRef.current = null;
    setFormValuesReady(true);
  }, [definition, formResponse, initialValues, isSubform, parentDocGuid, restoredSession, routeDocGuid, subformId]);

  useEffect(() => {
    latestValuesRef.current = values;
  }, [values]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      runtimeControlSyncTimersRef.current.forEach((timer) => clearTimeout(timer));
      runtimeControlSyncTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (isSubform || !client || !definition) {
      setSubforms({});
      return;
    }
    if (!hasServerRecordRef.current || !currentDocGuidRef.current) {
      return;
    }

    const accessToken = getRuntimeAccessToken();
    if (!accessToken) {
      return;
    }

    let isCancelled = false;
    void client.loadRecord(accessToken, currentDocGuidRef.current)
      .then((record) => {
        if (!isCancelled) {
          setSubforms((currentSubforms) => mergeRuntimeSubformData(currentSubforms, runtimeSubformsFromRecord(record)));
        }
      })
      .catch((requestError: unknown) => {
        if (isCancelled) {
          return;
        }
        if (isUnauthorizedApiError(requestError)) {
          void signOut();
          return;
        }
        setSubforms((currentSubforms) => mergeRuntimeSubformData(currentSubforms, {}));
      });

    return () => {
      isCancelled = true;
    };
  }, [client, definition, formResponse?.docGuid, getRuntimeAccessToken, isSubform, routeDocGuid, signOut]);

  useEffect(() => {
    if (!client || !definition || !formValuesReady) {
      setEditPresence({ editors: [], recordChanged: false });
      return;
    }
    if (!isSubform && (!hasServerRecordRef.current || !currentDocGuidRef.current)) {
      setEditPresence({ editors: [], recordChanged: false });
      return;
    }
    if (isSubform && (!parentDocGuid || !subformId)) {
      setEditPresence({ editors: [], recordChanged: false });
      return;
    }

    let isCancelled = false;
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextHeartbeat = (delaySeconds: number) => {
      if (isCancelled) {
        return;
      }
      heartbeatTimer = globalThis.setTimeout(() => {
        void sendHeartbeat();
      }, Math.max(10, delaySeconds) * 1000);
    };

    const sendHeartbeat = async () => {
      const accessToken = getRuntimeAccessToken();
      if (!accessToken) {
        return;
      }
      try {
        const request = {
          clientId: editPresenceClientIdRef.current,
          knownRevision: revisionRef.current || undefined,
        };
        const response = isSubform
          ? await client.heartbeatSubformEditPresence(
            accessToken,
            parentDocGuid,
            subformId,
            currentDocGuidRef.current || undefined,
            request,
          )
          : await client.heartbeatEditPresence(accessToken, currentDocGuidRef.current, request);
        if (isCancelled) {
          return;
        }
        setEditPresence({
          editors: response.editors,
          recordChanged: Boolean(response.record?.changed),
          recordRevision: response.record?.currentRevision,
        });
        scheduleNextHeartbeat(response.heartbeatIntervalSeconds || 25);
      } catch (requestError: unknown) {
        if (isCancelled) {
          return;
        }
        if (isUnauthorizedApiError(requestError)) {
          void signOut();
          return;
        }
        setEditPresence({ editors: [], recordChanged: false });
        scheduleNextHeartbeat(25);
      }
    };

    void sendHeartbeat();

    return () => {
      isCancelled = true;
      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
      }
    };
  }, [
    client,
    definition,
    formResponse?.docGuid,
    formValuesReady,
    getRuntimeAccessToken,
    isSubform,
    parentDocGuid,
    routeDocGuid,
    saveState,
    signOut,
    subformId,
  ]);

  useEffect(() => {
    if (editPresence.editors.length === 0 && !editPresence.recordChanged) {
      setDismissedEditPresenceKey("");
    }
  }, [editPresence.editors.length, editPresence.recordChanged]);

  if (!client || routeIsInvalid) {
    return <Navigate replace to="/dashboard" />;
  }
  if (formLoadError) {
    return (
      <FormRuntimeLoadError
        backLabel={runtimeLabels.backToList}
        code={formLoadError.code}
        description={formLoadError.description}
        onBack={() => navigate(formRuntimePaths.list(modelId, viewId, entryContext))}
        title={formLoadError.title}
      />
    );
  }
  if (!definition) {
    return (
      <div className="tenant-web__form-runtime-form-page">
        <div className="tenant-web__form-runtime-form-state">
          {t("tenant.runtime.forms.form.loading")}
        </div>
      </div>
    );
  }
  const runtimeClient = client;
  const runtimeDefinition = definition;
  const runtimeFormResponse = formResponse;
  const editPresenceKey = editPresenceDismissKey(editPresence);
  const shouldShowEditPresence = Boolean(editPresenceKey) && editPresenceKey !== dismissedEditPresenceKey;
  const editPresenceTitle = editPresenceSummary(editPresence.editors, t);
  const parentFormPath = isSubform
    ? formRuntimePaths.edit(modelId, viewId, parentDocGuid, entryContext)
    : formRuntimePaths.list(modelId, viewId, entryContext);
  const {
    applyInitialStatusIfNeeded,
    applyMutationResponse,
    createRecordIfReady,
    flushPendingPatch,
    handleRuntimeRequestError,
    schedulePatch,
  } = createRuntimeFormMutationController({
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
  });

  function currentRuntimeFormSession(docGuid = currentDocGuidRef.current): RuntimeFormSessionState {
    const serializedValues = serializeRuntimeFormValues(latestValuesRef.current);
    return {
      activeTabs: activeTabsRef.current,
      docGuid,
      formResponse: runtimeFormResponse
        ? {
          ...runtimeFormResponse,
          docGuid,
          recordId: currentRecordIdRef.current,
          revision: revisionRef.current || runtimeFormResponse.revision,
          values: serializedValues,
        }
        : undefined,
      recordId: currentRecordIdRef.current,
      revision: revisionRef.current || undefined,
      values: serializedValues,
    };
  }

  const {
    confirmSubformDelete,
    handleChecklistItemChange,
    handleSubformAdd,
    handleSubformDelete,
    handleSubformEdit,
  } = createRuntimeFormSubformController({
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
  });

  function navigateBackToParentForm(replace = false) {
    if (!isSubform) {
      navigate(parentFormPath, { replace });
      return;
    }

    navigate(parentFormPath, {
      replace,
      state: {
        runtimeFormSession: restoredParentSession ?? undefined,
      },
    });
  }

  function handleActiveTabChange(layoutId: string, tabId: string) {
    if (activeTabsRef.current[layoutId] === tabId) {
      return;
    }

    const nextActiveTabs = {
      ...activeTabsRef.current,
      [layoutId]: tabId,
    };
    activeTabsRef.current = nextActiveTabs;
    setActiveTabs(nextActiveTabs);
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

  function revealRuntimeChecklistItem(error: {
    groupId?: string;
    nodeId: string;
    sourceValue: string;
    subformId: string;
  }) {
    nodeRevealRequestKeyRef.current += 1;
    const requestKey = nodeRevealRequestKeyRef.current;
    setNodeRevealRequest({
      nodeId: error.nodeId,
      requestKey,
    });
    setChecklistRevealRequest({
      groupId: error.groupId,
      requestKey,
      sourceValue: error.sourceValue,
      subformId: error.subformId,
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

  function commitRuntimeValueChanges(
    changedValues: Record<string, RuntimeFormValue>,
    metaByField?: Record<string, RuntimeFormFieldChangeMeta | undefined>,
  ) {
    if (Object.keys(changedValues).length === 0) {
      return;
    }
    const nextChangedValues: Record<string, RuntimeFormValue> = { ...changedValues };
    const changedLookupLabels: Record<string, Record<string, string>> = {};
    Object.keys(changedValues).forEach((fieldId) => {
      const meta = metaByField?.[fieldId];
      const labels = meta?.lookupLabels;
      const selectedValues = selectedLookupRuntimeValues(changedValues[fieldId]);
      if (meta && selectedValues.length === 0) {
        delete latestLookupLabelsRef.current[fieldId];
        delete pendingLookupLabelsRef.current[fieldId];
      } else {
        mergeLookupLabels(changedLookupLabels, fieldId, labels);
        mergeLookupLabels(latestLookupLabelsRef.current, fieldId, labels);
      }

      const outputPrefix = `${fieldId}::lookup_output::`;
      Object.keys(latestValuesRef.current).forEach((valueKey) => {
        if (valueKey.startsWith(outputPrefix)) {
          nextChangedValues[valueKey] = "";
        }
      });

      const selectedFields = selectedValues
        .flatMap((selectedValue) => Object.entries(meta?.lookupOptionFields?.[selectedValue] ?? {}));
      selectedFields.forEach(([outputKey, outputValue]) => {
        if (outputKey && outputValue) {
          nextChangedValues[lookupOutputValueKey(fieldId, outputKey)] = outputValue;
        }
      });
    });

    let nextValues: RuntimeFormValues = {
      ...latestValuesRef.current,
      ...nextChangedValues,
    };
    nextValues = applyInitialStatusIfNeeded(nextValues);
    latestValuesRef.current = nextValues;
    setValues(nextValues);
    setErrors((currentErrors) => {
      if (!Object.keys(nextChangedValues).some((fieldId) => currentErrors[fieldId])) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      Object.keys(nextChangedValues).forEach((fieldId) => {
        delete nextErrors[fieldId];
      });
      return nextErrors;
    });
    if (mode === "create" && !hasServerRecordRef.current) {
      if (createInFlightRef.current) {
        pendingPatchValuesRef.current = {
          ...pendingPatchValuesRef.current,
          ...nextChangedValues,
        };
        pendingLookupLabelsRef.current = mergeLookupLabelMaps(
          pendingLookupLabelsRef.current,
          changedLookupLabels,
        );
        return;
      }
      void createRecordIfReady(nextValues);
      return;
    }

    schedulePatch(nextChangedValues, changedLookupLabels);
  }

  function handleFieldChange(
    fieldId: string,
    value: RuntimeFormValue,
    _field: unknown,
    meta?: RuntimeFormFieldChangeMeta,
  ) {
    commitRuntimeValueChanges({ [fieldId]: value }, { [fieldId]: meta });
  }

  function syncRuntimeControlValuesFromDom() {
    const root = runtimeFormContainerRef.current;
    if (!root) {
      return;
    }

    const controls = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[data-runtime-field-id], textarea[data-runtime-field-id]");
    const changedValues = collectRuntimeControlValueChanges(runtimeDefinition, controls, latestValuesRef.current);

    commitRuntimeValueChanges(changedValues);
  }

  function syncRuntimeControlValuesForSubmit() {
    const root = runtimeFormContainerRef.current;
    if (!root) {
      return latestValuesRef.current;
    }

    const controls = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[data-runtime-field-id], textarea[data-runtime-field-id]");
    const changedValues = collectRuntimeControlValueChanges(runtimeDefinition, controls, latestValuesRef.current);
    if (Object.keys(changedValues).length === 0) {
      return latestValuesRef.current;
    }

    let nextValues: RuntimeFormValues = {
      ...latestValuesRef.current,
      ...changedValues,
    };
    nextValues = applyInitialStatusIfNeeded(nextValues);
    latestValuesRef.current = nextValues;
    if (hasServerRecordRef.current) {
      pendingPatchValuesRef.current = {
        ...pendingPatchValuesRef.current,
        ...changedValues,
      };
    }
    setValues(nextValues);
    setErrors((currentErrors) => {
      if (!Object.keys(changedValues).some((fieldId) => currentErrors[fieldId])) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      Object.keys(changedValues).forEach((fieldId) => {
        delete nextErrors[fieldId];
      });
      return nextErrors;
    });
    return nextValues;
  }

  function scheduleRuntimeControlDomSync() {
    runtimeControlSyncTimersRef.current.forEach((timer) => clearTimeout(timer));
    runtimeControlSyncTimersRef.current = [
      globalThis.setTimeout(syncRuntimeControlValuesFromDom, 120),
      globalThis.setTimeout(syncRuntimeControlValuesFromDom, 500),
    ];
  }

  async function handleFinish() {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    const submitValues = syncRuntimeControlValuesForSubmit();
    const finishValues = applyInitialStatusIfNeeded(submitValues);
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
        message: runtimeClientValidationDialogMessage(firstError, runtimeLabels),
        tone: "danger",
      });
      return;
    }

    const checklistError = findFirstRuntimeChecklistRequiredError(runtimeDefinition, finishValues, subforms, runtimeLabels);
    if (checklistError) {
      revealRuntimeChecklistItem(checklistError);
      setSaveState("error");
      setFinishDialog({
        checklistReveal: {
          groupId: checklistError.groupId,
          requestKey: nodeRevealRequestKeyRef.current,
          sourceValue: checklistError.sourceValue,
          subformId: checklistError.subformId,
        },
        message: runtimeClientValidationDialogMessage({
          fieldId: checklistError.subformId,
          label: checklistError.itemLabel,
          message: checklistError.message,
        }, runtimeLabels),
        nodeId: checklistError.nodeId,
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
        message: t("tenant.runtime.forms.form.messages.saveFailed"),
        tone: "danger",
      });
      return;
    }

    const didFlushPatch = await flushPendingPatch({ showValidationDialog: true });
    if (!didFlushPatch) {
      if (lastRuntimeRequestErrorKindRef.current === "conflict" || lastRuntimeRequestErrorKindRef.current === "auth") {
        return;
      }
      if (lastPatchValidationErrorsRef.current.length > 0) {
        return;
      }
      setFinishDialog({
        message: t("tenant.runtime.forms.form.messages.saveFailed"),
        tone: "danger",
      });
      return;
    }

    if (isSubform) {
      setSaveState("saved");
      setFinishDialog({
        message: t("tenant.runtime.forms.form.messages.saved"),
        tone: "success",
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
        message: t("tenant.runtime.forms.form.messages.saved"),
        tone: "success",
      });
    } catch (requestError) {
      const errorKind = handleRuntimeRequestError(requestError);
      if (errorKind !== "conflict" && errorKind !== "auth") {
        setFinishDialog({
          message: t("tenant.runtime.forms.form.messages.saveFailed"),
          tone: "danger",
        });
      }
    }
  }

  function handleBackToList(options?: { skipUnsavedPrompt?: boolean }) {
    void (async () => {
      if (!options?.skipUnsavedPrompt && mode === "create" && !hasServerRecordRef.current && hasUserEnteredCreateValues(values, initialValues)) {
        setUnsavedLeaveDialog({ scope: isSubform ? "subform" : "root" });
        return;
      }

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      const didFlushPatch = await flushPendingPatch({ showValidationDialog: true });
      if (!didFlushPatch) {
        if (lastRuntimeRequestErrorKindRef.current === "conflict") {
          setFinishDialog(null);
          navigateBackToParentForm();
          return;
        }
        if (lastRuntimeRequestErrorKindRef.current === "auth") {
          return;
        }
        if (lastPatchValidationErrorsRef.current.length > 0) {
          return;
        }
        setFinishDialog({
          message: t("tenant.runtime.forms.form.messages.saveFailed"),
          tone: "danger",
        });
        return;
      }
      navigateBackToParentForm();
    })();
  }

  function confirmUnsavedLeave() {
    setUnsavedLeaveDialog(null);
    handleBackToList({ skipUnsavedPrompt: true });
  }

  function handleFinishDialogAction() {
    const currentDialog = finishDialog;
    setFinishDialog(null);

    if (!currentDialog) {
      return;
    }

    if (currentDialog.tone === "success") {
      navigateBackToParentForm();
      return;
    }

    if (currentDialog.fieldId) {
      revealRuntimeField(currentDialog.fieldId);
      globalThis.setTimeout(() => {
        focusRuntimeField(currentDialog.fieldId ?? "");
      }, 25);
      return;
    }

    if (currentDialog.checklistReveal && currentDialog.nodeId) {
      revealRuntimeChecklistItem({
        groupId: currentDialog.checklistReveal.groupId,
        nodeId: currentDialog.nodeId,
        sourceValue: currentDialog.checklistReveal.sourceValue ?? "",
        subformId: currentDialog.checklistReveal.subformId,
      });
    }
  }

  return (
    <div
      className="tenant-web__form-runtime-form-page"
      onBlurCapture={scheduleRuntimeControlDomSync}
      ref={runtimeFormContainerRef}
    >
      {shouldShowEditPresence ? (
        <div className="tenant-web__form-runtime-presence-banner" role="status">
          <div aria-hidden="true" className="tenant-web__form-runtime-presence-icon">
            <UsersIcon />
          </div>
          <div className="tenant-web__form-runtime-presence-copy">
            {editPresence.editors.length > 0 ? (
              <strong>{editPresenceTitle}</strong>
            ) : null}
            {editPresence.editors.length > 0 ? (
              <span>{t("tenant.runtime.forms.form.presence.description")}</span>
            ) : null}
            {editPresence.recordChanged ? (
              <span>{t("tenant.runtime.forms.form.presence.changed")}</span>
            ) : null}
          </div>
          <button
            aria-label={t("tenant.runtime.forms.form.presence.dismiss")}
            className="tenant-web__form-runtime-presence-close"
            onClick={() => setDismissedEditPresenceKey(editPresenceKey)}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
      ) : null}
      <RuntimeFormScaffold
        activeTabs={activeTabs}
        definition={runtimeDefinition}
        errors={errors}
        labels={runtimeLabels}
        loadLookupOptions={loadRuntimeLookupOptions}
        onActiveTabChange={handleActiveTabChange}
        onBack={handleBackToList}
        onFieldChange={handleFieldChange}
        onFinish={() => {
          void handleFinish();
        }}
        resolveGeoPoint={formValuesReady ? loadRuntimeGeoPoint : undefined}
        onSubformAdd={isSubform ? undefined : handleSubformAdd}
        onChecklistItemChange={isSubform ? undefined : handleChecklistItemChange}
        onSubformDelete={isSubform ? undefined : handleSubformDelete}
        onSubformEdit={isSubform ? undefined : handleSubformEdit}
        recordId={currentRecordIdRef.current}
        revealChecklistItem={checklistRevealRequest ?? undefined}
        revealFieldId={fieldRevealRequest?.fieldId}
        revealNodeId={nodeRevealRequest?.nodeId}
        revealRequestKey={fieldRevealRequest?.requestKey ?? nodeRevealRequest?.requestKey}
        saveState={saveState}
        subforms={subforms}
        values={values}
      />
      <RuntimeFormDialogs
        finishDialog={finishDialog}
        onCloseFinishDialog={() => setFinishDialog(null)}
        onCloseSubformDeleteDialog={() => setSubformDeleteDialog(null)}
        onCloseUnsavedLeaveDialog={() => setUnsavedLeaveDialog(null)}
        onConfirmSubformDelete={confirmSubformDelete}
        onConfirmUnsavedLeave={confirmUnsavedLeave}
        onFinishDialogAction={handleFinishDialogAction}
        subformDeleteDialog={subformDeleteDialog}
        unsavedLeaveDialog={unsavedLeaveDialog}
      />
    </div>
  );
}
