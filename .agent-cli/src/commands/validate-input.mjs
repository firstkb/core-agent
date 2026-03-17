import { validateInput } from "../validation.mjs";

export async function runValidateInput({ target, options }) {
  const result = validateInput(target, options);

  return {
    ok: result.ok,
    context: result.context,
    checks: result.checks,
    errors: result.errors
  };
}
