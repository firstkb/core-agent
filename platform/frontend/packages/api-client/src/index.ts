type ApiHealth = {
  status: "ok" | "degraded";
  checkedAt: string;
};

type BackendEnvelope<T> = {
  code?: string;
  data?: T;
  message?: string;
  status?: string;
};

type AuthIdentifier = { email: string } | { phone: string };

type ApiClientRequestActivitySnapshot = {
  activeRequestCount: number;
};

type AuthOtpRequestData = {
  otp_length: number;
  status: string;
};

type AuthTokenData = {
  access_token: string;
  expires_in: number;
};

type TenantProfile = {
  tenant: {
    host?: string;
    id: string;
    name?: string;
    plan?: string;
    status?: string;
    [key: string]: unknown;
  };
  user: {
    email?: string;
    first_name?: string;
    id: string;
    last_name?: string;
    level?: number;
    phone?: string;
    role?: string;
    [key: string]: unknown;
  };
};

type TenantFavoriteShortcut = {
  id: string;
  model_id: string;
  model_title: string;
  route_path: string;
  target_type: string;
  title: string;
  view_id: string;
};

type TenantBusinessTreeNodeKind = "company" | "contactsGroup" | "projectsGroup" | "contact" | "project";

type TenantBusinessTreeNode = {
  childCount: number;
  expandable: boolean;
  id: string;
  kind: TenantBusinessTreeNodeKind;
  label: string;
};

type TenantBusinessTreeNodesResponse = {
  nodes: TenantBusinessTreeNode[];
  parentId: string;
};

type TenantNavigationNodeType =
  | "menu_title"
  | "menu_group"
  | "form_view"
  | "app_page"
  | "external_link"
  | "app_module";

type TenantNavigationTargetType =
  | "form_view"
  | "app_page"
  | "external_link"
  | "app_module";

type TenantNavigationTarget = {
  modelId?: string;
  moduleId?: string;
  pageId?: string;
  route?: string;
  type: TenantNavigationTargetType;
  url?: string;
  viewId?: string;
};

type TenantNavigationNode = {
  access?: unknown;
  active?: boolean;
  channel?: string;
  children: TenantNavigationNode[];
  icon?: string;
  id: string;
  label: string;
  meta?: unknown;
  target?: TenantNavigationTarget;
  type: TenantNavigationNodeType;
};

type TenantNavigationRailItem = {
  access?: unknown;
  active?: boolean;
  id: string;
  key: string;
  label: string;
};

type TenantNavigationDefinition = {
  appMenu: TenantNavigationNode[];
  schemaVersion: number;
  utilityRail: TenantNavigationRailItem[];
};

type TenantNavigationValidationMessage = {
  code?: string;
  message: string;
  target?: string;
};

type TenantNavigationValidationSummary = {
  canSave: boolean;
  errors: TenantNavigationValidationMessage[];
  warnings: TenantNavigationValidationMessage[];
};

type TenantNavigationConfigResponse = {
  configKey: string;
  definition: TenantNavigationDefinition;
  updatedAt?: string;
  updatedBy?: string;
  validationSummary: TenantNavigationValidationSummary;
  version: number;
};

type TenantNavigationAccessOption = {
  fields?: Record<string, string>;
  id: string;
  label: string;
  subtitle?: string;
};

type TenantNavigationAccessOptionCategory = "companies" | "companyTypes" | "jobtypes" | "users";

type TenantNavigationAccessOptionPageRequest = {
  category: TenantNavigationAccessOptionCategory;
  ids?: string[];
  page?: number;
  pageSize?: number;
  search?: string;
};

type TenantNavigationAccessOptionPageResponse = {
  category: TenantNavigationAccessOptionCategory;
  hasMore: boolean;
  items: TenantNavigationAccessOption[];
  page: number;
  pageSize: number;
  total: number;
};

type TenantNavigationAccessOptionsResponse = {
  companies: TenantNavigationAccessOption[];
  companyTypes: TenantNavigationAccessOption[];
  jobtypes: TenantNavigationAccessOption[];
  users: TenantNavigationAccessOption[];
};

type TenantDictionaryKey = "companies" | "companyTypes" | "contacts" | "jobtypes" | "projects";

type TenantDictionaryFilterOperator =
  | "contains"
  | "eq"
  | "in"
  | "is_empty"
  | "is_not_empty"
  | "not_eq"
  | "starts_with";

type TenantDictionaryFilterScalar = boolean | number | string;

type TenantDictionaryFilter = {
  field: string;
  operator?: TenantDictionaryFilterOperator;
  value?: TenantDictionaryFilterScalar | TenantDictionaryFilterScalar[];
};

type TenantDictionaryOption = {
  description?: string;
  fields?: Record<string, string>;
  id: string;
  label: string;
  value: string;
};

type TenantDictionaryOptionsRequest = {
  dictionary?: TenantDictionaryKey | string;
  displayFields?: string[];
  filters?: TenantDictionaryFilter[];
  ids?: string[];
  page?: number;
  pageSize?: number;
  search?: string;
  searchFields?: string[];
  sortField?: string;
  sourceModel?: string;
  storedValueField?: string;
};

type TenantDictionaryOptionsResponse = {
  dictionary: string;
  hasMore: boolean;
  items: TenantDictionaryOption[];
  page: number;
  pageSize: number;
  total: number;
};

type TenantNavigationSaveInput = {
  definition: TenantNavigationDefinition;
  expectedVersion?: number;
};

type TenantRuntimeNavigationItem = {
  breadcrumb: string[];
  children: TenantRuntimeNavigationItem[];
  externalUrl?: string;
  icon?: string;
  id: string;
  key?: string;
  label: string;
  path?: string;
  targetType?: string;
  type: string;
};

type TenantRuntimeCreateAction = {
  breadcrumb: string[];
  id: string;
  label: string;
  modelId?: string;
  path: string;
  targetType: string;
  viewId?: string;
};

type TenantRuntimeNavigationResponse = {
  createActions: TenantRuntimeCreateAction[];
  items: TenantRuntimeNavigationItem[];
  utilityRail: TenantRuntimeNavigationItem[];
  utilityRailConfigured: boolean;
};

type TenantBusinessTreeClient = {
  getNodes: (accessToken: string, parentId?: string) => Promise<TenantBusinessTreeNodesResponse>;
};

type TenantNavigationClient = {
  getRuntimeNavigation: (accessToken: string) => Promise<TenantRuntimeNavigationResponse>;
  loadAccessOptionPage: (
    accessToken: string,
    request: TenantNavigationAccessOptionPageRequest,
  ) => Promise<TenantNavigationAccessOptionPageResponse>;
  loadAccessOptions: (accessToken: string) => Promise<TenantNavigationAccessOptionsResponse>;
  loadConfig: (accessToken: string) => Promise<TenantNavigationConfigResponse>;
  saveConfig: (accessToken: string, input: TenantNavigationSaveInput) => Promise<TenantNavigationConfigResponse>;
};

type TenantDictionaryClient = {
  loadOptions: (
    accessToken: string,
    request: TenantDictionaryOptionsRequest,
  ) => Promise<TenantDictionaryOptionsResponse>;
};

type TenantFavoritesClient = {
  getFavorites: (accessToken: string) => Promise<TenantFavoriteShortcut[]>;
};

type AdminProfile = {
  user: {
    email?: string;
    id: string;
    level?: number;
    name?: string;
    phone?: string;
    role?: string;
    scope?: string;
    status?: string;
    [key: string]: unknown;
  };
};

type AdminEmployee = {
  createdAt?: string;
  email?: string;
  id: string;
  isCurrentUser?: boolean;
  level?: number;
  name?: string;
  phone?: string;
  role?: string;
  status?: string;
  [key: string]: unknown;
};

type AdminEmployeeDetail = {
  user: AdminEmployee;
};

type AdminEmployeeUpdateInput = {
  name: string;
  phone: string;
  status: string;
};

type AdminNavigationAccess = "read" | "write";

