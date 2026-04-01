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

type AdminProfileClient = {
  getProfile: (accessToken: string) => Promise<AdminProfile>;
};

type JsonRecord = Record<string, unknown>;

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
  },
): Promise<BackendEnvelope<T>> {
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
  try {
    response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
      body,
      credentials: options?.credentials,
      headers,
      method: options?.method ?? (body ? "POST" : "GET"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed.";
    throw new ApiClientError(message, { code: "network_error" });
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

function assertString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiClientError(`Invalid ${fieldName} received from API.`, {
      code: "invalid_payload",
      payload: value,
    });
  }

  return value;
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

function isUnauthorizedApiError(error: unknown) {
  return error instanceof ApiClientError &&
    (error.statusCode === 401 || error.statusCode === 403);
}

function createApiClient(baseUrl: string): ApiClient {
  return {
    async getHealth() {
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
      });
    },
    async refresh() {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/refresh", {
        credentials: "include",
        method: "POST",
      });

      return normalizeAuthTokenData(envelope.data);
    },
    async requestAdminOtp(identifier) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/admin/otp/request", {
        body: identifier,
        credentials: "include",
      });

      return normalizeOtpRequestData(envelope.data);
    },
    async requestOtp(identifier) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/otp/request", {
        body: identifier,
        credentials: "include",
      });

      return normalizeOtpRequestData(envelope.data);
    },
    async verifyAdminOtp(input) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/admin/otp/verify", {
        body: input,
        credentials: "include",
      });

      return normalizeAuthTokenData(envelope.data);
    },
    async verifyOtp(input) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/otp/verify", {
        body: input,
        credentials: "include",
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
      });

      return normalizeTenantProfile(envelope.data);
    },
  };
}

function createAdminProfileClient(baseUrl: string): AdminProfileClient {
  return {
    async getProfile(accessToken: string) {
      const envelope = await requestEnvelope<unknown>(baseUrl, "/app/profile", {
        accessToken,
        method: "GET",
      });

      return normalizeAdminProfile(envelope.data);
    },
  };
}

export {
  ApiClientError,
  createAdminProfileClient,
  createApiClient,
  createAuthClient,
  createTenantProfileClient,
  isUnauthorizedApiError,
};
export type {
  AdminProfile,
  AdminProfileClient,
  ApiClient,
  ApiHealth,
  AuthClient,
  AuthIdentifier,
  AuthOtpRequestData,
  AuthTokenData,
  BackendEnvelope,
  TenantProfile,
  TenantProfileClient,
};
