import fs from "node:fs";

import { createResult } from "../lib/output.mjs";
import { CliError, invariant } from "../lib/errors.mjs";
import { getOptionalOption, getRequiredOption } from "../lib/command-utils.mjs";
import { getFeaturePaths, getModulePaths } from "../lib/paths.mjs";
import { moduleExists, readModuleStatus } from "../lib/read-state.mjs";
import { createModuleStatus } from "../lib/scaffold.mjs";
import { writeModuleStatus } from "../lib/write-state.mjs";

function ensureBriefLooksComplete(briefPath) {
  invariant(fs.existsSync(briefPath), `Missing brief.md: ${briefPath}`, 4);
  const content = fs.readFileSync(briefPath, "utf8").trim();
  invariant(content.length > 0, "brief.md must not be empty", 6);
}

function createBaseContext(moduleId, artifactsRoot) {
  return {
    module: moduleId,
    "artifacts-root": artifactsRoot || "artifacts"
  };
}

function runInit(options) {
  const moduleId = getRequiredOption(options, "module");
  const ownerId = getOptionalOption(options, "owner");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });

  invariant(!moduleExists({ moduleId, artifactsRoot: options["artifacts-root"] }), `Module already exists: ${moduleId}`, 5);

  fs.mkdirSync(modulePaths.moduleRoot, { recursive: true });
  writeModuleStatus(modulePaths.moduleStatusPath, createModuleStatus(moduleId, modulePaths.briefPath));

  return createResult("module init", {
    writes: [modulePaths.moduleStatusPath],
    state: {
      module_phase: "discussion"
    },
    context: {
      ...createBaseContext(moduleId, options["artifacts-root"]),
      owner: ownerId
    }
  });
}

function runSubmitForBriefApproval(options) {
  const moduleId = getRequiredOption(options, "module");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });

  invariant(moduleStatus.phase === "discussion", "module submit-for-brief-approval requires phase discussion", 3);
  ensureBriefLooksComplete(modulePaths.briefPath);

  writeModuleStatus(modulePaths.moduleStatusPath, {
    ...moduleStatus,
    phase: "awaiting_owner_brief_approval",
    current_action: "awaiting_owner_brief_approval"
  });

  return createResult("module submit-for-brief-approval", {
    writes: [modulePaths.moduleStatusPath],
    state: {
      module_phase: "awaiting_owner_brief_approval"
    },
    context: createBaseContext(moduleId, options["artifacts-root"])
  });
}

function runReturnToDiscussion(options) {
  const moduleId = getRequiredOption(options, "module");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });

  invariant(
    moduleStatus.phase === "awaiting_owner_brief_approval",
    "module return-to-discussion requires phase awaiting_owner_brief_approval",
    3
  );

  writeModuleStatus(modulePaths.moduleStatusPath, {
    ...moduleStatus,
    phase: "discussion",
    current_action: "awaiting_owner_input"
  });

  return createResult("module return-to-discussion", {
    writes: [modulePaths.moduleStatusPath],
    state: {
      module_phase: "discussion"
    },
    context: createBaseContext(moduleId, options["artifacts-root"])
  });
}

function runRecordOwnerApproval(options) {
  const moduleId = getRequiredOption(options, "module");
  const approval = getRequiredOption(options, "approval");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });

  invariant(["brief", "execution"].includes(approval), "--approval must be brief or execution", 6);

  if (approval === "brief") {
    invariant(moduleStatus.phase === "awaiting_owner_brief_approval", "brief approval requires phase awaiting_owner_brief_approval", 3);
  }

  if (approval === "execution") {
    invariant(moduleStatus.phase === "awaiting_owner_execution_approval", "execution approval requires phase awaiting_owner_execution_approval", 3);
  }

  writeModuleStatus(modulePaths.moduleStatusPath, {
    ...moduleStatus,
    owner_approvals: {
      ...moduleStatus.owner_approvals,
      [approval]: true
    },
    current_action: approval === "brief" ? "ready_to_freeze_brief" : "ready_to_start_stage"
  });

  return createResult("module record-owner-approval", {
    writes: [modulePaths.moduleStatusPath],
    state: {
      module_phase: moduleStatus.phase,
      approval_recorded: approval
    },
    context: createBaseContext(moduleId, options["artifacts-root"])
  });
}

function runFreezeBrief(options) {
  const moduleId = getRequiredOption(options, "module");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });

  invariant(moduleStatus.phase === "awaiting_owner_brief_approval", "module freeze-brief requires phase awaiting_owner_brief_approval", 3);
  invariant(moduleStatus.owner_approvals.brief === true, "module freeze-brief requires owner brief approval", 6);
  ensureBriefLooksComplete(modulePaths.briefPath);

  writeModuleStatus(modulePaths.moduleStatusPath, {
    ...moduleStatus,
    phase: "brief_frozen",
    brief: {
      ...moduleStatus.brief,
      approved: true,
      frozen: true
    },
    current_action: "ready_to_seed_features"
  });

  return createResult("module freeze-brief", {
    writes: [modulePaths.moduleStatusPath],
    state: {
      module_phase: "brief_frozen"
    },
    context: createBaseContext(moduleId, options["artifacts-root"])
  });
}

function runPrepareExecution(options) {
  const moduleId = getRequiredOption(options, "module");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });

  invariant(moduleStatus.phase === "brief_frozen", "module prepare-execution requires phase brief_frozen", 3);
  invariant(moduleStatus.features.length > 0, "module prepare-execution requires at least one feature", 6);

  for (const featureId of moduleStatus.features) {
    const featurePaths = getFeaturePaths({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });
    invariant(fs.existsSync(featurePaths.featureReadmePath), `Missing README.md for feature ${featureId}`, 4);
    invariant(fs.existsSync(featurePaths.featureStatusPath), `Missing status.json for feature ${featureId}`, 4);
  }

  writeModuleStatus(modulePaths.moduleStatusPath, {
    ...moduleStatus,
    phase: "awaiting_owner_execution_approval",
    current_action: "awaiting_owner_execution_approval"
  });

  return createResult("module prepare-execution", {
    writes: [modulePaths.moduleStatusPath],
    state: {
      module_phase: "awaiting_owner_execution_approval"
    },
    context: createBaseContext(moduleId, options["artifacts-root"])
  });
}

export async function runModuleCommand({ subcommand, options }) {
  switch (subcommand) {
    case "init":
      return runInit(options);
    case "submit-for-brief-approval":
      return runSubmitForBriefApproval(options);
    case "return-to-discussion":
      return runReturnToDiscussion(options);
    case "record-owner-approval":
      return runRecordOwnerApproval(options);
    case "freeze-brief":
      return runFreezeBrief(options);
    case "prepare-execution":
      return runPrepareExecution(options);
    default:
      throw new CliError(`Unsupported module command: ${subcommand}`, 2);
  }
}