type AdminNavigationFavorite = {
  access: AdminNavigationAccess;
  description?: string;
  id: string;
  module_icon?: string;
  module_id: string;
  module_key: string;
  module_title: string;
  route_path: string;
  section_key: string;
  title: string;
};

type AdminNavigationSection = {
  access: AdminNavigationAccess;
  description?: string;
  icon?: string;
  id: string;
  route_path: string;
  section_key: string;
  title: string;
};

type AdminNavigationModule = {
  description?: string;
  icon?: string;
  id: string;
  module_key: string;
  sections: AdminNavigationSection[];
  title: string;
};

type AdminNavigation = {
  favorites: AdminNavigationFavorite[];
  is_root: boolean;
  modules: AdminNavigationModule[];
};

type ApiClient = {
  getHealth: () => Promise<ApiHealth>;
};

type AuthClient = {
  logout: (input?: { allDevices?: boolean }) => Promise<void>;
  refresh: () => Promise<AuthTokenData>;
  requestAdminOtp: (identifier: AuthIdentifier) => Promise<AuthOtpRequestData>;
  requestOtp: (identifier: AuthIdentifier) => Promise<AuthOtpRequestData>;
  verifyAdminOtp: (input: AuthIdentifier & { code: string }) => Promise<AuthTokenData>;
  verifyOtp: (input: AuthIdentifier & { code: string }) => Promise<AuthTokenData>;
};

type TenantProfileClient = {
  getProfile: (accessToken: string) => Promise<TenantProfile>;
};

type FormBuilderDraftVersions = {
  model?: number;
  view?: number;
};

type FormBuilderModelSummary = {
  canEditViewsOnly: boolean;
  dataCount?: number;
  description?: string;
  displayName: string;
  guid?: string;
  id: string;
  isStructureLocked: boolean;
  key: string;
  modelStructureVersion: number;
  name: string;
  sourceType?: string;
  storageKey?: string;
  title: string;
  version: number;
};

type FormBuilderModelFieldSummary = {
  displayName: string;
  id: string;
  isLocked: boolean;
  isPersisted: boolean;
  key: string;
  label: string;
  status?: string;
  storageKey?: string;
};

type FormBuilderViewSummary = {
  description?: string;
  displayName: string;
  guid?: string;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  isViewLocked: boolean;
  key: string;
  kind: string;
  lastAlignedModelStructureVersion: number;
  modelId: string;
  name: string;
  title: string;
  version: number;
};

type FormBuilderModelCatalogItem = FormBuilderModelSummary & {
  views: FormBuilderViewSummary[];
};

type FormBuilderModelDetail = FormBuilderModelSummary & {
  fields: FormBuilderModelFieldSummary[];
  selectedViewId?: string;
  views: FormBuilderViewSummary[];
};

type FormBuilderViewDetail = {
  draft?: JsonRecord;
  model: FormBuilderModelSummary;
  view: FormBuilderViewSummary;
};

type FormBuilderDownloadedFile = {
  blob: Blob;
  contentType: string;
  fileName: string;
};

type FormBuilderCreateModelInput = {
  description?: string;
  key?: string;
  title: string;
};

type FormBuilderCreateViewInput = {
  description?: string;
  isActive?: boolean;
  key?: string;
  kind?: string;
  title: string;
};

type FormBuilderCopyViewInput = {
  description?: string;
  isActive?: boolean;
  key?: string;
  kind?: string;
  title?: string;
};

type FormBuilderDraftPayload = {
  model: JsonRecord;
  view: JsonRecord;
};

type FormBuilderValidationMessage = {
  code?: string;
  message: string;
  target?: string;
};

type FormBuilderValidationSummary = {
  canPublish: boolean;
  canSave: boolean;
  errors: FormBuilderValidationMessage[];
  warnings: FormBuilderValidationMessage[];
};

type FormBuilderDraftPublishState = {
  hasUnpublishedChanges: boolean;
  lastPublishedAt?: string;
  lastPublishedBy?: string;
  modelPublishedVersion: number;
  modelVersion: number;
  viewPublishedVersion: number;
  viewVersion: number;
};

type FormBuilderDraftResponse = {
  draft: FormBuilderDraftPayload;
  publishState: FormBuilderDraftPublishState;
  validationSummary: FormBuilderValidationSummary;
};

type FormBuilderSaveDraftInput = {
  draft: FormBuilderDraftPayload;
  expectedVersions?: FormBuilderDraftVersions;
};

type TenantFormBuilderDraftClient = {
  loadDraft: (accessToken: string, modelId: string, viewId: string) => Promise<FormBuilderDraftResponse>;
  saveDraft: (
    accessToken: string,
    modelId: string,
    viewId: string,
    input: FormBuilderSaveDraftInput,
  ) => Promise<FormBuilderDraftResponse>;
};

type TenantFormBuilderAuthoringClient = {
  copyView: (
    accessToken: string,
    modelId: string,
    viewId: string,
    input?: FormBuilderCopyViewInput,
  ) => Promise<FormBuilderModelDetail>;
  createModel: (accessToken: string, input: FormBuilderCreateModelInput) => Promise<FormBuilderModelDetail>;
  createView: (
    accessToken: string,
    modelId: string,
    input: FormBuilderCreateViewInput,
  ) => Promise<FormBuilderModelDetail>;
  deleteModel: (accessToken: string, modelId: string) => Promise<{ deletedModelId: string }>;
  deleteView: (accessToken: string, modelId: string, viewId: string) => Promise<FormBuilderModelDetail>;
  exportModelBundle: (accessToken: string, modelId: string) => Promise<FormBuilderDownloadedFile>;
  exportModelData: (accessToken: string, modelId: string) => Promise<FormBuilderDownloadedFile>;
  getModel: (accessToken: string, modelId: string) => Promise<FormBuilderModelDetail>;
  getView: (accessToken: string, modelId: string, viewId: string) => Promise<FormBuilderViewDetail>;
  listCatalog: (accessToken: string) => Promise<FormBuilderModelCatalogItem[]>;
  listModels: (accessToken: string) => Promise<FormBuilderModelSummary[]>;
  listViews: (accessToken: string, modelId: string) => Promise<FormBuilderViewSummary[]>;
};

type AdminProfileClient = {
  getProfile: (accessToken: string) => Promise<AdminProfile>;
};

type AdminNavigationClient = {
  getNavigation: (accessToken: string) => Promise<AdminNavigation>;
};

type AdminEmployeesClient = {
  getEmployee: (accessToken: string, employeeId: string) => Promise<AdminEmployeeDetail>;
  updateEmployee: (
    accessToken: string,
    employeeId: string,
    input: AdminEmployeeUpdateInput,
  ) => Promise<AdminEmployeeDetail>;
};

type JsonRecord = Record<string, unknown>;

const authRequestTimeoutMs = 8_000;
const profileBootstrapRequestTimeoutMs = 8_000;

class ApiClientError extends Error {
  readonly code?: string;
  readonly payload?: unknown;
  readonly responseStatus?: string;
  readonly statusCode?: number;

  constructor(
    message: string,
    options?: {
      code?: string;
      payload?: unknown;
      responseStatus?: string;
      statusCode?: number;
    },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = options?.code;
    this.payload = options?.payload;
    this.responseStatus = options?.responseStatus;
    this.statusCode = options?.statusCode;
  }
}

const apiClientRequestActivityListeners = new Set<() => void>();
let activeApiClientRequestCount = 0;

function emitApiClientRequestActivity() {
  apiClientRequestActivityListeners.forEach((listener) => listener());
}

function beginApiClientRequestActivity() {
  activeApiClientRequestCount += 1;
  emitApiClientRequestActivity();

  let completed = false;

  return () => {
    if (completed) {
      return;
    }

    completed = true;
    activeApiClientRequestCount = Math.max(0, activeApiClientRequestCount - 1);
    emitApiClientRequestActivity();
  };
}

function getApiClientRequestActivitySnapshot(): ApiClientRequestActivitySnapshot {
  return {
    activeRequestCount: activeApiClientRequestCount,
  };
}

function subscribeApiClientRequestActivity(listener: () => void) {
  apiClientRequestActivityListeners.add(listener);

  return () => {
    apiClientRequestActivityListeners.delete(listener);
  };
}

