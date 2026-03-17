import fs from "node:fs";
import path from "node:path";

import { getProjectConfig, getRepoRoot } from "./config.mjs";
import { getTargetDefinition } from "./targets/index.mjs";

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeOptionKey(key) {
  return key.replace(/-/g, "_");
}

function buildPathVariables(options, projectConfig) {
  const variables = {
    artifacts_root: options["artifacts-root"] || projectConfig.artifactsRoot,
    artifact_language: options["artifact-language"] || projectConfig.artifactLanguage
  };

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null || key === "json") {
      continue;
    }

    variables[normalizeOptionKey(key)] = value;
  }

  return variables;
}

function resolveTemplatePath(template, variables) {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    if (!(key in variables) || variables[key] === undefined || variables[key] === null || variables[key] === "") {
      throw new Error(`Missing required path variable: ${key}`);
    }

    return String(variables[key]);
  });
}

export function getTargetPaths(targetId) {
  const repoRoot = getRepoRoot();
  const targetDefinition = getTargetDefinition(targetId);
  const packageRoot = path.join(repoRoot, targetDefinition.packageRoot);
  const contractsDir = path.join(repoRoot, targetDefinition.contractsDir || path.join(targetDefinition.packageRoot, "contracts"));
  const templatesDir = path.join(repoRoot, targetDefinition.templatesDir || path.join(targetDefinition.packageRoot, "templates"));

  return {
    repoRoot,
    packageRoot,
    contractsDir,
    templatesDir,
    contractPath: path.join(repoRoot, targetDefinition.contractPath || path.join(targetDefinition.contractsDir || path.join(targetDefinition.packageRoot, "contracts"), "contract.json")),
    inputSchemaPath: path.join(repoRoot, targetDefinition.inputSchemaPath || path.join(targetDefinition.contractsDir || path.join(targetDefinition.packageRoot, "contracts"), "input.schema.json")),
    outputSchemaPath: path.join(repoRoot, targetDefinition.outputSchemaPath || path.join(targetDefinition.contractsDir || path.join(targetDefinition.packageRoot, "contracts"), "output.schema.json")),
    statusSchemaPath: path.join(repoRoot, targetDefinition.statusSchemaPath || path.join(targetDefinition.contractsDir || path.join(targetDefinition.packageRoot, "contracts"), "status.schema.json")),
    readmeTemplatePath: path.join(repoRoot, targetDefinition.readmeTemplatePath || path.join(targetDefinition.templatesDir || path.join(targetDefinition.packageRoot, "templates"), "README.md.tmpl")),
    statusTemplatePath: path.join(repoRoot, targetDefinition.statusTemplatePath || path.join(targetDefinition.templatesDir || path.join(targetDefinition.packageRoot, "templates"), "status.template.json"))
  };
}

function getContractPathVariables(contract) {
  const variables = [];
  const seen = new Set();

  for (const artifact of Object.values(contract.artifacts || {})) {
    if (!artifact || typeof artifact.path !== "string") {
      continue;
    }

    for (const match of artifact.path.matchAll(/\{([^}]+)\}/g)) {
      const variableName = match[1];

      if (variableName === "artifacts_root" || variableName === "artifact_language") {
        continue;
      }

      if (seen.has(variableName)) {
        continue;
      }

      seen.add(variableName);
      variables.push(variableName);
    }
  }

  return variables;
}

export function getTargetRequiredOptions(targetId) {
  return getContractPathVariables(getTargetContract(targetId));
}

export function getTargetContract(targetId) {
  const { contractPath } = getTargetPaths(targetId);
  return readJson(contractPath);
}

export function getArtifactPaths({ targetId = "research_codebase", options = {} }) {
  const repoRoot = getRepoRoot();
  const projectConfig = getProjectConfig();
  const contract = getTargetContract(targetId);
  const variables = buildPathVariables(options, projectConfig);
  const expectedArtifactPaths = {};

  for (const [artifactId, artifact] of Object.entries(contract.artifacts || {})) {
    if (!artifact || typeof artifact.path !== "string") {
      continue;
    }

    expectedArtifactPaths[artifactId] = toPosix(resolveTemplatePath(artifact.path, variables));
  }

  const expectedReadme = expectedArtifactPaths.primary_readme;
  const expectedStatus = expectedArtifactPaths.status_json;

  if (!expectedReadme || !expectedStatus) {
    throw new Error(`Target ${targetId} must declare primary_readme and status_json artifacts`);
  }

  const readmePath = path.join(repoRoot, expectedReadme);
  const statusPath = path.join(repoRoot, expectedStatus);
  const artifactDir = path.dirname(readmePath);

  return {
    repoRoot,
    targetId,
    artifactsRoot: variables.artifacts_root,
    artifactLanguage: variables.artifact_language,
    artifactDir,
    readmePath,
    statusPath,
    expectedReadme,
    expectedStatus,
    expectedArtifactPaths,
    artifactDefinitions: contract.artifacts || {}
  };
}
