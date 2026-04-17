import {
  ApiClientError,
  isUnauthorizedApiError,
  trackApiClientRequestActivity,
} from "@platform/api-client";

import type {
  CollectionTableAdapter,
  CollectionTableColumnDefinition,
  CollectionTableMetaResponse,
  CollectionTableQueryRequest,
  CollectionTableQueryResponse,
  CollectionTableRowData,
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
  createSavedFilterSet: (
    accessToken: string,
    input: CollectionTableSavedFilterSetCreateInput,
  ) => Promise<CollectionTableSavedFilterSet>;
  deleteSavedFilterSet: (accessToken: string, savedFilterId: string) => Promise<void>;
  loadMeta: (accessToken: string) => Promise<CollectionTableMetaResponse>;
  loadRecord: (accessToken: string, docGuid: string) => Promise<FormRuntimeRecordResponse>;
  loadSearchSuggestions: (accessToken: string) => Promise<CollectionTableSearchSuggestionsResponse>;
  query: (
    accessToken: string,
    request: CollectionTableQueryRequest,
  ) => Promise<CollectionTableQueryResponse>;
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
  viewId: string;
}): FormRuntimeCollectionTableSessionClient {
  const pathPrefix = `/app/forms/${encodeURIComponent(options.modelId)}/views/${encodeURIComponent(options.viewId)}`;

  return {
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
    query: async (request) =>
      runWithTenantSession((accessToken) => options.client.query(accessToken, request)),
  };
}