async function trackApiClientRequestActivity<T>(operation: () => Promise<T>) {
  const completeRequestActivity = beginApiClientRequestActivity();

  try {
    return await operation();
  } finally {
    completeRequestActivity();
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function normalizeEnvelope<T>(payload: unknown, response: Response): BackendEnvelope<T> {
  if (!isRecord(payload)) {
    throw new ApiClientError(normalizeMessage(response.status), {
      payload,
      statusCode: response.status,
    });
  }

  return payload as BackendEnvelope<T>;
}

async function requestEnvelope<T>(
  baseUrl: string,
  path: string,
  options?: {
    accessToken?: string;
    allowEmptySuccess?: boolean;
    body?: unknown;
    credentials?: RequestCredentials;
    method?: string;
    timeoutMs?: number;
  },
): Promise<BackendEnvelope<T>> {
  const completeRequestActivity = beginApiClientRequestActivity();
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options?.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  let body: BodyInit | undefined;
  if (options && "body" in options && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  let response: Response;
  let didTimeout = false;
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;
  const controller = typeof AbortController !== "undefined"
    ? new AbortController()
    : null;

  if (
    controller &&
    typeof options?.timeoutMs === "number" &&
    Number.isFinite(options.timeoutMs) &&
    options.timeoutMs > 0
  ) {
    timeoutId = globalThis.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, options.timeoutMs);
  }

  try {
    try {
      response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
        body,
        credentials: options?.credentials,
        headers,
        method: options?.method ?? (body ? "POST" : "GET"),
        signal: controller?.signal,
      });
    } catch (error) {
      if (didTimeout) {
        throw new ApiClientError("Request timed out.", {
          code: "request_timeout",
        });
      }

      const message = error instanceof Error ? error.message : "Network request failed.";
      throw new ApiClientError(message, { code: "network_error" });
    } finally {
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    }

    const payload = await parseJsonBody(response);

    if (response.ok && payload === null && options?.allowEmptySuccess) {
      return { status: "ok" };
    }

    const envelope = normalizeEnvelope<T>(payload, response);

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

    return envelope;
  } finally {
    completeRequestActivity();
  }
}

function parseContentDispositionFileName(headerValue: string | null) {
  if (!headerValue) {
    return undefined;
  }

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const quotedMatch = headerValue.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = headerValue.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return undefined;
}

async function requestFile(
  baseUrl: string,
  path: string,
  options?: {
    accessToken?: string;
    credentials?: RequestCredentials;
    fallbackFileName?: string;
    method?: string;
    timeoutMs?: number;
  },
): Promise<FormBuilderDownloadedFile> {
  const completeRequestActivity = beginApiClientRequestActivity();
  const headers = new Headers();

  if (options?.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  let response: Response;
  let didTimeout = false;
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;
  const controller = typeof AbortController !== "undefined"
    ? new AbortController()
    : null;

  if (
    controller &&
    typeof options?.timeoutMs === "number" &&
    Number.isFinite(options.timeoutMs) &&
    options.timeoutMs > 0
  ) {
    timeoutId = globalThis.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, options.timeoutMs);
  }

  try {
    try {
      response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
        credentials: options?.credentials,
        headers,
        method: options?.method ?? "GET",
        signal: controller?.signal,
      });
    } catch (error) {
      if (didTimeout) {
        throw new ApiClientError("Request timed out.", {
          code: "request_timeout",
        });
      }

      const message = error instanceof Error ? error.message : "Network request failed.";
      throw new ApiClientError(message, { code: "network_error" });
    } finally {
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    }

    if (!response.ok) {
      const responseContentType = response.headers.get("Content-Type") ?? "";
      if (responseContentType.toLowerCase().includes("application/json")) {
        const payload = await parseJsonBody(response);
        const envelope = normalizeEnvelope<unknown>(payload, response);
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

      const responseText = await response.text();
      throw new ApiClientError(normalizeMessage(response.status, responseText.trim()), {
        payload: responseText,
        statusCode: response.status,
      });
    }

    const blob = await response.blob();
    return {
      blob,
      contentType: response.headers.get("Content-Type")?.trim() || blob.type || "application/octet-stream",
      fileName: parseContentDispositionFileName(response.headers.get("Content-Disposition"))
        ?? options?.fallbackFileName
        ?? "download",
    };
  } finally {
    completeRequestActivity();
  }
}

function assertPositiveInteger(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }

  return value;
}

function assertNonNegativeInteger(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }

  return value;
}

function assertString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }

  return value;
}

function assertBoolean(value: unknown, fieldName: string) {
  if (typeof value !== "boolean") {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }

  return value;
}

function normalizeJsonRecord(payload: unknown, fieldName: string) {
  if (!isRecord(payload)) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload,
    });
  }

  return payload;
}

function normalizeValidationMessages(payload: unknown, fieldName: string) {
  if (payload === undefined || payload === null) {
    return [];
  }

  if (!Array.isArray(payload)) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload,
    });
  }

  return payload.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new ApiClientError(`Invalid ${fieldName}[${index}] received from API.`, {
        code: "invalid_payload",
        payload: entry,
      });
    }

    return {
      code: typeof entry.code === "string" ? entry.code : undefined,
      message: assertString(entry.message, `${fieldName}[${index}].message`),
      target: typeof entry.target === "string" ? entry.target : undefined,
    };
  });
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function normalizeOptionalStringRecord(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }

  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = key.trim();
    if (!normalizedKey || typeof entry !== "string" || !entry.trim()) {
      continue;
    }
    out[normalizedKey] = entry.trim();
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeOptionalPositiveInteger(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return assertPositiveInteger(value, fieldName);
}

function normalizeOptionalNonNegativeInteger(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return assertNonNegativeInteger(value, fieldName);
}

function normalizeFormBuilderModelSummary(payload: unknown, fieldName: string): FormBuilderModelSummary {
  const record = normalizeJsonRecord(payload, fieldName);
  const displayName = assertString(record.displayName, `${fieldName}.displayName`);

  return {
    canEditViewsOnly: assertBoolean(record.canEditViewsOnly, `${fieldName}.canEditViewsOnly`),
    dataCount: normalizeOptionalNonNegativeInteger(record.dataCount, `${fieldName}.dataCount`),
    description: normalizeOptionalString(record.description),
    displayName,
    guid: normalizeOptionalString(record.guid),
    id: assertString(record.id, `${fieldName}.id`),
    isStructureLocked: assertBoolean(record.isStructureLocked, `${fieldName}.isStructureLocked`),
    key: assertString(record.key, `${fieldName}.key`),
    modelStructureVersion: assertPositiveInteger(record.modelStructureVersion, `${fieldName}.modelStructureVersion`),
    name: normalizeOptionalString(record.name) ?? displayName,
    sourceType: normalizeOptionalString(record.sourceType),
    storageKey: normalizeOptionalString(record.storageKey),
    title: normalizeOptionalString(record.title) ?? displayName,
    version: normalizeOptionalPositiveInteger(record.version, `${fieldName}.version`) ?? 1,
  };
}

function normalizeFormBuilderFieldSummary(payload: unknown, fieldName: string): FormBuilderModelFieldSummary {
  const record = normalizeJsonRecord(payload, fieldName);
  const displayName = normalizeOptionalString(record.displayName) ?? assertString(record.label, `${fieldName}.label`);

  return {
    displayName,
    id: assertString(record.id, `${fieldName}.id`),
    isLocked: assertBoolean(record.isLocked, `${fieldName}.isLocked`),
    isPersisted: assertBoolean(record.isPersisted, `${fieldName}.isPersisted`),
    key: normalizeOptionalString(record.key) ?? assertString(record.id, `${fieldName}.id`),
    label: normalizeOptionalString(record.label) ?? displayName,
    status: normalizeOptionalString(record.status),
    storageKey: normalizeOptionalString(record.storageKey),
  };
}

