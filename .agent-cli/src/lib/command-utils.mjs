import fs from "node:fs";

import { CliError, invariant } from "./errors.mjs";
import { resolveInputPath } from "./paths.mjs";

export function getRequiredOption(options, name) {
  const value = options[name];
  invariant(typeof value === "string" && value.length > 0, `Missing required option --${name}`, 4);
  return value;
}

export function getOptionalOption(options, name) {
  const value = options[name];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function ensureFileExists(filePath, label = "file") {
  invariant(fs.existsSync(filePath), `Missing ${label}: ${filePath}`, 4);
}

export function readJsonInput(inputPath, label = "json_input") {
  const resolvedPath = resolveInputPath(inputPath);
  ensureFileExists(resolvedPath, label);

  try {
    return {
      resolvedPath,
      value: JSON.parse(fs.readFileSync(resolvedPath, "utf8"))
    };
  } catch (error) {
    throw new CliError(`Invalid ${label}: ${error instanceof Error ? error.message : String(error)}`, 2, {
      resolvedPath
    });
  }
}
