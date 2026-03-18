import fs from "node:fs";

import { invariant } from "./errors.mjs";
import { toArtifactRef } from "./paths.mjs";
import { copyFileArtifact } from "./write-state.mjs";

export function createModuleStatus(moduleId, briefPath) {
  return {
    schema_version: 1,
    module_id: moduleId,
    phase: "discussion",
    brief: {
      path: toArtifactRef(briefPath),
      approved: false,
      frozen: false
    },
    owner_approvals: {
      brief: false,
      execution: false
    },
    features: [],
    current_action: "awaiting_owner_input",
    updated_at: new Date().toISOString()
  };
}

export function createFeatureStatus({ moduleId, featureId, readmePath }) {
  return {
    schema_version: 1,
    module_id: moduleId,
    feature_id: featureId,
    phase: "seeded",
    readme_path: toArtifactRef(readmePath),
    current_stage: null,
    next_stage: null,
    active_attempt_id: null,
    latest_attempt_id: null,
    latest_submitted_handoff_ref: null,
    last_reviewed_attempt_id: null,
    last_reviewed_handoff_ref: null,
    last_decision: null,
    last_decision_reason: null,
    blocked_reason: null,
    updated_at: new Date().toISOString()
  };
}

export function appendDecisionBlock(content, { decision, reason, nextStage, complete, reviewedAt }) {
  const lines = [
    "---",
    "",
    "## Orchestrator Decision",
    `- Decision: ${decision}`,
    `- Reason: ${reason}`
  ];

  if (complete) {
    lines.push("- Result: feature complete");
  } else if (nextStage) {
    lines.push(`- Next Stage: ${nextStage}`);
  }

  lines.push(`- Reviewed At: ${reviewedAt}`, "");

  const base = content.endsWith("\n") ? content : `${content}\n`;
  return `${base}${lines.join("\n")}`;
}

export function ensureAttemptDirectory(attemptRoot) {
  fs.mkdirSync(attemptRoot, { recursive: true });
}

export function copyAttemptReadme({ sourcePath, destinationPath }) {
  invariant(sourcePath, "stage submit-handoff requires --readme with an AI-authored attempt README", 4);
  copyFileArtifact(sourcePath, destinationPath);
}
