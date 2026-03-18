import fs from "node:fs";
import path from "node:path";

import { createResult } from "../lib/output.mjs";
import { CliError, invariant } from "../lib/errors.mjs";
import { allocateAttemptId } from "../lib/ids.mjs";
import { getOptionalOption, getRequiredOption, readJsonInput } from "../lib/command-utils.mjs";
import { getAttemptPaths, getFeaturePaths, getModulePaths, resolveInputPath, toArtifactRef } from "../lib/paths.mjs";
import { readFeatureStatus, readModuleStatus } from "../lib/read-state.mjs";
import { appendDecisionBlock, copyAttemptReadme, ensureAttemptDirectory } from "../lib/scaffold.mjs";
import { writeFeatureStatus, writeModuleStatus, writeStageHandoff, writeTextArtifact } from "../lib/write-state.mjs";

function createBaseContext(moduleId, featureId, stage, artifactsRoot) {
  return {
    module: moduleId,
    feature: featureId,
    stage,
    "artifacts-root": artifactsRoot || "artifacts"
  };
}

function runStart(options) {
  const moduleId = getRequiredOption(options, "module");
  const featureId = getRequiredOption(options, "feature");
  const stage = getRequiredOption(options, "stage");
  const agentId = getRequiredOption(options, "agent");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const featurePaths = getFeaturePaths({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });
  const featureStatus = readFeatureStatus({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });

  invariant(
    moduleStatus.phase === "awaiting_owner_execution_approval" || moduleStatus.phase === "executing",
    "stage start requires module phase awaiting_owner_execution_approval or executing",
    3
  );
  invariant(moduleStatus.owner_approvals.execution === true, "stage start requires execution approval", 6);
  invariant(featureStatus.phase === "ready_for_stage", "stage start requires feature phase ready_for_stage", 3);
  invariant(featureStatus.active_attempt_id === null, "stage start requires no active attempt", 3);

  if (featureStatus.next_stage) {
    invariant(
      featureStatus.next_stage === stage,
      `stage start requires stage ${featureStatus.next_stage}, got ${stage}`,
      6
    );
  }

  const attemptId = allocateAttemptId(path.join(featurePaths.stagesRoot, stage));
  const attemptPaths = getAttemptPaths({
    moduleId,
    featureId,
    stage,
    attemptId,
    artifactsRoot: options["artifacts-root"]
  });

  ensureAttemptDirectory(attemptPaths.attemptRoot);

  writeFeatureStatus(featurePaths.featureStatusPath, {
    ...featureStatus,
    phase: "stage_in_progress",
    current_stage: stage,
    next_stage: null,
    active_attempt_id: attemptId,
    latest_attempt_id: attemptId,
    latest_submitted_handoff_ref: null,
    blocked_reason: null
  });

  writeModuleStatus(modulePaths.moduleStatusPath, {
    ...moduleStatus,
    phase: "executing",
    current_action: `stage_in_progress:${featureId}:${stage}:${attemptId}`
  });

  return createResult("stage start", {
    writes: [attemptPaths.attemptRoot, featurePaths.featureStatusPath, modulePaths.moduleStatusPath],
    state: {
      module_phase: "executing",
      feature_phase: "stage_in_progress",
      attempt_id: attemptId
    },
    context: {
      ...createBaseContext(moduleId, featureId, stage, options["artifacts-root"]),
      agent: agentId
    }
  });
}

function runSubmitHandoff(options) {
  const moduleId = getRequiredOption(options, "module");
  const featureId = getRequiredOption(options, "feature");
  const stage = getRequiredOption(options, "stage");
  const fromPath = getRequiredOption(options, "from");
  const readmePath = getRequiredOption(options, "readme");
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const featurePaths = getFeaturePaths({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });
  const featureStatus = readFeatureStatus({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });

  invariant(moduleStatus.phase === "executing", "stage submit-handoff requires module phase executing", 3);
  invariant(featureStatus.phase === "stage_in_progress", "stage submit-handoff requires feature phase stage_in_progress", 3);
  invariant(featureStatus.current_stage === stage, "stage submit-handoff requires current_stage to match --stage", 3);
  invariant(featureStatus.active_attempt_id !== null, "stage submit-handoff requires an active attempt", 3);

  const attemptId = featureStatus.active_attempt_id;
  const attemptPaths = getAttemptPaths({
    moduleId,
    featureId,
    stage,
    attemptId,
    artifactsRoot: options["artifacts-root"]
  });
  const { value: handoffPayload } = readJsonInput(fromPath, "handoff.json");

  invariant(handoffPayload.module_id === moduleId, "handoff.module_id must match --module", 6);
  invariant(handoffPayload.feature_id === featureId, "handoff.feature_id must match --feature", 6);
  invariant(handoffPayload.stage === stage, "handoff.stage must match --stage", 6);
  invariant(handoffPayload.attempt_id === attemptId, "handoff.attempt_id must match the active attempt", 6);

  writeStageHandoff(attemptPaths.handoffPath, handoffPayload);
  copyAttemptReadme({
    sourcePath: resolveInputPath(readmePath),
    destinationPath: attemptPaths.attemptReadmePath
  });

  writeFeatureStatus(featurePaths.featureStatusPath, {
    ...featureStatus,
    phase: "awaiting_review",
    active_attempt_id: null,
    latest_submitted_handoff_ref: toArtifactRef(attemptPaths.handoffPath)
  });

  writeModuleStatus(modulePaths.moduleStatusPath, {
    ...moduleStatus,
    current_action: `awaiting_stage_review:${featureId}:${stage}:${attemptId}`
  });

  return createResult("stage submit-handoff", {
    writes: [attemptPaths.handoffPath, attemptPaths.attemptReadmePath, featurePaths.featureStatusPath, modulePaths.moduleStatusPath],
    state: {
      module_phase: "executing",
      feature_phase: "awaiting_review",
      attempt_id: attemptId
    },
    context: createBaseContext(moduleId, featureId, stage, options["artifacts-root"])
  });
}

