import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { renderRuntimes } from "../src/lib/render-runtimes.mjs";
import { getArtifactPaths, getTargetRequiredOptions } from "../src/paths.mjs";
import { getTargetDefinition } from "../src/targets/index.mjs";
import { validateModule } from "../src/module-validation.mjs";
import { validateArtifacts, validateInput } from "../src/validation.mjs";

const RESEARCH_FIXTURES_ROOT = ".agent-cli/test/fixtures/artifacts";
const MODULE_FIXTURES_ROOT = ".agent-cli/test/fixtures/maestro";

test("research_codebase target remains available", () => {
  assert.equal(getTargetDefinition("research_codebase").id, "research_codebase");
});

test("required options are derived from the research_codebase artifact contract", () => {
  assert.deepEqual(getTargetRequiredOptions("research_codebase"), ["module", "feature"]);
});

test("artifact paths resolve from the research_codebase contract", () => {
  const paths = getArtifactPaths({
    targetId: "research_codebase",
    options: {
      module: "demo-module",
      feature: "demo-feature",
      "artifacts-root": RESEARCH_FIXTURES_ROOT
    }
  });

  assert.equal(
    paths.expectedArtifactPaths.primary_readme,
    ".agent-cli/test/fixtures/artifacts/demo-module/demo-feature/research/README.md"
  );
  assert.equal(
    paths.expectedArtifactPaths.status_json,
    ".agent-cli/test/fixtures/artifacts/demo-module/demo-feature/research/status.json"
  );
});

test("validateInput accepts the research_codebase payload from options", () => {
  const result = validateInput("research_codebase", {
    module: "demo-module",
    feature: "demo-feature",
    task: "Trace login flow"
  });

  assert.equal(result.ok, true);
  assert.equal(result.checks.input_schema_valid, true);
});

test("validateArtifacts passes for a valid research_codebase fixture", () => {
  const result = validateArtifacts("research_codebase", {
    module: "demo-module",
    feature: "demo-feature",
    "artifacts-root": RESEARCH_FIXTURES_ROOT
  });

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.checks.files_exist, true);
  assert.equal(result.checks.status_schema_valid, true);
  assert.equal(result.checks.runtime_trace_valid, true);
  assert.equal(result.checks.artifact_paths_valid, true);
});

test("validateArtifacts fails when research_codebase status artifact paths drift", () => {
  const result = validateArtifacts("research_codebase", {
    module: "broken-module",
    feature: "broken-feature",
    "artifacts-root": RESEARCH_FIXTURES_ROOT
  });

  assert.equal(result.ok, false);
  assert.equal(result.checks.artifact_paths_valid, false);
  assert.match(result.errors.join("\n"), /status\.artifacts\.primary_readme must equal/);
});

test("validateModule passes for a valid review-gate fixture", () => {
  const result = validateModule("module_orchestrator", {
    module: "valid-review-module",
    "artifacts-root": MODULE_FIXTURES_ROOT
  });

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.checks.files_exist, true);
  assert.equal(result.checks.status_schema_valid, true);
  assert.equal(result.checks.runtime_trace_valid, true);
  assert.equal(result.checks.artifact_paths_valid, true);
  assert.equal(result.checks.readme_frontmatter_valid, true);
  assert.equal(result.checks.feature_status_valid, true);
  assert.equal(result.checks.cross_artifact_consistent, true);
});

test("validateModule fails when review-gate research artifacts are missing", () => {
  const result = validateModule("module_orchestrator", {
    module: "broken-review-module",
    "artifacts-root": MODULE_FIXTURES_ROOT
  });

  assert.equal(result.ok, false);
  assert.equal(result.checks.feature_status_valid, false);
  assert.match(result.errors.join("\n"), /feature restore-executable-npm-test research:/);
});

