import {
  ApiClientError,
  isUnauthorizedApiError,
  trackApiClientRequestActivity,
} from "@platform/api-client";

import type {
  CollectionTableAdapter,
  CollectionTableBulkActionRequest,
  CollectionTableColumnDefinition,
  CollectionTableMetaResponse,
  CollectionTableQueryRequest,
  CollectionTableQueryResponse,
  CollectionTableRowData,
  CollectionTableFavoriteToggleResult,
  CollectionTableSavedFilterSet,
  CollectionTableSavedFilterSetCreateInput,
  CollectionTableSearchSuggestionGroup,
  CollectionTableSearchSuggestionItem,
  CollectionTableSearchSuggestionsResponse,
} from "@platform/collection-table";

type BackendEnvelope<T> = {
  code?: string;
  data?: T;
  message?: string;
  status?: string;
};

type FormRuntimeCollectionTableSessionClient = {
  createRecord: (
    accessToken: string,
    input: FormRuntimeRecordMutationRequest,
  ) => Promise<FormRuntimeRecordMutationResponse>;
  createSubformRecord: (
    accessToken: string,
    parentDocGuid: string,
    subformId: string,
    input: FormRuntimeRecordMutationRequest,
  ) => Promise<FormRuntimeRecordMutationResponse>;
  createSavedFilterSet: (
    accessToken: string,
    input: CollectionTableSavedFilterSetCreateInput,
  ) => Promise<CollectionTableSavedFilterSet>;
  deleteSubformRecord: (
    accessToken: string,
    parentDocGuid: string,
    subformId: string,
    docGuid: string,
  ) => Promise<void>;
  updateChecklistItem: (
    accessToken: string,
    parentDocGuid: string,
    subformId: string,
    sourceValue: string,
    input: FormRuntimeChecklistItemMutationRequest,
  ) => Promise<FormRuntimeChecklistItemMutationResponse>;
  deleteSavedFilterSet: (accessToken: string, savedFilterId: string) => Promise<void>;
  finishRecord: (
    accessToken: string,
    docGuid: string,
    input: FormRuntimeRecordFinishRequest,
  ) => Promise<FormRuntimeRecordMutationResponse>;
  loadMeta: (accessToken: string) => Promise<CollectionTableMetaResponse>;
  loadForm: (accessToken: string, docGuid?: string) => Promise<FormRuntimeFormResponse>;
  loadRecord: (accessToken: string, docGuid: string) => Promise<FormRuntimeRecordResponse>;
  loadSubform: (
    accessToken: string,
    parentDocGuid: string,
    subformId: string,
    docGuid?: string,
  ) => Promise<FormRuntimeFormResponse>;
  loadSearchSuggestions: (accessToken: string) => Promise<CollectionTableSearchSuggestionsResponse>;
  runBulkAction?: (accessToken: string, input: CollectionTableBulkActionRequest) => Promise<void>;
  toggleFavorite: (accessToken: string) => Promise<CollectionTableFavoriteToggleResult>;
  query: (
    accessToken: string,
    request: CollectionTableQueryRequest,
  ) => Promise<CollectionTableQueryResponse>;
  updateRecord: (
    accessToken: string,
    docGuid: string,
    input: FormRuntimeRecordMutationRequest,
  ) => Promise<FormRuntimeRecordMutationResponse>;
  updateSubformRecord: (
    accessToken: string,
    parentDocGuid: string,
    subformId: string,
    docGuid: string,
    input: FormRuntimeRecordMutationRequest,
  ) => Promise<FormRuntimeRecordMutationResponse>;
};

export type FormRuntimeRecordField = {
  id: string;
  label: string;
  type: "date" | "date_time" | "text";
  value: string;
};

export type FormRuntimeRecordSubtable = {
  id: string;
  title: string;
  columns: ReadonlyArray<CollectionTableColumnDefinition>;
  rows: ReadonlyArray<CollectionTableRowData>;
};

export type FormRuntimeRecordResponse = {
  fields: ReadonlyArray<FormRuntimeRecordField>;
  subtables: ReadonlyArray<FormRuntimeRecordSubtable>;
  surfaceId: string;
  title: string;
};