function normalizeFormBuilderViewSummary(payload: unknown, fieldName: string): FormBuilderViewSummary {
  const record = normalizeJsonRecord(payload, fieldName);
  const displayName = assertString(record.displayName, `${fieldName}.displayName`);

  return {
    description: normalizeOptionalString(record.description),
    displayName,
    guid: normalizeOptionalString(record.guid),
    id: assertString(record.id, `${fieldName}.id`),
    isActive: assertBoolean(record.isActive, `${fieldName}.isActive`),
    isDefault: assertBoolean(record.isDefault, `${fieldName}.isDefault`),
    isViewLocked: assertBoolean(record.isViewLocked, `${fieldName}.isViewLocked`),
    key: assertString(record.key, `${fieldName}.key`),
    kind: assertString(record.kind, `${fieldName}.kind`),
    lastAlignedModelStructureVersion: assertPositiveInteger(
      record.lastAlignedModelStructureVersion,
      `${fieldName}.lastAlignedModelStructureVersion`,
    ),
    modelId: assertString(record.modelId, `${fieldName}.modelId`),
    name: normalizeOptionalString(record.name) ?? displayName,
    title: normalizeOptionalString(record.title) ?? displayName,
    version: normalizeOptionalPositiveInteger(record.version, `${fieldName}.version`) ?? 1,
  };
}

function normalizeFormBuilderModelCatalogItem(payload: unknown, fieldName: string): FormBuilderModelCatalogItem {
  const record = normalizeJsonRecord(payload, fieldName);
  const model = normalizeFormBuilderModelSummary(record, fieldName);
  const views = Array.isArray(record.views) ? record.views : [];

  return {
    ...model,
    views: views.map((entry, index) => normalizeFormBuilderViewSummary(entry, `${fieldName}.views[${index}]`)),
  };
}

function normalizeFormBuilderModelDetail(payload: unknown): FormBuilderModelDetail {
  const record = normalizeJsonRecord(payload, "modelDetail");
  const fields = Array.isArray(record.fields) ? record.fields : [];
  const views = Array.isArray(record.views) ? record.views : [];
  const model = normalizeFormBuilderModelSummary(record, "modelDetail");

  return {
    ...model,
    fields: fields.map((entry, index) => normalizeFormBuilderFieldSummary(entry, `modelDetail.fields[${index}]`)),
    selectedViewId: normalizeOptionalString(record.selectedViewId),
    views: views.map((entry, index) => normalizeFormBuilderViewSummary(entry, `modelDetail.views[${index}]`)),
  };
}

function normalizeFormBuilderViewDetail(payload: unknown): FormBuilderViewDetail {
  const record = normalizeJsonRecord(payload, "viewDetail");

  return {
    draft: record.draft === undefined ? undefined : normalizeJsonRecord(record.draft, "viewDetail.draft"),
    model: normalizeFormBuilderModelSummary(record.model, "viewDetail.model"),
    view: normalizeFormBuilderViewSummary(record.view, "viewDetail.view"),
  };
}

