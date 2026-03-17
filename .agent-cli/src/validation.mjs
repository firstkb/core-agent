import fs from "node:fs";
import path from "node:path";

import { validateAgainstSchema } from "./lib/schema-validator.mjs";
import { getArtifactPaths, getTargetPaths, getTargetRequiredOptions, toPosix } from "./paths.mjs";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeOptionKey(key) {
  return key.replace(/-/g, "_");
}

function validateRuntimeTrace(statusData, expectedRunDir, errors) {
  const runtime = statusData?.runtime;

  if (!runtime || typeof runtime !== "object") {
    errors.push("status.runtime must be an object");
    return false;
  }

  const { execution_mode: executionMode, agent_profile: agentProfile, run_dir: runDir } = runtime;

  if (executionMode !== "inline" && executionMode !== "sub_agent") {
    errors.push('status.runtime.execution_mode must be "inline" or "sub_agent"');
    return false;
  }

  if (executionMode === "inline" && agentProfile !== null) {
    errors.push("status.runtime.agent_profile must be null when execution_mode=inline");
    return false;
  }

  if (executionMode === "sub_agent" && (typeof agentProfile !== "string" || agentProfile.trim() === "")) {
    errors.push("status.runtime.agent_profile must be a non-empty string when execution_mode=sub_agent");
    return false;
  }

  if (typeof runDir !== "string" || runDir.trim() === "") {
    errors.push("status.runtime.run_dir must be a non-empty string");
    return false;
  }

  if (runDir !== expectedRunDir) {
    errors.push(`status.runtime.run_dir must equal ${expectedRunDir}`);
    return false;
  }

  return true;
}

function validateArtifactPaths(statusData, artifactDefinitions, expectedArtifactPaths, repoRoot, errors) {
  const artifactMap = statusData?.artifacts;

  if (!artifactMap || typeof artifactMap !== "object") {
    errors.push("status.artifacts must be an object");
    return false;
  }

  let ok = true;

  for (const [artifactKey, expectedPath] of Object.entries(expectedArtifactPaths)) {
    const actualPath = artifactMap[artifactKey];
    const isRequired = artifactDefinitions[artifactKey]?.required !== false;

    if (actualPath === null) {
      if (isRequired) {
        errors.push(`status.artifacts.${artifactKey} must be a non-empty string`);
        ok = false;
      }

      continue;
    }

    if (typeof actualPath !== "string" || actualPath.trim() === "") {
      errors.push(`status.artifacts.${artifactKey} must be a non-empty string${isRequired ? "" : " or null"}`);
      ok = false;
      continue;
    }

    if (actualPath !== expectedPath) {
      errors.push(`status.artifacts.${artifactKey} must equal ${expectedPath}`);
      ok = false;
    }

    const artifactFilePath = path.join(repoRoot, actualPath);

    if (!fs.existsSync(artifactFilePath)) {
      errors.push(`missing artifact: ${toPosix(path.relative(repoRoot, artifactFilePath))}`);
      ok = false;
    }
  }

  return ok;
}

function getAllowedValidationKeys(statusSchema) {
  const validationProperties = statusSchema?.properties?.validation?.properties;

  if (!validationProperties || typeof validationProperties !== "object") {
    return [];
  }

  return Object.keys(validationProperties);
}

function sanitizeValidationState(statusSchema, statusData) {
  if (!statusData || typeof statusData !== "object") {
    return statusData;
  }

  const currentValidation = statusData.validation;

  if (!currentValidation || typeof currentValidation !== "object" || Array.isArray(currentValidation)) {
    return statusData;
  }

  const allowedKeys = new Set(getAllowedValidationKeys(statusSchema));
  const nextValidation = {};
  let changed = false;

  for (const [key, value] of Object.entries(currentValidation)) {
    if (allowedKeys.has(key)) {
      nextValidation[key] = value;
      continue;
    }

    changed = true;
  }

  if (!changed) {
    return statusData;
  }

  return {
    ...statusData,
    validation: nextValidation
  };
}

function buildPersistedValidationState(statusSchema, currentValidation, nextValidation) {
  const allowedKeys = getAllowedValidationKeys(statusSchema);
  const persistedValidation = {};

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(nextValidation, key)) {
      persistedValidation[key] = nextValidation[key];
      continue;
    }

    if (currentValidation && Object.prototype.hasOwnProperty.call(currentValidation, key)) {
      persistedValidation[key] = currentValidation[key];
    }
  }

  return persistedValidation;
}

