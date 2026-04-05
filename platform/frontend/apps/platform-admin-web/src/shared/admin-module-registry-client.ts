import { ApiClientError } from "@platform/api-client";

import type {
  CollectionTableBulkActionRequest,
  CollectionTableMetaResponse,
  CollectionTableQueryRequest,
  CollectionTableQueryResponse,
  CollectionTableSavedFilterSet,
  CollectionTableSavedFilterSetCreateInput,
  CollectionTableSearchSuggestionGroup,
  CollectionTableSearchSuggestionItem,
  CollectionTableSearchSuggestionsResponse,
} from "./collection-table-contract";

type BackendEnvelope<T> = {
  code?: string;
  data?: T;
  message?: string;
  status?: string;
};

type AdminModuleRegistryActionResult = {
  downloadUrl?: string;
  ok?: boolean;
};

type AdminModuleRegistryClient = {
  createSavedFilterSet: (
    accessToken: string,
    input: CollectionTableSavedFilterSetCreateInput,
  ) => Promise<CollectionTableSavedFilterSet>;
  exportXls: (
    accessToken: string,
    input: { query: CollectionTableQueryRequest },
  ) => Promise<AdminModuleRegistryActionResult | void>;
  loadMeta: (accessToken: string) => Promise<CollectionTableMetaResponse>;
  loadSearchSuggestions: (accessToken: string) => Promise<CollectionTableSearchSuggestionsResponse>;
  query: (
    accessToken: string,
    request: CollectionTableQueryRequest,
  ) => Promise<CollectionTableQueryResponse>;
  runBulkAction: (
    accessToken: string,
    input: CollectionTableBulkActionRequest,
  ) => Promise<void>;
  runRowAction: (
    accessToken: string,
    input: { actionId: string; rowId: string },
  ) => Promise<AdminModuleRegistryActionResult | void>;
  toggleFavorite: (
    accessToken: string,
  ) => Promise<{ isFavorite: boolean }>;
};

const runtimeConfigStorageKey = "platform.admin.config";
const adminApiUrlStorageKey = "adminApiUrl";
const moduleRegistryListPathPrefix = "/app/admin/module-registry/list";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
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

async function requestAdminModuleRegistry<T>(
  path: string,
  options: {
    accessToken: string;
    allowEmptySuccess?: boolean;
    body?: unknown;
    method?: string;
  },
): Promise<T> {
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
}

export function createAdminModuleRegistryClient(): AdminModuleRegistryClient {
  return {
    async createSavedFilterSet(accessToken, input) {
      return requestAdminModuleRegistry<CollectionTableSavedFilterSet>(
        `${moduleRegistryListPathPrefix}/saved-filters`,
        {
          accessToken,
          body: input,
          method: "POST",
        },
      );
    },
    async exportXls(accessToken, input) {
      return requestAdminModuleRegistry<AdminModuleRegistryActionResult | void>(
        `${moduleRegistryListPathPrefix}/export-xls`,
        {
          accessToken,
          allowEmptySuccess: true,
          body: input,
          method: "POST",
        },
      );
    },
    async loadMeta(accessToken) {
      return requestAdminModuleRegistry<CollectionTableMetaResponse>(
        `${moduleRegistryListPathPrefix}/meta`,
        {
          accessToken,
          method: "GET",
        },
      );
    },
    async loadSearchSuggestions(accessToken) {
      const response = await requestAdminModuleRegistry<CollectionTableSearchSuggestionsResponse>(
        `${moduleRegistryListPathPrefix}/search-suggestions`,
        {
          accessToken,
          method: "GET",
        },
      );

      return normalizeSearchSuggestionsResponse(response);
    },
    async query(accessToken, request) {
      return requestAdminModuleRegistry<CollectionTableQueryResponse>(
        `${moduleRegistryListPathPrefix}/query`,
        {
          accessToken,
          body: request,
          method: "POST",
        },
      );
    },
    async runBulkAction(accessToken, input) {
      await requestAdminModuleRegistry<void>(
        `${moduleRegistryListPathPrefix}/bulk-actions/${encodeURIComponent(input.actionId)}`,
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
      return requestAdminModuleRegistry<AdminModuleRegistryActionResult | void>(
        `${moduleRegistryListPathPrefix}/row-actions/${encodeURIComponent(input.actionId)}`,
        {
          accessToken,
          allowEmptySuccess: true,
          body: { rowId: input.rowId },
          method: "POST",
        },
      );
    },
    async toggleFavorite(accessToken) {
      return requestAdminModuleRegistry<{ isFavorite: boolean }>(
        `${moduleRegistryListPathPrefix}/favorite/toggle`,
        {
          accessToken,
          method: "POST",
        },
      );
    },
  };
}

export type { AdminModuleRegistryClient };
