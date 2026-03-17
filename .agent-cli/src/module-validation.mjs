import fs from "node:fs";
import path from "node:path";

import { getProjectConfig, getRepoRoot } from "./config.mjs";
import { validateAgainstSchema } from "./lib/schema-validator.mjs";
import { toPosix } from "./paths.mjs";
import { validateArtifacts as validateAgentArtifacts } from "./validation.mjs";

const CANONICAL_MINIMUM_ARTIFACTS = [
  "primary_readme",
  "status_json",
  "request_md",
  "maestro_brief_md",
  "feature_index_md"
];

const MODULE_ARTIFACT_DEFINITIONS = Object.freeze({
  primary_readme: { required: true, filename: "README.md" },
  status_json: { required: true, filename: "status.json" },
  request_md: { required: true, filename: "request.md" },
  maestro_brief_md: { required: true, filename: "maestro-brief.md" },
  feature_index_md: { required: true, filename: "feature-index.md" },
  global_constraints_md: { required: false, filename: "global-constraints.md" },
  glossary_md: { required: false, filename: "glossary.md" },
  dependency_map_md: { required: false, filename: "dependency-map.md" },
  execution_order_md: { required: false, filename: "execution-order.md" },
  status_board_md: { required: false, filename: "status-board.md" }
});

const FEATURE_ROOT_REQUIRED_STATES = new Set([
  "seeded",
  "active",
  "awaiting_review",
  "blocked",
  "complete",
  "failed"
]);

const APPROVED_PROGRESS_STATES = new Set([
  "approved",
  "seeded",
  "active",
  "awaiting_review",
  "blocked",
  "complete",
  "failed"
]);

const SEEDED_PROGRESS_STATES = new Set([
  "seeded",
  "active",
  "awaiting_review",
  "blocked",
  "complete",
  "failed"
]);

const ACTIVE_ROLLUP_STATES = new Set([
  "seeded",
  "active",
  "awaiting_review",
  "blocked"
]);

const REVIEWABLE_FEATURE_STATUSES = new Set(["active", "awaiting_review"]);

