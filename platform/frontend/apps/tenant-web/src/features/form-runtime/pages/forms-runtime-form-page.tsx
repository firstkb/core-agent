import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ApiClientError,
  createTenantDictionaryClient,
  isUnauthorizedApiError,
  type TenantDictionaryFilter,
  type TenantDictionaryOptionsRequest,
} from "@platform/api-client";
import { useAuth } from "@platform/auth-core";
import {
  applyRuntimeWorkflowStatus,
  createRuntimeFormDefinitionFromSchema,
  findRuntimeFormField,
  RuntimeFormScaffold,
  validateRuntimeForm,
  type RuntimeFormActiveTabs,
  type RuntimeFormCommitMode,
  type RuntimeFormDefinition,
  type RuntimeFormFieldChangeMeta,
  type RuntimeFormFieldType,
  type RuntimeFormLookupDefinition,
  type RuntimeFormLookupFilter,
  type RuntimeFormLookupOptionsRequest,
  type RuntimeFormLookupOptionsResponse,
  type RuntimeFormMode,
  type RuntimeFormSaveState,
  type RuntimeFormSubformDataById,
  type RuntimeFormSubformDefinition,
  type RuntimeFormSubformRow,
  type RuntimeFormValidationErrors,
  type RuntimeFormValue,
  type RuntimeFormValues,
} from "@platform/forms";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
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
  type FormRuntimeRecordResponse,
  type FormRuntimeRecordMutationResponse,
  type FormRuntimeRecordValidationError,
} from "../form-runtime-collection-table-client";
import {
  formRuntimePaths,
  type FormRuntimeRouteContext,
} from "../form-runtime-route-meta";
import "./form-runtime.css";

type FinishDialogState = {
  fieldId?: string;
  message: string;
  tone: "danger" | "success";
};

type RuntimeFormLoadErrorState = {
  code?: string;
  description: string;
  title: string;
};

type RuntimeFormFieldRevealRequest = {
  fieldId: string;
  requestKey: number;
};

type SubformDeleteDialogState = {
  row: RuntimeFormSubformRow;
  subform: RuntimeFormSubformDefinition;
};

type UnsavedLeaveDialogState = {
  scope: "root" | "subform";
};

type RuntimeFormSessionState = {
  activeTabs?: RuntimeFormActiveTabs;
  docGuid?: string;
  formResponse?: FormRuntimeFormResponse;
  revision?: string;
  values?: Record<string, unknown>;
};

type RuntimeFormNavigationState = {
  parentRuntimeFormSession?: RuntimeFormSessionState;
  runtimeFormSession?: RuntimeFormSessionState;
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

function inputValidationErrorsOnly(errors: RuntimeFormValidationErrors) {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message && message !== "This field is required."),
  );
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
    message: fieldId ? errors[fieldId] : undefined,
  };
}

