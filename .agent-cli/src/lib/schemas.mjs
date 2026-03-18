import fs from "node:fs";
import path from "node:path";

import { getRepoRoot } from "../config.mjs";

const schemaCache = new Map();

function loadSchemaFile(fileName) {
  if (schemaCache.has(fileName)) {
    return schemaCache.get(fileName);
  }

  const schemaPath = path.join(getRepoRoot(), ".agent-cli", "src", "schemas", fileName);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  schemaCache.set(fileName, schema);
  return schema;
}

export function getModuleStatusSchema() {
  return loadSchemaFile("module-status.schema.json");
}

export function getFeatureStatusSchema() {
  return loadSchemaFile("feature-status.schema.json");
}

export function getStageHandoffSchema() {
  return loadSchemaFile("stage-handoff.schema.json");
}
