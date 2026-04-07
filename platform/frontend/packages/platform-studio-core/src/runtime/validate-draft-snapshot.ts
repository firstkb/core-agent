import { draftSnapshotSchema } from "../schemas/publish.schema";
import type { DraftSnapshot } from "../contracts/publish";
import type { ValidationReport } from "../contracts/common";

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

export function validateDraftSnapshot(input: unknown): ValidationReport {
  const result = draftSnapshotSchema.safeParse(input);

  if (result.success) {
    return {
      issues: [],
      valid: true,
    };
  }

  return buildValidationReport(result.error);
}

export function parseDraftSnapshot(input: unknown): DraftSnapshot {
  return draftSnapshotSchema.parse(input);
}