function normalizeFormBuilderDraftResponse(payload: unknown): FormBuilderDraftResponse {
  if (!isRecord(payload)) {
    throw new ApiClientError("Invalid form builder draft payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  const draft = normalizeJsonRecord(payload.draft, "draft");
  const publishState = normalizeJsonRecord(payload.publishState, "publishState");
  const validationSummary = normalizeJsonRecord(payload.validationSummary, "validationSummary");

  return {
    draft: {
      model: normalizeJsonRecord(draft.model, "draft.model"),
      view: normalizeJsonRecord(draft.view, "draft.view"),
    },
    publishState: {
      hasUnpublishedChanges: assertBoolean(publishState.hasUnpublishedChanges, "publishState.hasUnpublishedChanges"),
      lastPublishedAt: typeof publishState.lastPublishedAt === "string" ? publishState.lastPublishedAt : undefined,
      lastPublishedBy: typeof publishState.lastPublishedBy === "string" ? publishState.lastPublishedBy : undefined,
      modelPublishedVersion: assertNonNegativeInteger(
        publishState.modelPublishedVersion,
        "publishState.modelPublishedVersion",
      ),
      modelVersion: assertPositiveInteger(publishState.modelVersion, "publishState.modelVersion"),
      viewPublishedVersion: assertNonNegativeInteger(
        publishState.viewPublishedVersion,
        "publishState.viewPublishedVersion",
      ),
      viewVersion: assertPositiveInteger(publishState.viewVersion, "publishState.viewVersion"),
    },
    validationSummary: {
      canPublish: assertBoolean(validationSummary.canPublish, "validationSummary.canPublish"),
      canSave: assertBoolean(validationSummary.canSave, "validationSummary.canSave"),
      errors: normalizeValidationMessages(validationSummary.errors, "validationSummary.errors"),
      warnings: normalizeValidationMessages(validationSummary.warnings, "validationSummary.warnings"),
    },
  };
}

function normalizeOtpRequestData(payload: unknown): AuthOtpRequestData {
  if (!isRecord(payload)) {
    throw new ApiClientError("Invalid OTP request payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    otp_length: assertPositiveInteger(payload.otp_length, "otp_length"),
    status: assertString(payload.status, "status"),
  };
}

function normalizeAuthTokenData(payload: unknown): AuthTokenData {
  if (!isRecord(payload)) {
    throw new ApiClientError("Invalid token payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    access_token: assertString(payload.access_token, "access_token"),
    expires_in: assertPositiveInteger(payload.expires_in, "expires_in"),
  };
}

function normalizeTenantProfile(payload: unknown): TenantProfile {
  if (!isRecord(payload) || !isRecord(payload.user) || !isRecord(payload.tenant)) {
    throw new ApiClientError("Invalid tenant profile payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    tenant: {
      ...payload.tenant,
      id: assertString(payload.tenant.id, "tenant.id"),
    },
    user: {
      ...payload.user,
      id: assertString(payload.user.id, "user.id"),
    },
  };
}

function normalizeTenantFavoriteShortcut(payload: unknown): TenantFavoriteShortcut {
  if (!isRecord(payload)) {
    throw new ApiClientError("Invalid tenant favorite payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    id: assertString(payload.id, "favorites[].id"),
    model_id: assertString(payload.modelId, "favorites[].modelId"),
    model_title: assertString(payload.modelTitle, "favorites[].modelTitle"),
    route_path: assertString(payload.routePath, "favorites[].routePath"),
    target_type: assertString(payload.targetType, "favorites[].targetType"),
    title: assertString(payload.title, "favorites[].title"),
    view_id: assertString(payload.viewId, "favorites[].viewId"),
  };
}

function normalizeTenantFavorites(payload: unknown): TenantFavoriteShortcut[] {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new ApiClientError("Invalid tenant favorites payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return payload.items.map((item) => normalizeTenantFavoriteShortcut(item));
}

function normalizeTenantBusinessTreeNodeKind(value: unknown, fieldName: string): TenantBusinessTreeNodeKind {
  const kind = assertString(value, fieldName);
  if (
    kind !== "company" &&
    kind !== "contactsGroup" &&
    kind !== "projectsGroup" &&
    kind !== "contact" &&
    kind !== "project"
  ) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }
  return kind;
}

function normalizeTenantBusinessTreeNode(payload: unknown, fieldName: string): TenantBusinessTreeNode {
  const record = normalizeJsonRecord(payload, fieldName);

  return {
    childCount: normalizeOptionalNonNegativeInteger(record.childCount, `${fieldName}.childCount`) ?? 0,
    expandable: assertBoolean(record.expandable, `${fieldName}.expandable`),
    id: assertString(record.id, `${fieldName}.id`),
    kind: normalizeTenantBusinessTreeNodeKind(record.kind, `${fieldName}.kind`),
    label: assertString(record.label, `${fieldName}.label`),
  };
}

function normalizeTenantBusinessTreeNodesResponse(payload: unknown): TenantBusinessTreeNodesResponse {
  const record = normalizeJsonRecord(payload, "businessTree");
  if (!Array.isArray(record.nodes)) {
    throw new ApiClientError("Invalid businessTree.nodes received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    nodes: record.nodes.map((node, index) => normalizeTenantBusinessTreeNode(node, `businessTree.nodes[${index}]`)),
    parentId: assertString(record.parentId, "businessTree.parentId"),
  };
}

function normalizeTenantNavigationNodeType(value: unknown, fieldName: string): TenantNavigationNodeType {
  const nodeType = assertString(value, fieldName);
  if (
    nodeType !== "menu_title" &&
    nodeType !== "menu_group" &&
    nodeType !== "form_view" &&
    nodeType !== "app_page" &&
    nodeType !== "external_link" &&
    nodeType !== "app_module"
  ) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }
  return nodeType;
}

function normalizeTenantNavigationTargetType(value: unknown, fieldName: string): TenantNavigationTargetType {
  const targetType = assertString(value, fieldName);
  if (
    targetType !== "form_view" &&
    targetType !== "app_page" &&
    targetType !== "external_link" &&
    targetType !== "app_module"
  ) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }
  return targetType;
}

function normalizeTenantNavigationTarget(payload: unknown, fieldName: string): TenantNavigationTarget {
  const record = normalizeJsonRecord(payload, fieldName);

  return {
    modelId: normalizeOptionalString(record.modelId),
    moduleId: normalizeOptionalString(record.moduleId),
    pageId: normalizeOptionalString(record.pageId),
    route: normalizeOptionalString(record.route),
    type: normalizeTenantNavigationTargetType(record.type, `${fieldName}.type`),
    url: normalizeOptionalString(record.url),
    viewId: normalizeOptionalString(record.viewId),
  };
}

function normalizeTenantNavigationNode(payload: unknown, fieldName: string): TenantNavigationNode {
  const record = normalizeJsonRecord(payload, fieldName);
  const children = Array.isArray(record.children) ? record.children : [];

  return {
    access: record.access,
    active: typeof record.active === "boolean" ? record.active : undefined,
    channel: normalizeOptionalString(record.channel),
    children: children.map((entry, index) => normalizeTenantNavigationNode(entry, `${fieldName}.children[${index}]`)),
    icon: normalizeOptionalString(record.icon),
    id: assertString(record.id, `${fieldName}.id`),
    label: assertString(record.label, `${fieldName}.label`),
    meta: record.meta,
    target: record.target === undefined || record.target === null
      ? undefined
      : normalizeTenantNavigationTarget(record.target, `${fieldName}.target`),
    type: normalizeTenantNavigationNodeType(record.type, `${fieldName}.type`),
  };
}

function normalizeTenantNavigationRailItem(payload: unknown, fieldName: string): TenantNavigationRailItem {
  const record = normalizeJsonRecord(payload, fieldName);

  return {
    access: record.access,
    active: typeof record.active === "boolean" ? record.active : undefined,
    id: assertString(record.id, `${fieldName}.id`),
    key: assertString(record.key, `${fieldName}.key`),
    label: assertString(record.label, `${fieldName}.label`),
  };
}

function normalizeTenantNavigationDefinition(payload: unknown): TenantNavigationDefinition {
  const record = normalizeJsonRecord(payload, "navigationDefinition");
  const appMenu = Array.isArray(record.appMenu) ? record.appMenu : [];
  const utilityRail = Array.isArray(record.utilityRail) ? record.utilityRail : [];

  return {
    appMenu: appMenu.map((entry, index) => normalizeTenantNavigationNode(entry, `navigationDefinition.appMenu[${index}]`)),
    schemaVersion: assertPositiveInteger(record.schemaVersion, "navigationDefinition.schemaVersion"),
    utilityRail: utilityRail.map((entry, index) => normalizeTenantNavigationRailItem(entry, `navigationDefinition.utilityRail[${index}]`)),
  };
}

function normalizeTenantNavigationValidationSummary(payload: unknown): TenantNavigationValidationSummary {
  const record = normalizeJsonRecord(payload, "navigationValidationSummary");

  return {
    canSave: assertBoolean(record.canSave, "navigationValidationSummary.canSave"),
    errors: normalizeValidationMessages(record.errors, "navigationValidationSummary.errors"),
    warnings: normalizeValidationMessages(record.warnings, "navigationValidationSummary.warnings"),
  };
}

function normalizeTenantNavigationConfigResponse(payload: unknown): TenantNavigationConfigResponse {
  const record = normalizeJsonRecord(payload, "navigationConfig");

  return {
    configKey: assertString(record.configKey, "navigationConfig.configKey"),
    definition: normalizeTenantNavigationDefinition(record.definition),
    updatedAt: normalizeOptionalString(record.updatedAt),
    updatedBy: normalizeOptionalString(record.updatedBy),
    validationSummary: normalizeTenantNavigationValidationSummary(record.validationSummary),
    version: assertNonNegativeInteger(record.version, "navigationConfig.version"),
  };
}

function normalizeTenantNavigationAccessOption(payload: unknown, fieldName: string): TenantNavigationAccessOption {
  const record = normalizeJsonRecord(payload, fieldName);

  return {
    fields: normalizeOptionalStringRecord(record.fields, `${fieldName}.fields`),
    id: assertString(record.id, `${fieldName}.id`),
    label: assertString(record.label, `${fieldName}.label`),
    subtitle: normalizeOptionalString(record.subtitle),
  };
}

function normalizeTenantNavigationAccessOptionCategory(
  value: unknown,
  fieldName: string,
): TenantNavigationAccessOptionCategory {
  if (value === "companies" || value === "companyTypes" || value === "jobtypes" || value === "users") {
    return value;
  }
  throw new ApiClientError(`${fieldName} was not a valid access option category.`, { payload: value });
}

function normalizeTenantNavigationAccessOptionPageResponse(payload: unknown): TenantNavigationAccessOptionPageResponse {
  const record = normalizeJsonRecord(payload, "navigationAccessOptionPage");
  const items = Array.isArray(record.items) ? record.items : [];

  return {
    category: normalizeTenantNavigationAccessOptionCategory(record.category, "navigationAccessOptionPage.category"),
    hasMore: Boolean(record.hasMore),
    items: items.map((entry, index) =>
      normalizeTenantNavigationAccessOption(entry, `navigationAccessOptionPage.items[${index}]`)),
    page: assertNonNegativeInteger(record.page, "navigationAccessOptionPage.page"),
    pageSize: assertNonNegativeInteger(record.pageSize, "navigationAccessOptionPage.pageSize"),
    total: assertNonNegativeInteger(record.total, "navigationAccessOptionPage.total"),
  };
}

function normalizeTenantNavigationAccessOptionsResponse(payload: unknown): TenantNavigationAccessOptionsResponse {
  const record = normalizeJsonRecord(payload, "navigationAccessOptions");
  const users = Array.isArray(record.users) ? record.users : [];
  const companies = Array.isArray(record.companies) ? record.companies : [];
  const companyTypes = Array.isArray(record.companyTypes) ? record.companyTypes : [];
  const jobtypes = Array.isArray(record.jobtypes) ? record.jobtypes : [];

  return {
    companies: companies.map((entry, index) =>
      normalizeTenantNavigationAccessOption(entry, `navigationAccessOptions.companies[${index}]`)),
    companyTypes: companyTypes.map((entry, index) =>
      normalizeTenantNavigationAccessOption(entry, `navigationAccessOptions.companyTypes[${index}]`)),
    jobtypes: jobtypes.map((entry, index) =>
      normalizeTenantNavigationAccessOption(entry, `navigationAccessOptions.jobtypes[${index}]`)),
    users: users.map((entry, index) =>
      normalizeTenantNavigationAccessOption(entry, `navigationAccessOptions.users[${index}]`)),
  };
}

function normalizeTenantDictionaryOption(payload: unknown, fieldName: string): TenantDictionaryOption {
  const record = normalizeJsonRecord(payload, fieldName);
  const id = assertString(record.id, `${fieldName}.id`);
  const value = typeof record.value === "string" ? record.value : id;

  return {
    description: normalizeOptionalString(record.description),
    fields: normalizeOptionalStringRecord(record.fields, `${fieldName}.fields`),
    id,
    label: assertString(record.label, `${fieldName}.label`),
    value,
  };
}

function normalizeTenantDictionaryOptionsResponse(payload: unknown): TenantDictionaryOptionsResponse {
  const record = normalizeJsonRecord(payload, "dictionaryOptions");
  const items = Array.isArray(record.items) ? record.items : [];

  return {
    dictionary: assertString(record.dictionary, "dictionaryOptions.dictionary"),
    hasMore: Boolean(record.hasMore),
    items: items.map((entry, index) => normalizeTenantDictionaryOption(entry, `dictionaryOptions.items[${index}]`)),
    page: assertNonNegativeInteger(record.page, "dictionaryOptions.page"),
    pageSize: assertNonNegativeInteger(record.pageSize, "dictionaryOptions.pageSize"),
    total: assertNonNegativeInteger(record.total, "dictionaryOptions.total"),
  };
}

function normalizeStringArray(payload: unknown, fieldName: string) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry, index) => assertString(entry, `${fieldName}[${index}]`));
}

function normalizeTenantRuntimeNavigationItem(payload: unknown, fieldName: string): TenantRuntimeNavigationItem {
  const record = normalizeJsonRecord(payload, fieldName);
  const children = Array.isArray(record.children) ? record.children : [];

  return {
    breadcrumb: normalizeStringArray(record.breadcrumb, `${fieldName}.breadcrumb`),
    children: children.map((entry, index) => normalizeTenantRuntimeNavigationItem(entry, `${fieldName}.children[${index}]`)),
    externalUrl: normalizeOptionalString(record.externalUrl),
    icon: normalizeOptionalString(record.icon),
    id: assertString(record.id, `${fieldName}.id`),
    key: normalizeOptionalString(record.key),
    label: assertString(record.label, `${fieldName}.label`),
    path: normalizeOptionalString(record.path),
    targetType: normalizeOptionalString(record.targetType),
    type: assertString(record.type, `${fieldName}.type`),
  };
}

function normalizeTenantRuntimeCreateAction(payload: unknown, fieldName: string): TenantRuntimeCreateAction {
  const record = normalizeJsonRecord(payload, fieldName);

  return {
    breadcrumb: normalizeStringArray(record.breadcrumb, `${fieldName}.breadcrumb`),
    id: assertString(record.id, `${fieldName}.id`),
    label: assertString(record.label, `${fieldName}.label`),
    modelId: normalizeOptionalString(record.modelId),
    path: assertString(record.path, `${fieldName}.path`),
    targetType: assertString(record.targetType, `${fieldName}.targetType`),
    viewId: normalizeOptionalString(record.viewId),
  };
}

function normalizeTenantRuntimeNavigationResponse(payload: unknown): TenantRuntimeNavigationResponse {
  const record = normalizeJsonRecord(payload, "runtimeNavigation");
  const createActions = Array.isArray(record.createActions) ? record.createActions : [];
  const items = Array.isArray(record.items) ? record.items : [];
  const utilityRail = Array.isArray(record.utilityRail) ? record.utilityRail : [];

  return {
    createActions: createActions.map((entry, index) =>
      normalizeTenantRuntimeCreateAction(entry, `runtimeNavigation.createActions[${index}]`)),
    items: items.map((entry, index) => normalizeTenantRuntimeNavigationItem(entry, `runtimeNavigation.items[${index}]`)),
    utilityRail: utilityRail.map((entry, index) => normalizeTenantRuntimeNavigationItem(entry, `runtimeNavigation.utilityRail[${index}]`)),
    utilityRailConfigured: record.utilityRailConfigured === true,
  };
}

function normalizeAdminProfile(payload: unknown): AdminProfile {
  if (!isRecord(payload) || !isRecord(payload.user)) {
    throw new ApiClientError("Invalid admin profile payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    user: {
      ...payload.user,
      id: assertString(payload.user.id, "user.id"),
    },
  };
}

function normalizeAdminEmployeeDetail(payload: unknown): AdminEmployeeDetail {
  if (!isRecord(payload) || !isRecord(payload.user)) {
    throw new ApiClientError("Invalid admin employee payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    user: {
      ...payload.user,
      createdAt: typeof payload.user.createdAt === "string" ? payload.user.createdAt : undefined,
      id: assertString(payload.user.id, "user.id"),
      isCurrentUser: typeof payload.user.isCurrentUser === "boolean"
        ? payload.user.isCurrentUser
        : false,
    },
  };
}

function normalizeAdminNavigationAccess(value: unknown, fieldName: string): AdminNavigationAccess {
  const access = assertString(value, fieldName);

  if (access !== "read" && access !== "write") {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }

  return access;
}

function normalizeAdminNavigationFavorite(payload: unknown): AdminNavigationFavorite {
  if (!isRecord(payload)) {
    throw new ApiClientError("Invalid admin navigation favorite payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    access: normalizeAdminNavigationAccess(payload.access, "favorites[].access"),
    description: typeof payload.description === "string" ? payload.description : undefined,
    id: assertString(payload.id, "favorites[].id"),
    module_icon: typeof payload.module_icon === "string" ? payload.module_icon : undefined,
    module_id: assertString(payload.module_id, "favorites[].module_id"),
    module_key: assertString(payload.module_key, "favorites[].module_key"),
    module_title: assertString(payload.module_title, "favorites[].module_title"),
    route_path: assertString(payload.route_path, "favorites[].route_path"),
    section_key: assertString(payload.section_key, "favorites[].section_key"),
    title: assertString(payload.title, "favorites[].title"),
  };
}

function normalizeAdminNavigationSection(payload: unknown): AdminNavigationSection {
  if (!isRecord(payload)) {
    throw new ApiClientError("Invalid admin navigation section payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    access: normalizeAdminNavigationAccess(payload.access, "modules[].sections[].access"),
    description: typeof payload.description === "string" ? payload.description : undefined,
    icon: typeof payload.icon === "string" ? payload.icon : undefined,
    id: assertString(payload.id, "modules[].sections[].id"),
    route_path: assertString(payload.route_path, "modules[].sections[].route_path"),
    section_key: assertString(payload.section_key, "modules[].sections[].section_key"),
    title: assertString(payload.title, "modules[].sections[].title"),
  };
}

function normalizeAdminNavigationModule(payload: unknown): AdminNavigationModule {
  if (!isRecord(payload) || !Array.isArray(payload.sections)) {
    throw new ApiClientError("Invalid admin navigation module payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    description: typeof payload.description === "string" ? payload.description : undefined,
    icon: typeof payload.icon === "string" ? payload.icon : undefined,
    id: assertString(payload.id, "modules[].id"),
    module_key: assertString(payload.module_key, "modules[].module_key"),
    sections: payload.sections.map((section) => normalizeAdminNavigationSection(section)),
    title: assertString(payload.title, "modules[].title"),
  };
}

function normalizeAdminNavigation(payload: unknown): AdminNavigation {
  if (!isRecord(payload) || !Array.isArray(payload.favorites) || !Array.isArray(payload.modules)) {
    throw new ApiClientError("Invalid admin navigation payload received from API.", {
      code: "invalid_payload",
      payload,
    });
  }

  return {
    favorites: payload.favorites.map((favorite) => normalizeAdminNavigationFavorite(favorite)),
    is_root: typeof payload.is_root === "boolean" ? payload.is_root : false,
    modules: payload.modules.map((module) => normalizeAdminNavigationModule(module)),
  };
}

function isUnauthorizedApiError(error: unknown): error is ApiClientError {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  if (error.statusCode === 401) {
    return true;
  }

  return error.responseStatus === "unauthorized"
    || typeof error.code === "string" && error.code.endsWith("_UNAUTHORIZED");
}

async function requestWithUnauthorizedRetry<T>(
  request: (accessToken: string) => Promise<T>,
  options: {
    accessToken: string;
    onUnauthorized?: (error: ApiClientError) => Promise<string | null | undefined>;
  },
) {
  try {
    return await request(options.accessToken);
  } catch (error) {
    if (!isUnauthorizedApiError(error) || !options.onUnauthorized) {
      throw error;
    }

    const nextAccessToken = await options.onUnauthorized(error);
    if (!nextAccessToken || nextAccessToken === options.accessToken) {
      throw error;
    }

    return request(nextAccessToken);
  }
}

function createApiClient(baseUrl: string): ApiClient {
  return {
    async getHealth() {
      const completeRequestActivity = beginApiClientRequestActivity();

      try {
        const response = await fetch(`${normalizeBaseUrl(baseUrl)}/health`);
        return {
          status: response.ok ? "ok" : "degraded",
          checkedAt: new Date().toISOString(),
        };
      } catch {
        return {
          status: "degraded",
          checkedAt: new Date().toISOString(),
        };
      } finally {
        completeRequestActivity();
      }
    },
  };
}

function createAuthClient(baseUrl: string): AuthClient {
  return {
    async logout(input) {
      await requestEnvelope(baseUrl, "/logout", {
        allowEmptySuccess: true,
        body: {
          all_devices: input?.allDevices ?? false,
        },
        credentials: "include",
        timeoutMs: authRequestTimeoutMs,
      });
    },
    async refresh() {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/refresh", {
        credentials: "include",
        method: "POST",
        timeoutMs: authRequestTimeoutMs,
      });

      return normalizeAuthTokenData(envelope.data);
    },
    async requestAdminOtp(identifier) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/admin/otp/request", {
        body: identifier,
        credentials: "include",
        timeoutMs: authRequestTimeoutMs,
      });

      return normalizeOtpRequestData(envelope.data);
    },
    async requestOtp(identifier) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/otp/request", {
        body: identifier,
        credentials: "include",
        timeoutMs: authRequestTimeoutMs,
      });

      return normalizeOtpRequestData(envelope.data);
    },
    async verifyAdminOtp(input) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/admin/otp/verify", {
        body: input,
        credentials: "include",
        timeoutMs: authRequestTimeoutMs,
      });

      return normalizeAuthTokenData(envelope.data);
    },
    async verifyOtp(input) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/otp/verify", {
        body: input,
        credentials: "include",
        timeoutMs: authRequestTimeoutMs,
      });

      return normalizeAuthTokenData(envelope.data);
    },
  };
}

