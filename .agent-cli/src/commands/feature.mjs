import fs from "node:fs";

import { createResult } from "../lib/output.mjs";
import { CliError, invariant } from "../lib/errors.mjs";
import { getRequiredOption } from "../lib/command-utils.mjs";
import { getFeaturePaths, getModulePaths } from "../lib/paths.mjs";
import { featureExists, readFeatureStatus, readModuleStatus } from "../lib/read-state.mjs";
import { createFeatureStatus } from "../lib/scaffold.mjs";
import { writeFeatureStatus, writeModuleStatus } from "../lib/write-state.mjs";

function createBaseContext(moduleId, featureId, artifactsRoot) {
  return {
    module: moduleId,
    feature: featureId,
    "artifacts-root": artifactsRoot || "artifacts"
  };
}

function runSeed(options) {
  const moduleId = getRequiredOption(options, "module");
  const featureId = getRequiredOption(options, "feature");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const featurePaths = getFeaturePaths({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });

  invariant(moduleStatus.phase === "brief_frozen", "feature seed requires module phase brief_frozen", 3);
  invariant(!featureExists({ moduleId, featureId, artifactsRoot: options["artifacts-root"] }), `Feature already exists: ${featureId}`, 5);

  fs.mkdirSync(featurePaths.featureRoot, { recursive: true });

  writeFeatureStatus(
    featurePaths.featureStatusPath,
    createFeatureStatus({
      moduleId,
      featureId,
      readmePath: featurePaths.featureReadmePath
    })
  );

  writeModuleStatus(modulePaths.moduleStatusPath, {
    ...moduleStatus,
    features: [...moduleStatus.features, featureId],
    current_action: "ready_to_seed_more_or_prepare_execution"
  });

  return createResult("feature seed", {
    writes: [featurePaths.featureStatusPath, modulePaths.moduleStatusPath],
    state: {
      module_phase: moduleStatus.phase,
      feature_phase: "seeded"
    },
    context: createBaseContext(moduleId, featureId, options["artifacts-root"])
  });
}

function runSetNextStage(options) {
  const moduleId = getRequiredOption(options, "module");
  const featureId = getRequiredOption(options, "feature");
  const stage = getRequiredOption(options, "stage");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const featurePaths = getFeaturePaths({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });
  const featureStatus = readFeatureStatus({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });

  invariant(
    featureStatus.phase === "seeded" || featureStatus.phase === "ready_for_stage",
    "feature set-next-stage requires feature phase seeded or ready_for_stage",
    3
  );
  invariant(featureStatus.active_attempt_id === null, "feature set-next-stage requires no active attempt", 3);

  writeFeatureStatus(featurePaths.featureStatusPath, {
    ...featureStatus,
    phase: "ready_for_stage",
    current_stage: null,
    next_stage: stage,
    blocked_reason: null
  });

  const shouldUpdateModuleAction = moduleStatus.phase === "executing"
    || (moduleStatus.phase === "awaiting_owner_execution_approval" && moduleStatus.owner_approvals.execution === true);

  if (shouldUpdateModuleAction) {
    writeModuleStatus(modulePaths.moduleStatusPath, {
      ...moduleStatus,
      current_action: `ready_for_stage:${featureId}:${stage}`
    });
  }

  return createResult("feature set-next-stage", {
    writes: shouldUpdateModuleAction
      ? [featurePaths.featureStatusPath, modulePaths.moduleStatusPath]
      : [featurePaths.featureStatusPath],
    state: {
      module_phase: moduleStatus.phase,
      feature_phase: "ready_for_stage",
      next_stage: stage
    },
    context: createBaseContext(moduleId, featureId, options["artifacts-root"])
  });
}

export async function runFeatureCommand({ subcommand, options }) {
  switch (subcommand) {
    case "seed":
      return runSeed(options);
    case "set-next-stage":
      return runSetNextStage(options);
    default:
      throw new CliError(`Unsupported feature command: ${subcommand}`, 2);
  }
}
