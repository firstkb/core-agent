import { validateArtifacts } from "../validation.mjs";

export async function runValidateArtifacts({ target, options }) {
  return validateArtifacts(target, options);
}