function createTenantProfileClient(baseUrl: string): TenantProfileClient {
  return {
    async getProfile(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/profile", {
        accessToken,
        method: "GET",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });

      return normalizeTenantProfile(envelope.data);
    },
  };
}

function createTenantFavoritesClient(baseUrl: string): TenantFavoritesClient {
  return {
    async getFavorites(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/me/favorites", {
        accessToken,
        method: "GET",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });

      return normalizeTenantFavorites(envelope.data);
    },
  };
}

function createTenantBusinessTreeClient(baseUrl: string): TenantBusinessTreeClient {
  return {
    async getNodes(accessToken: string, parentId = "root") {
      const normalizedParentId = parentId.trim() || "root";
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/pages/business-tree/nodes?parent=${encodeURIComponent(normalizedParentId)}`,
        {
          accessToken,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeTenantBusinessTreeNodesResponse(envelope.data);
    },
  };
}

function buildTenantNavigationAccessOptionPagePath(request: TenantNavigationAccessOptionPageRequest) {
  const searchParams = new URLSearchParams();
  searchParams.set("category", request.category);
  if (request.search?.trim()) {
    searchParams.set("search", request.search.trim());
  }
  if (typeof request.page === "number") {
    searchParams.set("page", String(request.page));
  }
  if (typeof request.pageSize === "number") {
    searchParams.set("pageSize", String(request.pageSize));
  }
  for (const id of request.ids ?? []) {
    if (id.trim()) {
      searchParams.append("ids", id.trim());
    }
  }
  return `/app/platform-studio/navigation/access-options/page?${searchParams.toString()}`;
}

function buildTenantDictionaryOptionsPath(request: TenantDictionaryOptionsRequest) {
  const dictionary = request.dictionary?.trim() ?? "";
  if (!dictionary) {
    throw new ApiClientError("Dictionary key is required.");
  }
  const searchParams = new URLSearchParams();
  if (request.search?.trim()) {
    searchParams.set("search", request.search.trim());
  }
  if (typeof request.page === "number") {
    searchParams.set("page", String(request.page));
  }
  if (typeof request.pageSize === "number") {
    searchParams.set("pageSize", String(request.pageSize));
  }
  for (const id of request.ids ?? []) {
    if (id.trim()) {
      searchParams.append("ids", id.trim());
    }
  }
  const suffix = searchParams.toString();
  return `/app/dictionaries/${encodeURIComponent(dictionary)}/options${suffix ? `?${suffix}` : ""}`;
}

function shouldQueryTenantDictionaryOptions(request: TenantDictionaryOptionsRequest) {
  return Boolean(request.sourceModel?.trim() || request.filters?.length);
}

function buildTenantDictionaryOptionsQueryBody(request: TenantDictionaryOptionsRequest): TenantDictionaryOptionsRequest {
  return {
    dictionary: request.dictionary?.trim() || undefined,
    displayFields: request.displayFields?.map((field) => field.trim()).filter(Boolean),
    filters: request.filters,
    ids: request.ids?.map((id) => id.trim()).filter(Boolean),
    page: request.page,
    pageSize: request.pageSize,
    search: request.search?.trim() || undefined,
    searchFields: request.searchFields?.map((field) => field.trim()).filter(Boolean),
    sortField: request.sortField?.trim() || undefined,
    sourceModel: request.sourceModel?.trim() || undefined,
    storedValueField: request.storedValueField?.trim() || undefined,
  };
}

function createTenantDictionaryClient(baseUrl: string): TenantDictionaryClient {
  return {
    async loadOptions(accessToken: string, request: TenantDictionaryOptionsRequest) {
      if (shouldQueryTenantDictionaryOptions(request)) {
        const envelope = await requestEnvelope<unknown>(
          baseUrl,
          "/app/dictionaries/options/query",
          {
            accessToken,
            body: buildTenantDictionaryOptionsQueryBody(request),
            method: "POST",
            timeoutMs: profileBootstrapRequestTimeoutMs,
          },
        );

        return normalizeTenantDictionaryOptionsResponse(envelope.data);
      }

      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        buildTenantDictionaryOptionsPath(request),
        {
          accessToken,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeTenantDictionaryOptionsResponse(envelope.data);
    },
  };
}

function createTenantNavigationClient(baseUrl: string): TenantNavigationClient {
  return {
    async getRuntimeNavigation(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/navigation", {
        accessToken,
        method: "GET",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });

      return normalizeTenantRuntimeNavigationResponse(envelope.data);
    },
    async loadAccessOptionPage(accessToken: string, request: TenantNavigationAccessOptionPageRequest) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        buildTenantNavigationAccessOptionPagePath(request),
        {
          accessToken,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeTenantNavigationAccessOptionPageResponse(envelope.data);
    },
    async loadAccessOptions(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/platform-studio/navigation/access-options", {
        accessToken,
        method: "GET",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });

      return normalizeTenantNavigationAccessOptionsResponse(envelope.data);
    },
    async loadConfig(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/platform-studio/navigation", {
        accessToken,
        method: "GET",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });

      return normalizeTenantNavigationConfigResponse(envelope.data);
    },
    async saveConfig(accessToken: string, input: TenantNavigationSaveInput) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/platform-studio/navigation", {
        accessToken,
        body: {
          definition: input.definition,
          expectedVersion: input.expectedVersion,
        },
        method: "PUT",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });

      return normalizeTenantNavigationConfigResponse(envelope.data);
    },
  };
}

function createTenantFormBuilderAuthoringClient(baseUrl: string): TenantFormBuilderAuthoringClient {
  return {
    async copyView(accessToken: string, modelId: string, viewId: string, input?: FormBuilderCopyViewInput) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}/views/${encodeURIComponent(viewId)}/copy`,
        {
          accessToken,
          body: input ?? {},
          method: "POST",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeFormBuilderModelDetail(envelope.data);
    },
    async createModel(accessToken: string, input: FormBuilderCreateModelInput) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/platform-studio/forms/models", {
        accessToken,
        body: input,
        method: "POST",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });

      return normalizeFormBuilderModelDetail(envelope.data);
    },
    async createView(accessToken: string, modelId: string, input: FormBuilderCreateViewInput) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}/views`,
        {
          accessToken,
          body: input,
          method: "POST",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeFormBuilderModelDetail(envelope.data);
    },
    async deleteModel(accessToken: string, modelId: string) {
      const envelope = await requestEnvelope<{ deletedModelId?: string }>(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}`,
        {
          accessToken,
          method: "DELETE",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return {
        deletedModelId: typeof envelope.data?.deletedModelId === "string" ? envelope.data.deletedModelId : modelId,
      };
    },
    async deleteView(accessToken: string, modelId: string, viewId: string) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}/views/${encodeURIComponent(viewId)}`,
        {
          accessToken,
          method: "DELETE",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeFormBuilderModelDetail(envelope.data);
    },
    async exportModelBundle(accessToken: string, modelId: string) {
      return requestFile(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}/export/model`,
        {
          accessToken,
          fallbackFileName: `${modelId}-model.json`,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );
    },
    async exportModelData(accessToken: string, modelId: string) {
      return requestFile(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}/export/data`,
        {
          accessToken,
          fallbackFileName: `${modelId}-data.csv`,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );
    },
    async getModel(accessToken: string, modelId: string) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}`,
        {
          accessToken,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeFormBuilderModelDetail(envelope.data);
    },
    async getView(accessToken: string, modelId: string, viewId: string) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}/views/${encodeURIComponent(viewId)}`,
        {
          accessToken,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeFormBuilderViewDetail(envelope.data);
    },
    async listCatalog(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/platform-studio/forms/catalog", {
        accessToken,
        method: "GET",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });
      const payload = normalizeJsonRecord(envelope.data, "modelCatalog");
      const items = Array.isArray(payload.items) ? payload.items : [];

      return items.map((entry, index) => normalizeFormBuilderModelCatalogItem(entry, `modelCatalog.items[${index}]`));
    },
    async listModels(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/platform-studio/forms/models", {
        accessToken,
        method: "GET",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });
      const payload = normalizeJsonRecord(envelope.data, "modelList");
      const items = Array.isArray(payload.items) ? payload.items : [];

      return items.map((entry, index) => normalizeFormBuilderModelSummary(entry, `modelList.items[${index}]`));
    },
    async listViews(accessToken: string, modelId: string) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}/views`,
        {
          accessToken,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );
      const payload = normalizeJsonRecord(envelope.data, "viewList");
      const items = Array.isArray(payload.items) ? payload.items : [];

      return items.map((entry, index) => normalizeFormBuilderViewSummary(entry, `viewList.items[${index}]`));
    },
  };
}