test("resolve-paths works for research_codebase against fixture artifacts", () => {
  const binPath = path.resolve("bin/agent-stack.mjs");
  const child = spawnSync(
    process.execPath,
    [
      binPath,
      "resolve-paths",
      "research_codebase",
      "--module",
      "demo-module",
      "--feature",
      "demo-feature",
      "--artifacts-root",
      RESEARCH_FIXTURES_ROOT,
      "--json"
    ],
    {
      cwd: path.resolve("."),
      encoding: "utf8"
    }
  );

  assert.equal(child.status, 0, child.stderr);
  const payload = JSON.parse(child.stdout);
  assert.equal(payload.command, "resolve-paths");
  assert.equal(payload.target, "research_codebase");
  assert.equal(payload.ok, true);
  assert.equal(
    payload.paths.expected_readme,
    ".agent-cli/test/fixtures/artifacts/demo-module/demo-feature/research/README.md"
  );
});

test("validate-module command works with explicit module_orchestrator target", () => {
  const binPath = path.resolve("bin/agent-stack.mjs");
  const child = spawnSync(
    process.execPath,
    [
      binPath,
      "validate-module",
      "module_orchestrator",
      "--module",
      "valid-review-module",
      "--artifacts-root",
      MODULE_FIXTURES_ROOT,
      "--json"
    ],
    {
      cwd: path.resolve("."),
      encoding: "utf8"
    }
  );

  assert.equal(child.status, 0, child.stderr);
  const payload = JSON.parse(child.stdout);
  assert.equal(payload.command, "validate-module");
  assert.equal(payload.target, "module_orchestrator");
  assert.equal(payload.ok, true);
});

test("renderRuntimes check passes against committed runtime adapters", () => {
  const result = renderRuntimes({ check: true });

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.context.mode, "check");
  assert.equal(result.checks.drift_free, true);
  assert.ok(result.files.includes("AGENTS.md"));
  assert.ok(result.files.includes(".cursor/agents/module_orchestrator.md"));
  assert.ok(result.files.includes(".codex/agents/research_codebase.toml"));
  assert.ok(result.files.includes(".agents/skills/charlie/SKILL.md"));
});

test("renderRuntimes can write generated adapters to an alternate output root", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agent-render-"));
  const result = renderRuntimes({ outputRoot: tempRoot });

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.context.mode, "write");
  assert.equal(result.checks.files_written, true);

  const generatedAgents = fs.readFileSync(path.join(tempRoot, "AGENTS.md"), "utf8");
  const generatedCursorAgent = fs.readFileSync(path.join(tempRoot, ".cursor/agents/module_orchestrator.md"), "utf8");
  const generatedCodexConfig = fs.readFileSync(path.join(tempRoot, ".codex/config.toml"), "utf8");
  const generatedCodexAgent = fs.readFileSync(path.join(tempRoot, ".codex/agents/research_codebase.toml"), "utf8");
  const generatedSkill = fs.readFileSync(path.join(tempRoot, ".agents/skills/charlie/SKILL.md"), "utf8");

  assert.match(generatedAgents, /render-runtimes/);
  assert.match(generatedCursorAgent, /# Cursor adapter for `module_orchestrator`/);
  assert.match(generatedCodexConfig, /model = "gpt-5"/);
  assert.match(generatedCodexConfig, /\[agents\.research_codebase\]/);
  assert.match(generatedCodexConfig, /config_file = "agents\/research_codebase\.toml"/);
  assert.match(generatedCodexAgent, /model = "gpt-5"/);
  assert.match(generatedCodexAgent, /model_reasoning_effort = "medium"/);
  assert.doesNotMatch(generatedCodexAgent, /^name = /m);
  assert.match(generatedSkill, /# Shared skill wrapper for `charlie`/);
});

test("render-runtimes command supports check mode", () => {
  const binPath = path.resolve("bin/agent-stack.mjs");
  const child = spawnSync(
    process.execPath,
    [binPath, "render-runtimes", "--check", "--json"],
    {
      cwd: path.resolve("."),
      encoding: "utf8"
    }
  );

  assert.equal(child.status, 0, child.stderr);
  const payload = JSON.parse(child.stdout);
  assert.equal(payload.command, "render-runtimes");
  assert.equal(payload.target, "runtime_adapters");
  assert.equal(payload.ok, true);
  assert.equal(payload.context.mode, "check");
});
