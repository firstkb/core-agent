import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function runCli(args) {
  const binPath = path.resolve("bin/agent-stack.mjs");
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: path.resolve("."),
    encoding: "utf8"
  });
}

function parseStdout(child) {
  return JSON.parse(child.stdout || "{}");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function createTempArtifactsRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "agent-cli-v2-stage-"));
}

function setupReadyFeature({ artifactsRoot, moduleId, featureId }) {
  let child = runCli(["module", "init", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"]);
  assert.equal(child.status, 0, child.stderr);

  const moduleRoot = path.join(artifactsRoot, moduleId);
  fs.writeFileSync(
    path.join(moduleRoot, "brief.md"),
    "# Module Brief\n\n## Goal\n\nRestore executable npm test.\n\n## Proposed Feature Decomposition\n- restore-executable-npm-test\n",
    "utf8"
  );

  const commands = [
    ["module", "submit-for-brief-approval", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"],
    ["module", "record-owner-approval", "--module", moduleId, "--approval", "brief", "--artifacts-root", artifactsRoot, "--json"],
    ["module", "freeze-brief", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"],
    ["feature", "seed", "--module", moduleId, "--feature", featureId, "--artifacts-root", artifactsRoot, "--json"]
  ];

  for (const args of commands) {
    child = runCli(args);
    assert.equal(child.status, 0, child.stderr);
  }

  fs.writeFileSync(
    path.join(moduleRoot, "features", featureId, "README.md"),
    `# Feature: ${featureId}\n\nModule: ${moduleId}\n`,
    "utf8"
  );

  const remainingCommands = [
    ["feature", "set-next-stage", "--module", moduleId, "--feature", featureId, "--stage", "research", "--artifacts-root", artifactsRoot, "--json"],
    ["module", "prepare-execution", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"],
    ["module", "record-owner-approval", "--module", moduleId, "--approval", "execution", "--artifacts-root", artifactsRoot, "--json"]
  ];

  for (const args of remainingCommands) {
    child = runCli(args);
    assert.equal(child.status, 0, child.stderr);
  }
}

test("stage lifecycle supports start, submit-handoff, and accept review", () => {
  const artifactsRoot = createTempArtifactsRoot();
  const moduleId = "avatar-service-test-execution-v2-stage-accept";
  const featureId = "restore-executable-npm-test";

  setupReadyFeature({ artifactsRoot, moduleId, featureId });

  let child = runCli([
    "stage",
    "start",
    "--module",
    moduleId,
    "--feature",
    featureId,
    "--stage",
    "research",
    "--agent",
    "research_codebase",
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);
  let payload = parseStdout(child);
  assert.equal(payload.state.attempt_id, "attempt-001");

  const moduleRoot = path.join(artifactsRoot, moduleId);
  const moduleStatusPath = path.join(moduleRoot, "status.json");
  const featureStatusPath = path.join(moduleRoot, "features", featureId, "status.json");
  const featureStatus = readJson(featureStatusPath);
  const attemptRoot = path.join(moduleRoot, "features", featureId, "stages", "research", featureStatus.active_attempt_id);
  const handoffInput = path.join(os.tmpdir(), `${moduleId}-handoff.json`);
  const attemptReadmeInput = path.join(os.tmpdir(), `${moduleId}-attempt-readme.md`);

  fs.writeFileSync(
    handoffInput,
    `${JSON.stringify({
      schema_version: 1,
      module_id: moduleId,
      feature_id: featureId,
      stage: "research",
      attempt_id: path.basename(attemptRoot),
      agent_id: "research_codebase",
      result: "complete",
      summary: "Research localized the package-local import mismatch.",
      evidence_refs: [],
      produced_artifact_refs: [],
      change_requests: [],
      recommended_next_stage: "implementation",
      created_at: new Date().toISOString()
    }, null, 2)}\n`
  );
  fs.writeFileSync(attemptReadmeInput, "# Research Attempt\n\nPackage-local mismatch identified.\n");

  child = runCli([
    "stage",
    "submit-handoff",
    "--module",
    moduleId,
    "--feature",
    featureId,
    "--stage",
    "research",
    "--from",
    handoffInput,
    "--readme",
    attemptReadmeInput,
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);
  payload = parseStdout(child);
  assert.equal(payload.state.module_phase, "executing");
  assert.equal(payload.state.feature_phase, "awaiting_review");
  assert.equal(readJson(moduleStatusPath).current_action, "awaiting_stage_review:restore-executable-npm-test:research:attempt-001");

  child = runCli([
    "stage",
    "review",
    "--module",
    moduleId,
    "--feature",
    featureId,
    "--stage",
    "research",
    "--attempt",
    "attempt-001",
    "--decision",
    "accept",
    "--next-stage",
    "implementation",
    "--reason",
    "Research is sufficient to proceed to implementation.",
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);
  payload = parseStdout(child);
  assert.equal(payload.state.module_phase, "executing");
  assert.equal(payload.state.feature_phase, "ready_for_stage");

  const finalFeatureStatus = readJson(featureStatusPath);
  const finalModuleStatus = readJson(moduleStatusPath);
  const finalAttemptReadmePath = path.join(moduleRoot, "features", featureId, "stages", "research", "attempt-001", "README.md");
  const finalAttemptReadme = fs.readFileSync(finalAttemptReadmePath, "utf8");

  assert.equal(finalFeatureStatus.phase, "ready_for_stage");
  assert.equal(finalFeatureStatus.next_stage, "implementation");
  assert.equal(finalFeatureStatus.active_attempt_id, null);
  assert.equal(finalFeatureStatus.last_reviewed_attempt_id, "attempt-001");
  assert.equal(finalFeatureStatus.last_decision, "accept");
  assert.equal(finalFeatureStatus.last_decision_reason, "Research is sufficient to proceed to implementation.");
  assert.match(finalFeatureStatus.last_reviewed_handoff_ref, /attempt-001\/handoff\.json$/);
  assert.equal(finalModuleStatus.phase, "executing");
  assert.equal(finalModuleStatus.current_action, "ready_for_stage:restore-executable-npm-test:implementation");
  assert.match(finalAttemptReadme, /## Orchestrator Decision/);
  assert.match(finalAttemptReadme, /Decision: accept/);
  assert.match(finalAttemptReadme, /Next Stage: implementation/);
  assert.equal(fs.existsSync(path.join(moduleRoot, "features", featureId, "stages", "research", "attempt-001", "review.json")), false);
});

test("revise review preserves append-only attempts and allocates attempt-002 on retry", () => {
  const artifactsRoot = createTempArtifactsRoot();
  const moduleId = "avatar-service-test-execution-v2-stage-revise";
  const featureId = "restore-executable-npm-test";

  setupReadyFeature({ artifactsRoot, moduleId, featureId });

  let child = runCli([
    "stage",
    "start",
    "--module",
    moduleId,
    "--feature",
    featureId,
    "--stage",
    "research",
    "--agent",
    "research_codebase",
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);

  const moduleRoot = path.join(artifactsRoot, moduleId);
  const moduleStatusPath = path.join(moduleRoot, "status.json");
  const featureStatusPath = path.join(moduleRoot, "features", featureId, "status.json");
  const featureStatus = readJson(featureStatusPath);
  const attemptId = featureStatus.active_attempt_id;
  const handoffInput = path.join(os.tmpdir(), `${moduleId}-handoff.json`);
  const attemptReadmeInput = path.join(os.tmpdir(), `${moduleId}-attempt-readme.md`);

  fs.writeFileSync(
    handoffInput,
    `${JSON.stringify({
      schema_version: 1,
      module_id: moduleId,
      feature_id: featureId,
      stage: "research",
      attempt_id: attemptId,
      agent_id: "research_codebase",
      result: "complete",
      summary: "Initial research packet is incomplete.",
      evidence_refs: [],
      produced_artifact_refs: [],
      change_requests: ["Tighten runtime evidence"],
      recommended_next_stage: "research",
      created_at: new Date().toISOString()
    }, null, 2)}\n`
  );
  fs.writeFileSync(attemptReadmeInput, "# Research Attempt\n\nNeeds stronger runtime evidence.\n", "utf8");

  child = runCli([
    "stage",
    "submit-handoff",
    "--module",
    moduleId,
    "--feature",
    featureId,
    "--stage",
    "research",
    "--from",
    handoffInput,
    "--readme",
    attemptReadmeInput,
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(readJson(moduleStatusPath).current_action, "awaiting_stage_review:restore-executable-npm-test:research:attempt-001");

  const attemptReadmePath = path.join(moduleRoot, "features", featureId, "stages", "research", "attempt-001", "README.md");
  assert.ok(fs.existsSync(attemptReadmePath));

  child = runCli([
    "stage",
    "review",
    "--module",
    moduleId,
    "--feature",
    featureId,
    "--stage",
    "research",
    "--attempt",
    "attempt-001",
    "--decision",
    "revise",
    "--reason",
    "Research needs another pass with stronger runtime evidence.",
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);

  let nextFeatureStatus = readJson(featureStatusPath);
  assert.equal(nextFeatureStatus.phase, "ready_for_stage");
  assert.equal(nextFeatureStatus.next_stage, "research");
  assert.equal(nextFeatureStatus.active_attempt_id, null);
  assert.equal(nextFeatureStatus.last_reviewed_attempt_id, "attempt-001");
  assert.equal(nextFeatureStatus.last_decision, "revise");
  assert.equal(readJson(moduleStatusPath).current_action, "ready_for_stage:restore-executable-npm-test:research");
  assert.match(fs.readFileSync(attemptReadmePath, "utf8"), /Decision: revise/);

  child = runCli([
    "stage",
    "start",
    "--module",
    moduleId,
    "--feature",
    featureId,
    "--stage",
    "research",
    "--agent",
    "research_codebase",
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(parseStdout(child).state.attempt_id, "attempt-002");

  nextFeatureStatus = readJson(featureStatusPath);
  assert.equal(nextFeatureStatus.active_attempt_id, "attempt-002");
  assert.equal(nextFeatureStatus.latest_attempt_id, "attempt-002");
  assert.ok(fs.existsSync(path.join(moduleRoot, "features", featureId, "stages", "research", "attempt-001", "handoff.json")));
});