function runReview(options) {
  const moduleId = getRequiredOption(options, "module");
  const featureId = getRequiredOption(options, "feature");
  const stage = getRequiredOption(options, "stage");
  const attemptId = getRequiredOption(options, "attempt");
  const decision = getRequiredOption(options, "decision");
  const reason = getRequiredOption(options, "reason");
  const nextStage = getOptionalOption(options, "next-stage");
  const complete = options.complete === true;
  const modulePaths = getModulePaths({ moduleId, artifactsRoot: options["artifacts-root"] });
  const featurePaths = getFeaturePaths({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });
  const moduleStatus = readModuleStatus({ moduleId, artifactsRoot: options["artifacts-root"] });
  const featureStatus = readFeatureStatus({ moduleId, featureId, artifactsRoot: options["artifacts-root"] });
  const attemptPaths = getAttemptPaths({
    moduleId,
    featureId,
    stage,
    attemptId,
    artifactsRoot: options["artifacts-root"]
  });

  invariant(moduleStatus.phase === "executing", "stage review requires module phase executing", 3);
  invariant(featureStatus.phase === "awaiting_review", "stage review requires feature phase awaiting_review", 3);
  invariant(featureStatus.current_stage === stage, "stage review requires current_stage to match --stage", 3);
  invariant(featureStatus.latest_submitted_handoff_ref === toArtifactRef(attemptPaths.handoffPath), "stage review requires matching submitted handoff", 6);
  invariant(["accept", "revise"].includes(decision), "stage review supports only accept or revise", 6);
  invariant(decision !== "accept" || complete || nextStage, "accept review requires --next-stage or --complete", 6);
  invariant(!(decision === "accept" && complete && nextStage), "accept review cannot combine --complete with --next-stage", 6);
  invariant(!(decision === "revise" && complete), "revise review cannot use --complete", 6);
  invariant(!(decision === "revise" && nextStage), "revise review must not use --next-stage", 6);
  invariant(fs.existsSync(attemptPaths.attemptReadmePath), `Missing attempt README.md: ${attemptPaths.attemptReadmePath}`, 4);

  const reviewedAt = new Date().toISOString();
  const resolvedNextStage = decision === "accept"
    ? (complete ? null : nextStage)
    : stage;
  const currentAttemptReadme = fs.readFileSync(attemptPaths.attemptReadmePath, "utf8");

  writeTextArtifact(
    attemptPaths.attemptReadmePath,
    appendDecisionBlock(currentAttemptReadme, {
      decision,
      reason,
      nextStage: resolvedNextStage,
      complete,
      reviewedAt
    })
  );

  writeFeatureStatus(featurePaths.featureStatusPath, {
    ...featureStatus,
    phase: decision === "accept" && complete ? "done" : "ready_for_stage",
    current_stage: null,
    next_stage: resolvedNextStage,
    active_attempt_id: null,
    last_reviewed_attempt_id: attemptId,
    last_reviewed_handoff_ref: toArtifactRef(attemptPaths.handoffPath),
    last_decision: decision,
    last_decision_reason: reason,
    blocked_reason: null
  });

  writeModuleStatus(modulePaths.moduleStatusPath, {
    ...moduleStatus,
    current_action: decision === "accept" && complete
      ? `feature_complete:${featureId}`
      : `ready_for_stage:${featureId}:${resolvedNextStage}`
  });

  return createResult("stage review", {
    writes: [attemptPaths.attemptReadmePath, featurePaths.featureStatusPath, modulePaths.moduleStatusPath],
    state: {
      module_phase: "executing",
      feature_phase: decision === "accept" && complete ? "done" : "ready_for_stage",
      decision
    },
    context: createBaseContext(moduleId, featureId, stage, options["artifacts-root"])
  });
}

export async function runStageCommand({ subcommand, options }) {
  switch (subcommand) {
    case "start":
      return runStart(options);
    case "submit-handoff":
      return runSubmitHandoff(options);
    case "review":
      return runReview(options);
    default:
      throw new CliError(`Unsupported stage command: ${subcommand}`, 2);
  }
}