function createTenantFormBuilderDraftClient(baseUrl: string): TenantFormBuilderDraftClient {
  return {
    async loadDraft(accessToken: string, modelId: string, viewId: string) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}/views/${encodeURIComponent(viewId)}/authoring`,
        {
          accessToken,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeFormBuilderDraftResponse(envelope.data);
    },
    async saveDraft(accessToken: string, modelId: string, viewId: string, input: FormBuilderSaveDraftInput) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/platform-studio/forms/models/${encodeURIComponent(modelId)}/views/${encodeURIComponent(viewId)}/authoring`,
        {
          accessToken,
          body: {
            draft: input.draft,
            expectedVersions: input.expectedVersions ?? {},
          },
          method: "PUT",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeFormBuilderDraftResponse(envelope.data);
    },
  };
}

function createAdminProfileClient(baseUrl: string): AdminProfileClient {
  return {
    async getProfile(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/profile", {
        accessToken,
        method: "GET",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });

      return normalizeAdminProfile(envelope.data);
    },
  };
}

function createAdminNavigationClient(baseUrl: string): AdminNavigationClient {
  return {
    async getNavigation(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/me/navigation", {
        accessToken,
        method: "GET",
        timeoutMs: profileBootstrapRequestTimeoutMs,
      });

      return normalizeAdminNavigation(envelope.data);
    },
  };
}