export type FormRuntimeFormResponse = {
  dataSchema: Record<string, unknown>;
  description?: string;
  docGuid?: string;
  modelId: string;
  recordId?: number | string;
  revision?: string;
  sourceType?: string;
  subforms?: Record<string, FormRuntimeSubformResponse | undefined>;
  surfaceId: string;
  title: string;
  uiSchema: Record<string, unknown>;
  values: Record<string, unknown>;
  viewId: string;
};

export type FormRuntimeChecklistOption = {
  label: string;
  styleVariant?: string;
  value: string;
};

export type FormRuntimeChecklistItem = {
  active?: boolean;
  answerOptions?: ReadonlyArray<FormRuntimeChecklistOption>;
  description?: string;
  groupId?: string;
  groupTitle?: string;
  inactiveSaved?: boolean;
  label: string;
  notes?: string;
  required?: boolean;
  savedRowDocGuid?: string;
  sourceValue: string;
  value?: string;
  values?: Record<string, unknown>;
  visibleWhen?: string;
};

export type FormRuntimeChecklistGroup = {
  id: string;
  items: ReadonlyArray<FormRuntimeChecklistItem>;
  title?: string;
};

export type FormRuntimeChecklistData = {
  groups: ReadonlyArray<FormRuntimeChecklistGroup>;
};

export type FormRuntimeSubformResponse = {
  checklist?: FormRuntimeChecklistData;
  kind?: string;
};

export type FormRuntimeChecklistItemMutationRequest = {
  notes?: string;
  value?: string;
  values?: Record<string, unknown>;
};

export type FormRuntimeChecklistItemMutationResponse = {
  item: FormRuntimeChecklistItem;
  subformId: string;
};

export type FormRuntimeRecordMutationRequest = {
  clientCreateToken?: string;
  expectedRevision?: string;
  lookupLabels?: Record<string, Record<string, string>>;
  values: Record<string, unknown>;
};

export type FormRuntimeRecordFinishRequest = {
  expectedRevision?: string;
};

export type FormRuntimeRecordValidationError = {
  fieldId?: string;
  message: string;
};

export type FormRuntimeRecordMutationResponse = {
  created?: boolean;
  docGuid: string;
  recordId?: number | string;
  revision?: string;
  status?: string;
  validationErrors?: ReadonlyArray<FormRuntimeRecordValidationError>;
  values: Record<string, unknown>;
};

function normalizeRuntimeRecordResponse(
  payload: FormRuntimeRecordResponse,
): FormRuntimeRecordResponse {
  return {
    fields: Array.isArray(payload?.fields) ? payload.fields : [],
    subtables: Array.isArray(payload?.subtables) ? payload.subtables : [],
    surfaceId: typeof payload?.surfaceId === "string" ? payload.surfaceId : "",
    title: typeof payload?.title === "string" ? payload.title : "",
  };
}

function normalizeRuntimeRecordMutationResponse(
  payload: FormRuntimeRecordMutationResponse,
): FormRuntimeRecordMutationResponse {
  const values = payload?.values && typeof payload.values === "object" && !Array.isArray(payload.values)
    ? payload.values
    : {};

  return {
    created: Boolean(payload?.created),
    docGuid: typeof payload?.docGuid === "string" ? payload.docGuid : "",
    recordId: typeof payload?.recordId === "string" || typeof payload?.recordId === "number"
      ? payload.recordId
      : undefined,
    revision: typeof payload?.revision === "string" ? payload.revision : undefined,
    status: typeof payload?.status === "string" ? payload.status : undefined,
    validationErrors: Array.isArray(payload?.validationErrors)
      ? payload.validationErrors
        .filter((error): error is FormRuntimeRecordValidationError =>
          Boolean(error && typeof error.message === "string"),
        )
        .map((error) => ({
          fieldId: typeof error.fieldId === "string" ? error.fieldId : undefined,
          message: error.message,
        }))
      : [],
    values,
  };
}

