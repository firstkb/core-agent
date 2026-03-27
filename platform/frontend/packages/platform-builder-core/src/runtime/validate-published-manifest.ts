import type { ValidationReport } from "../contracts/common";
import type { PublishedManifest } from "../contracts/publish";
import { publishedManifestSchema } from "../schemas/publish.schema";

function buildValidationReport(error: { issues: Array<{ code: string; message: string; path: Array<string | number> }> }): ValidationReport {
  return {
    issues: error.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: issue.path.length > 0 ? issue.path.join(".") : "<root>",
    })),
    valid: false,
  };
}

export function validatePublishedManifest(input: unknown): ValidationReport {
  const result = publishedManifestSchema.safeParse(input);

  if (result.success) {
    return {
      issues: [],
      valid: true,
    };
  }

  return buildValidationReport(result.error);
}

export function parsePublishedManifest(input: unknown): PublishedManifest {
  return publishedManifestSchema.parse(input);
}