function runtimeClientValidationDialogMessage(error: ReturnType<typeof findFirstValidationError>) {
  if (error.message === "This field is required.") {
    return `Please fill field: "${error.label}"`;
  }

  return `Please fill field correctly: "${error.label}"`;
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

function runtimeSubformsFromRecord(record: FormRuntimeRecordResponse) {
  const subforms: RuntimeFormSubformDataById = {};
  record.subtables.forEach((subtable) => {
    const rows: RuntimeFormSubformRow[] = subtable.rows.map((row) => ({
      cells: Object.fromEntries(
        Object.entries(row.cells).map(([fieldId, cell]) => [fieldId, {
          displayValue: cell.displayValue,
          html: cell.html,
          label: cell.label,
          value: cell.value,
        }]),
      ),
      id: row.id,
    }));
    subforms[subtable.id] = { rows };
  });
  return subforms;
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

function runtimeFormValueToDomString(value: RuntimeFormValue | undefined) {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.join(",");
  }
  return "";
}

function dictionaryKeyForLookupPreset(preset: string | undefined) {
  switch (preset) {
    case "company_lookup":
      return "companies";
    case "contact_lookup":
      return "contacts";
    case "project_lookup":
      return "projects";
    default:
      return undefined;
  }
}

function lookupUsesNamedPresetDictionary(lookup: RuntimeFormLookupDefinition) {
  return Boolean(dictionaryKeyForLookupPreset(lookup.preset));
}

function storedValueFieldForLookup(lookup: RuntimeFormLookupDefinition) {
  if (lookup.valueMode === "text") {
    return lookup.storedValueField;
  }
  return lookup.storedValueField;
}

function isLookupFilterValueArray(
  value: RuntimeFormLookupFilter["value"],
): value is ReadonlyArray<string | number | boolean> {
  return Array.isArray(value);
}

function tenantDictionaryFilters(filters: ReadonlyArray<RuntimeFormLookupFilter> | undefined): TenantDictionaryFilter[] | undefined {
  return filters?.map((filter): TenantDictionaryFilter => {
    const value = filter.value;
    return {
      field: filter.field,
      operator: filter.operator,
      value: isLookupFilterValueArray(value) ? [...value] : value,
    };
  });
}

function buildRuntimeLookupDictionaryRequest(
  request: RuntimeFormLookupOptionsRequest,
): TenantDictionaryOptionsRequest | null {
  const { lookup } = request;
  const useNamedPresetDictionary = lookupUsesNamedPresetDictionary(lookup);
  const dictionary = useNamedPresetDictionary
    ? dictionaryKeyForLookupPreset(lookup.preset)
    : lookup.sourceModel
      ? lookup.dictionary
      : lookup.dictionary;
  const sourceModel = useNamedPresetDictionary ? undefined : lookup.sourceModel;

  if (!sourceModel && !dictionary) {
    return null;
  }

  return {
    dictionary,
    displayFields: sourceModel && lookup.displayFields ? [...lookup.displayFields] : undefined,
    filters: sourceModel ? tenantDictionaryFilters(lookup.filters) : undefined,
    ids: request.ids ? [...request.ids] : undefined,
    page: request.page,
    pageSize: request.pageSize,
    search: request.search,
    searchFields: sourceModel && lookup.searchFields ? [...lookup.searchFields] : undefined,
    sortField: sourceModel ? lookup.sortField : undefined,
    sourceModel,
    storedValueField: sourceModel ? storedValueFieldForLookup(lookup) : undefined,
  };
}

function hasLookupLabels(labels: Record<string, Record<string, string>>) {
  return Object.values(labels).some((fieldLabels) => Object.keys(fieldLabels).length > 0);
}

function cloneLookupLabels(labels: Record<string, Record<string, string>>) {
  return Object.fromEntries(
    Object.entries(labels).flatMap(([fieldId, fieldLabels]) => {
      const entries = Object.entries(fieldLabels).filter(([value, label]) => value.trim() && label.trim());
      return entries.length > 0 ? [[fieldId, Object.fromEntries(entries)]] : [];
    }),
  );
}

function mergeLookupLabels(
  target: Record<string, Record<string, string>>,
  fieldId: string,
  labels: Record<string, string> | undefined,
) {
  if (!labels || Object.keys(labels).length === 0) {
    return;
  }
  target[fieldId] = {
    ...target[fieldId],
    ...labels,
  };
}

function mergeLookupLabelMaps(
  left: Record<string, Record<string, string>>,
  right: Record<string, Record<string, string>>,
) {
  const out: Record<string, Record<string, string>> = cloneLookupLabels(left);
  Object.entries(right).forEach(([fieldId, labels]) => {
    mergeLookupLabels(out, fieldId, labels);
  });
  return out;
}

function lookupLabelsForChangedValues(
  changedValues: Record<string, unknown>,
  labels: Record<string, Record<string, string>>,
) {
  return Object.fromEntries(
    Object.keys(changedValues).flatMap((fieldId) => {
      const fieldLabels = labels[fieldId];
      return fieldLabels && Object.keys(fieldLabels).length > 0 ? [[fieldId, fieldLabels]] : [];
    }),
  );
}

function isConflictRuntimeError(requestError: unknown) {
  return requestError instanceof ApiClientError
    && (requestError.statusCode === 409 || requestError.code === "FORM_RUNTIME_CONFLICT");
}

function isNotFoundRuntimeError(requestError: unknown) {
  return requestError instanceof ApiClientError
    && (
      requestError.statusCode === 404 ||
      requestError.code === "FORM_RUNTIME_MODEL_NOT_FOUND" ||
      requestError.code === "FORM_RUNTIME_VIEW_NOT_FOUND" ||
      requestError.code === "FORM_RUNTIME_RECORD_NOT_FOUND"
    );
}

function runtimeFormLoadErrorFromRequest(requestError: unknown): RuntimeFormLoadErrorState {
  if (isNotFoundRuntimeError(requestError)) {
    return {
      code: "404",
      description: "This form, view, or record was not found. It may have been deleted, or the link may contain an incorrect id.",
      title: "Form not found",
    };
  }

  return {
    description: "Please try again. If the problem continues, return to the list and open the record again.",
    title: "Could not load form",
  };
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
  const [values, setValues] = useState<RuntimeFormValues>({});
  const [errors, setErrors] = useState<RuntimeFormValidationErrors>({});
  const [activeTabs, setActiveTabs] = useState<RuntimeFormActiveTabs>(() => restoredSession?.activeTabs ?? {});
  const [fieldRevealRequest, setFieldRevealRequest] = useState<RuntimeFormFieldRevealRequest | null>(null);
  const [finishDialog, setFinishDialog] = useState<FinishDialogState | null>(null);
  const [saveState, setSaveState] = useState<RuntimeFormSaveState>("saving");
  const [subformDeleteDialog, setSubformDeleteDialog] = useState<SubformDeleteDialogState | null>(null);
  const [subforms, setSubforms] = useState<RuntimeFormSubformDataById>({});
  const [unsavedLeaveDialog, setUnsavedLeaveDialog] = useState<UnsavedLeaveDialogState | null>(null);
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
  const lastPatchValidationErrorsRef = useRef<ReadonlyArray<FormRuntimeRecordValidationError>>([]);
  const latestValuesRef = useRef<RuntimeFormValues>({});
  const latestLookupLabelsRef = useRef<Record<string, Record<string, string>>>({});
  const patchInFlightRef = useRef(false);
  const patchPromiseRef = useRef<Promise<void> | null>(null);
  const pendingLookupLabelsRef = useRef<Record<string, Record<string, string>>>({});
  const pendingPatchValuesRef = useRef<Record<string, unknown>>({});
  const revisionRef = useRef(restoredSession?.revision ?? "");
  const runtimeControlSyncTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const runtimeFormContainerRef = useRef<HTMLDivElement | null>(null);
  const currentDocGuidRef = useRef(routeDocGuid || restoredSession?.docGuid || "");
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
        label: item.label,
        value: request.lookup.valueMode === "text" ? item.label : item.value,
      })),
    };
  }, [dictionaryClient, getRuntimeAccessToken]);

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
        setFormLoadError(runtimeFormLoadErrorFromRequest(requestError));
        setSaveState("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [
    client,
    getRuntimeAccessToken,
    isSubform,
    mode,
    parentDocGuid,
    restoredSession,
    routeDocGuid,
    routeIsInvalid,
    signOut,
    subformId,
  ]);

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
    setSubformDeleteDialog(null);
    setUnsavedLeaveDialog(null);
    setSaveState("idle");
    setSubforms({});
    latestValuesRef.current = nextValues;
    revisionRef.current = restoredSession?.revision ?? formResponse.revision ?? "";
    currentDocGuidRef.current = routeDocGuid || restoredSession?.docGuid || formResponse.docGuid || "";
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
    if (isSubform || !client || !definition || !hasServerRecordRef.current || !currentDocGuidRef.current) {
      setSubforms({});
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
          setSubforms(runtimeSubformsFromRecord(record));
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
        setSubforms({});
      });

    return () => {
      isCancelled = true;
    };
  }, [client, definition, formResponse?.docGuid, getRuntimeAccessToken, isSubform, routeDocGuid, signOut]);

  if (!client || routeIsInvalid) {
    return <Navigate replace to="/dashboard" />;
  }
  if (formLoadError) {
    return (
      <div className="tenant-web__form-runtime-form-page tenant-web__form-runtime-form-page--centered">
        <div className="tenant-web__form-runtime-load-error" role="status">
          {formLoadError.code ? (
            <div aria-hidden="true" className="tenant-web__form-runtime-load-error-code">
              {formLoadError.code}
            </div>
          ) : null}
          <h1 className="tenant-web__form-runtime-load-error-title">
            {formLoadError.title}
          </h1>
          <p className="tenant-web__form-runtime-load-error-description">
            {formLoadError.description}
          </p>
          <Button
            onClick={() => navigate(formRuntimePaths.list(modelId, viewId, entryContext))}
            type="button"
            variant="secondary"
          >
            Back to list
          </Button>
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
  const runtimeFormResponse = formResponse;
  const parentFormPath = isSubform
    ? formRuntimePaths.edit(modelId, viewId, parentDocGuid, entryContext)
    : formRuntimePaths.list(modelId, viewId, entryContext);

  function currentRuntimeFormSession(docGuid = currentDocGuidRef.current): RuntimeFormSessionState {
    const serializedValues = serializeRuntimeFormValues(latestValuesRef.current);
    return {
      activeTabs: activeTabsRef.current,
      docGuid,
      formResponse: runtimeFormResponse
        ? {
          ...runtimeFormResponse,
          docGuid,
          revision: revisionRef.current || runtimeFormResponse.revision,
          values: serializedValues,
        }
        : undefined,
      revision: revisionRef.current || undefined,
      values: serializedValues,
    };
  }

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

  async function reloadSubforms(parentGuid = currentDocGuidRef.current) {
    if (isSubform || !parentGuid) {
      return;
    }
    const accessToken = getRuntimeAccessToken();
    if (!accessToken) {
      return;
    }
    const record = await runtimeClient.loadRecord(accessToken, parentGuid);
    setSubforms(runtimeSubformsFromRecord(record));
  }

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
      message: firstRuntimeValidationMessage(validationErrors) ?? runtimeClientValidationDialogMessage(firstError),
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
          message: runtimeClientValidationDialogMessage(firstError),
          tone: "danger",
        });
      } else {
        const inputErrors = inputValidationErrorsOnly(nextErrors);
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
              message: firstRuntimeValidationMessage(response.validationErrors) ?? `Please fill field: "${firstError.label}"`,
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
                    revision: response.revision,
                    values: restoredValues,
                  }
                  : undefined,
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
    const changedLookupLabels: Record<string, Record<string, string>> = {};
    Object.keys(changedValues).forEach((fieldId) => {
      const labels = metaByField?.[fieldId]?.lookupLabels;
      mergeLookupLabels(changedLookupLabels, fieldId, labels);
      mergeLookupLabels(latestLookupLabelsRef.current, fieldId, labels);
    });

    let nextValues: RuntimeFormValues = {
      ...latestValuesRef.current,
      ...changedValues,
    };
    nextValues = applyInitialStatusIfNeeded(nextValues);
    latestValuesRef.current = nextValues;
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
    if (mode === "create" && !hasServerRecordRef.current) {
      if (createInFlightRef.current) {
        pendingPatchValuesRef.current = {
          ...pendingPatchValuesRef.current,
          ...changedValues,
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

    schedulePatch(changedValues, changedLookupLabels);
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

    const changedValues: Record<string, RuntimeFormValue> = {};
    const controls = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[data-runtime-field-id], textarea[data-runtime-field-id]");
    controls.forEach((control) => {
      const fieldId = control.dataset.runtimeFieldId?.trim();
      if (!fieldId || control.disabled || control.readOnly) {
        return;
      }
      const field = findRuntimeFormField(runtimeDefinition, fieldId);
      if (!field || field.disabled || field.readonly) {
        return;
      }

      const nextValue = control.value;
      if (nextValue !== runtimeFormValueToDomString(latestValuesRef.current[fieldId])) {
        changedValues[fieldId] = nextValue;
      }
    });

    commitRuntimeValueChanges(changedValues);
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
        message: runtimeClientValidationDialogMessage(firstError),
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

    const didFlushPatch = await flushPendingPatch({ showValidationDialog: true });
    if (!didFlushPatch) {
      if (lastRuntimeRequestErrorKindRef.current === "conflict" || lastRuntimeRequestErrorKindRef.current === "auth") {
        return;
      }
      if (lastPatchValidationErrorsRef.current.length > 0) {
        return;
      }
      setFinishDialog({
        message: "Could not save record.",
        tone: "danger",
      });
      return;
    }

    if (isSubform) {
      setSaveState("saved");
      setFinishDialog({
        message: "Successfully saved to server.",
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
        if (lastRuntimeRequestErrorKindRef.current === "conflict" || lastRuntimeRequestErrorKindRef.current === "auth") {
          return;
        }
        if (lastPatchValidationErrorsRef.current.length > 0) {
          return;
        }
        setFinishDialog({
          message: "Could not save record.",
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
    }
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
            message: "Could not save record.",
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
        message: "Could not save record.",
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
            message: "Could not delete record.",
            tone: "danger",
          });
        }
      }
    })();
  }

  return (
    <div
      className="tenant-web__form-runtime-form-page"
      onBlurCapture={scheduleRuntimeControlDomSync}
      ref={runtimeFormContainerRef}
    >
      <RuntimeFormScaffold
        activeTabs={activeTabs}
        definition={runtimeDefinition}
        errors={errors}
        labels={isSubform ? {
          backToList: "Back",
          createModeInfo: "Complete the required fields to create this item. Changes will save automatically after it is created.",
          editModeInfo: "This item saves changes automatically as you work.",
          finish: "Save",
          onlineFormTitle: "Subform",
        } : undefined}
        loadLookupOptions={loadRuntimeLookupOptions}
        onActiveTabChange={handleActiveTabChange}
        onBack={handleBackToList}
        onFieldChange={handleFieldChange}
        onFinish={() => {
          void handleFinish();
        }}
        onSubformAdd={isSubform ? undefined : handleSubformAdd}
        onSubformDelete={isSubform ? undefined : handleSubformDelete}
        onSubformEdit={isSubform ? undefined : handleSubformEdit}
        revealFieldId={fieldRevealRequest?.fieldId}
        revealRequestKey={fieldRevealRequest?.requestKey}
        saveState={saveState}
        subforms={subforms}
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
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setSubformDeleteDialog(null);
          }
        }}
        open={Boolean(subformDeleteDialog)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>
              This subform record will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubformDelete} variant="danger">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setUnsavedLeaveDialog(null);
          }
        }}
        open={Boolean(unsavedLeaveDialog)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              {unsavedLeaveDialog?.scope === "subform"
                ? "This subform item has not been created yet. Entered data will be lost."
                : "This form has not been created yet. Entered data will be lost."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">
              Stay
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnsavedLeave} variant="danger">
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