function buildInputPayload(target, options) {
  if (options["input-json"]) {
    return JSON.parse(options["input-json"]);
  }

  if (options["input-file"]) {
    return readJson(path.resolve(getTargetPaths(target).repoRoot, options["input-file"]));
  }

  const payload = {};
  const skippedKeys = new Set(["json", "write-status", "artifact-language", "artifacts-root"]);

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null || skippedKeys.has(key)) {
      continue;
    }

    if (key === "scope") {
      payload.inputs = {
        ...(payload.inputs || {}),
        scope: value
      };
      continue;
    }

    payload[normalizeOptionKey(key)] = value;
  }

  return payload;
}

export function validateInput(target, options) {
  const { inputSchemaPath } = getTargetPaths(target);
  const inputSchema = readJson(inputSchemaPath);
  const payload = buildInputPayload(target, options);
  const errors = validateAgainstSchema(inputSchema, payload, "input");

  return {
    ok: errors.length === 0,
    context: {
      target,
      module: payload.module || null,
      feature: payload.feature || null
    },
    checks: {
      input_schema_valid: errors.length === 0
    },
    errors
  };
}

export function validateArtifacts(target, options) {
  const module = options.module;
  const feature = options.feature;
  const requiredOptions = getTargetRequiredOptions(target);
  const checks = {
    files_exist: false,
    status_schema_valid: false,
    runtime_trace_valid: false,
    artifact_paths_valid: false
  };

  for (const optionName of requiredOptions) {
    checks[`${optionName}_provided`] = Boolean(options[optionName]);
  }

  const missingRequiredOptions = requiredOptions.filter((optionName) => !options[optionName]);

  if (missingRequiredOptions.length > 0) {
    const errors = [];

    for (const optionName of missingRequiredOptions) {
      errors.push(`missing required option: --${optionName}`);
    }

    return {
      ok: false,
      context: {
        target,
        module: module || null,
        feature: feature || null
      },
      checks,
      errors
    };
  }

  const {
    repoRoot,
    artifactDir,
    readmePath,
    statusPath,
    expectedArtifactPaths,
    artifactDefinitions
  } = getArtifactPaths({
    targetId: target,
    options
  });
  const { statusSchemaPath } = getTargetPaths(target);
  const statusSchema = readJson(statusSchemaPath);
  const errors = [];
  const artifactDirRelative = toPosix(path.relative(repoRoot, artifactDir));

  const readmeExists = fs.existsSync(readmePath);
  const statusExists = fs.existsSync(statusPath);
  checks.files_exist = readmeExists && statusExists;

  if (!readmeExists) {
    errors.push(`missing artifact: ${toPosix(path.relative(repoRoot, readmePath))}`);
  }

  if (!statusExists) {
    errors.push(`missing artifact: ${toPosix(path.relative(repoRoot, statusPath))}`);
  }

  let statusData = null;

  if (statusExists) {
    try {
      statusData = readJson(statusPath);
    } catch (error) {
      errors.push(
        `invalid JSON in ${toPosix(path.relative(repoRoot, statusPath))}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (statusData) {
    statusData = sanitizeValidationState(statusSchema, statusData);
    const statusErrors = validateAgainstSchema(statusSchema, statusData, "status");
    checks.status_schema_valid = statusErrors.length === 0;
    errors.push(...statusErrors);
    checks.runtime_trace_valid = validateRuntimeTrace(statusData, artifactDirRelative, errors);
    checks.artifact_paths_valid =
      checks.status_schema_valid &&
      validateArtifactPaths(statusData, artifactDefinitions, expectedArtifactPaths, repoRoot, errors);

    if (options["write-status"]) {
      statusData.validation = buildPersistedValidationState(
        statusSchema,
        statusData.validation,
        {
          schema_valid: checks.status_schema_valid,
          artifact_complete:
            checks.files_exist && checks.status_schema_valid && checks.artifact_paths_valid,
          runtime_trace_valid: checks.runtime_trace_valid
        }
      );
      fs.writeFileSync(statusPath, `${JSON.stringify(statusData, null, 2)}\n`);
    }
  }

  return {
    ok:
      checks.files_exist &&
      checks.status_schema_valid &&
      checks.runtime_trace_valid &&
      checks.artifact_paths_valid,
    context: {
      target,
      module,
      feature,
      artifact_dir: artifactDirRelative
    },
    checks,
    errors
  };
}