function normalizeRuntimeFormResponse(
  payload: FormRuntimeFormResponse,
): FormRuntimeFormResponse {
  const dataSchema = payload?.dataSchema && typeof payload.dataSchema === "object" && !Array.isArray(payload.dataSchema)
    ? payload.dataSchema
    : {};
  const uiSchema = payload?.uiSchema && typeof payload.uiSchema === "object" && !Array.isArray(payload.uiSchema)
    ? payload.uiSchema
    : {};
  const values = payload?.values && typeof payload.values === "object" && !Array.isArray(payload.values)
    ? payload.values
    : {};
  const subforms = payload?.subforms && typeof payload.subforms === "object" && !Array.isArray(payload.subforms)
    ? normalizeRuntimeSubformsResponse(payload.subforms)
    : undefined;

  return {
    dataSchema,
    description: typeof payload?.description === "string" ? payload.description : undefined,
    docGuid: typeof payload?.docGuid === "string" ? payload.docGuid : undefined,
    modelId: typeof payload?.modelId === "string" ? payload.modelId : "",
    recordId: typeof payload?.recordId === "string" || typeof payload?.recordId === "number"
      ? payload.recordId
      : undefined,
    revision: typeof payload?.revision === "string" ? payload.revision : undefined,
    sourceType: typeof payload?.sourceType === "string" ? payload.sourceType : undefined,
    subforms,
    surfaceId: typeof payload?.surfaceId === "string" ? payload.surfaceId : "",
    title: typeof payload?.title === "string" ? payload.title : "",
    uiSchema,
    values,
    viewId: typeof payload?.viewId === "string" ? payload.viewId : "",
  };
}

function normalizeRuntimeSubformsResponse(
  payload: Record<string, FormRuntimeSubformResponse | undefined>,
): Record<string, FormRuntimeSubformResponse | undefined> {
  return Object.fromEntries(
    Object.entries(payload).flatMap(([subformId, subform]) => {
      if (!subform || typeof subform !== "object") {
        return [];
      }
      const groups = Array.isArray(subform.checklist?.groups)
        ? subform.checklist.groups.map((group: FormRuntimeChecklistGroup) => ({
          id: typeof group.id === "string" ? group.id : "",
          items: Array.isArray(group.items)
            ? group.items
              .filter((item: FormRuntimeChecklistItem): item is FormRuntimeChecklistItem =>
                Boolean(item && typeof item.sourceValue === "string" && typeof item.label === "string"),
              )
              .map((item) => ({
                active: Boolean(item.active),
                answerOptions: Array.isArray(item.answerOptions)
                  ? item.answerOptions
                    .filter((option: FormRuntimeChecklistOption): option is FormRuntimeChecklistOption =>
                      Boolean(option && typeof option.value === "string" && typeof option.label === "string"),
                    )
                    .map((option) => ({
                      label: option.label,
                      styleVariant: typeof option.styleVariant === "string" ? option.styleVariant : undefined,
                      value: option.value,
                    }))
                  : [],
                description: typeof item.description === "string" ? item.description : undefined,
                groupId: typeof item.groupId === "string" ? item.groupId : undefined,
                groupTitle: typeof item.groupTitle === "string" ? item.groupTitle : undefined,
                inactiveSaved: Boolean(item.inactiveSaved),
                label: item.label,
                notes: typeof item.notes === "string" ? item.notes : undefined,
                required: Boolean(item.required),
                savedRowDocGuid: typeof item.savedRowDocGuid === "string" ? item.savedRowDocGuid : undefined,
                sourceValue: item.sourceValue,
                value: typeof item.value === "string" ? item.value : undefined,
                values: item.values && typeof item.values === "object" && !Array.isArray(item.values)
                  ? item.values
                  : undefined,
                visibleWhen: typeof item.visibleWhen === "string" ? item.visibleWhen : undefined,
              }))
            : [],
          title: typeof group.title === "string" ? group.title : undefined,
        }))
        : [];
      return [[subformId, {
        checklist: { groups },
        kind: typeof subform.kind === "string" ? subform.kind : undefined,
      }]];
    }),
  );
}

