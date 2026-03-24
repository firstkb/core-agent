import type { AuthContactMethod } from "./public-auth-shell";

const emailAllowedCharactersPattern = /[^a-z0-9.!#$%&'*+/=?^_`{|}~@-]+/gi;

function sanitizeEmailInput(value: string) {
  return value.replace(/\s+/g, "").replace(emailAllowedCharactersPattern, "");
}

function sanitizePhoneInput(value: string) {
  return value.replace(/\D+/g, "");
}

export function sanitizeAuthInputValue(value: string, method: AuthContactMethod) {
  return method === "phone" ? sanitizePhoneInput(value) : sanitizeEmailInput(value);
}

export function normalizeAuthIdentifier(value: string, method: AuthContactMethod) {
  const sanitizedValue = sanitizeAuthInputValue(value, method);

  return method === "email" ? sanitizedValue.toLowerCase() : sanitizedValue;
}
