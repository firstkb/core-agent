import fs from "node:fs";
import path from "node:path";

import { validateAgainstSchema } from "./schema-validator.mjs";
import { CliError } from "./errors.mjs";
import { getFeatureStatusSchema, getModuleStatusSchema, getStageHandoffSchema } from "./schemas.mjs";

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function validateAndWriteJson(filePath, payload, schema, label) {
  const errors = validateAgainstSchema(schema, payload, label);

  if (errors.length > 0) {
    throw new CliError(`Invalid ${label}: ${errors.join("; ")}`, 2, { filePath, validationErrors: errors });
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function stampUpdatedAt(payload) {
  return {
    ...payload,
    updated_at: new Date().toISOString()
  };
}

export function writeModuleStatus(filePath, payload) {
  validateAndWriteJson(filePath, stampUpdatedAt(payload), getModuleStatusSchema(), "module_status");
}

export function writeFeatureStatus(filePath, payload) {
  validateAndWriteJson(filePath, stampUpdatedAt(payload), getFeatureStatusSchema(), "feature_status");
}

export function writeStageHandoff(filePath, payload) {
  validateAndWriteJson(filePath, payload, getStageHandoffSchema(), "stage_handoff");
}

export function writeTextArtifact(filePath, content) {
  writeText(filePath, content);
}

export function appendTextArtifact(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, content, "utf8");
}

export function copyFileArtifact(sourcePath, destinationPath) {
  if (path.resolve(sourcePath) === path.resolve(destinationPath)) {
    return;
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}
