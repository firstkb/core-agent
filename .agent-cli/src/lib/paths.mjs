import path from "node:path";

import { getProjectConfig, getRepoRoot } from "../config.mjs";

function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function resolveRepoRoot() {
  return getRepoRoot();
}

export function resolveArtifactsRoot(customRoot) {
  const repoRoot = resolveRepoRoot();
  const configuredRoot = customRoot || getProjectConfig().artifactsRoot;

  if (path.isAbsolute(configuredRoot)) {
    return configuredRoot;
  }

  return path.join(repoRoot, configuredRoot);
}

export function resolveInputPath(inputPath) {
  const repoRoot = resolveRepoRoot();
  return path.isAbsolute(inputPath) ? inputPath : path.join(repoRoot, inputPath);
}

export function toArtifactRef(filePath, repoRoot = resolveRepoRoot()) {
  const relativePath = path.relative(repoRoot, filePath);

  if (!relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
    return toPosix(relativePath);
  }

  return toPosix(filePath);
}

export function getModulePaths({ moduleId, artifactsRoot }) {
  const root = resolveArtifactsRoot(artifactsRoot);
  const moduleRoot = path.join(root, moduleId);

  return {
    artifactsRoot: root,
    moduleRoot,
    briefPath: path.join(moduleRoot, "brief.md"),
    moduleStatusPath: path.join(moduleRoot, "status.json")
  };
}

export function getFeaturePaths({ moduleId, featureId, artifactsRoot }) {
  const modulePaths = getModulePaths({ moduleId, artifactsRoot });
  const featureRoot = path.join(modulePaths.moduleRoot, "features", featureId);

  return {
    ...modulePaths,
    featureRoot,
    featureReadmePath: path.join(featureRoot, "README.md"),
    featureStatusPath: path.join(featureRoot, "status.json"),
    stagesRoot: path.join(featureRoot, "stages")
  };
}

export function getAttemptPaths({ moduleId, featureId, stage, attemptId, artifactsRoot }) {
  const featurePaths = getFeaturePaths({ moduleId, featureId, artifactsRoot });
  const stageRoot = path.join(featurePaths.stagesRoot, stage);
  const attemptRoot = path.join(stageRoot, attemptId);

  return {
    ...featurePaths,
    stageRoot,
    attemptRoot,
    handoffPath: path.join(attemptRoot, "handoff.json"),
    attemptReadmePath: path.join(attemptRoot, "README.md")
  };
}