const STAGE_VALIDATORS = Object.freeze({
  research: {
    target: "research_codebase"
  }
});

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseScalar(rawValue) {
  const value = rawValue.trim();

  if (value === "null") {
    return null;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseFrontmatter(filePath) {
  const content = readText(filePath);
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    return null;
  }

  const frontmatter = {};

  for (const line of match[1].split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    frontmatter[key] = parseScalar(value);
  }

  return frontmatter;
}

function buildExpectedModuleArtifactPaths(module, artifactsRoot) {
  const basePath = `${artifactsRoot}/${module}`;
  const expectedArtifactPaths = {};

  for (const [artifactKey, artifactDefinition] of Object.entries(MODULE_ARTIFACT_DEFINITIONS)) {
    expectedArtifactPaths[artifactKey] = `${basePath}/${artifactDefinition.filename}`;
  }

  return expectedArtifactPaths;
}

function getModulePackagePaths() {
  const repoRoot = getRepoRoot();
  const packageRoot = path.join(repoRoot, ".agent-code", "contracts", "module_orchestrator");
  const contractsDir = packageRoot;

  return {
    repoRoot,
    packageRoot,
    contractsDir,
    statusSchemaPath: path.join(contractsDir, "status.schema.json"),
    featureStatusSchemaPath: path.join(contractsDir, "feature-status.schema.json")
  };
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

function validateModuleArtifactPaths(statusData, expectedArtifactPaths, repoRoot, errors) {
  const artifactMap = statusData?.artifacts;

  if (!artifactMap || typeof artifactMap !== "object") {
    errors.push("status.artifacts must be an object");
    return false;
  }

  let ok = true;

  for (const [artifactKey, artifactDefinition] of Object.entries(MODULE_ARTIFACT_DEFINITIONS)) {
    const expectedPath = expectedArtifactPaths[artifactKey];
    const actualPath = artifactMap[artifactKey];

    if (actualPath === null) {
      if (artifactDefinition.required) {
        errors.push(`status.artifacts.${artifactKey} must be a non-empty string`);
        ok = false;
      }

      continue;
    }

    if (typeof actualPath !== "string" || actualPath.trim() === "") {
      errors.push(
        `status.artifacts.${artifactKey} must be a non-empty string${artifactDefinition.required ? "" : " or null"}`
      );
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

function validateModuleReadmeFrontmatter(readmePath, statusData, errors) {
  const frontmatter = parseFrontmatter(readmePath);

  if (!frontmatter) {
    errors.push(`missing README frontmatter in ${toPosix(path.relative(getRepoRoot(), readmePath))}`);
    return false;
  }

  let ok = true;

  const checks = [
    ["module", statusData.module],
    ["status", statusData.status],
    ["execution_mode", statusData.runtime?.execution_mode],
    ["agent_profile", statusData.runtime?.agent_profile]
  ];

  for (const [key, expectedValue] of checks) {
    if (frontmatter[key] !== expectedValue) {
      errors.push(`README frontmatter ${key} must equal ${JSON.stringify(expectedValue)}`);
      ok = false;
    }
  }

  if (frontmatter.orchestrator !== "module_orchestrator") {
    errors.push('README frontmatter orchestrator must equal "module_orchestrator"');
    ok = false;
  }

  return ok;
}

function validateFeatureReadmeFrontmatter(readmePath, featureStatus, errors) {
  const frontmatter = parseFrontmatter(readmePath);

  if (!frontmatter) {
    errors.push(`missing feature README frontmatter in ${toPosix(path.relative(getRepoRoot(), readmePath))}`);
    return false;
  }

  let ok = true;

  const checks = [
    ["module", featureStatus.module],
    ["feature", featureStatus.feature],
    ["feature_id", featureStatus.feature_id],
    ["owner", featureStatus.owner],
    ["status", featureStatus.status]
  ];

  for (const [key, expectedValue] of checks) {
    if (frontmatter[key] !== expectedValue) {
      errors.push(`feature README frontmatter ${key} must equal ${JSON.stringify(expectedValue)}`);
      ok = false;
    }
  }

  return ok;
}

function validateArrayEquals(actual, expected, label, errors) {
  const actualJson = JSON.stringify([...actual].sort());
  const expectedJson = JSON.stringify([...expected].sort());

  if (actualJson !== expectedJson) {
    errors.push(`${label} must equal ${expectedJson}`);
    return false;
  }

  return true;
}

function validateFeatureLifecycle(featureStatus, errors) {
  const status = featureStatus.status;
  const currentStage = featureStatus.current_stage;
  const nextStage = featureStatus.next_stage;
  const gate = featureStatus.gate;
  let ok = true;

  if (status === "queued") {
    if (currentStage === "seeded") {
      if (nextStage !== "research") {
        errors.push("feature status queued at current_stage=seeded must set next_stage to research");
        ok = false;
      }

      if (!["awaiting_owner_approval", "approved_for_dispatch"].includes(gate)) {
        errors.push(
          'feature status queued at current_stage=seeded must use gate "awaiting_owner_approval" or "approved_for_dispatch"'
        );
        ok = false;
      }
    } else if (!["awaiting_owner_approval", "approved_for_dispatch", "none"].includes(gate)) {
      errors.push('feature status queued must use gate "awaiting_owner_approval", "approved_for_dispatch", or "none"');
      ok = false;
    }
  }

  if (status === "active") {
    if (gate !== "in_progress") {
      errors.push('feature status active must use gate "in_progress"');
      ok = false;
    }

    if (currentStage === "seeded" || currentStage === "done") {
      errors.push("feature status active must use an active downstream stage");
      ok = false;
    }
  }

  if (status === "awaiting_review") {
    if (gate !== "awaiting_maestro_review") {
      errors.push('feature status awaiting_review must use gate "awaiting_maestro_review"');
      ok = false;
    }

    if (currentStage === "seeded" || currentStage === "done") {
      errors.push("feature status awaiting_review must point to the completed downstream stage");
      ok = false;
    }
  }

  if (status === "blocked" && !["changes_requested", "none"].includes(gate)) {
    errors.push('feature status blocked must use gate "changes_requested" or "none"');
    ok = false;
  }

  if (status === "complete") {
    if (currentStage !== "done") {
      errors.push('feature status complete must use current_stage "done"');
      ok = false;
    }

    if (nextStage !== null) {
      errors.push("feature status complete must set next_stage to null");
      ok = false;
    }

    if (gate !== "none") {
      errors.push('feature status complete must use gate "none"');
      ok = false;
    }
  }

  if (status === "failed" && gate !== "none") {
    errors.push('feature status failed must use gate "none"');
    ok = false;
  }

  return ok;
}

function deriveModuleFeatureState(featureStatus) {
  if (featureStatus.status === "queued") {
    return featureStatus.current_stage === "seeded" ? "seeded" : "approved";
  }

  if (featureStatus.status === "active") {
    return "active";
  }

  if (featureStatus.status === "awaiting_review") {
    return "awaiting_review";
  }

  if (featureStatus.status === "blocked") {
    return "blocked";
  }

  if (featureStatus.status === "complete") {
    return "complete";
  }

  return "failed";
}

function buildFeatureCountRollup(features) {
  return {
    candidate_feature_count: features.length,
    approved_feature_count: features.filter((feature) => APPROVED_PROGRESS_STATES.has(feature.state)).length,
    seeded_feature_count: features.filter((feature) => SEEDED_PROGRESS_STATES.has(feature.state)).length,
    completed_feature_count: features.filter((feature) => feature.state === "complete").length,
    active_feature_count: features.filter((feature) => ACTIVE_ROLLUP_STATES.has(feature.state)).length
  };
}

function validateFeatureStageArtifacts({ featureStatus, module, feature, artifactsRoot, errors }) {
  const validator = STAGE_VALIDATORS[featureStatus.current_stage];

  if (!validator) {
    return true;
  }

  const result = validateAgentArtifacts(validator.target, {
    module,
    feature,
    "artifacts-root": artifactsRoot
  });

  if (result.ok) {
    return true;
  }

  for (const error of result.errors) {
    errors.push(`feature ${feature} ${featureStatus.current_stage}: ${error}`);
  }

  return false;
}

function validateFeaturePack({
  repoRoot,
  module,
  featureRecord,
  artifactsRoot,
  featureStatusSchema,
  errors
}) {
  const featureBasePath = path.join(repoRoot, artifactsRoot, module, featureRecord.slug);
  const expectedPaths = {
    readme: path.join(featureBasePath, "README.md"),
    status: path.join(featureBasePath, "status.json"),
    packet: path.join(featureBasePath, "maestro-packet.md")
  };

  let ok = true;

  for (const [label, filePath] of Object.entries(expectedPaths)) {
    if (!fs.existsSync(filePath)) {
      errors.push(`feature ${featureRecord.slug} missing ${label}: ${toPosix(path.relative(repoRoot, filePath))}`);
      ok = false;
    }
  }

  if (!ok) {
    return {
      ok: false,
      featureStatus: null
    };
  }

  let featureStatus = null;

  try {
    featureStatus = readJson(expectedPaths.status);
  } catch (error) {
    errors.push(
      `invalid JSON in ${toPosix(path.relative(repoRoot, expectedPaths.status))}: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      ok: false,
      featureStatus: null
    };
  }

  const schemaErrors = validateAgainstSchema(featureStatusSchema, featureStatus, "feature_status");

  if (schemaErrors.length > 0) {
    for (const error of schemaErrors) {
      errors.push(`feature ${featureRecord.slug}: ${error}`);
    }
    ok = false;
  }

  if (featureStatus) {
    if (featureStatus.module !== module) {
      errors.push(`feature ${featureRecord.slug}: feature status module must equal ${module}`);
      ok = false;
    }

    if (featureStatus.feature !== featureRecord.slug) {
      errors.push(`feature ${featureRecord.slug}: feature status feature must equal ${featureRecord.slug}`);
      ok = false;
    }

    if (featureStatus.feature_id !== `${module}/${featureRecord.slug}`) {
      errors.push(`feature ${featureRecord.slug}: feature status feature_id must equal ${module}/${featureRecord.slug}`);
      ok = false;
    }

    if (featureStatus.title !== featureRecord.title) {
      errors.push(`feature ${featureRecord.slug}: feature status title must equal the module feature title`);
      ok = false;
    }

    if (!validateFeatureReadmeFrontmatter(expectedPaths.readme, featureStatus, errors)) {
      ok = false;
    }

    if (!validateFeatureLifecycle(featureStatus, errors)) {
      ok = false;
    }

    const derivedState = deriveModuleFeatureState(featureStatus);

    if (featureRecord.state !== derivedState) {
      errors.push(`feature ${featureRecord.slug}: module feature state must equal ${derivedState}`);
      ok = false;
    }

    if (!validateFeatureStageArtifacts({ featureStatus, module, feature: featureRecord.slug, artifactsRoot, errors })) {
      ok = false;
    }
  }

  return {
    ok,
    featureStatus
  };
}

function validateStateModel(statusData, featureStatuses, errors) {
  const features = statusData.decomposition.features || [];
  const featureStateRollup = buildFeatureCountRollup(features);
  const summary = statusData.summary || {};
  const readiness = statusData.readiness || {};
  const interaction = statusData.interaction || {};
  let ok = true;

  if (statusData.briefing?.target_alignment_state && ["unresolved", "misaligned"].includes(statusData.briefing.target_alignment_state)) {
    if (statusData.decomposition.mode !== "undecided") {
      errors.push('status.decomposition.mode must remain "undecided" when briefing.target_alignment_state is unresolved or misaligned');
      ok = false;
    }

    if (features.length > 0) {
      errors.push("status.decomposition.features must stay empty when module fit is unresolved or misaligned");
      ok = false;
    }
  }

  if (statusData.decomposition.candidate_feature_count !== featureStateRollup.candidate_feature_count) {
    errors.push(`status.decomposition.candidate_feature_count must equal ${featureStateRollup.candidate_feature_count}`);
    ok = false;
  }

  if (statusData.decomposition.approved_feature_count !== featureStateRollup.approved_feature_count) {
    errors.push(`status.decomposition.approved_feature_count must equal ${featureStateRollup.approved_feature_count}`);
    ok = false;
  }

  if (statusData.decomposition.seeded_feature_count !== featureStateRollup.seeded_feature_count) {
    errors.push(`status.decomposition.seeded_feature_count must equal ${featureStateRollup.seeded_feature_count}`);
    ok = false;
  }

  if (statusData.decomposition.completed_feature_count !== featureStateRollup.completed_feature_count) {
    errors.push(`status.decomposition.completed_feature_count must equal ${featureStateRollup.completed_feature_count}`);
    ok = false;
  }

  if (statusData.orchestration.active_feature_count !== featureStateRollup.active_feature_count) {
    errors.push(`status.orchestration.active_feature_count must equal ${featureStateRollup.active_feature_count}`);
    ok = false;
  }

  const approvalGateScenarios = [
    {
      status: "awaiting_feature_approval",
      pendingUserDecision: "approve_feature_seeding",
      readinessKey: "ready_for_feature_seeding",
      label: "feature seeding approval gate"
    },
    {
      status: "awaiting_orchestration_approval",
      pendingUserDecision: "approve_orchestration_launch",
      readinessKey: "ready_for_orchestration_launch",
      label: "orchestration launch approval gate"
    }
  ];

  for (const scenario of approvalGateScenarios) {
    if (
      statusData.status === scenario.status &&
      interaction.pending_user_decision === scenario.pendingUserDecision &&
      readiness[scenario.readinessKey] === true
    ) {
      if (summary.open_questions_count !== 0) {
        errors.push(`status.summary.open_questions_count must equal 0 at the ${scenario.label}`);
        ok = false;
      }

      if (summary.blockers_count !== 0) {
        errors.push(`status.summary.blockers_count must equal 0 at the ${scenario.label}`);
        ok = false;
      }

      if (readiness.open_questions_blocking !== false) {
        errors.push(`status.readiness.open_questions_blocking must be false at the ${scenario.label}`);
        ok = false;
      }
    }
  }

  if (!statusData.approvals.feature_seeding_received && featureStateRollup.seeded_feature_count > 0) {
    errors.push("seeded features require approvals.feature_seeding_received = true");
    ok = false;
  }

  if (
    !statusData.approvals.orchestration_launch_received &&
    features.some((feature) => ["active", "awaiting_review", "blocked", "complete", "failed"].includes(feature.state))
  ) {
    errors.push("downstream stage progress requires approvals.orchestration_launch_received = true");
    ok = false;
  }

  if (featureStateRollup.seeded_feature_count === 0 && statusData.handoff.recommended_next_agent !== null) {
    errors.push("status.handoff.recommended_next_agent must remain null before feature seeding");
    ok = false;
  }

  if (statusData.handoff.recommended_next_agent && statusData.orchestration.recommended_entry_agent) {
    if (statusData.handoff.recommended_next_agent !== statusData.orchestration.recommended_entry_agent) {
      errors.push("status.handoff.recommended_next_agent must match status.orchestration.recommended_entry_agent when both are set");
      ok = false;
    }
  }

  if (!validateArrayEquals(
    statusData.handoff.required_artifacts_minimum || [],
    CANONICAL_MINIMUM_ARTIFACTS,
    "status.handoff.required_artifacts_minimum",
    errors
  )) {
    ok = false;
  }

  const availableArtifacts = Object.entries(statusData.artifacts || {})
    .filter(([, value]) => typeof value === "string" && value.trim() !== "")
    .map(([key]) => key);

  if (!validateArrayEquals(
    statusData.handoff.available_artifacts || [],
    availableArtifacts,
    "status.handoff.available_artifacts",
    errors
  )) {
    ok = false;
  }

  const activeReviewStatuses = featureStatuses.filter((featureStatus) =>
    featureStatus && REVIEWABLE_FEATURE_STATUSES.has(featureStatus.status)
  );
  const activeStageSet = new Set(activeReviewStatuses.map((featureStatus) => featureStatus.current_stage));
  const moduleStatus = statusData.status;
  const launchStatus = statusData.orchestration.launch_status;
  const activeStage = statusData.orchestration.active_stage;

  if (activeStageSet.size === 0 && activeStage !== null) {
    errors.push("status.orchestration.active_stage must be null when no feature is active or awaiting review");
    ok = false;
  }

  if (activeStageSet.size > 1) {
    errors.push("status.orchestration.active_stage must represent a single downstream stage at a time");
    ok = false;
  }

  if (activeStageSet.size === 1 && activeStage !== [...activeStageSet][0]) {
    errors.push(`status.orchestration.active_stage must equal ${JSON.stringify([...activeStageSet][0])}`);
    ok = false;
  }

  const hasAwaitingReview = features.some((feature) => feature.state === "awaiting_review");
  const hasActiveFeature = features.some((feature) => feature.state === "active");

  if (hasAwaitingReview) {
    if (moduleStatus !== "awaiting_stage_review") {
      errors.push('status must equal "awaiting_stage_review" when a feature is awaiting Maestro review');
      ok = false;
    }

    if (launchStatus !== "awaiting_review") {
      errors.push('status.orchestration.launch_status must equal "awaiting_review" when a feature is awaiting review');
      ok = false;
    }

    if (statusData.interaction.pending_user_decision !== "review_stage_output") {
      errors.push('status.interaction.pending_user_decision must equal "review_stage_output" when a feature is awaiting review');
      ok = false;
    }

    if (statusData.readiness.ready_for_feature_seeding !== false) {
      errors.push("status.readiness.ready_for_feature_seeding must be false while awaiting stage review");
      ok = false;
    }

    if (statusData.readiness.ready_for_orchestration_launch !== false) {
      errors.push("status.readiness.ready_for_orchestration_launch must be false while awaiting stage review");
      ok = false;
    }

    if (statusData.handoff.ready_for_feature_seeding !== false) {
      errors.push("status.handoff.ready_for_feature_seeding must be false while awaiting stage review");
      ok = false;
    }

    if (statusData.handoff.ready_for_orchestration_launch !== false) {
      errors.push("status.handoff.ready_for_orchestration_launch must be false while awaiting stage review");
      ok = false;
    }

    if (statusData.handoff.recommended_next_agent !== null) {
      errors.push("status.handoff.recommended_next_agent must be null while awaiting stage review");
      ok = false;
    }
  }

  if (!hasAwaitingReview && moduleStatus === "awaiting_stage_review") {
    errors.push('status cannot equal "awaiting_stage_review" without a feature in state "awaiting_review"');
    ok = false;
  }

  if (hasActiveFeature) {
    if (moduleStatus !== "orchestrating") {
      errors.push('status must equal "orchestrating" when a feature is active in a downstream stage');
      ok = false;
    }

    if (!["started", "in_progress"].includes(launchStatus)) {
      errors.push('status.orchestration.launch_status must equal "started" or "in_progress" when a feature is active');
      ok = false;
    }
  }

  if (!hasActiveFeature && moduleStatus === "orchestrating") {
    errors.push('status cannot equal "orchestrating" without a feature in state "active"');
    ok = false;
  }

  if (!statusData.approvals.orchestration_launch_received) {
    for (const featureStatus of featureStatuses) {
      if (!featureStatus || featureStatus.current_stage !== "seeded") {
        continue;
      }

      if (featureStatus.gate !== "awaiting_owner_approval") {
        errors.push("seeded features must stay at gate awaiting_owner_approval until orchestration launch is approved");
        ok = false;
      }
    }
  }

  return ok;
}

function buildPersistedValidationState(currentValidation, nextValidation) {
  return {
    ...(currentValidation && typeof currentValidation === "object" ? currentValidation : {}),
    schema_valid: nextValidation.schema_valid,
    artifact_complete: nextValidation.artifact_complete,
    runtime_trace_valid: nextValidation.runtime_trace_valid,
    cross_artifact_consistent: nextValidation.cross_artifact_consistent
  };
}

export function validateModule(target, options = {}) {
  if (target !== "module_orchestrator") {
    return {
      ok: false,
      target,
      context: { module: options.module || null },
      checks: { target_supported: false },
      errors: [`unsupported module validator target: ${target}`]
    };
  }

  const module = options.module;
  const artifactsRoot = options["artifacts-root"] || getProjectConfig().artifactsRoot;
  const checks = {
    module_provided: Boolean(module),
    files_exist: false,
    status_schema_valid: false,
    runtime_trace_valid: false,
    artifact_paths_valid: false,
    readme_frontmatter_valid: false,
    feature_status_valid: false,
    cross_artifact_consistent: false
  };

  if (!module) {
    return {
      ok: false,
      target: "module_orchestrator",
      context: {
        module: null
      },
      checks,
      errors: ["missing required option: --module"]
    };
  }

  const { repoRoot, statusSchemaPath, featureStatusSchemaPath } = getModulePackagePaths();
  const moduleDir = path.join(repoRoot, artifactsRoot, module);
  const readmePath = path.join(moduleDir, "README.md");
  const statusPath = path.join(moduleDir, "status.json");
  const expectedArtifactPaths = buildExpectedModuleArtifactPaths(module, artifactsRoot);
  const statusSchema = readJson(statusSchemaPath);
  const featureStatusSchema = readJson(featureStatusSchemaPath);
  const errors = [];

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
    const statusErrors = validateAgainstSchema(statusSchema, statusData, "status");
    checks.status_schema_valid = statusErrors.length === 0;
    errors.push(...statusErrors);

    checks.runtime_trace_valid = validateRuntimeTrace(statusData, toPosix(path.relative(repoRoot, moduleDir)), errors);
    checks.artifact_paths_valid = validateModuleArtifactPaths(statusData, expectedArtifactPaths, repoRoot, errors);

    if (readmeExists) {
      checks.readme_frontmatter_valid = validateModuleReadmeFrontmatter(readmePath, statusData, errors);
    }

    let featureStatuses = [];
    let featureStatusValid = true;

    for (const featureRecord of statusData.decomposition?.features || []) {
      const featureDirExists = fs.existsSync(path.join(moduleDir, featureRecord.slug));

      if (FEATURE_ROOT_REQUIRED_STATES.has(featureRecord.state)) {
        const result = validateFeaturePack({
          repoRoot,
          module,
          featureRecord,
          artifactsRoot,
          featureStatusSchema,
          errors
        });

        featureStatusValid = featureStatusValid && result.ok;

        if (result.featureStatus) {
          featureStatuses.push(result.featureStatus);
        }

        continue;
      }

      if (featureDirExists) {
        errors.push(`feature ${featureRecord.slug}: feature root pack must not exist before seeding`);
        featureStatusValid = false;
      }
    }

    checks.feature_status_valid = featureStatusValid;
    checks.cross_artifact_consistent =
      checks.artifact_paths_valid &&
      checks.readme_frontmatter_valid &&
      checks.feature_status_valid &&
      validateStateModel(statusData, featureStatuses, errors);

    if (options["write-status"]) {
      statusData.validation = buildPersistedValidationState(statusData.validation, {
        schema_valid: checks.status_schema_valid,
        artifact_complete: checks.files_exist && checks.artifact_paths_valid,
        runtime_trace_valid: checks.runtime_trace_valid,
        cross_artifact_consistent: checks.cross_artifact_consistent
      });
      fs.writeFileSync(statusPath, `${JSON.stringify(statusData, null, 2)}\n`);
    }
  }

  return {
    ok: Object.values(checks).every(Boolean),
    target: "module_orchestrator",
    context: {
      module,
      artifact_dir: toPosix(path.relative(repoRoot, moduleDir))
    },
    checks,
    errors
  };
}
