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

function createTempArtifactsRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "agent-cli-v2-"));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

test("legacy validator-first commands are no longer exposed", () => {
  const child = runCli(["validate-input", "research_codebase", "--json"]);
  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /Unsupported command scope/);
});

test("subcommand help is available without required args", () => {
  let child = runCli(["module", "--help"]);
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /module <subcommand>/);
  assert.match(child.stdout, /submit-for-brief-approval/);

  child = runCli(["module", "init", "--help"]);
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /module init --module <module_id>/);
  assert.doesNotMatch(child.stdout + child.stderr, /Missing required option --module/);
});

test("module lifecycle supports init, return-to-discussion, freeze, seed, and prepare-execution", () => {
  const artifactsRoot = createTempArtifactsRoot();
  const moduleId = "avatar-service-test-execution-v2-module";
  const featureId = "restore-executable-npm-test";

  let child = runCli(["module", "init", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"]);
  assert.equal(child.status, 0, child.stderr);
  let payload = parseStdout(child);
  assert.equal(payload.state.module_phase, "discussion");

  const moduleRoot = path.join(artifactsRoot, moduleId);
  const moduleStatusPath = path.join(moduleRoot, "status.json");
  const briefPath = path.join(moduleRoot, "brief.md");
  assert.equal(fs.existsSync(briefPath), false);
  assert.equal(readJson(moduleStatusPath).phase, "discussion");

  fs.writeFileSync(
    briefPath,
    "# Module Brief\n\n## Goal\n\nRestore executable npm test.\n\n## Proposed Feature Decomposition\n- restore-executable-npm-test\n",
    "utf8"
  );

  child = runCli(["module", "submit-for-brief-approval", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"]);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(parseStdout(child).state.module_phase, "awaiting_owner_brief_approval");

  child = runCli(["module", "return-to-discussion", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"]);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(parseStdout(child).state.module_phase, "discussion");

  child = runCli(["module", "submit-for-brief-approval", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"]);
  assert.equal(child.status, 0, child.stderr);

  child = runCli([
    "module",
    "record-owner-approval",
    "--module",
    moduleId,
    "--approval",
    "brief",
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);

  child = runCli(["module", "freeze-brief", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"]);
  assert.equal(child.status, 0, child.stderr);
  payload = parseStdout(child);
  assert.equal(payload.state.module_phase, "brief_frozen");
  const frozenModuleStatus = readJson(moduleStatusPath);
  assert.equal(frozenModuleStatus.brief.approved, true);
  assert.equal(frozenModuleStatus.brief.frozen, true);

  child = runCli([
    "feature",
    "seed",
    "--module",
    moduleId,
    "--feature",
    featureId,
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);
  payload = parseStdout(child);
  assert.equal(payload.state.feature_phase, "seeded");
  assert.equal(fs.existsSync(path.join(moduleRoot, "features", featureId, "README.md")), false);

  fs.writeFileSync(
    path.join(moduleRoot, "features", featureId, "README.md"),
    `# Feature: ${featureId}\n\nModule: ${moduleId}\n`,
    "utf8"
  );

  child = runCli([
    "feature",
    "set-next-stage",
    "--module",
    moduleId,
    "--feature",
    featureId,
    "--stage",
    "research",
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(parseStdout(child).state.feature_phase, "ready_for_stage");

  child = runCli(["module", "prepare-execution", "--module", moduleId, "--artifacts-root", artifactsRoot, "--json"]);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(parseStdout(child).state.module_phase, "awaiting_owner_execution_approval");

  child = runCli([
    "module",
    "record-owner-approval",
    "--module",
    moduleId,
    "--approval",
    "execution",
    "--artifacts-root",
    artifactsRoot,
    "--json"
  ]);
  assert.equal(child.status, 0, child.stderr);

  const moduleStatus = readJson(moduleStatusPath);
  const featureStatus = readJson(path.join(moduleRoot, "features", featureId, "status.json"));
  const featureReadme = fs.readFileSync(path.join(moduleRoot, "features", featureId, "README.md"), "utf8");

  assert.equal(moduleStatus.phase, "awaiting_owner_execution_approval");
  assert.equal(moduleStatus.owner_approvals.execution, true);
  assert.deepEqual(moduleStatus.features, [featureId]);
  assert.equal(featureStatus.phase, "ready_for_stage");
  assert.equal(featureStatus.next_stage, "research");
  assert.match(featureStatus.readme_path, new RegExp(`${featureId}/README\\.md$`));
  assert.match(featureReadme, new RegExp(featureId));
});
