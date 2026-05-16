import { ApiClientError } from "@platform/api-client";

import type { RuntimeFormLoadErrorState } from "./components/form-runtime-load-error";

export function isConflictRuntimeError(requestError: unknown) {
  return requestError instanceof ApiClientError
    && (requestError.code === "FORM_RUNTIME_CONFLICT" || (!requestError.code && requestError.statusCode === 409));
}

export function isRuntimeSchemaDriftError(requestError: unknown) {
  return requestError instanceof ApiClientError
    && requestError.code === "FORM_RUNTIME_SCHEMA_DRIFT";
}

export function isNotFoundRuntimeError(requestError: unknown) {
  return requestError instanceof ApiClientError
    && (
      requestError.statusCode === 404 ||
      requestError.code === "FORM_RUNTIME_MODEL_NOT_FOUND" ||
      requestError.code === "FORM_RUNTIME_VIEW_NOT_FOUND" ||
      requestError.code === "FORM_RUNTIME_RECORD_NOT_FOUND"
    );
}

export function runtimeFormLoadErrorFromRequest(
  requestError: unknown,
  labels: {
    genericDescription: string;
    genericTitle: string;
    notFoundDescription: string;
    notFoundTitle: string;
  },
): RuntimeFormLoadErrorState {
  if (isNotFoundRuntimeError(requestError)) {
    return {
      code: "404",
      description: labels.notFoundDescription,
      title: labels.notFoundTitle,
    };
  }

  return {
    description: labels.genericDescription,
    title: labels.genericTitle,
  };
}
