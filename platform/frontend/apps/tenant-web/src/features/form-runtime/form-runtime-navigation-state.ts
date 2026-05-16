import type {
  RuntimeFormActiveTabs,
  RuntimeFormValues,
} from "@platform/forms";

import type { FormRuntimeFormResponse } from "./form-runtime-collection-table-client";

export type RuntimeFormSessionState = {
  activeTabs?: RuntimeFormActiveTabs;
  docGuid?: string;
  formResponse?: FormRuntimeFormResponse;
  recordId?: number | string;
  revision?: string;
  values?: Record<string, unknown> | RuntimeFormValues;
};

export type RuntimeFormNavigationState = {
  parentRuntimeFormSession?: RuntimeFormSessionState;
  runtimeFormSession?: RuntimeFormSessionState;
};

export function isRuntimeNavigationState(value: unknown): value is RuntimeFormNavigationState {
  return Boolean(value && typeof value === "object" && "runtimeFormSession" in value);
}