function createAdminEmployeesClient(baseUrl: string): AdminEmployeesClient {
  return {
    async getEmployee(accessToken: string, employeeId: string) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/admin/employees/${encodeURIComponent(employeeId)}`,
        {
          accessToken,
          method: "GET",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeAdminEmployeeDetail(envelope.data);
    },
    async updateEmployee(accessToken: string, employeeId: string, input: AdminEmployeeUpdateInput) {
      const envelope = await requestEnvelope<unknown>(
        baseUrl,
        `/app/admin/employees/${encodeURIComponent(employeeId)}`,
        {
          accessToken,
          body: input,
          method: "PUT",
          timeoutMs: profileBootstrapRequestTimeoutMs,
        },
      );

      return normalizeAdminEmployeeDetail(envelope.data);
    },
  };
}

export {
  ApiClientError,
  createAdminEmployeesClient,
  createAdminNavigationClient,
  createAdminProfileClient,
  createApiClient,
  createAuthClient,
  createTenantBusinessTreeClient,
  createTenantDictionaryClient,
  createTenantFavoritesClient,
  createTenantFormBuilderAuthoringClient,
  createTenantFormBuilderDraftClient,
  createTenantNavigationClient,
  getApiClientRequestActivitySnapshot,
  createTenantProfileClient,
  isUnauthorizedApiError,
  requestWithUnauthorizedRetry,
  subscribeApiClientRequestActivity,
  trackApiClientRequestActivity,
};
export type {
  AdminEmployee,
  AdminEmployeeDetail,
  AdminEmployeeUpdateInput,
  AdminEmployeesClient,
  AdminNavigation,
  AdminNavigationAccess,
  AdminNavigationClient,
  AdminNavigationFavorite,
  AdminNavigationModule,
  AdminNavigationSection,
  AdminProfile,
  AdminProfileClient,
  ApiClient,
  ApiClientRequestActivitySnapshot,
  ApiHealth,
  AuthClient,
  AuthIdentifier,
  AuthOtpRequestData,
  AuthTokenData,
  BackendEnvelope,
  TenantBusinessTreeClient,
  TenantBusinessTreeNode,
  TenantBusinessTreeNodeKind,
  TenantBusinessTreeNodesResponse,
  TenantDictionaryClient,
  TenantDictionaryFilter,
  TenantDictionaryFilterOperator,
  TenantDictionaryFilterScalar,
  TenantDictionaryKey,
  TenantDictionaryOption,
  TenantDictionaryOptionsRequest,
  TenantDictionaryOptionsResponse,
  TenantNavigationAccessOptionCategory,
  TenantNavigationAccessOptionPageRequest,
  TenantNavigationAccessOptionPageResponse,
  TenantNavigationAccessOption,
  TenantNavigationAccessOptionsResponse,
  TenantNavigationClient,
  TenantNavigationConfigResponse,
  TenantNavigationDefinition,
  TenantNavigationNode,
  TenantNavigationNodeType,
  TenantNavigationRailItem,
  TenantNavigationSaveInput,
  TenantNavigationTarget,
  TenantNavigationTargetType,
  TenantNavigationValidationMessage,
  TenantNavigationValidationSummary,
  TenantRuntimeCreateAction,
  TenantRuntimeNavigationItem,
  TenantRuntimeNavigationResponse,
  FormBuilderDraftPayload,
  FormBuilderDraftPublishState,
  FormBuilderDraftResponse,
  FormBuilderDraftVersions,
  FormBuilderCreateModelInput,
  FormBuilderCreateViewInput,
  FormBuilderCopyViewInput,
  FormBuilderDownloadedFile,
  FormBuilderModelCatalogItem,
  FormBuilderModelDetail,
  FormBuilderModelFieldSummary,
  FormBuilderModelSummary,
  FormBuilderSaveDraftInput,
  FormBuilderValidationMessage,
  FormBuilderValidationSummary,
  FormBuilderViewDetail,
  FormBuilderViewSummary,
  TenantFavoriteShortcut,
  TenantFavoritesClient,
  TenantProfile,
  TenantFormBuilderAuthoringClient,
  TenantFormBuilderDraftClient,
  TenantProfileClient,
};
