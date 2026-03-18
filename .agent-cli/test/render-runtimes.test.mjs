import test from "node:test";
import assert from "node:assert/strict";
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

test("render-runtimes --check succeeds when generated adapters are in sync", () => {
  const child = runCli(["render-runtimes", "--check", "--json"]);
  assert.equal(child.status, 0, child.stderr);

  const payload = parseStdout(child);
  assert.equal(payload.command, "render-runtimes");
  assert.equal(payload.state.check, true);
  assert.equal(payload.state.mismatches, 0);
  assert.equal(payload.state.compatibility_mode, "codex_native");
  assert.ok(Array.isArray(payload.files));
  assert.equal(payload.files.length, 0);
});
