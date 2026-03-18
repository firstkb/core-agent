import fs from "node:fs";

import { validateAgainstSchema } from "./schema-validator.mjs";
import { CliError } from "./errors.mjs";
import { getFeaturePaths, getModulePaths } from "./paths.mjs";
import { getFeatureStatusSchema, getModuleStatusSchema } from "./schemas.mjs";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readAndValidate(filePath, schema, label) {
  if (!fs.existsSync(filePath)) {
    throw new CliError(`${label} is missing: ${filePath}`, 4);
  }

  const value = readJson(filePath);
  const errors = validateAgainstSchema(schema, value, label);

  if (errors.length > 0) {
    throw new CliError(`Invalid ${label}: ${errors.join("; ")}`, 2, { filePath, validationErrors: errors });
  }

  return value;
}

export function readModuleStatus({ moduleId, artifactsRoot }) {
  const modulePaths = getModulePaths({ moduleId, artifactsRoot });
  return readAndValidate(modulePaths.moduleStatusPath, getModuleStatusSchema(), "module_status");
}

export function readFeatureStatus({ moduleId, featureId, artifactsRoot }) {
  const featurePaths = getFeaturePaths({ moduleId, featureId, artifactsRoot });
  return readAndValidate(featurePaths.featureStatusPath, getFeatureStatusSchema(), "feature_status");
}

export function moduleExists({ moduleId, artifactsRoot }) {
  const modulePaths = getModulePaths({ moduleId, artifactsRoot });
  return fs.existsSync(modulePaths.moduleRoot);
}

export function featureExists({ moduleId, featureId, artifactsRoot }) {
  const featurePaths = getFeaturePaths({ moduleId, featureId, artifactsRoot });
  return fs.existsSync(featurePaths.featureRoot);
}
