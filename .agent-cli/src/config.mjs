import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULTS = {
  artifactsRoot: "artifacts",
  artifactLanguage: "en"
};

export function getRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function getProjectConfig() {
  const repoRoot = getRepoRoot();
  const configPath = path.join(repoRoot, ".agent-code", "config.json");

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULTS };
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  return {
    ...DEFAULTS,
    artifactsRoot: config.artifacts?.root || DEFAULTS.artifactsRoot,
    artifactLanguage: config.artifacts?.language || DEFAULTS.artifactLanguage
  };
}
