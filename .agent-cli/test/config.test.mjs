import test from "node:test";
import assert from "node:assert/strict";

import { getProjectConfig } from "../src/config.mjs";

test("project config resolves from .agent-cli/config.json", () => {
  assert.deepEqual(getProjectConfig(), {
    artifactsRoot: "artifacts",
    artifactLanguage: "en"
  });
});
