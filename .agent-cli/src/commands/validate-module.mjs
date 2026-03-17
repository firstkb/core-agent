import { validateModule } from "../module-validation.mjs";

export async function runValidateModule({ target, options }) {
  return validateModule(target, options);
}
