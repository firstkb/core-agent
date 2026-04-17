import {
  ApiClientError,
  isUnauthorizedApiError,
  trackApiClientRequestActivity,
} from "@platform/api-client";

import type {
  CollectionTableAdapter,
  CollectionTableBulkActionRequest,
  CollectionTableFavoriteToggleResult,
  CollectionTableMetaResponse,
  CollectionTableQueryRequest,
  CollectionTableQueryResponse,
  CollectionTableRowActionRequest,
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

type AdminCollectionTableActionResult = {
  downloadUrl?: string;
  launchUrl?: string;
  ok?: boolean;
  openIn?: "new_tab" | "same_tab";
};

type AdminCollectionTableSessionClient = {
  createSavedFilterSet: (
    accessToken: string,
    input: CollectionTableSavedFilterSetCreateInput,
  ) => Promise<CollectionTableSavedFilterSet>;
  deleteSavedFilterSet: (accessToken: string, savedFilterId: string) => Promise<void>;
  exportXls?: (
    accessToken: string,
    input: { query: CollectionTableQueryRequest },
  ) => Promise<AdminCollectionTableActionResult | void>;
  loadMeta: (accessToken: string) => Promise<CollectionTableMetaResponse>;
  loadSearchSuggestions: (accessToken: string) => Promise<CollectionTableSearchSuggestionsResponse>;
  query: (
    accessToken: string,
    request: CollectionTableQueryRequest,
  ) => Promise<CollectionTableQueryResponse>;
  runBulkAction?: (
    accessToken: string,
    input: CollectionTableBulkActionRequest,
  ) => Promise<void>;
  runRowAction?: (
    accessToken: string,
    input: CollectionTableRowActionRequest,
  ) => Promise<AdminCollectionTableActionResult | void>;
  toggleFavorite: (
    accessToken: string,
  ) => Promise<CollectionTableFavoriteToggleResult>;
};

const runtimeConfigStorageKey = "platform.admin.config";
const adminApiUrlStorageKey = "adminApiUrl";
const MISSING_ADMIN_SESSION_ERROR_CODE = "admin_session_missing";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function normalizePathPrefix(pathPrefix: string) {
  return `/${pathPrefix.trim().replace(/^\/+|\/+$/g, "")}`;
}

function readAdminApiUrlFromStorage() {
  if (typeof window === "undefined") {
    throw new ApiClientError("Admin runtime config is unavailable.", {
      code: "missing_runtime_config",
    });
  }

  const directValue = window.localStorage.getItem(adminApiUrlStorageKey)?.trim();

  if (directValue) {
    return directValue;
  }

  const rawConfig = window.localStorage.getItem(runtimeConfigStorageKey);

  if (!rawConfig) {
    throw new ApiClientError("Admin runtime config is missing adminApiUrl.", {
      code: "missing_runtime_config",
    });
  }

  try {
    const parsed = JSON.parse(rawConfig) as Record<string, unknown>;
    const configValue = typeof parsed.adminApiUrl === "string" ? parsed.adminApiUrl.trim() : "";

    if (configValue) {
      return configValue;
    }
  } catch {}

  throw new ApiClientError("Admin runtime config is missing adminApiUrl.", {
    code: "missing_runtime_config",
  });
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

async function requestAdminCollectionTable<T>(
  path: string,
  options: {
    accessToken: string;
    allowEmptySuccess?: boolean;
    body?: unknown;
    method?: string;
  },
): Promise<T> {
  return trackApiClientRequestActivity(async () => {
    const adminApiUrl = readAdminApiUrlFromStorage();
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
      response = await fetch(`${normalizeBaseUrl(adminApiUrl)}${path}`, {
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

    if (response.ok && payload === null && options.allowEmptySuccess) {
      return undefined as T;
    }

    if (isRecord(payload)) {
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

function openActionUrl(result?: AdminCollectionTableActionResult | void) {
  if (!result || typeof window === "undefined") {
    return;
  }

  const actionUrl = result.launchUrl?.trim() || result.downloadUrl?.trim() || "";
  if (!actionUrl) {
    return;
  }

  if (result.openIn === "same_tab") {
    window.location.assign(actionUrl);
    return;
  }

  window.open(actionUrl, "_blank", "noopener,noreferrer");
}

export function createAdminCollectionTableAdapter(options: {
  client: AdminCollectionTableSessionClient;
  getAccessToken: () => string | null | undefined;
  onUnauthorized: () => void | Promise<void>;
}): CollectionTableAdapter {
  async function runWithAdminSession<T>(
    operation: (accessToken: string) => Promise<T>,
  ) {
    const accessToken = options.getAccessToken();

    if (!accessToken) {
      void options.onUnauthorized();
      throw new ApiClientError("Admin session is unavailable.", {
        code: MISSING_ADMIN_SESSION_ERROR_CODE,
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
      runWithAdminSession((accessToken) => options.client.createSavedFilterSet(accessToken, input)),
    deleteSavedFilterSet: async (savedFilterId) =>
      runWithAdminSession((accessToken) => options.client.deleteSavedFilterSet(accessToken, savedFilterId)),
    exportXls: options.client.exportXls
      ? async (request) => {
        const result = await runWithAdminSession((accessToken) =>
          options.client.exportXls!(accessToken, request),
        );
        openActionUrl(result);
      }
      : undefined,
    loadMeta: async () =>
      runWithAdminSession((accessToken) => options.client.loadMeta(accessToken)),
    loadSearchSuggestions: async () =>
      runWithAdminSession((accessToken) => options.client.loadSearchSuggestions(accessToken)),
    query: async (request) =>
      runWithAdminSession((accessToken) => options.client.query(accessToken, request)),
    runBulkAction: options.client.runBulkAction
      ? async (input) =>
        runWithAdminSession((accessToken) => options.client.runBulkAction!(accessToken, input))
      : undefined,
    runRowAction: options.client.runRowAction
      ? async (input) => {
        const result = await runWithAdminSession((accessToken) =>
          options.client.runRowAction!(accessToken, input),
        );
        openActionUrl(result);
      }
      : undefined,
    toggleFavorite: async () =>
      runWithAdminSession((accessToken) => options.client.toggleFavorite(accessToken)),
  };
}

export function createAdminCollectionTableClient(options: {
  pathPrefix: string;
  supportsBulkActions?: boolean;
  supportsExportXls?: boolean;
  supportsRowActions?: boolean;
}): AdminCollectionTableSessionClient {
  const pathPrefix = normalizePathPrefix(options.pathPrefix);

  return {
    async createSavedFilterSet(accessToken, input) {
      return requestAdminCollectionTable<CollectionTableSavedFilterSet>(
        `${pathPrefix}/saved-filters`,
        {
          accessToken,
          body: input,
          method: "POST",
        },
      );
    },
    async deleteSavedFilterSet(accessToken, savedFilterId) {
      await requestAdminCollectionTable<void>(
        `${pathPrefix}/saved-filters/${encodeURIComponent(savedFilterId)}`,
        {
          accessToken,
          method: "DELETE",
        },
      );
    },
    async exportXls(accessToken, input) {
      if (!options.supportsExportXls) {
        return undefined;
      }

      return requestAdminCollectionTable<AdminCollectionTableActionResult | void>(
        `${pathPrefix}/export-xls`,
        {
          accessToken,
          allowEmptySuccess: true,
          body: input,
          method: "POST",
        },
      );
    },
    async loadMeta(accessToken) {
      return requestAdminCollectionTable<CollectionTableMetaResponse>(
        `${pathPrefix}/meta`,
        {
          accessToken,
          method: "GET",
        },
      );
    },
    async loadSearchSuggestions(accessToken) {
      const response = await requestAdminCollectionTable<CollectionTableSearchSuggestionsResponse>(
        `${pathPrefix}/search-suggestions`,
        {
          accessToken,
          method: "GET",
        },
      );

      return normalizeSearchSuggestionsResponse(response);
    },
    async query(accessToken, request) {
      return requestAdminCollectionTable<CollectionTableQueryResponse>(
        `${pathPrefix}/query`,
        {
          accessToken,
          body: request,
          method: "POST",
        },
      );
    },
    async runBulkAction(accessToken, input) {
      if (!options.supportsBulkActions) {
        return;
      }

      await requestAdminCollectionTable<void>(
        `${pathPrefix}/bulk-actions/${encodeURIComponent(input.actionId)}`,
        {
          accessToken,
          allowEmptySuccess: true,
          body: {
            query: input.query,
            rowIds: input.rowIds,
          },
          method: "POST",
        },
      );
    },
    async runRowAction(accessToken, input) {
      if (!options.supportsRowActions) {
        return undefined;
      }

      return requestAdminCollectionTable<AdminCollectionTableActionResult | void>(
        `${pathPrefix}/row-actions/${encodeURIComponent(input.actionId)}`,
        {
          accessToken,
          allowEmptySuccess: true,
          body: { rowId: input.rowId },
          method: "POST",
        },
      );
    },
    async toggleFavorite(accessToken) {
      return requestAdminCollectionTable<CollectionTableFavoriteToggleResult>(
        `${pathPrefix}/favorite/toggle`,
        {
          accessToken,
          method: "POST",
        },
      );
    },
  };
}

export type {
  AdminCollectionTableActionResult,
  AdminCollectionTableSessionClient,
};