function normalizeRuntimeChecklistItemMutationResponse(
  payload: FormRuntimeChecklistItemMutationResponse,
): FormRuntimeChecklistItemMutationResponse {
  return {
    item: payload.item && typeof payload.item === "object"
      ? {
        active: Boolean(payload.item.active),
        answerOptions: Array.isArray(payload.item.answerOptions) ? payload.item.answerOptions : [],
        description: typeof payload.item.description === "string" ? payload.item.description : undefined,
        groupId: typeof payload.item.groupId === "string" ? payload.item.groupId : undefined,
        groupTitle: typeof payload.item.groupTitle === "string" ? payload.item.groupTitle : undefined,
        inactiveSaved: Boolean(payload.item.inactiveSaved),
        label: typeof payload.item.label === "string" ? payload.item.label : "",
        notes: typeof payload.item.notes === "string" ? payload.item.notes : undefined,
        required: Boolean(payload.item.required),
        savedRowDocGuid: typeof payload.item.savedRowDocGuid === "string" ? payload.item.savedRowDocGuid : undefined,
        sourceValue: typeof payload.item.sourceValue === "string" ? payload.item.sourceValue : "",
        value: typeof payload.item.value === "string" ? payload.item.value : undefined,
        values: payload.item.values && typeof payload.item.values === "object" && !Array.isArray(payload.item.values)
          ? payload.item.values
          : undefined,
        visibleWhen: typeof payload.item.visibleWhen === "string" ? payload.item.visibleWhen : undefined,
      }
      : {
        label: "",
        sourceValue: "",
      },
    subformId: typeof payload.subformId === "string" ? payload.subformId : "",
  };
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function normalizeMessage(statusCode?: number, fallbackMessage?: string) {
  if (fallbackMessage?.trim()) {
    return fallbackMessage;
  }
  if (typeof statusCode === "number") {
    return `Request failed with status ${statusCode}.`;
  }
  return "Request failed.";
}

function normalizeSearchSuggestionId(fieldId: string, value: string) {
  return `${fieldId}:${value.trim().toLowerCase()}`;
}

function normalizeSearchSuggestionsResponse(
  payload: CollectionTableSearchSuggestionsResponse,
): CollectionTableSearchSuggestionsResponse {
  return {
    groups: (payload.groups ?? [])
      .filter((group): group is CollectionTableSearchSuggestionGroup => Boolean(group?.fieldId && group?.label))
      .map((group) => ({
        fieldId: group.fieldId,
        label: group.label,
        items: (group.items ?? [])
          .filter((item): item is CollectionTableSearchSuggestionItem => typeof item?.value === "string" && item.value.trim().length > 0)
          .map((item) => ({
            count: item.count,
            fieldId:
              typeof item.fieldId === "string" && item.fieldId.trim().length > 0
                ? item.fieldId
                : group.fieldId,
            id:
              typeof item.id === "string" && item.id.trim().length > 0
                ? item.id
                : normalizeSearchSuggestionId(group.fieldId, item.value),
            value: item.value.trim(),
          })),
      }))
      .filter((group) => group.items.length > 0),
  };
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    throw new ApiClientError("Response was not valid JSON.", {
      payload: responseText,
      statusCode: response.status,
    });
  }
}

