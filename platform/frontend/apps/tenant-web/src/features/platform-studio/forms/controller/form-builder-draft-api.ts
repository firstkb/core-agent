import {
  ApiClientError,
  type createTenantFormBuilderDraftClient,
} from "@platform/api-client";

type TenantFormBuilderDraftClient = ReturnType<typeof createTenantFormBuilderDraftClient>;

export type FormBuilderDraftLoadClient = Pick<TenantFormBuilderDraftClient, "loadDraft">;
export type FormBuilderDraftSaveClient = Pick<TenantFormBuilderDraftClient, "saveDraft">;

export function isDraftEndpointUnavailable(error: unknown) {
  return error instanceof ApiClientError && error.statusCode === 404;
}