async function requestTenantCollectionTable<T>(
  baseUrl: string,
  path: string,
  options: {
    accessToken: string;
    body?: unknown;
    method?: string;
  },
): Promise<T> {
  return trackApiClientRequestActivity(async () => {
    const headers = new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${options.accessToken}`,
    });

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
        body,
        headers,
        method: options.method ?? (body ? "POST" : "GET"),
      });
    } catch (error) {
      throw new ApiClientError(
        error instanceof Error ? error.message : "Network request failed.",
        { code: "network_error" },
      );
    }

    const payload = await parseJsonBody(response);
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const envelope = payload as BackendEnvelope<T>;
      if ("status" in envelope || "data" in envelope || "message" in envelope || "code" in envelope) {
        if (!response.ok || envelope.status !== "ok") {
          throw new ApiClientError(
            normalizeMessage(response.status, envelope.message),
            {
              code: envelope.code,
              payload: envelope.data ?? payload,
              responseStatus: envelope.status,
              statusCode: response.status,
            },
          );
        }
        return envelope.data as T;
      }
    }

    if (!response.ok) {
      throw new ApiClientError(normalizeMessage(response.status), {
        payload,
        statusCode: response.status,
      });
    }

    return payload as T;
  });
}

export function createFormRuntimeCollectionTableClient(options: {
  baseUrl: string;
  modelId: string;
  routeContext?: "preview" | "runtime";
  viewId: string;
}): FormRuntimeCollectionTableSessionClient {
  const pathPrefix = options.routeContext === "preview"
    ? `/app/platform-studio/forms/${encodeURIComponent(options.modelId)}/views/${encodeURIComponent(options.viewId)}/runtime`
    : `/app/forms/${encodeURIComponent(options.modelId)}/views/${encodeURIComponent(options.viewId)}`;

  return {
    async createRecord(accessToken, input) {
      const response = await requestTenantCollectionTable<FormRuntimeRecordMutationResponse>(
        options.baseUrl,
        `${pathPrefix}/records`,
        {
          accessToken,
          body: input,
          method: "POST",
        },
      );
      return normalizeRuntimeRecordMutationResponse(response);
    },
    async createSubformRecord(accessToken, parentDocGuid, subformId, input) {
      const response = await requestTenantCollectionTable<FormRuntimeRecordMutationResponse>(
        options.baseUrl,
        `${pathPrefix}/records/${encodeURIComponent(parentDocGuid)}/subforms/${encodeURIComponent(subformId)}/records`,
        {
          accessToken,
          body: input,
          method: "POST",
        },
      );
      return normalizeRuntimeRecordMutationResponse(response);
    },
    async createSavedFilterSet(accessToken, input) {
      return requestTenantCollectionTable<CollectionTableSavedFilterSet>(
        options.baseUrl,
        `${pathPrefix}/saved-filters`,
        {
          accessToken,
          body: input,
          method: "POST",
        },
      );
    },
    async deleteSavedFilterSet(accessToken, savedFilterId) {
      await requestTenantCollectionTable<void>(
        options.baseUrl,
        `${pathPrefix}/saved-filters/${encodeURIComponent(savedFilterId)}`,
        {
          accessToken,
          method: "DELETE",
        },
      );
    },
    async deleteSubformRecord(accessToken, parentDocGuid, subformId, docGuid) {
      await requestTenantCollectionTable<void>(
        options.baseUrl,
        `${pathPrefix}/records/${encodeURIComponent(parentDocGuid)}/subforms/${encodeURIComponent(subformId)}/records/${encodeURIComponent(docGuid)}`,
        {
          accessToken,
          method: "DELETE",
        },
      );
    },
    async updateChecklistItem(accessToken, parentDocGuid, subformId, sourceValue, input) {
      const response = await requestTenantCollectionTable<FormRuntimeChecklistItemMutationResponse>(
        options.baseUrl,
        `${pathPrefix}/records/${encodeURIComponent(parentDocGuid)}/subforms/${encodeURIComponent(subformId)}/checklist/items/${encodeURIComponent(sourceValue)}`,
        {
          accessToken,
          body: input,
          method: "PATCH",
        },
      );
      return normalizeRuntimeChecklistItemMutationResponse(response);
    },
    async finishRecord(accessToken, docGuid, input) {
      const response = await requestTenantCollectionTable<FormRuntimeRecordMutationResponse>(
        options.baseUrl,
        `${pathPrefix}/records/${encodeURIComponent(docGuid)}/finish`,
        {
          accessToken,
          body: input,
          method: "POST",
        },
      );
      return normalizeRuntimeRecordMutationResponse(response);
    },
    async loadMeta(accessToken) {
      return requestTenantCollectionTable<CollectionTableMetaResponse>(
        options.baseUrl,
        `${pathPrefix}/meta`,
        {
          accessToken,
          method: "GET",
        },
      );
    },
    async loadForm(accessToken, docGuid) {
      const formPath = docGuid
        ? `${pathPrefix}/records/${encodeURIComponent(docGuid)}/form`
        : `${pathPrefix}/form`;
      const response = await requestTenantCollectionTable<FormRuntimeFormResponse>(
        options.baseUrl,
        formPath,
        {
          accessToken,
          method: "GET",
        },
      );
      return normalizeRuntimeFormResponse(response);
    },
    async loadRecord(accessToken, docGuid) {
      const response = await requestTenantCollectionTable<FormRuntimeRecordResponse>(
        options.baseUrl,
        `${pathPrefix}/records/${encodeURIComponent(docGuid)}`,
        {
          accessToken,
          method: "GET",
        },
      );
      return normalizeRuntimeRecordResponse(response);
    },
    async loadSubform(accessToken, parentDocGuid, subformId, docGuid) {
      const subformPath = docGuid
        ? `${pathPrefix}/records/${encodeURIComponent(parentDocGuid)}/subforms/${encodeURIComponent(subformId)}/records/${encodeURIComponent(docGuid)}/form`
        : `${pathPrefix}/records/${encodeURIComponent(parentDocGuid)}/subforms/${encodeURIComponent(subformId)}/form`;
      const response = await requestTenantCollectionTable<FormRuntimeFormResponse>(
        options.baseUrl,
        subformPath,
        {
          accessToken,
          method: "GET",
        },
      );
      return normalizeRuntimeFormResponse(response);
    },
    async loadSearchSuggestions(accessToken) {
      const response = await requestTenantCollectionTable<CollectionTableSearchSuggestionsResponse>(
        options.baseUrl,
        `${pathPrefix}/search-suggestions`,
        {
          accessToken,
          method: "GET",
        },
      );

      return normalizeSearchSuggestionsResponse(response);
    },
    async runBulkAction(accessToken, input) {
      await requestTenantCollectionTable<void>(
        options.baseUrl,
        `${pathPrefix}/bulk-actions/${encodeURIComponent(input.actionId)}`,
        {
          accessToken,
          body: {
            query: input.query,
            rowIds: input.rowIds,
          },
          method: "POST",
        },
      );
    },
    async toggleFavorite(accessToken) {
      return requestTenantCollectionTable<CollectionTableFavoriteToggleResult>(
        options.baseUrl,
        `${pathPrefix}/favorite/toggle`,
        {
          accessToken,
          method: "POST",
        },
      );
    },
    async query(accessToken, request) {
      return requestTenantCollectionTable<CollectionTableQueryResponse>(
        options.baseUrl,
        `${pathPrefix}/query`,
        {
          accessToken,
          body: request,
          method: "POST",
        },
      );
    },
    async updateRecord(accessToken, docGuid, input) {
      const response = await requestTenantCollectionTable<FormRuntimeRecordMutationResponse>(
        options.baseUrl,
        `${pathPrefix}/records/${encodeURIComponent(docGuid)}`,
        {
          accessToken,
          body: input,
          method: "PATCH",
        },
      );
      return normalizeRuntimeRecordMutationResponse(response);
    },
    async updateSubformRecord(accessToken, parentDocGuid, subformId, docGuid, input) {
      const response = await requestTenantCollectionTable<FormRuntimeRecordMutationResponse>(
        options.baseUrl,
        `${pathPrefix}/records/${encodeURIComponent(parentDocGuid)}/subforms/${encodeURIComponent(subformId)}/records/${encodeURIComponent(docGuid)}`,
        {
          accessToken,
          body: input,
          method: "PATCH",
        },
      );
      return normalizeRuntimeRecordMutationResponse(response);
    },
  };
}

export function createFormRuntimeCollectionTableAdapter(options: {
  client: FormRuntimeCollectionTableSessionClient;
  getAccessToken: () => string | null | undefined;
  onUnauthorized: () => void | Promise<void>;
}): CollectionTableAdapter {
  async function runWithTenantSession<T>(
    operation: (accessToken: string) => Promise<T>,
  ) {
    const accessToken = options.getAccessToken();
    if (!accessToken) {
      void options.onUnauthorized();
      throw new ApiClientError("Tenant session is unavailable.", {
        code: "tenant_session_missing",
        statusCode: 401,
      });
    }

    try {
      return await operation(accessToken);
    } catch (requestError) {
      if (isUnauthorizedApiError(requestError)) {
        void options.onUnauthorized();
      }
      throw requestError;
    }
  }

  return {
    createSavedFilterSet: async (input) =>
      runWithTenantSession((accessToken) => options.client.createSavedFilterSet(accessToken, input)),
    deleteSavedFilterSet: async (savedFilterId) =>
      runWithTenantSession((accessToken) => options.client.deleteSavedFilterSet(accessToken, savedFilterId)),
    loadMeta: async () => runWithTenantSession((accessToken) => options.client.loadMeta(accessToken)),
    loadSearchSuggestions: async () =>
      runWithTenantSession((accessToken) => options.client.loadSearchSuggestions(accessToken)),
    runBulkAction: options.client.runBulkAction
      ? async (input) =>
        runWithTenantSession((accessToken) => options.client.runBulkAction!(accessToken, input))
      : undefined,
    toggleFavorite: async () =>
      runWithTenantSession((accessToken) => options.client.toggleFavorite(accessToken)),
    query: async (request) =>
      runWithTenantSession((accessToken) => options.client.query(accessToken, request)),
  };
}
